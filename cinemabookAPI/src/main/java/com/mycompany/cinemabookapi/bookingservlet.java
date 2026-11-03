package com.mycompany.cinemabookapi;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.regex.Pattern;

@WebServlet("/bookings/*")
public class bookingservlet extends HttpServlet {

    private static final String URL =
            "jdbc:mysql://localhost:3306/movie_booking_db";
    private static final String USER = "root";
    private static final String PASSWORD = "root";

    private static final Pattern SEAT = Pattern.compile("^[A-H](10|[1-9])$");
    private static final Pattern EMAIL =
            Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
    private static final Pattern PHONE = Pattern.compile("^\\+?[0-9]{10,14}$");
    private static final Pattern UTR = Pattern.compile("^[0-9]{12}$");
    private static final int MAX_SEATS = 10;

    static {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }
    }

    /* ================= GET ================= */

    @Override
    protected void doGet(HttpServletRequest request,
                         HttpServletResponse response) throws IOException {

        String path = request.getPathInfo();

        if (path == null || path.equals("/")) {
            listBookings(response);
        } else if (path.equals("/occupied")) {
            occupiedSeats(request, response);
        } else {
            sendJson(response, 404, error("Unknown bookings URL."));
        }
    }

    private void listBookings(HttpServletResponse response) throws IOException {

        String sql =
            "SELECT b.booking_id, b.customer_name, b.customer_email, b.utr_number, "
          + "b.customer_phone, b.total_amount, b.booking_status, "
          + "b.booking_time, m.title, s.show_date, s.show_time, "
          + "s.screen_name, "
          + "GROUP_CONCAT(bs.seat_number ORDER BY bs.seat_number "
          + "SEPARATOR ', ') AS seats "
          + "FROM bookings b "
          + "JOIN shows s ON b.show_id = s.show_id "
          + "JOIN movies m ON s.movie_id = m.movie_id "
          + "LEFT JOIN booking_seats bs ON bs.booking_id = b.booking_id "
          + "GROUP BY b.booking_id, b.customer_name, b.customer_email, b.utr_number, "
          + "b.customer_phone, b.total_amount, b.booking_status, "
          + "b.booking_time, m.title, s.show_date, s.show_time, "
          + "s.screen_name "
          + "ORDER BY b.booking_id DESC";

        try (Connection con = DriverManager.getConnection(URL, USER, PASSWORD);
             PreparedStatement ps = con.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            StringBuilder json = new StringBuilder("[");
            boolean first = true;

            while (rs.next()) {
                if (!first) {
                    json.append(",");
                }
                first = false;

                String when = rs.getString("booking_time");
                if (when != null && when.length() > 19) {
                    when = when.substring(0, 19);
                }

                json.append("{")
                    .append("\"bookingId\":").append(rs.getInt("booking_id"))
                    .append(",\"customerName\":\"")
                    .append(esc(rs.getString("customer_name"))).append("\"")
                    .append(",\"customerEmail\":\"")
                    .append(esc(rs.getString("customer_email"))).append("\"")
                    .append(",\"customerPhone\":\"")
                    .append(esc(rs.getString("customer_phone"))).append("\"")
                    .append(",\"seats\":\"")
                    .append(esc(rs.getString("seats"))).append("\"")
                    .append(",\"totalAmount\":")
                    .append(rs.getBigDecimal("total_amount").toPlainString())
                    .append(",\"status\":\"")
                    .append(esc(rs.getString("booking_status"))).append("\"")
                    .append(",\"utr\":\"")
                    .append(esc(rs.getString("utr_number"))).append("\"")
                    .append(",\"bookingTime\":\"").append(esc(when)).append("\"")
                    .append(",\"movieTitle\":\"")
                    .append(esc(rs.getString("title"))).append("\"")
                    .append(",\"showDate\":\"")
                    .append(esc(rs.getString("show_date"))).append("\"")
                    .append(",\"showTime\":\"")
                    .append(esc(rs.getString("show_time"))).append("\"")
                    .append(",\"screenName\":\"")
                    .append(esc(rs.getString("screen_name"))).append("\"")
                    .append("}");
            }

            json.append("]");
            sendJson(response, 200, json.toString());

        } catch (SQLException e) {
            e.printStackTrace();
            sendJson(response, 500,
                    error("Could not load bookings from the database."));
        }
    }

    private void occupiedSeats(HttpServletRequest request,
                               HttpServletResponse response) throws IOException {

        int showId;
        try {
            showId = Integer.parseInt(
                    String.valueOf(request.getParameter("showId")).trim());
            if (showId <= 0) {
                throw new NumberFormatException();
            }
        } catch (NumberFormatException e) {
            sendJson(response, 400, error("Invalid show ID."));
            return;
        }

        String sql = "SELECT seat_number FROM booking_seats WHERE show_id = ?";

        try (Connection con = DriverManager.getConnection(URL, USER, PASSWORD);
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, showId);

            StringBuilder json = new StringBuilder();
            json.append("{\"showId\":").append(showId).append(",\"seats\":[");

            try (ResultSet rs = ps.executeQuery()) {
                boolean first = true;
                while (rs.next()) {
                    if (!first) {
                        json.append(",");
                    }
                    first = false;
                    json.append("\"").append(esc(rs.getString("seat_number")))
                        .append("\"");
                }
            }

            json.append("]}");
            sendJson(response, 200, json.toString());

        } catch (SQLException e) {
            e.printStackTrace();
            sendJson(response, 500, error("Could not load occupied seats."));
        }
    }

    /* ================= POST ================= */

    @Override
    protected void doPost(HttpServletRequest request,
                          HttpServletResponse response) throws IOException {

        request.setCharacterEncoding("UTF-8");

        String name = clean(request.getParameter("customerName"));
        String email = clean(request.getParameter("customerEmail"));
        String phone = clean(request.getParameter("customerPhone"))
                .replaceAll("[\\s-]", "");
        String utr = clean(request.getParameter("utr"));
        String showText = clean(request.getParameter("showId"));
        String seatText = clean(request.getParameter("seatNumbers"));

        if (name.length() < 2 || name.length() > 100) {
            sendJson(response, 400,
                    error("Please enter a valid name (2 to 100 characters)."));
            return;
        }
        if (email.length() > 100 || !EMAIL.matcher(email).matches()) {
            sendJson(response, 400, error("Please enter a valid email."));
            return;
        }
        if (!PHONE.matcher(phone).matches()) {
            sendJson(response, 400,
                    error("Phone number must have 10 to 14 digits."));
            return;
        }

        if (!UTR.matcher(utr).matches()) {
            sendJson(response, 400, error(
                    "Please enter the 12-digit UTR number from your UPI app."));
            return;
        }

        int showId;
        try {
            showId = Integer.parseInt(showText);
            if (showId <= 0) {
                throw new NumberFormatException();
            }
        } catch (NumberFormatException e) {
            sendJson(response, 400, error("Invalid show ID."));
            return;
        }

        if (seatText.isEmpty()) {
            sendJson(response, 400, error("Please select at least one seat."));
            return;
        }

        Set<String> seats = new LinkedHashSet<>();
        for (String token : seatText.split(",")) {
            String seat = token.trim().toUpperCase();
            if (!SEAT.matcher(seat).matches()) {
                sendJson(response, 400, error("Invalid seat: " + seat));
                return;
            }
            if (!seats.add(seat)) {
                sendJson(response, 400, error("Seat " + seat
                        + " was selected twice."));
                return;
            }
        }
        if (seats.size() > MAX_SEATS) {
            sendJson(response, 400,
                    error("You can book at most " + MAX_SEATS + " seats."));
            return;
        }

        String showSql =
            "SELECT m.title, m.price, s.show_date, s.show_time, s.screen_name "
          + "FROM shows s JOIN movies m ON s.movie_id = m.movie_id "
          + "WHERE s.show_id = ?";

        String insertBooking =
            "INSERT INTO bookings (show_id, customer_name, customer_email, "
          + "customer_phone, total_amount, booking_status, utr_number) "
          + "VALUES (?, ?, ?, ?, ?, 'CONFIRMED', ?)";

        String insertSeat =
            "INSERT INTO booking_seats (booking_id, show_id, seat_number) "
          + "VALUES (?, ?, ?)";

        try (Connection con = DriverManager.getConnection(URL, USER, PASSWORD)) {

            String title;
            String showDate;
            String showTime;
            String screen;
            BigDecimal price;

            try (PreparedStatement ps = con.prepareStatement(showSql)) {
                ps.setInt(1, showId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (!rs.next()) {
                        sendJson(response, 400,
                                error("Selected show was not found."));
                        return;
                    }
                    title = rs.getString("title");
                    price = rs.getBigDecimal("price");
                    showDate = rs.getString("show_date");
                    showTime = rs.getString("show_time");
                    screen = rs.getString("screen_name");
                }
            }

            // The price always comes from the database, never from the browser.
            BigDecimal total = price.multiply(BigDecimal.valueOf(seats.size()));

            con.setAutoCommit(false);

            try {
                int bookingId = -1;

                try (PreparedStatement ps = con.prepareStatement(
                        insertBooking, Statement.RETURN_GENERATED_KEYS)) {
                    ps.setInt(1, showId);
                    ps.setString(2, name);
                    ps.setString(3, email);
                    ps.setString(4, phone);
                    ps.setBigDecimal(5, total);
                    ps.setString(6, utr);
                    ps.executeUpdate();

                    try (ResultSet keys = ps.getGeneratedKeys()) {
                        if (keys.next()) {
                            bookingId = keys.getInt(1);
                        }
                    }
                }

                if (bookingId < 0) {
                    throw new SQLException("No booking ID was generated.");
                }

                try (PreparedStatement ps = con.prepareStatement(insertSeat)) {
                    for (String seat : seats) {
                        ps.setInt(1, bookingId);
                        ps.setInt(2, showId);
                        ps.setString(3, seat);
                        ps.executeUpdate();
                    }
                }

                con.commit();

                StringBuilder seatJson = new StringBuilder("[");
                boolean first = true;
                for (String seat : seats) {
                    if (!first) {
                        seatJson.append(",");
                    }
                    first = false;
                    seatJson.append("\"").append(seat).append("\"");
                }
                seatJson.append("]");

                String json = "{\"success\":true,"
                    + "\"message\":\"Booking confirmed!\","
                    + "\"bookingId\":" + bookingId + ","
                    + "\"customerName\":\"" + esc(name) + "\","
                    + "\"movieTitle\":\"" + esc(title) + "\","
                    + "\"showDate\":\"" + esc(showDate) + "\","
                    + "\"showTime\":\"" + esc(showTime) + "\","
                    + "\"screenName\":\"" + esc(screen) + "\","
                    + "\"seats\":" + seatJson + ","
                    + "\"utr\":\"" + esc(utr) + "\","
                    + "\"pricePerSeat\":" + price.toPlainString() + ","
                    + "\"totalAmount\":" + total.toPlainString()
                    + "}";

                sendJson(response, 201, json);

            } catch (SQLException e) {
                con.rollback();

                if (e.getErrorCode() == 1062
                        && String.valueOf(e.getMessage()).contains("utr_number")) {
                    sendJson(response, 409, error(
                        "This UTR number was already used for another "
                      + "booking. Please check your UTR number."));
                } else if (e.getErrorCode() == 1062) {
                    sendJson(response, 409, error(
                        "Sorry, one or more of those seats were just booked "
                      + "by someone else. Please choose different seats."));
                } else {
                    throw e;
                }
            }

        } catch (SQLException e) {
            e.printStackTrace();
            sendJson(response, 500,
                    error("Database error. Please check the NetBeans Output."));
        }
    }

    /* ================= helpers ================= */

    private static String clean(String value) {
        return value == null ? "" : value.trim();
    }

    private static void sendJson(HttpServletResponse response, int status,
                                 String json) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json;charset=UTF-8");
        response.setHeader("Cache-Control", "no-store");
        response.getWriter().write(json);
    }

    private static String error(String message) {
        return "{\"success\":false,\"error\":\"" + esc(message) + "\"}";
    }

    private static String esc(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("\\", "\\\\")
                    .replace("\"", "\\\"")
                    .replace("\n", "\\n")
                    .replace("\r", "\\r")
                    .replace("\t", "\\t");
    }
}