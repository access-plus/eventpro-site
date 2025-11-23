package com.accessplus.eventpro.order.cart.entity;

import com.accessplus.eventpro.core.common.model.BaseEntity;
import com.accessplus.eventpro.core.user.entity.UserEntity;
import com.accessplus.eventpro.event.ticket.entity.TicketEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Cart entity representing items in user's shopping cart.
 * 
 * <p>Fields match the database schema from V1__create_base_tables.sql:
 * <ul>
 *   <li>id (UUID, PK) - From BaseEntity</li>
 *   <li>quantity (Integer, not null) - Number of tickets</li>
 *   <li>createdAt (LocalDateTime) - From BaseEntity</li>
 *   <li>updatedAt (LocalDateTime) - From BaseEntity</li>
 * </ul>
 * 
 * <p>Relationships:
 * <ul>
 *   <li>Many-to-One: user (UserEntity) - User who owns the cart item</li>
 *   <li>Many-to-One: ticket (TicketEntity) - Ticket being added to cart</li>
 * </ul>
 * 
 * <p>Validation Rules:
 * <ul>
 *   <li>Quantity must be > 0</li>
 *   <li>Ticket must be AVAILABLE status (enforced by business logic)</li>
 *   <li>User cannot add same ticket twice (unique constraint on user + ticket)</li>
 * </ul>
 * 
 * <p>Indexes (from V1__create_base_tables.sql):
 * <ul>
 *   <li>idx_cart_user on user_id</li>
 *   <li>idx_cart_ticket on ticket_id</li>
 * </ul>
 * 
 * <p>Unique Constraint:
 * <ul>
 *   <li>uk_cart_user_ticket on user_id, ticket_id (one cart item per user-ticket combination)</li>
 * </ul>
 */
@Entity
@Table(name = "cart", indexes = {
    @Index(name = "idx_cart_user", columnList = "user_id"),
    @Index(name = "idx_cart_ticket", columnList = "ticket_id")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_cart_user_ticket", columnNames = {"user_id", "ticket_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CartEntity extends BaseEntity {

    /**
     * Number of tickets in the cart item.
     * Must be greater than 0.
     */
    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    /**
     * User who owns this cart item.
     * Many cart items can belong to one user.
     */
    @NotNull(message = "User is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_cart_user"))
    private UserEntity user;

    /**
     * Ticket being added to cart.
     * Many cart items can reference the same ticket (different users).
     */
    @NotNull(message = "Ticket is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", nullable = false, foreignKey = @ForeignKey(name = "fk_cart_ticket"))
    private TicketEntity ticket;
}

