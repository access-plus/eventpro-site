package com.accessplus.eventpro.event.event.entity;

import com.accessplus.eventpro.shared.entity.BaseEntity;
import com.accessplus.eventpro.core.user.entity.UserEntity;
import com.accessplus.eventpro.event.address.entity.AddressEntity;
import com.accessplus.eventpro.event.category.entity.CategoryEntity;
import com.accessplus.eventpro.shared.entity.TicketEntity;
import com.accessplus.eventpro.shared.enums.EventStatus;
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

@Entity
@Table(name = "events", indexes = {
    @Index(name = "idx_event_organizer", columnList = "organizer_id"),
    @Index(name = "idx_event_category", columnList = "category_id"),
    @Index(name = "idx_event_start_time", columnList = "start_time"),
    @Index(name = "idx_event_marketing", columnList = "marketing_enabled"),
    @Index(name = "idx_event_status", columnList = "status"),
    @Index(name = "idx_event_status_start_time", columnList = "status,start_time")
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

    @NotNull(message = "Event status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private EventStatus status = EventStatus.DRAFT;

    @NotNull(message = "Event organizer is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organizer_id", nullable = false, foreignKey = @ForeignKey(name = "fk_event_organizer"))
    private UserEntity organizer;

    @NotNull(message = "Event category is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false, foreignKey = @ForeignKey(name = "fk_event_category"))
    private CategoryEntity category;

    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JoinColumn(name = "address_id", foreignKey = @ForeignKey(name = "fk_event_address"))
    private AddressEntity address;

    @OneToMany(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", foreignKey = @ForeignKey(name = "fk_ticket_event"))
    private List<TicketEntity> tickets = new ArrayList<>();
}

