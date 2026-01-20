package com.accessplus.eventpro.api.controller;

import com.accessplus.eventpro.api.dto.ApiResponse;
import com.accessplus.eventpro.api.dto.ConfirmPaymentRequest;
import com.accessplus.eventpro.api.dto.CreatePaymentIntentRequest;
import com.accessplus.eventpro.api.dto.OrderResponse;
import com.accessplus.eventpro.core.security.JwtUtils;
import com.accessplus.eventpro.payment.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller for payment operations.
 * 
 * <p>Endpoints:
 * <ul>
 *   <li>POST /api/v1/payments/create-intent - Create Stripe payment intent</li>
 *   <li>POST /api/v1/payments/confirm - Confirm payment and create order</li>
 * </ul>
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Payment processing API")
@SecurityRequirement(name = "bearerAuth")
public class PaymentController extends BaseController {

    private final PaymentService paymentService;

    /**
     * Creates a Stripe payment intent.
     * 
     * @param request CreatePaymentIntentRequest with amount
     * @return Payment intent client secret
     */
    @PostMapping("/create-intent")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'ORGANIZER')")
    @Operation(summary = "Create payment intent", description = "Creates a Stripe payment intent for the specified amount. " +
            "Requires USER, ADMIN, or ORGANIZER role.")
    public ResponseEntity<ApiResponse<Map<String, String>>> createPaymentIntent(
            @Valid @RequestBody CreatePaymentIntentRequest request) {
        log.debug("Creating payment intent for amount: {}", request.getAmount());

        try {
            String clientSecret = paymentService.createPaymentIntent(request.getAmount());
            
            Map<String, String> response = new HashMap<>();
            response.put("clientSecret", clientSecret);
            
            return ResponseEntity.ok(ApiResponse.success(response, "Payment intent created successfully"));
        } catch (Exception e) {
            log.error("Failed to create payment intent: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to create payment intent: " + e.getMessage()));
        }
    }

    /**
     * Confirms a payment and creates an order from the user's cart.
     * 
     * @param request ConfirmPaymentRequest with payment intent ID
     * @return Created order
     */
    @PostMapping("/confirm")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'ORGANIZER')")
    @Operation(summary = "Confirm payment", description = "Confirms a Stripe payment and creates an order from the user's cart. " +
            "Requires USER, ADMIN, or ORGANIZER role.")
    public ResponseEntity<ApiResponse<OrderResponse>> confirmPayment(
            @Valid @RequestBody ConfirmPaymentRequest request) {
        log.debug("Confirming payment: paymentIntentId={}", request.getPaymentIntentId());

        try {
            // Get current user's UUID from JWT
            UUID userId = JwtUtils.getCurrentUserId();

            // Process payment and create order
            var order = paymentService.processPayment(userId, request.getPaymentIntentId());
            OrderResponse response = OrderResponse.fromEntity(order);

            return ResponseEntity.ok(ApiResponse.success(response, "Payment confirmed and order created successfully"));
        } catch (Exception e) {
            log.error("Failed to confirm payment: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to confirm payment: " + e.getMessage()));
        }
    }
}
