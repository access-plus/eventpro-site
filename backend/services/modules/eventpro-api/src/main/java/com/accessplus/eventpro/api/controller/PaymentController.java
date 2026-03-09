package com.accessplus.eventpro.api.controller;

import com.accessplus.eventpro.api.dto.ApiResponse;
import com.accessplus.eventpro.api.dto.ConfirmPaymentRequest;
import com.accessplus.eventpro.api.dto.CreatePaymentIntentRequest;
import com.accessplus.eventpro.api.dto.GuestConfirmPaymentRequest;
import com.accessplus.eventpro.api.dto.GuestOrderItemRequest;
import com.accessplus.eventpro.api.dto.GuestReserveRequest;
import com.accessplus.eventpro.api.dto.OrderResponse;
import com.accessplus.eventpro.core.notification.service.NotificationService;
import com.accessplus.eventpro.core.security.JwtUtils;
import com.accessplus.eventpro.core.user.service.UserService;
import com.accessplus.eventpro.event.event.service.EventService;
import com.accessplus.eventpro.order.order.model.GuestOrderItem;
import com.accessplus.eventpro.order.order.service.OrderService;
import com.accessplus.eventpro.payment.service.PaymentService;
import com.accessplus.eventpro.shared.entity.OrderItemEntity;
import com.accessplus.eventpro.shared.entity.TicketEntity;
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
    private final NotificationService notificationService;
    private final EventService eventService;
    private final UserService userService;

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
            if (message.contains("Payment is not configured") || message.contains("Invalid API Key") || message.contains("empty string") || message.contains("sk_test_*") || message.contains("sk_test_local")) {
                if (!message.contains("Payment is not configured")) {
                    message = "Payment is not configured. Add STRIPE_SECRET_KEY=sk_test_... to a .env file in the project root (same folder as docker-compose.yml) and restart the backend. Get a key from https://dashboard.stripe.com/test/apikeys";
                }
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

            sendOrderConfirmationNotification(order, userId, null);

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

            sendOrderConfirmationNotification(order, null, request.getEmail());

            return ResponseEntity.ok(ApiResponse.success(response, "Payment confirmed and order created successfully"));
        } catch (Exception e) {
            log.error("Failed to confirm guest payment: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to confirm payment: " + e.getMessage()));
        }
    }

    /**
     * Sends order confirmation email to the purchaser (user or guest).
     * Resolves event name from first order item; does not fail the request if notification fails.
     */
    private void sendOrderConfirmationNotification(com.accessplus.eventpro.shared.entity.OrderEntity order,
                                                   UUID userId, String guestEmail) {
        try {
            String toEmail;
            String recipientName;
            if (userId != null) {
                var user = userService.getUserById(userId);
                toEmail = user != null ? user.getEmail() : null;
                recipientName = user != null && user.getFirstName() != null ? user.getFirstName() : "Guest";
            } else {
                toEmail = order.getGuestEmail();
                recipientName = order.getGuestFirstName() != null ? order.getGuestFirstName() : "Guest";
            }
            String eventName = null;
            if (order.getOrderItems() != null && !order.getOrderItems().isEmpty()) {
                OrderItemEntity first = order.getOrderItems().get(0);
                TicketEntity ticket = first.getTicket();
                if (ticket != null && ticket.getEventId() != null) {
                    try {
                        eventName = eventService.getEventById(ticket.getEventId()).getName();
                    } catch (Exception e) {
                        log.debug("Could not resolve event name for notification: {}", e.getMessage());
                    }
                }
            }
            notificationService.sendOrderConfirmationEmail(
                    toEmail,
                    recipientName,
                    order.getOrderNumber(),
                    eventName,
                    order.getTotalAmount());
        } catch (Exception e) {
            log.warn("Failed to send order confirmation notification: orderId={}, error={}", order.getId(), e.getMessage());
        }
    }
}
