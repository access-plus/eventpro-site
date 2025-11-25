package com.accessplus.eventpro.order.order.repository;

import com.accessplus.eventpro.shared.entity.TicketEntity;
import com.accessplus.eventpro.shared.entity.OrderEntity;
import com.accessplus.eventpro.shared.entity.OrderItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository interface for OrderItemEntity.
 * Provides standard CRUD operations and custom query methods.
 * 
 * <p>Custom query methods:
 * <ul>
 *   <li>findByOrder - Find all order items for an order</li>
 *   <li>findByTicket - Find all order items for a ticket</li>
 *   <li>findByOrderId - Find all order items for an order by order ID</li>
 * </ul>
 */
@Repository
public interface OrderItemRepository extends JpaRepository<OrderItemEntity, UUID> {

    /**
     * Finds all order items for a specific order by order ID.
     * 
     * @param orderId the order UUID
     * @return list of order items for the order
     */
    @Query("SELECT oi FROM OrderItemEntity oi WHERE oi.orderId = :orderId")
    List<OrderItemEntity> findByOrderId(@Param("orderId") UUID orderId);

    /**
     * Finds all order items for a specific ticket by ticket ID.
     * 
     * @param ticketId the ticket UUID
     * @return list of order items for the ticket
     */
    @Query("SELECT oi FROM OrderItemEntity oi WHERE oi.ticketId = :ticketId")
    List<OrderItemEntity> findByTicketId(@Param("ticketId") UUID ticketId);

    /**
     * Counts order items for a specific order.
     * 
     * @param orderId the order UUID
     * @return count of order items
     */
    @Query("SELECT COUNT(oi) FROM OrderItemEntity oi WHERE oi.orderId = :orderId")
    long countByOrderId(@Param("orderId") UUID orderId);
}

