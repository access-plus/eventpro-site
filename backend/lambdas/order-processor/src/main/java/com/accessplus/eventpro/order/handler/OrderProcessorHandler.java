package com.accessplus.eventpro.order.handler;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.SQSEvent;
import com.accessplus.eventpro.order.service.OrderProcessorService;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import org.jboss.logging.Logger;

/**
 * AWS Lambda handler for processing SQS order messages.
 * Processes orders from the order-queue, validates them, reserves tickets, and publishes to payment-queue.
 */
@Named("orderProcessor")
public class OrderProcessorHandler implements RequestHandler<SQSEvent, Void> {

    private static final Logger LOG = Logger.getLogger(OrderProcessorHandler.class);

    @Inject
    OrderProcessorService orderProcessorService;

    @Override
    public Void handleRequest(SQSEvent sqsEvent, Context context) {
        LOG.info("Received SQS event with " + sqsEvent.getRecords().size() + " records");

        for (SQSEvent.SQSMessage message : sqsEvent.getRecords()) {
            try {
                String messageBody = message.getBody();
                LOG.infof("Processing order message: %s", messageBody);

                orderProcessorService.processOrder(messageBody);

                LOG.infof("Successfully processed order message: %s", message.getMessageId());
            } catch (Exception e) {
                LOG.errorf(e, "Error processing order message: %s", message.getMessageId());
                // In production, failed messages will be sent to DLQ after maxReceiveCount
                throw new RuntimeException("Failed to process order message: " + message.getMessageId(), e);
            }
        }

        return null;
    }
}

