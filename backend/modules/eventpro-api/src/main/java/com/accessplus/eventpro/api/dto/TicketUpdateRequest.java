package com.accessplus.eventpro.api.dto;

import com.accessplus.eventpro.event.ticket.entity.TicketType;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Request DTO for updating a ticket.
 * 
 * <p>Matches the TicketUpdateRequest structure from README.md Tickets API.
 * All fields are optional - only provided fields will be updated.
 * 
 * <p>Optional fields:
 * <ul>
 *   <li>name - Ticket name/description</li>
 *   <li>description - Ticket description (not stored in TicketEntity, but in API contract)</li>
 *   <li>price - Ticket price</li>
 *   <li>quantity - Quantity (not applicable for single ticket update, but in API contract)</li>
 *   <li>startTime - Ticket sale start time</li>
 *   <li>endTime - Ticket sale end time</li>
 *   <li>printOutUrl - Printable ticket PDF URL</li>
 *   <li>eventId - Event UUID</li>
 * </ul>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TicketUpdateRequest {
    
    private String name;
    private String description; // Not stored in TicketEntity, but in API contract
    private BigDecimal price;
    private Long quantity; // Not applicable for single ticket, but in API contract
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String printOutUrl;
    private UUID eventId;
    private TicketType ticketType; // Not in README but useful for updates
}

