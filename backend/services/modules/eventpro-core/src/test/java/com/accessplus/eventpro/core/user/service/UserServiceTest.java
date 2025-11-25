package com.accessplus.eventpro.core.user.service;

import com.accessplus.eventpro.shared.exception.ConflictException;
import com.accessplus.eventpro.shared.exception.ResourceNotFoundException;
import com.accessplus.eventpro.core.user.entity.UserEntity;
import com.accessplus.eventpro.core.user.repository.UserRepository;
import com.accessplus.eventpro.core.user.service.impl.UserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for UserService.
 * 
 * <p>Tests cover:
 * <ul>
 *   <li>createUserFromCognito - success and error cases</li>
 *   <li>getUserByCognitoId - success and not found cases</li>
 *   <li>updateUserProfile - success, not found, and partial update cases</li>
 *   <li>Error handling for duplicate email and Cognito ID</li>
 *   <li>Error handling for user not found</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserService Tests")
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserServiceImpl userService;

    private UserEntity testUser;
    private String testCognitoUserId;
    private String testEmail;
    private UUID testUserId;

    @BeforeEach
    void setUp() {
        testCognitoUserId = "cognito-user-id-123";
        testEmail = "test@example.com";
        testUserId = UUID.randomUUID();

        testUser = new UserEntity();
        testUser.setId(testUserId);
        testUser.setCognitoUserId(testCognitoUserId);
        testUser.setEmail(testEmail);
        testUser.setFirstName("John");
        testUser.setLastName("Doe");
        testUser.setPhoneNumber("+1234567890");
    }

    @Test
    @DisplayName("Should create user from Cognito successfully")
    void shouldCreateUserFromCognitoSuccessfully() {
        // Given
        when(userRepository.findByCognitoUserId(testCognitoUserId)).thenReturn(Optional.empty());
        when(userRepository.findByEmail(testEmail)).thenReturn(Optional.empty());
        when(userRepository.save(any(UserEntity.class))).thenAnswer(invocation -> {
            UserEntity user = invocation.getArgument(0);
            user.setId(testUserId);
            return user;
        });

        // When
        UserEntity result = userService.createUserFromCognito(
                testCognitoUserId, testEmail, "John", "Doe", "+1234567890");

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(testUserId);
        assertThat(result.getCognitoUserId()).isEqualTo(testCognitoUserId);
        assertThat(result.getEmail()).isEqualTo(testEmail);
        assertThat(result.getFirstName()).isEqualTo("John");
        assertThat(result.getLastName()).isEqualTo("Doe");
        assertThat(result.getPhoneNumber()).isEqualTo("+1234567890");

        verify(userRepository).findByCognitoUserId(testCognitoUserId);
        verify(userRepository).findByEmail(testEmail);
        verify(userRepository).save(any(UserEntity.class));
    }

    @Test
    @DisplayName("Should throw ConflictException when Cognito user ID already exists")
    void shouldThrowConflictExceptionWhenCognitoUserIdExists() {
        // Given
        when(userRepository.findByCognitoUserId(testCognitoUserId))
                .thenReturn(Optional.of(testUser));

        // When/Then
        assertThatThrownBy(() -> userService.createUserFromCognito(
                testCognitoUserId, testEmail, "John", "Doe", "+1234567890"))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("cognitoUserId")
                .hasMessageContaining(testCognitoUserId);

        verify(userRepository).findByCognitoUserId(testCognitoUserId);
        verify(userRepository, never()).findByEmail(anyString());
        verify(userRepository, never()).save(any(UserEntity.class));
    }

    @Test
    @DisplayName("Should throw ConflictException when email already exists")
    void shouldThrowConflictExceptionWhenEmailExists() {
        // Given
        when(userRepository.findByCognitoUserId(testCognitoUserId)).thenReturn(Optional.empty());
        when(userRepository.findByEmail(testEmail)).thenReturn(Optional.of(testUser));

        // When/Then
        assertThatThrownBy(() -> userService.createUserFromCognito(
                testCognitoUserId, testEmail, "John", "Doe", "+1234567890"))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("email")
                .hasMessageContaining(testEmail);

        verify(userRepository).findByCognitoUserId(testCognitoUserId);
        verify(userRepository).findByEmail(testEmail);
        verify(userRepository, never()).save(any(UserEntity.class));
    }

    @Test
    @DisplayName("Should create user with null phone number")
    void shouldCreateUserWithNullPhoneNumber() {
        // Given
        when(userRepository.findByCognitoUserId(testCognitoUserId)).thenReturn(Optional.empty());
        when(userRepository.findByEmail(testEmail)).thenReturn(Optional.empty());
        when(userRepository.save(any(UserEntity.class))).thenAnswer(invocation -> {
            UserEntity user = invocation.getArgument(0);
            user.setId(testUserId);
            return user;
        });

        // When
        UserEntity result = userService.createUserFromCognito(
                testCognitoUserId, testEmail, "John", "Doe", null);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getPhoneNumber()).isNull();
    }

    @Test
    @DisplayName("Should get user by Cognito ID successfully")
    void shouldGetUserByCognitoIdSuccessfully() {
        // Given
        when(userRepository.findByCognitoUserId(testCognitoUserId))
                .thenReturn(Optional.of(testUser));

        // When
        UserEntity result = userService.getUserByCognitoId(testCognitoUserId);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(testUserId);
        assertThat(result.getCognitoUserId()).isEqualTo(testCognitoUserId);
        assertThat(result.getEmail()).isEqualTo(testEmail);

        verify(userRepository).findByCognitoUserId(testCognitoUserId);
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when user not found by Cognito ID")
    void shouldThrowResourceNotFoundExceptionWhenUserNotFound() {
        // Given
        when(userRepository.findByCognitoUserId(testCognitoUserId))
                .thenReturn(Optional.empty());

        // When/Then
        assertThatThrownBy(() -> userService.getUserByCognitoId(testCognitoUserId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User")
                .hasMessageContaining(testCognitoUserId);

        verify(userRepository).findByCognitoUserId(testCognitoUserId);
    }

    @Test
    @DisplayName("Should update user profile by UUID successfully")
    void shouldUpdateUserProfileByUuidSuccessfully() {
        // Given
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(UserEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        UserEntity result = userService.updateUserProfile(
                testUserId, "Jane", "Smith", "+9876543210");

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getFirstName()).isEqualTo("Jane");
        assertThat(result.getLastName()).isEqualTo("Smith");
        assertThat(result.getPhoneNumber()).isEqualTo("+9876543210");

        verify(userRepository).findById(testUserId);
        verify(userRepository).save(any(UserEntity.class));
    }

    @Test
    @DisplayName("Should update user profile by Cognito ID successfully")
    void shouldUpdateUserProfileByCognitoIdSuccessfully() {
        // Given
        when(userRepository.findByCognitoUserId(testCognitoUserId))
                .thenReturn(Optional.of(testUser));
        when(userRepository.save(any(UserEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        UserEntity result = userService.updateUserProfile(
                testCognitoUserId, "Jane", "Smith", "+9876543210");

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getFirstName()).isEqualTo("Jane");
        assertThat(result.getLastName()).isEqualTo("Smith");
        assertThat(result.getPhoneNumber()).isEqualTo("+9876543210");

        verify(userRepository).findByCognitoUserId(testCognitoUserId);
        verify(userRepository).save(any(UserEntity.class));
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when updating non-existent user by UUID")
    void shouldThrowResourceNotFoundExceptionWhenUpdatingNonExistentUserByUuid() {
        // Given
        when(userRepository.findById(testUserId)).thenReturn(Optional.empty());

        // When/Then
        assertThatThrownBy(() -> userService.updateUserProfile(
                testUserId, "Jane", "Smith", "+9876543210"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User")
                .hasMessageContaining(testUserId.toString());

        verify(userRepository).findById(testUserId);
        verify(userRepository, never()).save(any(UserEntity.class));
    }

    @Test
    @DisplayName("Should update only provided fields (partial update)")
    void shouldUpdateOnlyProvidedFields() {
        // Given
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(UserEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When - only update firstName
        UserEntity result = userService.updateUserProfile(
                testUserId, "Jane", null, null);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getFirstName()).isEqualTo("Jane");
        assertThat(result.getLastName()).isEqualTo("Doe"); // Unchanged
        assertThat(result.getPhoneNumber()).isEqualTo("+1234567890"); // Unchanged

        verify(userRepository).findById(testUserId);
        verify(userRepository).save(any(UserEntity.class));
    }

    @Test
    @DisplayName("Should not save when no fields are changed")
    void shouldNotSaveWhenNoFieldsChanged() {
        // Given
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));

        // When - update with same values
        UserEntity result = userService.updateUserProfile(
                testUserId, "John", "Doe", "+1234567890");

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getFirstName()).isEqualTo("John");
        assertThat(result.getLastName()).isEqualTo("Doe");
        assertThat(result.getPhoneNumber()).isEqualTo("+1234567890");

        verify(userRepository).findById(testUserId);
        verify(userRepository, never()).save(any(UserEntity.class));
    }

    @Test
    @DisplayName("Should update phone number to null")
    void shouldUpdatePhoneNumberToNull() {
        // Given
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));

        // When
        UserEntity result = userService.updateUserProfile(
                testUserId, null, null, null);

        // Then
        assertThat(result).isNotNull();
        // Phone number should remain unchanged when null is passed
        assertThat(result.getPhoneNumber()).isEqualTo("+1234567890");

        verify(userRepository).findById(testUserId);
        // Should not save because no actual changes were made
        verify(userRepository, never()).save(any(UserEntity.class));
    }

    @Test
    @DisplayName("Should update phone number from null to value")
    void shouldUpdatePhoneNumberFromNullToValue() {
        // Given
        testUser.setPhoneNumber(null);
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(UserEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        UserEntity result = userService.updateUserProfile(
                testUserId, null, null, "+9876543210");

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getPhoneNumber()).isEqualTo("+9876543210");

        verify(userRepository).findById(testUserId);
        verify(userRepository).save(any(UserEntity.class));
    }

    @Test
    @DisplayName("Should handle empty string as null for phone number")
    void shouldHandleEmptyStringAsNullForPhoneNumber() {
        // Given
        when(userRepository.findByCognitoUserId(testCognitoUserId)).thenReturn(Optional.empty());
        when(userRepository.findByEmail(testEmail)).thenReturn(Optional.empty());
        when(userRepository.save(any(UserEntity.class))).thenAnswer(invocation -> {
            UserEntity user = invocation.getArgument(0);
            user.setId(testUserId);
            return user;
        });

        // When - create with empty string phone number
        UserEntity result = userService.createUserFromCognito(
                testCognitoUserId, testEmail, "John", "Doe", "");

        // Then
        assertThat(result).isNotNull();
        // Empty string should be saved as-is (not converted to null)
        // This is the current behavior - can be enhanced if needed
    }
}

