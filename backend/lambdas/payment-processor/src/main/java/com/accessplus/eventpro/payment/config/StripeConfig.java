package com.accessplus.eventpro.payment.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stripe.Stripe;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueRequest;
import software.amazon.awssdk.services.secretsmanager.model.SecretsManagerException;

/**
 * Configuration for Stripe API.
 * Supports reading secret key directly or from AWS Secrets Manager.
 */
@ApplicationScoped
public class StripeConfig {

    private static final Logger LOG = Logger.getLogger(StripeConfig.class);

    @ConfigProperty(name = "stripe.secret.key", defaultValue = "")
    String stripeSecretKey;

    @ConfigProperty(name = "stripe.secret.key.arn", defaultValue = "")
    String stripeSecretKeyArn;

    @Inject
    SecretsManagerClient secretsManagerClient;

    @Inject
    ObjectMapper objectMapper;

    @PostConstruct
    public void init() {
        String apiKey = null;

        // Try to get from Secrets Manager first
        if (stripeSecretKeyArn != null && !stripeSecretKeyArn.isEmpty()) {
            try {
                LOG.infof("Loading Stripe secret key from Secrets Manager: %s", stripeSecretKeyArn);
                GetSecretValueRequest request = GetSecretValueRequest.builder()
                        .secretId(stripeSecretKeyArn)
                        .build();

                String secretString = secretsManagerClient.getSecretValue(request).secretString();
                
                // Parse JSON secret (format: {"secret_key": "sk_..."})
                if (secretString != null) {
                    try {
                        JsonNode jsonNode = objectMapper.readTree(secretString);
                        if (jsonNode.has("secret_key")) {
                            apiKey = jsonNode.get("secret_key").asText();
                        } else {
                            // If not JSON or no secret_key field, assume it's the key directly
                            apiKey = secretString;
                        }
                    } catch (Exception e) {
                        // If JSON parsing fails, assume it's the key directly
                        LOG.debugf("Secret is not JSON, using as direct key value");
                        apiKey = secretString;
                    }
                }
                LOG.info("Stripe API key loaded from Secrets Manager");
            } catch (SecretsManagerException e) {
                LOG.errorf(e, "Failed to load Stripe secret from Secrets Manager: %s", stripeSecretKeyArn);
            }
        }

        // Fallback to direct configuration
        if (apiKey == null && stripeSecretKey != null && !stripeSecretKey.isEmpty()) {
            apiKey = stripeSecretKey;
            LOG.info("Stripe API key loaded from environment variable");
        }

        if (apiKey != null && !apiKey.isEmpty()) {
            Stripe.apiKey = apiKey;
            LOG.info("Stripe API key initialized");
        } else {
            LOG.warn("Stripe secret key not configured - payment processing will fail");
        }
    }
}

