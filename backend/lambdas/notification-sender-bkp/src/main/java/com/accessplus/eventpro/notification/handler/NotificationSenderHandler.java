package com.accessplus.eventpro.notification.handler;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.SQSEvent;
import com.accessplus.eventpro.notification.service.NotificationSenderService;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import org.jboss.logging.Logger;

/**
 * AWS Lambda handler for processing SQS notification messages.
 * Processes notifications from the notification-queue and sends them via email, SMS, or in-app.
 */
@Named("notificationSender")
public class NotificationSenderHandler implements RequestHandler<SQSEvent, Void> {

    private static final Logger LOG = Logger.getLogger(NotificationSenderHandler.class);

    @Inject
    NotificationSenderService notificationSenderService;

    @Override
    public Void handleRequest(SQSEvent sqsEvent, Context context) {
        LOG.info("Received SQS event with " + sqsEvent.getRecords().size() + " records");

        for (SQSEvent.SQSMessage message : sqsEvent.getRecords()) {
            try {
                String messageBody = message.getBody();
                LOG.infof("Processing notification message: %s", messageBody);

                notificationSenderService.sendNotification(messageBody);

                LOG.infof("Successfully processed notification message: %s", message.getMessageId());
            } catch (Exception e) {
                LOG.errorf(e, "Error processing notification message: %s", message.getMessageId());
                // In production, failed messages will be sent to DLQ after maxReceiveCount
                throw new RuntimeException("Failed to process notification message: " + message.getMessageId(), e);
            }
        }

        return null;
    }
}

