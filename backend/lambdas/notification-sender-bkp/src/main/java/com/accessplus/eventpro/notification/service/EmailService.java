package com.accessplus.eventpro.notification.service;

/**
 * Service interface for sending emails via AWS SES.
 */
public interface EmailService {
    
    /**
     * Sends an email via AWS SES.
     * 
     * @param to recipient email address
     * @param subject email subject
     * @param htmlBody HTML email body
     * @param textBody plain text email body
     * @throws RuntimeException if email sending fails
     */
    void sendEmail(String to, String subject, String htmlBody, String textBody);
}

