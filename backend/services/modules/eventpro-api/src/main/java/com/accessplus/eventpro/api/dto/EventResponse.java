package com.accessplus.eventpro.api.dto;

import com.accessplus.eventpro.event.event.entity.EventEntity;
import com.accessplus.eventpro.shared.enums.EventStatus;
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
    private String promotionalVideoUrl;
    private String eventPageTemplate;
    private Boolean marketingEnabled;
    /** Pro/Enterprise: when true, checkout shows optional donation. */
    private Boolean donationsEnabled;
    /** Pro/Enterprise: custom hostname for event page. */
    private String customDomain;
    /** Pro/Enterprise: when true, event has seat map; sell by specific seat. */
    private Boolean reservedSeatingEnabled;
    /** White-label: organizer custom logo URL for event page. */
    private String organizerBrandingLogoUrl;
    /** White-label: organizer primary color hex for event page. */
    private String organizerBrandingPrimaryColor;
    /** White-label: hide platform branding on this event page. */
    private Boolean organizerBrandingHidePlatform;
    private EventStatus status;
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
                .promotionalVideoUrl(entity.getPromotionalVideoUrl())
                .eventPageTemplate(entity.getEventPageTemplate() != null ? entity.getEventPageTemplate() : "DEFAULT")
                .marketingEnabled(entity.getMarketingEnabled())
                .donationsEnabled(entity.getDonationsEnabled() != null ? entity.getDonationsEnabled() : false)
                .customDomain(entity.getCustomDomain())
                .reservedSeatingEnabled(entity.getReservedSeatingEnabled() != null ? entity.getReservedSeatingEnabled() : false)
                .status(entity.getStatus())
                .startTime(entity.getStartTime())
                .endTime(entity.getEndTime());
        
        // Set organizer (userId) and white-label branding
        if (entity.getOrganizer() != null) {
            var org = entity.getOrganizer();
            builder.userId(org.getId())
                    .organizerBrandingLogoUrl(org.getBrandingLogoUrl())
                    .organizerBrandingPrimaryColor(org.getBrandingPrimaryColor())
                    .organizerBrandingHidePlatform(org.getBrandingHidePlatform() != null ? org.getBrandingHidePlatform() : false);
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

