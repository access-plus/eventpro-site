package com.accessplus.eventpro.event.ticket.repository;

import com.accessplus.eventpro.event.event.entity.EventEntity;
import com.accessplus.eventpro.event.ticket.entity.TicketEntity;
import com.accessplus.eventpro.event.ticket.entity.TicketStatus;
import com.accessplus.eventpro.event.ticket.entity.TicketType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository interface for TicketEntity.
 * Provides standard CRUD operations and custom query methods.
 */
@Repository
public interface TicketRepository extends JpaRepository<TicketEntity, UUID> {

    /**
     * Finds all tickets for a specific event.
     * 
     * @param event the event entity
     * @param pageable pagination parameters
     * @return Page of tickets for the event
     */
    Page<TicketEntity> findByEvent(EventEntity event, Pageable pageable);

    /**
     * Finds all tickets for a specific event by event ID.
     * 
     * @param eventId the event UUID
     * @param pageable pagination parameters
     * @return Page of tickets for the event
     */
    @Query("SELECT t FROM TicketEntity t WHERE t.event.id = :eventId")
    Page<TicketEntity> findByEventId(@Param("eventId") UUID eventId, Pageable pageable);

    /**
     * Finds all tickets with a specific status.
     * 
     * @param status the ticket status
     * @param pageable pagination parameters
     * @return Page of tickets with the status
     */
    Page<TicketEntity> findByTicketStatus(TicketStatus status, Pageable pageable);

    /**
     * Finds all tickets for a specific event and ticket type.
     * 
     * @param event the event entity
     * @param ticketType the ticket type
     * @param pageable pagination parameters
     * @return Page of tickets matching the criteria
     */
    Page<TicketEntity> findByEventAndTicketType(EventEntity event, TicketType ticketType, Pageable pageable);

    /**
     * Finds all tickets for a specific event and ticket type by IDs.
     * 
     * @param eventId the event UUID
     * @param ticketType the ticket type
     * @param pageable pagination parameters
     * @return Page of tickets matching the criteria
     */
    @Query("SELECT t FROM TicketEntity t WHERE t.event.id = :eventId AND t.ticketType = :ticketType")
    Page<TicketEntity> findByEventIdAndTicketType(
            @Param("eventId") UUID eventId,
            @Param("ticketType") TicketType ticketType,
            Pageable pageable);

    /**
     * Finds all available tickets for a specific event.
     * 
     * @param eventId the event UUID
     * @return List of available tickets
     */
    @Query("SELECT t FROM TicketEntity t WHERE t.event.id = :eventId AND t.ticketStatus = 'AVAILABLE'")
    List<TicketEntity> findAvailableTicketsByEventId(@Param("eventId") UUID eventId);

    /**
     * Counts tickets by event and status.
     * 
     * @param eventId the event UUID
     * @param status the ticket status
     * @return count of tickets matching the criteria
     */
    @Query("SELECT COUNT(t) FROM TicketEntity t WHERE t.event.id = :eventId AND t.ticketStatus = :status")
    long countByEventIdAndStatus(@Param("eventId") UUID eventId, @Param("status") TicketStatus status);
}

