package com.accessplus.eventpro.api.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * Request DTO for creating tickets in bulk.
 * 
 * <p>Matches the TicketCreateRequest structure from README.md Tickets API.
 * Used in POST /api/v1/tickets endpoint.
 * 
 * <p>Required fields:
 * <ul>
 *   <li>eventId - Event UUID</li>
 *   <li>tickets - List of TicketInfo (at least one ticket required)</li>
 * </ul>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TicketCreateRequest {
    
    @NotNull(message = "Event ID is required")
    private UUID eventId;
    
    @NotEmpty(message = "At least one ticket must be specified")
    @Valid
    private List<TicketInfo> tickets;
}

