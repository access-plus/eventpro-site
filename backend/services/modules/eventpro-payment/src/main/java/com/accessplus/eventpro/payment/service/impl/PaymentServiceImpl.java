package com.accessplus.eventpro.payment.service.impl;

import com.accessplus.eventpro.order.order.model.GuestOrderItem;
import com.accessplus.eventpro.order.order.service.OrderService;
import com.accessplus.eventpro.payment.service.PaymentService;
import com.accessplus.eventpro.payment.stripe.service.StripeService;
import com.accessplus.eventpro.shared.entity.OrderEntity;
import com.accessplus.eventpro.shared.enums.OrderStatus;
import com.stripe.model.PaymentIntent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Implementation of PaymentService.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {
    
    private final StripeService stripeService;
    private final OrderService orderService;
    
    @Override
    public String createPaymentIntent(BigDecimal amount) {
        log.debug("Creating payment intent for amount: {}", amount);
        try {
            return stripeService.createPaymentIntent(amount, "usd");
        } catch (Exception e) {
            log.error("Failed to create payment intent: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create payment intent: " + e.getMessage(), e);
        }
    }
    
    @Override
    @Transactional
    public OrderEntity processPayment(UUID userId, String paymentIntentId) {
        log.debug("Processing payment: userId={}, paymentIntentId={}", userId, paymentIntentId);
        
        // Confirm payment with Stripe
        PaymentIntent paymentIntent;
        try {
            paymentIntent = stripeService.confirmPayment(paymentIntentId);
        } catch (Exception e) {
            log.error("Failed to confirm payment: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to confirm payment: " + e.getMessage(), e);
        }
        
        // Verify payment succeeded
        if (!"succeeded".equals(paymentIntent.getStatus())) {
            throw new RuntimeException("Payment not succeeded. Status: " + paymentIntent.getStatus());
        }
        
        // Create order from cart and mark PAID (Stripe already succeeded)
        OrderEntity order = orderService.createOrderFromCart(userId);
        order = orderService.updateOrderStatus(order.getId(), OrderStatus.PAID);
        orderService.markOrderTicketsAsSold(order);

        log.info("Payment processed successfully: orderId={}, paymentIntentId={}", 
                order.getId(), paymentIntentId);

        return order;
    }

    @Override
    @Transactional
    public OrderEntity processGuestPayment(String paymentIntentId, String guestEmail, String guestFirstName,
                                           String guestLastName, List<GuestOrderItem> items, BigDecimal totalAmount,
                                           List<UUID> reservedTicketIds, BigDecimal donationAmount) {
        log.debug("Processing guest payment: paymentIntentId={}, guestEmail={}", paymentIntentId, guestEmail);
        PaymentIntent paymentIntent;
        try {
            paymentIntent = stripeService.confirmPayment(paymentIntentId);
        } catch (Exception e) {
            log.error("Failed to confirm payment: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to confirm payment: " + e.getMessage(), e);
        }
        if (!"succeeded".equals(paymentIntent.getStatus())) {
            throw new RuntimeException("Payment not succeeded. Status: " + paymentIntent.getStatus());
        }
        OrderEntity order;
        if (reservedTicketIds != null && !reservedTicketIds.isEmpty()) {
            order = orderService.createOrderForGuestWithReservedTickets(guestEmail, guestFirstName, guestLastName, items, totalAmount, reservedTicketIds, donationAmount);
        } else {
            order = orderService.createOrderForGuest(guestEmail, guestFirstName, guestLastName, items, totalAmount, donationAmount);
        }
        order = orderService.updateOrderStatus(order.getId(), OrderStatus.PAID);
        orderService.markOrderTicketsAsSold(order);
        log.info("Guest payment processed: orderId={}, paymentIntentId={}", order.getId(), paymentIntentId);
        return order;
    }
}

