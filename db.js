const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

let pool;

// Build database configuration
const connectionUri = process.env.DATABASE_URL || process.env.MYSQL_URL;

if (connectionUri) {
  // Cloud Database URI (Railway, Render, Heroku, Aiven, etc.)
  pool = mysql.createPool({
    uri: connectionUri,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true,
    multipleStatements: true,
    ssl: (process.env.DB_SSL === 'true' || connectionUri.includes('ssl=')) ? { rejectUnauthorized: false } : undefined
  });
} else {
  // Standard environment variables
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'railway_db',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true,
    multipleStatements: true,
    ssl: (process.env.DB_SSL === 'true' || (process.env.NODE_ENV === 'production' && process.env.DB_HOST !== 'localhost'))
      ? { rejectUnauthorized: false }
      : undefined
  };
  pool = mysql.createPool(dbConfig);
}

/**
 * Initialize database tables if not already created.
 * Automatically detects if tables exist, and seeds from database/railway.sql.
 * If running on localhost and the database doesn't exist, automatically creates it.
 */
async function initDb() {
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
      // If database doesn't exist on localhost, attempt to create it (XAMPP convenience)
      if (dbErr.code === 'ER_BAD_DB_ERROR' && (!process.env.DB_HOST || process.env.DB_HOST === 'localhost')) {
        console.log('Database does not exist on localhost. Attempting to create...');
        const rootConn = await mysql.createConnection({
          host: process.env.DB_HOST || 'localhost',
          user: process.env.DB_USER || 'root',
          password: process.env.DB_PASSWORD || '',
          port: parseInt(process.env.DB_PORT || '3306', 10),
          multipleStatements: true
        });
        const targetDb = process.env.DB_NAME || 'railway_db';
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
    console.error('\n======================================================');
    console.error(' MySQL Connection Notice:');
    console.error(` Error Details: ${error.message}`);
    console.error(' For local dev: Make sure MySQL is running in XAMPP or Docker.');
    console.error(' For cloud dev: Verify DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, or DATABASE_URL in environment variables.');
    console.error('======================================================\n');
    return false;
  }
}

module.exports = {
  pool,
  query: (sql, params) => pool.query(sql, params),
  initDb
};
