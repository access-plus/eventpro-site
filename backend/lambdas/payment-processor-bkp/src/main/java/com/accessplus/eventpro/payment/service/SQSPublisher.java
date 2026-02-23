package com.accessplus.eventpro.payment.service;

import com.accessplus.eventpro.payment.config.SQSConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.SendMessageRequest;

/**
 * Service for publishing messages to AWS SQS queues.
 */
@ApplicationScoped
public class SQSPublisher {

    private static final Logger LOG = Logger.getLogger(SQSPublisher.class);

    @Inject
    SqsClient sqsClient;

    @Inject
    SQSConfig sqsConfig;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Publishes a notification message to the notification queue.
     * 
     * @param message the notification message object (will be serialized to JSON)
     */
    public void publishNotificationMessage(Object message) {
        try {
            String messageBody = objectMapper.writeValueAsString(message);
            String queueUrl = sqsConfig.getNotificationQueueUrl();

            if (queueUrl == null || queueUrl.isEmpty()) {
                LOG.warn("Notification queue URL not configured, skipping message publish");
                return;
            }

            SendMessageRequest request = SendMessageRequest.builder()
                    .queueUrl(queueUrl)
                    .messageBody(messageBody)
                    .build();

            sqsClient.sendMessage(request);
            LOG.infof("Notification message published to queue: %s", queueUrl);
        } catch (Exception e) {
            LOG.errorf(e, "Error publishing notification message to queue: %s", sqsConfig.getNotificationQueueUrl());
            throw new RuntimeException("Failed to publish notification message", e);
        }
    }
}

