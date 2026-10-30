# CinemaBook — MySQL Mini Project

This project uses the supplied MovieMax HTML page, adapted to CinemaBook, with Java Servlets and MySQL.

## Assignment requirements covered
- Working web interface with five movies, posters, date/time, seats and price calculation.
- INSERT: Confirm Booking saves a row in MySQL.
- SELECT: Saved Bookings loads rows from MySQL.
- UPDATE: Edit name updates an existing booking.
- DELETE: Delete removes a booking.
- Input validation, SQL script, and project report are included.

## Requirements
JDK 17+, Maven, MySQL Server/Workbench, Apache Tomcat 10.1. Use Tomcat 10.1 because this project uses Jakarta Servlet 6.

## 1. Set up database
In MySQL Workbench open and run `database/database.sql`. This creates `movie_booking_db` and a separate `movie_bookings` table; it does not alter your existing tables.

## 2. MySQL credentials
Default values are URL `jdbc:mysql://localhost:3306/movie_booking_db`, user `root`, password `root`. If your password differs, set environment variables `CINEMABOOK_DB_URL`, `CINEMABOOK_DB_USER`, and `CINEMABOOK_DB_PASSWORD` before starting Tomcat. Never publish a real password.

## 3. Build
Open the folder containing `pom.xml` in VS Code. In Terminal run `mvn clean package`. The WAR will be `target/cinemabook.war`.

## 4. Deploy
Copy `target/cinemabook.war` to Tomcat 10.1's `webapps` folder and start Tomcat. Open `http://localhost:8080/cinemabook/`.

## 5. Demonstrate
1. Enter customer name, select a movie, future date, showtime and seats.
2. Click Confirm Booking; a booking ID should appear.
3. Confirm it appears in Saved Bookings and run `SELECT * FROM movie_bookings;` in Workbench.
4. Click Edit name and verify the updated value in Workbench.
5. Click Delete and verify the record is gone.

## Troubleshooting
- 404: confirm the WAR deployed and URL contains `/cinemabook/`.
- Database error: start MySQL, execute SQL, and check credentials.
- Build error: run `java -version` and `mvn -version`.
- Posters require internet access and their external URLs may change.
