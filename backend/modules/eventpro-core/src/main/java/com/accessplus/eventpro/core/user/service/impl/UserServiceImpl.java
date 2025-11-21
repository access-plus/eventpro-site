package com.accessplus.eventpro.core.user.service.impl;

import com.accessplus.eventpro.core.common.exception.ConflictException;
import com.accessplus.eventpro.core.common.exception.ResourceNotFoundException;
import com.accessplus.eventpro.core.user.entity.UserEntity;
import com.accessplus.eventpro.core.user.repository.UserRepository;
import com.accessplus.eventpro.core.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Implementation of UserService.
 * 
 * <p>Handles user management operations including:
 * <ul>
 *   <li>Syncing users from Cognito after signup</li>
 *   <li>Retrieving users by Cognito ID</li>
 *   <li>Updating user profiles</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public UserEntity createUserFromCognito(String cognitoUserId, String email, String firstName, 
                                           String lastName, String phoneNumber) {
        log.debug("Creating user from Cognito: cognitoUserId={}, email={}", cognitoUserId, email);

        // Check if user already exists by Cognito ID
        if (userRepository.findByCognitoUserId(cognitoUserId).isPresent()) {
            log.warn("User with Cognito ID '{}' already exists", cognitoUserId);
            throw new ConflictException("User", "cognitoUserId", cognitoUserId);
        }

        // Check if user already exists by email
        if (userRepository.findByEmail(email).isPresent()) {
            log.warn("User with email '{}' already exists", email);
            throw new ConflictException("User", "email", email);
        }

        // Create new user entity
        UserEntity user = new UserEntity();
        user.setCognitoUserId(cognitoUserId);
        user.setEmail(email);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setPhoneNumber(phoneNumber);

        UserEntity savedUser = userRepository.save(user);
        log.info("Created user from Cognito: id={}, email={}, cognitoUserId={}", 
                savedUser.getId(), savedUser.getEmail(), savedUser.getCognitoUserId());

        return savedUser;
    }

    @Override
    @Transactional(readOnly = true)
    public UserEntity getUserByCognitoId(String cognitoUserId) {
        log.debug("Retrieving user by Cognito ID: {}", cognitoUserId);

        return userRepository.findByCognitoUserId(cognitoUserId)
                .orElseThrow(() -> {
                    log.warn("User not found with Cognito ID: {}", cognitoUserId);
                    return new ResourceNotFoundException("User", cognitoUserId);
                });
    }

    @Override
    @Transactional(readOnly = true)
    public UserEntity getUserById(UUID userId) {
        log.debug("Retrieving user by ID: {}", userId);

        return userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.warn("User not found with ID: {}", userId);
                    return new ResourceNotFoundException("User", userId.toString());
                });
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserEntity> getAllUsers(Pageable pageable) {
        log.debug("Retrieving all users with pagination: {}", pageable);
        return userRepository.findAll(pageable);
    }

    @Override
    public UserEntity updateUserProfile(UUID userId, String firstName, String lastName, String phoneNumber) {
        log.debug("Updating user profile: userId={}", userId);

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.warn("User not found with ID: {}", userId);
                    return new ResourceNotFoundException("User", userId.toString());
                });

        return updateUserFields(user, firstName, lastName, phoneNumber);
    }

    @Override
    public UserEntity updateUserProfile(String cognitoUserId, String firstName, String lastName, String phoneNumber) {
        log.debug("Updating user profile: cognitoUserId={}", cognitoUserId);

        UserEntity user = getUserByCognitoId(cognitoUserId);
        return updateUserFields(user, firstName, lastName, phoneNumber);
    }

    /**
     * Updates user fields if provided (non-null values).
     * 
     * @param user User entity to update
     * @param firstName New first name (optional, null to skip)
     * @param lastName New last name (optional, null to skip)
     * @param phoneNumber New phone number (optional, null to skip)
     * @return Updated UserEntity
     */
    private UserEntity updateUserFields(UserEntity user, String firstName, String lastName, String phoneNumber) {
        boolean updated = false;

        if (firstName != null && !firstName.equals(user.getFirstName())) {
            user.setFirstName(firstName);
            updated = true;
            log.debug("Updated firstName for user: {}", user.getId());
        }

        if (lastName != null && !lastName.equals(user.getLastName())) {
            user.setLastName(lastName);
            updated = true;
            log.debug("Updated lastName for user: {}", user.getId());
        }

        if (phoneNumber != null && !phoneNumber.equals(user.getPhoneNumber())) {
            user.setPhoneNumber(phoneNumber);
            updated = true;
            log.debug("Updated phoneNumber for user: {}", user.getId());
        }

        if (updated) {
            UserEntity savedUser = userRepository.save(user);
            log.info("Updated user profile: id={}, email={}", savedUser.getId(), savedUser.getEmail());
            return savedUser;
        } else {
            log.debug("No changes to update for user: {}", user.getId());
            return user;
        }
    }
}

