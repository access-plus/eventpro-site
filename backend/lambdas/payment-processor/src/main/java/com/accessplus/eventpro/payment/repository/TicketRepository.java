package com.accessplus.eventpro.payment.repository;

import com.accessplus.eventpro.shared.entity.TicketEntity;
import com.accessplus.eventpro.shared.enums.TicketStatus;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.UUID;

/**
 * Repository for TicketEntity using Quarkus Panache.
 */
@ApplicationScoped
public class TicketRepository implements PanacheRepository<TicketEntity> {

    /**
     * Finds tickets by order ID (through order items).
     * Note: This requires joining with order_items table.
     */
    public List<TicketEntity> findByOrderId(UUID orderId) {
        return find("SELECT t FROM TicketEntity t INNER JOIN OrderItemEntity oi ON t.id = oi.ticketId WHERE oi.orderId = ?1", orderId)
                .list();
    }

    /**
     * Updates ticket purchaser.
     */
    public void updateTicketPurchaser(UUID ticketId, UUID userId) {
        update("purchaserId = ?1 WHERE id = ?2", userId, ticketId);
    }

    /**
     * Updates ticket status.
     */
    public void updateTicketStatus(UUID ticketId, TicketStatus status) {
        update("ticketStatus = ?1 WHERE id = ?2", status, ticketId);
    }

    /**
     * Releases tickets by order ID (sets status back to AVAILABLE).
     */
    public void releaseTicketsByOrderId(UUID orderId) {
        List<TicketEntity> tickets = findByOrderId(orderId);
        for (TicketEntity ticket : tickets) {
            ticket.setTicketStatus(TicketStatus.AVAILABLE);
            ticket.setPurchaserId(null);
            persist(ticket);
        }
        flush();
    }
}

