package com.accessplus.eventpro.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Response DTO for admin platform statistics.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsResponse {
    
    private Long totalUsers;
    private Long totalEvents;
    private Long totalTicketsSold;
    private BigDecimal totalRevenue;
    private Double userGrowth; // Percentage
    private Double eventGrowth; // Percentage
    private Double ticketGrowth; // Percentage
    private Double revenueGrowth; // Percentage
}

