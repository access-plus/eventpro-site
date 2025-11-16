package com.accessplus.eventpro.order.handler;

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
@Named("orderProcessor")
public class OrderProcessorHandler implements RequestHandler<SQSEvent, Void> {
    
    @Inject
    ObjectMapper objectMapper;
    
    // Inject your services here
    // @Inject
    // OrderValidationService orderValidationService;
    
    // @Inject
    // TicketReservationService ticketReservationService;
    
    @Override
    public Void handleRequest(SQSEvent event, Context context) {
        log.info("Processing {} SQS messages", event.getRecords().size());
        
        for (SQSEvent.SQSMessage message : event.getRecords()) {
            try {
                String body = message.getBody();
                log.info("Processing order message: {}", body);
                
                // TODO: Implement order processing logic
                // 1. Parse order request using objectMapper
                // 2. Validate order
                // 3. Reserve tickets
                // 4. Update order status
                // 5. Publish to payment queue
                
            } catch (Exception e) {
                log.error("Error processing order message", e);
                throw new RuntimeException("Failed to process order", e);
            }
        }
        
        return null;
    }
}
