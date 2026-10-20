/**
 * RAILORA - Live Train Running Status & Telemetry
 */

let activeTrainNumber = null;
let refreshInterval = null;
let isFetching = false;

document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await loadTrainsList();
});

/**
 * Setup UI event listeners
 */
function setupEventListeners() {
  const trainSelect = document.getElementById('radar-train-select');
  const quickInput = document.getElementById('radar-quick-input');
  const btnTrack = document.getElementById('btn-quick-track');
  const btnRefresh = document.getElementById('btn-manual-refresh');
  const autoRefreshToggle = document.getElementById('auto-refresh-toggle');

  trainSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val && val !== activeTrainNumber) {
      loadTrainStatus(val);
    }
  });

  btnTrack.addEventListener('click', () => {
    handleQuickTrack();
  });

  quickInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleQuickTrack();
    }
  });

  btnRefresh.addEventListener('click', () => {
    if (activeTrainNumber) {
      animateRefreshIcon();
      loadTrainStatus(activeTrainNumber);
    }
  });

  autoRefreshToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
      startAutoRefresh();
      showToast('Live auto-refresh enabled (15s)', 'info');
    } else {
      stopAutoRefresh();
      showToast('Live tracking auto-refresh paused', 'info');
    }
  });

  // Start auto-refresh
  startAutoRefresh();
}

function handleQuickTrack() {
  const quickInput = document.getElementById('radar-quick-input');
  const trainNum = quickInput.value.trim();
  if (!trainNum) return;

  const select = document.getElementById('radar-train-select');
  const exists = Array.from(select.options).some(opt => opt.value === trainNum);

  if (exists) {
    select.value = trainNum;
  } else {
    const newOpt = document.createElement('option');
    newOpt.value = trainNum;
    newOpt.textContent = `Train ${trainNum} - Fetching Live NTES Status...`;
    select.appendChild(newOpt);
    select.value = trainNum;
  }
  loadTrainStatus(trainNum);
}

function animateRefreshIcon() {
  const icon = document.getElementById('refresh-spinner-icon');
  if (icon) {
    icon.classList.add('fa-spin');
    setTimeout(() => icon.classList.remove('fa-spin'), 800);
  }
}

function startAutoRefresh() {
  stopAutoRefresh();
  refreshInterval = setInterval(() => {
    const toggle = document.getElementById('auto-refresh-toggle');
    if (toggle && toggle.checked && activeTrainNumber && !isFetching) {
      loadTrainStatus(activeTrainNumber);
    }
  }, 15000);
}

function stopAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}

/**
 * Fetch list of all active trains to populate dropdown
 */
async function loadTrainsList() {
  try {
    const res = await fetch('/api/radar/trains');
    const data = await res.json();

    if (!data.success || !data.trains) {
      throw new Error('Failed to load trains');
    }

    const select = document.getElementById('radar-train-select');
    select.innerHTML = '';

    data.trains.forEach((t) => {
      const opt = document.createElement('option');
      opt.value = t.train_number;
      opt.textContent = `${t.train_number} - ${t.train_name} (${t.source_code} ➔ ${t.destination_code})`;
      select.appendChild(opt);
    });

    // Check URL parameters for pre-selected train
    const urlParams = new URLSearchParams(window.location.search);
    const trainParam = urlParams.get('train');

    if (trainParam && data.trains.some(t => t.train_number === trainParam)) {
      select.value = trainParam;
      loadTrainStatus(trainParam);
    } else if (data.trains.length > 0) {
      // Default to 12302 Howrah Rajdhani or first train
      const defaultTrain = data.trains.find(t => t.train_number === '12302') || data.trains[0];
      select.value = defaultTrain.train_number;
      loadTrainStatus(defaultTrain.train_number);
    }
  } catch (err) {
    console.error('Error loading trains list:', err);
    showToast('Failed to load train running status directory', 'error');
  }
}

/**
 * Fetch and render live running status for selected train
 */
async function loadTrainStatus(trainNumber) {
  if (isFetching) return;
  isFetching = true;
  activeTrainNumber = trainNumber;

  animateRefreshIcon();

  try {
    const res = await fetch(`/api/radar/live/${encodeURIComponent(trainNumber)}`);
    const data = await res.json();

    if (!data.success) {
      throw new Error(data.message || 'Train not found');
    }

    // 1. Update Telemetry HUD
    updateTelemetryHUD(data);

    // 2. Update Train Overview Banner & Journey Bar
    updateTrainOverviewBanner(data);

    // 3. Render Station-by-Station Table
    renderStationTable(data);

  } catch (err) {
    console.error('Telemetry fetch error:', err);
    showToast(err.message || 'Could not fetch live running status', 'error');
  } finally {
    isFetching = false;
  }
}

/**
 * Update the 4 Telemetry HUD cards
 */
function updateTelemetryHUD(data) {
  // Speed
  const hudSpeed = document.getElementById('hud-speed');
  const hudSpeedSub = document.getElementById('hud-speed-sub');
  if (hudSpeed) hudSpeed.textContent = `${data.speed_kmph} km/h`;
  if (hudSpeedSub) {
    hudSpeedSub.textContent = data.speed_kmph === 0 ? 'Standing at Platform' : 'Cruising on Track';
  }

  // Status & Delay
  const hudStatus = document.getElementById('hud-status');
  const hudStatusSub = document.getElementById('hud-status-sub');
  if (hudStatus) {
    hudStatus.textContent = data.status_text;
    hudStatus.style.color = data.delay_minutes > 0 ? 'var(--secondary)' : 'var(--success)';
  }
  if (hudStatusSub) {
    hudStatusSub.textContent = data.delay_minutes === 0 ? 'Running Right Time' : `Delay: +${data.delay_minutes} mins`;
  }

  // Current Location
  const hudLocation = document.getElementById('hud-location');
  const hudCoords = document.getElementById('hud-coords');
  if (hudLocation) {
    hudLocation.textContent = data.current_location.near_station_name || 'In Transit';
    hudLocation.title = data.current_location.status_description;
  }
  if (hudCoords) {
    hudCoords.textContent = data.current_location.status_description;
  }

  // Next Station
  const hudNext = document.getElementById('hud-next-station');
  const hudNextEta = document.getElementById('hud-next-eta');
  if (hudNext) {
    hudNext.textContent = data.current_location.next_station_name || data.destination_station.name;
    hudNext.title = `Next Halt: ${data.current_location.next_station_name}`;
  }
  if (hudNextEta) {
    hudNextEta.textContent = `${data.current_location.distance_to_next_km} km away`;
  }
}

/**
 * Update Train Overview Banner & Horizontal Progress Track
 */
function updateTrainOverviewBanner(data) {
  const trainNum = document.getElementById('overview-train-num');
  const trainName = document.getElementById('overview-train-name');
  const trainType = document.getElementById('overview-train-type');
  const routeSummary = document.getElementById('overview-route-summary');
  const locationText = document.getElementById('overview-location-text');
  const lastUpdate = document.getElementById('overview-last-update');

  if (trainNum) trainNum.textContent = data.train_number;
  if (trainName) trainName.textContent = data.train_name;
  if (trainType) trainType.textContent = data.train_type || 'Superfast';

  if (routeSummary) {
    routeSummary.innerHTML = `
      <span><strong>${data.source_station.name} (${data.source_station.code})</strong></span>
      <i class="fa-solid fa-arrow-right radar-route-arrow"></i>
      <span><strong>${data.destination_station.name} (${data.destination_station.code})</strong></span>
    `;
  }

  if (locationText) {
    locationText.textContent = data.current_location.status_description;
  }
  if (lastUpdate) {
    lastUpdate.textContent = `Updated at ${data.current_location.updated_at}`;
  }

  // Update select option title with exact train name
  const select = document.getElementById('radar-train-select');
  if (select) {
    const activeOpt = Array.from(select.options).find(opt => opt.value === data.train_number);
    if (activeOpt) {
      activeOpt.textContent = `${data.train_number} - ${data.train_name} (${data.source_station.code} ➔ ${data.destination_station.code})`;
    }
  }

  // Coach Composition if available
  const coachRow = document.getElementById('overview-coach-row');
  const coachText = document.getElementById('overview-coach-text');
  if (coachRow && coachText) {
    if (data.coach_position) {
      coachRow.style.display = 'block';
      coachText.textContent = `Coach Composition: ${data.coach_position}`;
    } else {
      coachRow.style.display = 'none';
    }
  }

  // Progress Bar & Labels
  const progressBar = document.getElementById('timeline-progress-bar');
  if (progressBar) progressBar.style.width = `${data.progress_percentage}%`;

  const progressText = document.getElementById('timeline-progress-text');
  if (progressText) progressText.textContent = `${data.progress_percentage}% Journey Complete`;

  const distText = document.getElementById('timeline-dist-text');
  if (distText) distText.textContent = `${data.current_distance_km} km / ${data.total_distance_km} km`;

  const sourceName = document.getElementById('track-source-name');
  const sourceTime = document.getElementById('track-source-time');
  const destName = document.getElementById('track-dest-name');
  const destTime = document.getElementById('track-dest-time');

  const firstHalt = data.route[0] || {};
  const lastHalt = data.route[data.route.length - 1] || {};

  if (sourceName) sourceName.textContent = firstHalt.name || data.source_station.name;
  if (sourceTime) sourceTime.textContent = `Dep: ${firstHalt.sch_dep || '--:--'}`;

  if (destName) destName.textContent = lastHalt.name || data.destination_station.name;
  if (destTime) destTime.textContent = `Arr: ${lastHalt.sch_arr || '--:--'}`;

  const haltCount = document.getElementById('timeline-halt-count');
  if (haltCount) haltCount.textContent = `${data.route.length} Stations`;
}

/**
 * Render Station-by-Station Table
 */
function renderStationTable(data) {
  const tbody = document.getElementById('live-station-tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  data.route.forEach((stn, index) => {
    const tr = document.createElement('tr');
    tr.className = `station-table-row ${stn.status.toLowerCase()}`;

    let statusPill = '';
    let delayPill = '';

    if (stn.status === 'PASSED') {
      statusPill = `<span class="station-status-pill pill-passed"><i class="fa-solid fa-check"></i> Departed</span>`;
      delayPill = `<span class="delay-tag delay-passed">On Time</span>`;
    } else if (stn.status === 'CURRENT') {
      statusPill = `<span class="station-status-pill pill-current"><span class="radar-pulse-dot radar-pulse-dot-sm"></span> Current Halt</span>`;
      delayPill = stn.delay_minutes > 0
        ? `<span class="delay-tag delay-late">+${stn.delay_minutes} min Late</span>`
        : `<span class="delay-tag delay-passed">Right Time</span>`;
    } else {
      statusPill = `<span class="station-status-pill pill-upcoming"><i class="fa-regular fa-clock"></i> Upcoming</span>`;
      delayPill = `<span class="delay-tag delay-sched">Expected</span>`;
    }

    const isFirst = index === 0;
    const isLast = index === data.route.length - 1;

    tr.innerHTML = `
      <td class="radar-stn-num">${index + 1}</td>
      <td>
        <div class="radar-stn-name">
          ${stn.name}
          <span class="station-code-pill">${stn.code}</span>
        </div>
        <div class="radar-stn-city">
          ${stn.city}
        </div>
      </td>
      <td class="text-center">
        <span class="table-platform-badge">PF ${stn.platform || 1}</span>
      </td>
      <td>
        <div class="radar-stn-sch-time">
          ${isFirst ? 'Source' : stn.sch_arr}
        </div>
        <div class="radar-stn-dep">
          Dep: ${isLast ? 'Destination' : stn.sch_dep}
        </div>
      </td>
      <td>
        <div class="${stn.status === 'CURRENT' ? 'radar-stn-act-time-current' : 'radar-stn-act-time-normal'}">
          ${isFirst ? 'Source' : stn.act_arr}
        </div>
        <div class="radar-stn-dep">
          Dep: ${isLast ? 'Destination' : stn.act_dep}
        </div>
      </td>
      <td>${delayPill}</td>
      <td class="radar-stn-dist">
        ${stn.distance_km} km
      </td>
      <td class="text-center">
        ${statusPill}
      </td>
    `;

    tbody.appendChild(tr);
  });
}
