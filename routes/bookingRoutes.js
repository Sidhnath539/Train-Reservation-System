/**
 * ============================================================================
 * RAILORA - TICKET BOOKING & PNR ROUTES
 * File: routes/bookingRoutes.js
 * Description: Manages ticket reservations, atomic seat allocation, PNR lookup,
 *              and ticket cancellations.
 * Level: Beginner-Friendly / Educational
 * ============================================================================
 * 
 * What is a Database Transaction?
 * When booking a ticket, multiple operations must happen together:
 * 1. Check if seats are available.
 * 2. Deduct seats from the database.
 * 3. Save the booking and passenger records.
 * If anything fails midway, a Transaction automatically "Rolls back" to undo changes,
 * preventing double-booking or seat corruption!
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// ----------------------------------------------------------------------------
// HELPER 1: Generate a random 10-digit Indian Railway PNR Number
// ----------------------------------------------------------------------------
async function generateUniquePNR(connection) {
  let isUnique = false;
  let pnr = '';

  while (!isUnique) {
    // Standard Indian Railway PNR: 3-digit zone prefix + 7 random digits
    const prefixes = ['284', '842', '651', '472', '239', '891', '340'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = Math.floor(1000000 + Math.random() * 9000000).toString();
    pnr = prefix + suffix;

    // Check if this PNR already exists in database
    const [existing] = await connection.query(
      'SELECT id FROM bookings WHERE pnr_number = ? LIMIT 1',
      [pnr]
    );
    if (existing.length === 0) {
      isUnique = true;
    }
  }
  return pnr;
}

// ----------------------------------------------------------------------------
// HELPER 2: Realistic Coach and Berth Allocation (e.g., B1-24 (LB))
// ----------------------------------------------------------------------------
function allocateSeat(classCode, seatIndex, preference) {
  // Determine coach prefix based on travel class
  let coachPrefix = 'S1';
  if (classCode === '1A') coachPrefix = 'H1';
  else if (classCode === '2A') coachPrefix = 'A1';
  else if (classCode === '3A') coachPrefix = 'B' + (Math.floor(seatIndex / 64) + 1);
  else if (classCode === 'CC') coachPrefix = 'C' + (Math.floor(seatIndex / 72) + 1);
  else if (classCode === 'EC') coachPrefix = 'E1';
  else if (classCode === '2S') coachPrefix = 'D1';

  const seatNum = (seatIndex % 72) + 1;

  // Determine berth type (Lower, Middle, Upper, Side Lower, Side Upper)
  let berth = preference || 'Lower';
  if (['No Preference', ''].includes(berth)) {
    const mod = seatNum % 8;
    if (mod === 1 || mod === 4) berth = 'LB';       // Lower Berth
    else if (mod === 2 || mod === 5) berth = 'MB';  // Middle Berth
    else if (mod === 3 || mod === 6) berth = 'UB';  // Upper Berth
    else if (mod === 7) berth = 'SL';               // Side Lower
    else berth = 'SU';                              // Side Upper
  } else {
    const map = {
      'Lower': 'LB',
      'Middle': 'MB',
      'Upper': 'UB',
      'Side Lower': 'SL',
      'Side Upper': 'SU',
      'Window': 'WS'
    };
    berth = map[berth] || berth;
  }

  return `${coachPrefix}-${seatNum} (${berth})`;
}

// ----------------------------------------------------------------------------
// ROUTE 1: BOOK TRAIN TICKET (With Atomic Database Transaction)
// POST /api/bookings/book
// ----------------------------------------------------------------------------
router.post('/book', requireAuth, async (req, res) => {
  // Get a single dedicated connection from the pool for this transaction
  const connection = await pool.getConnection();

  try {
    const { train_id, class_code, journey_date, quota, passengers } = req.body;

    // STEP 1: VALIDATE REQUEST DATA
    if (!train_id || !class_code || !journey_date || !Array.isArray(passengers) || passengers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide train ID, class code, date, and passenger details.'
      });
    }

    if (passengers.length > 6) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 6 passengers allowed per booking.'
      });
    }

    for (const p of passengers) {
      if (!p.name || !p.age || !p.gender) {
        return res.status(400).json({
          success: false,
          message: 'All passengers must have a valid Name, Age, and Gender.'
        });
      }
    }

    // STEP 2: START DATABASE TRANSACTION
    await connection.beginTransaction();

    // 1. Fetch train and class information (with FOR UPDATE row lock)
    const [classRows] = await connection.query(
      `SELECT tc.*, t.train_name, t.train_number 
       FROM train_classes tc 
       JOIN trains t ON tc.train_id = t.id 
       WHERE tc.train_id = ? AND tc.class_code = ? FOR UPDATE`,
      [train_id, class_code]
    );

    if (classRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'The selected train or class was not found.'
      });
    }

    const trainClass = classRows[0];
    const totalCapacity = trainClass.total_seats;
    const baseFare = parseFloat(trainClass.base_fare);
    const passengerCount = passengers.length;

    // 2. Fetch or initialize seat counts for this date
    let [scheduleRows] = await connection.query(
      `SELECT id, available_seats, waiting_seats 
       FROM train_schedule_seats 
       WHERE train_id = ? AND class_code = ? AND journey_date = ? 
       FOR UPDATE`,
      [train_id, class_code, journey_date]
    );

    let scheduleId;
    let availableSeats;
    let waitingSeats;

    if (scheduleRows.length === 0) {
      // First booking on this date -> create seat availability record
      const [insertSchedule] = await connection.query(
        `INSERT INTO train_schedule_seats (train_id, class_code, journey_date, available_seats, waiting_seats) 
         VALUES (?, ?, ?, ?, 0)`,
        [train_id, class_code, journey_date, totalCapacity]
      );
      scheduleId = insertSchedule.insertId;
      availableSeats = totalCapacity;
      waitingSeats = 0;
    } else {
      scheduleId = scheduleRows[0].id;
      availableSeats = scheduleRows[0].available_seats;
      waitingSeats = scheduleRows[0].waiting_seats;
    }

    // 3. Allocate Seats: Check if seats are Available (CNF) or Waitlisted (WL)
    let bookingStatus = 'CONFIRMED';
    const allocatedPassengers = [];

    if (availableSeats >= passengerCount) {
      // Enough seats are available -> CONFIRMED (CNF)
      const newAvailable = availableSeats - passengerCount;
      await connection.query(
        'UPDATE train_schedule_seats SET available_seats = ? WHERE id = ?',
        [newAvailable, scheduleId]
      );

      passengers.forEach((p, idx) => {
        const seatAlloc = allocateSeat(class_code, totalCapacity - availableSeats + idx, p.berth_preference);
        allocatedPassengers.push({
          name: p.name.trim(),
          age: parseInt(p.age, 10),
          gender: p.gender,
          berth_preference: p.berth_preference || 'No Preference',
          allocated_seat: seatAlloc,
          status: 'CNF'
        });
      });
      bookingStatus = 'CONFIRMED';
    } else {
      // Seats are full -> WAITLISTED (WL)
      const newWaiting = waitingSeats + passengerCount;
      await connection.query(
        'UPDATE train_schedule_seats SET waiting_seats = ? WHERE id = ?',
        [newWaiting, scheduleId]
      );

      passengers.forEach((p, idx) => {
        const wlNumber = waitingSeats + idx + 1;
        allocatedPassengers.push({
          name: p.name.trim(),
          age: parseInt(p.age, 10),
          gender: p.gender,
          berth_preference: p.berth_preference || 'No Preference',
          allocated_seat: `WL ${wlNumber}`,
          status: 'WL'
        });
      });
      bookingStatus = 'WAITLISTED';
    }

    // 4. Calculate total price (Base Fare + GST 5% on AC + 15 Service Charge)
    const subtotal = baseFare * passengerCount;
    const isAC = ['1A', '2A', '3A', 'CC', 'EC'].includes(class_code);
    const gst = isAC ? subtotal * 0.05 : 0;
    const serviceFee = 15.00;
    const totalFare = parseFloat((subtotal + gst + serviceFee).toFixed(2));

    // 5. Generate a unique 10-digit PNR
    const pnrNumber = await generateUniquePNR(connection);

    // 6. Insert record into `bookings` table
    const [bookingResult] = await connection.query(
      `INSERT INTO bookings 
       (pnr_number, user_id, train_id, class_code, journey_date, total_passengers, total_fare, quota, booking_status, payment_status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PAID')`,
      [
        pnrNumber,
        req.user.id,
        train_id,
        class_code,
        journey_date,
        passengerCount,
        totalFare,
        quota || 'GENERAL',
        bookingStatus
      ]
    );

    const bookingId = bookingResult.insertId;

    // 7. Insert each passenger into `passengers` table
    for (const p of allocatedPassengers) {
      await connection.query(
        `INSERT INTO passengers 
         (booking_id, name, age, gender, berth_preference, allocated_seat, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [bookingId, p.name, p.age, p.gender, p.berth_preference, p.allocated_seat, p.status]
      );
    }

    // STEP 3: COMMIT TRANSACTION (Save all changes permanently)
    await connection.commit();

    console.log(` Ticket booked successfully! PNR: ${pnrNumber}, Status: ${bookingStatus}`);

    res.status(201).json({
      success: true,
      message: bookingStatus === 'CONFIRMED' ? 'Ticket booked and confirmed successfully!' : 'Ticket booked in Waitlist status.',
      booking: {
        id: bookingId,
        pnr_number: pnrNumber,
        train_id,
        train_name: trainClass.train_name,
        train_number: trainClass.train_number,
        class_code,
        journey_date,
        total_passengers: passengerCount,
        total_fare: totalFare,
        booking_status: bookingStatus,
        passengers: allocatedPassengers
      }
    });
  } catch (error) {
    // If anything fails, rollback all changes
    await connection.rollback();
    console.error('Booking Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to process booking. ' + error.message
    });
  } finally {
    // Always return the connection back to the pool
    connection.release();
  }
});

// ----------------------------------------------------------------------------
// ROUTE 2: PNR STATUS INQUIRY & E-TICKET DETAILS
// GET /api/bookings/pnr/:pnr
// ----------------------------------------------------------------------------
router.get('/pnr/:pnr', optionalAuth, async (req, res) => {
  try {
    const pnrParam = req.params.pnr.trim();

    if (!pnrParam || pnrParam.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit PNR number.'
      });
    }

    // Join bookings with trains, stations, and user details
    const [bookings] = await pool.query(
      `SELECT 
        b.id,
        b.pnr_number,
        b.user_id,
        b.train_id,
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
        t.train_type,
        t.departure_time,
        t.arrival_time,
        t.duration,
        s1.code AS source_code,
        s1.name AS source_name,
        s1.city AS source_city,
        s2.code AS dest_code,
        s2.name AS dest_name,
        s2.city AS dest_city,
        u.name AS booked_by_name,
        u.email AS booked_by_email
       FROM bookings b
       JOIN trains t ON b.train_id = t.id
       JOIN stations s1 ON t.source_station_id = s1.id
       JOIN stations s2 ON t.destination_station_id = s2.id
       JOIN users u ON b.user_id = u.id
       WHERE b.pnr_number = ? LIMIT 1`,
      [pnrParam]
    );

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No booking found for PNR "${pnrParam}". Please verify your number.`
      });
    }

    const booking = bookings[0];

    // Fetch passenger details for this ticket
    const [passengers] = await pool.query(
      `SELECT id, name, age, gender, berth_preference, allocated_seat, status 
       FROM passengers 
       WHERE booking_id = ? ORDER BY id ASC`,
      [booking.id]
    );

    const isOwner = req.user && (req.user.id === booking.user_id || req.user.role === 'admin');

    res.json({
      success: true,
      booking: {
        ...booking,
        is_owner: !!isOwner,
        passengers
      }
    });
  } catch (error) {
    console.error('PNR lookup error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to look up PNR status.'
    });
  }
});

// ----------------------------------------------------------------------------
// ROUTE 3: GET MY BOOKINGS (For logged-in passenger profile)
// GET /api/bookings/my-bookings
// ----------------------------------------------------------------------------
router.get('/my-bookings', requireAuth, async (req, res) => {
  try {
    const [bookings] = await pool.query(
      `SELECT 
        b.id,
        b.pnr_number,
        b.class_code,
        b.journey_date,
        b.booking_date,
        b.total_passengers,
        b.total_fare,
        b.booking_status,
        t.train_number,
        t.train_name,
        t.train_type,
        t.departure_time,
        t.arrival_time,
        s1.city AS source_city,
        s1.code AS source_code,
        s2.city AS dest_city,
        s2.code AS dest_code
       FROM bookings b
       JOIN trains t ON b.train_id = t.id
       JOIN stations s1 ON t.source_station_id = s1.id
       JOIN stations s2 ON t.destination_station_id = s2.id
       WHERE b.user_id = ?
       ORDER BY b.booking_date DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error('Error fetching bookings:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve booking history.'
    });
  }
});

// ----------------------------------------------------------------------------
// ROUTE 4: CANCEL TICKET & RESTORE SEAT AVAILABILITY
// POST /api/bookings/cancel/:pnr
// ----------------------------------------------------------------------------
router.post('/cancel/:pnr', requireAuth, async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const pnrParam = req.params.pnr.trim();

    await connection.beginTransaction();

    // 1. Fetch booking record
    const [bookings] = await connection.query(
      'SELECT * FROM bookings WHERE pnr_number = ? FOR UPDATE',
      [pnrParam]
    );

    if (bookings.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const booking = bookings[0];

    // Ensure only ticket owner or admin can cancel
    if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
      await connection.rollback();
      return res.status(403).json({ success: false, message: 'You are not authorized to cancel this booking.' });
    }

    if (booking.booking_status === 'CANCELLED') {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'This ticket has already been cancelled.' });
    }

    // 2. Mark booking as CANCELLED in database
    await connection.query(
      "UPDATE bookings SET booking_status = 'CANCELLED' WHERE id = ?",
      [booking.id]
    );

    // Update all passenger statuses to CAN
    await connection.query(
      "UPDATE passengers SET status = 'CAN' WHERE booking_id = ?",
      [booking.id]
    );

    // 3. Restore seats in schedule if it was a CONFIRMED booking
    if (booking.booking_status === 'CONFIRMED') {
      await connection.query(
        `UPDATE train_schedule_seats 
         SET available_seats = available_seats + ? 
         WHERE train_id = ? AND class_code = ? AND journey_date = ?`,
        [booking.total_passengers, booking.train_id, booking.class_code, booking.journey_date]
      );
    }

    // 4. Calculate refund (deduct standard IRCTC cancellation fee of 60 per passenger)
    const cancelCharge = booking.total_passengers * 60;
    const refundAmount = Math.max(0, parseFloat(booking.total_fare) - cancelCharge);

    await connection.commit();

    res.json({
      success: true,
      message: 'Ticket cancelled successfully.',
      refund_amount: refundAmount.toFixed(2),
      cancellation_charge: cancelCharge.toFixed(2)
    });
  } catch (error) {
    await connection.rollback();
    console.error('Cancellation error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel ticket.'
    });
  } finally {
    connection.release();
  }
});

module.exports = router;
