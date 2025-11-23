package com.accessplus.eventpro.order.order.entity;

/**
 * Enum representing the status of an order.
 * 
 * <p>Values match the PostgreSQL enum type 'order_status' from V1__create_base_tables.sql:
 * <ul>
 *   <li>PENDING - Order created but payment not yet processed</li>
 *   <li>PAID - Order payment successful</li>
 *   <li>CANCELLED - Order cancelled (payment failed or user cancelled)</li>
 *   <li>REFUNDED - Order refunded after payment</li>
 * </ul>
 * 
 * <p>State Transitions:
 * <ul>
 *   <li>PENDING → PAID (when payment successful)</li>
 *   <li>PENDING → CANCELLED (when order cancelled or payment failed)</li>
 *   <li>PAID → REFUNDED (when refund processed)</li>
 * </ul>
 */
public enum OrderStatus {
    PENDING,
    PAID,
    CANCELLED,
    REFUNDED
}

