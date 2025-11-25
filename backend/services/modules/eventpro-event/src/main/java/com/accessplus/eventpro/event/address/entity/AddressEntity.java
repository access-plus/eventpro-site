package com.accessplus.eventpro.event.address.entity;

import com.accessplus.eventpro.shared.entity.BaseEntity;
import com.accessplus.eventpro.event.event.entity.EventEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Address entity representing event location information.
 * 
 * <p>Fields match the database schema from V1__create_base_tables.sql:
 * <ul>
 *   <li>id (UUID, PK) - From BaseEntity</li>
 *   <li>street (String, not null) - Street address</li>
 *   <li>city (String, not null) - City name</li>
 *   <li>state (String, not null) - State/province</li>
 *   <li>zipCode (String, not null) - ZIP/postal code</li>
 *   <li>country (String, not null) - Country name</li>
 *   <li>latitude (BigDecimal, nullable) - GPS latitude (NUMERIC(10,8))</li>
 *   <li>longitude (BigDecimal, nullable) - GPS longitude (NUMERIC(11,8))</li>
 *   <li>createdAt (LocalDateTime) - From BaseEntity</li>
 *   <li>updatedAt (LocalDateTime) - From BaseEntity</li>
 * </ul>
 * 
 * <p>Relationships:
 * <ul>
 *   <li>One-to-One: event (EventEntity) - Bidirectional relationship</li>
 * </ul>
 * 
 * <p>Validation Rules:
 * <ul>
 *   <li>Street, city, state, zipCode, country are required</li>
 *   <li>Latitude/longitude should be valid GPS coordinates if provided</li>
 *   <li>Latitude range: -90 to 90</li>
 *   <li>Longitude range: -180 to 180</li>
 * </ul>
 * 
 * <p>Indexes:
 * <ul>
 *   <li>idx_address_city_state on (city, state) - For location-based queries</li>
 * </ul>
 */
@Entity
@Table(name = "address", indexes = {
    @Index(name = "idx_address_city_state", columnList = "city, state")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AddressEntity extends BaseEntity {

    @Column(name = "street", nullable = false, length = 255)
    private String street;

    @Column(name = "city", nullable = false, length = 100)
    private String city;

    @Column(name = "state", nullable = false, length = 100)
    private String state;

    @Column(name = "zip_code", nullable = false, length = 20)
    private String zipCode;

    @Column(name = "country", nullable = false, length = 100)
    private String country;

    @Column(name = "latitude", precision = 10, scale = 8)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 11, scale = 8)
    private BigDecimal longitude;

    /**
     * Event associated with this address (one-to-one bidirectional relationship).
     * One address is associated with one event.
     */
    @OneToOne(mappedBy = "address", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private EventEntity event;
}

