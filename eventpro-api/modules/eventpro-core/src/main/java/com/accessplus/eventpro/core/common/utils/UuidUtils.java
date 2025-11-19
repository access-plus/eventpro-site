package com.accessplus.eventpro.core.common.utils;

import java.util.UUID;

/**
 * Utility class for UUID operations.
 */
public final class UuidUtils {
    
    private UuidUtils() {
        // Utility class - prevent instantiation
    }
    
    /**
     * Generate a new UUID.
     */
    public static UUID generate() {
        return UUID.randomUUID();
    }
    
    /**
     * Parse a UUID from string, returning null if invalid.
     */
    public static UUID parseOrNull(String uuidString) {
        if (uuidString == null || uuidString.trim().isEmpty()) {
            return null;
        }
        try {
            return UUID.fromString(uuidString.trim());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
    
    /**
     * Check if a string is a valid UUID format.
     */
    public static boolean isValid(String uuidString) {
        return parseOrNull(uuidString) != null;
    }
    
    /**
     * Convert UUID to string, returning null if UUID is null.
     */
    public static String toString(UUID uuid) {
        return uuid != null ? uuid.toString() : null;
    }
}

