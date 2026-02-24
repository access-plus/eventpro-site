package com.accessplus.eventpro.event.ticket.service;

import com.accessplus.eventpro.shared.entity.TicketEntity;
import com.accessplus.eventpro.shared.enums.TicketType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface TicketService {

    List<TicketEntity> createTickets(
            UUID eventId,
            UUID creatorId,
            TicketType ticketType,
            BigDecimal price,
            int quantity,
            String name,
            LocalDateTime startTime,
            LocalDateTime endTime);

    TicketEntity updateTicket(
            UUID ticketId,
            String name,
            BigDecimal price,
            TicketType ticketType,
            LocalDateTime startTime,
            LocalDateTime endTime,
            String printOutUrl);

    void deleteTicket(UUID ticketId);

    TicketEntity getTicketById(UUID ticketId);

    Page<TicketEntity> getTicketsByEvent(UUID eventId, Pageable pageable);

    Map<TicketType, List<TicketEntity>> groupTicketsByType(UUID eventId);

    Map<TicketType, Long> checkTicketAvailability(UUID eventId);

    TicketEntity markTicketAsSold(UUID ticketId, UUID purchaserId) throws java.io.IOException;

    void markTicketAsReserved(UUID ticketId);

    void checkInTicket(UUID ticketId);

    void markTicketAsAvailable(UUID ticketId);
}

