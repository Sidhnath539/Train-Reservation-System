const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

/**
 * Helper: Generate unique 10-digit Indian Railway PNR Number
 */
async function generateUniquePNR(connection) {
  let isUnique = false;
  let pnr = '';

  while (!isUnique) {
    // Standard Indian Railway PNR is 10 digits
    // Format: 3-digit zone prefix (e.g. 284, 842, 651, 472) + 7 random digits
    const prefixes = ['284', '842', '651', '472', '239', '891', '340'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = Math.floor(1000000 + Math.random() * 9000000).toString();
    pnr = prefix + suffix;

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

/**
 * Helper: Generate realistic Coach & Berth Allocation
 */
function allocateSeat(classCode, seatIndex, preference) {
  let coachPrefix = 'S1';
  if (classCode === '1A') coachPrefix = 'H1';
  else if (classCode === '2A') coachPrefix = 'A1';
  else if (classCode === '3A') coachPrefix = 'B' + (Math.floor(seatIndex / 64) + 1);
  else if (classCode === 'CC') coachPrefix = 'C' + (Math.floor(seatIndex / 72) + 1);
  else if (classCode === 'EC') coachPrefix = 'E1';
  else if (classCode === '2S') coachPrefix = 'D1';

  const seatNum = (seatIndex % 72) + 1;

  // Determine berth type
  let berth = preference || 'Lower';
  if (['No Preference', ''].includes(berth)) {
    const mod = seatNum % 8;
    if (mod === 1 || mod === 4) berth = 'LB'; // Lower Berth
    else if (mod === 2 || mod === 5) berth = 'MB'; // Middle Berth
    else if (mod === 3 || mod === 6) berth = 'UB'; // Upper Berth
    else if (mod === 7) berth = 'SL'; // Side Lower
    else berth = 'SU'; // Side Upper
  } else {
    // Map preference to acronym
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

/**
 * Book train tickets with safe MySQL transactions and atomic seat locks
 * POST /api/bookings/book
 */
router.post('/book', requireAuth, async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { train_id, class_code, journey_date, quota, passengers } = req.body;

    if (!train_id || !class_code || !journey_date || !Array.isArray(passengers) || passengers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required booking information or passenger details.'
      });
    }

    if (passengers.length > 6) {
      return res.status(400).json({
        success: false,
        message: 'A maximum of 6 passengers can be booked on a single ticket.'
      });
    }

    // Validate passenger fields
    for (const p of passengers) {
      if (!p.name || !p.age || !p.gender) {
        return res.status(400).json({
          success: false,
          message: 'All passengers must have a valid Name, Age, and Gender.'
        });
      }
    }

    // Start Transaction
    await connection.beginTransaction();

    // 1. Fetch and Lock the Train Class info
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
        message: 'Selected train or travel class was not found.'
      });
    }

    const trainClass = classRows[0];
    const totalCapacity = trainClass.total_seats;
    const baseFare = parseFloat(trainClass.base_fare);
    const passengerCount = passengers.length;

    // 2. Fetch or Initialize Seat Schedule row FOR UPDATE to prevent race conditions
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
      // First booking for this train/date/class combination -> insert new schedule row
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

    // 3. Determine Booking Status and Seat Allocations
    let bookingStatus = 'CONFIRMED';
    const allocatedPassengers = [];

    if (availableSeats >= passengerCount) {
      // All passengers confirmed
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
      // Waitlisted booking
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

    // 4. Calculate Total Fare (Base Fare * count + GST 5% for AC + IRCTC service charge 15)
    const subtotal = baseFare * passengerCount;
    const isAC = ['1A', '2A', '3A', 'CC', 'EC'].includes(class_code);
    const gst = isAC ? subtotal * 0.05 : 0;
    const serviceFee = 15.00;
    const totalFare = parseFloat((subtotal + gst + serviceFee).toFixed(2));

    // 5. Generate Unique PNR
    const pnrNumber = await generateUniquePNR(connection);

    // 6. Insert Booking Record
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

    // 7. Insert Passenger Records
    for (const p of allocatedPassengers) {
      await connection.query(
        `INSERT INTO passengers 
         (booking_id, name, age, gender, berth_preference, allocated_seat, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [bookingId, p.name, p.age, p.gender, p.berth_preference, p.allocated_seat, p.status]
      );
    }

    // Commit Transaction
    await connection.commit();

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
    await connection.rollback();
    console.error('Ticket booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process ticket booking: ' + error.message
    });
  } finally {
    connection.release();
  }
});

/**
 * PNR Status Inquiry
 * GET /api/bookings/pnr/:pnr
 */
router.get('/pnr/:pnr', optionalAuth, async (req, res) => {
  try {
    const pnrParam = req.params.pnr.trim();

    if (!pnrParam || pnrParam.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit PNR number.'
      });
    }

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
        message: `No booking found for PNR: ${pnrParam}. Please check the number and try again.`
      });
    }

    const booking = bookings[0];

    // Fetch passenger list
    const [passengers] = await pool.query(
      `SELECT id, name, age, gender, berth_preference, allocated_seat, status 
       FROM passengers 
       WHERE booking_id = ? 
       ORDER BY id ASC`,
      [booking.id]
    );

    // Check if the current user owns this booking (for showing cancellation rights)
    const isOwner = req.user && (req.user.id === booking.user_id || req.user.role === 'admin');

    res.json({
      success: true,
      booking: {
        ...booking,
        is_owner: isOwner,
        passengers
      }
    });
  } catch (error) {
    console.error('PNR inquiry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve PNR details.'
    });
  }
});

/**
 * Cancel Ticket and Restore Seat Availability safely
 * POST /api/bookings/cancel
 */
router.post('/cancel', requireAuth, async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { pnr_number, booking_id } = req.body;

    if (!pnr_number && !booking_id) {
      return res.status(400).json({
        success: false,
        message: 'PNR number or Booking ID is required to cancel a ticket.'
      });
    }

    await connection.beginTransaction();

    // Query booking with row lock
    let bookingQuery = 'SELECT * FROM bookings WHERE ';
    const queryParam = pnr_number ? pnr_number.trim() : booking_id;
    bookingQuery += pnr_number ? 'pnr_number = ?' : 'id = ?';
    bookingQuery += ' FOR UPDATE';

    const [bookings] = await connection.query(bookingQuery, [queryParam]);

    if (bookings.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Booking not found.'
      });
    }

    const booking = bookings[0];

    // Verify ownership (unless Admin)
    if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this booking.'
      });
    }

    // Verify not already cancelled
    if (booking.booking_status === 'CANCELLED') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'This ticket has already been cancelled.'
      });
    }

    // 1. Update Booking status to CANCELLED and payment to REFUNDED
    await connection.query(
      `UPDATE bookings 
       SET booking_status = 'CANCELLED', payment_status = 'REFUNDED' 
       WHERE id = ?`,
      [booking.id]
    );

    // 2. Update all passengers to status 'CAN'
    await connection.query(
      `UPDATE passengers SET status = 'CAN' WHERE booking_id = ?`,
      [booking.id]
    );

    // 3. If booking was CONFIRMED, restore available seats safely
    if (booking.booking_status === 'CONFIRMED') {
      await connection.query(
        `UPDATE train_schedule_seats 
         SET available_seats = available_seats + ? 
         WHERE train_id = ? AND class_code = ? AND journey_date = ?`,
        [booking.total_passengers, booking.train_id, booking.class_code, booking.journey_date]
      );
    } else if (booking.booking_status === 'WAITLISTED') {
      await connection.query(
        `UPDATE train_schedule_seats 
         SET waiting_seats = GREATEST(0, waiting_seats - ?) 
         WHERE train_id = ? AND class_code = ? AND journey_date = ?`,
        [booking.total_passengers, booking.train_id, booking.class_code, booking.journey_date]
      );
    }

    // 4. Calculate realistic refund amount (deducting nominal IRCTC cancellation charge)
    const cancellationChargePerPassenger = ['1A', '2A', 'EC'].includes(booking.class_code) ? 180 : 60;
    const totalCharges = cancellationChargePerPassenger * booking.total_passengers;
    const refundAmount = Math.max(0, parseFloat((booking.total_fare - totalCharges).toFixed(2)));

    await connection.commit();

    res.json({
      success: true,
      message: 'Ticket cancelled successfully. Refund has been initiated to original payment mode.',
      refund: {
        pnr_number: booking.pnr_number,
        original_fare: booking.total_fare,
        cancellation_charge: totalCharges,
        refund_amount: refundAmount,
        status: 'REFUNDED'
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Cancellation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel ticket: ' + error.message
    });
  } finally {
    connection.release();
  }
});

/**
 * Get all bookings for the currently authenticated user
 * GET /api/bookings/my-bookings
 */
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
        s2.city AS dest_city
       FROM bookings b
       JOIN trains t ON b.train_id = t.id
       JOIN stations s1 ON t.source_station_id = s1.id
       JOIN stations s2 ON t.destination_station_id = s2.id
       WHERE b.user_id = ?
       ORDER BY b.booking_date DESC`,
      [req.user.id]
    );

    // Fetch passengers for each booking
    const bookingsWithPassengers = await Promise.all(
      bookings.map(async (booking) => {
        const [passengers] = await pool.query(
          'SELECT id, name, age, gender, berth_preference, allocated_seat, status FROM passengers WHERE booking_id = ?',
          [booking.id]
        );
        return {
          ...booking,
          passengers
        };
      })
    );

    res.json({
      success: true,
      count: bookingsWithPassengers.length,
      bookings: bookingsWithPassengers
    });
  } catch (error) {
    console.error('My bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve your bookings.'
    });
  }
});

module.exports = router;
