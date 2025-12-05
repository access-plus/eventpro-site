package com.accessplus.eventpro.core.user.service;

import com.accessplus.eventpro.core.user.entity.UserEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * Service interface for user management operations.
 * 
 * <p>Provides methods for:
 * <ul>
 *   <li>Creating users from Cognito after signup</li>
 *   <li>Retrieving users by Cognito ID or UUID</li>
 *   <li>Updating user profiles</li>
 *   <li>Listing users with pagination</li>
 * </ul>
 */
public interface UserService {

    /**
     * Creates a user entity from Cognito user attributes after signup.
     * 
     * <p>This method is called after a user successfully signs up in Cognito
     * to sync their information to the application database.
     * 
     * @param cognitoUserId AWS Cognito user ID (unique identifier)
     * @param email User email address
     * @param firstName User's first name
     * @param lastName User's last name
     * @param phoneNumber User's phone number (optional, can be null)
     * @param role User role (USER, ORGANIZER, ADMIN) - retrieved from Cognito custom:role attribute, defaults to USER if not found
     * @return Created UserEntity
     * @throws com.accessplus.eventpro.core.common.exception.ConflictException if user with same email or Cognito ID already exists
     */
    UserEntity createUserFromCognito(String cognitoUserId, String email, String firstName, 
                                    String lastName, String phoneNumber, String role);

    /**
     * Retrieves a user by their AWS Cognito user ID.
     * 
     * @param cognitoUserId AWS Cognito user ID
     * @return UserEntity if found
     * @throws com.accessplus.eventpro.core.common.exception.ResourceNotFoundException if user not found
     */
    UserEntity getUserByCognitoId(String cognitoUserId);

    /**
     * Retrieves a user by their UUID.
     * 
     * @param userId User ID (UUID)
     * @return UserEntity if found
     * @throws com.accessplus.eventpro.core.common.exception.ResourceNotFoundException if user not found
     */
    UserEntity getUserById(UUID userId);

    /**
     * Retrieves all users with pagination.
     * 
     * @param pageable Pagination and sorting parameters
     * @return Page of UserEntity
     */
    Page<UserEntity> getAllUsers(Pageable pageable);

    /**
     * Updates user profile information.
     * 
     * <p>Only updates provided fields (non-null values).
     * Email cannot be updated via this method (managed by Cognito).
     * 
     * @param userId User ID (UUID)
     * @param firstName New first name (optional, null to skip)
     * @param lastName New last name (optional, null to skip)
     * @param phoneNumber New phone number (optional, null to skip)
     * @return Updated UserEntity
     * @throws com.accessplus.eventpro.core.common.exception.ResourceNotFoundException if user not found
     */
    UserEntity updateUserProfile(UUID userId, String firstName, String lastName, String phoneNumber);

    /**
     * Updates user profile information by Cognito user ID.
     * 
     * <p>Only updates provided fields (non-null values).
     * Email cannot be updated via this method (managed by Cognito).
     * 
     * @param cognitoUserId AWS Cognito user ID
     * @param firstName New first name (optional, null to skip)
     * @param lastName New last name (optional, null to skip)
     * @param phoneNumber New phone number (optional, null to skip)
     * @return Updated UserEntity
     * @throws com.accessplus.eventpro.core.common.exception.ResourceNotFoundException if user not found
     */
    UserEntity updateUserProfile(String cognitoUserId, String firstName, String lastName, String phoneNumber);

    /**
     * Updates user profile information by Cognito user ID with extended fields.
     * 
     * <p>Only updates provided fields (non-null values).
     * Email cannot be updated via this method (managed by Cognito).
     * 
     * @param cognitoUserId AWS Cognito user ID
     * @param firstName New first name (optional, null to skip)
     * @param lastName New last name (optional, null to skip)
     * @param phoneNumber New phone number (optional, null to skip)
     * @param bio New bio (optional, null to skip)
     * @param location New location (optional, null to skip)
     * @param profilePictureUrl New profile picture URL (optional, null to skip)
     * @return Updated UserEntity
     * @throws com.accessplus.eventpro.core.common.exception.ResourceNotFoundException if user not found
     */
    UserEntity updateUserProfile(String cognitoUserId, String firstName, String lastName, String phoneNumber,
                                 String bio, String location, String profilePictureUrl);

    /**
     * Updates user status.
     * 
     * @param userId User ID (UUID)
     * @param status New status (ACTIVE, SUSPENDED, PENDING_VERIFICATION)
     * @return Updated UserEntity
     * @throws com.accessplus.eventpro.core.common.exception.ResourceNotFoundException if user not found
     */
    UserEntity updateUserStatus(UUID userId, String status);

    /**
     * Updates user role.
     * 
     * @param userId User ID (UUID)
     * @param role New role (USER, ORGANIZER, ADMIN)
     * @return Updated UserEntity
     * @throws com.accessplus.eventpro.core.common.exception.ResourceNotFoundException if user not found
     */
    UserEntity updateUserRole(UUID userId, String role);
}

