package com.accessplus.eventpro.api.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for event ticket summary.
 * 
 * <p>Matches the EventSummary structure from README.md Tickets API `GET /group/{eventId}`.
 * Provides a summary of event information with ticket counts grouped by type.
 * 
 * <p>Fields:
 * <ul>
 *   <li>eventName - Event name</li>
 *   <li>startTime - Event start time (formatted string)</li>
 *   <li>endTime - Event end time (formatted string)</li>
 *   <li>tickets - List of EventTickets (ticket summary by type)</li>
 * </ul>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class EventSummary {
    
    private String eventName;
    private String startTime; // Formatted string
    private String endTime; // Formatted string
    private List<EventTickets> tickets;
}

