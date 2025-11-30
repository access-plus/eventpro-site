package com.accessplus.eventpro.notification.service;

import com.accessplus.eventpro.shared.model.NotificationMessage;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.util.List;
import java.util.Map;

/**
 * Service for processing notifications from SQS messages.
 * Sends notifications via email, SMS, and stores in-app notifications.
 */
@ApplicationScoped
public class NotificationSenderService {

    private static final Logger LOG = Logger.getLogger(NotificationSenderService.class);

    @Inject
    EmailService emailService;

    @Inject
    SMSService smsService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Processes a notification message from SQS.
     * 
     * @param messageBody JSON string containing NotificationMessage
     * @throws NotificationProcessingException if notification processing fails
     */
    public void sendNotification(String messageBody) throws NotificationProcessingException {
        try {
            // Parse notification message
            NotificationMessage notificationMessage = objectMapper.readValue(messageBody, NotificationMessage.class);
            LOG.infof("Processing notification: type=%s, userId=%s", 
                    notificationMessage.getMessageType(), 
                    notificationMessage.getPayload() != null ? notificationMessage.getPayload().getUserId() : "N/A");

            NotificationMessage.NotificationPayload payload = notificationMessage.getPayload();
            if (payload == null) {
                throw new NotificationProcessingException("Notification payload is null");
            }

            // Check user preferences (simplified - in production, query database)
            // For now, we'll send to all requested delivery types
            List<String> deliveryTypes = payload.getDeliveryTypes();
            if (deliveryTypes == null || deliveryTypes.isEmpty()) {
                LOG.warn("No delivery types specified, defaulting to EMAIL and IN_APP");
                deliveryTypes = List.of("EMAIL", "IN_APP");
            }

            // Send via requested delivery types
            for (String deliveryType : deliveryTypes) {
                try {
                    switch (deliveryType.toUpperCase()) {
                        case "EMAIL":
                            sendEmail(notificationMessage);
                            break;
                        case "SMS":
                            sendSMS(notificationMessage);
                            break;
                        case "IN_APP":
                            storeInAppNotification(notificationMessage);
                            break;
                        case "PUSH":
                            // Push notifications would require additional setup (FCM, APNS)
                            LOG.debugf("Push notification not yet implemented for message: %s", notificationMessage.getMessageId());
                            break;
                        default:
                            LOG.warnf("Unknown delivery type: %s", deliveryType);
                    }
                } catch (Exception e) {
                    LOG.errorf(e, "Error sending notification via %s for message: %s", deliveryType, notificationMessage.getMessageId());
                    // Continue with other delivery types even if one fails
                }
            }

            LOG.infof("Notification processed successfully: messageId=%s", notificationMessage.getMessageId());

        } catch (NotificationProcessingException e) {
            throw e;
        } catch (Exception e) {
            LOG.errorf(e, "Unexpected error processing notification message");
            throw new NotificationProcessingException("Unexpected error processing notification", e);
        }
    }

    /**
     * Sends email notification via SES.
     * 
     * @param message the notification message
     */
    private void sendEmail(NotificationMessage message) {
        NotificationMessage.NotificationPayload payload = message.getPayload();
        String email = payload.getEmail();
        
        if (email == null || email.isEmpty()) {
            LOG.warnf("Email address not provided for notification: %s", message.getMessageId());
            return;
        }

        String subject = getEmailSubject(message.getMessageType());
        String htmlBody = generateEmailBody(message, true);
        String textBody = generateEmailBody(message, false);

        emailService.sendEmail(email, subject, htmlBody, textBody);
        LOG.debugf("Email sent for notification: messageId=%s", message.getMessageId());
    }

    /**
     * Sends SMS notification via SNS.
     * 
     * @param message the notification message
     */
    private void sendSMS(NotificationMessage message) {
        NotificationMessage.NotificationPayload payload = message.getPayload();
        String phoneNumber = payload.getPhoneNumber();
        
        if (phoneNumber == null || phoneNumber.isEmpty()) {
            LOG.warnf("Phone number not provided for notification: %s", message.getMessageId());
            return;
        }

        String smsMessage = generateSMSBody(message);
        smsService.sendSMS(phoneNumber, smsMessage);
        LOG.debugf("SMS sent for notification: messageId=%s", message.getMessageId());
    }

    /**
     * Stores in-app notification in database.
     * 
     * @param message the notification message
     */
    private void storeInAppNotification(NotificationMessage message) {
        // TODO: Implement database storage for in-app notifications
        // This would require creating a NotificationEntity and UserNotificationEntity
        // For now, we'll just log it
        LOG.infof("In-app notification stored (simulated): messageId=%s, userId=%s", 
                message.getMessageId(), 
                message.getPayload().getUserId());
    }

    /**
     * Gets email subject based on message type.
     */
    private String getEmailSubject(String messageType) {
        switch (messageType) {
            case "ORDER_CONFIRMATION":
            case "PAYMENT_SUCCESS":
                return "Order Confirmation - EventPro";
            case "PAYMENT_FAILED":
                return "Payment Failed - EventPro";
            case "EVENT_REMINDER":
                return "Event Reminder - EventPro";
            case "TICKET_READY":
                return "Your Tickets Are Ready - EventPro";
            case "SYSTEM_ANNOUNCEMENT":
                return "EventPro Announcement";
            default:
                return "Notification from EventPro";
        }
    }

    /**
     * Generates email body from notification message.
     */
    private String generateEmailBody(NotificationMessage message, boolean html) {
        NotificationMessage.NotificationPayload payload = message.getPayload();
        Map<String, Object> templateData = payload.getTemplateData();
        
        String lineBreak = html ? "<br>" : "\n";
        StringBuilder body = new StringBuilder();
        
        if (html) {
            body.append("<html><body>");
        }
        
        switch (message.getMessageType()) {
            case "ORDER_CONFIRMATION":
            case "PAYMENT_SUCCESS":
                body.append("Thank you for your order!").append(lineBreak).append(lineBreak);
                if (templateData != null) {
                    body.append("Order Number: ").append(templateData.get("orderNumber")).append(lineBreak);
                    body.append("Total Amount: $").append(templateData.get("totalAmount")).append(lineBreak);
                    if (templateData.containsKey("eventName")) {
                        body.append("Event: ").append(templateData.get("eventName")).append(lineBreak);
                    }
                }
                break;
            case "PAYMENT_FAILED":
                body.append("We're sorry, but your payment could not be processed.").append(lineBreak).append(lineBreak);
                body.append("Please try again or contact support if the problem persists.").append(lineBreak);
                break;
            case "EVENT_REMINDER":
                body.append("Reminder: You have an upcoming event!").append(lineBreak).append(lineBreak);
                if (templateData != null && templateData.containsKey("eventName")) {
                    body.append("Event: ").append(templateData.get("eventName")).append(lineBreak);
                    if (templateData.containsKey("eventDate")) {
                        body.append("Date: ").append(templateData.get("eventDate")).append(lineBreak);
                    }
                }
                break;
            case "TICKET_READY":
                body.append("Your tickets are ready for download!").append(lineBreak).append(lineBreak);
                body.append("You can download your tickets from your account.").append(lineBreak);
                break;
            default:
                body.append("You have a new notification from EventPro.").append(lineBreak);
        }
        
        if (html) {
            body.append("</body></html>");
        }
        
        return body.toString();
    }

    /**
     * Generates SMS body from notification message.
     */
    private String generateSMSBody(NotificationMessage message) {
        NotificationMessage.NotificationPayload payload = message.getPayload();
        Map<String, Object> templateData = payload.getTemplateData();
        
        StringBuilder body = new StringBuilder();
        body.append("EventPro: ");
        
        switch (message.getMessageType()) {
            case "ORDER_CONFIRMATION":
            case "PAYMENT_SUCCESS":
                body.append("Order confirmed. ");
                if (templateData != null) {
                    body.append("Order #").append(templateData.get("orderNumber"));
                }
                break;
            case "PAYMENT_FAILED":
                body.append("Payment failed. Please try again.");
                break;
            case "EVENT_REMINDER":
                body.append("Reminder: Event coming up soon!");
                break;
            case "TICKET_READY":
                body.append("Your tickets are ready for download!");
                break;
            default:
                body.append("You have a new notification.");
        }
        
        return body.toString();
    }

    /**
     * Exception thrown when notification processing fails.
     */
    public static class NotificationProcessingException extends Exception {
        public NotificationProcessingException(String message) {
            super(message);
        }

        public NotificationProcessingException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}

