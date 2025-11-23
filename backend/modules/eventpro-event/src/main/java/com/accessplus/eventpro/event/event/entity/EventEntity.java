package com.accessplus.eventpro.event.event.entity;

import com.accessplus.eventpro.core.common.model.BaseEntity;
import com.accessplus.eventpro.core.user.entity.UserEntity;
import com.accessplus.eventpro.event.address.entity.AddressEntity;
import com.accessplus.eventpro.event.category.entity.CategoryEntity;
import com.accessplus.eventpro.event.ticket.entity.TicketEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Event entity representing events that users can attend.
 * 
 * <p>Fields match the database schema from V1__create_base_tables.sql:
 * <ul>
 *   <li>id (UUID, PK) - From BaseEntity</li>
 *   <li>name (String, not null) - Event name</li>
 *   <li>description (String, nullable) - Event description</li>
 *   <li>startTime (LocalDateTime, not null) - Event start date/time</li>
 *   <li>endTime (LocalDateTime, not null) - Event end date/time</li>
 *   <li>imageUrl (String, nullable) - S3 URL for event image</li>
 *   <li>marketingEnabled (Boolean, default false) - Whether event is promoted</li>
 *   <li>createdAt (LocalDateTime) - From BaseEntity</li>
 *   <li>updatedAt (LocalDateTime) - From BaseEntity</li>
 * </ul>
 * 
 * <p>Relationships:
 * <ul>
 *   <li>Many-to-One: organizer (UserEntity) - User who created the event</li>
 *   <li>Many-to-One: category (CategoryEntity)</li>
 *   <li>One-to-One: address (AddressEntity)</li>
 *   <li>One-to-Many: tickets (List&lt;TicketEntity&gt;) - Tickets for this event</li>
 * </ul>
 * 
 * <p>Validation Rules:
 * <ul>
 *   <li>Name cannot be null or empty</li>
 *   <li>End time must be after start time (enforced by database constraint)</li>
 *   <li>Image URL must be valid S3 URL format (if provided)</li>
 * </ul>
 * 
 * <p>Indexes (from V1__create_base_tables.sql):
 * <ul>
 *   <li>idx_event_organizer on organizer_id</li>
 *   <li>idx_event_category on category_id</li>
 *   <li>idx_event_start_time on start_time</li>
 *   <li>idx_event_marketing on marketing_enabled</li>
 * </ul>
 */
@Entity
@Table(name = "event", indexes = {
    @Index(name = "idx_event_organizer", columnList = "organizer_id"),
    @Index(name = "idx_event_category", columnList = "category_id"),
    @Index(name = "idx_event_start_time", columnList = "start_time"),
    @Index(name = "idx_event_marketing", columnList = "marketing_enabled")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EventEntity extends BaseEntity {

    @NotBlank(message = "Event name is required")
    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @NotNull(message = "Event start time is required")
    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @NotNull(message = "Event end time is required")
    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "marketing_enabled", nullable = false)
    private Boolean marketingEnabled = false;

    /**
     * User who created this event (organizer).
     * Many events can be created by one user.
     */
    @NotNull(message = "Event organizer is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organizer_id", nullable = false, foreignKey = @ForeignKey(name = "fk_event_organizer"))
    private UserEntity organizer;

    /**
     * Category this event belongs to.
     * Many events can belong to one category.
     */
    @NotNull(message = "Event category is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false, foreignKey = @ForeignKey(name = "fk_event_category"))
    private CategoryEntity category;

    /**
     * Address where this event takes place.
     * One-to-one bidirectional relationship with AddressEntity.
     */
    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JoinColumn(name = "address_id", foreignKey = @ForeignKey(name = "fk_event_address"))
    private AddressEntity address;

    /**
     * Tickets for this event.
     * One event can have many tickets.
     */
    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<TicketEntity> tickets = new ArrayList<>();
}

