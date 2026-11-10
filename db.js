const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

let pool;

// Build database configuration
const connectionUri = process.env.DATABASE_URL || process.env.MYSQL_URL;

const isProduction = process.env.NODE_ENV === 'production';
const requiresSsl = process.env.DB_SSL === 'true' || 
  (connectionUri && (connectionUri.includes('ssl=') || connectionUri.includes('sslmode='))) ||
  (isProduction && process.env.DB_SSL !== 'false' && !process.env.DB_HOST?.includes('localhost') && !process.env.DB_HOST?.includes('127.0.0.1'));

if (connectionUri) {
  // Cloud Database URI (Railway, Render, Heroku, Aiven, TiDB, etc.)
  pool = mysql.createPool({
    uri: connectionUri,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true,
    multipleStatements: true,
    ssl: requiresSsl ? { rejectUnauthorized: false } : undefined
  });
} else {
  // Standard or Railway individual environment variables
  const dbConfig = {
    host: process.env.DB_HOST || process.env.MYSQLHOST || process.env.MYSQL_HOST || 'localhost',
    user: process.env.DB_USER || process.env.MYSQLUSER || process.env.MYSQL_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || '',
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || 'railway_db',
    port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || process.env.MYSQL_PORT || '3306', 10),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true,
    multipleStatements: true,
    ssl: requiresSsl ? { rejectUnauthorized: false } : undefined
  };
  pool = mysql.createPool(dbConfig);
}

/**
 * Check active database connectivity
 */
async function checkDbHealth() {
  try {
    if (!pool) return { ok: false, status: 'POOL_UNINITIALIZED' };
    await pool.query('SELECT 1');
    return { ok: true, status: 'CONNECTED' };
  } catch (err) {
    return { ok: false, status: 'DISCONNECTED', error: err.message };
  }
}

/**
 * Initialize database tables if not already created.
 * Automatically retries during cloud container launch and seeds from database/railway.sql.
 * If running on localhost and the database doesn't exist, automatically creates it.
 */
async function initDb(retries = 4, delayMs = 3000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // 1. Try checking target database directly
      let tablesExist = false;
      try {
        const [tables] = await pool.query("SHOW TABLES LIKE 'stations'");
        if (tables.length > 0) {
          tablesExist = true;
          console.log('Connected to MySQL database. Stations & reservation tables verified.');
        }
      } catch (dbErr) {
        // If database doesn't exist on localhost, attempt to create it (XAMPP / local dev convenience)
        const host = process.env.DB_HOST || process.env.MYSQLHOST || 'localhost';
        if (dbErr.code === 'ER_BAD_DB_ERROR' && (host === 'localhost' || host === '127.0.0.1')) {
          console.log('Database does not exist on localhost. Attempting to create...');
          const rootConn = await mysql.createConnection({
            host,
            user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
            password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
            port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306', 10),
            multipleStatements: true
          });
          const targetDb = process.env.DB_NAME || process.env.MYSQLDATABASE || 'railway_db';
          await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${targetDb}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
          await rootConn.end();
        } else {
          throw dbErr;
        }
      }

      // 2. If tables do not exist, run schema seed script
      if (!tablesExist) {
        console.log('Database tables not detected. Initializing schema from database/railway.sql...');
        const sqlPath = path.join(__dirname, 'database', 'railway.sql');
        if (fs.existsSync(sqlPath)) {
          const sqlContent = fs.readFileSync(sqlPath, 'utf8');
          await pool.query(sqlContent);
          console.log('Database initialized and seeded successfully with trains, stations & users!');
        }
      }
      return true;
    } catch (error) {
      if (attempt < retries) {
        console.warn(`[MySQL Init] Connection attempt ${attempt}/${retries} failed (${error.code || error.message}). Retrying in ${delayMs / 1000}s...`);
        await new Promise(res => setTimeout(res, delayMs));
      } else {
        console.error('\n======================================================');
        console.error(' MySQL Connection Notice:');
        console.error(` Error Details: ${error.message}`);
        console.error(' For local dev: Make sure MySQL is running in XAMPP or Docker.');
        console.error(' For cloud dev: Verify DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, or DATABASE_URL in environment variables.');
        console.error('======================================================\n');
        return false;
      }
    }
  }
}

module.exports = {
  pool,
  query: (sql, params) => pool.query(sql, params),
  initDb,
  checkDbHealth
};
