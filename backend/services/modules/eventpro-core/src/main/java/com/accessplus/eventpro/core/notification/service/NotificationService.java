package com.accessplus.eventpro.core.notification.service;

import java.math.BigDecimal;

/**
 * Service for sending notifications (email, and optionally SQS for async/Lambda).
 * Use for order confirmations, ticket ready, event reminders, etc.
 */
public interface NotificationService {

    /**
     * Sends an order confirmation email to the purchaser after successful payment.
     * Does not throw; logs and swallows errors so payment flow is not affected.
     *
     * @param toEmail        recipient email (user or guest)
     * @param recipientName  first name or display name
     * @param orderNumber    order number
     * @param eventName      event name (may be null)
     * @param totalAmount    order total
     */
    void sendOrderConfirmationEmail(String toEmail, String recipientName, String orderNumber,
                                    String eventName, BigDecimal totalAmount);
}
