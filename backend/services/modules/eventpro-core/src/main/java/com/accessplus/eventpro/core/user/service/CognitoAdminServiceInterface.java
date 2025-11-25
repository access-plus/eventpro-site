package com.accessplus.eventpro.core.user.service;

import java.util.Map;

/**
 * Interface for Cognito Admin API operations.
 * 
 * <p>This interface provides abstraction for Cognito Admin API operations,
 * allowing for easier testing and potential future extensions.
 * 
 * <p>The standard implementation is {@link CognitoAdminService}, which uses
 * AWS Cognito Identity Provider Client for all operations.
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

