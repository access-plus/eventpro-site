package com.accessplus.eventpro.core.messaging.sqs;

import com.accessplus.eventpro.core.config.SQSConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.SendMessageRequest;

/**
 * Service for publishing messages to AWS SQS queues.
 * Provides methods to publish messages to order-queue, payment-queue, and notification-queue.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SQSMessagePublisher {
    private final SqsClient sqsClient;
    private final SQSConfig sqsConfig;
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    /**
     * Generic method to publish a message to any SQS queue.
     *
     * @param queueUrl the URL of the SQS queue
     * @param message the message object to publish (will be serialized to JSON)
     */
    public void publish(String queueUrl, Object message) {
        try {
            String messageBody = objectMapper.writeValueAsString(message);
            
            SendMessageRequest request = SendMessageRequest.builder()
                .queueUrl(queueUrl)
                .messageBody(messageBody)
                .build();
            
            sqsClient.sendMessage(request);
            log.info("Message published to queue: {}", queueUrl);
        } catch (Exception e) {
            log.error("Error publishing message to queue: {}", queueUrl, e);
            throw new RuntimeException("Failed to publish message", e);
        }
    }
    
    /**
     * Publishes an order message to the order-queue.
     * Used when an order is created and needs to be processed asynchronously.
     *
     * @param message the order message object (will be serialized to JSON)
     */
    public void publishOrderMessage(Object message) {
        String queueUrl = sqsConfig.getOrderQueueUrl();
        log.debug("Publishing order message to order-queue: {}", queueUrl);
        publish(queueUrl, message);
    }
    
    /**
     * Publishes a payment message to the payment-queue.
     * Used when an order is validated and ready for payment processing.
     *
     * @param message the payment message object (will be serialized to JSON)
     */
    public void publishPaymentMessage(Object message) {
        String queueUrl = sqsConfig.getPaymentQueueUrl();
        log.debug("Publishing payment message to payment-queue: {}", queueUrl);
        publish(queueUrl, message);
    }
    
    /**
     * Publishes a notification message to the notification-queue.
     * Used when a notification needs to be sent (email, SMS, in-app).
     *
     * @param message the notification message object (will be serialized to JSON)
     */
    public void publishNotificationMessage(Object message) {
        String queueUrl = sqsConfig.getNotificationQueueUrl();
        log.debug("Publishing notification message to notification-queue: {}", queueUrl);
        publish(queueUrl, message);
    }
}

