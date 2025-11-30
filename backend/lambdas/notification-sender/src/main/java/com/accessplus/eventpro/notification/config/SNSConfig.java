package com.accessplus.eventpro.notification.config;

import jakarta.enterprise.inject.Produces;
import software.amazon.awssdk.services.sns.SnsClient;

/**
 * Configuration for AWS SNS Client.
 */
public class SNSConfig {

    @Produces
    public SnsClient snsClient() {
        return SnsClient.builder().build();
    }
}

