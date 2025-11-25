package com.accessplus.eventpro.order.service;

import com.accessplus.eventpro.order.config.SQSConfig;
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
     * Publishes a payment message to the payment queue.
     * 
     * @param message the payment message object (will be serialized to JSON)
     */
    public void publishPaymentMessage(Object message) {
        try {
            String messageBody = objectMapper.writeValueAsString(message);
            String queueUrl = sqsConfig.getPaymentQueueUrl();

            if (queueUrl == null || queueUrl.isEmpty()) {
                LOG.warn("Payment queue URL not configured, skipping message publish");
                return;
            }

            SendMessageRequest request = SendMessageRequest.builder()
                    .queueUrl(queueUrl)
                    .messageBody(messageBody)
                    .build();

            sqsClient.sendMessage(request);
            LOG.infof("Payment message published to queue: %s", queueUrl);
        } catch (Exception e) {
            LOG.errorf(e, "Error publishing payment message to queue: %s", sqsConfig.getPaymentQueueUrl());
            throw new RuntimeException("Failed to publish payment message", e);
        }
    }
}

