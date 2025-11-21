package com.accessplus.eventpro.core.user.service;

import java.util.Map;

/**
 * Interface for Cognito Admin API operations.
 * Allows switching between real Cognito and mock implementations for local development.
 */
public interface CognitoAdminServiceInterface {
    
    /**
     * Promotes a user to ORGANIZER role.
     * 
     * @param cognitoUserId AWS Cognito user ID (sub claim)
     */
    void promoteUserToOrganizer(String cognitoUserId);
    
    /**
     * Gets user attributes from Cognito.
     * 
     * @param cognitoUserId AWS Cognito user ID (sub claim)
     * @return Map of user attributes
     */
    Map<String, String> getUserAttributes(String cognitoUserId);
}

