package com.accessplus.eventpro.order.order.entity;

import com.accessplus.eventpro.core.common.model.BaseEntity;
import com.accessplus.eventpro.core.user.entity.UserEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Order entity representing customer orders.
 * 
 * <p>Fields match the database schema from V1__create_base_tables.sql:
 * <ul>
 *   <li>id (UUID, PK) - From BaseEntity</li>
 *   <li>orderNumber (String, unique, not null) - Human-readable order number</li>
 *   <li>totalAmount (BigDecimal, not null) - Total order amount</li>
 *   <li>status (OrderStatus enum, not null) - PENDING, PAID, CANCELLED, REFUNDED</li>
 *   <li>orderDate (LocalDateTime, not null) - When order was created</li>
 *   <li>createdAt (LocalDateTime) - From BaseEntity</li>
 *   <li>updatedAt (LocalDateTime) - From BaseEntity</li>
 * </ul>
 * 
 * <p>Relationships:
 * <ul>
 *   <li>Many-to-One: user (UserEntity) - User who placed the order</li>
 *   <li>One-to-Many: orderItems (List&lt;OrderItemEntity&gt;) - Items in the order</li>
 *   <li>One-to-One: payment (PaymentEntity, nullable) - Payment associated with order</li>
 * </ul>
 * 
 * <p>Validation Rules:
 * <ul>
 *   <li>Order number must be unique and not null</li>
 *   <li>Total amount must be >= 0</li>
 *   <li>Order date cannot be null</li>
 * </ul>
 * 
 * <p>State Transitions:
 * <ul>
 *   <li>PENDING → PAID (when payment successful)</li>
 *   <li>PENDING → CANCELLED (when order cancelled or payment failed)</li>
 *   <li>PAID → REFUNDED (when refund processed)</li>
 * </ul>
 * 
 * <p>Indexes (from V1__create_base_tables.sql):
 * <ul>
 *   <li>idx_order_user on user_id</li>
 *   <li>idx_order_status on status</li>
 *   <li>idx_order_number on order_number</li>
 *   <li>idx_order_date on order_date</li>
 * </ul>
 */
@Entity
@Table(name = "order", indexes = {
    @Index(name = "idx_order_user", columnList = "user_id"),
    @Index(name = "idx_order_status", columnList = "status"),
    @Index(name = "idx_order_number", columnList = "order_number"),
    @Index(name = "idx_order_date", columnList = "order_date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrderEntity extends BaseEntity {

    /**
     * Human-readable order number (unique).
     * Format: Typically "ORD-{timestamp}-{random}" or similar.
     */
    @NotBlank(message = "Order number is required")
    @Column(name = "order_number", nullable = false, unique = true, length = 50)
    private String orderNumber;

    /**
     * Total order amount.
     * Must be non-negative.
     */
    @NotNull(message = "Total amount is required")
    @DecimalMin(value = "0.0", message = "Total amount must be non-negative")
    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    /**
     * Order status.
     * PENDING, PAID, CANCELLED, or REFUNDED.
     */
    @NotNull(message = "Order status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, columnDefinition = "order_status")
    private OrderStatus status;

    /**
     * Date and time when the order was created.
     */
    @NotNull(message = "Order date is required")
    @Column(name = "order_date", nullable = false)
    private LocalDateTime orderDate;

    /**
     * User who placed the order.
     * Many orders can belong to one user.
     */
    @NotNull(message = "User is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_order_user"))
    private UserEntity user;

    /**
     * Items in the order.
     * One order can have many order items.
     */
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<OrderItemEntity> orderItems = new ArrayList<>();

    /**
     * Payment associated with the order.
     * One order can have one payment (nullable until payment is processed).
     * Note: PaymentEntity will be created in eventpro-payment module.
     */
    // @OneToOne(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    // private PaymentEntity payment;
}

