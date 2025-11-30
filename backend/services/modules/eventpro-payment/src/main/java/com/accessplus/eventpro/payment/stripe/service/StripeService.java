package com.accessplus.eventpro.payment.stripe.service;

import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;

import java.math.BigDecimal;

/**
 * Service interface for Stripe payment operations.
 */
public interface StripeService {
    
    /**
     * Creates a Stripe payment intent.
     * 
     * @param amount payment amount in dollars (will be converted to cents)
     * @param currency currency code (default: "usd")
     * @return PaymentIntent client secret
     * @throws StripeException if Stripe API call fails
     */
    String createPaymentIntent(BigDecimal amount, String currency) throws StripeException;
    
    /**
     * Confirms a payment intent.
     * 
     * @param paymentIntentId Stripe payment intent ID
     * @return confirmed PaymentIntent
     * @throws StripeException if Stripe API call fails
     */
    PaymentIntent confirmPayment(String paymentIntentId) throws StripeException;
    
    /**
     * Refunds a payment.
     * 
     * @param paymentIntentId Stripe payment intent ID
     * @return refund ID
     * @throws StripeException if Stripe API call fails
     */
    String refundPayment(String paymentIntentId) throws StripeException;
}

