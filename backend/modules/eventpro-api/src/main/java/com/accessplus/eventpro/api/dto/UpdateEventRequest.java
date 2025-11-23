package com.accessplus.eventpro.api.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Request DTO for updating an existing event.
 * 
 * <p>Matches the EventUpdateRequest structure from README.md Events API.
 * All fields are optional - only provided fields will be updated.
 * 
 * <p>Optional fields:
 * <ul>
 *   <li>name - Event name</li>
 *   <li>description - Event description</li>
 *   <li>imageUrl - S3 URL for event image (if not updating via imageFile)</li>
 *   <li>marketingEnabled - Whether event is promoted</li>
 *   <li>startTime - Event start date/time</li>
 *   <li>endTime - Event end date/time</li>
 *   <li>userId - Organizer UUID</li>
 *   <li>category - Category UUID or name</li>
 *   <li>address - Address information (city and country required if address is provided)</li>
 * </ul>
 * 
 * <p>Note: The imageFile is sent as a query parameter in PATCH /api/v1/events/{id} endpoint.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UpdateEventRequest {
    
    private String name;
    private String description;
    private String imageUrl;
    private Boolean marketingEnabled;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String userId; // UUID as string
    private String category; // UUID or category name
    
    @Valid
    private AddressDto address;
}

