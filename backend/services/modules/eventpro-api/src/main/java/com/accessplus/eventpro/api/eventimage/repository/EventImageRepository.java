package com.accessplus.eventpro.api.eventimage.repository;

import com.accessplus.eventpro.api.eventimage.entity.EventImageEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EventImageRepository extends JpaRepository<EventImageEntity, UUID> {

    List<EventImageEntity> findByEventIdOrderByDisplayOrderAsc(UUID eventId);

    void deleteByEventId(UUID eventId);
}
