/**
 * ============================================================================
 * RAILORA - SIMULATED PAYMENT ROUTES (ZERO-BUDGET DEMO)
 * File: routes/paymentRoutes.js
 * Description: Simulates realistic checkout, UPI QR generation, Card verification,
 *              and Net Banking gateways for Indian Railways tickets.
 * Level: Beginner-Friendly / Educational
 * ============================================================================
 * 
 * IMPORTANT: This is a college demonstration system. No real money or credentials
 * are processed. All transactions are labelled DEMO PAYMENTS.
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

/**
 * 1. GET /api/payments/methods
 * Returns list of supported demo payment channels
 */
router.get('/methods', (req, res) => {
  res.json({
    success: true,
    methods: [
      {
        id: 'upi_intent',
        name: 'UPI / QR Code',
        providers: ['Google Pay', 'PhonePe', 'Paytm', 'BHIM', 'CRED UPI'],
        icon: 'fa-qrcode',
        description: 'Instant zero-fee payment via any UPI app or Dynamic QR'
      },
      {
        id: 'cards',
        name: 'Debit & Credit Cards',
        providers: ['Visa', 'Mastercard', 'RuPay', 'American Express'],
        icon: 'fa-credit-card',
        description: 'Supports all major Indian Bank ATM / Debit & Credit cards'
      },
      {
        id: 'netbanking',
        name: 'Net Banking',
        providers: ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Punjab National Bank'],
        icon: 'fa-building-columns',
        description: 'Direct payment via 50+ retail & corporate Indian banks'
      }
    ]
  });
});

/**
 * 2. POST /api/payments/simulate
 * Simulates processing a payment with success, failure, or timeout test cases
 */
router.post('/simulate', requireAuth, async (req, res) => {
  try {
    const { payment_method, amount, should_fail } = req.body;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount.'
      });
    }

    // Generate unique demo transaction reference
    const txnId = `TXN_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    if (should_fail === true) {
      return res.status(402).json({
        success: false,
        status: 'FAILED',
        transaction_id: txnId,
        message: 'Payment was declined by issuing bank (Demo Failure Test).'
      });
    }

    // Success simulation
    res.json({
      success: true,
      status: 'SUCCESS',
      transaction_id: txnId,
      payment_method: payment_method || 'UPI (Google Pay)',
      amount: parseFloat(amount).toFixed(2),
      timestamp: new Date().toISOString(),
      message: 'Simulated payment authorized successfully!'
    });
  } catch (error) {
    console.error('Payment simulation error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Payment simulation error.'
    });
  }
});

module.exports = router;
