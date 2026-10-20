const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { JWT_SECRET, requireAuth } = require('../middleware/auth');

/**
 * Register a new user
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    // Check if email already exists
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email.toLowerCase().trim()]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), email.toLowerCase().trim(), hashedPassword, phone || null, 'user']
    );

    const user = {
      id: result.insertId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone || null,
      role: 'user'
    };

    // Generate JWT
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration.'
    });
  }
});

/**
 * Login user
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    // Find user by email
    const [users] = await pool.query(
      'SELECT id, name, email, password, phone, role FROM users WHERE email = ? LIMIT 1',
      [email.toLowerCase().trim()]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const user = users[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const userPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    };

    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: userPayload
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login.'
    });
  }
});

/**
 * Get current authenticated user
 * GET /api/auth/me
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, name, email, phone, role, created_at FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    res.json({
      success: true,
      user: users[0]
    });
  } catch (error) {
    console.error('Fetch user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error fetching user profile.'
    });
  }
});

/**
 * Reset / Forgot Password
 * POST /api/auth/reset-password
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { email, phone, new_password } = req.body;

    if (!email || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Email and new password are required.'
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    // Find user by email
    const [users] = await pool.query(
      'SELECT id, name, email, phone FROM users WHERE email = ? LIMIT 1',
      [email.toLowerCase().trim()]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address.'
      });
    }

    const user = users[0];

    // If user has a phone registered, verify phone number for identity check
    if (user.phone && phone) {
      const cleanInputPhone = phone.replace(/[^0-9]/g, '');
      const cleanUserPhone = user.phone.replace(/[^0-9]/g, '');
      
      // Match full phone or last 10 digits
      if (!cleanUserPhone.endsWith(cleanInputPhone) && !cleanInputPhone.endsWith(cleanUserPhone)) {
        return res.status(400).json({
          success: false,
          message: 'The mobile phone number does not match our records for this account.'
        });
      }
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(new_password, saltRounds);

    // Update user password in database
    await pool.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, user.id]
    );

    res.json({
      success: true,
      message: 'Password has been reset successfully! You can now log in with your new password.'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while resetting password.'
    });
  }
});

module.exports = router;
