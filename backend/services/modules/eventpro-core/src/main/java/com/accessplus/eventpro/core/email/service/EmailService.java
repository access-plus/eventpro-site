package com.accessplus.eventpro.core.email.service;

/**
 * Service interface for sending emails.
 */
public interface EmailService {
    
    /**
     * Sends a password reset confirmation email.
     * 
     * @param email recipient email address
     * @param code verification code
     * @throws Exception if email sending fails
     */
    void sendPasswordResetConfirmation(String email, String code) throws Exception;
}

