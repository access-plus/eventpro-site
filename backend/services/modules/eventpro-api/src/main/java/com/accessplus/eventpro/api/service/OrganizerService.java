package com.accessplus.eventpro.api.service;

import com.accessplus.eventpro.api.dto.AttendeeResponse;
import com.accessplus.eventpro.api.dto.EventStatsResponse;
import com.accessplus.eventpro.api.dto.OrganizerInsightsResponse;
import com.accessplus.eventpro.api.dto.OrganizerSummaryResponse;
import com.accessplus.eventpro.api.dto.RecentSaleResponse;

import java.util.List;
import java.util.UUID;

public interface OrganizerService {

    OrganizerSummaryResponse getOrganizerSummary(UUID organizerId);

    EventStatsResponse getEventStats(UUID eventId, UUID organizerId);

    List<AttendeeResponse> getEventAttendees(UUID eventId, UUID organizerId);

    /** Export data: type = attendees | checkin | marketing | financial, format = csv. Returns file bytes. */
    byte[] exportData(UUID organizerId, String type, String format);

    List<RecentSaleResponse> getRecentSales(UUID organizerId, int limit);

    OrganizerInsightsResponse getInsights(UUID organizerId);
}

