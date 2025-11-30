package com.accessplus.eventpro.api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating event status.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateEventStatusRequest {
    
    @NotBlank(message = "Status is required")
    private String status;
}

