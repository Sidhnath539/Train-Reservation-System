/**
 * ============================================================================
 * RAILORA - CONTACT & HELPDESK ROUTES
 * File: routes/contactRoutes.js
 * Description: Handles passenger assistance queries, helpline info, and FAQs.
 * Level: Beginner-Friendly / Educational
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../db');

/**
 * 1. POST /api/contact/submit
 * Submits an enquiry or grievance ticket to the database
 */
router.post('/submit', async (req, res) => {
  try {
    const { name, email, phone, category, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, subject, and message are required.'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO contact_messages (name, email, phone, category, subject, message, status)
       VALUES (?, ?, ?, ?, ?, ?, 'NEW')`,
      [name.trim(), email.trim(), phone ? phone.trim() : null, category || 'General Enquiry', subject.trim(), message.trim()]
    );

    res.status(201).json({
      success: true,
      ticket_id: `TKT-${result.insertId}`,
      message: `Your inquiry has been submitted! Ticket reference: TKT-${result.insertId}. Our railway helpdesk will contact you shortly.`
    });
  } catch (error) {
    console.error('Contact submission error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to submit message.'
    });
  }
});

/**
 * 2. GET /api/contact/faqs
 * Common Indian Railway Reservation FAQs
 */
router.get('/faqs', (req, res) => {
  res.json({
    success: true,
    faqs: [
      {
        q: 'What is the maximum number of passengers permitted on a single ticket?',
        a: 'In Indian Railways general reservation, a maximum of 6 passengers can be booked on a single ticket for normal trains, and 4 passengers for Tatkal bookings.'
      },
      {
        q: 'How does the PNR generation algorithm work in Railora?',
        a: 'Railora generates 10-digit Indian Railway standard PNR numbers. The first 3 digits represent the Railway Zone PRS cluster (e.g., 284 for Northern Railway, 842 for Eastern Railway), followed by 7 randomized cryptographic digits.'
      },
      {
        q: 'How are ticket refunds calculated upon cancellation?',
        a: 'When a confirmed ticket is cancelled, standard Indian Railways clerkage/cancellation charges (₹60 per passenger for Sleeper, ₹120 for 3A/CC) are deducted, and the remaining balance is refunded to the source payment method.'
      },
      {
        q: 'Are payments on this portal real?',
        a: 'No. This system operates as a zero-budget demonstration system for education and viva presentations. All payments and refunds are simulated in Indian Rupees (₹) with realistic gateway interactions.'
      },
      {
        q: 'What are the 24x7 Railway Helpline numbers in India?',
        a: 'The national single-window railway passenger helpline is 139 (RailMadad). For security and medical emergencies on train or platform, dial 182.'
      }
    ]
  });
});

module.exports = router;
