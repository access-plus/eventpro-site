package com.accessplus.eventpro.event.event.repository;

import com.accessplus.eventpro.event.event.entity.EventEntity;
import com.accessplus.eventpro.event.category.entity.CategoryEntity;
import com.accessplus.eventpro.core.user.entity.UserEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Repository interface for EventEntity.
 * Provides standard CRUD operations and custom query methods.
 * 
 * <p>Custom query methods:
 * <ul>
 *   <li>findByCategory - Find events by category</li>
 *   <li>findByOrganizer - Find events by organizer</li>
 *   <li>findByMarketingEnabled - Find events with marketing enabled</li>
 *   <li>findByStartTimeAfter - Find upcoming events</li>
 *   <li>findByStartTimeBetween - Find events in date range</li>
 * </ul>
 */
@Repository
public interface EventRepository extends JpaRepository<EventEntity, UUID> {

    /**
     * Finds all events in a specific category.
     * 
     * @param category the category entity
     * @param pageable pagination information
     * @return page of events in the category
     */
    Page<EventEntity> findByCategory(CategoryEntity category, Pageable pageable);

    /**
     * Finds all events created by a specific organizer.
     * 
     * @param organizer the organizer (user) entity
     * @param pageable pagination information
     * @return page of events created by the organizer
     */
    Page<EventEntity> findByOrganizer(UserEntity organizer, Pageable pageable);

    /**
     * Finds all events with marketing enabled.
     * 
     * @param marketingEnabled whether marketing is enabled
     * @param pageable pagination information
     * @return page of events with marketing enabled/disabled
     */
    Page<EventEntity> findByMarketingEnabled(Boolean marketingEnabled, Pageable pageable);

    /**
     * Finds all events that start after a specific date/time.
     * Useful for finding upcoming events.
     * 
     * @param startTime the start time threshold
     * @param pageable pagination information
     * @return page of upcoming events
     */
    Page<EventEntity> findByStartTimeAfter(LocalDateTime startTime, Pageable pageable);

    /**
     * Finds all events within a date range.
     * 
     * @param startTime the start of the date range
     * @param endTime the end of the date range
     * @param pageable pagination information
     * @return page of events in the date range
     */
    Page<EventEntity> findByStartTimeBetween(LocalDateTime startTime, LocalDateTime endTime, Pageable pageable);

    /**
     * Finds events by category ID.
     * 
     * @param categoryId the category UUID
     * @param pageable pagination information
     * @return page of events in the category
     */
    @Query("SELECT e FROM EventEntity e WHERE e.category.id = :categoryId")
    Page<EventEntity> findByCategoryId(@Param("categoryId") UUID categoryId, Pageable pageable);

    /**
     * Finds events by organizer ID.
     * 
     * @param organizerId the organizer (user) UUID
     * @param pageable pagination information
     * @return page of events created by the organizer
     */
    @Query("SELECT e FROM EventEntity e WHERE e.organizer.id = :organizerId")
    Page<EventEntity> findByOrganizerId(@Param("organizerId") UUID organizerId, Pageable pageable);

    /**
     * Finds events by name (case-insensitive search).
     * 
     * @param name the event name (partial match supported)
     * @param pageable pagination information
     * @return page of events matching the name
     */
    @Query("SELECT e FROM EventEntity e WHERE LOWER(e.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    Page<EventEntity> findByNameContainingIgnoreCase(@Param("name") String name, Pageable pageable);
}

