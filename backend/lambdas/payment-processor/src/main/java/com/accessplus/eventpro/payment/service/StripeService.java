package com.accessplus.eventpro.payment.service;

import java.math.BigDecimal;

/**
 * Service interface for Stripe payment operations.
 */
public interface StripeService {
    
    /**
     * Creates a Stripe payment intent.
     * 
     * @param amount payment amount in dollars (will be converted to cents)
     * @return PaymentIntent client secret
     * @throws RuntimeException if Stripe API call fails
     */
    String createPaymentIntent(BigDecimal amount);
    
    /**
     * Confirms a payment intent.
     * 
     * @param paymentIntentId Stripe payment intent ID
     * @return true if payment succeeded, false otherwise
     * @throws RuntimeException if Stripe API call fails
     */
    boolean confirmPaymentIntent(String paymentIntentId);
}

