package com.accessplus.eventpro.order.cart.entity;

import com.accessplus.eventpro.shared.entity.BaseEntity;
import com.accessplus.eventpro.core.user.entity.UserEntity;
import com.accessplus.eventpro.shared.entity.TicketEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Entity
@Table(name = "carts", indexes = {
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

