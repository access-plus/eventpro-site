package com.accessplus.eventpro.core.user.entity;

import com.accessplus.eventpro.core.common.model.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * User entity representing application users (customers, organizers, admins).
 * 
 * <p>Fields match the database schema from V1__create_base_tables.sql:
 * <ul>
 *   <li>id (UUID, PK) - From BaseEntity</li>
 *   <li>email (String, unique, not null) - User email address</li>
 *   <li>phoneNumber (String, nullable) - Phone number for SMS notifications</li>
 *   <li>firstName (String, not null) - User's first name</li>
 *   <li>lastName (String, not null) - User's last name</li>
 *   <li>cognitoUserId (String, unique, not null) - AWS Cognito user ID</li>
 *   <li>createdAt (LocalDateTime) - From BaseEntity</li>
 *   <li>updatedAt (LocalDateTime) - From BaseEntity</li>
 * </ul>
 * 
 * <p>Relationships (to be added in future phases):
 * <ul>
 *   <li>One-to-Many: orders (List<OrderEntity>)</li>
 *   <li>One-to-Many: cartItems (List<CartEntity>)</li>
 *   <li>One-to-Many: events (List<EventEntity>) - Events created by organizer</li>
 *   <li>One-to-Many: userNotifications (List<UserNotificationEntity>)</li>
 *   <li>One-to-One: notificationPreference (NotificationPreferenceEntity)</li>
 * </ul>
 */
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_user_email", columnList = "email"),
    @Index(name = "idx_user_cognito_id", columnList = "cognito_user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserEntity extends BaseEntity {

    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(name = "cognito_user_id", nullable = false, unique = true, length = 255)
    private String cognitoUserId;

    // Relationships will be added in future phases when related entities are created
    // For now, we'll use lazy initialization to avoid circular dependencies
    
    /**
     * Events created by this user (as organizer).
     * To be implemented when EventEntity is created.
     */
    // @OneToMany(mappedBy = "organizer", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    // private List<EventEntity> events = new ArrayList<>();

    /**
     * Orders placed by this user.
     * To be implemented when OrderEntity is created.
     */
    // @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    // private List<OrderEntity> orders = new ArrayList<>();

    /**
     * Cart items for this user.
     * To be implemented when CartEntity is created.
     */
    // @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    // private List<CartEntity> cartItems = new ArrayList<>();

    /**
     * User notifications.
     * To be implemented when UserNotificationEntity is created.
     */
    // @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    // private List<UserNotificationEntity> userNotifications = new ArrayList<>();

    /**
     * Notification preferences for this user.
     * To be implemented when NotificationPreferenceEntity is created.
     */
    // @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    // private NotificationPreferenceEntity notificationPreference;
}

