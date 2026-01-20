package com.accessplus.eventpro.api.service.impl;

import com.accessplus.eventpro.api.dto.AttendeeResponse;
import com.accessplus.eventpro.api.dto.EventStatsResponse;
import com.accessplus.eventpro.api.service.OrganizerService;
import com.accessplus.eventpro.core.user.entity.UserEntity;
import com.accessplus.eventpro.core.user.repository.UserRepository;
import com.accessplus.eventpro.event.event.entity.EventEntity;
import com.accessplus.eventpro.event.event.repository.EventRepository;
import com.accessplus.eventpro.order.order.repository.OrderItemRepository;
import com.accessplus.eventpro.order.order.repository.OrderRepository;
import com.accessplus.eventpro.shared.entity.OrderEntity;
import com.accessplus.eventpro.shared.entity.OrderItemEntity;
import com.accessplus.eventpro.shared.entity.TicketEntity;
import com.accessplus.eventpro.shared.enums.OrderStatus;
import com.accessplus.eventpro.shared.enums.TicketStatus;
import com.accessplus.eventpro.event.ticket.repository.TicketRepository;
import com.accessplus.eventpro.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrganizerServiceImpl implements OrganizerService {
    
    private final EventRepository eventRepository;
    private final TicketRepository ticketRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    
    @Override
    public EventStatsResponse getEventStats(UUID eventId, UUID organizerId) {
        log.debug("Getting event stats: eventId={}, organizerId={}", eventId, organizerId);
        
        // Verify event exists and belongs to organizer
        EventEntity event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", eventId.toString()));
        
        if (!event.getOrganizer().getId().equals(organizerId)) {
            throw new ResourceNotFoundException("Event", eventId.toString());
        }
        
        // Get all tickets for the event
        Pageable pageable = PageRequest.of(0, Integer.MAX_VALUE);
        List<TicketEntity> tickets = ticketRepository.findByEventId(eventId, pageable).getContent();
        
        // Calculate statistics
        long totalTickets = tickets.size();
        long ticketsSold = tickets.stream()
                .filter(t -> t.getTicketStatus() == TicketStatus.SOLD)
                .count();
        long ticketsAvailable = tickets.stream()
                .filter(t -> t.getTicketStatus() == TicketStatus.AVAILABLE)
                .count();
        
        // Calculate revenue from paid orders
        BigDecimal revenue = orderRepository.findByStatus(OrderStatus.PAID, PageRequest.of(0, Integer.MAX_VALUE))
                .getContent().stream()
                .flatMap(order -> orderItemRepository.findByOrderId(order.getId()).stream())
                .filter(oi -> {
                    try {
                        var ticket = ticketRepository.findById(oi.getTicketId()).orElse(null);
                        return ticket != null && ticket.getEventId().equals(eventId);
                    } catch (Exception e) {
                        return false;
                    }
                })
                .map(oi -> oi.getPrice().multiply(BigDecimal.valueOf(oi.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Count attendees (unique users who purchased tickets)
        long attendees = tickets.stream()
                .filter(t -> t.getTicketStatus() == TicketStatus.SOLD && t.getPurchaserId() != null)
                .map(TicketEntity::getPurchaserId)
                .distinct()
                .count();
        
        // Count checked in (for now, we'll use a placeholder - would need a checked_in field)
        long checkedIn = 0L; // Placeholder - would need to track check-in status
        
        return EventStatsResponse.builder()
                .ticketsSold(ticketsSold)
                .ticketsAvailable(ticketsAvailable)
                .totalTickets(totalTickets)
                .revenue(revenue)
                .attendees(attendees)
                .checkedIn(checkedIn)
                .build();
    }
    
    @Override
    public List<AttendeeResponse> getEventAttendees(UUID eventId, UUID organizerId) {
        log.debug("Getting event attendees: eventId={}, organizerId={}", eventId, organizerId);
        
        // Verify event exists and belongs to organizer
        EventEntity event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", eventId.toString()));
        
        if (!event.getOrganizer().getId().equals(organizerId)) {
            throw new ResourceNotFoundException("Event", eventId.toString());
        }
        
        // Get all sold tickets for the event
        Pageable pageable = PageRequest.of(0, Integer.MAX_VALUE);
        List<TicketEntity> soldTickets = ticketRepository.findByEventId(eventId, pageable).getContent().stream()
                .filter(t -> t.getTicketStatus() == TicketStatus.SOLD && t.getPurchaserId() != null)
                .collect(Collectors.toList());
        
        // Build attendee list
        List<AttendeeResponse> attendees = new ArrayList<>();
        for (TicketEntity ticket : soldTickets) {
            UserEntity user = userRepository.findById(ticket.getPurchaserId())
                    .orElse(null);
            
            // Find order for this ticket
            OrderEntity order = orderRepository.findByStatus(OrderStatus.PAID, PageRequest.of(0, Integer.MAX_VALUE))
                    .getContent().stream()
                    .filter(o -> orderItemRepository.findByOrderId(o.getId()).stream()
                            .anyMatch(oi -> oi.getTicketId().equals(ticket.getId())))
                    .findFirst()
                    .orElse(null);
            
            AttendeeResponse attendee = AttendeeResponse.builder()
                    .ticketId(ticket.getId())
                    .userId(ticket.getPurchaserId())
                    .firstName(user != null ? user.getFirstName() : null)
                    .lastName(user != null ? user.getLastName() : null)
                    .email(user != null ? user.getEmail() : null)
                    .ticketType(ticket.getTicketType().name())
                    .ticketPrice(ticket.getPrice())
                    .purchaseDate(order != null ? order.getOrderDate() : null)
                    .checkedIn(false) // Placeholder - would need to track check-in status
                    .checkedInAt(null)
                    .build();
            
            attendees.add(attendee);
        }
        
        return attendees;
    }
}

