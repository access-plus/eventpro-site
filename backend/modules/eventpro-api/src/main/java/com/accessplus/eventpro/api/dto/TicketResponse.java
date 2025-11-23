package com.accessplus.eventpro.api.dto;

import com.accessplus.eventpro.event.ticket.entity.TicketEntity;
import com.accessplus.eventpro.event.ticket.entity.TicketStatus;
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
 * Response DTO for Ticket entity.
 * 
 * <p>Matches the TicketResponse structure from README.md Tickets API.
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
 *   <li>qrCode - QR code image URL (S3)</li>
 *   <li>printOutUrl - Printable ticket PDF URL (S3)</li>
 *   <li>eventIdType - Event ID as string (for compatibility with legacy API)</li>
 * </ul>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TicketResponse {
    
    private UUID id;
    private String name;
    private TicketType ticketType;
    private TicketStatus ticketStatus;
    private BigDecimal price;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String qrCode;
    private String printOutUrl;
    private String eventIdType; // Event ID as string for legacy API compatibility
    
    /**
     * Creates a TicketResponse from a TicketEntity.
     */
    public static TicketResponse fromEntity(TicketEntity entity) {
        if (entity == null) {
            return null;
        }
        
        return TicketResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .ticketType(entity.getTicketType())
                .ticketStatus(entity.getTicketStatus())
                .price(entity.getPrice())
                .startTime(entity.getStartTime())
                .endTime(entity.getEndTime())
                .qrCode(entity.getQrCode())
                .printOutUrl(entity.getPrintOutUrl())
                .eventIdType(entity.getEvent() != null ? entity.getEvent().getId().toString() : null)
                .build();
    }
}

