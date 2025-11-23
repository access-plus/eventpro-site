package com.accessplus.eventpro.event.ticket.entity;

import com.accessplus.eventpro.core.common.model.BaseEntity;
import com.accessplus.eventpro.core.user.entity.UserEntity;
import com.accessplus.eventpro.event.event.entity.EventEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Ticket entity representing individual tickets for events.
 * 
 * <p>Fields match the database schema from V1__create_base_tables.sql:
 * <ul>
 *   <li>id (UUID, PK) - From BaseEntity</li>
 *   <li>name (String, not null) - Ticket name/description</li>
 *   <li>price (BigDecimal, not null) - Ticket price</li>
 *   <li>ticketType (TicketType enum, not null) - VIP, REGULAR, EARLY_BIRD</li>
 *   <li>ticketStatus (TicketStatus enum, not null) - AVAILABLE, SOLD, RESERVED</li>
 *   <li>startTime (LocalDateTime, nullable) - Ticket sale start time</li>
 *   <li>endTime (LocalDateTime, nullable) - Ticket sale end time</li>
 *   <li>qrCode (String, nullable) - QR code image URL (S3)</li>
 *   <li>printOutUrl (String, nullable) - Printable ticket PDF URL (S3)</li>
 *   <li>createdAt (LocalDateTime) - From BaseEntity</li>
 *   <li>updatedAt (LocalDateTime) - From BaseEntity</li>
 * </ul>
 * 
 * <p>Relationships:
 * <ul>
 *   <li>Many-to-One: event (EventEntity) - Event this ticket belongs to</li>
 *   <li>Many-to-One: purchaser (UserEntity, nullable) - User who purchased ticket</li>
 *   <li>Many-to-One: creator (UserEntity) - User who created ticket (organizer/admin)</li>
 *   <li>One-to-One: orderItem (OrderItemEntity, nullable) - Order item associated with this ticket</li>
 * </ul>
 * 
 * <p>Validation Rules:
 * <ul>
 *   <li>Name cannot be null or empty</li>
 *   <li>Price must be >= 0 (enforced by database constraint chk_ticket_price_non_negative)</li>
 *   <li>If endTime provided, must be after startTime (enforced by database constraint chk_ticket_end_after_start)</li>
 *   <li>QR code and printOutUrl must be valid S3 URLs (if provided)</li>
 * </ul>
 * 
 * <p>Indexes (from V1__create_base_tables.sql):
 * <ul>
 *   <li>idx_ticket_event on event_id</li>
 *   <li>idx_ticket_status on ticket_status</li>
 *   <li>idx_ticket_type on ticket_type</li>
 *   <li>idx_ticket_purchaser on purchaser_id</li>
 * </ul>
 */
@Entity
@Table(name = "ticket", indexes = {
    @Index(name = "idx_ticket_event", columnList = "event_id"),
    @Index(name = "idx_ticket_status", columnList = "ticket_status"),
    @Index(name = "idx_ticket_type", columnList = "ticket_type"),
    @Index(name = "idx_ticket_purchaser", columnList = "purchaser_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TicketEntity extends BaseEntity {

    @NotBlank(message = "Ticket name is required")
    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @NotNull(message = "Ticket price is required")
    @DecimalMin(value = "0.0", message = "Ticket price must be non-negative")
    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @NotNull(message = "Ticket type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "ticket_type", nullable = false, columnDefinition = "ticket_type")
    private TicketType ticketType;

    @NotNull(message = "Ticket status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "ticket_status", nullable = false, columnDefinition = "ticket_status")
    private TicketStatus ticketStatus;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "qr_code", length = 500)
    private String qrCode;

    @Column(name = "print_out_url", length = 500)
    private String printOutUrl;

    /**
     * Event this ticket belongs to.
     * Many tickets can belong to one event.
     */
    @NotNull(message = "Event is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false, foreignKey = @ForeignKey(name = "fk_ticket_event"))
    private EventEntity event;

    /**
     * User who purchased this ticket.
     * Many tickets can be purchased by one user.
     * Nullable because tickets can be created before being purchased.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchaser_id", foreignKey = @ForeignKey(name = "fk_ticket_purchaser"))
    private UserEntity purchaser;

    /**
     * User who created this ticket (organizer/admin).
     * Many tickets can be created by one user.
     */
    @NotNull(message = "Ticket creator is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id", nullable = false, foreignKey = @ForeignKey(name = "fk_ticket_creator"))
    private UserEntity creator;

    /**
     * Order item associated with this ticket.
     * One-to-one relationship with OrderItemEntity.
     * To be activated when OrderItemEntity is created.
     */
    // @OneToOne(mappedBy = "ticket", fetch = FetchType.LAZY)
    // private OrderItemEntity orderItem;
}

