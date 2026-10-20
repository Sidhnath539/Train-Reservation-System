/**
 * RAILORA - Admin Control Center & System Management
 */

let allAdminTrains = [];
let allAdminStations = [];

document.addEventListener('DOMContentLoaded', async () => {
  const user = getUser();
  if (!user || user.role !== 'admin') {
    showToast('Restricted Area: Administrator access required.', 'error');
    setTimeout(() => {
      window.location.href = '/login.html?redirect=/admin.html';
    }, 800);
    return;
  }

  // Load Station options for Add Train Modal
  await loadStationsDropdown();

  // Load Stats & Data
  await loadDashboardStats();
  await loadTrainsTable();
  await loadBookingsTable();

  // Event listener for Add Train Modal
  const openModalBtn = document.getElementById('btn-open-add-train');
  if (openModalBtn) {
    openModalBtn.addEventListener('click', openAddTrainModal);
  }

  const addTrainForm = document.getElementById('add-train-form');
  if (addTrainForm) {
    addTrainForm.addEventListener('submit', handleAddTrainSubmit);
  }

  // Search & Filters for Bookings
  const bookingSearchInput = document.getElementById('admin-booking-search');
  const bookingStatusFilter = document.getElementById('admin-booking-status');

  if (bookingSearchInput) {
    bookingSearchInput.addEventListener('input', debounce(() => {
      loadBookingsTable(bookingStatusFilter?.value, bookingSearchInput.value);
    }, 300));
  }

  if (bookingStatusFilter) {
    bookingStatusFilter.addEventListener('change', () => {
      loadBookingsTable(bookingStatusFilter.value, bookingSearchInput?.value);
    });
  }
});

async function loadDashboardStats() {
  try {
    const data = await fetchWithAuth('/admin/stats');
    if (data.success && data.stats) {
      const s = data.stats;
      document.getElementById('stat-trains').innerText = s.total_trains;
      document.getElementById('stat-bookings').innerText = s.total_bookings;
      document.getElementById('stat-confirmed').innerText = s.confirmed_bookings;
      document.getElementById('stat-revenue').innerText = formatCurrency(s.total_revenue);
    }
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

async function loadStationsDropdown() {
  try {
    const data = await fetchWithAuth('/trains/stations');
    if (data.success && data.stations) {
      allAdminStations = data.stations;
      const srcSelect = document.getElementById('train-source-station');
      const dstSelect = document.getElementById('train-dest-station');

      if (srcSelect && dstSelect) {
        srcSelect.innerHTML = '<option value="">Select Departure Station</option>';
        dstSelect.innerHTML = '<option value="">Select Destination Station</option>';

        data.stations.forEach(st => {
          const opt1 = `<option value="${st.id}">${st.code} - ${st.name} (${st.city})</option>`;
          const opt2 = `<option value="${st.id}">${st.code} - ${st.name} (${st.city})</option>`;
          srcSelect.insertAdjacentHTML('beforeend', opt1);
          dstSelect.insertAdjacentHTML('beforeend', opt2);
        });
      }
    }
  } catch (err) {
    console.error('Failed to load stations:', err);
  }
}

async function loadTrainsTable() {
  const tbody = document.getElementById('admin-trains-tbody');
  tbody.innerHTML = '<tr><td colspan="7" class="table-empty-cell">Loading trains schedule...</td></tr>';

  try {
    const data = await fetchWithAuth('/admin/trains');
    allAdminTrains = data.trains || [];

    if (allAdminTrains.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="table-empty-cell">No trains configured yet.</td></tr>';
      return;
    }

    tbody.innerHTML = allAdminTrains.map(t => {
      const classesList = t.classes.map(c => `${c.class_code} (₹${c.base_fare})`).join(', ');
      return `
        <tr>
          <td><strong class="admin-train-num">${t.train_number}</strong></td>
          <td>
            <strong>${t.train_name}</strong>
            <div class="admin-text-sub">${t.train_type}</div>
          </td>
          <td>${t.source_city} (${t.source_code}) ➔ ${t.dest_city} (${t.dest_code})</td>
          <td>${formatTime(t.departure_time)} - ${formatTime(t.arrival_time)} (${t.duration})</td>
          <td><span class="admin-classes-badge">${classesList}</span></td>
          <td><span class="badge ${t.status === 'Active' ? 'badge-active' : 'badge-can'}">${t.status}</span></td>
          <td>
            <button onclick="deleteTrain(${t.id}, '${t.train_number}')" class="btn btn-outline btn-sm btn-delete-train">
              <i class="fa-solid fa-trash-can icon-svg-danger btn-delete-icon"></i>
              Delete
            </button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="table-error-cell">Error: ${err.message}</td></tr>`;
  }
}

async function loadBookingsTable(status = 'ALL', search = '') {
  const tbody = document.getElementById('admin-bookings-tbody');
  tbody.innerHTML = '<tr><td colspan="8" class="table-empty-cell">Fetching system bookings...</td></tr>';

  try {
    const query = new URLSearchParams();
    if (status && status !== 'ALL') query.append('status', status);
    if (search) query.append('search', search);

    const data = await fetchWithAuth(`/admin/bookings?${query.toString()}`);
    const bookings = data.bookings || [];

    if (bookings.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="table-empty-cell">No booking records match this query.</td></tr>';
      return;
    }

    tbody.innerHTML = bookings.map(b => {
      const badgeClass = b.booking_status === 'CONFIRMED' ? 'badge-cnf' : (b.booking_status === 'CANCELLED' ? 'badge-can' : 'badge-wl');
      return `
        <tr>
          <td><strong class="text-mono">${b.pnr_number}</strong></td>
          <td>
            <strong>${b.user_name}</strong>
            <div class="admin-text-sub">${b.user_email}</div>
          </td>
          <td>${b.train_number} - ${b.train_name}</td>
          <td>${b.source_code} ➔ ${b.dest_code}</td>
          <td>${formatDate(b.journey_date)}</td>
          <td><strong>${b.class_code}</strong> (${b.total_passengers} Pax)</td>
          <td><strong>${formatCurrency(b.total_fare)}</strong></td>
          <td><span class="badge ${badgeClass}">${b.booking_status}</span></td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="table-error-cell">Error: ${err.message}</td></tr>`;
  }
}

function openAddTrainModal() {
  const modal = document.getElementById('add-train-modal');
  if (modal) modal.classList.add('active');
}

function closeAddTrainModal() {
  const modal = document.getElementById('add-train-modal');
  if (modal) modal.classList.remove('active');
}

async function handleAddTrainSubmit(e) {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerText = 'Creating Train Route...';

  try {
    const payload = {
      train_number: document.getElementById('train-number').value.trim(),
      train_name: document.getElementById('train-name').value.trim(),
      source_station_id: parseInt(document.getElementById('train-source-station').value, 10),
      destination_station_id: parseInt(document.getElementById('train-dest-station').value, 10),
      departure_time: document.getElementById('train-dep-time').value,
      arrival_time: document.getElementById('train-arr-time').value,
      duration: document.getElementById('train-duration').value.trim(),
      train_type: document.getElementById('train-type').value,
      runs_on: document.getElementById('train-runs-on').value.trim(),
      classes: [
        { class_code: '3A', class_name: 'AC 3 Tier', total_seats: 64, base_fare: parseFloat(document.getElementById('fare-3a').value) || 1450 },
        { class_code: '2A', class_name: 'AC 2 Tier', total_seats: 48, base_fare: parseFloat(document.getElementById('fare-2a').value) || 2150 },
        { class_code: 'SL', class_name: 'Sleeper Class', total_seats: 80, base_fare: parseFloat(document.getElementById('fare-sl').value) || 480 }
      ]
    };

    const res = await fetchWithAuth('/admin/trains', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    closeAddTrainModal();
    showToast(res.message, 'success');
    e.target.reset();

    // Reload stats and trains
    await loadDashboardStats();
    await loadTrainsTable();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = 'Add Train';
  }
}

async function deleteTrain(id, number) {
  if (!confirm(`Are you sure you want to permanently delete Train #${number}? This will also remove associated classes and future schedules.`)) {
    return;
  }

  try {
    const res = await fetchWithAuth(`/admin/trains/${id}`, {
      method: 'DELETE'
    });
    showToast(res.message, 'success');
    await loadDashboardStats();
    await loadTrainsTable();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
