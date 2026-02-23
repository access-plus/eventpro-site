package com.accessplus.eventpro.notification.service;

/**
 * Service interface for sending SMS via AWS SNS.
 */
public interface SMSService {
    
    /**
     * Sends an SMS via AWS SNS.
     * 
     * @param phoneNumber recipient phone number (E.164 format)
     * @param message SMS message text
     * @throws RuntimeException if SMS sending fails
     */
    void sendSMS(String phoneNumber, String message);
}

