package com.accessplus.eventpro.api.dto;

import com.accessplus.eventpro.order.cart.entity.CartEntity;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

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
    /** When the cart reservation expires (ISO-8601). Earliest reservedUntil of any ticket in cart. For countdown. */
    private String reservedUntil;
    private String message;
    
    public static CartResponse fromCartEntities(List<CartEntity> cartItems, UUID userId, BigDecimal totalCost) {
        if (cartItems == null || cartItems.isEmpty()) {
            return CartResponse.builder()
                    .id(userId)
                    .tickets(new LinkedHashSet<>())
                    .quantity(0)
                    .totalCost(BigDecimal.ZERO)
                    .build();
        }
        
        Map<String, List<CartEntity>> grouped = new LinkedHashMap<>();
        cartItems.stream()
                .filter(cartItem -> cartItem.getTicket() != null)
                .sorted(Comparator.comparing(CartEntity::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .forEach(cartItem -> grouped
                        .computeIfAbsent(lineKey(cartItem), ignored -> new ArrayList<>())
                        .add(cartItem));

        Set<CartItemResponse> ticketResponses = grouped.values().stream()
                .map(CartResponse::toCartItemResponse)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        
        // Calculate total quantity
        int totalQuantity = ticketResponses.stream()
                .mapToInt(item -> item.getQuantity() != null ? item.getQuantity() : 0)
                .sum();

        // Earliest reservation expiry among all tickets (for countdown)
        java.time.Instant reservedUntil = cartItems.stream()
                .map(ci -> ci.getTicket() != null ? ci.getTicket().getReservedUntil() : null)
                .filter(java.util.Objects::nonNull)
                .map(ldt -> ldt.atZone(java.time.ZoneOffset.UTC).toInstant())
                .min(java.util.Comparator.naturalOrder())
                .orElse(null);
        String reservedUntilStr = reservedUntil != null ? reservedUntil.toString() : null;

        return CartResponse.builder()
                .id(userId)
                .tickets(ticketResponses)
                .quantity(totalQuantity)
                .totalCost(totalCost)
                .reservedUntil(reservedUntilStr)
                .build();
    }

    private static String lineKey(CartEntity cartItem) {
        var ticket = cartItem.getTicket();
        if (ticket.getSeatSection() != null) {
            return "SEAT:" + ticket.getId();
        }
        return "GA:%s:%s:%s".formatted(
                ticket.getEventId(),
                ticket.getTicketType(),
                ticket.getPrice());
    }

    private static CartItemResponse toCartItemResponse(List<CartEntity> cartItems) {
        CartEntity firstCartItem = cartItems.get(0);
        var firstTicket = firstCartItem.getTicket();
        List<UUID> ticketIds = cartItems.stream()
                .map(CartEntity::getTicket)
                .filter(java.util.Objects::nonNull)
                .map(ticket -> ticket.getId())
                .toList();
        boolean reservedSeat = firstTicket.getSeatSection() != null;
        String eventId = firstTicket.getEventId() != null ? firstTicket.getEventId().toString() : null;
        String lineId = reservedSeat
                ? firstTicket.getId().toString()
                : "%s:%s:%s".formatted(eventId, firstTicket.getTicketType(), firstTicket.getPrice());

        return CartItemResponse.builder()
                .id(firstTicket.getId())
                .lineId(lineId)
                .lineType(reservedSeat ? "RESERVED_SEAT" : "GENERAL_ADMISSION")
                .name(firstTicket.getName())
                .ticketType(firstTicket.getTicketType())
                .ticketStatus(firstTicket.getTicketStatus())
                .price(firstTicket.getPrice())
                .startTime(firstTicket.getStartTime())
                .endTime(firstTicket.getEndTime())
                .eventIdType(eventId)
                .quantity(cartItems.size())
                .ticketIds(ticketIds)
                .build();
    }
}
