/**
 * RAILORA - Booking & Passenger Allocation Logic
 */

let selectedTrain = null;
let selectedClass = null;
let journeyDate = null;
let quotaType = 'GENERAL';
let passengerCount = 1;
let currentAvailabilityData = null;
let isAvailabilityLoading = false;

document.addEventListener('DOMContentLoaded', async () => {
  // Enforce Login
  if (!getToken()) {
    showToast('Please log in to proceed with booking.', 'warning');
    const returnUrl = encodeURIComponent(window.location.search ? `/book.html${window.location.search}` : '/book.html');
    setTimeout(() => {
      window.location.href = `/login.html?redirect=${returnUrl}`;
    }, 600);
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const trainId = urlParams.get('train_id');
  const classCode = urlParams.get('class_code');
  journeyDate = urlParams.get('date') || new Date().toISOString().split('T')[0];
  quotaType = urlParams.get('quota') || 'GENERAL';

  if (!trainId || !classCode) {
    showToast('Invalid booking parameters. Redirecting to train search.', 'warning');
    setTimeout(() => window.location.href = '/trains.html', 1000);
    return;
  }

  await loadBookingContext(trainId, classCode);

  // Setup Add Passenger button
  const addBtn = document.getElementById('btn-add-passenger');
  if (addBtn) {
    addBtn.addEventListener('click', addPassengerRow);
  }

  // Setup Recheck Availability button
  const recheckBtn = document.getElementById('btn-recheck-avail');
  if (recheckBtn) {
    recheckBtn.addEventListener('click', () => checkSeatAvailability(true));
  }

  // Setup Availability Card Collapse Toggle
  const toggleCardBtn = document.getElementById('btn-toggle-avail-card');
  if (toggleCardBtn) {
    toggleCardBtn.addEventListener('click', toggleAvailabilityCard);
  }

  // Setup Form Submission & Payment Modal
  const bookingForm = document.getElementById('booking-form');
  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      openPaymentModal();
    });
  }

  // Confirm Payment in Modal
  const confirmPayBtn = document.getElementById('btn-confirm-pay');
  if (confirmPayBtn) {
    confirmPayBtn.addEventListener('click', processBookingSubmission);
  }
});

async function loadBookingContext(trainId, classCode) {
  try {
    const data = await fetchWithAuth(`/trains/${trainId}?date=${journeyDate}`);
    if (!data.success || !data.train) {
      throw new Error('Train information could not be retrieved.');
    }

    selectedTrain = data.train;
    selectedClass = selectedTrain.classes.find(c => c.class_code === classCode);

    if (!selectedClass) {
      throw new Error(`Class ${classCode} is not available on this train.`);
    }

    // Render Train Summary
    document.getElementById('summary-train-title').innerText = `${selectedTrain.train_number} - ${selectedTrain.train_name}`;
    document.getElementById('summary-route').innerText = `${selectedTrain.source_city} (${selectedTrain.source_code}) ➔ ${selectedTrain.dest_city} (${selectedTrain.dest_code})`;
    document.getElementById('summary-date').innerText = formatDate(journeyDate);
    document.getElementById('summary-class').innerText = `${selectedClass.class_name} (${selectedClass.class_code})`;
    document.getElementById('summary-quota').innerText = quotaType;

    const sidebarQuota = document.getElementById('sidebar-quota-pill');
    if (sidebarQuota) sidebarQuota.innerText = quotaType;

    updateFareBreakdown();

    // Perform real-time seat availability check
    await checkSeatAvailability(false);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function checkSeatAvailability(isUserTriggered = false) {
  if (!selectedTrain || !selectedClass) return;

  const activeRows = document.querySelectorAll('.passenger-row');
  const currentCount = Math.max(1, activeRows.length);
  passengerCount = currentCount;

  const refreshSpinner = document.getElementById('avail-refresh-spinner');
  if (refreshSpinner) {
    refreshSpinner.classList.add('fa-spin');
  }

  try {
    isAvailabilityLoading = true;
    const url = `/trains/${selectedTrain.id}/availability?class_code=${encodeURIComponent(selectedClass.class_code)}&date=${encodeURIComponent(journeyDate)}&passengers=${passengerCount}&quota=${encodeURIComponent(quotaType)}`;
    const data = await fetchWithAuth(url);

    if (!data || !data.success) {
      throw new Error((data && data.message) || 'Failed to check live seat availability.');
    }

    currentAvailabilityData = data;
    renderSeatAvailabilityUI(data);

    if (isUserTriggered) {
      showToast(`Live availability verified: ${data.selected.status_label}`, 'success');
    }
  } catch (err) {
    console.error('Seat availability check error:', err);
    if (isUserTriggered) {
      showToast(err.message, 'error');
    }
  } finally {
    isAvailabilityLoading = false;
    if (refreshSpinner) {
      refreshSpinner.classList.remove('fa-spin');
    }
  }
}

function renderSeatAvailabilityUI(data) {
  const sel = data.selected;
  if (!sel) return;

  // 1. Summary banner availability badge
  const availBadge = document.getElementById('summary-availability');
  if (availBadge) {
    availBadge.className = `badge ${sel.badge_class} summary-avail-badge`;
    availBadge.innerText = sel.status_label;
  }

  // 2. Last updated timestamp
  const lastUpdatedEl = document.getElementById('avail-last-updated');
  if (lastUpdatedEl) {
    lastUpdatedEl.innerText = `Verified at ${data.timestamp} • Live PRS Feed`;
  }

  // 3. Passenger impact feedback banner
  const feedbackBox = document.getElementById('avail-passenger-feedback');
  const feedbackIcon = document.getElementById('avail-feedback-icon');
  const feedbackTitle = document.getElementById('avail-feedback-title');
  const feedbackDesc = document.getElementById('avail-feedback-desc');
  const chanceVal = document.getElementById('avail-chance-val');

  if (feedbackBox && feedbackTitle && feedbackDesc) {
    feedbackBox.className = `avail-passenger-feedback feedback-${sel.badge_class.replace('badge-', '')}`;
    
    if (sel.passenger_status === 'CONFIRMED') {
      feedbackIcon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
      feedbackTitle.innerText = `${passengerCount} Passenger${passengerCount > 1 ? 's' : ''} - Confirmed Berths Available`;
    } else if (sel.passenger_status === 'PARTIAL_WAITLIST') {
      feedbackIcon.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i>';
      feedbackTitle.innerText = `Partial Berth Availability (${sel.available_seats} Confirmed / ${passengerCount - sel.available_seats} Waitlisted)`;
    } else {
      feedbackIcon.innerHTML = '<i class="fa-solid fa-clock-rotate-left"></i>';
      feedbackTitle.innerText = `${passengerCount} Passenger${passengerCount > 1 ? 's' : ''} - Waitlisted Booking`;
    }

    feedbackDesc.innerText = sel.passenger_message;
    if (chanceVal) chanceVal.innerText = sel.confirmation_chance;
  }

  // 4. Quick stats grid
  const statAvail = document.getElementById('stat-avail-seats');
  const statTotal = document.getElementById('stat-total-seats');
  const statWait = document.getElementById('stat-waitlist-seats');
  const statQuota = document.getElementById('stat-quota-type');

  if (statAvail) {
    statAvail.innerText = sel.available_seats;
    statAvail.className = `avail-stat-value ${sel.available_seats > 0 ? 'text-cnf' : 'text-danger'}`;
  }
  if (statTotal) statTotal.innerText = sel.total_seats;
  if (statWait) statWait.innerText = sel.waiting_seats > 0 ? `WL ${sel.waiting_seats}` : 'None';
  if (statQuota) statQuota.innerText = sel.quota;

  // 5. Sidebar live status box
  const sideBadge = document.getElementById('sidebar-avail-badge');
  const sideChance = document.getElementById('sidebar-chance-text');
  const sideNote = document.getElementById('sidebar-avail-note');

  if (sideBadge) {
    sideBadge.className = `badge ${sel.badge_class}`;
    sideBadge.innerText = sel.status_label;
  }
  if (sideChance) {
    sideChance.innerText = sel.confirmation_chance;
  }
  if (sideNote) {
    sideNote.innerText = sel.passenger_status === 'CONFIRMED'
      ? `All ${passengerCount} passenger(s) qualify for instant CNF allocation.`
      : `Seats are waitlisted. Priority PRS clearance queue applies.`;
  }

  // 6. Class availability chips
  renderClassChips(data.all_classes, sel.class_code);

  // 7. 6-Day date calendar strip
  renderDateCalendar(data.calendar);
}

function renderClassChips(classes, activeCode) {
  const container = document.getElementById('avail-class-chips-container');
  if (!container || !Array.isArray(classes)) return;

  container.innerHTML = '';
  classes.forEach(cls => {
    const isCurrent = cls.class_code === activeCode;
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `avail-class-chip ${isCurrent ? 'active' : ''}`;
    chip.setAttribute('data-class', cls.class_code);

    chip.innerHTML = `
      <div class="avail-chip-top">
        <strong class="avail-chip-code">${cls.class_code}</strong>
        <span class="badge ${cls.status_badge_class} avail-chip-badge">${cls.status_label}</span>
      </div>
      <div class="avail-chip-name">${cls.class_name}</div>
      <div class="avail-chip-fare">₹${cls.base_fare.toFixed(2)}</div>
    `;

    chip.addEventListener('click', () => {
      if (cls.class_code !== selectedClass.class_code) {
        switchTravelClass(cls.class_code);
      }
    });

    container.appendChild(chip);
  });
}

function renderDateCalendar(calendar) {
  const container = document.getElementById('avail-dates-strip-container');
  if (!container || !Array.isArray(calendar)) return;

  container.innerHTML = '';
  calendar.forEach(item => {
    const isSelected = item.date === journeyDate;
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `avail-date-card ${isSelected ? 'active' : ''}`;
    card.setAttribute('data-date', item.date);

    card.innerHTML = `
      <div class="avail-date-day">${item.day_name}</div>
      <div class="avail-date-num">${item.display_date}</div>
      <div class="avail-date-status ${item.is_available ? 'status-avl' : 'status-wl'}">
        ${item.status_label}
      </div>
    `;

    card.addEventListener('click', () => {
      if (item.date !== journeyDate) {
        switchJourneyDate(item.date);
      }
    });

    container.appendChild(card);
  });
}

async function switchTravelClass(newClassCode) {
  if (!selectedTrain) return;

  const newClass = selectedTrain.classes.find(c => c.class_code === newClassCode);
  if (!newClass) return;

  selectedClass = newClass;
  document.getElementById('summary-class').innerText = `${selectedClass.class_name} (${selectedClass.class_code})`;

  // Update URL without reloading page
  const url = new URL(window.location);
  url.searchParams.set('class_code', newClassCode);
  window.history.replaceState({}, '', url);

  updateFareBreakdown();
  showToast(`Switched class to ${selectedClass.class_name}`, 'info');
  await checkSeatAvailability(false);
}

async function switchJourneyDate(newDate) {
  journeyDate = newDate;
  document.getElementById('summary-date').innerText = formatDate(journeyDate);

  // Update URL without reloading page
  const url = new URL(window.location);
  url.searchParams.set('date', newDate);
  window.history.replaceState({}, '', url);

  showToast(`Updated journey date to ${formatDate(newDate)}`, 'info');
  await checkSeatAvailability(false);
}

function toggleAvailabilityCard() {
  const body = document.getElementById('avail-widget-body');
  const textEl = document.getElementById('avail-collapse-text');
  const iconEl = document.getElementById('avail-collapse-icon');
  const btn = document.getElementById('btn-toggle-avail-card');

  if (!body) return;

  const isHidden = body.classList.contains('collapsed');
  if (isHidden) {
    body.classList.remove('collapsed');
    if (textEl) textEl.innerText = 'Hide Details';
    if (iconEl) iconEl.className = 'fa-solid fa-chevron-up';
    if (btn) btn.setAttribute('aria-expanded', 'true');
  } else {
    body.classList.add('collapsed');
    if (textEl) textEl.innerText = 'Show Details';
    if (iconEl) iconEl.className = 'fa-solid fa-chevron-down';
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }
}

function addPassengerRow() {
  if (passengerCount >= 6) {
    showToast('A maximum of 6 passengers are permitted per booking.', 'warning');
    return;
  }

  passengerCount++;
  const container = document.getElementById('passengers-container');
  const row = document.createElement('div');
  row.className = 'passenger-row';
  row.id = `passenger-row-${passengerCount}`;

  row.innerHTML = `
    <div class="passenger-row-header">
      <span>Passenger #${passengerCount}</span>
      <button type="button" class="remove-passenger-btn" onclick="removePassengerRow(${passengerCount})">
        <i class="fa-solid fa-trash-can icon-svg-danger btn-icon-remove-passenger"></i>
        Remove
      </button>
    </div>
    <div class="passenger-inputs-grid">
      <div class="form-group">
        <label class="form-label">Full Name</label>
        <input type="text" class="form-control p-name" placeholder="As per Aadhaar/Govt ID" required>
      </div>
      <div class="form-group">
        <label class="form-label">Age</label>
        <input type="number" class="form-control p-age" min="1" max="110" placeholder="Years" required>
      </div>
      <div class="form-group">
        <label class="form-label">Gender</label>
        <select class="form-control p-gender" required>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Berth Choice</label>
        <select class="form-control p-berth">
          <option value="No Preference">No Preference</option>
          <option value="Lower">Lower Berth</option>
          <option value="Middle">Middle Berth</option>
          <option value="Upper">Upper Berth</option>
          <option value="Side Lower">Side Lower</option>
          <option value="Side Upper">Side Upper</option>
          <option value="Window">Window Seat</option>
        </select>
      </div>
    </div>
  `;

  container.appendChild(row);
  updateFareBreakdown();
  checkSeatAvailability(false);
}

function removePassengerRow(index) {
  const row = document.getElementById(`passenger-row-${index}`);
  if (row) {
    row.remove();
    passengerCount = document.querySelectorAll('.passenger-row').length;
    updateFareBreakdown();
    checkSeatAvailability(false);
  }
}

function updateFareBreakdown() {
  if (!selectedClass) return;

  const activeRows = document.querySelectorAll('.passenger-row');
  const count = activeRows.length;

  const baseFare = parseFloat(selectedClass.base_fare);
  const subtotal = baseFare * count;
  const isAC = ['1A', '2A', '3A', 'CC', 'EC'].includes(selectedClass.class_code);
  const gst = isAC ? subtotal * 0.05 : 0;
  const serviceFee = 15.00;
  const total = subtotal + gst + serviceFee;

  document.getElementById('fare-base').innerText = formatCurrency(baseFare);
  document.getElementById('fare-count').innerText = `${count} Passenger(s)`;
  document.getElementById('fare-subtotal').innerText = formatCurrency(subtotal);
  document.getElementById('fare-gst').innerText = formatCurrency(gst);
  document.getElementById('fare-service').innerText = formatCurrency(serviceFee);
  document.getElementById('fare-total').innerText = formatCurrency(total);
  
  const modalPayAmount = document.getElementById('modal-pay-amount');
  if (modalPayAmount) modalPayAmount.innerText = formatCurrency(total);
}

function openPaymentModal() {
  const activeRows = document.querySelectorAll('.passenger-row');
  let isValid = true;

  activeRows.forEach(row => {
    const name = row.querySelector('.p-name').value.trim();
    const age = row.querySelector('.p-age').value.trim();
    if (!name || !age) isValid = false;
  });

  if (!isValid) {
    showToast('Please fill all passenger names and ages before proceeding.', 'warning');
    return;
  }

  // Update verified seat summary banner in modal
  const modalStatus = document.getElementById('modal-verified-status');
  const modalDetails = document.getElementById('modal-verified-details');
  if (modalStatus && modalDetails && currentAvailabilityData) {
    const sel = currentAvailabilityData.selected;
    modalStatus.innerText = sel.passenger_status === 'CONFIRMED'
      ? `Seats Verified: CONFIRMED (${activeRows.length} Berth${activeRows.length > 1 ? 's' : ''})`
      : `Seats Verified: WAITLISTED (${activeRows.length} Passenger${activeRows.length > 1 ? 's' : ''})`;
    modalDetails.innerText = `${sel.passenger_message} • Quota: ${sel.quota} • Train: ${selectedTrain.train_number}`;
  }

  const modal = document.getElementById('payment-modal');
  if (modal) {
    modal.classList.add('active');
  }
}

function closePaymentModal() {
  const modal = document.getElementById('payment-modal');
  if (modal) {
    modal.classList.remove('active');
  }
}

async function processBookingSubmission() {
  const confirmBtn = document.getElementById('btn-confirm-pay');
  confirmBtn.disabled = true;
  confirmBtn.innerText = 'Processing Safe Transaction...';

  const activeRows = document.querySelectorAll('.passenger-row');
  const passengers = [];

  activeRows.forEach(row => {
    passengers.push({
      name: row.querySelector('.p-name').value.trim(),
      age: parseInt(row.querySelector('.p-age').value, 10),
      gender: row.querySelector('.p-gender').value,
      berth_preference: row.querySelector('.p-berth').value
    });
  });

  try {
    const payload = {
      train_id: selectedTrain.id,
      class_code: selectedClass.class_code,
      journey_date: journeyDate,
      quota: quotaType,
      passengers
    };

    const result = await fetchWithAuth('/bookings/book', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    closePaymentModal();
    showToast(result.message, 'success');

    // Redirect to e-Ticket PNR view
    setTimeout(() => {
      window.location.href = `/pnr.html?pnr=${result.booking.pnr_number}&new=true`;
    }, 1000);
  } catch (err) {
    showToast(err.message, 'error');
    confirmBtn.disabled = false;
    confirmBtn.innerText = 'Confirm & Pay Securely';
  }
}

