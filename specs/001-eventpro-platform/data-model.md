# Data Model: EventPro Platform

**Date**: 2025-01-15  
**Phase**: 1 - Design & Contracts  
**Database**: PostgreSQL 15+ (RDS Multi-AZ)

## Overview

The EventPro platform uses PostgreSQL as the primary database with 12 core entities supporting the event ticketing business model. All entities extend `BaseEntity` which provides `id` (UUID), `createdAt`, and `updatedAt` fields.

## Entity Relationships

```
User (1) ──< (N) Event (organizer)
User (1) ──< (N) Order
User (1) ──< (N) Cart
User (1) ──< (N) UserNotification
User (1) ──< (1) NotificationPreference

Event (1) ──< (1) Address
Event (1) ──< (N) Ticket
Event (N) >──< (1) Category

Order (1) ──< (N) OrderItem
Order (1) ──< (1) Payment

OrderItem (1) >──< (1) Ticket

Notification (1) ──< (N) UserNotification
```

## Core Entities

### 1. UserEntity

**Purpose**: Represents application users (customers, organizers, admins)

**Fields**:
- `id` (UUID, PK) - Primary key
- `email` (String, unique, not null) - User email address
- `phoneNumber` (String, nullable) - Phone number for SMS notifications
- `firstName` (String, not null) - User's first name
- `lastName` (String, not null) - User's last name
- `cognitoUserId` (String, unique, not null) - AWS Cognito user ID
- `createdAt` (LocalDateTime) - From BaseEntity
- `updatedAt` (LocalDateTime) - From BaseEntity

**Relationships**:
- One-to-Many: `orders` (List<OrderEntity>)
- One-to-Many: `cartItems` (List<CartEntity>)
- One-to-Many: `events` (List<EventEntity>) - Events created by organizer
- One-to-Many: `userNotifications` (List<UserNotificationEntity>)
- One-to-One: `notificationPreference` (NotificationPreferenceEntity)

**Validation Rules**:
- Email must be valid format
- Phone number must be valid format (if provided)
- Cognito user ID must be unique

**Indexes**:
- `idx_user_email` on `email`
- `idx_user_cognito_id` on `cognitoUserId`

### 2. CategoryEntity

**Purpose**: Categorizes events (Music, Sports, Arts & Crafts, etc.)

**Fields**:
- `id` (UUID, PK) - Primary key
- `name` (String, unique, not null) - Category name
- `description` (String, nullable) - Category description
- `createdAt` (LocalDateTime) - From BaseEntity
- `updatedAt` (LocalDateTime) - From BaseEntity

**Relationships**:
- One-to-Many: `events` (List<EventEntity>)

**Predefined Categories**:
- Music
- Sports
- Arts & Crafts
- Fashion & Beauty
- Health & Fitness
- School Program

**Validation Rules**:
- Name must be unique
- Name cannot be null or empty

**Indexes**:
- `idx_category_name` on `name`

### 3. AddressEntity

**Purpose**: Stores event location information

**Fields**:
- `id` (UUID, PK) - Primary key
- `street` (String, not null) - Street address
- `city` (String, not null) - City name
- `state` (String, not null) - State/province
- `zipCode` (String, not null) - ZIP/postal code
- `country` (String, not null) - Country name
- `latitude` (BigDecimal, nullable) - GPS latitude
- `longitude` (BigDecimal, nullable) - GPS longitude
- `createdAt` (LocalDateTime) - From BaseEntity
- `updatedAt` (LocalDateTime) - From BaseEntity

**Relationships**:
- One-to-One: `event` (EventEntity) - Bidirectional

**Validation Rules**:
- Street, city, state, zipCode, country are required
- Latitude/longitude should be valid GPS coordinates if provided

**Indexes**:
- `idx_address_city_state` on `city`, `state` (for location-based queries)

### 4. EventEntity

**Purpose**: Represents events that users can attend

**Fields**:
- `id` (UUID, PK) - Primary key
- `name` (String, not null) - Event name
- `description` (String, nullable) - Event description
- `startTime` (LocalDateTime, not null) - Event start date/time
- `endTime` (LocalDateTime, not null) - Event end date/time
- `imageUrl` (String, nullable) - S3 URL for event image
- `marketingEnabled` (Boolean, default false) - Whether event is promoted
- `createdAt` (LocalDateTime) - From BaseEntity
- `updatedAt` (LocalDateTime) - From BaseEntity

**Relationships**:
- Many-to-One: `organizer` (UserEntity) - User who created the event
- Many-to-One: `category` (CategoryEntity)
- One-to-One: `address` (AddressEntity)
- One-to-Many: `tickets` (List<TicketEntity>)

**Validation Rules**:
- Name cannot be null or empty
- End time must be after start time
- Image URL must be valid S3 URL format (if provided)

**Indexes**:
- `idx_event_organizer` on `organizer_id`
- `idx_event_category` on `category_id`
- `idx_event_start_time` on `startTime` (for date range queries)
- `idx_event_marketing` on `marketingEnabled` (for featured events)

### 5. TicketEntity

**Purpose**: Represents individual tickets for events

**Fields**:
- `id` (UUID, PK) - Primary key
- `name` (String, not null) - Ticket name/description
- `price` (BigDecimal, not null) - Ticket price
- `ticketType` (Enum: TicketType, not null) - VIP, REGULAR, EARLY_BIRD
- `ticketStatus` (Enum: TicketStatus, not null) - AVAILABLE, SOLD, RESERVED
- `startTime` (LocalDateTime, nullable) - Ticket sale start time
- `endTime` (LocalDateTime, nullable) - Ticket sale end time
- `qrCode` (String, nullable) - QR code image URL (S3)
- `printOutUrl` (String, nullable) - Printable ticket PDF URL (S3)
- `createdAt` (LocalDateTime) - From BaseEntity
- `updatedAt` (LocalDateTime) - From BaseEntity

**Relationships**:
- Many-to-One: `event` (EventEntity)
- Many-to-One: `purchaser` (UserEntity, nullable) - User who purchased ticket
- Many-to-One: `creator` (UserEntity) - User who created ticket (organizer/admin)
- One-to-One: `orderItem` (OrderItemEntity, nullable)

**Enums**:
- `TicketType`: VIP, REGULAR, EARLY_BIRD
- `TicketStatus`: AVAILABLE, SOLD, RESERVED

**Validation Rules**:
- Price must be >= 0
- Name cannot be null or empty
- If endTime provided, must be after startTime
- QR code and printOutUrl must be valid S3 URLs (if provided)

**State Transitions**:
- AVAILABLE → RESERVED (when added to cart or order created)
- RESERVED → SOLD (when payment successful)
- RESERVED → AVAILABLE (when order cancelled or payment failed)
- SOLD → (final state, cannot change)

**Indexes**:
- `idx_ticket_event` on `event_id`
- `idx_ticket_status` on `ticketStatus`
- `idx_ticket_type` on `ticketType`
- `idx_ticket_purchaser` on `purchaser_id`

### 6. CartEntity

**Purpose**: Represents items in user's shopping cart

**Fields**:
- `id` (UUID, PK) - Primary key
- `quantity` (Integer, not null) - Number of tickets
- `createdAt` (LocalDateTime) - From BaseEntity
- `updatedAt` (LocalDateTime) - From BaseEntity

**Relationships**:
- Many-to-One: `user` (UserEntity)
- Many-to-One: `ticket` (TicketEntity)

**Validation Rules**:
- Quantity must be > 0
- Ticket must be AVAILABLE status
- User cannot add same ticket twice (unique constraint on user + ticket)

**Indexes**:
- `idx_cart_user` on `user_id`
- `idx_cart_ticket` on `ticket_id`
- Unique constraint: `uk_cart_user_ticket` on `user_id`, `ticket_id`

### 7. OrderEntity

**Purpose**: Represents customer orders

**Fields**:
- `id` (UUID, PK) - Primary key
- `orderNumber` (String, unique, not null) - Human-readable order number
- `totalAmount` (BigDecimal, not null) - Total order amount
- `status` (Enum: OrderStatus, not null) - PENDING, PAID, CANCELLED, REFUNDED
- `orderDate` (LocalDateTime, not null) - When order was created
- `createdAt` (LocalDateTime) - From BaseEntity
- `updatedAt` (LocalDateTime) - From BaseEntity

**Relationships**:
- Many-to-One: `user` (UserEntity)
- One-to-Many: `orderItems` (List<OrderItemEntity>)
- One-to-One: `payment` (PaymentEntity, nullable)

**Enums**:
- `OrderStatus`: PENDING, PAID, CANCELLED, REFUNDED

**Validation Rules**:
- Total amount must be >= 0
- Order number must be unique
- Order date cannot be null

**State Transitions**:
- PENDING → PAID (when payment successful)
- PENDING → CANCELLED (when order cancelled or payment failed)
- PAID → REFUNDED (when refund processed)

**Indexes**:
- `idx_order_user` on `user_id`
- `idx_order_status` on `status`
- `idx_order_number` on `orderNumber`
- `idx_order_date` on `orderDate`

### 8. OrderItemEntity

**Purpose**: Represents individual items within an order

**Fields**:
- `id` (UUID, PK) - Primary key
- `quantity` (Integer, not null) - Number of tickets
- `price` (BigDecimal, not null) - Price per ticket at time of purchase
- `createdAt` (LocalDateTime) - From BaseEntity
- `updatedAt` (LocalDateTime) - From BaseEntity

**Relationships**:
- Many-to-One: `order` (OrderEntity)
- One-to-One: `ticket` (TicketEntity)

**Validation Rules**:
- Quantity must be > 0
- Price must be >= 0
- Price should match ticket price at time of order

**Indexes**:
- `idx_order_item_order` on `order_id`
- `idx_order_item_ticket` on `ticket_id`

### 9. PaymentEntity

**Purpose**: Stores payment transaction information

**Fields**:
- `id` (UUID, PK) - Primary key
- `amount` (BigDecimal, not null) - Payment amount
- `paymentMethod` (String, not null) - Payment method (e.g., "stripe")
- `transactionId` (String, unique, nullable) - External payment provider transaction ID
- `status` (Enum: PaymentStatus, not null) - PENDING, SUCCESS, FAILED, REFUNDED
- `paymentDate` (LocalDateTime, nullable) - When payment was processed
- `createdAt` (LocalDateTime) - From BaseEntity
- `updatedAt` (LocalDateTime) - From BaseEntity

**Relationships**:
- One-to-One: `order` (OrderEntity)

**Enums**:
- `PaymentStatus`: PENDING, SUCCESS, FAILED, REFUNDED

**Validation Rules**:
- Amount must be > 0
- Amount should match order total amount
- Transaction ID must be unique (if provided)
- Payment method cannot be null

**State Transitions**:
- PENDING → SUCCESS (when payment confirmed)
- PENDING → FAILED (when payment fails)
- SUCCESS → REFUNDED (when refund processed)

**Indexes**:
- `idx_payment_order` on `order_id`
- `idx_payment_status` on `status`
- `idx_payment_transaction_id` on `transactionId`
- `idx_payment_date` on `paymentDate`

### 10. NotificationEntity

**Purpose**: Represents system notifications

**Fields**:
- `id` (UUID, PK) - Primary key
- `title` (String, not null) - Notification title
- `message` (String, not null) - Notification message
- `type` (Enum: NotificationType, not null) - Type of notification
- `deliveryType` (Enum: NotificationDeliveryType, not null) - How notification is delivered
- `createdAt` (LocalDateTime) - From BaseEntity
- `updatedAt` (LocalDateTime) - From BaseEntity

**Relationships**:
- One-to-Many: `userNotifications` (List<UserNotificationEntity>)

**Enums**:
- `NotificationType`: ORDER_CONFIRMATION, PAYMENT_SUCCESS, PAYMENT_FAILED, EVENT_REMINDER, TICKET_READY, SYSTEM_ANNOUNCEMENT
- `NotificationDeliveryType`: EMAIL, SMS, IN_APP, PUSH

**Validation Rules**:
- Title and message cannot be null or empty

**Indexes**:
- `idx_notification_type` on `type`
- `idx_notification_delivery` on `deliveryType`

### 11. UserNotificationEntity

**Purpose**: Links notifications to users (many-to-many with status)

**Fields**:
- `id` (UUID, PK) - Primary key
- `status` (Enum: UserNotificationStatus, not null) - UNREAD, READ
- `readAt` (LocalDateTime, nullable) - When notification was read
- `createdAt` (LocalDateTime) - From BaseEntity
- `updatedAt` (LocalDateTime) - From BaseEntity

**Relationships**:
- Many-to-One: `user` (UserEntity)
- Many-to-One: `notification` (NotificationEntity)

**Enums**:
- `UserNotificationStatus`: UNREAD, READ

**Validation Rules**:
- readAt must be set when status is READ
- readAt must be null when status is UNREAD

**Indexes**:
- `idx_user_notification_user` on `user_id`
- `idx_user_notification_status` on `status`
- `idx_user_notification_created` on `createdAt`

### 12. NotificationPreferenceEntity

**Purpose**: Stores user notification delivery preferences

**Fields**:
- `id` (UUID, PK) - Primary key
- `emailEnabled` (Boolean, default true) - Enable email notifications
- `smsEnabled` (Boolean, default true) - Enable SMS notifications
- `pushEnabled` (Boolean, default true) - Enable push notifications
- `createdAt` (LocalDateTime) - From BaseEntity
- `updatedAt` (LocalDateTime) - From BaseEntity

**Relationships**:
- One-to-One: `user` (UserEntity)

**Validation Rules**:
- At least one notification method must be enabled

**Indexes**:
- `idx_notification_preference_user` on `user_id` (unique)

## Base Entity

All entities extend `BaseEntity` which provides:

**Fields**:
- `id` (UUID, PK) - Primary key, auto-generated
- `createdAt` (LocalDateTime) - Timestamp when record created
- `updatedAt` (LocalDateTime) - Timestamp when record last updated

**Annotations**:
- `@MappedSuperclass` - Not a table itself
- `@CreationTimestamp` on `createdAt`
- `@UpdateTimestamp` on `updatedAt`

## Database Constraints

### Foreign Key Constraints
- All foreign keys have `ON DELETE CASCADE` or `ON DELETE RESTRICT` as appropriate
- User deletion: RESTRICT (cannot delete user with orders)
- Event deletion: CASCADE (delete tickets, address)
- Order deletion: RESTRICT (cannot delete paid orders)

### Unique Constraints
- User email: unique
- User cognitoUserId: unique
- Category name: unique
- Order orderNumber: unique
- Payment transactionId: unique (if provided)
- Cart (user + ticket): unique (one cart item per user-ticket combination)

### Check Constraints
- Ticket price >= 0
- Order totalAmount >= 0
- Payment amount > 0
- Cart quantity > 0
- OrderItem quantity > 0
- Event endTime > startTime
- Ticket endTime > startTime (if both provided)

## Database Migrations

**Tool**: Flyway or Liquibase

**Migration Strategy**:
1. Create BaseEntity table structure (via @MappedSuperclass)
2. Create Category table (seed data)
3. Create User table
4. Create Address table
5. Create Event table (references User, Category, Address)
6. Create Ticket table (references Event, User)
7. Create Cart table (references User, Ticket)
8. Create Order table (references User)
9. Create OrderItem table (references Order, Ticket)
10. Create Payment table (references Order)
11. Create Notification table
12. Create UserNotification table (references User, Notification)
13. Create NotificationPreference table (references User)
14. Create indexes
15. Create constraints

## Data Seeding

**Initial Data Required**:
- Category entities (Music, Sports, Arts & Crafts, Fashion & Beauty, Health & Fitness, School Program)
- Admin user (via Cognito + database sync)

**Seed Script Location**: `services/core-api/src/main/resources/db/migration/V1__seed_categories.sql`

## Performance Considerations

**Indexes Created For**:
- All foreign keys (automatic by JPA)
- Frequently queried fields (email, orderNumber, status fields)
- Date range queries (startTime, orderDate, paymentDate)
- Search fields (event name, user email)

**Query Optimization**:
- Use `@EntityGraph` for eager loading when needed
- Avoid N+1 queries with proper fetch joins
- Use pagination for list queries
- Cache frequently accessed data (categories, user preferences)

## Security Considerations

- All sensitive data (payment info) stored in Payment entity
- Payment transaction IDs are unique and indexed
- User data encrypted at rest (RDS encryption)
- Audit trail via `createdAt` and `updatedAt` timestamps
- Soft deletes considered but not implemented (can be added later)

