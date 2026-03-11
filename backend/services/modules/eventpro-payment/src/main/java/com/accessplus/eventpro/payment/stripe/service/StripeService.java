package com.accessplus.eventpro.payment.stripe.service;

import com.accessplus.eventpro.payment.stripe.model.StripeBillingAddress;
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

    /**
     * Retrieves billing address from the PaymentIntent's payment method (card).
     * Stripe validates this with the address on the user's card (AVS). Use for tax jurisdiction and order record.
     *
     * @param paymentIntentId Stripe payment intent ID (must be already confirmed so payment_method is set)
     * @return billing address (state, country) if present, or null if not collected/expanded
     */
    StripeBillingAddress getBillingAddressFromPaymentIntent(String paymentIntentId) throws StripeException;

    /**
     * Creates a Stripe Customer for subscription billing (idempotent: reuse if same email).
     *
     * @param email customer email
     * @param name  optional display name
     * @return Stripe Customer ID
     */
    String createCustomer(String email, String name) throws StripeException;

    /**
     * Creates a Stripe Checkout Session for subscription (Pro/Enterprise).
     * Customer must already exist. Caller should persist customer ID on user before redirecting.
     *
     * @param customerId        Stripe Customer ID
     * @param priceId           Stripe Price ID (e.g. Pro monthly)
     * @param successUrl        URL to redirect after successful payment
     * @param cancelUrl         URL to redirect if user cancels
     * @param clientReferenceId optional (e.g. user ID) for reference
     * @return Checkout Session URL to redirect the user to
     */
    String createSubscriptionCheckoutSession(String customerId, String priceId, String successUrl, String cancelUrl, String clientReferenceId) throws StripeException;
}

