/**
 * ============================================================================
 * RAILORA - LIVE TRAIN RUNNING STATUS & STATION BOARDS
 * File: routes/liveRoutes.js
 * Description: Delivers train running telemetry, station arrival/departure boards,
 *              and platform schedules based on timetable progression.
 * Level: Beginner-Friendly / Educational
 * ============================================================================
 * 
 * Notice: This is demonstration scheduled status. Clearly labelled as simulated data.
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { TRAIN_CATALOG } = require('../config/trainRoutesCatalog');

/**
 * 1. GET /api/live/train-status/:trainNumber
 * Returns real-time simulation of train progress along its route
 */
router.get('/train-status/:trainNumber', async (req, res) => {
  try {
    const trainNumber = (req.params.trainNumber || '').trim();

    if (!trainNumber) {
      return res.status(400).json({ success: false, message: 'Please provide a valid train number.' });
    }

    // 1. Check in catalog
    const catalogTrain = TRAIN_CATALOG.find(t => t.train_number === trainNumber);

    let trainInfo = null;
    let stops = [];

    if (catalogTrain) {
      trainInfo = {
        train_number: catalogTrain.train_number,
        train_name: catalogTrain.train_name,
        train_type: catalogTrain.train_type,
        runs_on: catalogTrain.runs_on
      };

      const stopCodes = catalogTrain.stops.map(s => s.code);
      const [stationRows] = await pool.query('SELECT code, name, city FROM stations WHERE code IN (?)', [stopCodes]);
      const stationMap = new Map();
      stationRows.forEach(st => stationMap.set(st.code, st));

      stops = catalogTrain.stops.map((s, idx) => {
        const st = stationMap.get(s.code) || { name: `${s.code} Junction`, city: s.code };
        return {
          code: s.code,
          name: st.name,
          city: st.city,
          arr: s.arr || 'Source',
          dep: s.dep || 'Destination',
          dist: s.dist || (idx * 65),
          day: s.day || 1,
          platform: ((idx % 4) + 1).toString()
        };
      });
    } else {
      // Check database
      const [dbTrains] = await pool.query(
        `SELECT t.*, s1.code as src_code, s1.name as src_name, s2.code as dst_code, s2.name as dst_name
         FROM trains t
         JOIN stations s1 ON t.source_station_id = s1.id
         JOIN stations s2 ON t.destination_station_id = s2.id
         WHERE t.train_number = ? LIMIT 1`,
        [trainNumber]
      );

      if (dbTrains.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Train number ${trainNumber} was not found.`
        });
      }

      const t = dbTrains[0];
      trainInfo = {
        train_number: t.train_number,
        train_name: t.train_name,
        train_type: t.train_type,
        runs_on: t.runs_on
      };
      stops = [
        { code: t.src_code, name: t.src_name, arr: 'Source', dep: t.departure_time, dist: 0, day: 1, platform: '1' },
        { code: t.dst_code, name: t.dst_name, arr: t.arrival_time, dep: 'Destination', dist: 450, day: 1, platform: '1' }
      ];
    }

    // Determine simulated current position based on current time
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    let currentStopIndex = 0;
    for (let i = 0; i < stops.length; i++) {
      const timeStr = stops[i].dep !== 'Destination' ? stops[i].dep : stops[i].arr;
      if (timeStr && timeStr.includes(':')) {
        const [h, m] = timeStr.split(':').map(Number);
        if (h * 60 + m <= currentMins) {
          currentStopIndex = i;
        }
      }
    }

    // Add simulated delay (0 to 12 mins)
    const simulatedDelayMins = (parseInt(trainNumber, 10) * 7) % 15;
    const isOntime = simulatedDelayMins <= 5;

    const timeline = stops.map((s, idx) => {
      let state = 'UPCOMING';
      if (idx < currentStopIndex) state = 'DEPARTED';
      else if (idx === currentStopIndex) state = 'CURRENT';

      return {
        ...s,
        state,
        delay_minutes: simulatedDelayMins,
        status_text: idx < currentStopIndex ? 'Departed' : (idx === currentStopIndex ? 'Arrived / At Station' : 'Expected')
      };
    });

    const currentStop = stops[currentStopIndex] || stops[0];
    const nextStop = stops[currentStopIndex + 1] || null;

    res.json({
      success: true,
      train: trainInfo,
      status: {
        current_station: currentStop.name,
        current_code: currentStop.code,
        current_platform: currentStop.platform,
        next_station: nextStop ? nextStop.name : 'Trip Finished',
        next_code: nextStop ? nextStop.code : '',
        delay_minutes: simulatedDelayMins,
        delay_status: isOntime ? 'Running Right Time' : `Delayed by ${simulatedDelayMins} mins`,
        last_updated: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        is_demo_data: true,
        disclaimer: 'Demonstration telemetry based on published Indian Railways timetable.'
      },
      timeline
    });
  } catch (error) {
    console.error('Live status error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to retrieve live running status.' });
  }
});

/**
 * 2. GET /api/live/station-board/:stationCode
 * Returns live arrival and departure board for any station
 */
router.get('/station-board/:stationCode', async (req, res) => {
  try {
    const rawCode = (req.params.stationCode || '').trim().toUpperCase();

    const [stationRows] = await pool.query(
      'SELECT id, code, name, city, state FROM stations WHERE code = ? OR UPPER(name) LIKE ? LIMIT 1',
      [rawCode, `%${rawCode}%`]
    );

    if (stationRows.length === 0) {
      return res.status(404).json({ success: false, message: `Station ${rawCode} not found.` });
    }

    const station = stationRows[0];
    const code = station.code;

    // Find all trains passing through this station
    const matchedDepartures = [];
    const matchedArrivals = [];

    TRAIN_CATALOG.forEach(t => {
      const stopIdx = t.stops.findIndex(s => s.code === code);
      if (stopIdx !== -1) {
        const stop = t.stops[stopIdx];
        const isFirst = stopIdx === 0;
        const isLast = stopIdx === t.stops.length - 1;
        const src = t.stops[0];
        const dst = t.stops[t.stops.length - 1];

        const item = {
          train_number: t.train_number,
          train_name: t.train_name,
          train_type: t.train_type,
          origin_code: src.code,
          destination_code: dst.code,
          platform: ((stopIdx % 4) + 1).toString(),
          scheduled_arr: isFirst ? 'Source' : stop.arr,
          scheduled_dep: isLast ? 'Destination' : stop.dep,
          delay_minutes: (parseInt(t.train_number, 10) % 9),
          status: (parseInt(t.train_number, 10) % 9) === 0 ? 'On Time' : `Late by ${parseInt(t.train_number, 10) % 9}m`
        };

        if (!isFirst) matchedArrivals.push(item);
        if (!isLast) matchedDepartures.push(item);
      }
    });

    res.json({
      success: true,
      station,
      arrivals: matchedArrivals.slice(0, 15),
      departures: matchedDepartures.slice(0, 15),
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    });
  } catch (error) {
    console.error('Station board error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to retrieve station board.' });
  }
});

module.exports = router;
