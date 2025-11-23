package com.accessplus.eventpro.event.ticket.service;

import com.accessplus.eventpro.event.ticket.entity.TicketEntity;
import com.accessplus.eventpro.event.ticket.entity.TicketStatus;
import com.accessplus.eventpro.event.ticket.entity.TicketType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service interface for ticket management operations.
 * 
 * <p>Provides methods for:
 * <ul>
 *   <li>Creating tickets in bulk for events</li>
 *   <li>Updating ticket information</li>
 *   <li>Deleting tickets</li>
 *   <li>Retrieving tickets by ID, event, type</li>
 *   <li>Grouping tickets by type</li>
 *   <li>Checking ticket availability</li>
 *   <li>QR code generation when tickets are sold</li>
 * </ul>
 */
public interface TicketService {

    /**
     * Creates multiple tickets for an event in bulk.
     * 
     * @param eventId the UUID of the event
     * @param creatorId the UUID of the user creating the tickets (organizer/admin)
     * @param ticketType the type of tickets to create
     * @param price the price per ticket
     * @param quantity the number of tickets to create
     * @param name optional ticket name/description
     * @param startTime optional ticket sale start time
     * @param endTime optional ticket sale end time
     * @return list of created TicketEntity
     * @throws com.accessplus.eventpro.core.common.exception.ResourceNotFoundException if event or creator not found
     * @throws IllegalArgumentException if validation fails
     */
    List<TicketEntity> createTickets(
            UUID eventId,
            UUID creatorId,
            TicketType ticketType,
            BigDecimal price,
            int quantity,
            String name,
            LocalDateTime startTime,
            LocalDateTime endTime);

    /**
     * Updates an existing ticket.
     * 
     * @param ticketId the UUID of the ticket to update
     * @param name optional new ticket name
     * @param price optional new price
     * @param ticketType optional new ticket type
     * @param startTime optional new start time
     * @param endTime optional new end time
     * @param printOutUrl optional new print out URL
     * @return updated TicketEntity
     * @throws com.accessplus.eventpro.core.common.exception.ResourceNotFoundException if ticket not found
     * @throws IllegalArgumentException if validation fails
     */
    TicketEntity updateTicket(
            UUID ticketId,
            String name,
            BigDecimal price,
            TicketType ticketType,
            LocalDateTime startTime,
            LocalDateTime endTime,
            String printOutUrl);

    /**
     * Deletes a ticket by ID.
     * 
     * @param ticketId the UUID of the ticket to delete
     * @throws com.accessplus.eventpro.core.common.exception.ResourceNotFoundException if ticket not found
     */
    void deleteTicket(UUID ticketId);

    /**
     * Retrieves a ticket by ID.
     * 
     * @param ticketId the UUID of the ticket
     * @return TicketEntity if found
     * @throws com.accessplus.eventpro.core.common.exception.ResourceNotFoundException if ticket not found
     */
    TicketEntity getTicketById(UUID ticketId);

    /**
     * Retrieves all tickets for an event with pagination.
     * 
     * @param eventId the UUID of the event
     * @param pageable pagination and sorting parameters
     * @return Page of TicketEntity for the event
     * @throws com.accessplus.eventpro.core.common.exception.ResourceNotFoundException if event not found
     */
    Page<TicketEntity> getTicketsByEvent(UUID eventId, Pageable pageable);

    /**
     * Groups tickets by type for an event.
     * 
     * @param eventId the UUID of the event
     * @return Map of TicketType to List of TicketEntity
     * @throws com.accessplus.eventpro.core.common.exception.ResourceNotFoundException if event not found
     */
    Map<TicketType, List<TicketEntity>> groupTicketsByType(UUID eventId);

    /**
     * Checks ticket availability for an event.
     * Returns count of available tickets by type.
     * 
     * @param eventId the UUID of the event
     * @return Map of TicketType to count of available tickets
     * @throws com.accessplus.eventpro.core.common.exception.ResourceNotFoundException if event not found
     */
    Map<TicketType, Long> checkTicketAvailability(UUID eventId);

    /**
     * Marks a ticket as sold and generates QR code.
     * 
     * @param ticketId the UUID of the ticket
     * @param purchaserId the UUID of the user purchasing the ticket
     * @return updated TicketEntity with QR code URL
     * @throws com.accessplus.eventpro.core.common.exception.ResourceNotFoundException if ticket or purchaser not found
     * @throws java.io.IOException if QR code generation fails
     * @throws IllegalStateException if ticket is not available
     */
    TicketEntity markTicketAsSold(UUID ticketId, UUID purchaserId) throws java.io.IOException;

    /**
     * Marks a ticket as reserved (e.g., when added to cart).
     * 
     * @param ticketId the UUID of the ticket
     * @throws com.accessplus.eventpro.core.common.exception.ResourceNotFoundException if ticket not found
     * @throws IllegalStateException if ticket is not available
     */
    void markTicketAsReserved(UUID ticketId);

    /**
     * Marks a ticket as available (e.g., when order is cancelled).
     * 
     * @param ticketId the UUID of the ticket
     * @throws com.accessplus.eventpro.core.common.exception.ResourceNotFoundException if ticket not found
     */
    void markTicketAsAvailable(UUID ticketId);
}

