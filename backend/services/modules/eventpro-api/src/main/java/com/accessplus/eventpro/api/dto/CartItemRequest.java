package com.accessplus.eventpro.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Request DTO for a single cart item in batch operations.
 * 
 * <p>Matches the CartItem structure from frontend.
 * The ticketTypeId can be either:
 * <ul>
 *   <li>A ticket UUID (if it's a valid UUID format)</li>
 *   <li>An event ID (if it's a valid UUID format) - in which case ticketType must be provided</li>
 * </ul>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItemRequest {
    
    /**
     * Ticket type ID or ticket ID.
     * Can be a ticket UUID or event UUID (if using with ticketType).
     */
    @NotBlank(message = "Ticket type ID is required")
    private String ticketTypeId;
    
    /**
     * Quantity to add to cart.
     * Must be greater than 0.
     */
    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;
}

