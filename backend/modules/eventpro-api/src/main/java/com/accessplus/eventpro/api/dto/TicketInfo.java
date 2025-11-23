package com.accessplus.eventpro.api.dto;

import com.accessplus.eventpro.event.ticket.entity.TicketType;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO for ticket information in bulk creation requests.
 * 
 * <p>Used in TicketCreateRequest for specifying ticket details.
 * Matches the TicketInfo structure from README.md Tickets API.
 * 
 * <p>Required fields:
 * <ul>
 *   <li>price - Ticket price (BigDecimal, >= 0)</li>
 *   <li>ticketType - Ticket type enum (VIP, REGULAR, EARLY_BIRD)</li>
 *   <li>quantity - Number of tickets to create (Long, > 0)</li>
 *   <li>eventId - Event UUID</li>
 * </ul>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TicketInfo {
    
    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", message = "Price must be non-negative")
    private BigDecimal price;
    
    @NotNull(message = "Ticket type is required")
    private TicketType ticketType;
    
    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Long quantity;
    
    @NotNull(message = "Event ID is required")
    private UUID eventId;
}

