const fs = require('fs');
const { pool } = require('../db');

async function dumpDatabase() {
  const [users] = await pool.query('SELECT * FROM users');
  const [stations] = await pool.query('SELECT * FROM stations ORDER BY id ASC');
  const [trains] = await pool.query('SELECT * FROM trains ORDER BY id ASC');
  const [classes] = await pool.query('SELECT * FROM train_classes ORDER BY train_id ASC, id ASC');

  let sql = `-- ========================================================
-- Indian Railway Reservation System - Database Schema & Data
-- Compatible with MySQL 5.7+ / 8.0+ / MariaDB (XAMPP)
-- ========================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS \`passengers\`;
DROP TABLE IF EXISTS \`bookings\`;
DROP TABLE IF EXISTS \`reservations\`;
DROP TABLE IF EXISTS \`train_schedule_seats\`;
DROP TABLE IF EXISTS \`train_classes\`;
DROP TABLE IF EXISTS \`trains\`;
DROP TABLE IF EXISTS \`stations\`;
DROP TABLE IF EXISTS \`users\`;

CREATE TABLE \`users\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`name\` VARCHAR(100) NOT NULL,
  \`email\` VARCHAR(100) NOT NULL UNIQUE,
  \`password\` VARCHAR(255) NOT NULL,
  \`phone\` VARCHAR(20) DEFAULT NULL,
  \`role\` ENUM('user', 'admin') DEFAULT 'user',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE \`stations\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`code\` VARCHAR(10) NOT NULL UNIQUE,
  \`name\` VARCHAR(100) NOT NULL,
  \`city\` VARCHAR(100) NOT NULL,
  \`state\` VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE \`trains\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`train_number\` VARCHAR(10) NOT NULL UNIQUE,
  \`train_name\` VARCHAR(120) NOT NULL,
  \`source_station_id\` INT NOT NULL,
  \`destination_station_id\` INT NOT NULL,
  \`departure_time\` TIME NOT NULL,
  \`arrival_time\` TIME NOT NULL,
  \`duration\` VARCHAR(30) NOT NULL,
  \`runs_on\` VARCHAR(100) DEFAULT 'Mon, Tue, Wed, Thu, Fri, Sat, Sun',
  \`train_type\` VARCHAR(40) DEFAULT 'Superfast',
  \`status\` ENUM('Active', 'Cancelled', 'Delayed') DEFAULT 'Active',
  FOREIGN KEY (\`source_station_id\`) REFERENCES \`stations\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`destination_station_id\`) REFERENCES \`stations\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE \`train_classes\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`train_id\` INT NOT NULL,
  \`class_code\` VARCHAR(10) NOT NULL,
  \`class_name\` VARCHAR(60) NOT NULL,
  \`total_seats\` INT NOT NULL DEFAULT 60,
  \`base_fare\` DECIMAL(10,2) NOT NULL,
  UNIQUE KEY \`uq_train_class\` (\`train_id\`, \`class_code\`),
  FOREIGN KEY (\`train_id\`) REFERENCES \`trains\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE \`train_schedule_seats\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`train_id\` INT NOT NULL,
  \`class_code\` VARCHAR(10) NOT NULL,
  \`journey_date\` DATE NOT NULL,
  \`available_seats\` INT NOT NULL,
  \`waiting_seats\` INT NOT NULL DEFAULT 0,
  UNIQUE KEY \`uq_train_schedule\` (\`train_id\`, \`class_code\`, \`journey_date\`),
  FOREIGN KEY (\`train_id\`) REFERENCES \`trains\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE \`bookings\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`pnr_number\` VARCHAR(10) NOT NULL UNIQUE,
  \`user_id\` INT NOT NULL,
  \`train_id\` INT NOT NULL,
  \`class_code\` VARCHAR(10) NOT NULL,
  \`journey_date\` DATE NOT NULL,
  \`booking_date\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`total_passengers\` INT NOT NULL DEFAULT 1,
  \`total_fare\` DECIMAL(10,2) NOT NULL,
  \`quota\` VARCHAR(20) DEFAULT 'GENERAL',
  \`booking_status\` ENUM('CONFIRMED', 'WAITLISTED', 'CANCELLED') DEFAULT 'CONFIRMED',
  \`payment_status\` ENUM('PAID', 'REFUNDED') DEFAULT 'PAID',
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`train_id\`) REFERENCES \`trains\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE \`passengers\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`booking_id\` INT NOT NULL,
  \`name\` VARCHAR(100) NOT NULL,
  \`age\` INT NOT NULL,
  \`gender\` ENUM('Male', 'Female', 'Other') NOT NULL,
  \`berth_preference\` VARCHAR(30) DEFAULT 'No Preference',
  \`allocated_seat\` VARCHAR(40) NOT NULL,
  \`status\` ENUM('CNF', 'WL', 'CAN') DEFAULT 'CNF',
  FOREIGN KEY (\`booking_id\`) REFERENCES \`bookings\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Users
INSERT INTO \`users\` (\`id\`, \`name\`, \`email\`, \`password\`, \`phone\`, \`role\`) VALUES
`;

  sql += users.map(u => `(${u.id}, '${u.name}', '${u.email}', '${u.password}', '${u.phone || ''}', '${u.role}')`).join(',\n') + ';\n\n';

  sql += `-- Seed Stations (${stations.length} stations)\nINSERT INTO \`stations\` (\`id\`, \`code\`, \`name\`, \`city\`, \`state\`) VALUES\n`;
  sql += stations.map(s => `(${s.id}, '${s.code}', '${s.name.replace(/'/g, "\\'")}', '${s.city.replace(/'/g, "\\'")}', '${s.state.replace(/'/g, "\\'")}')`).join(',\n') + ';\n\n';

  sql += `-- Seed Trains (${trains.length} trains)\nINSERT INTO \`trains\` (\`id\`, \`train_number\`, \`train_name\`, \`source_station_id\`, \`destination_station_id\`, \`departure_time\`, \`arrival_time\`, \`duration\`, \`runs_on\`, \`train_type\`, \`status\`) VALUES\n`;
  sql += trains.map(t => `(${t.id}, '${t.train_number}', '${t.train_name.replace(/'/g, "\\'")}', ${t.source_station_id}, ${t.destination_station_id}, '${t.departure_time}', '${t.arrival_time}', '${t.duration}', '${t.runs_on}', '${t.train_type}', '${t.status}')`).join(',\n') + ';\n\n';

  sql += `-- Seed Train Classes (${classes.length} classes)\nINSERT INTO \`train_classes\` (\`id\`, \`train_id\`, \`class_code\`, \`class_name\`, \`total_seats\`, \`base_fare\`) VALUES\n`;
  sql += classes.map(c => `(${c.id}, ${c.train_id}, '${c.class_code}', '${c.class_name}', ${c.total_seats}, ${c.base_fare})`).join(',\n') + ';\n\n';

  sql += `-- Seed Bookings
INSERT INTO \`bookings\` (\`id\`, \`pnr_number\`, \`user_id\`, \`train_id\`, \`class_code\`, \`journey_date\`, \`total_passengers\`, \`total_fare\`, \`quota\`, \`booking_status\`, \`payment_status\`) VALUES
(1, '8429104821', 2, 1, '3A', CURDATE() + INTERVAL 2 DAY, 2, 4040.00, 'GENERAL', 'CONFIRMED', 'PAID'),
(2, '2940185930', 2, 3, '2A', CURDATE() + INTERVAL 5 DAY, 1, 2905.00, 'GENERAL', 'CONFIRMED', 'PAID'),
(3, '6519284710', 3, 5, 'CC', CURDATE() + INTERVAL 3 DAY, 1, 1750.00, 'GENERAL', 'CONFIRMED', 'PAID');

-- Seed Passengers
INSERT INTO \`passengers\` (\`booking_id\`, \`name\`, \`age\`, \`gender\`, \`berth_preference\`, \`allocated_seat\`, \`status\`) VALUES
(1, 'Rahul Sharma', 29, 'Male', 'Lower', 'B2-21 (LB)', 'CNF'),
(1, 'Ananya Sharma', 26, 'Female', 'Middle', 'B2-22 (MB)', 'CNF'),
(2, 'Rahul Sharma', 29, 'Male', 'Lower', 'A1-15 (LB)', 'CNF'),
(3, 'Priya Patel', 28, 'Female', 'Window', 'C3-34 (WS)', 'CNF');

SET FOREIGN_KEY_CHECKS = 1;
`;

  fs.writeFileSync('./database/railway.sql', sql);
  console.log('Successfully updated database/railway.sql with full schema, 202 stations, 64 trains, and 190 classes!');
  process.exit(0);
}

dumpDatabase().catch(e => {
  console.error(e);
  process.exit(1);
});
