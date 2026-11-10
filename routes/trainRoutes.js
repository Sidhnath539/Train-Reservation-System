/**
 * ============================================================================
 * RAILORA - TRAIN & SCHEDULE ROUTES
 * File: routes/trainRoutes.js
 * Description: Handles train searches, station directory, timetables, and availability.
 * Level: Beginner-Friendly / Educational
 * ============================================================================
 * 
 * What this file does:
 * 1. GET /api/trains/stations        -> Lists all railway stations for search dropdowns.
 * 2. GET /api/trains/search          -> Finds trains between two stations on a given date.
 * 3. GET /api/trains/schedule/:num   -> Returns the full timetable & stops for a train.
 * 4. GET /api/trains/:id/availability -> Checks seats (Available vs Waitlist) for a date.
 * 5. GET /api/trains/:id             -> Returns detailed info for a single train.
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { TRAIN_CATALOG, CLASS_CONFIG, calculateSegmentDetails } = require('../config/trainRoutesCatalog');

// ----------------------------------------------------------------------------
// HELPER FUNCTION: Find station by Code, Name, or City
// ----------------------------------------------------------------------------
async function findStation(input) {
  if (!input) return null;
  const text = input.toString().trim();

  // If input is formatted like "New Delhi (NDLS)", extract the code "NDLS"
  const match = text.match(/\(([A-Z]{2,6})\)/i);
  const code = (match ? match[1] : text).toUpperCase();

  // Query database for matching station code, name, or city
  const [rows] = await pool.query(
    `SELECT id, code, name, city, state FROM stations 
     WHERE code = ? OR UPPER(name) = ? OR UPPER(city) = ? OR UPPER(name) LIKE ? OR UPPER(city) LIKE ? 
     ORDER BY (code = ?) DESC, id ASC LIMIT 1`,
    [code, text.toUpperCase(), text.toUpperCase(), `%${text.toUpperCase()}%`, `%${text.toUpperCase()}%`, code]
  );

  return rows.length > 0 ? rows[0] : null;
}

// ----------------------------------------------------------------------------
// ROUTE 1: GET ALL STATIONS (For autocomplete in search bars)
// ----------------------------------------------------------------------------
router.get('/stations', async (req, res) => {
  try {
    // Fetch all stations ordered alphabetically by city and name
    const [stations] = await pool.query(
      'SELECT id, code, name, city, state FROM stations ORDER BY city ASC, name ASC'
    );

    res.json({
      success: true,
      stations
    });
  } catch (error) {
    console.error('Error fetching stations:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve stations directory.'
    });
  }
});

// ----------------------------------------------------------------------------
// ROUTE 2: SEARCH TRAINS BETWEEN TWO STATIONS
// GET /api/trains/search?from=NDLS&to=AGC&date=2026-11-15
// ----------------------------------------------------------------------------
router.get('/search', async (req, res) => {
  try {
    const { from, to, date, class_code, train_type } = req.query;

    // Step 1: Validate required parameters
    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both From (source) and To (destination) stations.'
      });
    }

    const journeyDate = date || new Date().toISOString().split('T')[0];

    // Step 2: Resolve both stations from database
    const sourceStation = await findStation(from);
    const destStation = await findStation(to);

    if (!sourceStation || !destStation) {
      return res.status(404).json({
        success: false,
        message: 'Could not find one or both of the selected stations.'
      });
    }

    const fromCode = sourceStation.code.toUpperCase();
    const toCode = destStation.code.toUpperCase();

    // Step 3: Fetch active trains from database
    const [dbTrains] = await pool.query(
      `SELECT t.id, t.train_number, t.train_name, t.train_type, t.runs_on, t.status,
              t.departure_time, t.arrival_time, t.duration,
              s1.code AS src_code, s1.name AS src_name, s1.city AS src_city,
              s2.code AS dst_code, s2.name AS dst_name, s2.city AS dst_city
       FROM trains t
       JOIN stations s1 ON t.source_station_id = s1.id
       JOIN stations s2 ON t.destination_station_id = s2.id
       WHERE t.status = 'Active'`
    );

    const dbTrainMap = new Map();
    dbTrains.forEach(t => dbTrainMap.set(t.train_number, t));

    const matchedTrainsMap = new Map();

    // Step 4: Check if any route in the Indian Railways Catalog connects these stations
    for (const catalogTrain of TRAIN_CATALOG) {
      let srcIdx = -1;
      let dstIdx = -1;

      for (let i = 0; i < catalogTrain.stops.length; i++) {
        const stopCode = catalogTrain.stops[i].code.toUpperCase();
        if (srcIdx === -1 && stopCode === fromCode) {
          srcIdx = i;
        }
        if (srcIdx !== -1 && i > srcIdx && stopCode === toCode) {
          dstIdx = i;
          break;
        }
      }

      // If both stops were found in sequential order along this train's route
      if (srcIdx !== -1 && dstIdx !== -1) {
        const srcStop = catalogTrain.stops[srcIdx];
        const dstStop = catalogTrain.stops[dstIdx];
        const segment = calculateSegmentDetails(catalogTrain, srcStop, dstStop);

        // Ensure this train exists in the database
        let dbTrain = dbTrainMap.get(catalogTrain.train_number);
        let trainId = dbTrain ? dbTrain.id : null;

        if (!trainId) {
          const [insertResult] = await pool.query(
            `INSERT INTO trains (train_number, train_name, source_station_id, destination_station_id, departure_time, arrival_time, duration, runs_on, train_type, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
            [catalogTrain.train_number, catalogTrain.train_name, sourceStation.id, destStation.id, segment.departure_time, segment.arrival_time, segment.duration, catalogTrain.runs_on, catalogTrain.train_type]
          );
          trainId = insertResult.insertId;
        }

        matchedTrainsMap.set(catalogTrain.train_number, {
          id: trainId,
          train_number: catalogTrain.train_number,
          train_name: catalogTrain.train_name,
          train_type: catalogTrain.train_type,
          runs_on: catalogTrain.runs_on,
          status: 'Active',
          departure_time: segment.departure_time,
          arrival_time: segment.arrival_time,
          duration: segment.duration,
          distance: segment.distance,
          source_code: fromCode,
          source_name: sourceStation.name,
          source_city: sourceStation.city,
          dest_code: toCode,
          dest_name: destStation.name,
          dest_city: destStation.city,
          classes_catalog: segment.classes
        });
      }
    }

    // Step 5: Also include direct database matches
    for (const t of dbTrains) {
      if (t.src_code === fromCode && t.dst_code === toCode && !matchedTrainsMap.has(t.train_number)) {
        matchedTrainsMap.set(t.train_number, {
          id: t.id,
          train_number: t.train_number,
          train_name: t.train_name,
          train_type: t.train_type,
          runs_on: t.runs_on,
          status: t.status,
          departure_time: t.departure_time,
          arrival_time: t.arrival_time,
          duration: t.duration,
          source_code: t.src_code,
          source_name: sourceStation.name,
          source_city: sourceStation.city,
          dest_code: t.dst_code,
          dest_name: destStation.name,
          dest_city: destStation.city
        });
      }
    }

    let allMatched = Array.from(matchedTrainsMap.values());

    // Optional Filter: Filter by Train Type if requested (e.g. Vande Bharat, Rajdhani)
    if (train_type && train_type !== 'ALL') {
      allMatched = allMatched.filter(t => t.train_type.toUpperCase() === train_type.toUpperCase());
    }

    // Step 6: Attach travel classes (1A, 2A, 3A, SL) and seat availability for each train
    const enrichedTrains = await Promise.all(
      allMatched.map(async (train) => {
        let classesToOffer = train.classes_catalog;

        // If not in catalog segment, query from database
        if (!classesToOffer || classesToOffer.length === 0) {
          const [dbClasses] = await pool.query(
            'SELECT class_code, class_name, total_seats, base_fare FROM train_classes WHERE train_id = ?',
            [train.id]
          );
          classesToOffer = dbClasses.map(c => ({
            class_code: c.class_code,
            class_name: c.class_name,
            total_seats: c.total_seats,
            base_fare: parseFloat(c.base_fare)
          }));
        }

        // Apply class_code filter if requested (e.g. only 3A)
        if (class_code && class_code !== 'ALL') {
          classesToOffer = classesToOffer.filter(c => c.class_code === class_code);
        }

        // Default fallback classes if none defined
        if (classesToOffer.length === 0) {
          classesToOffer = [
            { class_code: '3A', class_name: 'AC 3 Tier (3A)', total_seats: 64, base_fare: 850 },
            { class_code: 'SL', class_name: 'Sleeper Class (SL)', total_seats: 72, base_fare: 280 }
          ];
        }

        // Check seat availability in train_schedule_seats for this journey date
        const classesWithAvailability = await Promise.all(
          classesToOffer.map(async (cls) => {
            const [schedule] = await pool.query(
              'SELECT available_seats, waiting_seats FROM train_schedule_seats WHERE train_id = ? AND class_code = ? AND journey_date = ? LIMIT 1',
              [train.id, cls.class_code, journeyDate]
            );

            let availableSeats = cls.total_seats;
            let waitingSeats = 0;

            if (schedule.length > 0) {
              availableSeats = schedule[0].available_seats;
              waitingSeats = schedule[0].waiting_seats;
            } else {
              // Auto-initialize seats for this date if it's the first time being searched
              availableSeats = Math.max(15, cls.total_seats - 8);
              await pool.query(
                `INSERT IGNORE INTO train_schedule_seats (train_id, class_code, journey_date, available_seats, waiting_seats)
                 VALUES (?, ?, ?, ?, 0)`,
                [train.id, cls.class_code, journeyDate, availableSeats]
              );
            }

            return {
              class_code: cls.class_code,
              class_name: cls.class_name,
              base_fare: parseFloat(cls.base_fare),
              total_seats: cls.total_seats,
              available_seats: availableSeats,
              waiting_seats: waitingSeats,
              status_label: availableSeats > 0 ? `AVL ${availableSeats}` : (waitingSeats > 0 ? `WL ${waitingSeats}` : 'WL 1'),
              is_available: availableSeats > 0
            };
          })
        );

        delete train.classes_catalog;

        return {
          ...train,
          classes: classesWithAvailability
        };
      })
    );

    // Keep trains that have at least one class
    const finalTrains = enrichedTrains.filter(t => t.classes.length > 0);

    // Sort trains by departure time
    finalTrains.sort((a, b) => a.departure_time.localeCompare(b.departure_time));

    res.json({
      success: true,
      query: {
        source: sourceStation,
        destination: destStation,
        journeyDate,
        quota: req.query.quota || 'GENERAL'
      },
      count: finalTrains.length,
      trains: finalTrains
    });
  } catch (error) {
    console.error('Search trains error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to search trains. Please try again.'
    });
  }
});

// ----------------------------------------------------------------------------
// ROUTE 3: GET FULL TIMETABLE / SCHEDULE FOR A TRAIN
// GET /api/trains/schedule/:trainNumber
// ----------------------------------------------------------------------------
router.get('/schedule/:trainNumber', async (req, res) => {
  try {
    const trainNumber = (req.params.trainNumber || '').trim();

    if (!trainNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a train number.'
      });
    }

    // 1. Look for train in the comprehensive catalog
    const catalogTrain = TRAIN_CATALOG.find(t => t.train_number === trainNumber);

    if (catalogTrain) {
      const stopCodes = catalogTrain.stops.map(s => s.code);
      const [stationRows] = await pool.query(
        'SELECT code, name, city, state FROM stations WHERE code IN (?)',
        [stopCodes]
      );
      const stationMap = new Map();
      stationRows.forEach(st => stationMap.set(st.code, st));

      const route = catalogTrain.stops.map((stop, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === catalogTrain.stops.length - 1;
        const st = stationMap.get(stop.code) || { name: `${stop.code} Junction`, city: stop.code };

        return {
          station_name: st.name,
          station_code: stop.code,
          arrival_time: isFirst ? 'Source' : (stop.arr ? `${stop.arr}:00` : '--:--'),
          departure_time: isLast ? 'Destination' : (stop.dep ? `${stop.dep}:00` : '--:--'),
          halt_time: isFirst || isLast ? '--' : '2 min',
          day: stop.day || 1,
          distance_from_source: stop.dist !== undefined ? stop.dist : (idx * 60),
          platform_number: ((idx % 3) + 1).toString(),
          stop: true
        };
      });

      return res.json({
        success: true,
        data: {
          train_number: catalogTrain.train_number,
          train_name: catalogTrain.train_name,
          train_type: catalogTrain.train_type,
          runs_on: catalogTrain.runs_on,
          route
        }
      });
    }

    // 2. Fallback: Query from database trains table
    const [dbTrains] = await pool.query(
      `SELECT t.*, 
              s1.code AS src_code, s1.name AS src_name,
              s2.code AS dst_code, s2.name AS dst_name
       FROM trains t
       JOIN stations s1 ON t.source_station_id = s1.id
       JOIN stations s2 ON t.destination_station_id = s2.id
       WHERE t.train_number = ? LIMIT 1`,
      [trainNumber]
    );

    if (dbTrains.length > 0) {
      const t = dbTrains[0];
      return res.json({
        success: true,
        data: {
          train_number: t.train_number,
          train_name: t.train_name,
          train_type: t.train_type,
          runs_on: t.runs_on,
          route: [
            {
              station_name: t.src_name,
              station_code: t.src_code,
              arrival_time: 'Source',
              departure_time: t.departure_time,
              halt_time: '--',
              day: 1,
              distance_from_source: 0,
              platform_number: '1'
            },
            {
              station_name: t.dst_name,
              station_code: t.dst_code,
              arrival_time: t.arrival_time,
              departure_time: 'Destination',
              halt_time: '--',
              day: 1,
              distance_from_source: 450,
              platform_number: '1'
            }
          ]
        }
      });
    }

    return res.status(404).json({
      success: false,
      message: `Train number ${trainNumber} not found.`
    });
  } catch (error) {
    console.error('Error fetching schedule:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve train timetable.'
    });
  }
});

// Also support alias GET /api/trains/:trainNumber/schedule
router.get('/:trainNumber/schedule', (req, res, next) => {
  req.url = `/schedule/${req.params.trainNumber}`;
  router.handle(req, res, next);
});

// ----------------------------------------------------------------------------
// ROUTE 4: CHECK SEAT AVAILABILITY & FARE FOR A SPECIFIC TRAIN
// GET /api/trains/:id/availability?date=2026-11-15&class_code=3A&passengers=2
// ----------------------------------------------------------------------------
router.get('/:id/availability', async (req, res) => {
  try {
    const trainId = parseInt(req.params.id, 10);
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const targetClassCode = req.query.class_code ? req.query.class_code.toUpperCase() : null;
    const passengerCount = Math.max(1, Math.min(6, parseInt(req.query.passengers, 10) || 1));
    const quota = req.query.quota || 'GENERAL';

    // 1. Fetch train details
    const [trains] = await pool.query(
      `SELECT t.*, 
              s1.code AS source_code, s1.city AS source_city,
              s2.code AS dest_code, s2.city AS dest_city
       FROM trains t
       JOIN stations s1 ON t.source_station_id = s1.id
       JOIN stations s2 ON t.destination_station_id = s2.id
       WHERE t.id = ? LIMIT 1`,
      [trainId]
    );

    if (trains.length === 0) {
      return res.status(404).json({ success: false, message: 'Train not found.' });
    }

    const train = trains[0];

    // 2. Fetch classes for this train
    const [classes] = await pool.query(
      'SELECT id, class_code, class_name, total_seats, base_fare FROM train_classes WHERE train_id = ? ORDER BY base_fare DESC',
      [trainId]
    );

    if (classes.length === 0) {
      return res.status(404).json({ success: false, message: 'No classes found for this train.' });
    }

    // 3. Check seat count for each class on this journey date
    const classesAvailability = await Promise.all(
      classes.map(async (cls) => {
        const [sched] = await pool.query(
          'SELECT available_seats, waiting_seats FROM train_schedule_seats WHERE train_id = ? AND class_code = ? AND journey_date = ? LIMIT 1',
          [trainId, cls.class_code, date]
        );

        let available = cls.total_seats;
        let waiting = 0;
        if (sched.length > 0) {
          available = sched[0].available_seats;
          waiting = sched[0].waiting_seats;
        }

        const isAvailable = available > 0;
        return {
          id: cls.id,
          class_code: cls.class_code,
          class_name: cls.class_name,
          total_seats: cls.total_seats,
          base_fare: parseFloat(cls.base_fare),
          available_seats: available,
          waiting_seats: waiting,
          is_available: isAvailable,
          status_label: isAvailable ? `AVL ${available}` : (waiting > 0 ? `WL ${waiting}` : 'WL 1'),
          status_badge_class: isAvailable ? 'badge-cnf' : 'badge-wl'
        };
      })
    );

    // Pick target class or first class
    const currentClass = classesAvailability.find(c => c.class_code === targetClassCode) || classesAvailability[0];

    // Evaluate passenger status
    const isCnf = currentClass.available_seats >= passengerCount;
    const passengerStatus = isCnf ? 'CONFIRMED' : 'WAITLISTED';
    const passengerMessage = isCnf 
      ? `All ${passengerCount} passenger(s) will receive confirmed berths (CNF).` 
      : `No confirmed berths left. Your ticket will be waitlisted (WL).`;

    // Calculate fare estimate
    const subtotal = currentClass.base_fare * passengerCount;
    const isAC = ['1A', '2A', '3A', 'CC', 'EC'].includes(currentClass.class_code);
    const gst = isAC ? subtotal * 0.05 : 0;
    const serviceFee = 15.00;
    const totalFare = parseFloat((subtotal + gst + serviceFee).toFixed(2));

    res.json({
      success: true,
      train: {
        id: train.id,
        train_number: train.train_number,
        train_name: train.train_name,
        source: `${train.source_city} (${train.source_code})`,
        destination: `${train.dest_city} (${train.dest_code})`,
        departure_time: train.departure_time,
        arrival_time: train.arrival_time,
        duration: train.duration
      },
      selected: {
        date,
        quota,
        passenger_count: passengerCount,
        class_code: currentClass.class_code,
        class_name: currentClass.class_name,
        base_fare: currentClass.base_fare,
        available_seats: currentClass.available_seats,
        waiting_seats: currentClass.waiting_seats,
        is_available: currentClass.is_available,
        status_label: currentClass.status_label,
        passenger_status: passengerStatus,
        passenger_message: passengerMessage,
        badge_class: isCnf ? 'badge-cnf' : 'badge-wl',
        fare_estimate: {
          subtotal,
          gst,
          service_fee: serviceFee,
          total_fare: totalFare
        }
      },
      all_classes: classesAvailability
    });
  } catch (error) {
    console.error('Error checking availability:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to verify seat availability.'
    });
  }
});

// ----------------------------------------------------------------------------
// ROUTE 5: GET DETAILS FOR A SINGLE TRAIN
// GET /api/trains/:id
// ----------------------------------------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const trainId = parseInt(req.params.id, 10);
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const [trains] = await pool.query(
      `SELECT t.*, 
              s1.code AS source_code, s1.name AS source_name, s1.city AS source_city,
              s2.code AS dest_code, s2.name AS dest_name, s2.city AS dest_city
       FROM trains t
       JOIN stations s1 ON t.source_station_id = s1.id
       JOIN stations s2 ON t.destination_station_id = s2.id
       WHERE t.id = ? LIMIT 1`,
      [trainId]
    );

    if (trains.length === 0) {
      return res.status(404).json({ success: false, message: 'Train not found.' });
    }

    const train = trains[0];

    // Fetch classes configured for this train
    const [classes] = await pool.query(
      'SELECT id, class_code, class_name, total_seats, base_fare FROM train_classes WHERE train_id = ? ORDER BY base_fare DESC',
      [trainId]
    );

    res.json({
      success: true,
      train: {
        ...train,
        classes: classes.map(c => ({
          ...c,
          base_fare: parseFloat(c.base_fare),
          available_seats: c.total_seats,
          is_available: true
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching train details:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve train details.'
    });
  }
});

module.exports = router;
