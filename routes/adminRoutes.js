/**
 * ============================================================================
 * RAILORA - ADMINISTRATIVE OPERATIONS ROUTES
 * File: routes/adminRoutes.js
 * Description: Manages admin metrics, train CRUD (Create, Read, Update, Delete),
 *              and the passenger reservation manifest.
 * Level: Beginner-Friendly / Educational
 * ============================================================================
 * 
 * Access Control:
 * All routes in this file are protected by `requireAdmin`. Only users with the
 * role 'admin' (e.g. admin@railway.gov.in) are permitted to access these endpoints.
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { requireAdmin } = require('../middleware/auth');

// Protect all admin endpoints with admin role check
router.use(requireAdmin);

// ----------------------------------------------------------------------------
// ROUTE 1: GET DASHBOARD KPIS & STATISTICS
// GET /api/admin/stats
// ----------------------------------------------------------------------------
router.get('/stats', async (req, res) => {
  try {
    // Run simple COUNT queries to calculate key system statistics
    const [[trainCount]] = await pool.query('SELECT COUNT(*) AS total FROM trains');
    const [[userCount]] = await pool.query("SELECT COUNT(*) AS total FROM users WHERE role = 'user'");
    const [[stationCount]] = await pool.query('SELECT COUNT(*) AS total FROM stations');
    const [[bookingCount]] = await pool.query('SELECT COUNT(*) AS total FROM bookings');
    const [[confirmedCount]] = await pool.query("SELECT COUNT(*) AS total FROM bookings WHERE booking_status = 'CONFIRMED'");
    const [[cancelledCount]] = await pool.query("SELECT COUNT(*) AS total FROM bookings WHERE booking_status = 'CANCELLED'");
    const [[revenueResult]] = await pool.query("SELECT COALESCE(SUM(total_fare), 0) AS total FROM bookings WHERE booking_status = 'CONFIRMED'");

    // Fetch the 5 most recent bookings to display on the dashboard table
    const [recentBookings] = await pool.query(
      `SELECT b.id, b.pnr_number, b.booking_status, b.total_fare, b.journey_date, b.booking_date,
              t.train_number, t.train_name, u.name AS user_name
       FROM bookings b
       JOIN trains t ON b.train_id = t.id
       JOIN users u ON b.user_id = u.id
       ORDER BY b.booking_date DESC LIMIT 5`
    );

    res.json({
      success: true,
      stats: {
        total_trains: trainCount.total,
        total_users: userCount.total,
        total_stations: stationCount.total,
        total_bookings: bookingCount.total,
        confirmed_bookings: confirmedCount.total,
        cancelled_bookings: cancelledCount.total,
        total_revenue: parseFloat(revenueResult.total || 0).toFixed(2),
        recent_bookings: recentBookings
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve administrative statistics.'
    });
  }
});

// ----------------------------------------------------------------------------
// ROUTE 2: GET ALL TRAINS (For Admin Management)
// GET /api/admin/trains
// ----------------------------------------------------------------------------
router.get('/trains', async (req, res) => {
  try {
    const [trains] = await pool.query(
      `SELECT 
        t.*,
        s1.code AS source_code, s1.name AS source_name, s1.city AS source_city,
        s2.code AS dest_code, s2.name AS dest_name, s2.city AS dest_city
       FROM trains t
       JOIN stations s1 ON t.source_station_id = s1.id
       JOIN stations s2 ON t.destination_station_id = s2.id
       ORDER BY t.train_number ASC`
    );

    // Fetch classes for each train
    const trainsWithClasses = await Promise.all(
      trains.map(async (train) => {
        const [classes] = await pool.query(
          'SELECT class_code, class_name, total_seats, base_fare FROM train_classes WHERE train_id = ?',
          [train.id]
        );
        return {
          ...train,
          classes
        };
      })
    );

    res.json({
      success: true,
      count: trainsWithClasses.length,
      trains: trainsWithClasses
    });
  } catch (error) {
    console.error('Error fetching admin trains:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve trains list.'
    });
  }
});

// ----------------------------------------------------------------------------
// ROUTE 3: ADD A NEW TRAIN
// POST /api/admin/trains
// ----------------------------------------------------------------------------
router.post('/trains', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const {
      train_number,
      train_name,
      source_station_id,
      destination_station_id,
      departure_time,
      arrival_time,
      duration,
      runs_on,
      train_type,
      classes
    } = req.body;

    // 1. Validate fields
    if (!train_number || !train_name || !source_station_id || !destination_station_id || !departure_time || !arrival_time) {
      return res.status(400).json({
        success: false,
        message: 'All train operational fields are required.'
      });
    }

    if (parseInt(source_station_id, 10) === parseInt(destination_station_id, 10)) {
      return res.status(400).json({
        success: false,
        message: 'Source and destination stations cannot be the same.'
      });
    }

    await connection.beginTransaction();

    // 2. Check for duplicate train number
    const [existing] = await connection.query(
      'SELECT id FROM trains WHERE train_number = ? LIMIT 1',
      [train_number.trim()]
    );

    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Train number ${train_number} is already registered.`
      });
    }

    // 3. Insert train record
    const [trainResult] = await connection.query(
      `INSERT INTO trains 
       (train_number, train_name, source_station_id, destination_station_id, departure_time, arrival_time, duration, runs_on, train_type, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
      [
        train_number.trim(),
        train_name.trim(),
        source_station_id,
        destination_station_id,
        departure_time,
        arrival_time,
        duration || '12h 00m',
        runs_on || 'Daily',
        train_type || 'Superfast'
      ]
    );

    const newTrainId = trainResult.insertId;

    // 4. Insert classes (e.g. 3A, SL)
    if (Array.isArray(classes) && classes.length > 0) {
      for (const cls of classes) {
        if (cls.class_code && cls.base_fare) {
          await connection.query(
            `INSERT INTO train_classes (train_id, class_code, class_name, total_seats, base_fare) 
             VALUES (?, ?, ?, ?, ?)`,
            [
              newTrainId,
              cls.class_code,
              cls.class_name || cls.class_code,
              cls.total_seats || 60,
              cls.base_fare
            ]
          );
        }
      }
    } else {
      // Default classes: 3A and SL
      await connection.query(
        `INSERT INTO train_classes (train_id, class_code, class_name, total_seats, base_fare) VALUES 
         (?, '3A', 'AC 3 Tier', 64, 1450.00),
         (?, 'SL', 'Sleeper Class', 80, 520.00)`,
        [newTrainId, newTrainId]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: `Train ${train_number} - ${train_name} added successfully!`,
      trainId: newTrainId
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error adding train:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to add train: ' + error.message
    });
  } finally {
    connection.release();
  }
});

// ----------------------------------------------------------------------------
// ROUTE 4: DELETE A TRAIN
// DELETE /api/admin/trains/:id
// ----------------------------------------------------------------------------
router.delete('/trains/:id', async (req, res) => {
  try {
    const trainId = parseInt(req.params.id, 10);

    const [result] = await pool.query('DELETE FROM trains WHERE id = ?', [trainId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Train not found.'
      });
    }

    res.json({
      success: true,
      message: 'Train deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting train:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete train.'
    });
  }
});

// ----------------------------------------------------------------------------
// ROUTE 5: GET ALL BOOKINGS (With Search & Status Filter)
// GET /api/admin/bookings?status=CONFIRMED&search=8429104821
// ----------------------------------------------------------------------------
router.get('/bookings', async (req, res) => {
  try {
    const { status, search } = req.query;

    let query = `
      SELECT 
        b.id,
        b.pnr_number,
        b.class_code,
        b.journey_date,
        b.booking_date,
        b.total_passengers,
        b.total_fare,
        b.quota,
        b.booking_status,
        b.payment_status,
        t.train_number,
        t.train_name,
        u.name AS user_name,
        u.email AS user_email,
        u.phone AS user_phone,
        s1.code AS source_code,
        s2.code AS dest_code
      FROM bookings b
      JOIN trains t ON b.train_id = t.id
      JOIN users u ON b.user_id = u.id
      JOIN stations s1 ON t.source_station_id = s1.id
      JOIN stations s2 ON t.destination_station_id = s2.id
      WHERE 1=1
    `;

    const params = [];

    // Filter by booking status (e.g. CONFIRMED or CANCELLED)
    if (status && status !== 'ALL') {
      query += ' AND b.booking_status = ?';
      params.push(status);
    }

    // Search by PNR, Train Number, User Name, or Email
    if (search) {
      query += ' AND (b.pnr_number LIKE ? OR t.train_number LIKE ? OR u.name LIKE ? OR u.email LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s, s, s);
    }

    query += ' ORDER BY b.booking_date DESC LIMIT 100';

    const [bookings] = await pool.query(query, params);

    res.json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error('Error fetching admin bookings:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve bookings list.'
    });
  }
});

// ----------------------------------------------------------------------------
// ROUTE 6: GET ALL SIMULATED PAYMENTS
// GET /api/admin/payments
// ----------------------------------------------------------------------------
router.get('/payments', async (req, res) => {
  try {
    const [payments] = await pool.query(
      `SELECT p.*, b.pnr_number, u.name AS user_name, u.email AS user_email
       FROM payments p
       JOIN bookings b ON p.booking_id = b.id
       JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC LIMIT 100`
    );

    res.json({
      success: true,
      count: payments.length,
      payments
    });
  } catch (error) {
    console.error('Error fetching payments:', error.message);
    res.status(500).json({ success: false, message: 'Failed to retrieve payments.' });
  }
});

// ----------------------------------------------------------------------------
// ROUTE 7: GET ALL SIMULATED REFUNDS
// GET /api/admin/refunds
// ----------------------------------------------------------------------------
router.get('/refunds', async (req, res) => {
  try {
    const [refunds] = await pool.query(
      `SELECT r.*, c.pnr_number, c.cancellation_charge, u.name AS user_name, u.email AS user_email
       FROM refunds r
       JOIN cancellations c ON r.cancellation_id = c.id
       JOIN users u ON r.user_id = u.id
       ORDER BY r.processed_at DESC LIMIT 100`
    );

    res.json({
      success: true,
      count: refunds.length,
      refunds
    });
  } catch (error) {
    console.error('Error fetching refunds:', error.message);
    res.status(500).json({ success: false, message: 'Failed to retrieve refunds.' });
  }
});

// ----------------------------------------------------------------------------
// ROUTE 8: GET ALL REGISTERED USERS
// GET /api/admin/users
// ----------------------------------------------------------------------------
router.get('/users', async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT id, name, email, phone, role, created_at,
              (SELECT COUNT(*) FROM bookings WHERE bookings.user_id = users.id) AS total_bookings
       FROM users
       ORDER BY id ASC`
    );

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Error fetching users:', error.message);
    res.status(500).json({ success: false, message: 'Failed to retrieve users.' });
  }
});

// ----------------------------------------------------------------------------
// ROUTE 9: GET SUPPORT & HELPDESK MESSAGES
// GET /api/admin/messages
// ----------------------------------------------------------------------------
router.get('/messages', async (req, res) => {
  try {
    const [messages] = await pool.query(
      'SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 100'
    );

    res.json({
      success: true,
      count: messages.length,
      messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error.message);
    res.status(500).json({ success: false, message: 'Failed to retrieve messages.' });
  }
});

module.exports = router;
