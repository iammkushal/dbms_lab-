/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.mycompany.cinemabookapi;

/**
 *
 * @author KUSHAL
 */



import java.io.IOException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet("/shows")
public class ShowServlet extends HttpServlet {

    private static final String URL =
            "jdbc:mysql://localhost:3306/movie_booking_db";
    private static final String USER = "root";
    private static final String PASSWORD = "root";

    @Override
    protected void doGet(HttpServletRequest request,
                         HttpServletResponse response)
            throws IOException {

        response.setContentType("application/json;charset=UTF-8");

        String sql = "SELECT show_id, movie_id, show_date, show_time, "
                   + "screen_name FROM shows ORDER BY show_id";

        try (Connection con =
                     DriverManager.getConnection(URL, USER, PASSWORD);
             PreparedStatement ps = con.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            StringBuilder json = new StringBuilder("[");
            boolean first = true;

            while (rs.next()) {
                if (!first) {
                    json.append(",");
                }

                json.append("{")
                    .append("\"show_id\":").append(rs.getInt("show_id"))
                    .append(",\"movie_id\":").append(rs.getInt("movie_id"))
                    .append(",\"show_date\":\"")
                    .append(rs.getDate("show_date")).append("\"")
                    .append(",\"show_time\":\"")
                    .append(rs.getTime("show_time")).append("\"")
                    .append(",\"screen_name\":\"")
                    .append(rs.getString("screen_name")).append("\"")
                    .append("}");

                first = false;
            }

            json.append("]");
            response.getWriter().print(json.toString());

        } catch (Exception e) {
            response.setStatus(
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().print(
                    "{\"error\":\"Could not load shows from database.\"}");
            e.printStackTrace();
        }
    }
}
