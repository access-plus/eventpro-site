package com.accessplus.eventpro.payment.service.impl;

import com.accessplus.eventpro.order.order.model.GuestOrderItem;
import com.accessplus.eventpro.order.order.service.OrderService;
import com.accessplus.eventpro.payment.service.PaymentService;
import com.accessplus.eventpro.payment.stripe.model.StripeBillingAddress;
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
        return processPayment(userId, paymentIntentId, null, null, null);
    }

    @Override
    @Transactional
    public OrderEntity processPayment(UUID userId, String paymentIntentId, BigDecimal taxAmount, String buyerState, String buyerCountry) {
        log.debug("Processing payment: userId={}, paymentIntentId={}", userId, paymentIntentId);

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

        // Prefer Stripe-validated billing address (from card) for tax jurisdiction and order record
        StripeBillingAddress stripeAddress = null;
        try {
            stripeAddress = stripeService.getBillingAddressFromPaymentIntent(paymentIntentId);
        } catch (Exception e) {
            log.warn("Could not retrieve billing address from Stripe: {}", e.getMessage());
        }
        String orderState = stripeAddress != null && stripeAddress.getState() != null ? stripeAddress.getState() : buyerState;
        String orderCountry = stripeAddress != null && stripeAddress.getCountry() != null ? stripeAddress.getCountry() : buyerCountry;

        OrderEntity order = orderService.createOrderFromCart(userId, taxAmount, orderState, orderCountry);
        order = orderService.updateOrderStatus(order.getId(), OrderStatus.PAID);
        orderService.markOrderTicketsAsSold(order);

        log.info("Payment processed successfully: orderId={}, paymentIntentId={}", order.getId(), paymentIntentId);
        return order;
    }

    @Override
    @Transactional
    public OrderEntity processGuestPayment(String paymentIntentId, String guestEmail, String guestFirstName,
                                           String guestLastName, List<GuestOrderItem> items, BigDecimal totalAmount,
                                           List<UUID> reservedTicketIds, BigDecimal donationAmount) {
        return processGuestPayment(paymentIntentId, guestEmail, guestFirstName, guestLastName, items, totalAmount,
                reservedTicketIds, donationAmount, null, null, null);
    }

    @Override
    @Transactional
    public OrderEntity processGuestPayment(String paymentIntentId, String guestEmail, String guestFirstName,
                                           String guestLastName, List<GuestOrderItem> items, BigDecimal totalAmount,
                                           List<UUID> reservedTicketIds, BigDecimal donationAmount,
                                           BigDecimal taxAmount, String buyerState, String buyerCountry) {
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
        // Prefer Stripe-validated billing address (from card) for order record
        StripeBillingAddress stripeAddress = null;
        try {
            stripeAddress = stripeService.getBillingAddressFromPaymentIntent(paymentIntentId);
        } catch (Exception e) {
            log.warn("Could not retrieve billing address from Stripe: {}", e.getMessage());
        }
        String orderState = stripeAddress != null && stripeAddress.getState() != null ? stripeAddress.getState() : buyerState;
        String orderCountry = stripeAddress != null && stripeAddress.getCountry() != null ? stripeAddress.getCountry() : buyerCountry;

        OrderEntity order;
        if (reservedTicketIds != null && !reservedTicketIds.isEmpty()) {
            order = orderService.createOrderForGuestWithReservedTickets(guestEmail, guestFirstName, guestLastName, items, totalAmount, reservedTicketIds, donationAmount, taxAmount, orderState, orderCountry);
        } else {
            order = orderService.createOrderForGuest(guestEmail, guestFirstName, guestLastName, items, totalAmount, donationAmount, taxAmount, orderState, orderCountry);
        }
        order = orderService.updateOrderStatus(order.getId(), OrderStatus.PAID);
        orderService.markOrderTicketsAsSold(order);
        log.info("Guest payment processed: orderId={}, paymentIntentId={}", order.getId(), paymentIntentId);
        return order;
    }
}

