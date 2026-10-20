const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initDb } = require('./db');
const authRoutes = require('./routes/authRoutes');
const trainRoutes = require('./routes/trainRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const radarRoutes = require('./routes/radarRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Frontend Files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/trains', trainRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/radar', radarRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'Indian Railway Reservation System',
    timestamp: new Date().toISOString()
  });
});

// Friendly redirect for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'An unexpected server error occurred.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start the server
async function startServer() {
  // Test and initialize MySQL connection
  await initDb();

  app.listen(PORT, () => {
    console.log('\n======================================================');
    console.log('  RAILORA - INDIAN RAILWAY RESERVATION SYSTEM         ');
    console.log('======================================================');
    console.log(` Server running on http://localhost:${PORT}`);
    console.log('\n Quick Access:');
    console.log(` • Home / Search Trains: http://localhost:${PORT}`);
    console.log(` • Train Availability:   http://localhost:${PORT}/trains.html`);
    console.log(` • PNR Status Inquiry:   http://localhost:${PORT}/pnr.html`);
    console.log(` • Live Running Status:  http://localhost:${PORT}/radar.html`);
    console.log(` • My Bookings:          http://localhost:${PORT}/my-bookings.html`);
    console.log(` • Admin Dashboard:      http://localhost:${PORT}/admin.html`);
    console.log(` • Login / Register:     http://localhost:${PORT}/login.html`);
    console.log('\n Default Accounts:');
    console.log(' • Admin: admin@railway.gov.in / admin123');
    console.log(' • User:  rahul@gmail.com / password123');
    console.log('======================================================\n');
  });
}

startServer();
