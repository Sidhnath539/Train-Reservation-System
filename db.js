/**
 * ============================================================================
 * RAILORA - DATABASE CONNECTION MODULE
 * File: db.js
 * Description: Sets up the MySQL Connection Pool and auto-seeds tables.
 * Level: Beginner-Friendly / Educational
 * ============================================================================
 * 
 * Why use a Connection Pool?
 * Instead of opening and closing a new MySQL connection on every user request,
 * a "Pool" maintains a group of reusable connections in memory. This is faster
 * and handles multiple simultaneous users without running out of connections.
 */

const mysql = require('mysql2/promise'); // MySQL library with Promise (async/await) support
const fs = require('fs');                // File System module to read railway.sql
const path = require('path');            // Path helper
require('dotenv').config();              // Load .env variables

let pool;

// ----------------------------------------------------------------------------
// STEP 1: READ DATABASE SETTINGS
// ----------------------------------------------------------------------------
// Cloud hosts like Railway, Render, or Aiven provide a single DATABASE_URL or MYSQL_URL:
// e.g., mysql://user:password@hostname:3306/dbname
const connectionUri = process.env.DATABASE_URL || process.env.MYSQL_URL;

const isProduction = process.env.NODE_ENV === 'production';
const requiresSsl = process.env.DB_SSL === 'true' || 
  (connectionUri && (connectionUri.includes('ssl=') || connectionUri.includes('sslmode='))) ||
  (isProduction && process.env.DB_SSL !== 'false' && !process.env.DB_HOST?.includes('localhost') && !process.env.DB_HOST?.includes('127.0.0.1'));

// ----------------------------------------------------------------------------
// STEP 2: CREATE THE MYSQL CONNECTION POOL
// ----------------------------------------------------------------------------
if (connectionUri) {
  // Option A: Connecting via full Cloud URL (Railway / Render / Aiven)
  pool = mysql.createPool({
    uri: connectionUri,
    waitForConnections: true,
    connectionLimit: 10,       // Keep up to 10 connections ready
    queueLimit: 0,
    decimalNumbers: true,      // Return prices as numbers instead of strings
    multipleStatements: true,  // Allow running multi-line SQL files like railway.sql
    ssl: requiresSsl ? { rejectUnauthorized: false } : undefined
  });
} else {
  // Option B: Connecting via standard individual parameters (Local XAMPP / Docker)
  const dbConfig = {
    host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
    user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'railway_db',
    port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306', 10),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true,
    multipleStatements: true,
    ssl: requiresSsl ? { rejectUnauthorized: false } : undefined
  };
  pool = mysql.createPool(dbConfig);
}

// ----------------------------------------------------------------------------
// STEP 3: HELPER TO CHECK DATABASE HEALTH
// ----------------------------------------------------------------------------
async function checkDbHealth() {
  try {
    if (!pool) return { ok: false, status: 'POOL_UNINITIALIZED' };
    await pool.query('SELECT 1'); // Simple ping query
    return { ok: true, status: 'CONNECTED' };
  } catch (err) {
    return { ok: false, status: 'DISCONNECTED', error: err.message };
  }
}

// ----------------------------------------------------------------------------
// STEP 4: INITIALIZE DATABASE AND AUTO-SEED TABLES
// ----------------------------------------------------------------------------
/**
 * Automatically checks if database tables exist.
 * If not, it automatically runs database/railway.sql so you don't have to import manually.
 */
async function initDb(retries = 3, delayMs = 2500) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // 1. Check if the 'stations' table already exists
      let tablesExist = false;
      try {
        const [tables] = await pool.query("SHOW TABLES LIKE 'stations'");
        if (tables.length > 0) {
          tablesExist = true;
          console.log(' Connected to MySQL database. Railway tables verified.');

          // Check and auto-create auxiliary tables if missing (payments, cancellations, refunds, contact_messages)
          const [paymentTables] = await pool.query("SHOW TABLES LIKE 'payments'");
          if (paymentTables.length === 0) {
            console.log('Auto-migrating payments, cancellations, refunds and contact tables...');
            await pool.query(`
              CREATE TABLE IF NOT EXISTS \`payments\` (
                \`id\` INT AUTO_INCREMENT PRIMARY KEY,
                \`booking_id\` INT NOT NULL,
                \`user_id\` INT NOT NULL,
                \`transaction_id\` VARCHAR(60) NOT NULL UNIQUE,
                \`payment_method\` VARCHAR(30) NOT NULL,
                \`amount\` DECIMAL(10,2) NOT NULL,
                \`status\` ENUM('SUCCESS', 'FAILED', 'PENDING') DEFAULT 'SUCCESS',
                \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (\`booking_id\`) REFERENCES \`bookings\`(\`id\`) ON DELETE CASCADE,
                FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

              CREATE TABLE IF NOT EXISTS \`cancellations\` (
                \`id\` INT AUTO_INCREMENT PRIMARY KEY,
                \`booking_id\` INT NOT NULL,
                \`user_id\` INT NOT NULL,
                \`pnr_number\` VARCHAR(10) NOT NULL,
                \`cancellation_reason\` VARCHAR(255) DEFAULT 'Change of travel plans',
                \`cancellation_charge\` DECIMAL(10,2) NOT NULL DEFAULT 60.00,
                \`refund_amount\` DECIMAL(10,2) NOT NULL,
                \`status\` ENUM('CANCELLED', 'PARTIALLY_CANCELLED') DEFAULT 'CANCELLED',
                \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (\`booking_id\`) REFERENCES \`bookings\`(\`id\`) ON DELETE CASCADE,
                FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

              CREATE TABLE IF NOT EXISTS \`refunds\` (
                \`id\` INT AUTO_INCREMENT PRIMARY KEY,
                \`cancellation_id\` INT NOT NULL,
                \`booking_id\` INT NOT NULL,
                \`user_id\` INT NOT NULL,
                \`refund_transaction_id\` VARCHAR(60) NOT NULL UNIQUE,
                \`amount\` DECIMAL(10,2) NOT NULL,
                \`status\` ENUM('PROCESSED', 'PENDING', 'FAILED') DEFAULT 'PROCESSED',
                \`processed_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (\`cancellation_id\`) REFERENCES \`cancellations\`(\`id\`) ON DELETE CASCADE,
                FOREIGN KEY (\`booking_id\`) REFERENCES \`bookings\`(\`id\`) ON DELETE CASCADE,
                FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

              CREATE TABLE IF NOT EXISTS \`contact_messages\` (
                \`id\` INT AUTO_INCREMENT PRIMARY KEY,
                \`name\` VARCHAR(100) NOT NULL,
                \`email\` VARCHAR(100) NOT NULL,
                \`phone\` VARCHAR(20) DEFAULT NULL,
                \`category\` VARCHAR(50) DEFAULT 'General Enquiry',
                \`subject\` VARCHAR(150) NOT NULL,
                \`message\` TEXT NOT NULL,
                \`status\` ENUM('NEW', 'IN_PROGRESS', 'RESOLVED') DEFAULT 'NEW',
                \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `);
          }
        }
      } catch (dbErr) {
        // If the database doesn't exist on local XAMPP, try creating it automatically
        const host = process.env.DB_HOST || process.env.MYSQLHOST || 'localhost';
        if (dbErr.code === 'ER_BAD_DB_ERROR' && (host === 'localhost' || host === '127.0.0.1')) {
          console.log('Database does not exist locally. Creating database...');
          const rootConn = await mysql.createConnection({
            host,
            user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
            password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
            port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306', 10),
            multipleStatements: true
          });
          const targetDb = process.env.DB_NAME || process.env.MYSQLDATABASE || 'railway_db';
          await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${targetDb}\` DEFAULT CHARACTER SET utf8mb4;`);
          await rootConn.end();
        } else {
          throw dbErr;
        }
      }

      // 2. If tables do not exist yet, seed them from database/railway.sql
      if (!tablesExist) {
        console.log('Seeding database tables from database/railway.sql...');
        const sqlPath = path.join(__dirname, 'database', 'railway.sql');
        if (fs.existsSync(sqlPath)) {
          const sqlContent = fs.readFileSync(sqlPath, 'utf8');
          await pool.query(sqlContent);
          console.log(' Database seeded successfully with stations, trains, and demo users!');
        }
      }
      return true;
    } catch (error) {
      if (attempt < retries) {
        console.warn(`[MySQL Connection] Attempt ${attempt}/${retries} failed (${error.code || error.message}). Retrying in ${delayMs / 1000}s...`);
        await new Promise(res => setTimeout(res, delayMs));
      } else {
        console.error('\n------------------------------------------------------');
        console.error(' MySQL Connection Notice:');
        console.error(` Error: ${error.message}`);
        console.error(' Make sure MySQL is running in XAMPP or your cloud database.');
        console.error('------------------------------------------------------\n');
        return false;
      }
    }
  }
}

// ----------------------------------------------------------------------------
// STEP 5: EXPORT HELPERS FOR USE IN ROUTES
// ----------------------------------------------------------------------------
module.exports = {
  pool,
  query: (sql, params) => pool.query(sql, params),
  initDb,
  checkDbHealth
};
