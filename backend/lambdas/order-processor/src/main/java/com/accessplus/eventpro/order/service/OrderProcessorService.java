package com.accessplus.eventpro.order.service;

import com.accessplus.eventpro.shared.entity.OrderEntity;
import com.accessplus.eventpro.shared.entity.OrderItemEntity;
import com.accessplus.eventpro.shared.enums.OrderStatus;
import com.accessplus.eventpro.shared.entity.TicketEntity;
import com.accessplus.eventpro.shared.enums.TicketStatus;
import com.accessplus.eventpro.shared.model.OrderMessage;
import com.accessplus.eventpro.shared.model.PaymentMessage;
import com.accessplus.eventpro.order.repository.OrderRepository;
import com.accessplus.eventpro.order.repository.TicketRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Service for processing orders from SQS messages.
 * Validates orders, reserves tickets, and publishes to payment queue.
 */
@ApplicationScoped
public class OrderProcessorService {

    private static final Logger LOG = Logger.getLogger(OrderProcessorService.class);

    @Inject
    OrderRepository orderRepository;

    @Inject
    TicketRepository ticketRepository;

    @Inject
    SQSPublisher sqsPublisher;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Processes an order message from SQS.
     * 
     * @param messageBody JSON string containing OrderMessage
     * @throws OrderProcessingException if order validation or processing fails
     */
    @Transactional
    public void processOrder(String messageBody) throws OrderProcessingException {
        try {
            // Parse order message
            OrderMessage orderMessage = objectMapper.readValue(messageBody, OrderMessage.class);
            LOG.infof("Processing order: %s (Order ID: %s)", orderMessage.getOrderNumber(), orderMessage.getOrderId());

            // Load order with items
            OrderEntity order = orderRepository.findByIdWithItems(orderMessage.getOrderId())
                    .orElseThrow(() -> new OrderProcessingException("Order not found: " + orderMessage.getOrderId()));

            // Validate order
            validateOrder(order);

            // Check ticket availability and reserve tickets
            List<UUID> reservedTicketIds = reserveTickets(order);

            try {
            // Update order status to PENDING
            order.setStatus(OrderStatus.PENDING);
            orderRepository.persistAndFlush(order);

                // Publish to payment queue
                PaymentMessage paymentMessage = createPaymentMessage(order);
                sqsPublisher.publishPaymentMessage(paymentMessage);

                LOG.infof("Order %s validated and published to payment queue", order.getOrderNumber());
            } catch (Exception e) {
                // Rollback ticket reservations on error
                LOG.errorf(e, "Error after ticket reservation, rolling back tickets for order: %s", order.getOrderNumber());
                releaseTickets(reservedTicketIds);
                throw new OrderProcessingException("Failed to process order after ticket reservation", e);
            }

        } catch (OrderProcessingException e) {
            throw e;
        } catch (Exception e) {
            LOG.errorf(e, "Unexpected error processing order message");
            throw new OrderProcessingException("Unexpected error processing order", e);
        }
    }

    /**
     * Validates the order before processing.
     * 
     * @param order the order to validate
     * @throws OrderProcessingException if validation fails
     */
    private void validateOrder(OrderEntity order) throws OrderProcessingException {
        if (order == null) {
            throw new OrderProcessingException("Order is null");
        }

        if (order.getOrderItems() == null || order.getOrderItems().isEmpty()) {
            throw new OrderProcessingException("Order has no items: " + order.getOrderNumber());
        }

        // Check if order is already processed
        if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != null) {
            throw new OrderProcessingException("Order already processed with status: " + order.getStatus());
        }

        LOG.debugf("Order validation passed: %s", order.getOrderNumber());
    }

    /**
     * Reserves tickets for the order items.
     * 
     * @param order the order containing items
     * @return list of reserved ticket IDs
     * @throws OrderProcessingException if tickets are not available
     */
    private List<UUID> reserveTickets(OrderEntity order) throws OrderProcessingException {
        List<UUID> reservedTicketIds = new ArrayList<>();

        for (OrderItemEntity orderItem : order.getOrderItems()) {
            UUID ticketId = orderItem.getTicketId();
            Integer quantity = orderItem.getQuantity();

            // Load ticket
            TicketEntity ticket = ticketRepository.find("id", ticketId)
                    .firstResultOptional()
                    .orElseThrow(() -> new OrderProcessingException("Ticket not found: " + ticketId));

            // Check availability
            if (ticket.getTicketStatus() != TicketStatus.AVAILABLE) {
                throw new OrderProcessingException(
                        String.format("Ticket %s is not available (status: %s)", ticketId, ticket.getTicketStatus()));
            }

            // Reserve ticket
            ticket.setTicketStatus(TicketStatus.RESERVED);
            ticketRepository.persistAndFlush(ticket);
            reservedTicketIds.add(ticketId);

            LOG.debugf("Reserved ticket %s for order %s (quantity: %d)", ticketId, order.getOrderNumber(), quantity);
        }

        LOG.infof("Reserved %d tickets for order %s", reservedTicketIds.size(), order.getOrderNumber());
        return reservedTicketIds;
    }

    /**
     * Releases reserved tickets (rollback).
     * 
     * @param ticketIds list of ticket IDs to release
     */
    private void releaseTickets(List<UUID> ticketIds) {
        for (UUID ticketId : ticketIds) {
            try {
                ticketRepository.releaseTicket(ticketId);
                LOG.debugf("Released ticket: %s", ticketId);
            } catch (Exception e) {
                LOG.errorf(e, "Error releasing ticket: %s", ticketId);
            }
        }
    }

    /**
     * Creates a payment message from the order.
     * 
     * @param order the order entity
     * @return payment message for SQS
     */
    private PaymentMessage createPaymentMessage(OrderEntity order) {
        PaymentMessage message = new PaymentMessage();
        message.setOrderId(order.getId());
        message.setOrderNumber(order.getOrderNumber());
        message.setUserId(order.getUserId());
        message.setTotalAmount(order.getTotalAmount());
        return message;
    }

    /**
     * Exception thrown when order processing fails.
     */
    public static class OrderProcessingException extends Exception {
        public OrderProcessingException(String message) {
            super(message);
        }

        public OrderProcessingException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}

