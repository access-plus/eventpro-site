package com.accessplus.eventpro.api.dto;

import com.accessplus.eventpro.event.address.entity.AddressEntity;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO for Address information in event requests and responses.
 * 
 * <p>Used in CreateEventRequest and UpdateEventRequest for nested address data.
 * In EventResponse, address fields are flattened (addressStreet, addressCity, etc.).
 * 
 * <p>Required fields (for creation):
 * <ul>
 *   <li>city (required)</li>
 *   <li>country (required)</li>
 * </ul>
 * 
 * <p>Optional fields:
 * <ul>
 *   <li>street</li>
 *   <li>state</li>
 *   <li>zipCode</li>
 *   <li>latitude</li>
 *   <li>longitude</li>
 * </ul>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AddressDto {
    
    private UUID id;
    
    private String street;
    
    @NotBlank(message = "City is required")
    private String city;
    
    private String state;
    
    private String zipCode;
    
    @NotBlank(message = "Country is required")
    private String country;
    
    private BigDecimal latitude;
    
    private BigDecimal longitude;
    
    /**
     * Creates an AddressDto from an AddressEntity.
     */
    public static AddressDto fromEntity(AddressEntity entity) {
        if (entity == null) {
            return null;
        }
        
        return AddressDto.builder()
                .id(entity.getId())
                .street(entity.getStreet())
                .city(entity.getCity())
                .state(entity.getState())
                .zipCode(entity.getZipCode())
                .country(entity.getCountry())
                .latitude(entity.getLatitude())
                .longitude(entity.getLongitude())
                .build();
    }
    
    /**
     * Creates an AddressEntity from this DTO.
     */
    public AddressEntity toEntity() {
        AddressEntity entity = new AddressEntity();
        entity.setStreet(this.street);
        entity.setCity(this.city);
        entity.setState(this.state);
        entity.setZipCode(this.zipCode);
        entity.setCountry(this.country);
        entity.setLatitude(this.latitude);
        entity.setLongitude(this.longitude);
        return entity;
    }
}

