/**
 * ============================================================================
 * RAILORA - USER AUTHENTICATION & PROFILE ROUTES
 * File: routes/authRoutes.js
 * Description: Manages User Registration, Login, Profile, and Password Reset.
 * Level: Beginner-Friendly / Educational
 * ============================================================================
 * 
 * How Authentication Works:
 * 1. Register: User signs up -> Password is encrypted using bcrypt -> Saved to DB.
 * 2. Login: User sends email & password -> Password is verified -> JWT token is issued.
 * 3. Protected Requests: Frontend sends JWT in header: "Authorization: Bearer <token>".
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');                  // Secure password hashing library
const jwt = require('jsonwebtoken');                 // JSON Web Token library
const { pool } = require('../db');                   // MySQL connection pool
const { JWT_SECRET, requireAuth } = require('../middleware/auth');

// ----------------------------------------------------------------------------
// ROUTE 1: REGISTER A NEW ACCOUNT
// POST /api/auth/register
// ----------------------------------------------------------------------------
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Step 1: Validate incoming inputs
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

    // Step 2: Check if this email is already registered in the database
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

    // Step 3: Hash the password (never store plain text passwords in databases!)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Step 4: Insert the new user into the database
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), email.toLowerCase().trim(), hashedPassword, phone || null, 'user']
    );

    // Step 5: Prepare user payload for JWT token
    const newUser = {
      id: result.insertId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone || null,
      role: 'user'
    };

    // Step 6: Create a signed JWT token valid for 7 days
    const token = jwt.sign(newUser, JWT_SECRET, { expiresIn: '7d' });

    console.log(` New user registered: ${newUser.name} (${newUser.email})`);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: newUser
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration.'
    });
  }
});

// ----------------------------------------------------------------------------
// ROUTE 2: USER LOGIN
// POST /api/auth/login
// ----------------------------------------------------------------------------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Step 1: Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    // Step 2: Look up user in database by email
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

    // Step 3: Compare entered password with hashed password in database
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Step 4: Generate JWT token
    const userPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    };

    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '7d' });

    console.log(` User logged in: ${user.name} (${user.role})`);

    res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: userPayload
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login.'
    });
  }
});

// ----------------------------------------------------------------------------
// ROUTE 3: GET LOGGED-IN USER PROFILE
// GET /api/auth/me
// ----------------------------------------------------------------------------
router.get('/me', requireAuth, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, name, email, phone, role, created_at FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    res.json({
      success: true,
      user: users[0]
    });
  } catch (error) {
    console.error('Error fetching user profile:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile.'
    });
  }
});

// ----------------------------------------------------------------------------
// ROUTE 4: UPDATE USER PROFILE (Name, Phone)
// PUT /api/auth/profile
// ----------------------------------------------------------------------------
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { name, phone } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Name is required.'
      });
    }

    await pool.query(
      'UPDATE users SET name = ?, phone = ? WHERE id = ?',
      [name.trim(), phone ? phone.trim() : null, req.user.id]
    );

    const [updatedUsers] = await pool.query(
      'SELECT id, name, email, phone, role FROM users WHERE id = ?',
      [req.user.id]
    );

    const updatedUser = updatedUsers[0];

    res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile.'
    });
  }
});

// ----------------------------------------------------------------------------
// ROUTE 5: CHANGE PASSWORD
// POST /api/auth/change-password
// ----------------------------------------------------------------------------
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Both current password and new password are required.'
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    const [users] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(current_password, users[0].password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password does not match.'
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(new_password, saltRounds);

    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

    res.json({
      success: true,
      message: 'Password changed successfully!'
    });
  } catch (error) {
    console.error('Change password error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to change password.'
    });
  }
});

// ----------------------------------------------------------------------------
// ROUTE 4: RESET / FORGOT PASSWORD
// POST /api/auth/reset-password
// ----------------------------------------------------------------------------
router.post('/reset-password', async (req, res) => {
  try {
    const { email, phone, new_password } = req.body;

    // Step 1: Validate input
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

    // Step 2: Find user by email
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

    // Step 3: Verify registered phone number for identity confirmation
    if (user.phone && phone) {
      const cleanInputPhone = phone.replace(/[^0-9]/g, '');
      const cleanUserPhone = user.phone.replace(/[^0-9]/g, '');

      if (!cleanUserPhone.endsWith(cleanInputPhone) && !cleanInputPhone.endsWith(cleanUserPhone)) {
        return res.status(400).json({
          success: false,
          message: 'The mobile number does not match our records for this account.'
        });
      }
    }

    // Step 4: Hash the new password and update in database
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(new_password, saltRounds);

    await pool.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, user.id]
    );

    console.log(` Password reset for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.'
    });
  } catch (error) {
    console.error('Password reset error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error while resetting password.'
    });
  }
});

module.exports = router;
