/**
 * RAILORA - Client-Side API Utility & State Management
 */

const API_BASE = '/api';

// Auth State Management
function getToken() {
  return localStorage.getItem('railway_token');
}

function setToken(token) {
  localStorage.setItem('railway_token', token);
}

function getUser() {
  const user = localStorage.getItem('railway_user');
  try {
    return user ? JSON.parse(user) : null;
  } catch (e) {
    return null;
  }
}

function setUser(user) {
  localStorage.setItem('railway_user', JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem('railway_token');
  localStorage.removeItem('railway_user');
}

function logout() {
  clearAuth();
  showToast('Logged out successfully.', 'info');
  setTimeout(() => {
    window.location.href = '/login.html';
  }, 500);
}

/**
 * Universal Fetch wrapper with Bearer token & JSON parsing
 */
async function fetchWithAuth(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }

    return data;
  } catch (err) {
    throw err;
  }
}

/**
 * Modern floating Toast Notification
 */
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let iconSvg = '';
  if (type === 'success') {
    iconSvg = '<i class="fa-solid fa-circle-check icon-svg-success toast-icon"></i>';
  } else if (type === 'error') {
    iconSvg = '<i class="fa-solid fa-triangle-exclamation icon-svg-danger toast-icon"></i>';
  } else {
    iconSvg = '<i class="fa-solid fa-circle-info icon-svg-white toast-icon"></i>';
  }

  toast.innerHTML = `${iconSvg} <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/**
 * Format Helpers
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
}

/**
 * Synchronize Header/Navbar with current Auth state
 */
function updateNavAuth() {
  const user = getUser();
  const navActions = document.getElementById('nav-actions');
  const navLinks = document.getElementById('nav-links');

  if (!navActions) return;

  if (user) {
    // Show Admin link in nav-links if user is admin
    if (navLinks && user.role === 'admin') {
      if (!document.getElementById('nav-admin-link')) {
        const adminLi = document.createElement('li');
        adminLi.id = 'nav-admin-link';
        adminLi.innerHTML = `<a href="/admin.html" class="nav-admin-link-text">
          <i class="fa-solid fa-user-shield icon-svg-orange nav-admin-link-icon"></i>
          Admin Portal
        </a>`;
        navLinks.appendChild(adminLi);
      }
    }

    navActions.innerHTML = `
      <a href="/my-bookings.html" class="user-badge">
        <i class="fa-solid fa-user icon-svg-white nav-user-icon"></i>
        <span>${user.name.split(' ')[0]} ${user.role === 'admin' ? '(Admin)' : ''}</span>
      </a>
      <button onclick="logout()" class="btn btn-outline btn-sm btn-outline-white-30">
        Logout
      </button>
    `;
  } else {
    // Guest view
    const adminLink = document.getElementById('nav-admin-link');
    if (adminLink) adminLink.remove();

    navActions.innerHTML = `
      <a href="/login.html" class="btn btn-outline btn-sm btn-outline-white-35">
        Login
      </a>
      <a href="/login.html?tab=register" class="btn btn-secondary btn-sm">
        Register
      </a>
    `;
  }
}

// Auto update on DOM load
document.addEventListener('DOMContentLoaded', updateNavAuth);

/**
 * Station Autocomplete & Directory Caching
 */
let cachedStations = [];

async function getStationsList() {
  if (cachedStations.length > 0) return cachedStations;
  try {
    const data = await fetchWithAuth('/trains/stations');
    if (data.success && data.stations) {
      cachedStations = data.stations;
    }
  } catch (err) {
    console.error('Failed to fetch stations:', err);
  }
  return cachedStations;
}

/**
 * Enhanced Station Autocomplete: Displays Station Name with Station Code
 */
function setupStationAutocomplete(inputElement, datalistElement) {
  if (!inputElement) return;

  const container = inputElement.closest('.input-container') || inputElement.parentElement;
  if (!container) return;

  container.style.position = 'relative';

  // Create suggestions dropdown container if not present
  let dropdown = container.querySelector('.station-suggestions-dropdown');
  if (!dropdown) {
    dropdown = document.createElement('div');
    dropdown.className = 'station-suggestions-dropdown';
    container.appendChild(dropdown);
  }

  // Load and setup stations
  getStationsList().then(stations => {
    // Populate fallback datalist if available
    if (datalistElement) {
      datalistElement.innerHTML = '';
      stations.forEach(st => {
        const opt = document.createElement('option');
        opt.value = `${st.name} (${st.code})`;
        opt.label = `${st.city}, ${st.state}`;
        datalistElement.appendChild(opt);
      });
    }

    const renderSuggestions = (query) => {
      const q = (query || '').trim().toLowerCase();

      // If user selected an item like "New Delhi (NDLS)", don't filter to nothing
      const cleanQ = q.replace(/\([a-z0-9]+\)/i, '').trim();

      const filtered = stations.filter(st => {
        if (!cleanQ) return true;
        return (
          st.code.toLowerCase().includes(cleanQ) ||
          st.name.toLowerCase().includes(cleanQ) ||
          st.city.toLowerCase().includes(cleanQ) ||
          st.state.toLowerCase().includes(cleanQ)
        );
      });

      if (filtered.length === 0) {
        dropdown.innerHTML = `
          <div class="station-dropdown-empty">
            No station found matching "<strong>${escapeHtml(query)}</strong>"
          </div>
        `;
        dropdown.classList.add('active');
        return;
      }

      dropdown.innerHTML = filtered.map(st => `
        <div class="station-suggestion-item" data-code="${st.code}" data-name="${st.name}" data-city="${st.city}">
          <div class="station-suggest-main">
            <div class="station-suggest-name">
              <span>${st.name}</span>
            </div>
            <div class="station-suggest-city">${st.city}, ${st.state}</div>
          </div>
          <span class="station-suggest-code">${st.code}</span>
        </div>
      `).join('');

      dropdown.classList.add('active');

      // Add click handlers for each item
      dropdown.querySelectorAll('.station-suggestion-item').forEach(item => {
        item.addEventListener('mousedown', (e) => {
          e.preventDefault();
          const code = item.dataset.code;
          const name = item.dataset.name;
          inputElement.value = `${name} (${code})`;
          inputElement.dataset.selectedCode = code;
          dropdown.classList.remove('active');
          inputElement.dispatchEvent(new Event('change'));
        });
      });
    };

    inputElement.addEventListener('focus', () => {
      renderSuggestions(inputElement.value);
    });

    inputElement.addEventListener('input', () => {
      inputElement.removeAttribute('data-selected-code');
      renderSuggestions(inputElement.value);
    });

    inputElement.addEventListener('blur', () => {
      // Delay to allow mousedown to trigger first
      setTimeout(() => dropdown.classList.remove('active'), 250);
    });

    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    });
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
