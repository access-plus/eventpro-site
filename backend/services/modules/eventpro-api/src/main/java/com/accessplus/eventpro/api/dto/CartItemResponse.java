package com.accessplus.eventpro.api.dto;

import com.accessplus.eventpro.shared.enums.TicketStatus;
import com.accessplus.eventpro.shared.enums.TicketType;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for a cart item (ticket in cart).
 * 
 * <p>Matches the CartTicket structure from README.md Shopping Cart API.
 * 
 * <p>Fields:
 * <ul>
 *   <li>id - Ticket UUID</li>
 *   <li>name - Ticket name/description</li>
 *   <li>ticketType - Ticket type enum (VIP, REGULAR, EARLY_BIRD)</li>
 *   <li>ticketStatus - Ticket status enum (AVAILABLE, SOLD, RESERVED)</li>
 *   <li>price - Ticket price</li>
 *   <li>startTime - Ticket sale start time</li>
 *   <li>endTime - Ticket sale end time</li>
 *   <li>eventIdType - Event ID as string (for compatibility with legacy API)</li>
 *   <li>quantity - Quantity of this ticket in cart</li>
 * </ul>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CartItemResponse {
    
    private UUID id;
    private String name;
    private TicketType ticketType;
    private TicketStatus ticketStatus;
    private BigDecimal price;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String eventIdType; // Event ID as string for legacy API compatibility
    private Integer quantity; // Quantity of this ticket in cart
}

