const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initDb, checkDbHealth } = require('./db');
const authRoutes = require('./routes/authRoutes');
const trainRoutes = require('./routes/trainRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');

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

// Health check endpoint for cloud monitoring & PaaS checks (Railway / Render / Docker)
app.get('/api/health', async (req, res) => {
  const dbHealth = await checkDbHealth();
  res.json({
    status: 'ONLINE',
    system: 'Indian Railway Reservation System',
    environment: process.env.NODE_ENV || 'development',
    database: dbHealth.status,
    uptimeSeconds: Math.floor(process.uptime()),
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
  // Test and initialize MySQL connection & auto-seed
  await initDb();

  const server = app.listen(PORT, () => {
    console.log('\n======================================================');
    console.log('  RAILORA - INDIAN RAILWAY RESERVATION SYSTEM         ');
    console.log('======================================================');
    console.log(` Server running on http://localhost:${PORT}`);
    console.log('\n Quick Access:');
    console.log(` • Home / Search Trains: http://localhost:${PORT}`);
    console.log(` • Train Availability:   http://localhost:${PORT}/trains.html`);
    console.log(` • Train Schedule:       http://localhost:${PORT}/schedule.html`);
    console.log(` • PNR Status Inquiry:   http://localhost:${PORT}/pnr.html`);
    console.log(` • My Bookings:          http://localhost:${PORT}/my-bookings.html`);
    console.log(` • Admin Dashboard:      http://localhost:${PORT}/admin.html`);
    console.log(` • Login / Register:     http://localhost:${PORT}/login.html`);
    console.log('\n Default Accounts:');
    console.log(' • Admin: admin@railway.gov.in / admin123');
    console.log(' • User:  rahul@gmail.com / password123');
    console.log('======================================================\n');
  });

  // Graceful shutdown handling for container termination (Docker, Kubernetes, Railway, Render)
  const shutdown = () => {
    console.log('\nReceived kill signal, shutting down gracefully...');
    server.close(() => {
      console.log('Closed remaining connections. Exiting process.');
      process.exit(0);
    });
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = app;
