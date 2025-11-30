package com.accessplus.eventpro.payment.config;

import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

/**
 * Configuration for SQS queue URLs.
 */
@ApplicationScoped
public class SQSConfig {

    @ConfigProperty(name = "sqs.notification.queue.url")
    String notificationQueueUrl;

    public String getNotificationQueueUrl() {
        return notificationQueueUrl;
    }
}

