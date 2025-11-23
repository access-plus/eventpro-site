package com.accessplus.eventpro.api.dto;

import com.accessplus.eventpro.order.order.entity.OrderItemEntity;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Response DTO for an order item.
 * 
 * <p>Fields:
 * <ul>
 *   <li>id - Order item UUID</li>
 *   <li>quantity - Quantity of tickets</li>
 *   <li>price - Price per ticket at time of purchase</li>
 *   <li>ticket - TicketResponse for the ticket in this order item</li>
 * </ul>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OrderItemResponse {
    
    private UUID id;
    private Integer quantity;
    private BigDecimal price;
    private TicketResponse ticket;
    
    /**
     * Creates an OrderItemResponse from an OrderItemEntity.
     */
    public static OrderItemResponse fromEntity(OrderItemEntity entity) {
        if (entity == null) {
            return null;
        }
        
        return OrderItemResponse.builder()
                .id(entity.getId())
                .quantity(entity.getQuantity())
                .price(entity.getPrice())
                .ticket(entity.getTicket() != null ? TicketResponse.fromEntity(entity.getTicket()) : null)
                .build();
    }
}

