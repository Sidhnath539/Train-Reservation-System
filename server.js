/**
 * ============================================================================
 * RAILORA - INDIAN RAILWAY RESERVATION SYSTEM
 * File: server.js
 * Description: Main entry point of the Node.js / Express backend application.
 * Level: Beginner-Friendly / Educational
 * ============================================================================
 * 
 * What this file does:
 * 1. Loads external libraries (Express, CORS, Dotenv, Path).
 * 2. Connects to the MySQL database (and creates tables automatically).
 * 3. Sets up API routes (Authentication, Trains, Bookings, Admin).
 * 4. Serves static frontend files (HTML, CSS, JS, Images from 'public' folder).
 * 5. Starts listening on the specified PORT (default: 5000).
 */

// ----------------------------------------------------------------------------
// STEP 1: IMPORT REQUIRED MODULES
// ----------------------------------------------------------------------------
const express = require('express');        // Web framework to handle HTTP requests
const cors = require('cors');              // Allows frontend and backend to communicate
const path = require('path');              // Node.js helper to work with file paths
require('dotenv').config();                // Loads environment variables from .env file

// Import our custom database connection & auto-seed function
const { initDb, checkDbHealth } = require('./db');

// Import route files (each file handles a specific feature)
const authRoutes = require('./routes/authRoutes');       // Login, Register, Profile
const trainRoutes = require('./routes/trainRoutes');     // Train Search, Schedule, Stations
const bookingRoutes = require('./routes/bookingRoutes'); // Book Ticket, PNR Inquiry, Cancel
const adminRoutes = require('./routes/adminRoutes');     // Admin Dashboard, Add/Delete Trains

// ----------------------------------------------------------------------------
// STEP 2: CREATE AND CONFIGURE EXPRESS APP
// ----------------------------------------------------------------------------
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse incoming request data
app.use(cors());                           // Enable Cross-Origin Resource Sharing
app.use(express.json());                   // Parse JSON bodies (e.g. from fetch/axios)
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded form data

// Serve static frontend files (index.html, CSS, JS, images) from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// ----------------------------------------------------------------------------
// STEP 3: REGISTER API ROUTES
// ----------------------------------------------------------------------------
app.use('/api/auth', authRoutes);          // Endpoints starting with /api/auth
app.use('/api/trains', trainRoutes);       // Endpoints starting with /api/trains
app.use('/api/bookings', bookingRoutes);   // Endpoints starting with /api/bookings
app.use('/api/admin', adminRoutes);        // Endpoints starting with /api/admin

// ----------------------------------------------------------------------------
// STEP 4: UTILITY & HEALTH CHECK ENDPOINTS
// ----------------------------------------------------------------------------

/**
 * Health check endpoint:
 * Used by cloud deployment platforms (Render, Railway, Docker) to check if the server is alive.
 */
app.get('/api/health', async (req, res) => {
  const dbHealth = await checkDbHealth();
  res.json({
    status: 'ONLINE',
    system: 'Indian Railway Reservation System',
    database: dbHealth.status,
    environment: process.env.NODE_ENV || 'development',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

/**
 * Home page redirect:
 * When a user visits '/', deliver the homepage index.html
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Centralized error handler for any uncaught errors
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(500).json({
    success: false,
    message: 'An internal server error occurred. Please try again later.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ----------------------------------------------------------------------------
// STEP 5: START THE SERVER & INITIALIZE DATABASE
// ----------------------------------------------------------------------------
async function startServer() {
  console.log('Connecting to MySQL database...');
  // Initialize tables and seed demo data from database/railway.sql if not yet present
  await initDb();

  const server = app.listen(PORT, () => {
    console.log('\n======================================================');
    console.log('   🚆 RAILORA - INDIAN RAILWAY RESERVATION SYSTEM     ');
    console.log('======================================================');
    console.log(` Server is running on: http://localhost:${PORT}`);
    console.log('\n Available Pages:');
    console.log(` • Home / Search:    http://localhost:${PORT}`);
    console.log(` • Train Results:    http://localhost:${PORT}/trains.html`);
    console.log(` • Train Schedule:   http://localhost:${PORT}/schedule.html`);
    console.log(` • PNR Status:       http://localhost:${PORT}/pnr.html`);
    console.log(` • My Bookings:      http://localhost:${PORT}/my-bookings.html`);
    console.log(` • Admin Dashboard:  http://localhost:${PORT}/admin.html`);
    console.log(` • Login / Register: http://localhost:${PORT}/login.html`);
    console.log('\n Default Login Credentials:');
    console.log(' • Admin: admin@railway.gov.in / admin123');
    console.log(' • User:  rahul@gmail.com / password123');
    console.log('======================================================\n');
  });

  return server;
}

// Only start listening when executed directly (not when required for testing)
if (require.main === module) {
  startServer();
}

// Export app for deployment / tests / Vercel
module.exports = app;
