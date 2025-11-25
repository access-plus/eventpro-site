package com.accessplus.eventpro.event.ticket.service.impl;

import com.accessplus.eventpro.shared.exception.ResourceNotFoundException;
import com.accessplus.eventpro.shared.exception.ValidationException;
import com.accessplus.eventpro.core.user.entity.UserEntity;
import com.accessplus.eventpro.core.user.repository.UserRepository;
import com.accessplus.eventpro.event.event.entity.EventEntity;
import com.accessplus.eventpro.event.event.repository.EventRepository;
import com.accessplus.eventpro.shared.entity.TicketEntity;
import com.accessplus.eventpro.shared.enums.TicketStatus;
import com.accessplus.eventpro.shared.enums.TicketType;
import com.accessplus.eventpro.event.ticket.repository.TicketRepository;
import com.accessplus.eventpro.event.ticket.service.QRCodeService;
import com.accessplus.eventpro.event.ticket.service.TicketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Implementation of TicketService.
 * Handles ticket CRUD operations with QR code generation support.
 * 
 * <p>Features:
 * <ul>
 *   <li>Bulk ticket creation for events</li>
 *   <li>Ticket updates and deletion</li>
 *   <li>Ticket retrieval by event, type, status</li>
 *   <li>Ticket grouping by type</li>
 *   <li>Ticket availability checking</li>
 *   <li>QR code generation when tickets are sold</li>
 *   <li>Ticket status management (AVAILABLE, RESERVED, SOLD)</li>
 *   <li>Validation of ticket data and relationships</li>
 *   <li>Proper error handling and logging</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class TicketServiceImpl implements TicketService {

    private final TicketRepository ticketRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final QRCodeService qrCodeService;

    /**
     * Creates multiple tickets for an event in bulk.
     */
    @Override
    public List<TicketEntity> createTickets(
            UUID eventId,
            UUID creatorId,
            TicketType ticketType,
            BigDecimal price,
            int quantity,
            String name,
            LocalDateTime startTime,
            LocalDateTime endTime) {
        log.debug("Creating tickets: eventId={}, creatorId={}, type={}, price={}, quantity={}", 
                eventId, creatorId, ticketType, price, quantity);

        // Validate and fetch event
        EventEntity event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", eventId.toString()));

        // Validate and fetch creator
        UserEntity creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new ResourceNotFoundException("User", creatorId.toString()));

        // Validate inputs
        if (quantity <= 0) {
            throw new ValidationException("Quantity must be greater than 0");
        }
        if (price == null || price.compareTo(BigDecimal.ZERO) < 0) {
            throw new ValidationException("Price must be non-negative");
        }
        if (startTime != null && endTime != null && endTime.isBefore(startTime)) {
            throw new ValidationException("End time must be after start time");
        }

        // Generate ticket name if not provided
        String ticketName = name != null && !name.trim().isEmpty() 
                ? name 
                : String.format("%s - %s", event.getName(), ticketType.name());

        // Create tickets
        List<TicketEntity> tickets = new ArrayList<>();
        for (int i = 0; i < quantity; i++) {
            TicketEntity ticket = new TicketEntity();
            ticket.setName(ticketName);
            ticket.setPrice(price);
            ticket.setTicketType(ticketType);
            ticket.setTicketStatus(TicketStatus.AVAILABLE);
            ticket.setStartTime(startTime);
            ticket.setEndTime(endTime);
            ticket.setEventId(event.getId());
            ticket.setCreatorId(creator.getId());
            // purchaser is null until ticket is sold

            tickets.add(ticket);
        }

        // Save all tickets
        List<TicketEntity> savedTickets = ticketRepository.saveAll(tickets);
        log.info("Successfully created {} tickets for event: eventId={}, type={}", 
                savedTickets.size(), eventId, ticketType);

        return savedTickets;
    }

    /**
     * Updates an existing ticket.
     */
    @Override
    public TicketEntity updateTicket(
            UUID ticketId,
            String name,
            BigDecimal price,
            TicketType ticketType,
            LocalDateTime startTime,
            LocalDateTime endTime,
            String printOutUrl) {
        log.debug("Updating ticket: id={}", ticketId);

        // Fetch existing ticket
        TicketEntity ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", ticketId.toString()));

        // Update fields if provided (only non-null values)
        if (name != null && !name.trim().isEmpty()) {
            ticket.setName(name);
        }
        if (price != null) {
            if (price.compareTo(BigDecimal.ZERO) < 0) {
                throw new ValidationException("Price must be non-negative");
            }
            ticket.setPrice(price);
        }
        if (ticketType != null) {
            ticket.setTicketType(ticketType);
        }
        if (startTime != null) {
            ticket.setStartTime(startTime);
        }
        if (endTime != null) {
            ticket.setEndTime(endTime);
        }
        if (printOutUrl != null) {
            ticket.setPrintOutUrl(printOutUrl);
        }

        // Validate time constraints
        if (ticket.getStartTime() != null && ticket.getEndTime() != null 
                && ticket.getEndTime().isBefore(ticket.getStartTime())) {
            throw new ValidationException("End time must be after start time");
        }

        // Save updated ticket
        TicketEntity updatedTicket = ticketRepository.save(ticket);
        log.info("Successfully updated ticket: id={}", ticketId);

        return updatedTicket;
    }

    /**
     * Deletes a ticket by ID.
     */
    @Override
    public void deleteTicket(UUID ticketId) {
        log.debug("Deleting ticket: id={}", ticketId);

        // Check if ticket exists
        if (!ticketRepository.existsById(ticketId)) {
            throw new ResourceNotFoundException("Ticket", ticketId.toString());
        }

        // Delete ticket (cascade will handle related entities if needed)
        ticketRepository.deleteById(ticketId);
        log.info("Successfully deleted ticket: id={}", ticketId);
    }

    /**
     * Retrieves a ticket by ID.
     */
    @Override
    @Transactional(readOnly = true)
    public TicketEntity getTicketById(UUID ticketId) {
        log.debug("Getting ticket by ID: {}", ticketId);

        return ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", ticketId.toString()));
    }

    /**
     * Retrieves all tickets for an event with pagination.
     */
    @Override
    @Transactional(readOnly = true)
    public Page<TicketEntity> getTicketsByEvent(UUID eventId, Pageable pageable) {
        log.debug("Getting tickets for event: eventId={}, page={}, size={}", 
                eventId, pageable.getPageNumber(), pageable.getPageSize());

        // Validate event exists
        if (!eventRepository.existsById(eventId)) {
            throw new ResourceNotFoundException("Event", eventId.toString());
        }

        return ticketRepository.findByEventId(eventId, pageable);
    }

    /**
     * Groups tickets by type for an event.
     */
    @Override
    @Transactional(readOnly = true)
    public Map<TicketType, List<TicketEntity>> groupTicketsByType(UUID eventId) {
        log.debug("Grouping tickets by type for event: eventId={}", eventId);

        // Validate event exists
        if (!eventRepository.existsById(eventId)) {
            throw new ResourceNotFoundException("Event", eventId.toString());
        }

        // Get all tickets for the event (no pagination for grouping)
        Pageable pageable = org.springframework.data.domain.PageRequest.of(0, Integer.MAX_VALUE);
        List<TicketEntity> tickets = ticketRepository.findByEventId(eventId, pageable).getContent();

        // Group by ticket type
        Map<TicketType, List<TicketEntity>> groupedTickets = tickets.stream()
                .collect(Collectors.groupingBy(TicketEntity::getTicketType));

        log.debug("Grouped {} tickets by type for event: eventId={}", tickets.size(), eventId);
        return groupedTickets;
    }

    /**
     * Checks ticket availability for an event.
     */
    @Override
    @Transactional(readOnly = true)
    public Map<TicketType, Long> checkTicketAvailability(UUID eventId) {
        log.debug("Checking ticket availability for event: eventId={}", eventId);

        // Validate event exists
        if (!eventRepository.existsById(eventId)) {
            throw new ResourceNotFoundException("Event", eventId.toString());
        }

        // Count available tickets by type
        Map<TicketType, Long> availability = new HashMap<>();
        for (TicketType type : TicketType.values()) {
            // Get all tickets of this type for the event
            Pageable pageable = org.springframework.data.domain.PageRequest.of(0, Integer.MAX_VALUE);
            long availableCount = ticketRepository.findByEventIdAndTicketType(eventId, type, pageable)
                    .getContent()
                    .stream()
                    .filter(t -> t.getTicketStatus() == TicketStatus.AVAILABLE)
                    .count();
            availability.put(type, availableCount);
        }

        log.debug("Ticket availability for event: eventId={}, availability={}", eventId, availability);
        return availability;
    }

    /**
     * Marks a ticket as sold and generates QR code.
     */
    @Override
    public TicketEntity markTicketAsSold(UUID ticketId, UUID purchaserId) throws IOException {
        log.debug("Marking ticket as sold: ticketId={}, purchaserId={}", ticketId, purchaserId);

        // Fetch ticket
        TicketEntity ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", ticketId.toString()));

        // Validate ticket is available or reserved
        if (ticket.getTicketStatus() == TicketStatus.SOLD) {
            throw new IllegalStateException("Ticket is already sold");
        }

        // Fetch purchaser
        UserEntity purchaser = userRepository.findById(purchaserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", purchaserId.toString()));

        // Update ticket status and purchaser
        ticket.setTicketStatus(TicketStatus.SOLD);
        ticket.setPurchaserId(purchaser.getId());

        // Generate and upload QR code
        try {
            String qrCodeUrl = qrCodeService.generateAndUploadQRCode(ticketId);
            ticket.setQrCode(qrCodeUrl);
            log.info("QR code generated and uploaded for ticket: ticketId={}, qrCodeUrl={}", ticketId, qrCodeUrl);
        } catch (IOException e) {
            log.error("Failed to generate QR code for ticket: ticketId={}, error={}", ticketId, e.getMessage(), e);
            // Continue with ticket sale even if QR code generation fails
            // QR code can be generated later if needed
        }

        // Save updated ticket
        TicketEntity savedTicket = ticketRepository.save(ticket);
        log.info("Successfully marked ticket as sold: ticketId={}, purchaserId={}", ticketId, purchaserId);

        return savedTicket;
    }

    /**
     * Marks a ticket as reserved (e.g., when added to cart).
     */
    @Override
    public void markTicketAsReserved(UUID ticketId) {
        log.debug("Marking ticket as reserved: ticketId={}", ticketId);

        // Fetch ticket
        TicketEntity ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", ticketId.toString()));

        // Validate ticket is available
        if (ticket.getTicketStatus() != TicketStatus.AVAILABLE) {
            throw new IllegalStateException(
                    String.format("Ticket is not available. Current status: %s", ticket.getTicketStatus()));
        }

        // Update ticket status
        ticket.setTicketStatus(TicketStatus.RESERVED);
        ticketRepository.save(ticket);

        log.info("Successfully marked ticket as reserved: ticketId={}", ticketId);
    }

    /**
     * Marks a ticket as available (e.g., when order is cancelled).
     */
    @Override
    public void markTicketAsAvailable(UUID ticketId) {
        log.debug("Marking ticket as available: ticketId={}", ticketId);

        // Fetch ticket
        TicketEntity ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", ticketId.toString()));

        // Validate ticket is not sold
        if (ticket.getTicketStatus() == TicketStatus.SOLD) {
            throw new IllegalStateException("Cannot mark sold ticket as available");
        }

        // Update ticket status
        ticket.setTicketStatus(TicketStatus.AVAILABLE);
        ticket.setPurchaserId(null); // Clear purchaser if set
        ticketRepository.save(ticket);

        log.info("Successfully marked ticket as available: ticketId={}", ticketId);
    }
}

