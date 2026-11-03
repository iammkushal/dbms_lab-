
package com.mycompany.cinemabookapi;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet("/movies")
public class MovieBookingServlet extends HttpServlet {

    private static final String URL =
            "jdbc:mysql://localhost:3306/movie_booking_db";
    private static final String USER = "root";
    private static final String PASSWORD = "root";

    @Override
    protected void doGet(HttpServletRequest request,
                         HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json;charset=UTF-8");

        try (PrintWriter out = response.getWriter()) {
            try {
                Class.forName("com.mysql.cj.jdbc.Driver");

                try (Connection con = DriverManager.getConnection(
                            URL, USER, PASSWORD);
                     Statement stmt = con.createStatement();
                     ResultSet rs = stmt.executeQuery(
                         "SELECT movie_id, title, genre, language, "
                       + "price, poster_url FROM movies")) {

                    out.print("[");

                    boolean first = true;

                    while (rs.next()) {
                        if (!first) {
                            out.print(",");
                        }
                        first = false;

                        out.print("{");
                        out.print("\"id\":" + rs.getInt("movie_id") + ",");
                        out.print("\"title\":\""
                                + escapeJson(rs.getString("title")) + "\",");
                        out.print("\"genre\":\""
                                + escapeJson(rs.getString("genre")) + "\",");
                        out.print("\"language\":\""
                                + escapeJson(rs.getString("language")) + "\",");
                        out.print("\"price\":"
                                + rs.getBigDecimal("price") + ",");
                        out.print("\"image\":\""
                                + escapeJson(rs.getString("poster_url")) + "\"");
                        out.print("}");
                    }

                    out.print("]");
                }
            } catch (Exception e) {
                response.setStatus(
                        HttpServletResponse.SC_INTERNAL_SERVER_ERROR);

                out.print("{\"error\":\""
                        + escapeJson(e.getMessage()) + "\"}");
            }
        }
    }

    private String escapeJson(String value) {
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
