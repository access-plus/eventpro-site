package com.accessplus.eventpro.api.service;

import com.accessplus.eventpro.api.dto.AdminStatsResponse;
import com.accessplus.eventpro.api.dto.EventSaleResponse;
import com.accessplus.eventpro.api.dto.RevenueDataResponse;

import java.util.List;

/**
 * Service interface for admin operations.
 */
public interface AdminService {
    
    /**
     * Gets platform statistics.
     * 
     * @return AdminStatsResponse with platform metrics
     */
    AdminStatsResponse getPlatformStats();
    
    /**
     * Gets event sales data.
     * 
     * @return List of EventSaleResponse
     */
    List<EventSaleResponse> getEventSales();
    
    /**
     * Gets revenue data for a time period.
     * 
     * @param period time period (e.g., "30d", "7d", "90d")
     * @return List of RevenueDataResponse
     */
    List<RevenueDataResponse> getRevenueData(String period);
}

