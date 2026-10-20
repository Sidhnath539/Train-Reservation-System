/**
 * RAILORA - PNR Status Inquiry & e-Ticket Management
 */

let currentBooking = null;

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const pnr = urlParams.get('pnr');
  const isNew = urlParams.get('new');
  const autoPrint = urlParams.get('print') === 'true';

  if (isNew) {
    showToast('Congratulations! Your ticket has been confirmed.', 'success');
  }

  const pnrForm = document.getElementById('pnr-search-form');
  const pnrInput = document.getElementById('pnr-query-input');

  if (pnr) {
    if (pnrInput) pnrInput.value = pnr;
    fetchPNRStatus(pnr, autoPrint);
  }

  if (pnrForm) {
    pnrForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const raw = pnrInput.value.trim();
      const val = raw.replace(/[^0-9]/g, '');
      if (!val || val.length < 8) {
        showToast('Please enter a valid 10-digit PNR number.', 'warning');
        return;
      }
      pnrInput.value = val;
      const url = new URL(window.location);
      url.searchParams.set('pnr', val);
      window.history.replaceState({}, '', url);
      fetchPNRStatus(val, false);
    });
  }

  // Cancel Ticket Confirm Button in Modal
  const confirmCancelBtn = document.getElementById('btn-confirm-cancel');
  if (confirmCancelBtn) {
    confirmCancelBtn.addEventListener('click', processCancellation);
  }
});

async function fetchPNRStatus(pnr, autoPrint = false) {
  const resultContainer = document.getElementById('ticket-result-container');
  resultContainer.innerHTML = `
    <div class="pnr-loading-box">
      <div class="pnr-spinner"></div>
      <p class="pnr-loading-title">Querying Indian Railways Reservation Database for PNR: ${pnr}...</p>
    </div>
  `;

  try {
    const data = await fetchWithAuth(`/bookings/pnr/${encodeURIComponent(pnr)}`);
    if (!data.success || !data.booking) {
      throw new Error(data.message || 'PNR not found.');
    }

    currentBooking = data.booking;
    renderTicket(currentBooking);

    if (autoPrint) {
      setTimeout(() => {
        window.print();
      }, 700);
    }
  } catch (err) {
    resultContainer.innerHTML = `
      <div class="pnr-error-box">
        <i class="fa-solid fa-triangle-exclamation icon-svg-danger pnr-error-icon"></i>
        <h3 class="pnr-error-title">PNR Inquiry Not Found</h3>
        <p class="pnr-error-desc">${err.message}</p>
        <p class="pnr-error-hint">Please check the 10-digit number printed on top-left of your ticket or booking SMS.</p>
        <div class="pnr-error-demo-wrap">
          <span class="pnr-demo-label">Try active sample PNR:</span>
          <button type="button" class="pnr-demo-chip" onclick="searchSamplePNR('8429104821')">8429104821 (Rajdhani 3A)</button>
          <button type="button" class="pnr-demo-chip" onclick="searchSamplePNR('2940185930')">2940185930 (Mumbai 2A)</button>
        </div>
      </div>
    `;
  }
}

function searchSamplePNR(pnr) {
  const pnrInput = document.getElementById('pnr-query-input');
  if (pnrInput) pnrInput.value = pnr;
  const url = new URL(window.location);
  url.searchParams.set('pnr', pnr);
  window.history.replaceState({}, '', url);
  fetchPNRStatus(pnr, false);
}

function getFullClassName(code) {
  const map = {
    '1A': 'FIRST AC (1A)',
    '2A': 'SECOND AC (2A)',
    '3A': 'THIRD AC (3A)',
    'CC': 'AC CHAIR CAR (CC)',
    'EC': 'EXEC. CHAIR CAR (EC)',
    'SL': 'SLEEPER CLASS (SL)',
    '2S': 'SECOND SEATING (2S)',
    'GEN': 'GENERAL (GEN)'
  };
  return map[code] || `${code} CLASS`;
}

function formatERSDate(dateVal) {
  if (!dateVal) return '--';
  let d;
  if (dateVal instanceof Date) {
    d = dateVal;
  } else {
    const str = String(dateVal).split('T')[0];
    const parts = str.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0])) {
      d = new Date(parts[0], parts[1] - 1, parts[2]);
    } else {
      d = new Date(dateVal);
    }
  }

  if (isNaN(d.getTime())) return String(dateVal);
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`;
}

function formatERSTime(timeStr) {
  if (!timeStr) return '--:--';
  const parts = String(timeStr).split(':');
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
  return timeStr;
}

function formatERSDateTime(dateTimeStr) {
  if (!dateTimeStr) return '--';
  const d = new Date(dateTimeStr);
  if (isNaN(d.getTime())) return String(dateTimeStr);
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  return `${day}-${months[d.getMonth()]}-${d.getFullYear()} ${time}`;
}

function calculateArrivalDate(journeyDate, depTime, arrTime) {
  if (!journeyDate) return '--';
  let d;
  if (journeyDate instanceof Date) {
    d = new Date(journeyDate.getTime());
  } else {
    const str = String(journeyDate).split('T')[0];
    const parts = str.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0])) {
      d = new Date(parts[0], parts[1] - 1, parts[2]);
    } else {
      d = new Date(journeyDate);
    }
  }

  if (isNaN(d.getTime())) return '--';

  const depParts = String(depTime || '00:00').split(':').map(Number);
  const arrParts = String(arrTime || '00:00').split(':').map(Number);

  const depH = isNaN(depParts[0]) ? 0 : depParts[0];
  const depM = isNaN(depParts[1]) ? 0 : depParts[1];
  const arrH = isNaN(arrParts[0]) ? 0 : arrParts[0];
  const arrM = isNaN(arrParts[1]) ? 0 : arrParts[1];

  const daysToAdd = (arrH < depH || (arrH === depH && arrM < depM)) ? 1 : 0;
  d.setDate(d.getDate() + daysToAdd);

  return formatERSDate(d);
}

function parseBerthDetails(allocatedSeat, status) {
  if (status === 'WL' || String(allocatedSeat || '').toUpperCase().includes('WL')) {
    const wlMatch = (allocatedSeat || '').match(/WL\s*(\d+)/i);
    const wlNum = wlMatch ? wlMatch[1] : '1';
    return {
      bookingStatus: `WL/${wlNum}`,
      currentStatus: `WL/${wlNum}`
    };
  }
  if (status === 'CAN') {
    return {
      bookingStatus: 'CAN',
      currentStatus: 'CANCELLED'
    };
  }

  const match = (allocatedSeat || '').match(/^([A-Z0-9]+)-(\d+)\s*\(([^)]+)\)/i);
  if (match) {
    const coach = match[1];
    const berth = match[2];
    const berthType = match[3].toUpperCase();
    const mapFull = {
      'LB': 'LOWER',
      'MB': 'MIDDLE',
      'UB': 'UPPER',
      'SL': 'SIDE LOWER',
      'SU': 'SIDE UPPER',
      'WS': 'WINDOW SEAT'
    };
    const berthTypeFull = mapFull[berthType] || berthType;
    return {
      bookingStatus: `CNF/${coach}/${berth}/${berthType}`,
      currentStatus: `CNF/${coach}/${berth}/${berthTypeFull}`
    };
  }

  return {
    bookingStatus: `CNF/${allocatedSeat || '--'}`,
    currentStatus: `CNF/${allocatedSeat || '--'}`
  };
}

function getEstimatedDistance(durationStr) {
  if (!durationStr) return '701 KM';
  const match = durationStr.match(/(\d+)h/i);
  if (match) {
    const hours = parseInt(match[1], 10);
    return `${hours * 68 + 85} KM`;
  }
  return '701 KM';
}

function generateQRCodeSVG(pnr, payload) {
  const size = 25;
  const grid = Array.from({ length: size }, () => Array(size).fill(false));

  function addFinder(r, c) {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
          grid[r + i][c + j] = true;
        }
      }
    }
  }

  addFinder(0, 0);
  addFinder(0, 18);
  addFinder(18, 0);

  for (let i = 8; i < 17; i++) {
    if (i % 2 === 0) {
      grid[6][i] = true;
      grid[i][6] = true;
    }
  }

  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      if (i === 0 || i === 4 || j === 0 || j === 4 || (i === 2 && j === 2)) {
        grid[16 + i][16 + j] = true;
      }
    }
  }

  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    hash = ((hash << 5) - hash) + payload.charCodeAt(i);
    hash |= 0;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if ((r < 8 && c < 8) || (r < 8 && c > 16) || (r > 16 && c < 8) || (r === 6) || (c === 6) || (r >= 16 && r <= 20 && c >= 16 && c <= 20)) continue;
      const bit = Math.abs((hash ^ (r * 31 + c * 17)) % 7) < 4;
      grid[r][c] = bit;
    }
  }

  let rects = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c]) {
        rects += `<rect x="${c * 4 + 4}" y="${r * 4 + 4}" width="4" height="4" fill="#111827"/>`;
      }
    }
  }

  return `<svg viewBox="0 0 108 108" class="ers-qr-svg" xmlns="http://www.w3.org/2000/svg"><rect width="108" height="108" fill="#ffffff"/>${rects}</svg>`;
}

function generateBarcodeSVG(pnr) {
  const bars = [2, 1, 3, 1, 1, 2, 3, 2, 1, 1, 3, 1, 2, 1, 1, 3, 2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 3, 1, 2, 1, 1, 2, 3, 1];
  let x = 6;
  let paths = '';
  bars.forEach((w, idx) => {
    if (idx % 2 === 0) {
      paths += `<rect x="${x}" y="2" width="${w * 2}" height="32" fill="#111827"/>`;
    }
    x += w * 2;
  });
  return `<svg viewBox="0 0 180 36" class="ers-barcode-svg" xmlns="http://www.w3.org/2000/svg">${paths}</svg>`;
}

function renderTicket(booking) {
  const container = document.getElementById('ticket-result-container');
  const isCancelled = booking.booking_status === 'CANCELLED';
  const totalFare = parseFloat(booking.total_fare);
  const convenienceFee = 15.00;
  const travelInsurance = (0.45 * booking.total_passengers);
  const ticketFare = Math.max(0, totalFare - convenienceFee - travelInsurance).toFixed(2);
  const fullClassName = getFullClassName(booking.class_code);
  const distanceEst = getEstimatedDistance(booking.duration);
  const bookingDateFormatted = formatERSDateTime(booking.booking_date);
  const arrDate = calculateArrivalDate(booking.journey_date, booking.departure_time, booking.arrival_time);
  const qrPayload = `RAILORA-ERS|PNR:${booking.pnr_number}|TRAIN:${booking.train_number}|DATE:${booking.journey_date}|CLASS:${booking.class_code}|PAX:${booking.total_passengers}|FARE:${booking.total_fare}`;
  const qrSVG = generateQRCodeSVG(booking.pnr_number, qrPayload);
  const barcodeSVG = generateBarcodeSVG(booking.pnr_number);

  container.innerHTML = `
    <!-- On-screen Action Toolbar (Hidden in Print) -->
    <div class="ers-action-bar">
      <div class="ers-action-left">
        <button onclick="window.print()" class="btn btn-primary ers-btn-print">
          <i class="fa-solid fa-print"></i>
          Print / Save as PDF
        </button>
        <a href="/radar.html?train=${booking.train_number}" class="btn btn-secondary ers-btn-radar">
          <i class="fa-solid fa-tower-broadcast"></i>
          Live Running Status
        </a>
      </div>
      <div class="ers-action-right">
        ${!isCancelled ? `
          <button onclick="openCancelModal()" class="btn btn-outline text-danger ers-btn-cancel">
            <i class="fa-solid fa-ban"></i>
            Cancel Ticket
          </button>
        ` : `
          <span class="badge badge-can ers-cancelled-badge">TICKET CANCELLED</span>
        `}
      </div>
    </div>

    <!-- Official IRCTC / Railora Electronic Reservation Slip (ERS) -->
    <div class="ers-ticket-container" id="printable-ticket">
      
      <!-- 1. Top Emblem & Platform Branding Header -->
      <div class="ers-header-top">
        <!-- 1. Left Side: Railora Platform Branding Logo (Same as Right) -->
        <div class="ers-header-brand ers-header-brand-left">
          <div class="ers-brand-badge">
            <div class="ers-brand-icon-box">
              <i class="fa-solid fa-train ers-train-icon"></i>
            </div>
            <div class="ers-brand-text">
              <span class="ers-brand-name-rail">Rail</span><span class="ers-brand-name-ora">ora</span>
            </div>
          </div>
          <div class="ers-brand-partner-tag">Official E-Ticketing Partner</div>
        </div>

        <div class="ers-header-center">
          <div class="ers-gov-title">INDIAN RAILWAYS / भारतीय रेल</div>
          <div class="ers-ers-title">Electronic Reservation Slip (ERS)</div>
          <div class="ers-ers-subtitle">IRCTC / Railora Passenger Reservation System Interface</div>
        </div>

        <!-- Right Side: Railora Platform Branding Logo -->
        <div class="ers-header-brand ers-header-brand-right">
          <div class="ers-brand-badge">
            <div class="ers-brand-icon-box">
              <i class="fa-solid fa-train ers-train-icon"></i>
            </div>
            <div class="ers-brand-text">
              <span class="ers-brand-name-rail">Rail</span><span class="ers-brand-name-ora">ora</span>
            </div>
          </div>
          <div class="ers-brand-partner-tag">Official E-Ticketing Partner</div>
        </div>
      </div>

      <!-- 2. Journey Details 3-Column Banner with Blue Arrow -->
      <div class="ers-journey-bar">
        <!-- Booked From -->
        <div class="ers-journey-col ers-journey-left">
          <div class="ers-journey-heading">Booked From</div>
          <div class="ers-journey-stn-name">${booking.source_city} [${booking.source_code}]</div>
          <div class="ers-journey-subtext">Start Date* ${formatERSDate(booking.journey_date)}</div>
        </div>

        <!-- Boarding At (Blue Arrow Section) -->
        <div class="ers-journey-col ers-journey-center">
          <div class="ers-arrow-badge">
            <span>Boarding At</span>
            <i class="fa-solid fa-arrow-right"></i>
          </div>
          <div class="ers-journey-stn-name">${booking.source_city} [${booking.source_code}]</div>
          <div class="ers-journey-subtext">Departure* ${formatERSTime(booking.departure_time)} | ${formatERSDate(booking.journey_date)}</div>
        </div>

        <!-- To -->
        <div class="ers-journey-col ers-journey-right">
          <div class="ers-journey-heading">To</div>
          <div class="ers-journey-stn-name">${booking.dest_city} [${booking.dest_code}]</div>
          <div class="ers-journey-subtext">Arrival* ${formatERSTime(booking.arrival_time)} | ${arrDate}</div>
        </div>
      </div>

      <!-- 3. Key Journey Details Matrix (3x2 Table with Borders) -->
      <table class="ers-matrix-table">
        <tbody>
          <tr>
            <td class="ers-matrix-cell">
              <div class="ers-matrix-label">PNR</div>
              <div class="ers-matrix-val ers-pnr-strong">${booking.pnr_number}</div>
            </td>
            <td class="ers-matrix-cell">
              <div class="ers-matrix-label">Train No./Name</div>
              <div class="ers-matrix-val ers-val-blue">${booking.train_number}/${booking.train_name}</div>
            </td>
            <td class="ers-matrix-cell">
              <div class="ers-matrix-label">Class</div>
              <div class="ers-matrix-val ers-val-blue">${fullClassName}</div>
            </td>
          </tr>
          <tr>
            <td class="ers-matrix-cell">
              <div class="ers-matrix-label">Quota</div>
              <div class="ers-matrix-val">${booking.quota || 'GENERAL'} (GN)</div>
            </td>
            <td class="ers-matrix-cell">
              <div class="ers-matrix-label">Distance</div>
              <div class="ers-matrix-val">${distanceEst}</div>
            </td>
            <td class="ers-matrix-cell">
              <div class="ers-matrix-label">Booking Date</div>
              <div class="ers-matrix-val">${bookingDateFormatted}</div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 4. Passenger Details Table -->
      <div class="ers-section-bar">Passenger Details</div>
      <table class="ers-pax-table">
        <thead>
          <tr>
            <th class="ers-th-num">#</th>
            <th class="ers-th-name">Name</th>
            <th class="ers-th-age">Age</th>
            <th class="ers-th-gender">Gender</th>
            <th class="ers-th-status">Booking Status</th>
            <th class="ers-th-status">Current Status</th>
          </tr>
        </thead>
        <tbody>
          ${booking.passengers.map((p, idx) => {
            const b = parseBerthDetails(p.allocated_seat, p.status);
            return `
              <tr>
                <td class="ers-td-num">${idx + 1}</td>
                <td class="ers-td-name"><strong>${p.name}</strong></td>
                <td class="ers-td-age">${p.age}</td>
                <td class="ers-td-gender">${p.gender}</td>
                <td class="ers-td-status"><strong>${b.bookingStatus}</strong></td>
                <td class="ers-td-status"><strong>${b.currentStatus}</strong></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <!-- 5. Emergency Helpline & Advisory Bar -->
      <div class="ers-helpline-strip">
        <div class="ers-helpline-pill">Helpline: <strong>139</strong></div>
        <div class="ers-helpline-pill">SMS: <strong>PNR to 139</strong></div>
        <div class="ers-helpline-pill">RailMadad: <strong>railmadad.indianrailways.gov.in</strong></div>
        <div class="ers-helpline-pill">Medical Emergency: <strong>139</strong></div>
      </div>
      <div class="ers-subsidy-strip">
        <span>Transaction ID: <strong>RLR-${booking.pnr_number.slice(0, 8)}</strong></span>
        <span class="ers-subsidy-quote">IR recovers only 57% of cost of travel on an average.</span>
      </div>

      <!-- 6. Payment Details & QR Code Barcode Box -->
      <div class="ers-pay-qr-grid">
        <!-- Left: Payment Table -->
        <div class="ers-pay-col">
          <div class="ers-pay-heading">Payment Details</div>
          <table class="ers-pay-table">
            <tbody>
              <tr>
                <td class="ers-pay-label-cell">Ticket Fare</td>
                <td class="ers-pay-val-cell">₹ ${ticketFare}</td>
              </tr>
              <tr>
                <td class="ers-pay-label-cell">IRCTC / Railora Convenience Fee (Incl. of GST)</td>
                <td class="ers-pay-val-cell">₹ 15.00</td>
              </tr>
              <tr>
                <td class="ers-pay-label-cell">Travel Insurance Premium (Incl. of GST)</td>
                <td class="ers-pay-val-cell">₹ ${travelInsurance.toFixed(2)}</td>
              </tr>
              <tr class="ers-pay-total-row">
                <td class="ers-pay-label-cell"><strong>Total Amount Collected</strong></td>
                <td class="ers-pay-val-cell"><strong>₹ ${totalFare.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
          <div class="ers-pg-note">* PG Charges as applicable additional</div>
        </div>

        <!-- Right: Real Vector QR Code & Barcode -->
        <div class="ers-qr-col">
          <div class="ers-qr-box">
            ${qrSVG}
          </div>
          <div class="ers-barcode-box">
            ${barcodeSVG}
            <div class="ers-barcode-pnr">PNR: ${booking.pnr_number}</div>
          </div>
          <div class="ers-seal-caption">
            <i class="fa-solid fa-shield-halved"></i> Official PRS Encrypted E-Ticket
          </div>
        </div>
      </div>

      <!-- 7. Important Passenger Advisory & ID Proof List -->
      <div class="ers-advisory-box">
        <div class="ers-advisory-item">* Beware of fraudulent websites and phone numbers. For all assistance, use official Railora / IRCTC customer care number 139.</div>
        <div class="ers-advisory-item">* Valid original Photo Identity Proof is required to be produced by at least one passenger during travel (Aadhaar Card, Passport, Voter ID, Driving License, Student ID, Nationalized Bank Passbook with photo).</div>
        <div class="ers-advisory-item">* The arrival, departure and timings are liable to change. Please check before journey with Railway Station Inquiry or Dial 139.</div>
        <div class="ers-advisory-item">* Prescribed Original ID proofs: Voter Card / Passport / PAN Card / Driving License / Photo ID card issued by Central/State Govt. / Student ID / Aadhaar / Nationalized Bank Passbook.</div>
        <div class="ers-advisory-item">* This e-ticket is valid only with an original ID proof. It is non-transferable under Section 142 of the Railways Act 1989. In case of train cancellation on entire route, full refund is credited back automatically.</div>
      </div>

      <!-- 8. Footer National Campaign & Safety Banner -->
      <div class="ers-bottom-strip">
        <div class="ers-tricolor-bar">
          <div class="ers-tricolor-saffron"></div>
          <div class="ers-tricolor-white"></div>
          <div class="ers-tricolor-green"></div>
        </div>
        <div class="ers-bottom-content">
          <div class="ers-bottom-motto">सुरक्षित यात्रा, सुखद यात्रा • ALWAYS TRAVEL WITH A VALID TICKET & IDENTITY PROOF</div>
          <div class="ers-bottom-powered">Railora • Dedicated to Indian Railways Commuters</div>
        </div>
      </div>

    </div>
  `;
}

function openCancelModal() {
  if (!getToken()) {
    showToast('Please login to manage or cancel tickets.', 'warning');
    return;
  }

  const modal = document.getElementById('cancel-ticket-modal');
  if (modal && currentBooking) {
    document.getElementById('cancel-pnr-display').innerText = currentBooking.pnr_number;
    document.getElementById('cancel-fare-display').innerText = formatCurrency(currentBooking.total_fare);
    
    // Estimate refund
    const cancelCharge = (['1A', '2A', 'EC'].includes(currentBooking.class_code) ? 180 : 60) * currentBooking.total_passengers;
    const estRefund = Math.max(0, currentBooking.total_fare - cancelCharge);
    document.getElementById('cancel-refund-display').innerText = formatCurrency(estRefund);

    modal.classList.add('active');
  }
}

function closeCancelModal() {
  const modal = document.getElementById('cancel-ticket-modal');
  if (modal) {
    modal.classList.remove('active');
  }
}

async function processCancellation() {
  const confirmBtn = document.getElementById('btn-confirm-cancel');
  confirmBtn.disabled = true;
  confirmBtn.innerText = 'Processing Cancellation...';

  try {
    const data = await fetchWithAuth('/bookings/cancel', {
      method: 'POST',
      body: JSON.stringify({ pnr_number: currentBooking.pnr_number })
    });

    closeCancelModal();
    showToast(data.message, 'success');

    // Refresh ticket display
    await fetchPNRStatus(currentBooking.pnr_number);
  } catch (err) {
    showToast(err.message, 'error');
    confirmBtn.disabled = false;
    confirmBtn.innerText = 'Confirm Cancellation';
  }
}

