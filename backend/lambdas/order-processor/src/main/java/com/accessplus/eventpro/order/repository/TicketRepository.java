package com.accessplus.eventpro.order.repository;

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
     * Finds all available tickets for a specific event.
     */
    public List<TicketEntity> findAvailableTicketsByEventId(UUID eventId) {
        return find("eventId = ?1 AND ticketStatus = ?2", eventId, TicketStatus.AVAILABLE).list();
    }

    /**
     * Counts available tickets for an event.
     */
    public long countAvailableTicketsByEventId(UUID eventId) {
        return count("eventId = ?1 AND ticketStatus = ?2", eventId, TicketStatus.AVAILABLE);
    }

    /**
     * Updates ticket status to RESERVED.
     */
    public void reserveTicket(UUID ticketId) {
        update("ticketStatus = ?1 WHERE id = ?2", TicketStatus.RESERVED, ticketId);
    }

    /**
     * Updates ticket status back to AVAILABLE (for rollback).
     */
    public void releaseTicket(UUID ticketId) {
        update("ticketStatus = ?1 WHERE id = ?2", TicketStatus.AVAILABLE, ticketId);
    }


    /**
     * Finds tickets by IDs.
     */
    public List<TicketEntity> findByIds(List<UUID> ticketIds) {
        return find("id IN (?1)", ticketIds).list();
    }
}

