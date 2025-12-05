package com.accessplus.eventpro.payment.config;

import com.stripe.Stripe;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

/**
 * Configuration for Stripe API.
 * Reads Stripe secret key from environment variable (STRIPE_SECRET_KEY).
 * 
 * For consistency with ECS application, Stripe secrets are passed as environment variables
 * from Terraform variables, not from Secrets Manager.
 */
@ApplicationScoped
public class StripeConfig {

    private static final Logger LOG = Logger.getLogger(StripeConfig.class);

    @ConfigProperty(name = "stripe.secret.key", defaultValue = "")
    String stripeSecretKey;

    @PostConstruct
    public void init() {
        if (stripeSecretKey != null && !stripeSecretKey.isEmpty()) {
            Stripe.apiKey = stripeSecretKey;
            LOG.info("Stripe API key initialized from environment variable");
        } else {
            LOG.warn("Stripe secret key not configured - payment processing will fail");
        }
    }
}

