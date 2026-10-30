package com.mycompany.cinemabookapi;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
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
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@WebServlet("/api/bookings")
public class BookingsServlet extends HttpServlet {
    private static final String URL = System.getenv().getOrDefault("CINEMABOOK_DB_URL", "jdbc:mysql://localhost:3306/movie_booking_db");
    private static final String USER = System.getenv().getOrDefault("CINEMABOOK_DB_USER", "root");
    private static final String PASSWORD = System.getenv().getOrDefault("CINEMABOOK_DB_PASSWORD", "root");
    private final Gson gson = new Gson();

    private Connection connect() throws SQLException { return DriverManager.getConnection(URL, USER, PASSWORD); }
    private void send(HttpServletResponse response, int status, Object value) throws IOException {
        response.setStatus(status); response.setContentType("application/json;charset=UTF-8"); response.getWriter().print(gson.toJson(value));
    }
    private JsonObject readBody(HttpServletRequest request) throws IOException {
        return JsonParser.parseString(request.getReader().lines().reduce("", (a,b) -> a+b)).getAsJsonObject();
    }
    private String required(JsonObject body, String key, int max) {
        if (!body.has(key) || body.get(key).isJsonNull()) throw new IllegalArgumentException("Missing " + key);
        String value=body.get(key).getAsString().trim();
        if (value.isEmpty() || value.length()>max) throw new IllegalArgumentException("Invalid " + key);
        return value;
    }
    private String optional(JsonObject body, String key, int max) {
        if (!body.has(key) || body.get(key).isJsonNull()) return "";
        String value=body.get(key).getAsString().trim();
        if (value.length()>max) throw new IllegalArgumentException("Invalid " + key);
        return value;
    }

    // SELECT: return saved bookings to the web page.
    @Override protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String sql="SELECT booking_id, customer_name, customer_email, movie_name, show_date, show_time, seat_numbers, total_amount, created_at FROM movie_bookings ORDER BY booking_id DESC";
        List<Map<String,Object>> list=new ArrayList<>();
        try (Connection con=connect(); PreparedStatement ps=con.prepareStatement(sql); ResultSet rs=ps.executeQuery()) {
            while(rs.next()) {
                Map<String,Object> row=new LinkedHashMap<>();
                row.put("bookingId",rs.getInt("booking_id")); row.put("customerName",rs.getString("customer_name"));
                row.put("customerEmail",rs.getString("customer_email")); row.put("movieName",rs.getString("movie_name"));
                row.put("showDate",rs.getDate("show_date").toString()); row.put("showTime",rs.getString("show_time"));
                row.put("seatNumbers",rs.getString("seat_numbers")); row.put("totalAmount",rs.getBigDecimal("total_amount"));
                row.put("createdAt",rs.getTimestamp("created_at").toString()); list.add(row);
            }
            send(resp,200,list);
        } catch(SQLException e) { getServletContext().log("SELECT bookings failed",e); send(resp,500,Map.of("error","Database error. Check MySQL is running, database.sql was executed, and credentials are correct.")); }
    }

    // INSERT: save a booking.
    @Override protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            JsonObject b=readBody(req); String name=required(b,"customerName",100), email=optional(b,"customerEmail",100);
            String movie=required(b,"movieName",150); LocalDate date=LocalDate.parse(required(b,"showDate",10));
            String time=required(b,"showTime",20), seats=required(b,"seatNumbers",200);
            BigDecimal amount=new BigDecimal(required(b,"totalAmount",20));
            if(date.isBefore(LocalDate.now()) || amount.signum()<0) { send(resp,400,Map.of("error","Choose a valid date and non-negative amount.")); return; }
            String sql="INSERT INTO movie_bookings (customer_name,customer_email,movie_name,show_date,show_time,seat_numbers,total_amount) VALUES (?,?,?,?,?,?,?)";
            try(Connection con=connect(); PreparedStatement ps=con.prepareStatement(sql,Statement.RETURN_GENERATED_KEYS)) {
                ps.setString(1,name); ps.setString(2,email); ps.setString(3,movie); ps.setDate(4,java.sql.Date.valueOf(date));
                ps.setString(5,time); ps.setString(6,seats); ps.setBigDecimal(7,amount); ps.executeUpdate();
                try(ResultSet keys=ps.getGeneratedKeys()) { if(keys.next()) { send(resp,201,Map.of("message","Booking saved","bookingId",keys.getInt(1))); return; } }
            }
            send(resp,500,Map.of("error","Booking was not saved."));
        } catch(IllegalArgumentException e) { send(resp,400,Map.of("error","Invalid booking details. Check name, date, seats and amount.")); }
          catch(SQLException e) { getServletContext().log("INSERT booking failed",e); send(resp,500,Map.of("error","Database error while saving. Check MySQL credentials and table.")); }
          catch(Exception e) { send(resp,400,Map.of("error","Please provide valid booking details.")); }
    }

    // UPDATE: edit the customer's name for an existing booking.
    @Override protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            JsonObject b=readBody(req); int id=Integer.parseInt(required(b,"bookingId",12)); String name=required(b,"customerName",100);
            try(Connection con=connect(); PreparedStatement ps=con.prepareStatement("UPDATE movie_bookings SET customer_name=? WHERE booking_id=?")) {
                ps.setString(1,name); ps.setInt(2,id); int count=ps.executeUpdate();
                if(count==0) send(resp,404,Map.of("error","Booking not found.")); else send(resp,200,Map.of("message","Booking updated."));
            }
        } catch(Exception e) { getServletContext().log("UPDATE booking failed",e); send(resp,400,Map.of("error","Could not update booking. Check booking ID and database.")); }
    }

    // DELETE: remove a booking by ID.
    @Override protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            int id=Integer.parseInt(req.getParameter("id"));
            try(Connection con=connect(); PreparedStatement ps=con.prepareStatement("DELETE FROM movie_bookings WHERE booking_id=?")) {
                ps.setInt(1,id); int count=ps.executeUpdate();
                if(count==0) send(resp,404,Map.of("error","Booking not found.")); else send(resp,200,Map.of("message","Booking deleted."));
            }
        } catch(Exception e) { getServletContext().log("DELETE booking failed",e); send(resp,400,Map.of("error","Could not delete booking. Check booking ID and database.")); }
    }
}
