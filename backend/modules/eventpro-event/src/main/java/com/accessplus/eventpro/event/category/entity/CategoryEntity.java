package com.accessplus.eventpro.event.category.entity;

import com.accessplus.eventpro.core.common.model.BaseEntity;
import com.accessplus.eventpro.event.event.entity.EventEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/**
 * Category entity representing event categories (Music, Sports, Arts & Crafts, etc.).
 * 
 * <p>Fields match the database schema from V1__create_base_tables.sql:
 * <ul>
 *   <li>id (UUID, PK) - From BaseEntity</li>
 *   <li>name (String, unique, not null) - Category name</li>
 *   <li>description (String, nullable) - Category description</li>
 *   <li>createdAt (LocalDateTime) - From BaseEntity</li>
 *   <li>updatedAt (LocalDateTime) - From BaseEntity</li>
 * </ul>
 * 
 * <p>Relationships:
 * <ul>
 *   <li>One-to-Many: events (List<EventEntity>) - Events in this category</li>
 * </ul>
 * 
 * <p>Predefined Categories (seeded via V2__seed_categories.sql):
 * <ul>
 *   <li>Music</li>
 *   <li>Sports</li>
 *   <li>Arts & Crafts</li>
 *   <li>Fashion & Beauty</li>
 *   <li>Health & Fitness</li>
 *   <li>School Program</li>
 * </ul>
 * 
 * <p>Validation Rules:
 * <ul>
 *   <li>Name must be unique</li>
 *   <li>Name cannot be null or empty</li>
 * </ul>
 */
@Entity
@Table(name = "category", indexes = {
    @Index(name = "idx_category_name", columnList = "name")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CategoryEntity extends BaseEntity {

    @Column(name = "name", nullable = false, unique = true, length = 255)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /**
     * Events in this category.
     * One category can have many events.
     */
    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<EventEntity> events = new ArrayList<>();
}

