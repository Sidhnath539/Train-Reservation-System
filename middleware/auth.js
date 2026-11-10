/**
 * ============================================================================
 * RAILORA - AUTHENTICATION MIDDLEWARE
 * File: middleware/auth.js
 * Description: Verifies JWT (JSON Web Tokens) to protect private routes.
 * Level: Beginner-Friendly / Educational
 * ============================================================================
 * 
 * What is Middleware in Express?
 * A middleware function runs in the middle of a request:
 * Client Request -> [Middleware Checks Security] -> Route Handler -> Response
 * If the check passes, we call next(). If not, we stop and send an error.
 */

const jwt = require('jsonwebtoken'); // Library to create and verify tokens
require('dotenv').config();

// Secret key used to sign and verify tokens (keeps sessions secure)
const JWT_SECRET = process.env.JWT_SECRET || 'railway_secret_key_2026_super_secure_jwt';

/**
 * 1. requireAuth Middleware:
 * Protects routes that require a logged-in user (e.g. Booking a ticket, My Bookings).
 */
function requireAuth(req, res, next) {
  // Read the Authorization header sent by the frontend
  const authHeader = req.headers.authorization;

  // Header must look like: "Bearer <token_string>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Please log in to continue.'
    });
  }

  // Extract the token part after 'Bearer '
  const token = authHeader.split(' ')[1];

  try {
    // Verify that the token was signed with our secret key and hasn't expired
    const decodedUserData = jwt.verify(token, JWT_SECRET);

    // Save the user data inside the request object so subsequent route handlers can access it
    req.user = decodedUserData;

    // Proceed to the next step
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Your session has expired or is invalid. Please log in again.'
    });
  }
}

/**
 * 2. requireAdmin Middleware:
 * Protects routes meant ONLY for System Administrators (e.g. Adding trains, viewing KPI revenue).
 */
function requireAdmin(req, res, next) {
  // First ensure the user is logged in
  requireAuth(req, res, () => {
    // Then check if the user's role is 'admin'
    if (req.user && req.user.role === 'admin') {
      next(); // User is an admin, proceed!
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden. Administrator privileges are required.'
      });
    }
  });
}

/**
 * 3. optionalAuth Middleware:
 * If a token is provided, extracts user info; if not, allows the request to continue as a guest.
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
}

module.exports = {
  JWT_SECRET,
  requireAuth,
  requireAdmin,
  optionalAuth
};
