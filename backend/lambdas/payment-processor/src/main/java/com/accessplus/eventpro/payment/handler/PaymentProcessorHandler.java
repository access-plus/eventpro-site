package com.accessplus.eventpro.payment.handler;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.SQSEvent;
import com.accessplus.eventpro.payment.service.PaymentProcessorService;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import org.jboss.logging.Logger;

/**
 * AWS Lambda handler for processing SQS payment messages.
 * Processes payments from the payment-queue, calls Stripe, updates orders/tickets, and publishes to notification-queue.
 */
@Named("paymentProcessor")
public class PaymentProcessorHandler implements RequestHandler<SQSEvent, Void> {

    private static final Logger LOG = Logger.getLogger(PaymentProcessorHandler.class);

    @Inject
    PaymentProcessorService paymentProcessorService;

    @Override
    public Void handleRequest(SQSEvent sqsEvent, Context context) {
        LOG.info("Received SQS event with " + sqsEvent.getRecords().size() + " records");

        for (SQSEvent.SQSMessage message : sqsEvent.getRecords()) {
            try {
                String messageBody = message.getBody();
                LOG.infof("Processing payment message: %s", messageBody);

                paymentProcessorService.processPayment(messageBody);

                LOG.infof("Successfully processed payment message: %s", message.getMessageId());
            } catch (Exception e) {
                LOG.errorf(e, "Error processing payment message: %s", message.getMessageId());
                // In production, failed messages will be sent to DLQ after maxReceiveCount
                throw new RuntimeException("Failed to process payment message: " + message.getMessageId(), e);
            }
        }

        return null;
    }
}

