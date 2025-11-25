package com.accessplus.eventpro.api.dto;

import com.accessplus.eventpro.order.cart.entity.CartEntity;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Response DTO for shopping cart.
 * 
 * <p>Matches the CartResponse structure from README.md Shopping Cart API.
 * 
 * <p>Fields:
 * <ul>
 *   <li>id - Cart UUID (or user UUID for cart identification)</li>
 *   <li>tickets - Set of CartItemResponse (unique tickets in cart)</li>
 *   <li>quantity - Total quantity of items in cart</li>
 *   <li>totalCost - Total cost of all items in cart</li>
 *   <li>message - Optional message (e.g., success message)</li>
 * </ul>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CartResponse {
    
    private UUID id;
    private Set<CartItemResponse> tickets;
    private Integer quantity;
    private BigDecimal totalCost;
    private String message;
    
    /**
     * Creates a CartResponse from a list of CartEntity.
     * 
     * @param cartItems list of cart items
     * @param userId user UUID (used as cart ID)
     * @param totalCost total cost of cart items
     * @return CartResponse
     */
    public static CartResponse fromCartEntities(List<CartEntity> cartItems, UUID userId, BigDecimal totalCost) {
        if (cartItems == null || cartItems.isEmpty()) {
            return CartResponse.builder()
                    .id(userId)
                    .tickets(new LinkedHashSet<>())
                    .quantity(0)
                    .totalCost(BigDecimal.ZERO)
                    .build();
        }
        
        // Convert cart items to CartItemResponse
        Set<CartItemResponse> ticketResponses = cartItems.stream()
                .map(cartItem -> {
                    if (cartItem.getTicket() == null) {
                        return null;
                    }
                    
                    return CartItemResponse.builder()
                            .id(cartItem.getTicket().getId())
                            .name(cartItem.getTicket().getName())
                            .ticketType(cartItem.getTicket().getTicketType())
                            .ticketStatus(cartItem.getTicket().getTicketStatus())
                            .price(cartItem.getTicket().getPrice())
                            .startTime(cartItem.getTicket().getStartTime())
                            .endTime(cartItem.getTicket().getEndTime())
                            .eventIdType(cartItem.getTicket().getEventId() != null 
                                    ? cartItem.getTicket().getEventId().toString() 
                                    : null)
                            .quantity(cartItem.getQuantity())
                            .build();
                })
                .filter(item -> item != null)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        
        // Calculate total quantity
        int totalQuantity = cartItems.stream()
                .mapToInt(CartEntity::getQuantity)
                .sum();
        
        return CartResponse.builder()
                .id(userId)
                .tickets(ticketResponses)
                .quantity(totalQuantity)
                .totalCost(totalCost)
                .build();
    }
}

