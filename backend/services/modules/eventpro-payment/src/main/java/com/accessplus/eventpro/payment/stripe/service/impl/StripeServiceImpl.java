package com.accessplus.eventpro.payment.stripe.service.impl;

import com.accessplus.eventpro.payment.stripe.service.StripeService;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Refund;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.PaymentIntentConfirmParams;
import com.stripe.param.RefundCreateParams;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.math.BigDecimal;

/**
 * Implementation of StripeService using Stripe Java SDK.
 */
@Slf4j
@Service
public class StripeServiceImpl implements StripeService {
    
    @Value("${stripe.secretKey}")
    private String stripeSecretKey;
    
    @PostConstruct
    public void init() {
        String key = stripeSecretKey != null ? stripeSecretKey.trim() : "";
        if (key.isEmpty() || "sk_test_local".equals(key)) {
            log.warn("Stripe secret key is missing or still the placeholder (sk_test_local). Set STRIPE_SECRET_KEY in .env and restart. Payment intents will fail until then.");
        }
        Stripe.apiKey = key;
        log.info("Stripe API key initialized");
    }
    
    @Override
    public String createPaymentIntent(BigDecimal amount, String currency) throws StripeException {
        log.debug("Creating payment intent: amount={}, currency={}", amount, currency);
        
        // Convert amount to cents (Stripe uses smallest currency unit)
        long amountInCents = amount.multiply(BigDecimal.valueOf(100)).longValue();
        
        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(amountInCents)
                .setCurrency(currency != null ? currency : "usd")
                .setAutomaticPaymentMethods(
                        PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                .setEnabled(true)
                                .build()
                )
                .build();
        
        PaymentIntent paymentIntent = PaymentIntent.create(params);
        log.info("Payment intent created: id={}, clientSecret={}", 
                paymentIntent.getId(), paymentIntent.getClientSecret());
        
        return paymentIntent.getClientSecret();
    }
    
    @Override
    public PaymentIntent confirmPayment(String paymentIntentId) throws StripeException {
        log.debug("Confirming payment intent: id={}", paymentIntentId);
        
        PaymentIntent paymentIntent = PaymentIntent.retrieve(paymentIntentId);
        
        // If not already confirmed, confirm it
        if (!"succeeded".equals(paymentIntent.getStatus())) {
            PaymentIntentConfirmParams params = PaymentIntentConfirmParams.builder().build();
            paymentIntent = paymentIntent.confirm(params);
        }
        
        log.info("Payment intent confirmed: id={}, status={}", 
                paymentIntent.getId(), paymentIntent.getStatus());
        
        return paymentIntent;
    }
    
    @Override
    public String refundPayment(String paymentIntentId) throws StripeException {
        log.debug("Refunding payment intent: id={}", paymentIntentId);
        
        PaymentIntent paymentIntent = PaymentIntent.retrieve(paymentIntentId);
        
        // Get the latest charge ID from the payment intent
        // In newer Stripe API, we need to expand charges or use the latest charge
        String chargeId = paymentIntent.getLatestCharge();
        
        if (chargeId == null || chargeId.isEmpty()) {
            throw new RuntimeException("No charge found for payment intent: " + paymentIntentId);
        }
        
        RefundCreateParams params = RefundCreateParams.builder()
                .setPaymentIntent(paymentIntentId)
                .build();
        
        Refund refund = Refund.create(params);
        log.info("Payment refunded: paymentIntentId={}, refundId={}", 
                paymentIntentId, refund.getId());
        
        return refund.getId();
    }
}

