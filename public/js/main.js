/**
 * RAILORA - Home Page Logic (Station Search, Quick PNR, Popular Routes)
 */

document.addEventListener('DOMContentLoaded', async () => {
  const fromInput = document.getElementById('from-station');
  const toInput = document.getElementById('to-station');
  const dateInput = document.getElementById('journey-date');
  const swapBtn = document.getElementById('btn-swap');
  const searchForm = document.getElementById('hero-search-form');
  const pnrQuickForm = document.getElementById('quick-pnr-form');
  const stationsList = document.getElementById('stations-datalist');

  // Set default date to tomorrow
  if (dateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    const minDateStr = `${yyyy}-${mm}-${dd}`;
    dateInput.value = minDateStr;
    dateInput.min = new Date().toISOString().split('T')[0];
  }

  // Setup enhanced Station Autocomplete with station code & name display (Empty by default)
  if (fromInput) {
    fromInput.value = '';
    delete fromInput.dataset.selectedCode;
    setupStationAutocomplete(fromInput, stationsList);
  }

  if (toInput) {
    toInput.value = '';
    delete toInput.dataset.selectedCode;
    setupStationAutocomplete(toInput, stationsList);
  }

  // Swap Stations
  if (swapBtn && fromInput && toInput) {
    swapBtn.addEventListener('click', () => {
      const tempVal = fromInput.value;
      const tempCode = fromInput.dataset.selectedCode;

      fromInput.value = toInput.value;
      if (toInput.dataset.selectedCode) {
        fromInput.dataset.selectedCode = toInput.dataset.selectedCode;
      } else {
        delete fromInput.dataset.selectedCode;
      }

      toInput.value = tempVal;
      if (tempCode) {
        toInput.dataset.selectedCode = tempCode;
      } else {
        delete toInput.dataset.selectedCode;
      }
    });
  }

  // Clear Stations Button (Empty source and destination on demand)
  const clearStationsBtn = document.getElementById('btn-clear-stations');
  if (clearStationsBtn && fromInput && toInput) {
    clearStationsBtn.addEventListener('click', () => {
      fromInput.value = '';
      toInput.value = '';
      delete fromInput.dataset.selectedCode;
      delete toInput.dataset.selectedCode;
      fromInput.focus();
    });
  }

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

  // Handle Search Submission
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fromVal = fromInput.value.trim();
      const toVal = toInput.value.trim();
      const dateVal = dateInput.value;
      const classVal = document.getElementById('travel-class')?.value || 'ALL';
      const quotaVal = document.getElementById('quota')?.value || 'GENERAL';
      const isFlexible = document.getElementById('chk-flexible-date')?.checked;
      const isDisability = document.getElementById('chk-disability')?.checked;
      const isPass = document.getElementById('chk-railway-pass')?.checked;

      if (!fromVal || !toVal) {
        showToast('Please specify both source and destination stations.', 'warning');
        return;
      }

      const cleanFrom = getStationCode(fromInput);
      const cleanTo = getStationCode(toInput);

      if (cleanFrom.toUpperCase() === cleanTo.toUpperCase()) {
        showToast('Source and Destination stations cannot be identical.', 'warning');
        return;
      }

      const params = new URLSearchParams({
        from: cleanFrom,
        to: cleanTo,
        date: dateVal,
        class_code: classVal,
        quota: quotaVal
      });

      if (isFlexible) params.append('flexible', '1');
      if (isDisability) params.append('concession', 'disability');
      if (isPass) params.append('concession', 'pass');

      window.location.href = `/trains.html?${params.toString()}`;
    });

    // Helpful feedback on concession checkboxes
    const disChk = document.getElementById('chk-disability');
    if (disChk) {
      disChk.addEventListener('change', (e) => {
        if (e.target.checked) {
          showToast('Divyangjan concession selected. Government handicap certificate required during journey.', 'info');
        }
      });
    }

    const passChk = document.getElementById('chk-railway-pass');
    if (passChk) {
      passChk.addEventListener('change', (e) => {
        if (e.target.checked) {
          showToast('Railway Pass concession selected. Valid pass voucher code required at booking.', 'info');
        }
      });
    }
  }

  // Handle Quick PNR Form
  if (pnrQuickForm) {
    pnrQuickForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const pnrInput = document.getElementById('quick-pnr-input');
      const pnrVal = pnrInput.value.trim();

      if (!pnrVal || pnrVal.length < 8) {
        showToast('Please enter a valid 10-digit PNR number.', 'warning');
        return;
      }

      window.location.href = `/pnr.html?pnr=${encodeURIComponent(pnrVal)}`;
    });
  }
});

/**
 * Direct shortcut for Popular Route Cards
 */
function selectPopularRoute(fromCode, toCode) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];

  const params = new URLSearchParams({
    from: fromCode,
    to: toCode,
    date: dateStr,
    class_code: 'ALL',
    quota: 'GENERAL'
  });

  window.location.href = `/trains.html?${params.toString()}`;
}
