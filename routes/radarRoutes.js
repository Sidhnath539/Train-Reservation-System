const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// In-memory cache for live radar data (TTL: 45 seconds)
const radarCache = new Map();
const CACHE_TTL_MS = 45 * 1000;

// High-precision geographic coordinates of Indian Railway stations
const STATION_COORDINATES = {
  'NDLS': { name: 'New Delhi Railway Station', city: 'New Delhi', lat: 28.6429, lng: 77.2195 },
  'GZB':  { name: 'Ghaziabad Junction', city: 'Ghaziabad', lat: 28.6679, lng: 77.4354 },
  'ALJN': { name: 'Aligarh Junction', city: 'Aligarh', lat: 27.8974, lng: 78.0880 },
  'TDL':  { name: 'Tundla Junction', city: 'Tundla', lat: 27.2064, lng: 78.2432 },
  'CNB':  { name: 'Kanpur Central', city: 'Kanpur', lat: 26.4547, lng: 80.3507 },
  'PRYJ': { name: 'Prayagraj Junction', city: 'Prayagraj', lat: 25.4484, lng: 81.8340 },
  'DDU':  { name: 'Pt. Deen Dayal Upadhyaya Jn', city: 'Mughalsarai', lat: 25.2818, lng: 83.1189 },
  'BSB':  { name: 'Varanasi Junction', city: 'Varanasi', lat: 25.3283, lng: 82.9863 },
  'PNBE': { name: 'Patna Junction', city: 'Patna', lat: 25.6022, lng: 85.1376 },
  'ARA':  { name: 'Ara Junction', city: 'Ara', lat: 25.5541, lng: 84.6630 },
  'BXR':  { name: 'Buxar', city: 'Buxar', lat: 25.5647, lng: 83.9777 },
  'GAYA': { name: 'Gaya Junction', city: 'Gaya', lat: 24.8090, lng: 84.9998 },
  'DHN':  { name: 'Dhanbad Junction', city: 'Dhanbad', lat: 23.7957, lng: 86.4304 },
  'ASN':  { name: 'Asansol Junction', city: 'Asansol', lat: 23.6889, lng: 86.9661 },
  'HWH':  { name: 'Howrah Junction', city: 'Kolkata', lat: 22.5838, lng: 88.3426 },
  'LKO':  { name: 'Lucknow Charbagh', city: 'Lucknow', lat: 26.8322, lng: 80.9231 },
  'KOTA': { name: 'Kota Junction', city: 'Kota', lat: 25.2238, lng: 75.8648 },
  'BRC':  { name: 'Vadodara Junction', city: 'Vadodara', lat: 22.3107, lng: 73.1812 },
  'ST':   { name: 'Surat', city: 'Surat', lat: 21.2050, lng: 72.8407 },
  'VAPI': { name: 'Vapi', city: 'Vapi', lat: 20.3712, lng: 72.9106 },
  'BVI':  { name: 'Borivali', city: 'Mumbai', lat: 19.2288, lng: 72.8569 },
  'BCT':  { name: 'Mumbai Central', city: 'Mumbai', lat: 18.9696, lng: 72.8193 },
  'CSMT': { name: 'Chhatrapati Shivaji Maharaj Terminus', city: 'Mumbai', lat: 18.9402, lng: 72.8356 },
  'TNA':  { name: 'Thane', city: 'Thane', lat: 19.1860, lng: 72.9757 },
  'PNVL': { name: 'Panvel', city: 'Panvel', lat: 18.9894, lng: 73.1175 },
  'RN':   { name: 'Ratnagiri', city: 'Ratnagiri', lat: 16.9902, lng: 73.3120 },
  'KKW':  { name: 'Kankavali', city: 'Kankavali', lat: 16.2690, lng: 73.6936 },
  'MAO':  { name: 'Madgaon Junction', city: 'Goa', lat: 15.2736, lng: 73.9782 },
  'ADI':  { name: 'Ahmedabad Junction', city: 'Ahmedabad', lat: 23.0270, lng: 72.6012 },
  'KGP':  { name: 'Kharagpur Junction', city: 'Kharagpur', lat: 22.3396, lng: 87.3248 },
  'BBS':  { name: 'Bhubaneswar', city: 'Bhubaneswar', lat: 20.2644, lng: 85.8446 },
  'VSKP': { name: 'Visakhapatnam Junction', city: 'Visakhapatnam', lat: 17.7214, lng: 83.2929 },
  'BZA':  { name: 'Vijayawada Junction', city: 'Vijayawada', lat: 16.5178, lng: 80.6200 },
  'RU':   { name: 'Renigunta Junction', city: 'Tirupati', lat: 13.6508, lng: 79.5160 },
  'SBC':  { name: 'KSR Bengaluru City', city: 'Bengaluru', lat: 12.9784, lng: 77.5694 },
  'MAS':  { name: 'MGR Chennai Central', city: 'Chennai', lat: 13.0827, lng: 80.2755 },
  'GKP':  { name: 'Gorakhpur Junction', city: 'Gorakhpur', lat: 26.7606, lng: 83.3732 },
  'JAT':  { name: 'Jammu Tawi', city: 'Jammu', lat: 32.7060, lng: 74.8796 }
};

// Route station sequences for key express routes
const TRAIN_ROUTE_DEFINITIONS = {
  // 12302 Howrah Rajdhani Express (NDLS -> HWH)
  '12302': ['NDLS', 'CNB', 'PRYJ', 'DDU', 'GAYA', 'DHN', 'ASN', 'HWH'],
  // 12301 New Delhi Rajdhani Express (HWH -> NDLS)
  '12301': ['HWH', 'ASN', 'DHN', 'GAYA', 'DDU', 'PRYJ', 'CNB', 'NDLS'],
  // 12952 Mumbai Tejas Rajdhani Express (NDLS -> BCT)
  '12952': ['NDLS', 'KOTA', 'BRC', 'ST', 'BVI', 'BCT'],
  // 12951 New Delhi Tejas Rajdhani Express (BCT -> NDLS)
  '12951': ['BCT', 'BVI', 'ST', 'BRC', 'KOTA', 'NDLS'],
  // 22436 Vande Bharat Express (NDLS -> BSB)
  '22436': ['NDLS', 'CNB', 'PRYJ', 'BSB'],
  // 22435 Vande Bharat Express (BSB -> NDLS)
  '22435': ['BSB', 'PRYJ', 'CNB', 'NDLS'],
  // 12004 Lucknow Swarna Shatabdi Express (NDLS -> LKO)
  '12004': ['NDLS', 'GZB', 'ALJN', 'TDL', 'CNB', 'LKO'],
  // 12003 New Delhi Swarna Shatabdi Express (LKO -> NDLS)
  '12003': ['LKO', 'CNB', 'TDL', 'ALJN', 'GZB', 'NDLS'],
  // 20901 Mumbai - Gandhinagar Vande Bharat (BCT -> ADI)
  '20901': ['BCT', 'BVI', 'VAPI', 'ST', 'BRC', 'ADI'],
  // 12051 Madgaon Jan Shatabdi Express (CSMT -> MAO)
  '12051': ['CSMT', 'TNA', 'PNVL', 'RN', 'KKW', 'MAO'],
  // 12245 Howrah - Yesvantpur Duronto (HWH -> SBC)
  '12245': ['HWH', 'KGP', 'BBS', 'VSKP', 'BZA', 'RU', 'SBC'],
  // 12393 Sampoorna Kranti Express (PNBE -> NDLS)
  '12393': ['PNBE', 'ARA', 'BXR', 'DDU', 'CNB', 'NDLS']
};

/**
 * Distance between two coordinates in kilometers using Haversine formula
 */
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Format minutes into HH:MM
 */
function formatTimeFromMinutes(totalMinutes) {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Parse HH:MM:SS or HH:MM into total minutes of the day
 */
function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

/**
 * GET /api/radar/trains
 * Returns list of active trains for radar selector
 */
router.get('/trains', async (req, res) => {
  try {
    const [trains] = await pool.query(`
      SELECT 
        t.id,
        t.train_number,
        t.train_name,
        t.train_type,
        t.departure_time,
        t.arrival_time,
        t.duration,
        s1.code AS source_code,
        s1.name AS source_name,
        s1.city AS source_city,
        s2.code AS destination_code,
        s2.name AS destination_name,
        s2.city AS destination_city
      FROM trains t
      JOIN stations s1 ON t.source_station_id = s1.id
      JOIN stations s2 ON t.destination_station_id = s2.id
      ORDER BY t.train_number ASC
    `);

    res.json({
      success: true,
      count: trains.length,
      trains
    });
  } catch (error) {
    console.error('Radar Trains Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch radar trains' });
  }
});

/**
 * Build simulated real-time tracking data for a train based on schedule and current time
 */
function buildSimulatedLiveStatus(train, now) {
  const trainNum = train.train_number;
  const routeCodes = TRAIN_ROUTE_DEFINITIONS[trainNum] || [train.source_code, train.destination_code];

  const depMinutes = parseTimeToMinutes(train.departure_time);
  let arrMinutes = parseTimeToMinutes(train.arrival_time);
  if (arrMinutes <= depMinutes) {
    arrMinutes += 1440; // Journey spans midnight
  }
  const totalJourneyMinutes = arrMinutes - depMinutes;

  // Build station timeline objects with distance and scheduled timings
  let accumulatedKm = 0;
  const routeStations = [];

  for (let i = 0; i < routeCodes.length; i++) {
    const code = routeCodes[i];
    const coords = STATION_COORDINATES[code] || { name: code, city: code, lat: 28.6, lng: 77.2 };
    
    if (i > 0) {
      const prevCoords = STATION_COORDINATES[routeCodes[i - 1]] || coords;
      accumulatedKm += getDistanceFromLatLonInKm(prevCoords.lat, prevCoords.lng, coords.lat, coords.lng);
    }

    // Allocate scheduled arrival/departure proportional to route distance
    const routeFraction = i / (routeCodes.length - 1);
    const stationSchMinutes = depMinutes + Math.round(routeFraction * totalJourneyMinutes);

    routeStations.push({
      code,
      name: coords.name,
      city: coords.city,
      lat: coords.lat,
      lng: coords.lng,
      distance_km: accumulatedKm,
      sch_arr: i === 0 ? 'Source' : formatTimeFromMinutes(stationSchMinutes - 5),
      sch_dep: i === routeCodes.length - 1 ? 'Destination' : formatTimeFromMinutes(stationSchMinutes),
      raw_sch_dep_minutes: stationSchMinutes,
      platform: ((parseInt(trainNum, 10) + i) % 6) + 1
    });
  }

  // Calculate current simulated position
  const currentMinutes = now.getHours() * 60 + now.getMinutes() + (now.getSeconds() / 60);

  // Normalize current time into journey window
  let elapsedMinutes = currentMinutes - depMinutes;
  if (elapsedMinutes < 0) {
    elapsedMinutes += 1440; // Next or previous day cycle
  }

  // Realistic random-looking deterministic delay based on train number and hour
  const delayMinutes = ((parseInt(trainNum.slice(-2), 10) + now.getHours()) % 11);
  const adjustedElapsed = Math.max(0, elapsedMinutes - delayMinutes);

  // Clamp progress percentage
  let progressPct = (adjustedElapsed / totalJourneyMinutes) * 100;
  if (progressPct > 100) progressPct = 99.4;
  if (progressPct < 0) progressPct = 0;

  // Determine current segment between stations
  let currentStationIndex = 0;
  for (let i = 0; i < routeStations.length - 1; i++) {
    const currentFraction = (routeStations[i].distance_km / accumulatedKm) * 100;
    const nextFraction = (routeStations[i + 1].distance_km / accumulatedKm) * 100;
    if (progressPct >= currentFraction && progressPct <= nextFraction) {
      currentStationIndex = i;
      break;
    }
  }

  const prevStation = routeStations[currentStationIndex];
  const nextStation = routeStations[Math.min(currentStationIndex + 1, routeStations.length - 1)];

  // Segment interpolation fraction (0 to 1)
  const prevDist = prevStation.distance_km;
  const nextDist = nextStation.distance_km;
  const currentDist = (progressPct / 100) * accumulatedKm;
  const segmentFraction = nextDist > prevDist ? (currentDist - prevDist) / (nextDist - prevDist) : 0;

  // Interpolated Lat / Lng
  const currentLat = prevStation.lat + (nextStation.lat - prevStation.lat) * segmentFraction;
  const currentLng = prevStation.lng + (nextStation.lng - prevStation.lng) * segmentFraction;

  // Calculate speed: 0 if at halt, else 105-125 km/h
  const isAtStationHalt = segmentFraction < 0.05 || segmentFraction > 0.95;
  const speed = isAtStationHalt ? 0 : Math.round(98 + (parseInt(trainNum.slice(-1), 10) * 2.8));

  // Determine station statuses (PASSED, CURRENT, UPCOMING)
  const populatedRoute = routeStations.map((stn, idx) => {
    let status = 'UPCOMING';
    let act_arr = formatTimeFromMinutes(stn.raw_sch_dep_minutes + delayMinutes - 5);
    let act_dep = formatTimeFromMinutes(stn.raw_sch_dep_minutes + delayMinutes);

    if (idx < currentStationIndex) {
      status = 'PASSED';
    } else if (idx === currentStationIndex) {
      status = isAtStationHalt ? 'CURRENT' : 'PASSED';
    } else if (idx === currentStationIndex + 1 && !isAtStationHalt) {
      status = 'UPCOMING';
    }

    if (idx === 0) {
      act_arr = 'Source';
      act_dep = formatTimeFromMinutes(depMinutes);
    }
    if (idx === routeStations.length - 1) {
      act_dep = 'Destination';
    }

    return {
      code: stn.code,
      name: stn.name,
      city: stn.city,
      lat: stn.lat,
      lng: stn.lng,
      distance_km: stn.distance_km,
      platform: stn.platform,
      sch_arr: stn.sch_arr,
      sch_dep: stn.sch_dep,
      act_arr,
      act_dep,
      delay_minutes: delayMinutes,
      status
    };
  });

  const distToNext = Math.max(0, Math.round(nextStation.distance_km - currentDist));

  return {
    success: true,
    source: 'SIMULATION',
    train_number: train.train_number,
    train_name: train.train_name,
    train_type: train.train_type,
    status_text: delayMinutes === 0 ? 'Right Time' : `Delayed by ${delayMinutes} min`,
    status_badge: delayMinutes === 0 ? 'ON_TIME' : 'DELAYED',
    speed_kmph: speed,
    delay_minutes: delayMinutes,
    progress_percentage: parseFloat(progressPct.toFixed(1)),
    total_distance_km: accumulatedKm,
    current_distance_km: Math.round(currentDist),
    current_location: {
      lat: parseFloat(currentLat.toFixed(5)),
      lng: parseFloat(currentLng.toFixed(5)),
      near_station_code: prevStation.code,
      near_station_name: prevStation.name,
      next_station_code: nextStation.code,
      next_station_name: nextStation.name,
      distance_to_next_km: distToNext,
      status_description: isAtStationHalt
        ? `Halted at Platform ${prevStation.platform} of ${prevStation.name}`
        : `Running between ${prevStation.name} and ${nextStation.name} (${distToNext} km to go)`,
      updated_at: now.toTimeString().split(' ')[0]
    },
    route: populatedRoute,
    source_station: {
      code: train.source_code,
      name: train.source_name,
      lat: (STATION_COORDINATES[train.source_code] || {}).lat || 28.6429,
      lng: (STATION_COORDINATES[train.source_code] || {}).lng || 77.2195
    },
    destination_station: {
      code: train.destination_code,
      name: train.destination_name,
      lat: (STATION_COORDINATES[train.destination_code] || {}).lat || 22.5838,
      lng: (STATION_COORDINATES[train.destination_code] || {}).lng || 88.3426
    },
    last_updated: now.toISOString()
  };
}

/**
 * Helper to extract time string HH:MM from ISO string or time string
 */
function extractTime(isoStr, fallback = '--:--') {
  if (!isoStr) return fallback;
  const match = isoStr.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : isoStr;
}

/**
 * Fetch live train status directly from official RailRadar API using user's API key
 */
async function fetchFromRailRadar(trainNumber) {
  const apiKey = process.env.RAILRADAR_API_KEY || 'rg_9f5e97a51a2f4ff8abf656d0fee60439';
  const baseUrl = process.env.RAILRADAR_BASE_URL || 'https://railradar.in/api/v1';

  if (!apiKey || apiKey.trim() === '') {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6500);

  try {
    const url = `${baseUrl}/trains/${encodeURIComponent(trainNumber)}/live`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`RailRadar API responded with HTTP ${response.status} for train ${trainNumber}`);
      return null;
    }

    const json = await response.json();
    if (!json.success || !json.data) {
      return null;
    }

    const d = json.data;
    const allRoute = d.route || [];
    const halts = allRoute.filter(r => r.isHalt);
    const activeRoute = halts.length > 0 ? halts : allRoute;

    const firstHalt = activeRoute[0] || {};
    const lastHalt = activeRoute[activeRoute.length - 1] || {};
    const totalDist = lastHalt.distance || (d.train && d.train.distance) || 1000;
    const currentDist = d.currentLocation ? (d.currentLocation.distanceFromOriginKm || 0) : 0;
    const progressPct = parseFloat(Math.min(100, Math.max(0, (currentDist / totalDist) * 100)).toFixed(1));

    const delayMinutes = d.delayMinutes || (d.currentLocation ? d.currentLocation.delayMinutes : 0) || 0;
    const now = new Date();

    return {
      success: true,
      source: 'RAILRADAR_LIVE_API',
      train_number: d.trainNumber,
      train_name: d.trainName,
      train_type: d.train ? (d.train.type || d.train.category) : 'Superfast',
      status_text: delayMinutes === 0 ? 'Right Time' : `Delayed by ${delayMinutes} min`,
      status_badge: delayMinutes === 0 ? 'ON_TIME' : 'DELAYED',
      speed_kmph: d.currentLocation && d.currentLocation.speed ? d.currentLocation.speed : (delayMinutes > 0 ? 88 : 105),
      delay_minutes: delayMinutes,
      progress_percentage: progressPct,
      total_distance_km: Math.round(totalDist),
      current_distance_km: Math.round(currentDist),
      current_location: {
        station_code: d.currentLocation ? d.currentLocation.stationCode : '',
        station_name: d.currentLocation ? d.currentLocation.stationName : 'In Transit',
        near_station_name: d.currentLocation ? d.currentLocation.stationName : 'In Transit',
        status_description: d.currentLocation
          ? `Currently near ${d.currentLocation.stationName} (${d.currentLocation.stationCode}) · ${delayMinutes === 0 ? 'Right Time' : delayMinutes + ' min late'}`
          : `Running on schedule`,
        next_station_name: d.nextHalt ? d.nextHalt.stationName : (lastHalt.stationName || 'Destination'),
        distance_to_next_km: d.nextHalt ? Math.max(0, Math.round(d.nextHalt.distance - currentDist)) : 0,
        updated_at: d.lastUpdatedAt ? new Date(d.lastUpdatedAt).toTimeString().split(' ')[0] : now.toTimeString().split(' ')[0]
      },
      coach_position: d.coachPosition || (d.train && d.train.coachPosition) || firstHalt.coachPosition || '',
      route: activeRoute.map((h, i) => {
        let status = 'UPCOMING';
        if (h.status === 'departed') status = 'PASSED';
        else if (h.status === 'at-station' || h.status === 'arrived') status = 'CURRENT';
        else if (i === 0 && d.status === 'running') status = 'PASSED';

        return {
          code: h.stationCode,
          name: h.stationName,
          city: h.stationName,
          platform: h.platform || '1',
          sch_arr: i === 0 ? 'Source' : extractTime(h.scheduledArrival),
          sch_dep: i === activeRoute.length - 1 ? 'Destination' : extractTime(h.scheduledDeparture),
          act_arr: i === 0 ? 'Source' : extractTime(h.actualArrival || h.scheduledArrival),
          act_dep: i === activeRoute.length - 1 ? 'Destination' : extractTime(h.actualDeparture || h.scheduledDeparture),
          delay_minutes: h.delayArrival || h.delayDeparture || delayMinutes || 0,
          distance_km: Math.round(h.distance || 0),
          status: status,
          coach_position: h.coachPosition || ''
        };
      }),
      source_station: {
        code: firstHalt.stationCode || 'NDLS',
        name: firstHalt.stationName || 'Source'
      },
      destination_station: {
        code: lastHalt.stationCode || 'HWH',
        name: lastHalt.stationName || 'Destination'
      },
      last_updated: d.lastUpdatedAt || now.toISOString()
    };
  } catch (err) {
    clearTimeout(timeout);
    console.warn('RailRadar API fetch error:', err.message);
    return null;
  }
}

/**
 * GET /api/radar/live/:trainNumber
 * Get live tracking & telemetry data for a train
 */
router.get('/live/:trainNumber', async (req, res) => {
  const trainNumber = req.params.trainNumber.trim();

  // Check cache
  const cached = radarCache.get(trainNumber);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return res.json(cached.data);
  }

  try {
    // 1. Primary Source: Official RailRadar Live API
    let liveData = await fetchFromRailRadar(trainNumber);

    if (liveData) {
      radarCache.set(trainNumber, {
        timestamp: Date.now(),
        data: liveData
      });
      return res.json(liveData);
    }

    // 2. Secondary Fallback: MySQL database schedule & high-precision simulator
    const [trains] = await pool.query(`
      SELECT 
        t.id,
        t.train_number,
        t.train_name,
        t.train_type,
        t.departure_time,
        t.arrival_time,
        t.duration,
        s1.code AS source_code,
        s1.name AS source_name,
        s2.code AS destination_code,
        s2.name AS destination_name
      FROM trains t
      JOIN stations s1 ON t.source_station_id = s1.id
      JOIN stations s2 ON t.destination_station_id = s2.id
      WHERE t.train_number = ?
      LIMIT 1
    `, [trainNumber]);

    if (trains.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Train number ${trainNumber} not found. Please verify the 5-digit train number.`
      });
    }

    const train = trains[0];
    const now = new Date();
    liveData = buildSimulatedLiveStatus(train, now);

    radarCache.set(trainNumber, {
      timestamp: Date.now(),
      data: liveData
    });

    res.json(liveData);
  } catch (error) {
    console.error('Radar Live Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve live running status.',
      error: error.message
    });
  }
});

module.exports = router;

