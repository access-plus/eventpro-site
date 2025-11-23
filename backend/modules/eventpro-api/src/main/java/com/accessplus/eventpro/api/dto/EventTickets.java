package com.accessplus.eventpro.api.dto;

import com.accessplus.eventpro.event.ticket.entity.TicketType;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO for ticket summary in EventSummary response.
 * 
 * <p>Used in EventSummary to represent ticket information grouped by type.
 * Matches the EventTickets structure from README.md Tickets API `GET /group/{eventId}`.
 * 
 * <p>Fields:
 * <ul>
 *   <li>ticketType - Ticket type enum</li>
 *   <li>price - Ticket price</li>
 *   <li>count - Number of tickets of this type</li>
 * </ul>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class EventTickets {
    
    private TicketType ticketType;
    private BigDecimal price;
    private Integer count;
}

