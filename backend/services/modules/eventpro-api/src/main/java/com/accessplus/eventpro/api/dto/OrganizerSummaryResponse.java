package com.accessplus.eventpro.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Organizer dashboard summary: events hosted, tickets sold, optional trend and financial state.
 * Used for Profile "Your Impact" and Organizer page.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizerSummaryResponse {

    private long eventsHosted;
    private long ticketsSold;
    /** Percent change in tickets sold this week vs last week; null if not computed. */
    private Integer ticketsSoldTrendPercent;
    /** Life-to-date total revenue from paid orders for organizer's events. */
    private BigDecimal totalRevenue;
    /** Available for payout (cleared risk scoring). */
    private BigDecimal availableBalance;
    /** Pending balance in 1–3 day holding window. */
    private BigDecimal pendingBalance;
    /** When true, show "Review Required" and disable payouts (risk scoring). */
    private boolean riskFlagged;
    /** Risk level: LOW, MEDIUM, HIGH (for "High Risk" warning on Profile). */
    private String riskLevel;
    /** True when organizer has submitted W-9 for 1099-K compliance. */
    private boolean w9Submitted;
    /** Payout options available by tier and risk: T+2, 50% early, 100% instant. */
    private PayoutEligibilityDto payoutEligibility;
}
