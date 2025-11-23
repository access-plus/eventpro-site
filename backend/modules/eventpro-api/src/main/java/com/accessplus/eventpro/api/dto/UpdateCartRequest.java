package com.accessplus.eventpro.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating cart item quantity.
 * 
 * <p>Fields:
 * <ul>
 *   <li>quantity - New quantity (must be > 0)</li>
 * </ul>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCartRequest {
    
    /**
     * New quantity for the cart item.
     * Must be greater than 0.
     */
    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;
}

