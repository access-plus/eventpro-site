package com.accessplus.eventpro.shared.util;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Utility class for date and time operations.
 */
public final class DateUtils {
    
    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_DATE_TIME;
    private static final String DEFAULT_TIMEZONE = "UTC";
    
    private DateUtils() {
        // Utility class - prevent instantiation
    }
    
    /**
     * Get current UTC timestamp.
     */
    public static LocalDateTime now() {
        return LocalDateTime.now(ZoneId.of(DEFAULT_TIMEZONE));
    }
    
    /**
     * Format LocalDateTime to ISO string.
     */
    public static String formatIso(LocalDateTime dateTime) {
        if (dateTime == null) {
            return null;
        }
        return dateTime.format(ISO_FORMATTER);
    }
    
    /**
     * Parse ISO string to LocalDateTime.
     */
    public static LocalDateTime parseIso(String dateTimeString) {
        if (dateTimeString == null || dateTimeString.isEmpty()) {
            return null;
        }
        return LocalDateTime.parse(dateTimeString, ISO_FORMATTER);
    }
    
    /**
     * Convert LocalDateTime to ZonedDateTime in UTC.
     */
    public static ZonedDateTime toZonedDateTime(LocalDateTime dateTime) {
        if (dateTime == null) {
            return null;
        }
        return dateTime.atZone(ZoneId.of(DEFAULT_TIMEZONE));
    }
    
    /**
     * Check if a date is in the past.
     */
    public static boolean isPast(LocalDateTime dateTime) {
        return dateTime != null && dateTime.isBefore(now());
    }
    
    /**
     * Check if a date is in the future.
     */
    public static boolean isFuture(LocalDateTime dateTime) {
        return dateTime != null && dateTime.isAfter(now());
    }
}

