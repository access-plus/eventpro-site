package com.accessplus.eventpro.event.ticket.repository;

import com.accessplus.eventpro.shared.entity.TicketEntity;
import com.accessplus.eventpro.shared.enums.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface TicketRepository extends JpaRepository<TicketEntity, UUID>, TicketRepositoryCustom {

    @Query("SELECT t FROM TicketEntity t WHERE t.eventId = :eventId")
    Page<TicketEntity> findByEventId(@Param("eventId") UUID eventId, Pageable pageable);

    Page<TicketEntity> findByTicketStatus(TicketStatus status, Pageable pageable);

    @Query(value = "SELECT * FROM tickets WHERE event_id = :eventId AND CAST(ticket_type AS text) = :ticketType", nativeQuery = true)
    Page<TicketEntity> findByEventIdAndTicketType(
            @Param("eventId") UUID eventId,
            @Param("ticketType") String ticketType,
            Pageable pageable);

    @Query("SELECT t FROM TicketEntity t WHERE t.eventId = :eventId AND t.ticketStatus = 'AVAILABLE'")
    List<TicketEntity> findAvailableTicketsByEventId(@Param("eventId") UUID eventId);

    @Query("SELECT t FROM TicketEntity t WHERE t.eventId = :eventId AND t.ticketType = :ticketType AND t.ticketStatus = 'AVAILABLE'")
    List<TicketEntity> findAvailableByEventIdAndType(@Param("eventId") UUID eventId, @Param("ticketType") TicketType ticketType, Pageable pageable);

    @Query("SELECT COUNT(t) FROM TicketEntity t WHERE t.eventId = :eventId AND t.ticketStatus = :status")
    long countByEventIdAndStatus(@Param("eventId") UUID eventId, @Param("status") TicketStatus status);

    long countByTicketStatus(TicketStatus status);

    /** RESERVED tickets whose reserved_until is before the given time (expired). */
    @Query("SELECT t FROM TicketEntity t WHERE t.ticketStatus = 'RESERVED' AND t.reservedUntil IS NOT NULL AND t.reservedUntil < :before")
    List<TicketEntity> findReservedWithExpiredHold(@Param("before") LocalDateTime before);
}

