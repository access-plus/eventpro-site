package com.accessplus.eventpro.api.dto;

import com.accessplus.eventpro.event.event.entity.EventEntity;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class EventResponse {
    
    private UUID id;
    private String name;
    private String description;
    private String imageUrl;
    private Boolean marketingEnabled;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private UUID userId;
    private UUID categoryId;
    private String categoryName;
    
    // Flattened address fields
    private String addressStreet;
    private String addressCity;
    private String addressState;
    private String addressCountry;
    private String addressZipCode;
    
    public static EventResponse fromEntity(EventEntity entity) {
        if (entity == null) {
            return null;
        }
        
        EventResponse.EventResponseBuilder builder = EventResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .imageUrl(entity.getImageUrl())
                .marketingEnabled(entity.getMarketingEnabled())
                .startTime(entity.getStartTime())
                .endTime(entity.getEndTime());
        
        // Set organizer (userId)
        if (entity.getOrganizer() != null) {
            builder.userId(entity.getOrganizer().getId());
        }
        
        // Set category (categoryId and categoryName)
        if (entity.getCategory() != null) {
            builder.categoryId(entity.getCategory().getId())
                   .categoryName(entity.getCategory().getName());
        }
        
        // Flatten address fields
        if (entity.getAddress() != null) {
            builder.addressStreet(entity.getAddress().getStreet())
                   .addressCity(entity.getAddress().getCity())
                   .addressState(entity.getAddress().getState())
                   .addressCountry(entity.getAddress().getCountry())
                   .addressZipCode(entity.getAddress().getZipCode());
        }
        
        return builder.build();
    }
}

