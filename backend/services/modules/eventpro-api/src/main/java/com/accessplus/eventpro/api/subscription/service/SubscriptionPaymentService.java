package com.accessplus.eventpro.api.subscription.service;

import com.accessplus.eventpro.api.subscription.entity.SubscriptionPaymentEntity;

import java.util.UUID;

/**
 * Records and queries subscription/plan payments (Pro, Enterprise).
 * Used for 1099-K "subscription fees paid" and platform accounting.
 */
public interface SubscriptionPaymentService {

    /**
     * Record a subscription payment (e.g. when organizer pays for Pro/Enterprise monthly or yearly).
     * Call from admin or from Stripe/billing webhook when payment succeeds.
     */
    SubscriptionPaymentEntity recordPayment(UUID userId, java.math.BigDecimal amount, String tier, String period);
}
