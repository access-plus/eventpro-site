package com.accessplus.eventpro.api.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * Stripe subscription price IDs. Create Products and Prices in Stripe Dashboard,
 * then set STRIPE_PRICE_PRO_MONTHLY etc. in env.
 */
@Configuration
@Getter
public class StripeSubscriptionConfig {

    @Value("${stripe.subscription.priceIdProMonthly:}")
    private String priceIdProMonthly;

    @Value("${stripe.subscription.priceIdProYearly:}")
    private String priceIdProYearly;

    @Value("${stripe.subscription.priceIdEnterpriseMonthly:}")
    private String priceIdEnterpriseMonthly;

    @Value("${stripe.subscription.priceIdEnterpriseYearly:}")
    private String priceIdEnterpriseYearly;

    public String getPriceId(String tier, String period) {
        boolean yearly = "YEARLY".equalsIgnoreCase(period);
        return switch (tier != null ? tier.toUpperCase() : "PRO") {
            case "ENTERPRISE" -> yearly ? priceIdEnterpriseYearly : priceIdEnterpriseMonthly;
            default -> yearly ? priceIdProYearly : priceIdProMonthly;
        };
    }

    /** Derive tier from a Stripe Price ID (for webhook and sync). */
    public String getTierFromPriceId(String priceId) {
        if (priceId == null || priceId.isBlank()) return "PRO";
        if (priceId.equals(priceIdEnterpriseMonthly) || priceId.equals(priceIdEnterpriseYearly)) return "ENTERPRISE";
        return "PRO";
    }
}
