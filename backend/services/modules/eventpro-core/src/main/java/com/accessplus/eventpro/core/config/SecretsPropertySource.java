package com.accessplus.eventpro.core.config;

import com.accessplus.eventpro.core.service.SecretsManagerService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Property source that loads secrets from AWS Secrets Manager into Spring's environment.
 * 
 * This component retrieves secrets from Secrets Manager and adds them as property sources,
 * allowing them to be used with @Value annotations and in application.yml.
 * 
 * This is only active when USE_SECRETS_MANAGER=true is set.
 * In local development, secrets are provided via environment variables directly.
 */
@Component
@ConditionalOnProperty(
    name = "USE_SECRETS_MANAGER",
    havingValue = "true",
    matchIfMissing = false
)
public class SecretsPropertySource implements ApplicationListener<ContextRefreshedEvent> {

    private static final Logger log = LoggerFactory.getLogger(SecretsPropertySource.class);

    private final SecretsManagerService secretsManagerService;
    private final ConfigurableEnvironment environment;

    @Value("${aws.secrets.manager.databaseSecret:}")
    private String databaseSecretArn;

    @Value("${aws.secrets.manager.stripeSecret:${STRIPE_SECRET_ARN:}}")
    private String stripeSecretArn;

    public SecretsPropertySource(SecretsManagerService secretsManagerService, 
                                 ConfigurableEnvironment environment) {
        this.secretsManagerService = secretsManagerService;
        this.environment = environment;
    }

    @Override
    public void onApplicationEvent(ContextRefreshedEvent event) {
        log.info("Loading secrets from AWS Secrets Manager into Spring environment");

        Map<String, Object> secrets = new HashMap<>();

        // Load database secrets
        if (databaseSecretArn != null && !databaseSecretArn.isEmpty()) {
            log.debug("Loading database secrets from: {}", databaseSecretArn);
            String dbPassword = secretsManagerService.getSecretValue(databaseSecretArn, "password");
            if (dbPassword != null) {
                secrets.put("spring.datasource.password", dbPassword);
                log.debug("Database password loaded from Secrets Manager");
            } else {
                log.warn("Database password not found in Secrets Manager, using environment variable");
            }
        }

        // Load Stripe secrets
        if (stripeSecretArn != null && !stripeSecretArn.isEmpty()) {
            log.debug("Loading Stripe secrets from: {}", stripeSecretArn);
            String stripeSecretKey = secretsManagerService.getSecretValue(stripeSecretArn, "secret_key");
            String stripePublishableKey = secretsManagerService.getSecretValue(stripeSecretArn, "publishable_key");
            String stripeWebhookSecret = secretsManagerService.getSecretValue(stripeSecretArn, "webhook_secret");

            if (stripeSecretKey != null) {
                secrets.put("stripe.secretKey", stripeSecretKey);
                log.debug("Stripe secret key loaded from Secrets Manager");
            }
            if (stripePublishableKey != null) {
                secrets.put("stripe.publishableKey", stripePublishableKey);
                log.debug("Stripe publishable key loaded from Secrets Manager");
            }
            if (stripeWebhookSecret != null) {
                secrets.put("stripe.webhookSecret", stripeWebhookSecret);
                log.debug("Stripe webhook secret loaded from Secrets Manager");
            }
        }

        // Add secrets as a property source with high priority
        if (!secrets.isEmpty()) {
            environment.getPropertySources().addFirst(
                new MapPropertySource("aws-secrets-manager", secrets)
            );
            log.info("Loaded {} secrets from AWS Secrets Manager", secrets.size());
        } else {
            log.warn("No secrets were loaded from AWS Secrets Manager");
        }
    }
}

