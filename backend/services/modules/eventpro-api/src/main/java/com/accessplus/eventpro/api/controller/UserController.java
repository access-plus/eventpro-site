package com.accessplus.eventpro.api.controller;

import com.accessplus.eventpro.api.dto.ApiResponse;
import com.accessplus.eventpro.api.dto.PromoteUserRequest;
import com.accessplus.eventpro.api.dto.UpdateUserRequest;
import com.accessplus.eventpro.api.dto.UserResponse;
import com.accessplus.eventpro.shared.exception.ValidationException;
import com.accessplus.eventpro.core.security.JwtUtils;
import com.accessplus.eventpro.core.user.entity.UserEntity;
import com.accessplus.eventpro.core.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.accessplus.eventpro.event.service.AWSS3ImageService;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller for user management operations.
 * 
 * <p>Endpoints:
 * <ul>
 *   <li>GET /api/v1/users/me - Get current user profile</li>
 *   <li>PUT /api/v1/users/me - Update current user profile</li>
     *   <li>POST /api/v1/users/upload-profile-picture - Upload profile picture</li>
 *   <li>GET /api/v1/users/{id} - Get user by ID (admin only)</li>
 *   <li>GET /api/v1/users - Get all users with pagination (admin only)</li>
 *   <li>POST /api/v1/admin/users/{userId}/promote - Promote user to ORGANIZER (admin only)</li>
 * </ul>
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User management API")
@SecurityRequirement(name = "bearerAuth")
public class UserController extends BaseController {

    private final UserService userService;
    private final com.accessplus.eventpro.core.user.service.CognitoAdminServiceInterface cognitoAdminService;
    private final AWSS3ImageService imageService;

    @GetMapping("/me")
    @Operation(summary = "Get current user profile", description = "Returns the profile of the currently authenticated user. " +
                                                                   "Automatically syncs user from Cognito if not found in database.")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser() {
        log.debug("Getting current user profile");

        String cognitoUserId = JwtUtils.getCurrentUserCognitoId();
        
        UserEntity user;
        try {
            user = userService.getUserByCognitoId(cognitoUserId);
        } catch (com.accessplus.eventpro.shared.exception.ResourceNotFoundException e) {
            // User doesn't exist in database, sync from Cognito
            log.info("User not found in database, syncing from Cognito: cognitoUserId={}", cognitoUserId);
            
            // Fetch user attributes from Cognito using Admin API
            // Access tokens don't contain user attributes, so we need to fetch them from Cognito
            Map<String, String> attributes = cognitoAdminService.getUserAttributes(cognitoUserId);
            
            String email = attributes.get("email");
            String firstName = attributes.get("given_name");
            String lastName = attributes.get("family_name");
            String phoneNumber = attributes.get("phone_number");

            // Validate required fields
            if (email == null || email.isEmpty()) {
                throw new ValidationException("Email is required but not found in Cognito user attributes");
            }
            if (firstName == null || firstName.isEmpty()) {
                throw new ValidationException("First name is required but not found in Cognito user attributes");
            }
            if (lastName == null || lastName.isEmpty()) {
                throw new ValidationException("Last name is required but not found in Cognito user attributes");
            }

            // Create user in database
            user = userService.createUserFromCognito(
                    cognitoUserId,
                    email,
                    firstName,
                    lastName,
                    phoneNumber
            );
            
            log.info("Successfully auto-synced user from Cognito: id={}, email={}, cognitoUserId={}", 
                    user.getId(), user.getEmail(), user.getCognitoUserId());
        }
        
        UserResponse response = UserResponse.fromEntity(user);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/me")
    @Operation(summary = "Update current user profile", description = "Updates the profile of the currently authenticated user")
    public ResponseEntity<ApiResponse<UserResponse>> updateCurrentUser(
            @Valid @RequestBody UpdateUserRequest request) {
        log.debug("Updating current user profile");

        String cognitoUserId = JwtUtils.getCurrentUserCognitoId();
        UserEntity updatedUser = userService.updateUserProfile(
                cognitoUserId,
                request.getFirstName(),
                request.getLastName(),
                request.getPhoneNumber(),
                request.getBio(),
                request.getLocation(),
                null // profilePictureUrl is updated via separate endpoint
        );
        UserResponse response = UserResponse.fromEntity(updatedUser);

        return ResponseEntity.ok(ApiResponse.success(response, "Profile updated successfully"));
    }

    @PostMapping("/upload-profile-picture")
    @Operation(summary = "Upload profile picture", description = "Uploads a profile picture for the current user")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadProfilePicture(
            @RequestParam("image") MultipartFile imageFile) {
        log.debug("Uploading profile picture");

        String cognitoUserId = JwtUtils.getCurrentUserCognitoId();
        UserEntity user = userService.getUserByCognitoId(cognitoUserId);

        try {
            // Validate image
            imageService.validateImage(imageFile);

            // Generate S3 key: profile-pictures/{userId}/{filename}
            String imageKey = String.format("profile-pictures/%s/%s",
                    user.getId(),
                    imageFile.getOriginalFilename() != null ?
                            imageFile.getOriginalFilename() : "profile.jpg");

            // Upload image to S3
            String imageUrl = imageService.uploadImage(imageFile, imageKey);

            // Update user's profile picture URL
            userService.updateUserProfile(
                    cognitoUserId,
                    null, null, null, // firstName, lastName, phoneNumber
                    null, null, imageUrl // bio, location, profilePictureUrl
            );

            Map<String, String> response = new HashMap<>();
            response.put("url", imageUrl);

            log.info("Profile picture uploaded successfully: userId={}, url={}", user.getId(), imageUrl);
            return ResponseEntity.ok(ApiResponse.success(response, "Profile picture uploaded successfully"));

        } catch (IOException e) {
            log.error("Failed to upload profile picture: {}", e.getMessage(), e);
            throw new ValidationException("Failed to upload profile picture: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get user by ID", description = "Returns user profile by ID (admin only)")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable UUID id) {
        log.debug("Getting user by ID: {}", id);

        UserEntity user = userService.getUserById(id);
        UserResponse response = UserResponse.fromEntity(user);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all users", description = "Returns paginated list of all users (admin only)")
    public ResponseEntity<ApiResponse<Page<UserResponse>>> getAllUsers(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(defaultValue = "email") String sortBy,
            @RequestParam(defaultValue = "asc") String dir) {
        log.debug("Getting all users: page={}, size={}, sortBy={}, dir={}", page, size, sortBy, dir);

        // Convert page from 1-based to 0-based
        int pageIndex = page > 0 ? page - 1 : 0;
        
        // Validate sort direction
        Sort.Direction direction = "desc".equalsIgnoreCase(dir) 
                ? Sort.Direction.DESC 
                : Sort.Direction.ASC;
        
        // Create pageable with sorting
        Pageable pageable = PageRequest.of(pageIndex, size, Sort.by(direction, sortBy));
        
        Page<UserEntity> userPage = userService.getAllUsers(pageable);
        Page<UserResponse> responsePage = userPage.map(UserResponse::fromEntity);

        return ResponseEntity.ok(ApiResponse.success(responsePage));
    }

    @PostMapping("/sync")
    @Operation(summary = "Sync user from Cognito", 
               description = "Syncs the current authenticated user from Cognito to the application database. " +
                             "This endpoint should be called after user signup to create the user record in the database.")
    public ResponseEntity<ApiResponse<UserResponse>> syncUser() {
        log.info("Syncing user from Cognito to database");

            String cognitoUserId = JwtUtils.getCurrentUserCognitoId();
            
            // Check if user already exists
            try {
                UserEntity existingUser = userService.getUserByCognitoId(cognitoUserId);
            log.debug("User already exists in database: cognitoUserId={}", cognitoUserId);
                UserResponse response = UserResponse.fromEntity(existingUser);
                return ResponseEntity.ok(ApiResponse.success(response, "User already synced"));
            } catch (com.accessplus.eventpro.shared.exception.ResourceNotFoundException e) {
                // User doesn't exist, proceed with sync
                log.debug("User not found in database, syncing from Cognito: cognitoUserId={}", cognitoUserId);
            }

            // Fetch user attributes from Cognito using Admin API
            // Access tokens don't contain user attributes, so we need to fetch them from Cognito
            Map<String, String> attributes = cognitoAdminService.getUserAttributes(cognitoUserId);
            
            String email = attributes.get("email");
            String firstName = attributes.get("given_name");
            String lastName = attributes.get("family_name");
            String phoneNumber = attributes.get("phone_number");

            // Validate required fields
            if (email == null || email.isEmpty()) {
                throw new ValidationException("Email is required but not found in Cognito user attributes");
            }
            if (firstName == null || firstName.isEmpty()) {
                throw new ValidationException("First name is required but not found in Cognito user attributes");
            }
            if (lastName == null || lastName.isEmpty()) {
                throw new ValidationException("Last name is required but not found in Cognito user attributes");
            }

            // Create user in database
            UserEntity user = userService.createUserFromCognito(
                    cognitoUserId,
                    email,
                    firstName,
                    lastName,
                    phoneNumber
            );

            UserResponse response = UserResponse.fromEntity(user);
            log.info("Successfully synced user from Cognito: id={}, email={}, cognitoUserId={}", 
                    user.getId(), user.getEmail(), user.getCognitoUserId());

            return ResponseEntity.ok(ApiResponse.success(response, "User synced successfully"));
    }

    @PostMapping("/admin/users/{userId}/promote")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Promote user to ORGANIZER", 
               description = "Promotes a user to ORGANIZER role. Users can only be promoted to ORGANIZER. ADMIN role can only be assigned via infrastructure.")
    public ResponseEntity<ApiResponse<String>> promoteUser(
            @PathVariable UUID userId,
            @Valid @RequestBody PromoteUserRequest request) {
        log.debug("Promoting user: userId={}, targetRole={}", userId, request.getTargetRole());

        // Validate that target role is ORGANIZER only
        if (!"ORGANIZER".equalsIgnoreCase(request.getTargetRole())) {
            throw new ValidationException("Users can only be promoted to ORGANIZER role. ADMIN role can only be assigned via infrastructure.");
        }

        // Get user to find their Cognito ID
        UserEntity user = userService.getUserById(userId);
        
        // Promote user in Cognito
        cognitoAdminService.promoteUserToOrganizer(user.getCognitoUserId());

        return ResponseEntity.ok(ApiResponse.success("User promoted to ORGANIZER role successfully"));
    }
}

