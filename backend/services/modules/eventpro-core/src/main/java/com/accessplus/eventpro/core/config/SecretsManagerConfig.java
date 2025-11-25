package com.accessplus.eventpro.core.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;

import java.net.URI;

/**
 * Configuration for AWS Secrets Manager client.
 * 
 * This configuration is only active when USE_SECRETS_MANAGER=true is set.
 * In local development (local profile), this will not be loaded, allowing
 * the application to use environment variables directly.
 */
@Configuration
@ConditionalOnProperty(
    name = "USE_SECRETS_MANAGER",
    havingValue = "true",
    matchIfMissing = false
)
public class SecretsManagerConfig {

    @Value("${aws.region:us-east-1}")
    private String awsRegion;

    @Value("${aws.secrets.manager.endpoint:}")
    private String secretsManagerEndpoint; // Optional: for LocalStack

    /**
     * Creates and configures SecretsManagerClient bean for AWS Secrets Manager operations.
     * Supports both AWS and LocalStack endpoints.
     *
     * @return configured SecretsManagerClient instance
     */
    @Bean
    public SecretsManagerClient secretsManagerClient() {
        var builder = SecretsManagerClient.builder()
                .region(Region.of(awsRegion))
                .credentialsProvider(DefaultCredentialsProvider.builder().build());

        // Configure custom endpoint if provided (for LocalStack)
        if (secretsManagerEndpoint != null && !secretsManagerEndpoint.isEmpty()) {
            builder.endpointOverride(URI.create(secretsManagerEndpoint));
        }

        return builder.build();
    }
}

