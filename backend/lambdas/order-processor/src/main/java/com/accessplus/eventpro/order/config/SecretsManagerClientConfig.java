package com.accessplus.eventpro.order.config;

import jakarta.enterprise.inject.Produces;
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;

/**
 * Configuration for AWS Secrets Manager Client.
 */
public class SecretsManagerClientConfig {

    @Produces
    public SecretsManagerClient secretsManagerClient() {
        return SecretsManagerClient.builder().build();
    }
}

