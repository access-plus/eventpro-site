package com.accessplus.eventpro.core.email.service;

import java.math.BigDecimal;

/**
 * Service interface for sending emails.
 */
public interface EmailService {

    /**
     * Sends a password reset confirmation email.
     *
     * @param email recipient email address
     * @param code  verification code
     * @throws Exception if email sending fails
     */
    void sendPasswordResetConfirmation(String email, String code) throws Exception;

    /**
     * Sends an order confirmation (ticket purchase) email to the buyer.
     *
     * @param toEmail        recipient email address
     * @param recipientName first name or "Guest"
     * @param orderNumber    order number (e.g. ORD-20260220-123456)
     * @param eventName      event name (optional; may be null for "Your tickets")
     * @param totalAmount    order total
     * @throws Exception if email sending fails
     */
    void sendOrderConfirmation(String toEmail, String recipientName, String orderNumber,
                              String eventName, BigDecimal totalAmount) throws Exception;
}

