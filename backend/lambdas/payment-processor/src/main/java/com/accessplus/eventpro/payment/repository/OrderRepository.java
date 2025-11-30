package com.accessplus.eventpro.payment.repository;

import com.accessplus.eventpro.shared.entity.OrderEntity;
import com.accessplus.eventpro.shared.enums.OrderStatus;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository for OrderEntity using Quarkus Panache.
 */
@ApplicationScoped
public class OrderRepository implements PanacheRepository<OrderEntity> {

    /**
     * Finds an order by ID with order items loaded.
     */
    public Optional<OrderEntity> findByIdWithItems(UUID orderId) {
        return find("SELECT o FROM OrderEntity o LEFT JOIN FETCH o.orderItems WHERE o.id = ?1", orderId)
                .firstResultOptional();
    }

    /**
     * Updates order status.
     */
    public void updateOrderStatus(UUID orderId, OrderStatus status) {
        update("status = ?1 WHERE id = ?2", status, orderId);
    }
}

