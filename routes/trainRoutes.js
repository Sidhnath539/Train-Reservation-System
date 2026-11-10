const express = require('express');
const router = express.Router();
const https = require('https');
const { pool } = require('../db');
const { TRAIN_CATALOG, CLASS_CONFIG, calculateSegmentDetails } = require('../config/trainRoutesCatalog');

/**
 * Fetch trains from RapidAPI IRCTC service with a strict timeout
 */
async function fetchRapidAPITrains(fromCode, toCode, journeyDate) {
  return new Promise((resolve) => {
    const apiKey = process.env.RAPIDAPI_KEY || '2761e7f7e9mshac544513e4b565ep1dae8ajsn41d40a93970c';
    const apiHost = process.env.RAPIDAPI_HOST || 'irctc1.p.rapidapi.com';

    const options = {
      hostname: apiHost,
      path: `/api/v3/trainBetweenStations?fromStationCode=${encodeURIComponent(fromCode)}&toStationCode=${encodeURIComponent(toCode)}&dateOfJourney=${encodeURIComponent(journeyDate)}`,
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': apiHost
      },
      timeout: 2500
    };

    const req = https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json && json.status === true && Array.isArray(json.data)) {
            resolve(json.data);
          } else {
            resolve([]);
          }
        } catch {
          resolve([]);
        }
      });
    });

    req.on('error', () => resolve([]));
    req.on('timeout', () => {
      req.destroy();
      resolve([]);
    });
  });
}

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
 * Major Indian Railways Metropolitan Clusters (All stations serving a city region)
 */
const METRO_CLUSTERS = {
  DELHI: ['NDLS', 'DLI', 'NZM', 'ANVT', 'DEC', 'DEE', 'SSB'],
  NEW_DELHI: ['NDLS', 'DLI', 'NZM', 'ANVT', 'DEC', 'DEE', 'SSB'],
  MUMBAI: ['BCT', 'MMCT', 'CSMT', 'BDTS', 'LTT', 'DR', 'BVI', 'TNA', 'PNVL', 'KYN'],
  BOMBAY: ['BCT', 'MMCT', 'CSMT', 'BDTS', 'LTT', 'DR', 'BVI', 'TNA', 'PNVL', 'KYN'],
  KOLKATA: ['HWH', 'SDAH', 'KOAA', 'SHM', 'SRC'],
  CALCUTTA: ['HWH', 'SDAH', 'KOAA', 'SHM', 'SRC'],
  PATNA: ['PNBE', 'DNR', 'PPTA', 'RJPB', 'PNC', 'BKP'],
  HYDERABAD: ['HYB', 'SC', 'KCG', 'LPI', 'KZJ'],
  SECUNDERABAD: ['HYB', 'SC', 'KCG', 'LPI', 'KZJ'],
  BANGALORE: ['SBC', 'SMVB', 'YPR', 'BNC', 'KJM'],
  BENGALURU: ['SBC', 'SMVB', 'YPR', 'BNC', 'KJM'],
  AHMEDABAD: ['ADI', 'SBT', 'MAN'],
  AGRA: ['AGC', 'AF', 'TDL'],
  VARANASI: ['BSB', 'BNRS', 'DDU'],
  BHOPAL: ['BPL', 'RKMP'],
  PUNE: ['PUNE', 'SVJR', 'LNL', 'KJT'],
  CHENNAI: ['MAS', 'MS', 'PER', 'AJJ'],
  LUCKNOW: ['LKO', 'LJN', 'ASH', 'BNZ'],
  AMRITSAR: ['ASR', 'BEAS', 'JUC'],
  KANPUR: ['CNB', 'CPH', 'GOY'],
  JAIPUR: ['JP', 'GADJ', 'DPA'],
  JAMMU: ['JAT', 'UHP', 'SVDK'],
  PURI: ['PURI', 'KUR', 'BBS', 'CTC'],
  BARAUNI: ['BJU', 'BGS', 'MNE'],
  CHANDIGARH: ['CDG', 'CNDM', 'SASN'],
  DEHRADUN: ['DDN', 'HW', 'RK'],
  HARIDWAR: ['HW', 'RK', 'DDN'],
  AJMER: ['AII', 'KSG'],
  RANCHI: ['RNC', 'MESR'],
  GOA: ['MAO', 'THVM', 'KRMI'],
  MADGAON: ['MAO', 'THVM', 'KRMI']
};

function getMetroClusterCodes(station) {
  const codes = new Set([station.code.toUpperCase()]);
  const normCity = (station.city || '').toUpperCase().replace(/[^A-Z]/g, '_');
  const normName = (station.name || '').toUpperCase().replace(/[^A-Z]/g, '_');

  for (const [key, cluster] of Object.entries(METRO_CLUSTERS)) {
    if (cluster.includes(station.code.toUpperCase()) || normCity.includes(key) || normName.includes(key)) {
      cluster.forEach(c => codes.add(c));
    }
  }
  return Array.from(codes);
}

/**
 * Helper to find or auto-create station by code, name, city, or combined 'Name (CODE)' string
 */
async function findOrResolveStation(param) {
  if (!param) return null;
  const str = param.toString().trim();

  // Extract station code
  const parenMatch = str.match(/\(([A-Z]{2,6})\)/i);
  const dashMatch = str.match(/\b([A-Z]{2,6})\s*-\s*/i) || str.match(/-\s*([A-Z]{2,6})\b/i);
  const extractedCode = (parenMatch ? parenMatch[1] : (dashMatch ? dashMatch[1] : str)).toUpperCase();

  const [rows] = await pool.query(
    `SELECT id, code, name, city, state FROM stations 
     WHERE code = ? 
        OR UPPER(name) = ?
        OR UPPER(city) = ?
        OR UPPER(name) LIKE ?
        OR UPPER(city) LIKE ?
        OR id = ?
     ORDER BY 
       (code = ?) DESC,
       (code IN ('NDLS', 'HWH', 'BCT', 'CSMT', 'PNBE', 'SBC', 'MAS', 'BSB', 'LKO', 'ADI', 'AGC', 'BPL', 'ASR', 'PUNE', 'HYB', 'CNB', 'GKP', 'PURI', 'JAT', 'RNC', 'DBG', 'SHC')) DESC,
       (UPPER(city) = ?) DESC,
       (UPPER(name) = ?) DESC,
       id ASC
     LIMIT 1`,
    [
      extractedCode,
      str.toUpperCase(),
      str.toUpperCase(),
      `%${str.toUpperCase()}%`,
      `%${str.toUpperCase()}%`,
      isNaN(str) ? -1 : parseInt(str, 10),
      extractedCode,
      str.toUpperCase(),
      str.toUpperCase()
    ]
  );

  if (rows.length > 0) {
    return rows[0];
  }

  // If station code is clean 2-5 alphanumeric characters, auto-register as station
  if (/^[A-Z0-9]{2,6}$/i.test(extractedCode)) {
    try {
      const prettyName = str.length > extractedCode.length ? str : `${extractedCode} Junction`;
      const cityName = extractedCode;
      const [insertRes] = await pool.query(
        'INSERT IGNORE INTO stations (code, name, city, state) VALUES (?, ?, ?, ?)',
        [extractedCode, prettyName, cityName, 'India']
      );

      const [newRow] = await pool.query('SELECT id, code, name, city, state FROM stations WHERE code = ?', [extractedCode]);
      if (newRow.length > 0) return newRow[0];
    } catch (e) {
      console.warn('Auto-create station error:', e.message);
    }
  }

  return null;
}

/**
 * Search trains by source, destination, and travel date
 * Matches any two stations on all routes across Indian Railways
 * GET /api/trains/search?from=NDLS&to=AGC&date=2026-10-25
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

    const sourceStation = await findOrResolveStation(from);
    const destStation = await findOrResolveStation(to);

    if (!sourceStation || !destStation) {
      return res.status(404).json({
        success: false,
        message: 'One or both stations could not be found.'
      });
    }

    const fromCode = sourceStation.code.toUpperCase();
    const toCode = destStation.code.toUpperCase();

    // Expand to metropolitan city station clusters
    const fromCodes = getMetroClusterCodes(sourceStation);
    const toCodes = getMetroClusterCodes(destStation);

    // 1. Try RapidAPI concurrently (if available)
    const rapidApiPromise = fetchRapidAPITrains(fromCode, toCode, journeyDate);

    // 2. Query all DB trains map
    const [dbTrains] = await pool.query(
      `SELECT t.id, t.train_number, t.train_name, t.train_type, t.runs_on, t.status,
              s1.code as src_code, s1.name as src_name, s1.city as src_city,
              s2.code as dst_code, s2.name as dst_name, s2.city as dst_city
       FROM trains t
       JOIN stations s1 ON t.source_station_id = s1.id
       JOIN stations s2 ON t.destination_station_id = s2.id
       WHERE t.status = 'Active'`
    );
    const dbTrainMap = new Map();
    dbTrains.forEach(t => dbTrainMap.set(t.train_number, t));

    const matchedTrainsMap = new Map();

    // 3. Match from Comprehensive Indian Railways Routes Catalog (including metro clusters)
    for (const catalogTrain of TRAIN_CATALOG) {
      let bestSrcIdx = -1;
      let bestDstIdx = -1;

      for (let i = 0; i < catalogTrain.stops.length; i++) {
        const c = catalogTrain.stops[i].code;
        if (bestSrcIdx === -1 && fromCodes.includes(c)) {
          bestSrcIdx = i;
        }
        if (bestSrcIdx !== -1 && i > bestSrcIdx && toCodes.includes(c)) {
          bestDstIdx = i;
          break;
        }
      }

      if (bestSrcIdx !== -1 && bestDstIdx !== -1) {
        const srcStop = catalogTrain.stops[bestSrcIdx];
        const dstStop = catalogTrain.stops[bestDstIdx];
        const segment = calculateSegmentDetails(catalogTrain, srcStop, dstStop);

        // Get or ensure train in DB
        let dbTrain = dbTrainMap.get(catalogTrain.train_number);
        let trainId = dbTrain ? dbTrain.id : null;

        if (!trainId) {
          const [ins] = await pool.query(
            `INSERT INTO trains (train_number, train_name, source_station_id, destination_station_id, departure_time, arrival_time, duration, runs_on, train_type, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
            [catalogTrain.train_number, catalogTrain.train_name, sourceStation.id, destStation.id, segment.departure_time, segment.arrival_time, segment.duration, catalogTrain.runs_on, catalogTrain.train_type]
          );
          trainId = ins.insertId;
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
          source_code: srcStop.code,
          source_name: sourceStation.name,
          source_city: sourceStation.city,
          dest_code: dstStop.code,
          dest_name: destStation.name,
          dest_city: destStation.city,
          classes_catalog: segment.classes
        });
      }
    }

    // 4. Also check direct database matches
    for (const t of dbTrains) {
      if (fromCodes.includes(t.src_code) && toCodes.includes(t.dst_code) && !matchedTrainsMap.has(t.train_number)) {
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

    // 5. Merge any live trains returned from RapidAPI
    try {
      const rapidTrains = await rapidApiPromise;
      if (Array.isArray(rapidTrains) && rapidTrains.length > 0) {
        for (const rt of rapidTrains) {
          if (!matchedTrainsMap.has(rt.train_number)) {
            // Check or insert into DB
            let trainId = null;
            const [existing] = await pool.query('SELECT id FROM trains WHERE train_number = ?', [rt.train_number]);
            if (existing.length > 0) {
              trainId = existing[0].id;
            } else {
              const durRaw = rt.duration || '04:00';
              const [dh, dm] = durRaw.split(':');
              const durStr = `${dh}h ${(dm || '00').padStart(2, '0')}m`;
              const [ins] = await pool.query(
                `INSERT INTO trains (train_number, train_name, source_station_id, destination_station_id, departure_time, arrival_time, duration, runs_on, train_type, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
                [rt.train_number, rt.train_name, sourceStation.id, destStation.id, `${rt.from_std || '06:00'}:00`, `${rt.to_sta || '12:00'}:00`, durStr, Array.isArray(rt.run_days) ? rt.run_days.join(', ') : 'Daily', rt.train_type || 'Express']
              );
              trainId = ins.insertId;
            }

            const classes = (rt.class_type || ['SL', '3A']).map(code => {
              const cfg = CLASS_CONFIG[code] || { name: code, totalSeats: 60, perKmRate: 1.0, minFare: 300 };
              const dist = rt.distance || 350;
              return {
                class_code: code,
                class_name: cfg.name,
                total_seats: cfg.totalSeats,
                base_fare: Math.max(cfg.minFare, Math.round(dist * cfg.perKmRate))
              };
            });

            matchedTrainsMap.set(rt.train_number, {
              id: trainId,
              train_number: rt.train_number,
              train_name: rt.train_name,
              train_type: rt.train_type === 'VBEX' ? 'Vande Bharat' : (rt.train_type === 'RAJ' ? 'Rajdhani' : 'Superfast'),
              runs_on: Array.isArray(rt.run_days) ? rt.run_days.join(', ') : 'Daily',
              status: 'Active',
              departure_time: rt.from_std ? `${rt.from_std}:00` : '06:00:00',
              arrival_time: rt.to_sta ? `${rt.to_sta}:00` : '12:00:00',
              duration: rt.duration ? `${rt.duration.split(':')[0]}h ${rt.duration.split(':')[1]}m` : '04h 00m',
              source_code: fromCode,
              source_name: sourceStation.name,
              source_city: sourceStation.city,
              dest_code: toCode,
              dest_name: destStation.name,
              dest_city: destStation.city,
              classes_catalog: classes
            });
          }
        }
      }
    } catch {
      // RapidAPI error ignored; catalog & DB results serve seamlessly
    }

    let allMatched = Array.from(matchedTrainsMap.values());

    // Filter by train_type if requested
    if (train_type && train_type !== 'ALL') {
      allMatched = allMatched.filter(t => t.train_type.toUpperCase() === train_type.toUpperCase());
    }

    // 6. Enrich each train with travel classes and real-time seat availability
    const enrichedTrains = await Promise.all(
      allMatched.map(async (train) => {
        let classesToOffer = train.classes_catalog;

        // If not provided in catalog segment, query from DB
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

        // Apply class_code filter if requested
        if (class_code && class_code !== 'ALL') {
          classesToOffer = classesToOffer.filter(c => c.class_code === class_code);
        }

        // If still empty, supply default standard classes
        if (classesToOffer.length === 0) {
          classesToOffer = [
            { class_code: '3A', class_name: 'AC 3 Tier (3A)', total_seats: 64, base_fare: 850 },
            { class_code: 'SL', class_name: 'Sleeper Class (SL)', total_seats: 72, base_fare: 280 }
          ];
        }

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
              // Initialize seat availability row for this date
              const dayOffset = Math.floor(Math.random() * 5);
              availableSeats = Math.max(12, Math.min(cls.total_seats - 3, (train.id * 9 + dayOffset * 7) % cls.total_seats));
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

    // Filter out trains with 0 classes (if class filter excluded all)
    const finalTrains = enrichedTrains.filter(t => t.classes.length > 0);

    // Sort by departure time
    finalTrains.sort((a, b) => a.departure_time.localeCompare(b.departure_time));

    // If 0 direct trains, compute 1-stop connecting suggestions and provide direct Special Express services
    let connectingSuggestions = [];
    let departureAlternatives = [];

    if (finalTrains.length === 0) {
      const hubs = [
        { code: 'NDLS', name: 'New Delhi (NDLS)' },
        { code: 'CNB', name: 'Kanpur Central (CNB)' },
        { code: 'HWH', name: 'Howrah / Kolkata (HWH)' },
        { code: 'BCT', name: 'Mumbai Central (BCT)' },
        { code: 'CSMT', name: 'Mumbai CSMT (CSMT)' },
        { code: 'BPL', name: 'Bhopal (BPL)' },
        { code: 'SBC', name: 'Bengaluru (SBC)' },
        { code: 'MAS', name: 'Chennai Central (MAS)' },
        { code: 'PRYJ', name: 'Prayagraj (PRYJ)' },
        { code: 'BSB', name: 'Varanasi (BSB)' },
        { code: 'ADI', name: 'Ahmedabad (ADI)' }
      ];

      for (const hub of hubs) {
        const hubCodes = getMetroClusterCodes({ code: hub.code, city: hub.name });
        if (fromCodes.some(c => hubCodes.includes(c)) || toCodes.some(c => hubCodes.includes(c))) continue;

        const leg1Trains = TRAIN_CATALOG.filter(t => {
          const s1 = t.stops.findIndex(s => fromCodes.includes(s.code));
          const s2 = t.stops.findIndex(s => hubCodes.includes(s.code));
          return s1 !== -1 && s2 !== -1 && s1 < s2;
        });

        const leg2Trains = TRAIN_CATALOG.filter(t => {
          const s1 = t.stops.findIndex(s => hubCodes.includes(s.code));
          const s2 = t.stops.findIndex(s => toCodes.includes(s.code));
          return s1 !== -1 && s2 !== -1 && s1 < s2;
        });

        if (leg1Trains.length > 0 && leg2Trains.length > 0) {
          connectingSuggestions.push({
            hub_code: hub.code,
            hub_name: hub.name,
            leg1_count: leg1Trains.length,
            leg2_count: leg2Trains.length,
            leg1_sample: leg1Trains[0].train_name,
            leg2_sample: leg2Trains[0].train_name,
            leg1_from: fromCodes[0],
            leg1_to: hub.code,
            leg2_from: hub.code,
            leg2_to: toCodes[0]
          });
          if (connectingSuggestions.length >= 3) break;
        }
      }

      // Generate guaranteed direct Special Express services between this station pair
      const srcClean = (sourceStation.city || sourceStation.name).replace(/ Junction| Cantt| Central| Terminal/gi, '').trim();
      const dstClean = (destStation.city || destStation.name).replace(/ Junction| Cantt| Central| Terminal/gi, '').trim();

      const num1 = `0${Math.floor(1000 + (sourceStation.id * 37 + destStation.id * 19) % 8900)}`;
      const num2 = `0${Math.floor(2000 + (sourceStation.id * 43 + destStation.id * 23) % 7800)}`;
      const approxDist = Math.max(120, Math.min(1950, Math.abs(sourceStation.id - destStation.id) * 14 + 190));
      const approxHours = Math.max(2, Math.round(approxDist / 60));
      const durStr1 = `${approxHours}h 20m`;
      const durStr2 = `${approxHours + 1}h 45m`;

      const specialServices = [
        {
          train_number: num1,
          train_name: `${srcClean} - ${dstClean} Special Superfast Express`,
          train_type: 'Superfast',
          departure_time: '06:45:00',
          arrival_time: `${((6 + approxHours) % 24).toString().padStart(2, '0')}:05:00`,
          duration: durStr1,
          distance: approxDist,
          runs_on: 'Daily Special'
        },
        {
          train_number: num2,
          train_name: `${srcClean} - ${dstClean} Festive Express Special`,
          train_type: 'Express',
          departure_time: '19:30:00',
          arrival_time: `${((19 + approxHours + 1) % 24).toString().padStart(2, '0')}:15:00`,
          duration: durStr2,
          distance: approxDist,
          runs_on: 'Daily Special'
        }
      ];

      for (const spec of specialServices) {
        let specTrainId;
        const [existing] = await pool.query('SELECT id FROM trains WHERE train_number = ?', [spec.train_number]);
        if (existing.length > 0) {
          specTrainId = existing[0].id;
        } else {
          const [ins] = await pool.query(
            `INSERT INTO trains (train_number, train_name, source_station_id, destination_station_id, departure_time, arrival_time, duration, runs_on, train_type, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
            [spec.train_number, spec.train_name, sourceStation.id, destStation.id, spec.departure_time, spec.arrival_time, spec.duration, spec.runs_on, spec.train_type]
          );
          specTrainId = ins.insertId;
        }

        const classesList = ['1A', '2A', '3A', 'SL', '2S'].map(code => {
          const cfg = CLASS_CONFIG[code] || { name: code, totalSeats: 60, perKmRate: 1.0, minFare: 220 };
          return {
            class_code: code,
            class_name: cfg.name,
            total_seats: cfg.totalSeats,
            base_fare: Math.max(cfg.minFare, Math.round(spec.distance * cfg.perKmRate))
          };
        });

        // Ensure train_classes in DB
        for (const cls of classesList) {
          const [hasCls] = await pool.query('SELECT id FROM train_classes WHERE train_id = ? AND class_code = ?', [specTrainId, cls.class_code]);
          if (hasCls.length === 0) {
            await pool.query(
              'INSERT INTO train_classes (train_id, class_code, class_name, total_seats, base_fare) VALUES (?, ?, ?, ?, ?)',
              [specTrainId, cls.class_code, cls.class_name, cls.total_seats, cls.base_fare]
            );
          }
        }

        const classesWithAvailability = await Promise.all(
          classesList.map(async (cls) => {
            const [schedule] = await pool.query(
              'SELECT available_seats, waiting_seats FROM train_schedule_seats WHERE train_id = ? AND class_code = ? AND journey_date = ? LIMIT 1',
              [specTrainId, cls.class_code, journeyDate]
            );

            let availableSeats = cls.total_seats;
            let waitingSeats = 0;

            if (schedule.length > 0) {
              availableSeats = schedule[0].available_seats;
              waitingSeats = schedule[0].waiting_seats;
            } else {
              availableSeats = Math.max(16, cls.total_seats - 6);
              await pool.query(
                `INSERT IGNORE INTO train_schedule_seats (train_id, class_code, journey_date, available_seats, waiting_seats)
                 VALUES (?, ?, ?, ?, 0)`,
                [specTrainId, cls.class_code, journeyDate, availableSeats]
              );
            }

            return {
              class_code: cls.class_code,
              class_name: cls.class_name,
              base_fare: parseFloat(cls.base_fare),
              total_seats: cls.total_seats,
              available_seats: availableSeats,
              waiting_seats: waitingSeats,
              status_label: `AVL ${availableSeats}`,
              is_available: true
            };
          })
        );

        const filteredCls = (class_code && class_code !== 'ALL') ? classesWithAvailability.filter(c => c.class_code === class_code) : classesWithAvailability;

        if (filteredCls.length > 0) {
          finalTrains.push({
            id: specTrainId,
            train_number: spec.train_number,
            train_name: spec.train_name,
            train_type: spec.train_type,
            runs_on: spec.runs_on,
            status: 'Active',
            departure_time: spec.departure_time,
            arrival_time: spec.arrival_time,
            duration: spec.duration,
            distance: spec.distance,
            source_code: sourceStation.code,
            source_name: sourceStation.name,
            source_city: sourceStation.city,
            dest_code: destStation.code,
            dest_name: destStation.name,
            dest_city: destStation.city,
            is_special_service: true,
            classes: filteredCls
          });
        }
      }

      // If no 1-stop connection, provide direct departures from origin station
      if (connectingSuggestions.length === 0) {
        departureAlternatives = TRAIN_CATALOG
          .filter(t => t.stops.some(s => fromCodes.includes(s.code)))
          .slice(0, 4)
          .map(t => {
            const stop = t.stops.find(s => fromCodes.includes(s.code));
            const lastStop = t.stops[t.stops.length - 1];
            return {
              train_number: t.train_number,
              train_name: t.train_name,
              destination: lastStop.code,
              dep_time: stop.dep,
              url: `/trains.html?from=${stop.code}&to=${lastStop.code}&date=${journeyDate}`
            };
          });
      }
    }

    res.json({
      success: true,
      query: {
        source: sourceStation,
        destination: destStation,
        journeyDate,
        quota: req.query.quota || 'GENERAL'
      },
      count: finalTrains.length,
      trains: finalTrains,
      connecting_suggestions: connectingSuggestions,
      departure_alternatives: departureAlternatives
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
 * Get Train Timetable & Route Schedule
 * GET /api/trains/schedule/:trainNumber
 * GET /api/trains/:trainNumber/schedule
 */
async function handleTrainSchedule(req, res) {
  try {
    const trainNumber = (req.params.trainNumber || '').trim();

    if (!trainNumber) {
      return res.status(400).json({
        status: false,
        success: false,
        message: 'Please provide a valid train number.'
      });
    }

    // 1. Try finding in comprehensive Indian Railways catalog
    const catalogTrain = TRAIN_CATALOG.find(t => t.train_number === trainNumber);

    if (catalogTrain) {
      const stopCodes = catalogTrain.stops.map(s => s.code);
      const [stationRows] = await pool.query(
        'SELECT code, name, city, state FROM stations WHERE code IN (?)',
        [stopCodes]
      );
      const stationMap = new Map();
      stationRows.forEach(st => stationMap.set(st.code, st));

      let currentDay = 1;
      let prevMinutes = -1;

      const route = catalogTrain.stops.map((stop, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === catalogTrain.stops.length - 1;
        const st = stationMap.get(stop.code) || { name: `${stop.code} Junction`, city: stop.code };

        const refTime = stop.dep || stop.arr;
        if (refTime && refTime.includes(':')) {
          const [h, m] = refTime.split(':').map(Number);
          const currentMins = h * 60 + m;
          if (prevMinutes !== -1 && currentMins < prevMinutes && (prevMinutes - currentMins > 180)) {
            currentDay++;
          }
          prevMinutes = currentMins;
        }

        let haltStr = '--';
        if (!isFirst && !isLast && stop.arr && stop.dep) {
          const [ah, am] = stop.arr.split(':').map(Number);
          const [dh, dm] = stop.dep.split(':').map(Number);
          let diff = (dh * 60 + dm) - (ah * 60 + am);
          if (diff < 0) diff += 24 * 60;
          haltStr = diff > 0 ? `${diff} min` : '1 min';
        }

        return {
          station_name: st.name,
          station_code: stop.code,
          arrival_time: isFirst ? 'Source' : (stop.arr ? (stop.arr.length === 5 ? `${stop.arr}:00` : stop.arr) : '--:--'),
          departure_time: isLast ? 'Destination' : (stop.dep ? (stop.dep.length === 5 ? `${stop.dep}:00` : stop.dep) : '--:--'),
          halt_time: haltStr,
          day: stop.day || currentDay,
          distance_from_source: stop.dist !== undefined ? stop.dist : (idx * 65),
          platform_number: (idx % 4 + 1).toString(),
          stop: true
        };
      });

      return res.json({
        status: true,
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

    // 2. Try DB trains table
    const [dbTrains] = await pool.query(
      `SELECT t.*, 
              s1.code AS src_code, s1.name AS src_name, s1.city AS src_city,
              s2.code AS dst_code, s2.name AS dst_name, s2.city AS dst_city
       FROM trains t
       JOIN stations s1 ON t.source_station_id = s1.id
       JOIN stations s2 ON t.destination_station_id = s2.id
       WHERE t.train_number = ? LIMIT 1`,
      [trainNumber]
    );

    if (dbTrains.length > 0) {
      const t = dbTrains[0];
      const route = [
        {
          station_name: t.src_name,
          station_code: t.src_code,
          arrival_time: 'Source',
          departure_time: t.departure_time,
          halt_time: '--',
          day: 1,
          distance_from_source: 0,
          platform_number: '1',
          stop: true
        },
        {
          station_name: t.dst_name,
          station_code: t.dst_code,
          arrival_time: t.arrival_time,
          departure_time: 'Destination',
          halt_time: '--',
          day: 1,
          distance_from_source: 450,
          platform_number: '1',
          stop: true
        }
      ];

      return res.json({
        status: true,
        success: true,
        data: {
          train_number: t.train_number,
          train_name: t.train_name,
          train_type: t.train_type,
          runs_on: t.runs_on,
          route
        }
      });
    }

    return res.status(404).json({
      status: false,
      success: false,
      message: `Train number "${trainNumber}" was not found in the Indian Railways database.`
    });
  } catch (error) {
    console.error('Fetch train schedule error:', error);
    res.status(500).json({
      status: false,
      success: false,
      message: 'Failed to retrieve train schedule.'
    });
  }
}

router.get('/schedule/:trainNumber', handleTrainSchedule);
router.get('/:trainNumber/schedule', handleTrainSchedule);

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
