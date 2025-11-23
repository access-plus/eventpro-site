package com.accessplus.eventpro.event.address.repository;

import com.accessplus.eventpro.event.address.entity.AddressEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository interface for AddressEntity.
 * Provides standard CRUD operations and custom query methods for location-based queries.
 */
@Repository
public interface AddressRepository extends JpaRepository<AddressEntity, UUID> {

    /**
     * Finds addresses by city and state.
     * Uses the composite index idx_address_city_state for efficient queries.
     * 
     * @param city the city name
     * @param state the state/province name
     * @return List of addresses matching the city and state
     */
    List<AddressEntity> findByCityAndState(String city, String state);

    /**
     * Finds addresses by city.
     * 
     * @param city the city name
     * @return List of addresses in the specified city
     */
    List<AddressEntity> findByCity(String city);

    /**
     * Finds addresses by state/province.
     * 
     * @param state the state/province name
     * @return List of addresses in the specified state
     */
    List<AddressEntity> findByState(String state);

    /**
     * Finds addresses by country.
     * 
     * @param country the country name
     * @return List of addresses in the specified country
     */
    List<AddressEntity> findByCountry(String country);

    /**
     * Finds addresses within a geographic bounding box using latitude and longitude.
     * Useful for location-based searches and map queries.
     * 
     * @param minLat minimum latitude
     * @param maxLat maximum latitude
     * @param minLng minimum longitude
     * @param maxLng maximum longitude
     * @return List of addresses within the specified geographic bounds
     */
    @Query("SELECT a FROM AddressEntity a WHERE a.latitude IS NOT NULL AND a.longitude IS NOT NULL " +
           "AND a.latitude BETWEEN :minLat AND :maxLat " +
           "AND a.longitude BETWEEN :minLng AND :maxLng")
    List<AddressEntity> findWithinBounds(
            @Param("minLat") java.math.BigDecimal minLat,
            @Param("maxLat") java.math.BigDecimal maxLat,
            @Param("minLng") java.math.BigDecimal minLng,
            @Param("maxLng") java.math.BigDecimal maxLng
    );
}

