package com.accessplus.eventpro.core.user.service;

import com.accessplus.eventpro.shared.exception.ValidationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminAddUserToGroupRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminGetUserRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminGetUserResponse;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AttributeType;
import software.amazon.awssdk.services.cognitoidentityprovider.model.CognitoIdentityProviderException;

import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for Cognito Admin API operations.
 * 
 * <p>Handles administrative operations like promoting users to ORGANIZER role.
 * Note: ADMIN role can only be assigned via Terraform infrastructure.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CognitoAdminService implements CognitoAdminServiceInterface {

    private final CognitoIdentityProviderClient cognitoClient;

    @Value("${aws.cognito.userPoolId:}")
    private String userPoolId;

    /**
     * Promotes a user to ORGANIZER role by adding them to the ORGANIZER group in Cognito.
     * 
     * <p>Note: Users can only be promoted to ORGANIZER role.
     * ADMIN role can only be assigned via Terraform infrastructure.
     * 
     * <p>The username parameter can be either the Cognito username (email) or the sub claim.
     * We use the sub claim (cognitoUserId) which should work with Cognito Admin API.
     * 
     * @param cognitoUserId AWS Cognito user ID (sub claim) - can be used as username
     * @throws ValidationException if Cognito operation fails
     */
    public void promoteUserToOrganizer(String cognitoUserId) {
        log.info("Promoting user to ORGANIZER role: cognitoUserId={}", cognitoUserId);

        if (userPoolId == null || userPoolId.trim().isEmpty()) {
            throw new IllegalStateException(
                "aws.cognito.userPoolId must be configured. " +
                "Please set COGNITO_USER_POOL_ID environment variable."
            );
        }

        try {
            // Cognito Admin API accepts either username (email) or sub claim as username parameter
            AdminAddUserToGroupRequest request = AdminAddUserToGroupRequest.builder()
                    .userPoolId(userPoolId)
                    .username(cognitoUserId) // Using sub claim as username
                    .groupName("ORGANIZER")
                    .build();

            cognitoClient.adminAddUserToGroup(request);
            log.info("Successfully promoted user to ORGANIZER role: cognitoUserId={}", cognitoUserId);
        } catch (CognitoIdentityProviderException e) {
            log.error("Failed to promote user to ORGANIZER role: cognitoUserId={}, error={}", 
                    cognitoUserId, e.getMessage(), e);
            throw new ValidationException("Failed to promote user: " + e.getMessage());
        }
    }

    /**
     * Gets user attributes from Cognito using Admin API.
     * 
     * @param cognitoUserId AWS Cognito user ID (sub claim) - can be used as username
     * @return Map of user attributes (email, given_name, family_name, phone_number, etc.)
     * @throws ValidationException if Cognito operation fails
     */
    public Map<String, String> getUserAttributes(String cognitoUserId) {
        log.debug("Getting user attributes from Cognito: cognitoUserId={}", cognitoUserId);

        if (userPoolId == null || userPoolId.trim().isEmpty()) {
            throw new IllegalStateException(
                "aws.cognito.userPoolId must be configured. " +
                "Please set COGNITO_USER_POOL_ID environment variable."
            );
        }

        try {
            AdminGetUserRequest request = AdminGetUserRequest.builder()
                    .userPoolId(userPoolId)
                    .username(cognitoUserId) // Using sub claim as username
                    .build();

            AdminGetUserResponse response = cognitoClient.adminGetUser(request);
            
            // Convert attributes list to map for easier access
            Map<String, String> attributes = response.userAttributes().stream()
                    .collect(Collectors.toMap(
                            AttributeType::name,
                            AttributeType::value,
                            (existing, replacement) -> existing // Keep first value if duplicate
                    ));

            log.debug("Retrieved user attributes from Cognito: cognitoUserId={}, attributes={}", 
                    cognitoUserId, attributes.keySet());
            return attributes;
        } catch (CognitoIdentityProviderException e) {
            log.error("Failed to get user attributes from Cognito: cognitoUserId={}, error={}", 
                    cognitoUserId, e.getMessage(), e);
            throw new ValidationException("Failed to get user attributes: " + e.getMessage());
        }
    }
}

