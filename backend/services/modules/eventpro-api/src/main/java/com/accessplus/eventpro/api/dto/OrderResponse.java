package com.accessplus.eventpro.api.dto;

import com.accessplus.eventpro.shared.entity.OrderEntity;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Response DTO for an order.
 * 
 * <p>Matches the OrderResponse structure from README.md Orders API.
 * 
 * <p>Fields:
 * <ul>
 *   <li>id - Order UUID</li>
 *   <li>amount - Order total amount (as Long for legacy API compatibility)</li>
 *   <li>orderItems - List of OrderItemResponse (tickets in the order)</li>
 *   <li>payment - PaymentResponse (nullable until payment is processed)</li>
 * </ul>
 * 
 * <p>Note: The README specifies "amount" as Long, but OrderEntity uses BigDecimal.
 * We'll convert BigDecimal to Long (cents) for API compatibility.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OrderResponse {
    
    private UUID id;
    private Long amount; // Order total amount in cents (for legacy API compatibility)
    private List<OrderItemResponse> orderItems;
    private PaymentResponse payment;
    
    /**
     * Creates an OrderResponse from an OrderEntity.
     * 
     * @param entity OrderEntity
     * @return OrderResponse
     */
    public static OrderResponse fromEntity(OrderEntity entity) {
        if (entity == null) {
            return null;
        }
        
        // Convert BigDecimal to Long (cents) for legacy API compatibility
        Long amountInCents = entity.getTotalAmount() != null
                ? entity.getTotalAmount().multiply(java.math.BigDecimal.valueOf(100)).longValue()
                : 0L;
        
        // Convert order items
        List<OrderItemResponse> orderItemResponses = new ArrayList<>();
        if (entity.getOrderItems() != null) {
            orderItemResponses = entity.getOrderItems().stream()
                    .map(OrderItemResponse::fromEntity)
                    .collect(Collectors.toList());
        }
        
        return OrderResponse.builder()
                .id(entity.getId())
                .amount(amountInCents)
                .orderItems(orderItemResponses)
                .payment(null) // Payment will be populated when PaymentEntity is available
                .build();
    }
}

