package com.accessplus.eventpro.payment.service;

import com.accessplus.eventpro.payment.repository.OrderRepository;
import com.accessplus.eventpro.payment.repository.TicketRepository;
import com.accessplus.eventpro.shared.entity.OrderEntity;
import com.accessplus.eventpro.shared.entity.OrderItemEntity;
import com.accessplus.eventpro.shared.entity.TicketEntity;
import com.accessplus.eventpro.shared.enums.OrderStatus;
import com.accessplus.eventpro.shared.enums.TicketStatus;
import com.accessplus.eventpro.shared.enums.NotificationType;
import com.accessplus.eventpro.shared.model.NotificationMessage;
import com.accessplus.eventpro.shared.model.PaymentMessage;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.UUID;

/**
 * Service for processing payments from SQS messages.
 * Validates payments, processes via Stripe, updates orders/tickets, and publishes to notification queue.
 */
@ApplicationScoped
public class PaymentProcessorService {

    private static final Logger LOG = Logger.getLogger(PaymentProcessorService.class);

    @Inject
    OrderRepository orderRepository;

    @Inject
    TicketRepository ticketRepository;

    @Inject
    StripeService stripeService;

    @Inject
    SQSPublisher sqsPublisher;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Processes a payment message from SQS.
     * 
     * <p>The message format from order-processor may be wrapped or direct:
     * <pre>
     * Wrapped format:
     * {
     *   "messageId": "...",
     *   "messageType": "PAYMENT_REQUIRED",
     *   "timestamp": "...",
     *   "source": "order-processor",
     *   "payload": {
     *     "orderId": "...",
     *     "orderNumber": "...",
     *     "userId": "...",
     *     "totalAmount": 150.00
     *   }
     * }
     * 
     * Direct format (current implementation):
     * {
     *   "orderId": "...",
     *   "orderNumber": "...",
     *   "userId": "...",
     *   "totalAmount": 150.00
     * }
     * </pre>
     * 
     * @param messageBody JSON string containing PaymentMessage (wrapped or direct)
     * @throws PaymentProcessingException if payment processing fails
     */
    @Transactional
    public void processPayment(String messageBody) throws PaymentProcessingException {
        try {
            // Parse wrapped or direct message structure
            com.fasterxml.jackson.databind.JsonNode rootNode = objectMapper.readTree(messageBody);
            
            // Extract payload from wrapped message, or use root if direct
            com.fasterxml.jackson.databind.JsonNode payloadNode = rootNode.get("payload");
            if (payloadNode == null) {
                // Fallback: try to parse as direct PaymentMessage (current implementation)
                LOG.debug("No 'payload' field found, attempting direct PaymentMessage parsing");
                payloadNode = rootNode;
            }
            
            // Parse PaymentMessage from payload
            PaymentMessage paymentMessage = objectMapper.treeToValue(payloadNode, PaymentMessage.class);
            LOG.infof("Processing payment: Order ID=%s, Order Number=%s", 
                    paymentMessage.getOrderId(), paymentMessage.getOrderNumber());

            // Load order with items
            OrderEntity order = orderRepository.findByIdWithItems(paymentMessage.getOrderId())
                    .orElseThrow(() -> new PaymentProcessingException("Order not found: " + paymentMessage.getOrderId()));

            // Validate order
            validateOrder(order, paymentMessage);

            // Process Stripe payment
            boolean paymentSucceeded = processStripePayment(paymentMessage);

            if (paymentSucceeded) {
                // Update order status to PAID
                updateOrderStatus(order.getId(), OrderStatus.PAID);
                
                // Assign tickets to user
                assignTickets(order);
                
                // Publish success notification
                publishNotificationMessage(order, NotificationType.PAYMENT_SUCCESS);
                
                LOG.infof("Payment processed successfully for order: %s", order.getOrderNumber());
            } else {
                // Payment failed - rollback
                handlePaymentFailure(order);
                
                LOG.warnf("Payment failed for order: %s", order.getOrderNumber());
            }

        } catch (PaymentProcessingException e) {
            throw e;
        } catch (Exception e) {
            LOG.errorf(e, "Unexpected error processing payment message");
            throw new PaymentProcessingException("Unexpected error processing payment", e);
        }
    }

    /**
     * Validates the order before processing payment.
     * 
     * @param order the order to validate
     * @param paymentMessage the payment message
     * @throws PaymentProcessingException if validation fails
     */
    private void validateOrder(OrderEntity order, PaymentMessage paymentMessage) throws PaymentProcessingException {
        if (order == null) {
            throw new PaymentProcessingException("Order is null");
        }

        if (order.getOrderItems() == null || order.getOrderItems().isEmpty()) {
            throw new PaymentProcessingException("Order has no items: " + order.getOrderNumber());
        }

        // Verify order status is PENDING
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new PaymentProcessingException("Order is not in PENDING status: " + order.getStatus());
        }

        // Verify amounts match
        if (order.getTotalAmount().compareTo(paymentMessage.getTotalAmount()) != 0) {
            throw new PaymentProcessingException(
                    String.format("Order amount mismatch: order=%s, message=%s", 
                            order.getTotalAmount(), paymentMessage.getTotalAmount()));
        }

        LOG.debugf("Order validation passed: %s", order.getOrderNumber());
    }

    /**
     * Processes payment via Stripe.
     * 
     * <p>Note: This is a simplified implementation. In a production system:
     * <ul>
     *   <li>The payment intent would be created by the frontend via PaymentController</li>
     *   <li>The paymentIntentId would be stored in the order or passed in PaymentMessage</li>
     *   <li>This lambda would retrieve and confirm the existing payment intent</li>
     * </ul>
     * 
     * <p>Current implementation creates a new payment intent and confirms it.
     * This is a placeholder until the full payment flow is implemented.
     * 
     * @param paymentMessage the payment message
     * @return true if payment succeeded, false otherwise
     */
    private boolean processStripePayment(PaymentMessage paymentMessage) {
        try {
            // TODO: In production, retrieve paymentIntentId from order or PaymentMessage
            // For now, create a new payment intent (this is a simplified implementation)
            String clientSecret = stripeService.createPaymentIntent(paymentMessage.getTotalAmount());
            
            // Extract payment intent ID from client secret (format: pi_xxx_secret_yyy)
            // Client secret format: "pi_xxx_secret_yyy" where "pi_xxx" is the payment intent ID
            String paymentIntentId = null;
            if (clientSecret != null && clientSecret.contains("_secret_")) {
                paymentIntentId = clientSecret.substring(0, clientSecret.indexOf("_secret_"));
            }
            
            if (paymentIntentId == null) {
                LOG.errorf("Could not extract payment intent ID from client secret for order: %s", 
                        paymentMessage.getOrderNumber());
                return false;
            }
            
            // Confirm the payment intent
            boolean confirmed = stripeService.confirmPaymentIntent(paymentIntentId);
            
            if (confirmed) {
                LOG.infof("Payment confirmed successfully for order: %s, paymentIntentId: %s", 
                        paymentMessage.getOrderNumber(), paymentIntentId);
            } else {
                LOG.warnf("Payment confirmation failed for order: %s, paymentIntentId: %s", 
                        paymentMessage.getOrderNumber(), paymentIntentId);
            }
            
            return confirmed;
            
        } catch (Exception e) {
            LOG.errorf(e, "Error processing Stripe payment for order: %s", paymentMessage.getOrderNumber());
            return false;
        }
    }

    /**
     * Updates order status.
     * 
     * @param orderId the order ID
     * @param status the new status
     */
    private void updateOrderStatus(UUID orderId, OrderStatus status) {
        orderRepository.updateOrderStatus(orderId, status);
        LOG.debugf("Updated order status: orderId=%s, status=%s", orderId, status);
    }

    /**
     * Assigns tickets to the user (updates purchaser and status to SOLD).
     * 
     * @param order the order containing items
     */
    private void assignTickets(OrderEntity order) {
        for (OrderItemEntity orderItem : order.getOrderItems()) {
            UUID ticketId = orderItem.getTicketId();
            Integer quantity = orderItem.getQuantity();

            // For each quantity, we need to find and assign tickets
            // Note: In a real scenario, multiple tickets might be created for quantity > 1
            // For simplicity, we'll update the ticket referenced by orderItem
            TicketEntity ticket = ticketRepository.find("id", ticketId)
                    .firstResultOptional()
                    .orElseThrow(() -> new RuntimeException("Ticket not found: " + ticketId));

            // Update ticket purchaser and status
            ticket.setPurchaserId(order.getUserId());
            ticket.setTicketStatus(TicketStatus.SOLD);
            ticketRepository.persistAndFlush(ticket);

            LOG.debugf("Assigned ticket %s to user %s for order %s (quantity: %d)", 
                    ticketId, order.getUserId(), order.getOrderNumber(), quantity);
        }

        LOG.infof("Assigned tickets for order: %s", order.getOrderNumber());
    }

    /**
     * Releases reserved tickets (rollback on payment failure).
     * 
     * @param order the order containing items
     */
    private void releaseTickets(OrderEntity order) {
        ticketRepository.releaseTicketsByOrderId(order.getId());
        LOG.infof("Released tickets for order: %s", order.getOrderNumber());
    }

    /**
     * Handles payment failure: updates order status and releases tickets.
     * 
     * @param order the order that failed
     */
    private void handlePaymentFailure(OrderEntity order) {
        // Update order status to CANCELLED
        updateOrderStatus(order.getId(), OrderStatus.CANCELLED);
        
        // Release reserved tickets
        releaseTickets(order);
        
        // Publish failure notification
        publishNotificationMessage(order, NotificationType.PAYMENT_FAILED);
    }

    /**
     * Publishes a notification message to the notification queue.
     * 
     * @param order the order entity
     * @param messageType the notification message type enum
     */
    private void publishNotificationMessage(OrderEntity order, NotificationType messageType) {
        try {
            NotificationMessage notificationMessage = createNotificationMessage(order, messageType);
            sqsPublisher.publishNotificationMessage(notificationMessage);
            LOG.debugf("Published notification message: type=%s, order=%s", messageType, order.getOrderNumber());
        } catch (Exception e) {
            LOG.errorf(e, "Error publishing notification message for order: %s", order.getOrderNumber());
            // Don't throw - notification failure shouldn't fail payment processing
        }
    }

    /**
     * Creates a notification message from an order.
     * 
     * @param order the order entity
     * @param messageType the notification message type enum
     * @return NotificationMessage
     */
    private NotificationMessage createNotificationMessage(OrderEntity order, NotificationType messageType) {
        NotificationMessage message = new NotificationMessage();
        message.setMessageId(UUID.randomUUID());
        message.setMessageType(messageType.name()); // Convert enum to string
        message.setTimestamp(LocalDateTime.now());
        message.setSource("payment-processor");

        NotificationMessage.NotificationPayload payload = new NotificationMessage.NotificationPayload();
        payload.setUserId(order.getUserId());
        payload.setOrderId(order.getId());
        payload.setOrderNumber(order.getOrderNumber());
        payload.setDeliveryTypes(Arrays.asList("EMAIL", "SMS", "IN_APP"));

        // Template data for email/SMS
        Map<String, Object> templateData = new HashMap<>();
        templateData.put("orderNumber", order.getOrderNumber());
        templateData.put("totalAmount", order.getTotalAmount());
        payload.setTemplateData(templateData);

        message.setPayload(payload);
        return message;
    }

    /**
     * Exception thrown when payment processing fails.
     */
    public static class PaymentProcessingException extends Exception {
        public PaymentProcessingException(String message) {
            super(message);
        }

        public PaymentProcessingException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}

