package com.accessplus.eventpro.api.controller;

import com.accessplus.eventpro.api.dto.ApiResponse;
import com.accessplus.eventpro.api.dto.PromoteUserRequest;
import com.accessplus.eventpro.api.dto.UpdateUserRequest;
import com.accessplus.eventpro.api.dto.UserResponse;
import com.accessplus.eventpro.core.security.JwtUtils;
import com.accessplus.eventpro.core.user.entity.UserEntity;
import com.accessplus.eventpro.core.user.service.UserService;
import com.accessplus.eventpro.event.service.AWSS3ImageService;
import com.accessplus.eventpro.shared.exception.ValidationException;
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

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User management API")
@SecurityRequirement(name = "bearerAuth")
public class UserController extends BaseController {

    private final UserService userService;
    private final AWSS3ImageService imageService;

    @GetMapping("/me")
    @Operation(summary = "Get current user profile", description = "Returns the profile of the currently authenticated user.")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser() {
        log.debug("Getting current user profile");

        UUID userId = JwtUtils.getCurrentUserId();
        UserEntity user = userService.getUserById(userId);
        UserResponse response = UserResponse.fromEntity(user);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/me")
    @Operation(summary = "Update current user profile", description = "Updates the profile of the currently authenticated user")
    public ResponseEntity<ApiResponse<UserResponse>> updateCurrentUser(
            @Valid @RequestBody UpdateUserRequest request) {
        log.debug("Updating current user profile");

        UUID userId = JwtUtils.getCurrentUserId();
        UserEntity updatedUser = userService.updateUserProfile(
                userId,
                request.getFirstName(),
                request.getLastName(),
                request.getPhoneNumber(),
                request.getBio(),
                request.getLocation(),
                null, // profilePictureUrl is updated via separate endpoint
                request.getCulturalNiche()
        );
        UserResponse response = UserResponse.fromEntity(updatedUser);

        return ResponseEntity.ok(ApiResponse.success(response, "Profile updated successfully"));
    }

    @PostMapping("/upload-profile-picture")
    @Operation(summary = "Upload profile picture", description = "Uploads a profile picture for the current user")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadProfilePicture(
            @RequestParam("image") MultipartFile imageFile) {
        log.debug("Uploading profile picture");

        UUID userId = JwtUtils.getCurrentUserId();
        UserEntity user = userService.getUserById(userId);

        try {
            imageService.validateImage(imageFile);

            String imageKey = String.format("profile-pictures/%s/%s",
                    user.getId(),
                    imageFile.getOriginalFilename() != null ?
                            imageFile.getOriginalFilename() : "profile.jpg");

            String imageUrl = imageService.uploadImage(imageFile, imageKey);

            userService.updateUserProfile(
                    userId,
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

        int pageIndex = page > 0 ? page - 1 : 0;
        Sort.Direction direction = "desc".equalsIgnoreCase(dir)
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(pageIndex, size, Sort.by(direction, sortBy));

        Page<UserEntity> userPage = userService.getAllUsers(pageable);
        Page<UserResponse> responsePage = userPage.map(UserResponse::fromEntity);

        return ResponseEntity.ok(ApiResponse.success(responsePage));
    }

    @PostMapping("/admin/users/{userId}/promote")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Promote user to ORGANIZER",
               description = "Promotes a user to ORGANIZER role. Users can only be promoted to ORGANIZER.")
    public ResponseEntity<ApiResponse<String>> promoteUser(
            @PathVariable UUID userId,
            @Valid @RequestBody PromoteUserRequest request) {
        log.debug("Promoting user: userId={}, targetRole={}", userId, request.getTargetRole());

        if (!"ORGANIZER".equalsIgnoreCase(request.getTargetRole())) {
            throw new ValidationException("Users can only be promoted to ORGANIZER role.");
        }

        userService.updateUserRole(userId, "ORGANIZER");

        return ResponseEntity.ok(ApiResponse.success("User promoted to ORGANIZER role successfully"));
    }
}
