package com.accessplus.eventpro.payment.service.impl;

import com.accessplus.eventpro.payment.service.StripeService;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.PaymentIntentConfirmParams;
import jakarta.enterprise.context.ApplicationScoped;
import org.jboss.logging.Logger;

import java.math.BigDecimal;

/**
 * Implementation of StripeService using Stripe Java SDK.
 */
@ApplicationScoped
public class StripeServiceImpl implements StripeService {

    private static final Logger LOG = Logger.getLogger(StripeServiceImpl.class);

    @Override
    public String createPaymentIntent(BigDecimal amount) {
        try {
            // Convert amount to cents (Stripe uses smallest currency unit)
            long amountInCents = amount.multiply(BigDecimal.valueOf(100)).longValue();
            
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(amountInCents)
                    .setCurrency("usd")
                    .setAutomaticPaymentMethods(
                            PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                    .setEnabled(true)
                                    .build()
                    )
                    .build();
            
            PaymentIntent paymentIntent = PaymentIntent.create(params);
            LOG.infof("Created Stripe Payment Intent: id=%s, clientSecret=%s", 
                    paymentIntent.getId(), paymentIntent.getClientSecret());
            
            return paymentIntent.getClientSecret();
        } catch (StripeException e) {
            LOG.errorf(e, "Error creating Stripe Payment Intent");
            throw new RuntimeException("Failed to create Stripe Payment Intent: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean confirmPaymentIntent(String paymentIntentId) {
        try {
            LOG.debugf("Confirming payment intent: id=%s", paymentIntentId);
            
            PaymentIntent paymentIntent = PaymentIntent.retrieve(paymentIntentId);
            
            // If not already confirmed, confirm it
            if (!"succeeded".equals(paymentIntent.getStatus())) {
                PaymentIntentConfirmParams params = PaymentIntentConfirmParams.builder().build();
                paymentIntent = paymentIntent.confirm(params);
            }
            
            boolean succeeded = "succeeded".equals(paymentIntent.getStatus());
            LOG.infof("Payment intent confirmed: id=%s, status=%s", 
                    paymentIntent.getId(), paymentIntent.getStatus());
            
            return succeeded;
        } catch (StripeException e) {
            LOG.errorf(e, "Error confirming Stripe Payment Intent: %s", paymentIntentId);
            throw new RuntimeException("Failed to confirm Stripe Payment Intent: " + e.getMessage(), e);
        }
    }
}

