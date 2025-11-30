package com.accessplus.eventpro.payment.service;

import com.accessplus.eventpro.shared.entity.OrderEntity;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Service interface for payment processing operations.
 */
public interface PaymentService {
    
    /**
     * Creates a payment intent for an order.
     * 
     * @param amount payment amount
     * @return payment intent client secret
     * @throws RuntimeException if payment intent creation fails
     */
    String createPaymentIntent(BigDecimal amount);
    
    /**
     * Processes payment and creates order from cart.
     * 
     * @param userId user ID
     * @param paymentIntentId Stripe payment intent ID
     * @return created order
     * @throws RuntimeException if payment processing fails
     */
    OrderEntity processPayment(UUID userId, String paymentIntentId);
}

