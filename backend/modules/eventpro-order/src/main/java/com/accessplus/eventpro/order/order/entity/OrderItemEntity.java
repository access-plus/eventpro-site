package com.accessplus.eventpro.order.order.entity;

import com.accessplus.eventpro.core.common.model.BaseEntity;
import com.accessplus.eventpro.event.ticket.entity.TicketEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Order item entity representing individual items within an order.
 * 
 * <p>Fields match the database schema from V1__create_base_tables.sql:
 * <ul>
 *   <li>id (UUID, PK) - From BaseEntity</li>
 *   <li>quantity (Integer, not null) - Number of tickets</li>
 *   <li>price (BigDecimal, not null) - Price per ticket at time of purchase</li>
 *   <li>createdAt (LocalDateTime) - From BaseEntity</li>
 *   <li>updatedAt (LocalDateTime) - From BaseEntity</li>
 * </ul>
 * 
 * <p>Relationships:
 * <ul>
 *   <li>Many-to-One: order (OrderEntity) - Order this item belongs to</li>
 *   <li>One-to-One: ticket (TicketEntity) - Ticket associated with this order item</li>
 * </ul>
 * 
 * <p>Validation Rules:
 * <ul>
 *   <li>Quantity must be > 0</li>
 *   <li>Price must be >= 0</li>
 *   <li>Price should match ticket price at time of order (enforced by business logic)</li>
 * </ul>
 * 
 * <p>Indexes (from V1__create_base_tables.sql):
 * <ul>
 *   <li>idx_order_item_order on order_id</li>
 *   <li>idx_order_item_ticket on ticket_id</li>
 * </ul>
 */
@Entity
@Table(name = "order_item", indexes = {
    @Index(name = "idx_order_item_order", columnList = "order_id"),
    @Index(name = "idx_order_item_ticket", columnList = "ticket_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemEntity extends BaseEntity {

    /**
     * Number of tickets in this order item.
     * Must be greater than 0.
     */
    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    /**
     * Price per ticket at the time of purchase.
     * This is stored to preserve the price even if ticket price changes later.
     * Must be non-negative.
     */
    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", message = "Price must be non-negative")
    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    /**
     * Order this item belongs to.
     * Many order items can belong to one order.
     */
    @NotNull(message = "Order is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false, foreignKey = @ForeignKey(name = "fk_order_item_order"))
    private OrderEntity order;

    /**
     * Ticket associated with this order item.
     * One order item references one ticket.
     */
    @NotNull(message = "Ticket is required")
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", nullable = false, foreignKey = @ForeignKey(name = "fk_order_item_ticket"))
    private TicketEntity ticket;
}

