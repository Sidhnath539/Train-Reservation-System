/**
 * RAILORA - User Bookings History Logic
 */

let userBookings = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (!getToken()) {
    showToast('Please log in to view your bookings.', 'warning');
    setTimeout(() => {
      window.location.href = '/login.html?redirect=/my-bookings.html';
    }, 600);
    return;
  }

  await loadMyBookings();

  // Tab filtering
  const filterBtns = document.querySelectorAll('.booking-filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      renderBookings(filter);
    });
  });
});

async function loadMyBookings() {
  const container = document.getElementById('my-bookings-container');
  container.innerHTML = `
    <div class="bookings-loading-card">
      <div class="bookings-spinner"></div>
      <p class="bookings-loading-title">Retrieving your booking history...</p>
    </div>
  `;

  try {
    const data = await fetchWithAuth('/bookings/my-bookings');
    userBookings = data.bookings || [];

    if (userBookings.length === 0) {
      container.innerHTML = `
        <div class="bookings-empty-card">
          <i class="fa-solid fa-ticket icon-svg-primary bookings-empty-icon"></i>
          <h3 class="bookings-empty-title">No Bookings Found</h3>
          <p class="bookings-empty-desc">You haven't reserved any train journeys yet.</p>
          <a href="/" class="btn btn-primary">Book Your First Journey</a>
        </div>
      `;
      return;
    }

    renderBookings('ALL');
  } catch (err) {
    container.innerHTML = `
      <div class="bookings-error-card">
        <h3 class="bookings-error-title">Failed to load bookings</h3>
        <p class="bookings-error-desc">${err.message}</p>
      </div>
    `;
  }
}

function renderBookings(filter) {
  const container = document.getElementById('my-bookings-container');
  const filtered = userBookings.filter(b => {
    if (filter === 'ALL') return true;
    return b.booking_status === filter;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="bookings-error-card">
        <h3>No ${filter.toLowerCase()} bookings found</h3>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(b => {
    const isCancelled = b.booking_status === 'CANCELLED';
    const statusBadge = isCancelled ? 'badge-can' : (b.booking_status === 'CONFIRMED' ? 'badge-cnf' : 'badge-wl');

    return `
      <div class="train-card bookings-card-mb">
        <div class="train-card-header">
          <div class="train-identity">
            <span class="train-badge-num">PNR: ${b.pnr_number}</span>
            <h4 class="train-title-name">${b.train_number} - ${b.train_name}</h4>
          </div>
          <div>
            <span class="badge ${statusBadge}">${b.booking_status}</span>
          </div>
        </div>

        <div class="train-card-body">
          <div class="bookings-details-row">
            <div>
              <div class="bookings-route-title">
                ${b.source_city} (${b.source_code}) ➔ ${b.dest_city} (${b.dest_code})
              </div>
              <div class="bookings-journey-date">
                Journey Date: <strong>${formatDate(b.journey_date)}</strong> (${formatTime(b.departure_time)})
              </div>
            </div>

            <div class="text-right">
              <div class="bookings-col-label">Class & Quota</div>
              <div class="bookings-quota-val">${b.class_code} | ${b.quota}</div>
            </div>

            <div class="text-right">
              <div class="bookings-col-label">Total Paid</div>
              <div class="bookings-fare-val">
                ${formatCurrency(b.total_fare)}
              </div>
            </div>
          </div>

          <!-- Passenger mini list -->
          <div class="bookings-pax-box">
            <strong>Passengers:</strong>
            ${b.passengers.map(p => `
              <span class="bookings-pax-item">
                ${p.name} (${p.allocated_seat})
              </span>
            `).join('')}
          </div>

          <div class="bookings-actions-row">
            <a href="/pnr.html?pnr=${b.pnr_number}" class="btn btn-outline btn-sm">
              <i class="fa-solid fa-ticket"></i>
              View E-Ticket
            </a>
            <a href="/pnr.html?pnr=${b.pnr_number}&print=true" class="btn btn-outline btn-sm">
              <i class="fa-solid fa-print"></i>
              Print Ticket
            </a>
            ${!isCancelled ? `
              <a href="/pnr.html?pnr=${b.pnr_number}" class="btn btn-danger btn-sm">
                Manage / Cancel
              </a>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}
