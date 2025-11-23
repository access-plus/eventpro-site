package com.accessplus.eventpro.order.order.service.impl;

import com.accessplus.eventpro.core.common.exception.ResourceNotFoundException;
import com.accessplus.eventpro.core.common.exception.ValidationException;
import com.accessplus.eventpro.core.messaging.sqs.SQSMessagePublisher;
import com.accessplus.eventpro.core.user.entity.UserEntity;
import com.accessplus.eventpro.core.user.repository.UserRepository;
import com.accessplus.eventpro.event.ticket.entity.TicketEntity;
import com.accessplus.eventpro.order.cart.entity.CartEntity;
import com.accessplus.eventpro.order.cart.service.CartService;
import com.accessplus.eventpro.order.order.entity.OrderEntity;
import com.accessplus.eventpro.order.order.entity.OrderItemEntity;
import com.accessplus.eventpro.order.order.entity.OrderStatus;
import com.accessplus.eventpro.order.order.repository.OrderRepository;
import com.accessplus.eventpro.order.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Implementation of OrderService.
 * Handles order creation, retrieval, and status management with SQS integration.
 * 
 * <p>Features:
 * <ul>
 *   <li>Create orders from cart items</li>
 *   <li>Generate unique order numbers</li>
 *   <li>Publish orders to SQS for asynchronous processing</li>
 *   <li>Retrieve orders by ID or user</li>
 *   <li>Update order status with validation</li>
 *   <li>Order validation and error handling</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final CartService cartService;
    private final UserRepository userRepository;
    private final SQSMessagePublisher sqsMessagePublisher;

    private static final DateTimeFormatter ORDER_NUMBER_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd");

    /**
     * Creates an order from the user's cart.
     */
    @Override
    public OrderEntity createOrderFromCart(UUID userId) {
        log.debug("Creating order from cart: userId={}", userId);

        // Validate and fetch user
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId.toString()));

        // Get user's cart
        List<CartEntity> cartItems = cartService.getUserCart(userId);
        if (cartItems == null || cartItems.isEmpty()) {
            throw new ValidationException("Cannot create order from empty cart");
        }

        // Calculate total amount
        BigDecimal totalAmount = cartService.calculateCartTotal(userId);
        if (totalAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ValidationException("Order total must be greater than 0");
        }

        // Generate unique order number
        String orderNumber = generateOrderNumber();

        // Create order entity
        OrderEntity order = new OrderEntity();
        order.setOrderNumber(orderNumber);
        order.setTotalAmount(totalAmount);
        order.setStatus(OrderStatus.PENDING);
        order.setOrderDate(LocalDateTime.now());
        order.setUser(user);
        order.setOrderItems(new ArrayList<>());

        // Convert cart items to order items
        for (CartEntity cartItem : cartItems) {
            TicketEntity ticket = cartItem.getTicket();
            if (ticket == null) {
                log.warn("Cart item has null ticket, skipping: cartItemId={}", cartItem.getId());
                continue;
            }

            OrderItemEntity orderItem = new OrderItemEntity();
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setPrice(ticket.getPrice()); // Store price at time of order
            orderItem.setOrder(order);
            orderItem.setTicket(ticket);

            order.getOrderItems().add(orderItem);
        }

        // Validate order has items
        if (order.getOrderItems().isEmpty()) {
            throw new ValidationException("Cannot create order with no valid items");
        }

        // Save order (cascade will save order items)
        OrderEntity savedOrder = orderRepository.save(order);
        log.info("Created order: orderId={}, orderNumber={}, totalAmount={}, itemCount={}", 
                savedOrder.getId(), orderNumber, totalAmount, order.getOrderItems().size());

        // Publish order to SQS queue
        try {
            publishOrderToSQS(savedOrder);
            log.info("Published order to SQS: orderId={}, orderNumber={}", savedOrder.getId(), orderNumber);
        } catch (Exception e) {
            log.error("Failed to publish order to SQS: orderId={}, error={}", 
                    savedOrder.getId(), e.getMessage(), e);
            // Continue - order is created even if SQS publish fails
            // SQS publish failure can be handled by retry mechanism or manual processing
        }

        // Clear cart after successful order creation
        try {
            cartService.clearCart(userId);
            log.info("Cleared cart after order creation: userId={}", userId);
        } catch (Exception e) {
            log.error("Failed to clear cart after order creation: userId={}, error={}", 
                    userId, e.getMessage(), e);
            // Continue - order is created even if cart clear fails
            // Cart can be cleared manually if needed
        }

        return savedOrder;
    }

    /**
     * Retrieves an order by ID.
     */
    @Override
    @Transactional(readOnly = true)
    public OrderEntity getOrderById(UUID orderId) {
        log.debug("Getting order by ID: {}", orderId);

        return orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId.toString()));
    }

    /**
     * Retrieves all orders for a user with pagination.
     */
    @Override
    @Transactional(readOnly = true)
    public Page<OrderEntity> getUserOrders(UUID userId, Pageable pageable) {
        log.debug("Getting user orders: userId={}, page={}, size={}", 
                userId, pageable.getPageNumber(), pageable.getPageSize());

        // Validate user exists
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User", userId.toString());
        }

        return orderRepository.findByUserId(userId, pageable);
    }

    /**
     * Updates the status of an order.
     */
    @Override
    public OrderEntity updateOrderStatus(UUID orderId, OrderStatus newStatus) {
        log.debug("Updating order status: orderId={}, newStatus={}", orderId, newStatus);

        // Fetch order
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId.toString()));

        // Store old status for logging
        OrderStatus oldStatus = order.getStatus();

        // Validate status transition
        validateStatusTransition(oldStatus, newStatus);

        // Update status
        order.setStatus(newStatus);
        OrderEntity updatedOrder = orderRepository.save(order);

        log.info("Updated order status: orderId={}, oldStatus={}, newStatus={}", 
                orderId, oldStatus, newStatus);

        return updatedOrder;
    }

    /**
     * Generates a unique order number.
     * Format: "ORD-{YYYYMMDD}-{random6digits}"
     */
    @Override
    public String generateOrderNumber() {
        String datePrefix = LocalDateTime.now().format(ORDER_NUMBER_DATE_FORMAT);
        String randomSuffix = String.format("%06d", ThreadLocalRandom.current().nextInt(0, 1000000));
        String orderNumber = String.format("ORD-%s-%s", datePrefix, randomSuffix);

        // Ensure uniqueness (retry if exists)
        int maxRetries = 10;
        int retries = 0;
        while (orderRepository.existsByOrderNumber(orderNumber) && retries < maxRetries) {
            randomSuffix = String.format("%06d", ThreadLocalRandom.current().nextInt(0, 1000000));
            orderNumber = String.format("ORD-%s-%s", datePrefix, randomSuffix);
            retries++;
        }

        if (retries >= maxRetries) {
            // Fallback: use UUID suffix if random generation fails
            orderNumber = String.format("ORD-%s-%s", datePrefix, UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }

        log.debug("Generated order number: {}", orderNumber);
        return orderNumber;
    }

    /**
     * Publishes order to SQS queue for asynchronous processing.
     * Message format follows the SQS contract specification.
     */
    private void publishOrderToSQS(OrderEntity order) {
        Map<String, Object> message = new HashMap<>();
        message.put("messageId", UUID.randomUUID().toString());
        message.put("messageType", "ORDER_CREATED");
        message.put("timestamp", LocalDateTime.now().toString());
        message.put("source", "core-api");

        Map<String, Object> payload = new HashMap<>();
        payload.put("orderId", order.getId().toString());
        payload.put("orderNumber", order.getOrderNumber());
        payload.put("userId", order.getUser().getId().toString());
        payload.put("totalAmount", order.getTotalAmount().doubleValue());
        payload.put("orderDate", order.getOrderDate().toString());

        // Build order items payload
        List<Map<String, Object>> orderItemsPayload = new ArrayList<>();
        for (OrderItemEntity orderItem : order.getOrderItems()) {
            Map<String, Object> itemPayload = new HashMap<>();
            itemPayload.put("ticketId", orderItem.getTicket().getId().toString());
            itemPayload.put("quantity", orderItem.getQuantity());
            itemPayload.put("price", orderItem.getPrice().doubleValue());
            itemPayload.put("ticketType", orderItem.getTicket().getTicketType().name());
            orderItemsPayload.add(itemPayload);
        }
        payload.put("orderItems", orderItemsPayload);

        message.put("payload", payload);

        // Publish to SQS
        sqsMessagePublisher.publishOrderMessage(message);
    }

    /**
     * Validates order status transitions.
     * 
     * <p>Valid transitions:
     * <ul>
     *   <li>PENDING → PAID</li>
     *   <li>PENDING → CANCELLED</li>
     *   <li>PAID → REFUNDED</li>
     * </ul>
     * 
     * @param currentStatus current order status
     * @param newStatus new order status
     * @throws IllegalStateException if transition is invalid
     */
    private void validateStatusTransition(OrderStatus currentStatus, OrderStatus newStatus) {
        if (currentStatus == newStatus) {
            return; // No change, valid
        }

        switch (currentStatus) {
            case PENDING:
                if (newStatus != OrderStatus.PAID && newStatus != OrderStatus.CANCELLED) {
                    throw new IllegalStateException(
                            String.format("Invalid status transition from PENDING to %s. " +
                                    "PENDING can only transition to PAID or CANCELLED.", newStatus));
                }
                break;
            case PAID:
                if (newStatus != OrderStatus.REFUNDED) {
                    throw new IllegalStateException(
                            String.format("Invalid status transition from PAID to %s. " +
                                    "PAID can only transition to REFUNDED.", newStatus));
                }
                break;
            case CANCELLED:
                throw new IllegalStateException(
                        "Cannot change status of a CANCELLED order.");
            case REFUNDED:
                throw new IllegalStateException(
                        "Cannot change status of a REFUNDED order.");
            default:
                throw new IllegalStateException(
                        String.format("Unknown order status: %s", currentStatus));
        }
    }
}

