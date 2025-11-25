package com.accessplus.eventpro.api.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Request DTO for creating a new event.
 * 
 * <p>Matches the EventCreateRequest structure from README.md Events API.
 * Used in multipart/form-data POST /api/v1/events endpoint.
 * 
 * <p>Required fields:
 * <ul>
 *   <li>name - Event name</li>
 *   <li>startTime - Event start date/time (ISO-8601)</li>
 *   <li>endTime - Event end date/time (ISO-8601)</li>
 *   <li>category - Category UUID or name (depends on implementation)</li>
 *   <li>address - Address information (city and country required)</li>
 * </ul>
 * 
 * <p>Optional fields:
 * <ul>
 *   <li>description - Event description</li>
 *   <li>marketingEnabled - Whether event is promoted (default: false)</li>
 * </ul>
 * 
 * <p>Note: The imageFile is sent as a separate part in multipart/form-data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CreateEventRequest {
    
    @NotBlank(message = "Event name is required")
    private String name;
    
    private String description;
    
    @NotNull(message = "Event start time is required")
    private LocalDateTime startTime;
    
    @NotNull(message = "Event end time is required")
    private LocalDateTime endTime;
    
    @Builder.Default
    private Boolean marketingEnabled = false;
    
    @NotNull(message = "Category is required")
    private String category; // Can be UUID or category name
    
    @Valid
    @NotNull(message = "Address is required")
    private AddressDto address;
}

