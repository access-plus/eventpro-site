package com.accessplus.eventpro.api.controller;

import com.accessplus.eventpro.api.dto.ApiResponse;
import com.accessplus.eventpro.api.dto.PromoteUserRequest;
import com.accessplus.eventpro.api.dto.UpdateUserRequest;
import com.accessplus.eventpro.api.dto.UserResponse;
import com.accessplus.eventpro.shared.exception.ConflictException;
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

    /**
     * Creates a user entity from JWT token claims.
     * This is the preferred method as it doesn't require AWS credentials for Cognito Admin API.
     * 
     * <p>Note: Cognito access tokens (from USER_PASSWORD_AUTH flow) do NOT contain user attributes
     * like email, given_name, family_name. However, they DO contain the 'username' claim which
     * is the email used for login. This method uses username as email when email claim is missing.
     * 
     * @param cognitoUserId The Cognito user ID (sub claim)
     * @param username The username/email from JWT (used as email fallback if email claim is missing)
     * @return UserEntity created from JWT claims
     */
    private UserEntity createUserFromJwt(String cognitoUserId, String username) {
        // Extract claims from JWT token
        String email = JwtUtils.getClaim("email");
        String firstName = JwtUtils.getClaim("given_name");
        String lastName = JwtUtils.getClaim("family_name");
        String phoneNumber = JwtUtils.getClaim("phone_number");
        String role = JwtUtils.getClaim("custom:role");
        
        // Fallbacks for missing data
        if (email == null || email.isEmpty()) {
            email = username != null && !username.trim().isEmpty() ? username : cognitoUserId + "@eventpro.local";
            log.warn("Email not found in JWT token, using fallback: {}", email);
        }
        if (firstName == null || firstName.isEmpty()) {
            firstName = email.split("@")[0];
            log.debug("First name not found in JWT, using email prefix: {}", firstName);
        }
        if (lastName == null || lastName.isEmpty()) {
            lastName = "User";
            log.debug("Last name not found in JWT, using default: {}", lastName);
        }
        if (role == null || role.isEmpty()) {
            role = "USER";
            log.debug("Role not found in JWT, defaulting to USER");
        }
        
        return userService.createUserFromCognito(cognitoUserId, email, firstName, lastName, phoneNumber, role);
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user profile", description = "Returns the profile of the currently authenticated user. " +
                                                                   "Automatically syncs user from Cognito if not found in database.")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser() {
        log.debug("Getting current user profile");

        String cognitoUserId = JwtUtils.getCurrentUserCognitoId();
        // Extract username from JWT token (email when users sign up with email as username)
        // This method tries 'username' claim first, then falls back to 'email' claim
        String username = JwtUtils.getCurrentUserUsername();
        
        // Log all available claims for debugging
        try {
            log.debug("JWT token claims available: sub={}, username={}, email={}, token_use={}", 
                    cognitoUserId,
                    username,
                    JwtUtils.getClaim("email"),
                    JwtUtils.getClaim("token_use"));
        } catch (Exception e) {
            log.warn("Could not extract JWT claims for logging: {}", e.getMessage());
        }
        
        // Handle null username in JWT token
        if (username == null || username.trim().isEmpty()) {
            log.warn("Username and email claims are null in JWT, will use cognitoUserId as fallback: cognitoUserId={}", cognitoUserId);
            // Don't set username = cognitoUserId here - let CognitoAdminService handle the fallback logic
            // It will try both username and cognitoUserId in sequence
        }
        
        UserEntity user;
        try {
            user = userService.getUserByCognitoId(cognitoUserId);
        } catch (com.accessplus.eventpro.shared.exception.ResourceNotFoundException e) {
            // User doesn't exist in database, sync from JWT token claims or Cognito Admin API
            log.info("User not found in database, syncing from JWT token or Cognito: cognitoUserId={}, username={}", 
                    cognitoUserId, username);
            
            // Try to extract user info from JWT token claims first (no credentials needed)
            // Note: createUserFromJwt() handles all fallbacks gracefully, including when username is null.
            // It will use username as email if available, otherwise fallback to cognitoUserId + "@eventpro.local"
            // This avoids Admin API calls which require AWS credentials.
            log.debug("Using JWT token claims for user sync (username={}, cognitoUserId={})", username, cognitoUserId);
            try {
                user = createUserFromJwt(cognitoUserId, username);
                log.info("Successfully auto-synced user from JWT token: id={}, email={}, firstName={}, lastName={}, cognitoUserId={}", 
                        user.getId(), user.getEmail(), user.getFirstName(), user.getLastName(), user.getCognitoUserId());
            } catch (ConflictException conflictError) {
                // User already exists - fetch and return the existing user
                log.info("User already exists (likely created concurrently), fetching existing user: cognitoUserId={}, error={}", 
                        cognitoUserId, conflictError.getMessage());
                try {
                    user = userService.getUserByCognitoId(cognitoUserId);
                    log.info("Retrieved existing user: id={}, email={}, cognitoUserId={}", 
                            user.getId(), user.getEmail(), user.getCognitoUserId());
                } catch (Exception fetchError) {
                    log.error("Failed to fetch existing user after ConflictException: cognitoUserId={}", cognitoUserId, fetchError);
                    throw conflictError; // Re-throw the original conflict exception
                }
            } catch (Exception jwtError) {
                // If JWT-based creation fails, fallback to Cognito Admin API (requires AWS credentials)
                log.warn("Failed to create user from JWT token claims, falling back to Cognito Admin API. " +
                        "This requires valid AWS credentials. Error: {}, cognitoUserId={}, username={}", 
                        jwtError.getMessage(), cognitoUserId, username, jwtError);
                
                try {
                    Map<String, String> attributes = cognitoAdminService.getUserAttributes(username, cognitoUserId);
                    
                    log.debug("Retrieved attributes from Cognito Admin API: attributes={}", attributes.keySet());
                    
                    String email = attributes.get("email");
                    String firstName = attributes.get("given_name");
                    String lastName = attributes.get("family_name");
                    String phoneNumber = attributes.get("phone_number");
                    String role = attributes.get("custom:role");

                    // Validate email (required)
                    if (email == null || email.isEmpty()) {
                        log.error("Email is required but not found in Cognito user attributes. Available attributes: {}", attributes.keySet());
                        throw new ValidationException("Email is required but not found in Cognito user attributes");
                    }
                    
                    // Use fallbacks for firstName/lastName if missing
                    if (firstName == null || firstName.isEmpty()) {
                        firstName = email.split("@")[0];
                        log.info("First name not found in Cognito, using email prefix as fallback: firstName={}", firstName);
                    }
                    if (lastName == null || lastName.isEmpty()) {
                        lastName = "User";
                        log.info("Last name not found in Cognito, using default fallback: lastName={}", lastName);
                    }
                    
                    // Default role to USER if not found
                    if (role == null || role.isEmpty()) {
                        role = "USER";
                        log.info("Role not found in Cognito attributes, defaulting to USER");
                    }

                    // Create user in database
                    user = userService.createUserFromCognito(
                            cognitoUserId,
                            email,
                            firstName,
                            lastName,
                            phoneNumber,
                            role
                    );
                    
                    log.info("Successfully auto-synced user from Cognito Admin API: id={}, email={}, firstName={}, lastName={}, cognitoUserId={}", 
                            user.getId(), user.getEmail(), user.getFirstName(), user.getLastName(), user.getCognitoUserId());
                } catch (Exception adminApiError) {
                    log.error("Failed to fetch user attributes from Cognito Admin API (credentials may be invalid): {}. " +
                            "JWT-based user creation also failed. Cannot sync user.", adminApiError.getMessage(), adminApiError);
                    throw new ValidationException("Cannot sync user: JWT-based creation failed and Cognito Admin API unavailable. " +
                            "Error: " + adminApiError.getMessage());
                }
            }
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
        // Extract username from JWT token (email when users sign up with email as username)
        // This method tries 'username' claim first, then falls back to 'email' claim
        String username = JwtUtils.getCurrentUserUsername();
        
        // Log all available claims for debugging
        try {
            log.debug("JWT token claims available: sub={}, username={}, email={}, token_use={}", 
                    cognitoUserId,
                    username,
                    JwtUtils.getClaim("email"),
                    JwtUtils.getClaim("token_use"));
        } catch (Exception e) {
            log.warn("Could not extract JWT claims for logging: {}", e.getMessage());
        }
        
        // Handle null username in JWT token
        if (username == null || username.trim().isEmpty()) {
            log.warn("Username and email claims are null in JWT, will use cognitoUserId as fallback: cognitoUserId={}", cognitoUserId);
            // Don't set username = cognitoUserId here - let CognitoAdminService handle the fallback logic
            // It will try both username and cognitoUserId in sequence
        }
        
        log.info("Syncing user: cognitoUserId={}, username={}", cognitoUserId, username);
        
        // Check if user already exists
        try {
            UserEntity existingUser = userService.getUserByCognitoId(cognitoUserId);
            log.debug("User already exists in database: cognitoUserId={}", cognitoUserId);
            UserResponse response = UserResponse.fromEntity(existingUser);
            return ResponseEntity.ok(ApiResponse.success(response, "User already synced"));
        } catch (com.accessplus.eventpro.shared.exception.ResourceNotFoundException e) {
            // User doesn't exist, proceed with sync
            log.debug("User not found in database, syncing from JWT token or Cognito: cognitoUserId={}, username={}", 
                    cognitoUserId, username);
        }

        // Try to extract user info from JWT token claims first (no credentials needed)
        // Note: createUserFromJwt() handles all fallbacks gracefully, including when username is null.
        // It will use username as email if available, otherwise fallback to cognitoUserId + "@eventpro.local"
        // This avoids Admin API calls which require AWS credentials.
        UserEntity user;
        log.debug("Using JWT token claims for user sync (username={}, cognitoUserId={})", username, cognitoUserId);
        try {
            user = createUserFromJwt(cognitoUserId, username);
            log.info("Successfully synced user from JWT token: id={}, email={}, firstName={}, lastName={}, cognitoUserId={}", 
                    user.getId(), user.getEmail(), user.getFirstName(), user.getLastName(), user.getCognitoUserId());
        } catch (ConflictException conflictError) {
            // User already exists - fetch and return the existing user
            log.info("User already exists (likely created concurrently), fetching existing user: cognitoUserId={}, error={}", 
                    cognitoUserId, conflictError.getMessage());
            try {
                user = userService.getUserByCognitoId(cognitoUserId);
                log.info("Retrieved existing user: id={}, email={}, cognitoUserId={}", 
                        user.getId(), user.getEmail(), user.getCognitoUserId());
            } catch (Exception fetchError) {
                log.error("Failed to fetch existing user after ConflictException: cognitoUserId={}", cognitoUserId, fetchError);
                throw conflictError; // Re-throw the original conflict exception
            }
        } catch (Exception jwtError) {
            // If JWT-based creation fails, fallback to Cognito Admin API (requires AWS credentials)
            log.warn("Failed to create user from JWT token claims, falling back to Cognito Admin API. " +
                    "This requires valid AWS credentials. Error: {}, cognitoUserId={}, username={}", 
                    jwtError.getMessage(), cognitoUserId, username, jwtError);
            
            try {
                Map<String, String> attributes = cognitoAdminService.getUserAttributes(username, cognitoUserId);
                
                log.debug("Retrieved attributes from Cognito Admin API: attributes={}", attributes.keySet());
                
                String email = attributes.get("email");
                String firstName = attributes.get("given_name");
                String lastName = attributes.get("family_name");
                String phoneNumber = attributes.get("phone_number");
                String role = attributes.get("custom:role");

                // Validate email (required)
                if (email == null || email.isEmpty()) {
                    log.error("Email is required but not found in Cognito user attributes. Available attributes: {}", attributes.keySet());
                    throw new ValidationException("Email is required but not found in Cognito user attributes");
                }
                
                // Use fallbacks for firstName/lastName if missing
                if (firstName == null || firstName.isEmpty()) {
                    firstName = email.split("@")[0];
                    log.info("First name not found in Cognito, using email prefix as fallback: firstName={}", firstName);
                }
                if (lastName == null || lastName.isEmpty()) {
                    lastName = "User";
                    log.info("Last name not found in Cognito, using default fallback: lastName={}", lastName);
                }
                
                // Default role to USER if not found
                if (role == null || role.isEmpty()) {
                    role = "USER";
                    log.info("Role not found in Cognito attributes, defaulting to USER");
                }

                // Create user in database
                user = userService.createUserFromCognito(
                        cognitoUserId,
                        email,
                        firstName,
                        lastName,
                        phoneNumber,
                        role
                );
                
                log.info("Successfully synced user from Cognito Admin API: id={}, email={}, firstName={}, lastName={}, cognitoUserId={}", 
                        user.getId(), user.getEmail(), user.getFirstName(), user.getLastName(), user.getCognitoUserId());
            } catch (Exception adminApiError) {
                log.error("Failed to fetch user attributes from Cognito Admin API (credentials may be invalid): {}. " +
                        "JWT-based user creation also failed. Cannot sync user.", adminApiError.getMessage(), adminApiError);
                throw new ValidationException("Cannot sync user: JWT-based creation failed and Cognito Admin API unavailable. " +
                        "Error: " + adminApiError.getMessage());
            }
        }

        UserResponse response = UserResponse.fromEntity(user);
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

