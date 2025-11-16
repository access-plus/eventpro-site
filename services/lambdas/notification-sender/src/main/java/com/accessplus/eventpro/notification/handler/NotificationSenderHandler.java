package com.accessplus.eventpro.notification.handler;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.SQSEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@ApplicationScoped
@Named("notificationSender")
public class NotificationSenderHandler implements RequestHandler<SQSEvent, Void> {
    
    @Inject
    ObjectMapper objectMapper;
    
    // Inject your services here
    // @Inject
    // EmailService emailService;
    
    // @Inject
    // SMSService smsService;
    
    @Override
    public Void handleRequest(SQSEvent event, Context context) {
        log.info("Processing {} notification messages", event.getRecords().size());
        
        for (SQSEvent.SQSMessage message : event.getRecords()) {
            try {
                String body = message.getBody();
                log.info("Processing notification message: {}", body);
                
                // TODO: Implement notification logic
                // 1. Parse notification request using objectMapper
                // 2. Get user preferences
                // 3. Send email (SES)
                // 4. Send SMS (SNS)
                // 5. Send WebSocket message
                
            } catch (Exception e) {
                log.error("Error processing notification message", e);
                throw new RuntimeException("Failed to send notification", e);
            }
        }
        
        return null;
    }
}
