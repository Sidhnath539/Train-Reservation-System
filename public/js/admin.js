/**
 * ============================================================================
 * RAILORA - ADMIN CONTROL CENTER & SYSTEM MANAGEMENT SCRIPT
 * File: public/js/admin.js
 * Description: Client-side operations for administrator telemetry, train catalog,
 *              passenger manifest, and simulated financial ledger.
 * Level: Beginner-Friendly / Educational
 * ============================================================================
 */

let allAdminTrains = [];
let allAdminStations = [];

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Enforce admin role authentication
  const user = getUser();
  if (!user || user.role !== 'admin') {
    showToast('Restricted Area: Administrator access required.', 'error');
    setTimeout(() => {
      window.location.href = '/login.html?redirect=/admin.html';
    }, 800);
    return;
  }

  // 2. Initialize Tab Switching
  initAdminTabs();

  // 3. Load Stations for dropdown selection
  await loadStationsDropdown();

  // 4. Load initial overview metrics and tables
  await loadDashboardStats();
  await loadTrainsTable();
  await loadBookingsTable();

  // 5. Attach Add Train Modal Events
  const openModalBtn = document.getElementById('btn-open-add-train');
  if (openModalBtn) {
    openModalBtn.addEventListener('click', openAddTrainModal);
  }

  const addTrainForm = document.getElementById('add-train-form');
  if (addTrainForm) {
    addTrainForm.addEventListener('submit', handleAddTrainSubmit);
  }

  // 6. Search & Filters for Bookings
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

  // 7. Search filter for Trains
  const trainSearchInput = document.getElementById('admin-train-search');
  if (trainSearchInput) {
    trainSearchInput.addEventListener('input', () => {
      renderTrainsTable(trainSearchInput.value.trim().toLowerCase());
    });
  }
});

/**
 * Tab Navigation Controller
 */
function initAdminTabs() {
  const tabBtns = document.querySelectorAll('.admin-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const targetId = btn.getAttribute('data-tab');

      // Update button active state
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update pane active state
      document.querySelectorAll('.admin-tab-pane').forEach(pane => {
        pane.classList.remove('active');
      });
      const activePane = document.getElementById(targetId);
      if (activePane) activePane.classList.add('active');

      // Lazy load tab data on click
      if (targetId === 'tab-payments') {
        await loadPaymentsTable();
      } else if (targetId === 'tab-refunds') {
        await loadRefundsTable();
      } else if (targetId === 'tab-users') {
        await loadUsersTable();
      } else if (targetId === 'tab-messages') {
        await loadMessagesTable();
      }
    });
  });
}

/**
 * 1. Load Dashboard KPI Metrics & Recent Activity
 */
async function loadDashboardStats() {
  try {
    const data = await fetchWithAuth('/admin/stats');
    if (data.success && data.stats) {
      const s = data.stats;
      document.getElementById('stat-trains').innerText = s.total_trains || 0;
      document.getElementById('stat-stations').innerText = s.total_stations || 0;
      document.getElementById('stat-users').innerText = s.total_users || 0;
      document.getElementById('stat-bookings').innerText = s.total_bookings || 0;
      document.getElementById('stat-confirmed').innerText = s.confirmed_bookings || 0;
      document.getElementById('stat-revenue').innerText = formatCurrency(s.total_revenue || 0);

      // Render recent bookings feed
      const tbody = document.getElementById('recent-bookings-tbody');
      if (tbody && Array.isArray(s.recent_bookings)) {
        if (s.recent_bookings.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" class="table-empty-cell">No recent reservations recorded.</td></tr>';
        } else {
          tbody.innerHTML = s.recent_bookings.map(b => `
            <tr>
              <td><strong>${escapeHtml(b.pnr_number)}</strong></td>
              <td>${escapeHtml(b.user_name || 'Passenger')}</td>
              <td>${escapeHtml(b.train_number)} - ${escapeHtml(b.train_name)}</td>
              <td>${formatDate(b.journey_date)}</td>
              <td><strong>${formatCurrency(b.total_fare)}</strong></td>
              <td><span class="badge ${b.booking_status === 'CONFIRMED' ? 'badge-confirmed' : 'badge-can'}">${escapeHtml(b.booking_status)}</span></td>
            </tr>
          `).join('');
        }
      }
    }
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

/**
 * 2. Load Stations Dropdown for Adding Train
 */
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
          const opt = `<option value="${st.id}">${escapeHtml(st.code)} - ${escapeHtml(st.name)} (${escapeHtml(st.city)})</option>`;
          srcSelect.insertAdjacentHTML('beforeend', opt);
          dstSelect.insertAdjacentHTML('beforeend', opt);
        });
      }
    }
  } catch (err) {
    console.error('Failed to load stations:', err);
  }
}

/**
 * 3. Load & Render Trains Table
 */
async function loadTrainsTable() {
  const tbody = document.getElementById('admin-trains-tbody');
  tbody.innerHTML = '<tr><td colspan="7" class="table-empty-cell">Loading trains schedule...</td></tr>';

  try {
    const data = await fetchWithAuth('/admin/trains');
    allAdminTrains = data.trains || [];
    renderTrainsTable('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="table-error-cell">Error: ${err.message}</td></tr>`;
  }
}

function renderTrainsTable(filterText = '') {
  const tbody = document.getElementById('admin-trains-tbody');
  if (!tbody) return;

  const filtered = allAdminTrains.filter(t => {
    if (!filterText) return true;
    return (
      (t.train_number || '').toLowerCase().includes(filterText) ||
      (t.train_name || '').toLowerCase().includes(filterText) ||
      (t.source_city || '').toLowerCase().includes(filterText) ||
      (t.dest_city || '').toLowerCase().includes(filterText)
    );
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="table-empty-cell">No trains matched your search.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(t => {
    const classesList = (t.classes || []).map(c => `${c.class_code} (₹${c.base_fare})`).join(', ') || '3A, 2A, SL';
    return `
      <tr>
        <td><strong class="admin-train-num">${escapeHtml(t.train_number)}</strong></td>
        <td>
          <strong>${escapeHtml(t.train_name)}</strong>
          <div class="admin-text-sub">${escapeHtml(t.train_type)}</div>
        </td>
        <td>${escapeHtml(t.source_city)} (${escapeHtml(t.source_code)}) ➔ ${escapeHtml(t.dest_city)} (${escapeHtml(t.dest_code)})</td>
        <td>${formatTime(t.departure_time)} - ${formatTime(t.arrival_time)} (${escapeHtml(t.duration)})</td>
        <td><span class="admin-classes-badge">${escapeHtml(classesList)}</span></td>
        <td><span class="badge ${t.status === 'Active' ? 'badge-active' : 'badge-can'}">${escapeHtml(t.status || 'Active')}</span></td>
        <td>
          <button type="button" onclick="deleteTrain(${t.id}, '${escapeHtml(t.train_number)}')" class="btn btn-outline btn-sm btn-delete-train">
            <i class="fa-solid fa-trash-can icon-svg-danger btn-delete-icon"></i> Delete
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * 4. Load Bookings Manifest Table
 */
async function loadBookingsTable(status = 'ALL', search = '') {
  const tbody = document.getElementById('admin-bookings-tbody');
  tbody.innerHTML = '<tr><td colspan="8" class="table-empty-cell">Fetching reservation records...</td></tr>';

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

    tbody.innerHTML = bookings.map(b => `
      <tr>
        <td><strong>${escapeHtml(b.pnr_number)}</strong></td>
        <td>
          <div>${escapeHtml(b.user_name || 'Passenger')}</div>
          <div class="admin-text-sub">${escapeHtml(b.user_email || '')}</div>
        </td>
        <td><strong>${escapeHtml(b.train_number)}</strong> - ${escapeHtml(b.train_name)}</td>
        <td>${escapeHtml(b.source_code)} ➔ ${escapeHtml(b.dest_code)}</td>
        <td>${formatDate(b.journey_date)}</td>
        <td><span class="badge-method">${escapeHtml(b.class_code)}</span></td>
        <td><strong>${formatCurrency(b.total_fare)}</strong></td>
        <td>
          <span class="badge ${b.booking_status === 'CONFIRMED' ? 'badge-confirmed' : (b.booking_status === 'CANCELLED' ? 'badge-can' : 'badge-rac')}">
            ${escapeHtml(b.booking_status)}
          </span>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="table-error-cell">Error: ${err.message}</td></tr>`;
  }
}

/**
 * 5. Load Simulated Payments Ledger
 */
async function loadPaymentsTable() {
  const tbody = document.getElementById('admin-payments-tbody');
  tbody.innerHTML = '<tr><td colspan="7" class="table-empty-cell">Fetching demo payments ledger...</td></tr>';

  try {
    const data = await fetchWithAuth('/admin/payments');
    const payments = data.payments || [];

    if (payments.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="table-empty-cell">No payment transactions recorded yet.</td></tr>';
      return;
    }

    tbody.innerHTML = payments.map(p => `
      <tr>
        <td><code>${escapeHtml(p.transaction_id)}</code></td>
        <td><strong>${escapeHtml(p.pnr_number || '--')}</strong></td>
        <td>
          <div>${escapeHtml(p.user_name || 'Passenger')}</div>
          <div class="admin-text-sub">${escapeHtml(p.user_email || '')}</div>
        </td>
        <td><span class="badge-method">${escapeHtml(p.payment_method)}</span></td>
        <td><strong>${formatCurrency(p.amount)}</strong></td>
        <td>
          <span class="badge ${p.payment_status === 'SUCCESS' ? 'badge-confirmed' : 'badge-can'}">
            ${escapeHtml(p.payment_status)}
          </span>
        </td>
        <td>${formatDate(p.created_at)}</td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="table-error-cell">Error: ${err.message}</td></tr>`;
  }
}

/**
 * 6. Load Simulated Refunds Ledger
 */
async function loadRefundsTable() {
  const tbody = document.getElementById('admin-refunds-tbody');
  tbody.innerHTML = '<tr><td colspan="7" class="table-empty-cell">Fetching demo refunds ledger...</td></tr>';

  try {
    const data = await fetchWithAuth('/admin/refunds');
    const refunds = data.refunds || [];

    if (refunds.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="table-empty-cell">No cancellation refund records yet.</td></tr>';
      return;
    }

    tbody.innerHTML = refunds.map(r => `
      <tr>
        <td><code>${escapeHtml(r.refund_reference)}</code></td>
        <td><strong>${escapeHtml(r.pnr_number || '--')}</strong></td>
        <td>
          <div>${escapeHtml(r.user_name || 'Passenger')}</div>
          <div class="admin-text-sub">${escapeHtml(r.user_email || '')}</div>
        </td>
        <td>${formatCurrency(r.cancellation_charge || 0)}</td>
        <td><strong style="color: #16a34a;">${formatCurrency(r.refund_amount)}</strong></td>
        <td><span class="badge badge-active">${escapeHtml(r.refund_status || 'PROCESSED')}</span></td>
        <td>${formatDate(r.processed_at)}</td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="table-error-cell">Error: ${err.message}</td></tr>`;
  }
}

/**
 * 7. Load Registered Users Directory
 */
async function loadUsersTable() {
  const tbody = document.getElementById('admin-users-tbody');
  tbody.innerHTML = '<tr><td colspan="7" class="table-empty-cell">Loading users list...</td></tr>';

  try {
    const data = await fetchWithAuth('/admin/users');
    const users = data.users || [];

    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="table-empty-cell">No users registered in system.</td></tr>';
      return;
    }

    tbody.innerHTML = users.map(u => `
      <tr>
        <td>#${u.id}</td>
        <td><strong>${escapeHtml(u.name)}</strong></td>
        <td>${escapeHtml(u.email)}</td>
        <td>${escapeHtml(u.phone || '--')}</td>
        <td><span class="badge-role ${u.role === 'admin' ? 'badge-role-admin' : 'badge-role-user'}">${escapeHtml(u.role)}</span></td>
        <td><strong>${u.total_bookings || 0}</strong></td>
        <td>${formatDate(u.created_at)}</td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="table-error-cell">Error: ${err.message}</td></tr>`;
  }
}

/**
 * 8. Load Passenger Helpdesk & Grievances
 */
async function loadMessagesTable() {
  const tbody = document.getElementById('admin-messages-tbody');
  tbody.innerHTML = '<tr><td colspan="7" class="table-empty-cell">Loading support messages...</td></tr>';

  try {
    const data = await fetchWithAuth('/admin/messages');
    const messages = data.messages || [];

    if (messages.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="table-empty-cell">No passenger grievance tickets received.</td></tr>';
      return;
    }

    tbody.innerHTML = messages.map(m => `
      <tr>
        <td><strong>TKT-${m.id}</strong></td>
        <td>${escapeHtml(m.name)}</td>
        <td>
          <div>${escapeHtml(m.email)}</div>
          <div class="admin-text-sub">${escapeHtml(m.phone || '')}</div>
        </td>
        <td><span class="badge-method">${escapeHtml(m.category || 'General')}</span></td>
        <td>
          <strong>${escapeHtml(m.subject)}</strong>
          <div class="admin-text-sub">${escapeHtml((m.message || '').substring(0, 60))}...</div>
        </td>
        <td><span class="badge ${m.status === 'NEW' ? 'badge-rac' : 'badge-confirmed'}">${escapeHtml(m.status || 'NEW')}</span></td>
        <td>${formatDate(m.created_at)}</td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="table-error-cell">Error: ${err.message}</td></tr>`;
  }
}

/**
 * Add Train Modal Controller & Submission
 */
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

  const payload = {
    train_number: document.getElementById('train-number').value.trim(),
    train_name: document.getElementById('train-name').value.trim(),
    source_station_id: document.getElementById('train-source-station').value,
    destination_station_id: document.getElementById('train-dest-station').value,
    departure_time: document.getElementById('train-dep-time').value,
    arrival_time: document.getElementById('train-arr-time').value,
    duration: document.getElementById('train-duration').value.trim(),
    train_type: document.getElementById('train-type').value,
    runs_on: document.getElementById('train-runs-on').value.trim(),
    classes: [
      { class_code: '3A', class_name: 'AC 3 Tier (3A)', total_seats: 64, base_fare: parseFloat(document.getElementById('fare-3a').value) || 1450 },
      { class_code: '2A', class_name: 'AC 2 Tier (2A)', total_seats: 48, base_fare: parseFloat(document.getElementById('fare-2a').value) || 2150 },
      { class_code: 'SL', class_name: 'Sleeper Class (SL)', total_seats: 72, base_fare: parseFloat(document.getElementById('fare-sl').value) || 480 }
    ]
  };

  if (payload.source_station_id === payload.destination_station_id) {
    showToast('Source and Destination stations cannot be identical.', 'error');
    return;
  }

  try {
    const res = await fetchWithAuth('/admin/trains', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res.success) {
      showToast(`Train ${payload.train_number} added successfully!`, 'success');
      closeAddTrainModal();
      document.getElementById('add-train-form').reset();
      await loadTrainsTable();
      await loadDashboardStats();
    } else {
      showToast(res.message || 'Failed to add train.', 'error');
    }
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  }
}

/**
 * Delete Train Action
 */
async function deleteTrain(trainId, trainNumber) {
  if (!confirm(`Are you sure you want to delete Train ${trainNumber}? This will remove associated schedules and classes.`)) {
    return;
  }

  try {
    const res = await fetchWithAuth(`/admin/trains/${trainId}`, {
      method: 'DELETE'
    });

    if (res.success) {
      showToast(`Train ${trainNumber} has been removed.`, 'success');
      await loadTrainsTable();
      await loadDashboardStats();
    } else {
      showToast(res.message || 'Failed to delete train.', 'error');
    }
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  }
}

/**
 * Helper: Debounce input
 */
function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
