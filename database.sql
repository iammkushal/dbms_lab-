CREATE DATABASE IF NOT EXISTS movie_booking_db;
USE movie_booking_db;

-- Separate project table; existing tables are not changed.
CREATE TABLE IF NOT EXISTS movie_bookings (
  booking_id INT PRIMARY KEY AUTO_INCREMENT,
  customer_name VARCHAR(100) NOT NULL,
  customer_email VARCHAR(100) DEFAULT '',
  movie_name VARCHAR(150) NOT NULL,
  show_date DATE NOT NULL,
  show_time VARCHAR(20) NOT NULL,
  seat_numbers VARCHAR(200) NOT NULL,
  total_amount DECIMAL(8,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Check stored records: run this after booking through the website.
SELECT * FROM movie_bookings;
