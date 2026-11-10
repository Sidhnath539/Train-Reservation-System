const { pool } = require('../db');
const { TRAIN_CATALOG, CLASS_CONFIG } = require('../config/trainRoutesCatalog');

async function syncCatalog() {
  console.log('--- Starting Sync of Comprehensive Train Catalog into MySQL ---');

  // Fetch all stations map
  const [stations] = await pool.query('SELECT id, code, name, city FROM stations');
  const stationMap = new Map();
  stations.forEach(s => stationMap.set(s.code, s));

  let trainsSynced = 0;
  let classesSynced = 0;

  for (const t of TRAIN_CATALOG) {
    const srcStation = stationMap.get(t.source_code);
    const dstStation = stationMap.get(t.dest_code);

    if (!srcStation || !dstStation) {
      console.warn(`Skipping ${t.train_number}: Station not found for ${t.source_code} or ${t.dest_code}`);
      continue;
    }

    const firstStop = t.stops[0];
    const lastStop = t.stops[t.stops.length - 1];
    const depTime = firstStop.dep.length === 5 ? `${firstStop.dep}:00` : firstStop.dep;
    const arrTime = lastStop.arr.length === 5 ? `${lastStop.arr}:00` : lastStop.arr;

    // Check if train already exists
    const [existing] = await pool.query('SELECT id FROM trains WHERE train_number = ?', [t.train_number]);
    let trainId;

    if (existing.length > 0) {
      trainId = existing[0].id;
      // Update metadata
      await pool.query(
        `UPDATE trains SET 
          train_name = ?, 
          source_station_id = ?, 
          destination_station_id = ?, 
          departure_time = ?, 
          arrival_time = ?, 
          runs_on = ?, 
          train_type = ?, 
          status = 'Active' 
        WHERE id = ?`,
        [t.train_name, srcStation.id, dstStation.id, depTime, arrTime, t.runs_on, t.train_type, trainId]
      );
    } else {
      // Calculate total duration
      const [depH, depM] = firstStop.dep.split(':').map(Number);
      const [arrH, arrM] = lastStop.arr.split(':').map(Number);
      let diff = (arrH * 60 + arrM) - (depH * 60 + depM);
      if (diff <= 0) diff += 24 * 60;
      const durStr = `${Math.floor(diff / 60)}h ${(diff % 60).toString().padStart(2, '0')}m`;

      const [insertRes] = await pool.query(
        `INSERT INTO trains 
          (train_number, train_name, source_station_id, destination_station_id, departure_time, arrival_time, duration, runs_on, train_type, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
        [t.train_number, t.train_name, srcStation.id, dstStation.id, depTime, arrTime, durStr, t.runs_on, t.train_type]
      );
      trainId = insertRes.insertId;
      trainsSynced++;
    }

    // Sync classes
    for (const code of t.classes) {
      const cfg = CLASS_CONFIG[code] || { name: code, totalSeats: 60, perKmRate: 1.0, minFare: 300 };
      const totalDist = lastStop.dist;
      const baseFare = Math.max(cfg.minFare, Math.round(totalDist * cfg.perKmRate));

      const [clsRows] = await pool.query(
        'SELECT id FROM train_classes WHERE train_id = ? AND class_code = ?',
        [trainId, code]
      );

      if (clsRows.length === 0) {
        await pool.query(
          `INSERT INTO train_classes (train_id, class_code, class_name, total_seats, base_fare) 
           VALUES (?, ?, ?, ?, ?)`,
          [trainId, code, cfg.name, cfg.totalSeats, baseFare]
        );
        classesSynced++;
      }

      // Ensure mock availability for today, tomorrow, and next 7 days
      for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
        const d = new Date();
        d.setDate(d.getDate() + dayOffset);
        const dateStr = d.toISOString().split('T')[0];

        // Random deterministic availability based on trainId and date
        const avail = Math.max(8, Math.min(cfg.totalSeats - 5, (trainId * 7 + dayOffset * 13) % cfg.totalSeats));

        await pool.query(
          `INSERT IGNORE INTO train_schedule_seats 
            (train_id, class_code, journey_date, available_seats, waiting_seats) 
           VALUES (?, ?, ?, ?, 0)`,
          [trainId, code, dateStr, avail]
        );
      }
    }
  }

  const [finalTrains] = await pool.query('SELECT count(*) as count FROM trains');
  const [finalClasses] = await pool.query('SELECT count(*) as count FROM train_classes');

  console.log(`Sync completed!`);
  console.log(`Total Trains in DB: ${finalTrains[0].count}`);
  console.log(`Total Classes in DB: ${finalClasses[0].count}`);
  process.exit(0);
}

syncCatalog().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});
