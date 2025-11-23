package com.accessplus.eventpro.order.order.service;

import com.accessplus.eventpro.order.order.entity.OrderEntity;
import com.accessplus.eventpro.order.order.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * Service interface for order management operations.
 * 
 * <p>Provides methods for:
 * <ul>
 *   <li>Creating orders from cart</li>
 *   <li>Retrieving orders by ID or user</li>
 *   <li>Updating order status</li>
 *   <li>Generating unique order numbers</li>
 *   <li>Publishing orders to SQS for asynchronous processing</li>
 * </ul>
 */
public interface OrderService {

    /**
     * Creates an order from the user's cart.
     * Converts cart items to order items, calculates total, generates order number,
     * and publishes order to SQS queue for processing.
     * 
     * @param userId the UUID of the user
     * @return created OrderEntity
     * @throws com.accessplus.eventpro.core.common.exception.ResourceNotFoundException if user not found or cart is empty
     * @throws IllegalArgumentException if validation fails
     */
    OrderEntity createOrderFromCart(UUID userId);

    /**
     * Retrieves an order by ID.
     * 
     * @param orderId the UUID of the order
     * @return OrderEntity if found
     * @throws com.accessplus.eventpro.core.common.exception.ResourceNotFoundException if order not found
     */
    OrderEntity getOrderById(UUID orderId);

    /**
     * Retrieves all orders for a user with pagination.
     * 
     * @param userId the UUID of the user
     * @param pageable pagination and sorting parameters
     * @return Page of OrderEntity for the user
     * @throws com.accessplus.eventpro.core.common.exception.ResourceNotFoundException if user not found
     */
    Page<OrderEntity> getUserOrders(UUID userId, Pageable pageable);

    /**
     * Updates the status of an order.
     * Validates state transitions (PENDING → PAID/CANCELLED, PAID → REFUNDED).
     * 
     * @param orderId the UUID of the order
     * @param newStatus the new order status
     * @return updated OrderEntity
     * @throws com.accessplus.eventpro.core.common.exception.ResourceNotFoundException if order not found
     * @throws IllegalStateException if status transition is invalid
     */
    OrderEntity updateOrderStatus(UUID orderId, OrderStatus newStatus);

    /**
     * Generates a unique order number.
     * Format: "ORD-{YYYYMMDD}-{random6digits}"
     * 
     * @return unique order number string
     */
    String generateOrderNumber();
}

