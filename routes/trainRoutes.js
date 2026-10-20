const express = require('express');
const router = express.Router();
const { pool } = require('../db');

/**
 * Get all railway stations for search autocomplete
 * GET /api/trains/stations
 */
router.get('/stations', async (req, res) => {
  try {
    const [stations] = await pool.query(
      'SELECT id, code, name, city, state FROM stations ORDER BY city ASC, name ASC'
    );
    res.json({
      success: true,
      stations
    });
  } catch (error) {
    console.error('Fetch stations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve station directory.'
    });
  }
});

/**
 * Search trains by source, destination, and travel date
 * GET /api/trains/search?from=NDLS&to=BCT&date=2026-10-25
 */
router.get('/search', async (req, res) => {
  try {
    const { from, to, date, class_code, train_type } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: 'Both source and destination stations are required.'
      });
    }

    const journeyDate = date || new Date().toISOString().split('T')[0];

    // Helper to find station by code, name, city, or combined 'Name (CODE)' string
    const findStation = async (param) => {
      if (!param) return null;
      const str = param.toString().trim();

      // Check if string contains station code in parentheses e.g. "New Delhi (NDLS)"
      const parenMatch = str.match(/\(([A-Z]{2,6})\)/i);
      // Check if string contains "CODE - Name" or "Name - CODE"
      const dashMatch = str.match(/\b([A-Z]{2,6})\s*-\s*/i) || str.match(/-\s*([A-Z]{2,6})\b/i);
      const extractedCode = parenMatch ? parenMatch[1].toUpperCase() : (dashMatch ? dashMatch[1].toUpperCase() : str.toUpperCase());

      const [rows] = await pool.query(
        `SELECT id, code, name, city FROM stations 
         WHERE code = ? 
            OR code = ? 
            OR UPPER(name) = ?
            OR UPPER(city) = ?
            OR UPPER(name) LIKE ?
            OR UPPER(city) LIKE ?
            OR id = ?
         ORDER BY 
           (code = ?) DESC,
           (code = ?) DESC,
           (UPPER(name) = ?) DESC,
           (UPPER(city) = ?) DESC,
           id ASC
         LIMIT 1`,
        [
          extractedCode,
          str.toUpperCase(),
          str.toUpperCase(),
          str.toUpperCase(),
          `%${str.toUpperCase()}%`,
          `%${str.toUpperCase()}%`,
          isNaN(str) ? -1 : parseInt(str, 10),
          extractedCode,
          str.toUpperCase(),
          str.toUpperCase(),
          str.toUpperCase()
        ]
      );
      return rows[0] || null;
    };

    const sourceStation = await findStation(from);
    const destStation = await findStation(to);

    if (!sourceStation || !destStation) {
      return res.status(404).json({
        success: false,
        message: 'One or both stations could not be found.'
      });
    }

// Route sequences for intermediate station matching
const TRAIN_ROUTE_DEFINITIONS = {
  '12302': ['NDLS', 'CNB', 'PRYJ', 'DDU', 'GAYA', 'DHN', 'ASN', 'HWH'],
  '12301': ['HWH', 'ASN', 'DHN', 'GAYA', 'DDU', 'PRYJ', 'CNB', 'NDLS'],
  '12952': ['NDLS', 'KOTA', 'BRC', 'ST', 'BVI', 'BCT'],
  '12951': ['BCT', 'BVI', 'ST', 'BRC', 'KOTA', 'NDLS'],
  '22436': ['NDLS', 'CNB', 'PRYJ', 'BSB'],
  '22435': ['BSB', 'PRYJ', 'CNB', 'NDLS'],
  '12004': ['NDLS', 'GZB', 'ALJN', 'TDL', 'CNB', 'LKO'],
  '12003': ['LKO', 'CNB', 'TDL', 'ALJN', 'GZB', 'NDLS'],
  '20901': ['BCT', 'BVI', 'VAPI', 'ST', 'BRC', 'ADI'],
  '12051': ['CSMT', 'TNA', 'PNVL', 'RN', 'KKW', 'MAO'],
  '12245': ['HWH', 'KGP', 'BBS', 'VSKP', 'BZA', 'RU', 'SBC'],
  '12393': ['PNBE', 'ARA', 'BXR', 'DDU', 'CNB', 'NDLS']
};

const liveStatusCache = new Map();

/**
 * Fetch live on-time performance from RailRadar API
 */
async function getLiveStatusForTrain(trainNumber) {
  const cached = liveStatusCache.get(trainNumber);
  if (cached && (Date.now() - cached.timestamp < 45000)) {
    return cached.data;
  }

  const apiKey = process.env.RAILRADAR_API_KEY || 'rg_9f5e97a51a2f4ff8abf656d0fee60439';
  const baseUrl = process.env.RAILRADAR_BASE_URL || 'https://railradar.in/api/v1';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${baseUrl}/trains/${encodeURIComponent(trainNumber)}/live`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        const delay = d.delayMinutes || (d.currentLocation ? d.currentLocation.delayMinutes : 0) || 0;
        const info = {
          live_status: delay === 0 ? 'Right Time' : `Delayed by ${delay} min`,
          live_delay_minutes: delay,
          live_current_station: d.currentLocation ? `${d.currentLocation.stationName} (${d.currentLocation.stationCode})` : 'In Transit'
        };
        liveStatusCache.set(trainNumber, { timestamp: Date.now(), data: info });
        return info;
      }
    }
  } catch (err) {
    // Fail silently to fallback
  }

  const fallback = {
    live_status: 'Right Time',
    live_delay_minutes: 0,
    live_current_station: 'On Schedule'
  };
  liveStatusCache.set(trainNumber, { timestamp: Date.now(), data: fallback });
  return fallback;
}

    // Search trains matching route (both direct terminus & intermediate route halts)
    let trainQuery = `
      SELECT 
        t.id,
        t.train_number,
        t.train_name,
        t.departure_time,
        t.arrival_time,
        t.duration,
        t.runs_on,
        t.train_type,
        t.status,
        s1.code AS source_code,
        s1.name AS source_name,
        s1.city AS source_city,
        s2.code AS dest_code,
        s2.name AS dest_name,
        s2.city AS dest_city
      FROM trains t
      JOIN stations s1 ON t.source_station_id = s1.id
      JOIN stations s2 ON t.destination_station_id = s2.id
      WHERE t.status = 'Active'
    `;

    const queryParams = [];

    if (train_type && train_type !== 'ALL') {
      trainQuery += ' AND t.train_type = ?';
      queryParams.push(train_type);
    }

    trainQuery += ' ORDER BY t.departure_time ASC';

    const [allActiveTrains] = await pool.query(trainQuery, queryParams);

    // Filter trains that either have direct source/dest or intermediate halt match
    const matchingTrains = allActiveTrains.filter(train => {
      // 1. Direct match
      if (train.source_code === sourceStation.code && train.dest_code === destStation.code) {
        return true;
      }

      // 2. Intermediate halt sequence match
      const route = TRAIN_ROUTE_DEFINITIONS[train.train_number];
      if (route) {
        const srcIdx = route.indexOf(sourceStation.code);
        const dstIdx = route.indexOf(destStation.code);
        if (srcIdx !== -1 && dstIdx !== -1 && srcIdx < dstIdx) {
          return true;
        }
      }
      return false;
    });

    // Fetch classes, availability, and live RailRadar status for each train
    const enrichedTrains = await Promise.all(
      matchingTrains.map(async (train) => {
        // Query live RailRadar status
        const liveStatus = await getLiveStatusForTrain(train.train_number);

        // Fetch classes configured for this train
        let classSql = 'SELECT id, class_code, class_name, total_seats, base_fare FROM train_classes WHERE train_id = ?';
        const classParams = [train.id];

        if (class_code && class_code !== 'ALL') {
          classSql += ' AND class_code = ?';
          classParams.push(class_code);
        }

        const [classes] = await pool.query(classSql, classParams);

        // For each class, query or initialize seat availability for this journey date
        const classesWithAvailability = await Promise.all(
          classes.map(async (cls) => {
            const [schedule] = await pool.query(
              'SELECT available_seats, waiting_seats FROM train_schedule_seats WHERE train_id = ? AND class_code = ? AND journey_date = ? LIMIT 1',
              [train.id, cls.class_code, journeyDate]
            );

            let availableSeats = cls.total_seats;
            let waitingSeats = 0;

            if (schedule.length > 0) {
              availableSeats = schedule[0].available_seats;
              waitingSeats = schedule[0].waiting_seats;
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

        return {
          ...train,
          live_status: liveStatus.live_status,
          live_delay_minutes: liveStatus.live_delay_minutes,
          live_current_station: liveStatus.live_current_station,
          classes: classesWithAvailability
        };
      })
    );

    res.json({
      success: true,
      query: {
        source: sourceStation,
        destination: destStation,
        journeyDate,
        quota: req.query.quota || 'GENERAL'
      },
      count: enrichedTrains.length,
      trains: enrichedTrains
    });
  } catch (error) {
    console.error('Search trains error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search trains.'
    });
  }
});

/**
 * Check real-time seat availability for a specific train, class, date, and passenger count
 * GET /api/trains/:id/availability?class_code=3A&date=2026-10-25&passengers=2&quota=GENERAL
 */
router.get('/:id/availability', async (req, res) => {
  try {
    const trainId = parseInt(req.params.id, 10);
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const targetClassCode = req.query.class_code ? req.query.class_code.toUpperCase() : null;
    const passengerCount = Math.max(1, Math.min(6, parseInt(req.query.passengers, 10) || 1));
    const quota = req.query.quota || 'GENERAL';

    if (isNaN(trainId)) {
      return res.status(400).json({ success: false, message: 'Invalid train ID.' });
    }

    const [trains] = await pool.query(
      `SELECT 
        t.*,
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

    if (classes.length === 0) {
      return res.status(404).json({ success: false, message: 'No classes configured for this train.' });
    }

    // Availability for all classes on this date
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
        const statusLabel = isAvailable ? `AVL ${available}` : (waiting > 0 ? `WL ${waiting}` : 'WL 1');

        return {
          id: cls.id,
          class_code: cls.class_code,
          class_name: cls.class_name,
          total_seats: cls.total_seats,
          base_fare: parseFloat(cls.base_fare),
          available_seats: available,
          waiting_seats: waiting,
          is_available: isAvailable,
          status_label: statusLabel,
          status_badge_class: isAvailable ? 'badge-cnf' : 'badge-wl'
        };
      })
    );

    // Selected class check
    const currentClass = classesAvailability.find(c => c.class_code === targetClassCode) || classesAvailability[0];

    // Evaluate passenger count against available seats
    let passengerStatus = 'CONFIRMED';
    let passengerMessage = '';
    let confirmationChance = 'High (98%)';
    let badgeClass = 'badge-cnf';

    if (currentClass.available_seats >= passengerCount) {
      passengerStatus = 'CONFIRMED';
      passengerMessage = `All ${passengerCount} passenger${passengerCount > 1 ? 's' : ''} will get confirmed berths (CNF).`;
      confirmationChance = '100% Guaranteed Berth';
      badgeClass = 'badge-cnf';
    } else if (currentClass.available_seats > 0) {
      passengerStatus = 'PARTIAL_WAITLIST';
      passengerMessage = `Only ${currentClass.available_seats} confirmed berth${currentClass.available_seats > 1 ? 's' : ''} left! The remaining ${passengerCount - currentClass.available_seats} passenger(s) will be waitlisted.`;
      confirmationChance = 'Partial Confirmation';
      badgeClass = 'badge-rac';
    } else {
      passengerStatus = 'WAITLISTED';
      const startWl = currentClass.waiting_seats + 1;
      const endWl = currentClass.waiting_seats + passengerCount;
      passengerMessage = passengerCount === 1 
        ? `No confirmed berths left. Your ticket will be WAITLISTED at WL ${startWl}.`
        : `No confirmed berths left. Your tickets will be WAITLISTED from WL ${startWl} to WL ${endWl}.`;
      confirmationChance = currentClass.waiting_seats < 15 ? 'High (85% chance of clearance)' : (currentClass.waiting_seats < 35 ? 'Medium (55% chance)' : 'Low (<35% chance)');
      badgeClass = 'badge-wl';
    }

    // 6-day upcoming availability calendar for selected class
    const upcomingCalendar = [];
    const dateParts = date.split('-').map(Number);
    const startYear = dateParts[0];
    const startMonth = dateParts[1] - 1;
    const startDay = dateParts[2];
    
    for (let i = 0; i < 6; i++) {
      const d = new Date(Date.UTC(startYear, startMonth, startDay + i));
      const dStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
      const dayMonth = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', timeZone: 'UTC' });

      const [sched] = await pool.query(
        'SELECT available_seats, waiting_seats FROM train_schedule_seats WHERE train_id = ? AND class_code = ? AND journey_date = ? LIMIT 1',
        [trainId, currentClass.class_code, dStr]
      );

      let avail = currentClass.total_seats;
      let wait = 0;
      if (sched.length > 0) {
        avail = sched[0].available_seats;
        wait = sched[0].waiting_seats;
      }

      upcomingCalendar.push({
        date: dStr,
        day_name: dayName,
        display_date: dayMonth,
        available_seats: avail,
        waiting_seats: wait,
        status_label: avail > 0 ? `AVL ${avail}` : (wait > 0 ? `WL ${wait}` : 'WL 1'),
        is_available: avail > 0,
        is_selected: dStr === date
      });
    }

    // Calculate fare estimate
    const subtotal = currentClass.base_fare * passengerCount;
    const isAC = ['1A', '2A', '3A', 'CC', 'EC'].includes(currentClass.class_code);
    const gst = isAC ? subtotal * 0.05 : 0;
    const serviceFee = 15.00;
    const totalFare = parseFloat((subtotal + gst + serviceFee).toFixed(2));

    res.json({
      success: true,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
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
        total_seats: currentClass.total_seats,
        available_seats: currentClass.available_seats,
        waiting_seats: currentClass.waiting_seats,
        is_available: currentClass.is_available,
        status_label: currentClass.status_label,
        passenger_status: passengerStatus,
        passenger_message: passengerMessage,
        confirmation_chance: confirmationChance,
        badge_class: badgeClass,
        fare_estimate: {
          subtotal,
          gst,
          service_fee: serviceFee,
          total_fare: totalFare
        }
      },
      all_classes: classesAvailability,
      calendar: upcomingCalendar
    });
  } catch (error) {
    console.error('Check seat availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify seat availability.'
    });
  }
});

/**
 * Get detailed information for a specific train
 * GET /api/trains/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const trainId = parseInt(req.params.id, 10);
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const [trains] = await pool.query(
      `SELECT 
        t.*,
        s1.code AS source_code, s1.name AS source_name, s1.city AS source_city,
        s2.code AS dest_code, s2.name AS dest_name, s2.city AS dest_city
      FROM trains t
      JOIN stations s1 ON t.source_station_id = s1.id
      JOIN stations s2 ON t.destination_station_id = s2.id
      WHERE t.id = ? LIMIT 1`,
      [trainId]
    );

    if (trains.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Train not found.'
      });
    }

    const train = trains[0];

    // Fetch classes
    const [classes] = await pool.query(
      'SELECT id, class_code, class_name, total_seats, base_fare FROM train_classes WHERE train_id = ? ORDER BY base_fare DESC',
      [trainId]
    );

    // Fetch seat availability for date
    const classesWithAvailability = await Promise.all(
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

        return {
          ...cls,
          base_fare: parseFloat(cls.base_fare),
          available_seats: available,
          waiting_seats: waiting,
          is_available: available > 0
        };
      })
    );

    res.json({
      success: true,
      train: {
        ...train,
        classes: classesWithAvailability
      }
    });
  } catch (error) {
    console.error('Fetch train error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve train details.'
    });
  }
});

module.exports = router;
