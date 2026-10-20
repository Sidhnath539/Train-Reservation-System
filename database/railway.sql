-- ========================================================
-- Indian Railway Reservation System - Database Schema & Data
-- Compatible with MySQL 5.7+ / 8.0+ / MariaDB (XAMPP)
-- ========================================================

-- Using target connected database (supports cloud database instances like Railway, Render, Aiven)

SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables if re-importing
DROP TABLE IF EXISTS `passengers`;
DROP TABLE IF EXISTS `bookings`;
DROP TABLE IF EXISTS `reservations`;
DROP TABLE IF EXISTS `train_schedule_seats`;
DROP TABLE IF EXISTS `train_classes`;
DROP TABLE IF EXISTS `trains`;
DROP TABLE IF EXISTS `stations`;
DROP TABLE IF EXISTS `users`;

-- --------------------------------------------------------
-- Table: users
-- --------------------------------------------------------
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `role` ENUM('user', 'admin') DEFAULT 'user',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table: stations
-- --------------------------------------------------------
CREATE TABLE `stations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(10) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `city` VARCHAR(100) NOT NULL,
  `state` VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table: trains
-- --------------------------------------------------------
CREATE TABLE `trains` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `train_number` VARCHAR(10) NOT NULL UNIQUE,
  `train_name` VARCHAR(120) NOT NULL,
  `source_station_id` INT NOT NULL,
  `destination_station_id` INT NOT NULL,
  `departure_time` TIME NOT NULL,
  `arrival_time` TIME NOT NULL,
  `duration` VARCHAR(30) NOT NULL,
  `runs_on` VARCHAR(100) DEFAULT 'Mon, Tue, Wed, Thu, Fri, Sat, Sun',
  `train_type` VARCHAR(40) DEFAULT 'Superfast',
  `status` ENUM('Active', 'Cancelled', 'Delayed') DEFAULT 'Active',
  FOREIGN KEY (`source_station_id`) REFERENCES `stations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`destination_station_id`) REFERENCES `stations`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table: train_classes
-- --------------------------------------------------------
CREATE TABLE `train_classes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `train_id` INT NOT NULL,
  `class_code` VARCHAR(10) NOT NULL,
  `class_name` VARCHAR(60) NOT NULL,
  `total_seats` INT NOT NULL DEFAULT 60,
  `base_fare` DECIMAL(10,2) NOT NULL,
  UNIQUE KEY `uq_train_class` (`train_id`, `class_code`),
  FOREIGN KEY (`train_id`) REFERENCES `trains`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table: train_schedule_seats
-- --------------------------------------------------------
CREATE TABLE `train_schedule_seats` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `train_id` INT NOT NULL,
  `class_code` VARCHAR(10) NOT NULL,
  `journey_date` DATE NOT NULL,
  `available_seats` INT NOT NULL,
  `waiting_seats` INT NOT NULL DEFAULT 0,
  UNIQUE KEY `uq_train_schedule` (`train_id`, `class_code`, `journey_date`),
  FOREIGN KEY (`train_id`) REFERENCES `trains`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table: bookings
-- --------------------------------------------------------
CREATE TABLE `bookings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `pnr_number` VARCHAR(10) NOT NULL UNIQUE,
  `user_id` INT NOT NULL,
  `train_id` INT NOT NULL,
  `class_code` VARCHAR(10) NOT NULL,
  `journey_date` DATE NOT NULL,
  `booking_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `total_passengers` INT NOT NULL DEFAULT 1,
  `total_fare` DECIMAL(10,2) NOT NULL,
  `quota` VARCHAR(20) DEFAULT 'GENERAL',
  `booking_status` ENUM('CONFIRMED', 'WAITLISTED', 'CANCELLED') DEFAULT 'CONFIRMED',
  `payment_status` ENUM('PAID', 'REFUNDED') DEFAULT 'PAID',
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`train_id`) REFERENCES `trains`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table: passengers
-- --------------------------------------------------------
CREATE TABLE `passengers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `booking_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `age` INT NOT NULL,
  `gender` ENUM('Male', 'Female', 'Other') NOT NULL,
  `berth_preference` VARCHAR(30) DEFAULT 'No Preference',
  `allocated_seat` VARCHAR(40) NOT NULL,
  `status` ENUM('CNF', 'WL', 'CAN') DEFAULT 'CNF',
  FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================================
-- SEED DATA
-- ========================================================

-- Default Users
-- admin123 => $2a$10$aG2nj0HuUianE24gA/5.k.Vdp5hAPTqlgXovn7cxxKTFtTLuQltYC
-- password123 => $2a$10$HezGRdJIxGISufpGH690nOo3PWe5UiYSzYw01oOj73UKpnZyMZFV.
INSERT INTO `users` (`id`, `name`, `email`, `password`, `phone`, `role`) VALUES
(1, 'System Admin', 'admin@railway.gov.in', '$2a$10$aG2nj0HuUianE24gA/5.k.Vdp5hAPTqlgXovn7cxxKTFtTLuQltYC', '+91 9876543210', 'admin'),
(2, 'Rahul Sharma', 'rahul@gmail.com', '$2a$10$HezGRdJIxGISufpGH690nOo3PWe5UiYSzYw01oOj73UKpnZyMZFV.', '+91 9811223344', 'user'),
(3, 'Priya Patel', 'priya@gmail.com', '$2a$10$HezGRdJIxGISufpGH690nOo3PWe5UiYSzYw01oOj73UKpnZyMZFV.', '+91 9899887766', 'user');

-- Major Indian Railway Stations
INSERT INTO `stations` (`id`, `code`, `name`, `city`, `state`) VALUES
(1, 'NDLS', 'New Delhi Railway Station', 'New Delhi', 'Delhi'),
(2, 'HWH', 'Howrah Junction', 'Kolkata', 'West Bengal'),
(3, 'BCT', 'Mumbai Central', 'Mumbai', 'Maharashtra'),
(4, 'CSMT', 'Chhatrapati Shivaji Maharaj Terminus', 'Mumbai', 'Maharashtra'),
(5, 'BSB', 'Varanasi Junction', 'Varanasi', 'Uttar Pradesh'),
(6, 'LKO', 'Lucknow Charbagh', 'Lucknow', 'Uttar Pradesh'),
(7, 'MAS', 'MGR Chennai Central', 'Chennai', 'Tamil Nadu'),
(8, 'SBC', 'KSR Bengaluru City', 'Bengaluru', 'Karnataka'),
(9, 'ADI', 'Ahmedabad Junction', 'Ahmedabad', 'Gujarat'),
(10, 'MAO', 'Madgaon Junction', 'Goa', 'Goa'),
(11, 'PNBE', 'Patna Junction', 'Patna', 'Bihar'),
(12, 'CNB', 'Kanpur Central', 'Kanpur', 'Uttar Pradesh'),
(13, 'GKP', 'Gorakhpur Junction', 'Gorakhpur', 'Uttar Pradesh'),
(14, 'JAT', 'Jammu Tawi', 'Jammu', 'Jammu and Kashmir');

-- Trains
INSERT INTO `trains` (`id`, `train_number`, `train_name`, `source_station_id`, `destination_station_id`, `departure_time`, `arrival_time`, `duration`, `runs_on`, `train_type`, `status`) VALUES
(1, '12302', 'Howrah Rajdhani Express', 1, 2, '16:55:00', '09:55:00', '17h 00m', 'Mon, Tue, Wed, Thu, Fri, Sat, Sun', 'Rajdhani', 'Active'),
(2, '12301', 'New Delhi Rajdhani Express', 2, 1, '16:50:00', '10:05:00', '17h 15m', 'Mon, Tue, Wed, Thu, Fri, Sat, Sun', 'Rajdhani', 'Active'),
(3, '12952', 'Mumbai Tejas Rajdhani Express', 1, 3, '16:55:00', '08:35:00', '15h 40m', 'Mon, Tue, Wed, Thu, Fri, Sat, Sun', 'Rajdhani', 'Active'),
(4, '12951', 'New Delhi Tejas Rajdhani Express', 3, 1, '17:00:00', '08:32:00', '15h 32m', 'Mon, Tue, Wed, Thu, Fri, Sat, Sun', 'Rajdhani', 'Active'),
(5, '22436', 'Vande Bharat Express (BSB)', 1, 5, '06:00:00', '14:00:00', '08h 00m', 'Tue, Wed, Fri, Sat, Sun', 'Vande Bharat', 'Active'),
(6, '22435', 'Vande Bharat Express (NDLS)', 5, 1, '15:00:00', '23:00:00', '08h 00m', 'Tue, Wed, Fri, Sat, Sun', 'Vande Bharat', 'Active'),
(7, '12004', 'Lucknow Swarna Shatabdi Express', 1, 6, '06:10:00', '12:40:00', '06h 30m', 'Mon, Tue, Wed, Thu, Fri, Sat, Sun', 'Shatabdi', 'Active'),
(8, '12003', 'New Delhi Swarna Shatabdi Express', 6, 1, '15:35:00', '22:15:00', '06h 40m', 'Mon, Tue, Wed, Thu, Fri, Sat, Sun', 'Shatabdi', 'Active'),
(9, '20901', 'Mumbai - Gandhinagar Vande Bharat', 3, 9, '06:10:00', '12:25:00', '06h 15m', 'Mon, Tue, Wed, Thu, Fri, Sat', 'Vande Bharat', 'Active'),
(10, '12051', 'Madgaon Jan Shatabdi Express', 4, 10, '05:10:00', '14:10:00', '09h 00m', 'Mon, Tue, Wed, Thu, Fri, Sat, Sun', 'Shatabdi', 'Active'),
(11, '12245', 'Howrah - Yesvantpur Duronto Express', 2, 8, '10:50:00', '16:00:00', '29h 10m', 'Tue, Wed, Fri, Sat, Sun', 'Duronto', 'Active'),
(12, '12393', 'Sampoorna Kranti Express', 11, 1, '19:25:00', '07:55:00', '12h 30m', 'Mon, Tue, Wed, Thu, Fri, Sat, Sun', 'Superfast', 'Active');

-- Train Classes and Base Fares
INSERT INTO `train_classes` (`train_id`, `class_code`, `class_name`, `total_seats`, `base_fare`) VALUES
-- 12302 Howrah Rajdhani
(1, '1A', 'AC First Class', 24, 4350.00),
(1, '2A', 'AC 2 Tier', 48, 2850.00),
(1, '3A', 'AC 3 Tier', 64, 2020.00),
-- 12301 NDLS Rajdhani
(2, '1A', 'AC First Class', 24, 4350.00),
(2, '2A', 'AC 2 Tier', 48, 2850.00),
(2, '3A', 'AC 3 Tier', 64, 2020.00),
-- 12952 Mumbai Rajdhani
(3, '1A', 'AC First Class', 24, 4410.00),
(3, '2A', 'AC 2 Tier', 52, 2905.00),
(3, '3A', 'AC 3 Tier', 72, 2075.00),
-- 12951 NDLS Rajdhani
(4, '1A', 'AC First Class', 24, 4410.00),
(4, '2A', 'AC 2 Tier', 52, 2905.00),
(4, '3A', 'AC 3 Tier', 72, 2075.00),
-- 22436 Vande Bharat (BSB)
(5, 'CC', 'AC Chair Car', 78, 1750.00),
(5, 'EC', 'Exec. Chair Car', 20, 3300.00),
-- 22435 Vande Bharat (NDLS)
(6, 'CC', 'AC Chair Car', 78, 1750.00),
(6, 'EC', 'Exec. Chair Car', 20, 3300.00),
-- 12004 Lucknow Shatabdi
(7, 'CC', 'AC Chair Car', 72, 1165.00),
(7, 'EC', 'Exec. Chair Car', 24, 2125.00),
-- 12003 NDLS Shatabdi
(8, 'CC', 'AC Chair Car', 72, 1165.00),
(8, 'EC', 'Exec. Chair Car', 24, 2125.00),
-- 20901 Gandhinagar Vande Bharat
(9, 'CC', 'AC Chair Car', 78, 1420.00),
(9, 'EC', 'Exec. Chair Car', 20, 2630.00),
-- 12051 Jan Shatabdi
(10, '2S', 'Second Sitting', 90, 315.00),
(10, 'CC', 'AC Chair Car', 72, 1050.00),
-- 12245 Duronto
(11, '1A', 'AC First Class', 24, 4980.00),
(11, '2A', 'AC 2 Tier', 48, 3140.00),
(11, '3A', 'AC 3 Tier', 64, 2220.00),
(11, 'SL', 'Sleeper Class', 80, 840.00),
-- 12393 Sampoorna Kranti
(12, '1A', 'AC First Class', 24, 3215.00),
(12, '2A', 'AC 2 Tier', 48, 2010.00),
(12, '3A', 'AC 3 Tier', 64, 1420.00),
(12, 'SL', 'Sleeper Class', 80, 520.00);

-- Initial Mock Seat Schedules for near dates
INSERT INTO `train_schedule_seats` (`train_id`, `class_code`, `journey_date`, `available_seats`, `waiting_seats`) VALUES
(1, '3A', CURDATE() + INTERVAL 1 DAY, 38, 0),
(1, '2A', CURDATE() + INTERVAL 1 DAY, 14, 0),
(3, '3A', CURDATE() + INTERVAL 1 DAY, 42, 0),
(3, '2A', CURDATE() + INTERVAL 1 DAY, 19, 0),
(5, 'CC', CURDATE() + INTERVAL 1 DAY, 26, 0),
(5, 'EC', CURDATE() + INTERVAL 1 DAY, 6, 0),
(7, 'CC', CURDATE() + INTERVAL 1 DAY, 45, 0),
(9, 'CC', CURDATE() + INTERVAL 1 DAY, 34, 0),
(1, '3A', CURDATE() + INTERVAL 2 DAY, 50, 0),
(3, '3A', CURDATE() + INTERVAL 2 DAY, 55, 0);

-- Sample Bookings
INSERT INTO `bookings` (`id`, `pnr_number`, `user_id`, `train_id`, `class_code`, `journey_date`, `total_passengers`, `total_fare`, `quota`, `booking_status`, `payment_status`) VALUES
(1, '8429104821', 2, 1, '3A', CURDATE() + INTERVAL 2 DAY, 2, 4040.00, 'GENERAL', 'CONFIRMED', 'PAID'),
(2, '2940185930', 2, 3, '2A', CURDATE() + INTERVAL 5 DAY, 1, 2905.00, 'GENERAL', 'CONFIRMED', 'PAID'),
(3, '6519284710', 3, 5, 'CC', CURDATE() + INTERVAL 3 DAY, 1, 1750.00, 'GENERAL', 'CONFIRMED', 'PAID');

-- Sample Passengers for Bookings
INSERT INTO `passengers` (`booking_id`, `name`, `age`, `gender`, `berth_preference`, `allocated_seat`, `status`) VALUES
(1, 'Rahul Sharma', 29, 'Male', 'Lower', 'B2-21 (LB)', 'CNF'),
(1, 'Ananya Sharma', 26, 'Female', 'Middle', 'B2-22 (MB)', 'CNF'),
(2, 'Rahul Sharma', 29, 'Male', 'Lower', 'A1-15 (LB)', 'CNF'),
(3, 'Priya Patel', 28, 'Female', 'Window', 'C3-34 (WS)', 'CNF');

SET FOREIGN_KEY_CHECKS = 1;
