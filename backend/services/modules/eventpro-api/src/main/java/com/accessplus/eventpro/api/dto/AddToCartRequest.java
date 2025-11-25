package com.accessplus.eventpro.api.dto;

import com.accessplus.eventpro.shared.enums.TicketType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Request DTO for adding an item to cart.
 * 
 * <p>Matches the AddToCartRequest structure from README.md Shopping Cart API.
 * 
 * <p>Fields:
 * <ul>
 *   <li>id - Ticket UUID (optional, can use eventIdType + ticketType instead)</li>
 *   <li>eventIdType - Event ID as string (for finding ticket by event and type)</li>
 *   <li>ticketType - Ticket type enum (VIP, REGULAR, EARLY_BIRD)</li>
 *   <li>quantity - Quantity to add (must be > 0)</li>
 * </ul>
 * 
 * <p>Note: Either id (ticket UUID) or eventIdType + ticketType must be provided.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddToCartRequest {
    
    /**
     * Ticket UUID (optional).
     * If provided, this ticket will be added directly.
     * If not provided, eventIdType + ticketType will be used to find an available ticket.
     */
    private UUID id;
    
    /**
     * Event ID as string.
     * Used with ticketType to find an available ticket if id is not provided.
     */
    private String eventIdType;
    
    /**
     * Ticket type enum.
     * Used with eventIdType to find an available ticket if id is not provided.
     */
    private TicketType ticketType;
    
    /**
     * Quantity to add to cart.
     * Must be greater than 0.
     */
    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;
}

