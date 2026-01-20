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

@Repository
public interface EventRepository extends JpaRepository<EventEntity, UUID> {

    Page<EventEntity> findByCategory(CategoryEntity category, Pageable pageable);

    Page<EventEntity> findByOrganizer(UserEntity organizer, Pageable pageable);

    Page<EventEntity> findByMarketingEnabled(Boolean marketingEnabled, Pageable pageable);

    Page<EventEntity> findByStartTimeAfter(LocalDateTime startTime, Pageable pageable);

    Page<EventEntity> findByStartTimeBetween(LocalDateTime startTime, LocalDateTime endTime, Pageable pageable);

    @Query("SELECT e FROM EventEntity e WHERE e.category.id = :categoryId")
    Page<EventEntity> findByCategoryId(@Param("categoryId") UUID categoryId, Pageable pageable);

    @Query("SELECT e FROM EventEntity e WHERE e.organizer.id = :organizerId")
    Page<EventEntity> findByOrganizerId(@Param("organizerId") UUID organizerId, Pageable pageable);

    @Query("SELECT e FROM EventEntity e WHERE LOWER(e.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    Page<EventEntity> findByNameContainingIgnoreCase(@Param("name") String name, Pageable pageable);

    @Query("SELECT DISTINCT e FROM EventEntity e " +
           "JOIN TicketEntity t ON t.eventId = e.id " +
           "JOIN OrderItemEntity oi ON oi.ticket.id = t.id " +
           "JOIN OrderEntity o ON o.id = oi.order.id " +
           "WHERE o.userId = :userId")
    Page<EventEntity> findEventsByUserPurchases(@Param("userId") UUID userId, Pageable pageable);
}

