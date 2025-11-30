package com.accessplus.eventpro.api.service;

import com.accessplus.eventpro.api.dto.AttendeeResponse;
import com.accessplus.eventpro.api.dto.EventStatsResponse;

import java.util.List;
import java.util.UUID;

/**
 * Service interface for organizer operations.
 */
public interface OrganizerService {
    
    /**
     * Gets event statistics for an organizer's event.
     * 
     * @param eventId event UUID
     * @param organizerId organizer UUID
     * @return EventStatsResponse
     */
    EventStatsResponse getEventStats(UUID eventId, UUID organizerId);
    
    /**
     * Gets attendees for an organizer's event.
     * 
     * @param eventId event UUID
     * @param organizerId organizer UUID
     * @return List of AttendeeResponse
     */
    List<AttendeeResponse> getEventAttendees(UUID eventId, UUID organizerId);
}

