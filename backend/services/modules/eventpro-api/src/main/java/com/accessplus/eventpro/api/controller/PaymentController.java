package com.accessplus.eventpro.api.controller;

import com.accessplus.eventpro.api.dto.ApiResponse;
import com.accessplus.eventpro.api.dto.ConfirmPaymentRequest;
import com.accessplus.eventpro.api.dto.CreatePaymentIntentRequest;
import com.accessplus.eventpro.api.dto.GuestConfirmPaymentRequest;
import com.accessplus.eventpro.api.dto.GuestOrderItemRequest;
import com.accessplus.eventpro.api.dto.GuestReserveRequest;
import com.accessplus.eventpro.api.dto.OrderResponse;
import com.accessplus.eventpro.core.security.JwtUtils;
import com.accessplus.eventpro.order.order.model.GuestOrderItem;
import com.accessplus.eventpro.order.order.service.OrderService;
import com.accessplus.eventpro.payment.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Payment processing API")
public class PaymentController extends BaseController {

    @Value("${eventpro.ticket.reservation-expiry-minutes:15}")
    private int reservationExpiryMinutes;

    @Value("${stripe.publishableKey:}")
    private String stripePublishableKey;

    private final PaymentService paymentService;
    private final OrderService orderService;

    @GetMapping("/config")
    @Operation(summary = "Payment config (public)", description = "Returns Stripe publishable key for the frontend card form. No auth required.")
    public ResponseEntity<ApiResponse<Map<String, String>>> getPaymentConfig() {
        Map<String, String> config = new HashMap<>();
        String key = stripePublishableKey != null ? stripePublishableKey.trim() : "";
        config.put("stripePublishableKey", key);
        return ResponseEntity.ok(ApiResponse.success(config, null));
    }

    @PostMapping("/create-intent")
    @Operation(summary = "Create payment intent", description = "Creates a Stripe payment intent for the specified amount. Available to all (guest and authenticated).")
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
            String message = e.getMessage() != null ? e.getMessage() : "";
            if (message.contains("Invalid API Key") || message.contains("sk_test_*") || message.contains("sk_test_local")) {
                message = "Payment is not configured. Set STRIPE_SECRET_KEY in your .env with a Stripe test key from https://dashboard.stripe.com/test/apikeys";
            } else {
                message = "Failed to create payment intent: " + message;
            }
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(message));
        }
    }

    @PostMapping("/confirm")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'ORGANIZER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Confirm payment (authenticated)", description = "Confirms a Stripe payment and creates an order from the user's cart.")
    public ResponseEntity<ApiResponse<OrderResponse>> confirmPayment(
            @Valid @RequestBody ConfirmPaymentRequest request) {
        log.debug("Confirming payment: paymentIntentId={}", request.getPaymentIntentId());

        try {
            UUID userId = JwtUtils.getCurrentUserId();
            var order = paymentService.processPayment(userId, request.getPaymentIntentId());
            OrderResponse response = OrderResponse.fromEntity(order);

            return ResponseEntity.ok(ApiResponse.success(response, "Payment confirmed and order created successfully"));
        } catch (Exception e) {
            log.error("Failed to confirm payment: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to confirm payment: " + e.getMessage()));
        }
    }

    @PostMapping("/guest-reserve")
    @Operation(summary = "Reserve tickets for guest (lock)", description = "Reserves tickets while guest completes payment. Call before create-intent. Returned IDs and reservedUntil (ISO-8601) for countdown.")
    public ResponseEntity<ApiResponse<Map<String, ?>>> guestReserve(
            @Valid @RequestBody GuestReserveRequest request) {
        log.debug("Guest reserve: {} items", request.getItems().size());
        try {
            List<GuestOrderItem> items = request.getItems().stream()
                    .map(i -> new GuestOrderItem(i.getEventId(), i.getTicketType(), i.getQuantity()))
                    .collect(Collectors.toList());
            List<UUID> reservedTicketIds = orderService.reserveTicketsForGuest(items);
            Instant reservedUntil = Instant.now().plusSeconds(reservationExpiryMinutes * 60L);
            Map<String, Object> body = new HashMap<>();
            body.put("reservedTicketIds", reservedTicketIds);
            body.put("reservedUntil", reservedUntil.toString());
            return ResponseEntity.ok(ApiResponse.success(body, "Tickets reserved"));
        } catch (Exception e) {
            log.error("Guest reserve failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to reserve tickets: " + e.getMessage()));
        }
    }

    @PostMapping("/guest/confirm")
    @Operation(summary = "Confirm guest payment", description = "Confirms a Stripe payment and creates an order for a guest (no account).")
    public ResponseEntity<ApiResponse<OrderResponse>> confirmGuestPayment(
            @Valid @RequestBody GuestConfirmPaymentRequest request) {
        log.debug("Confirming guest payment: paymentIntentId={}, email={}", request.getPaymentIntentId(), request.getEmail());

        try {
            List<GuestOrderItem> items = request.getItems().stream()
                    .map(i -> new GuestOrderItem(i.getEventId(), i.getTicketType(), i.getQuantity()))
                    .collect(Collectors.toList());
            var order = paymentService.processGuestPayment(
                    request.getPaymentIntentId(),
                    request.getEmail(),
                    request.getFirstName(),
                    request.getLastName(),
                    items,
                    request.getTotalAmount(),
                    request.getReservedTicketIds());
            OrderResponse response = OrderResponse.fromEntity(order);

            return ResponseEntity.ok(ApiResponse.success(response, "Payment confirmed and order created successfully"));
        } catch (Exception e) {
            log.error("Failed to confirm guest payment: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to confirm payment: " + e.getMessage()));
        }
    }
}
