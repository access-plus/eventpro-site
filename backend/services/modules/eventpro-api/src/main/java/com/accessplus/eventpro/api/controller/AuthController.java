package com.accessplus.eventpro.api.controller;

import com.accessplus.eventpro.api.dto.ApiResponse;
import com.accessplus.eventpro.api.dto.SendResetEmailRequest;
import com.accessplus.eventpro.core.email.service.EmailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for authentication-related operations.
 * 
 * <p>Endpoints:
 * <ul>
 *   <li>POST /api/v1/auth/send-reset-email - Send password reset confirmation email</li>
 * </ul>
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Authentication API")
public class AuthController extends BaseController {

    private final EmailService emailService;

    /**
     * Sends a password reset confirmation email.
     * 
     * @param request SendResetEmailRequest with email and code
     * @return 200 OK
     */
    @PostMapping("/send-reset-email")
    @Operation(summary = "Send password reset confirmation email", 
               description = "Sends a confirmation email after password reset with the verification code.")
    public ResponseEntity<ApiResponse<Void>> sendResetEmail(
            @Valid @RequestBody SendResetEmailRequest request) {
        log.debug("Sending password reset confirmation email to: {}", request.getEmail());

        try {
            emailService.sendPasswordResetConfirmation(request.getEmail(), request.getCode());
            return ResponseEntity.ok(ApiResponse.success(null, "Password reset confirmation email sent successfully"));
        } catch (Exception e) {
            log.error("Failed to send password reset confirmation email: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.success(null, "Email sending attempted (may have failed silently)"));
        }
    }
}

