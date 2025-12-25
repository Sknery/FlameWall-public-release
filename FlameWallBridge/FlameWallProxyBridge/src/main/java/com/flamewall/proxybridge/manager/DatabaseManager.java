package com.flamewall.proxybridge.manager;

import org.slf4j.Logger;
import java.io.File;
import java.nio.file.Path;
import java.sql.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DatabaseManager {
    private final Logger logger;
    private Connection connection;

    public DatabaseManager(Path dataDirectory, Logger logger) {
        this.logger = logger;
        try {
            File dataFolder = dataDirectory.toFile();
            if (!dataFolder.exists()) {
                dataFolder.mkdirs();
            }
            File dbFile = new File(dataFolder, "offline-queue.db");
            String url = "jdbc:sqlite:" + dbFile.getAbsolutePath();
            connection = DriverManager.getConnection(url);
            logger.info("Successfully connected to the local SQLite database for event queuing.");
            createTable();
        } catch (SQLException e) {
            logger.error("Failed to connect to SQLite database!", e);
        }
    }

    private void createTable() {
        String sql = "CREATE TABLE IF NOT EXISTS queued_events (id INTEGER PRIMARY KEY AUTOINCREMENT, event_json TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);";
        try (Statement stmt = connection.createStatement()) {
            stmt.execute(sql);
        } catch (SQLException e) {
            logger.error("Could not create queued_events table!", e);
        }
    }

    public void queueEvent(String jsonPayload) {
        if (connection == null) return;
        String sql = "INSERT INTO queued_events(event_json) VALUES(?)";
        try (PreparedStatement pstmt = connection.prepareStatement(sql)) {
            pstmt.setString(1, jsonPayload);
            pstmt.executeUpdate();
            logger.info("Website offline. Queued 1 event to local database.");
        } catch (SQLException e) {
            logger.error("Could not queue event to SQLite!", e);
        }
    }

    public Map<Integer, String> getQueuedEvents() {
        if (connection == null) return new HashMap<>();
        Map<Integer, String> events = new HashMap<>();
        String sql = "SELECT id, event_json FROM queued_events ORDER BY id ASC LIMIT 100;";
        try (Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                events.put(rs.getInt("id"), rs.getString("event_json"));
            }
        } catch (SQLException e) {
            logger.error("Could not retrieve queued events from SQLite!", e);
        }
        return events;
    }

    public void deleteEvents(List<Integer> ids) {
        if (connection == null || ids.isEmpty()) return;
        String sql = "DELETE FROM queued_events WHERE id = ?";
        try (PreparedStatement pstmt = connection.prepareStatement(sql)) {
            for (Integer id : ids) {
                pstmt.setInt(1, id);
                pstmt.addBatch();
            }
            pstmt.executeBatch();
            logger.info("Successfully deleted " + ids.size() + " events from local queue.");
        } catch (SQLException e) {
            logger.error("Could not delete events from SQLite!", e);
        }
    }

    public void close() {
        try {
            if (connection != null && !connection.isClosed()) {
                connection.close();
            }
        } catch (SQLException e) {
            logger.error("Failed to close SQLite connection!", e);
        }
    }
}