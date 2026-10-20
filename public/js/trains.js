/**
 * RAILORA - Train Search & Results Page Logic
 */

let allLoadedTrains = [];

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const from = urlParams.get('from');
  const to = urlParams.get('to');
  const date = urlParams.get('date') || new Date().toISOString().split('T')[0];
  const quota = urlParams.get('quota') || 'GENERAL';

  // Fill Modify Search inputs
  const modFrom = document.getElementById('mod-from');
  const modTo = document.getElementById('mod-to');
  const modDate = document.getElementById('mod-date');
  const modQuota = document.getElementById('mod-quota');
  const sidebarQuota = document.getElementById('sidebar-quota');

  if (modFrom && from) modFrom.value = from;
  if (modTo && to) modTo.value = to;
  if (modDate && date) modDate.value = date;
  if (modQuota && quota) modQuota.value = quota;
  if (sidebarQuota && quota) sidebarQuota.value = quota;

  if (sidebarQuota) {
    sidebarQuota.addEventListener('change', () => {
      const newQuota = sidebarQuota.value;
      const url = new URL(window.location.href);
      url.searchParams.set('quota', newQuota);
      window.location.href = url.toString();
    });
  }

  // Station Autocomplete for modify search
  const stationsDatalist = document.getElementById('modify-stations-datalist');
  if (modFrom) setupStationAutocomplete(modFrom, stationsDatalist);
  if (modTo) setupStationAutocomplete(modTo, stationsDatalist);

  // Helper to extract clean station code
  const getStationCode = (input) => {
    if (input.dataset.selectedCode) return input.dataset.selectedCode;
    const val = input.value.trim();
    const paren = val.match(/\(([A-Z]{2,6})\)/i);
    if (paren) return paren[1].toUpperCase();
    const dash = val.match(/\b([A-Z]{2,6})\s*-\s*/i) || val.match(/-\s*([A-Z]{2,6})\b/i);
    if (dash) return dash[1].toUpperCase();
    return val;
  };

  // Handle Modify Search submit
  const modForm = document.getElementById('modify-search-form');
  if (modForm) {
    modForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newFrom = getStationCode(modFrom);
      const newTo = getStationCode(modTo);
      const newDate = modDate.value;
      const newQuota = modQuota.value;

      const newParams = new URLSearchParams({
        from: newFrom,
        to: newTo,
        date: newDate,
        quota: newQuota
      });
      window.location.href = `/trains.html?${newParams.toString()}`;
    });
  }

  if (!from || !to) {
    document.getElementById('trains-list').innerHTML = `
      <div class="train-empty-box">
        <h3>Please specify source and destination stations</h3>
        <p class="train-empty-desc">Use the search form above or head back to the <a href="/" class="train-home-link">Home page</a>.</p>
      </div>
    `;
    return;
  }

  // Load and Render Search Results
  await loadTrains(from, to, date, quota);

  // Setup sidebar filter event listeners
  setupFilters();
});

async function loadTrains(from, to, date, quota) {
  const container = document.getElementById('trains-list');
  const headerSummary = document.getElementById('search-summary-title');
  const headerMeta = document.getElementById('search-summary-meta');

  container.innerHTML = `
    <div class="train-empty-box">
      <div class="train-spinner"></div>
      <p class="train-loading-text">Fetching live train availability and fares...</p>
    </div>
  `;

  try {
    const data = await fetchWithAuth(`/trains/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(date)}`);

    if (!data.success || !data.trains || data.trains.length === 0) {
      if (headerSummary) headerSummary.innerText = `${from} ➔ ${to}`;
      if (headerMeta) headerMeta.innerText = `Date: ${formatDate(date)} | 0 Trains Found`;

      container.innerHTML = `
        <div class="train-no-results-box">
          <i class="fa-solid fa-triangle-exclamation icon-svg-orange train-no-results-icon"></i>
          <h3 class="train-no-results-title">No direct trains available on this route</h3>
          <p class="train-no-results-desc">Try searching between major terminals like New Delhi (NDLS), Mumbai Central (BCT), Howrah (HWH), or Varanasi (BSB).</p>
          <a href="/" class="btn btn-primary btn-sm">Try Another Route</a>
        </div>
      `;
      return;
    }

    allLoadedTrains = data.trains;

    if (headerSummary) {
      headerSummary.innerHTML = `
        <span>${data.query.source.name} (${data.query.source.code})</span>
        <i class="fa-solid fa-arrow-right icon-svg-white train-search-arrow"></i>
        <span>${data.query.destination.name} (${data.query.destination.code})</span>
      `;
    }

    if (headerMeta) {
      headerMeta.innerHTML = `
        <span><strong>Date:</strong> ${formatDate(date)}</span>
        <span>•</span>
        <span><strong>Quota:</strong> ${quota}</span>
        <span>•</span>
        <span><strong>${data.count}</strong> Trains Available</span>
      `;
    }

    renderTrainList(allLoadedTrains, date, quota);
  } catch (err) {
    container.innerHTML = `
      <div class="train-error-box">
        <h3 class="train-error-title">Error searching trains</h3>
        <p class="train-error-desc">${err.message}</p>
        <button onclick="location.reload()" class="btn btn-outline btn-sm train-btn-try-again">Try Again</button>
      </div>
    `;
  }
}

function renderTrainList(trains, date, quota) {
  const container = document.getElementById('trains-list');
  if (trains.length === 0) {
    container.innerHTML = `
      <div class="train-filter-empty-box">
        <h3>No trains match the selected filters</h3>
        <p class="train-filter-empty-desc">Try clearing some filters on the left sidebar.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = trains.map(train => {
    return `
      <div class="train-card" id="train-card-${train.id}">
        <!-- Train Header -->
        <div class="train-card-header">
          <div class="train-identity">
            <span class="train-badge-num">${train.train_number}</span>
            <h3 class="train-title-name">${train.train_name}</h3>
            <span class="train-type-pill">${train.train_type}</span>
          </div>
          <div class="train-days train-days-cluster">
            <span>Runs On: <strong>${train.runs_on}</strong></span>
            ${train.live_status ? `
              <span class="station-status-pill ${train.live_delay_minutes > 0 ? 'pill-current' : 'pill-passed'} station-status-pill-compact" title="Live Location: ${train.live_current_station || 'In Transit'}">
                <span class="radar-pulse-dot radar-pulse-dot-sm"></span>
                ${train.live_status}
              </span>
            ` : ''}
            <a href="/radar.html?train=${train.train_number}" class="btn btn-outline btn-sm train-btn-radar">
              <i class="fa-solid fa-tower-broadcast icon-secondary"></i> Running Status
            </a>
          </div>
        </div>

        <!-- Train Body & Schedule -->
        <div class="train-card-body">
          <div class="train-schedule-row">
            <div class="station-time-block">
              <div class="time-lg">${formatTime(train.departure_time)}</div>
              <div class="station-code-name">${train.source_city} (${train.source_code})</div>
              <div class="station-subtext">${train.source_name}</div>
            </div>

            <div class="journey-duration-bar">
              <div class="duration-text">${train.duration}</div>
              <div class="duration-line"></div>
              <div class="train-direct-service">Direct Service</div>
            </div>

            <div class="station-time-block dest">
              <div class="time-lg">${formatTime(train.arrival_time)}</div>
              <div class="station-code-name">${train.dest_city} (${train.dest_code})</div>
              <div class="station-subtext">${train.dest_name}</div>
            </div>
          </div>

          <!-- Travel Classes & Real-Time Seat Availability -->
          <div class="train-classes-header">
            <div class="train-classes-title">Select Travel Class & Availability</div>
            <div class="classes-grid">
              ${train.classes.map(cls => {
                const statusClass = cls.is_available ? 'status-avl' : 'status-wl';
                return `
                  <div class="class-card-item">
                    <div class="class-top-row">
                      <span class="class-code-tag">${cls.class_code}</span>
                      <span class="class-fare-tag">₹${cls.base_fare}</span>
                    </div>
                    <div class="train-class-name">${cls.class_name}</div>
                    <div>
                      <span class="seat-status-badge ${statusClass}">
                        ${cls.status_label}
                      </span>
                    </div>
                    <button class="book-class-btn" onclick="startBooking(${train.id}, '${cls.class_code}', '${date}', '${quota}')">
                      Book Now
                    </button>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function startBooking(trainId, classCode, date, quota) {
  // If not logged in, prompt login
  if (!getToken()) {
    showToast('Please sign in or create an account to book tickets.', 'info');
    setTimeout(() => {
      window.location.href = `/login.html?redirect=${encodeURIComponent(`/book.html?train_id=${trainId}&class_code=${classCode}&date=${date}&quota=${quota}`)}`;
    }, 700);
    return;
  }

  // Redirect to Book page
  window.location.href = `/book.html?train_id=${trainId}&class_code=${classCode}&date=${date}&quota=${quota}`;
}

function setupFilters() {
  const typeCheckboxes = document.querySelectorAll('.filter-type');
  const classCheckboxes = document.querySelectorAll('.filter-class');

  const applyFilters = () => {
    const selectedTypes = Array.from(typeCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
    const selectedClasses = Array.from(classCheckboxes).filter(cb => cb.checked).map(cb => cb.value);

    const filtered = allLoadedTrains.filter(train => {
      const matchType = selectedTypes.length === 0 || selectedTypes.includes(train.train_type);
      const matchClass = selectedClasses.length === 0 || train.classes.some(c => selectedClasses.includes(c.class_code));
      return matchType && matchClass;
    });

    const urlParams = new URLSearchParams(window.location.search);
    const date = urlParams.get('date') || new Date().toISOString().split('T')[0];
    const quota = urlParams.get('quota') || 'GENERAL';

    renderTrainList(filtered, date, quota);
  };

  typeCheckboxes.forEach(cb => cb.addEventListener('change', applyFilters));
  classCheckboxes.forEach(cb => cb.addEventListener('change', applyFilters));
}
