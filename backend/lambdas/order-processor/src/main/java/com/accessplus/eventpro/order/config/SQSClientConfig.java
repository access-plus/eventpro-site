package com.accessplus.eventpro.order.config;

import jakarta.enterprise.inject.Produces;
import software.amazon.awssdk.services.sqs.SqsClient;

/**
 * Configuration for AWS SQS Client.
 */
public class SQSClientConfig {

    @Produces
    public SqsClient sqsClient() {
        return SqsClient.builder().build();
    }
}

