package com.accessplus.eventpro.core.user.service;

import com.accessplus.eventpro.core.common.exception.ValidationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * Mock Cognito Admin Service for local development.
 * Simulates Cognito Admin API operations without requiring actual Cognito.
 * 
 * This service is activated when local.auth.enabled=true.
 * It provides the same interface as CognitoAdminService but with mock implementations.
 */
@Service
@ConditionalOnProperty(
    name = "local.auth.enabled",
    havingValue = "true",
    matchIfMissing = false
)
@Slf4j
public class LocalCognitoAdminService implements CognitoAdminServiceInterface {

    // In-memory store for user groups (simulating Cognito groups)
    private final Map<String, String> userGroups = new HashMap<>();

    /**
     * Promotes a user to ORGANIZER role (mock implementation).
     * In local development, this just stores the group assignment in memory.
     * 
     * @param cognitoUserId AWS Cognito user ID (sub claim)
     * @throws ValidationException if operation fails
     */
    public void promoteUserToOrganizer(String cognitoUserId) {
        log.info("LOCAL MODE: Promoting user to ORGANIZER role: cognitoUserId={}", cognitoUserId);
        
        try {
            // In local mode, just store the group assignment
            userGroups.put(cognitoUserId, "ORGANIZER");
            log.info("LOCAL MODE: Successfully promoted user to ORGANIZER role: cognitoUserId={}", cognitoUserId);
        } catch (Exception e) {
            log.error("LOCAL MODE: Failed to promote user to ORGANIZER role: cognitoUserId={}, error={}", 
                    cognitoUserId, e.getMessage(), e);
            throw new ValidationException("Failed to promote user to ORGANIZER role: " + e.getMessage());
        }
    }

    /**
     * Gets user attributes from Cognito (mock implementation).
     * Returns mock user attributes for local development.
     * 
     * @param cognitoUserId AWS Cognito user ID (sub claim)
     * @return Map of user attributes
     * @throws ValidationException if operation fails
     */
    public Map<String, String> getUserAttributes(String cognitoUserId) {
        log.debug("LOCAL MODE: Getting user attributes: cognitoUserId={}", cognitoUserId);
        
        try {
            Map<String, String> attributes = new HashMap<>();
            attributes.put("sub", cognitoUserId);
            attributes.put("email", "dev@local.test");
            attributes.put("given_name", "Local");
            attributes.put("family_name", "Developer");
            
            // Include group if assigned
            String group = userGroups.get(cognitoUserId);
            if (group != null) {
                attributes.put("cognito:groups", group);
            }
            
            log.debug("LOCAL MODE: Retrieved user attributes: cognitoUserId={}, attributes={}", 
                    cognitoUserId, attributes.keySet());
            return attributes;
        } catch (Exception e) {
            log.error("LOCAL MODE: Failed to get user attributes: cognitoUserId={}, error={}", 
                    cognitoUserId, e.getMessage(), e);
            throw new ValidationException("Failed to get user attributes: " + e.getMessage());
        }
    }
}

