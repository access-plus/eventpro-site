package com.accessplus.eventpro.api.service;

import com.accessplus.eventpro.api.dto.AttendeeResponse;
import com.accessplus.eventpro.api.dto.EventStatsResponse;

import java.util.List;
import java.util.UUID;

public interface OrganizerService {
    
    EventStatsResponse getEventStats(UUID eventId, UUID organizerId);
    
    List<AttendeeResponse> getEventAttendees(UUID eventId, UUID organizerId);
}

