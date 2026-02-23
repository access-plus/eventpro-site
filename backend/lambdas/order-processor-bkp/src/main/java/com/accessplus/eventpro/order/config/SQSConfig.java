package com.accessplus.eventpro.order.config;

import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

/**
 * Configuration for SQS queue URLs.
 */
@ApplicationScoped
public class SQSConfig {

    @ConfigProperty(name = "sqs.payment.queue.url")
    String paymentQueueUrl;

    public String getPaymentQueueUrl() {
        return paymentQueueUrl;
    }
}

