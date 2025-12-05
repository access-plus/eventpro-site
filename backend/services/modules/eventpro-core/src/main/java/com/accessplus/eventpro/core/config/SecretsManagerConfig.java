package com.accessplus.eventpro.core.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;

import java.net.URI;

/**
 * Configuration for AWS Secrets Manager client.
 * 
 * This configuration is active for all profiles except "local".
 * In local development (local profile), this will not be loaded, allowing
 * the application to use environment variables directly.
 * 
 * Supports LocalStack endpoint override for local testing via aws.secrets.manager.endpoint property.
 */
@Configuration
@Profile("!local")
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

