package com.accessplus.eventpro.core.notification.service.impl;

import com.accessplus.eventpro.core.email.service.EmailService;
import com.accessplus.eventpro.core.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final EmailService emailService;

    @Value("${eventpro.notifications.order-confirmation-enabled:true}")
    private boolean orderConfirmationEnabled;

    @Override
    public void sendOrderConfirmationEmail(String toEmail, String recipientName, String orderNumber,
                                           String eventName, BigDecimal totalAmount) {
        if (!orderConfirmationEnabled) {
            log.debug("Order confirmation email disabled by config, skipping: orderNumber={}", orderNumber);
            return;
        }
        if (toEmail == null || toEmail.isBlank()) {
            log.warn("Cannot send order confirmation: no recipient email for orderNumber={}", orderNumber);
            return;
        }
        try {
            emailService.sendOrderConfirmation(toEmail, recipientName, orderNumber, eventName, totalAmount);
        } catch (Exception e) {
            log.error("Failed to send order confirmation email: orderNumber={}, to={}, error={}",
                    orderNumber, toEmail, e.getMessage(), e);
            // Do not rethrow – payment already succeeded
        }
    }
}
