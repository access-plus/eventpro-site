-- Flyway Migration: V1__create_base_tables.sql
-- Description: Creates all 12 core entity tables with indexes, constraints, and foreign keys
-- Database: PostgreSQL 15+

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Ticket Type Enum
CREATE TYPE ticket_type AS ENUM ('VIP', 'REGULAR', 'EARLY_BIRD');

-- Ticket Status Enum
CREATE TYPE ticket_status AS ENUM ('AVAILABLE', 'SOLD', 'RESERVED');

-- Order Status Enum
CREATE TYPE order_status AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'REFUNDED');

-- Payment Status Enum
CREATE TYPE payment_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- Notification Type Enum
CREATE TYPE notification_type AS ENUM (
    'ORDER_CONFIRMATION',
    'PAYMENT_SUCCESS',
    'PAYMENT_FAILED',
    'EVENT_REMINDER',
    'TICKET_READY',
    'SYSTEM_ANNOUNCEMENT'
);

-- Notification Delivery Type Enum
CREATE TYPE notification_delivery_type AS ENUM ('EMAIL', 'SMS', 'IN_APP', 'PUSH');

-- User Notification Status Enum
CREATE TYPE user_notification_status AS ENUM ('UNREAD', 'READ');

-- ============================================================================
-- TABLES (in dependency order)
-- ============================================================================

-- 1. Category Table
CREATE TABLE category (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. User Table
CREATE TABLE "user" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    cognito_user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Address Table
CREATE TABLE address (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    street VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Event Table
CREATE TABLE event (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    image_url VARCHAR(500),
    marketing_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    organizer_id UUID NOT NULL,
    category_id UUID NOT NULL,
    address_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_event_organizer FOREIGN KEY (organizer_id) REFERENCES "user"(id) ON DELETE RESTRICT,
    CONSTRAINT fk_event_category FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE RESTRICT,
    CONSTRAINT fk_event_address FOREIGN KEY (address_id) REFERENCES address(id) ON DELETE CASCADE
);

-- 5. Ticket Table
CREATE TABLE ticket (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    ticket_type ticket_type NOT NULL,
    ticket_status ticket_status NOT NULL,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    qr_code VARCHAR(500),
    print_out_url VARCHAR(500),
    event_id UUID NOT NULL,
    purchaser_id UUID,
    creator_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ticket_event FOREIGN KEY (event_id) REFERENCES event(id) ON DELETE CASCADE,
    CONSTRAINT fk_ticket_purchaser FOREIGN KEY (purchaser_id) REFERENCES "user"(id) ON DELETE SET NULL,
    CONSTRAINT fk_ticket_creator FOREIGN KEY (creator_id) REFERENCES "user"(id) ON DELETE RESTRICT
);

-- 6. Cart Table
CREATE TABLE cart (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quantity INTEGER NOT NULL,
    user_id UUID NOT NULL,
    ticket_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_ticket FOREIGN KEY (ticket_id) REFERENCES ticket(id) ON DELETE CASCADE
);

-- 7. Order Table
CREATE TABLE "order" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    status order_status NOT NULL,
    order_date TIMESTAMP NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE RESTRICT
);

-- 8. OrderItem Table
CREATE TABLE order_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quantity INTEGER NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    order_id UUID NOT NULL,
    ticket_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_item_order FOREIGN KEY (order_id) REFERENCES "order"(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_item_ticket FOREIGN KEY (ticket_id) REFERENCES ticket(id) ON DELETE RESTRICT
);

-- 9. Payment Table
CREATE TABLE payment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(255),
    status payment_status NOT NULL,
    payment_date TIMESTAMP,
    order_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES "order"(id) ON DELETE RESTRICT
);

-- 10. Notification Table
CREATE TABLE notification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL,
    delivery_type notification_delivery_type NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 11. UserNotification Table
CREATE TABLE user_notification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status user_notification_status NOT NULL,
    read_at TIMESTAMP,
    user_id UUID NOT NULL,
    notification_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_notification_user FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_notification_notification FOREIGN KEY (notification_id) REFERENCES notification(id) ON DELETE CASCADE
);

-- 12. NotificationPreference Table
CREATE TABLE notification_preference (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sms_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notification_preference_user FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

-- ============================================================================
-- UNIQUE CONSTRAINTS
-- ============================================================================

ALTER TABLE "user" ADD CONSTRAINT uk_user_email UNIQUE (email);
ALTER TABLE "user" ADD CONSTRAINT uk_user_cognito_id UNIQUE (cognito_user_id);
ALTER TABLE category ADD CONSTRAINT uk_category_name UNIQUE (name);
ALTER TABLE "order" ADD CONSTRAINT uk_order_number UNIQUE (order_number);
ALTER TABLE payment ADD CONSTRAINT uk_payment_transaction_id UNIQUE (transaction_id);
ALTER TABLE cart ADD CONSTRAINT uk_cart_user_ticket UNIQUE (user_id, ticket_id);
ALTER TABLE notification_preference ADD CONSTRAINT uk_notification_preference_user UNIQUE (user_id);

-- ============================================================================
-- CHECK CONSTRAINTS
-- ============================================================================

-- Ticket constraints
ALTER TABLE ticket ADD CONSTRAINT chk_ticket_price_non_negative CHECK (price >= 0);
ALTER TABLE ticket ADD CONSTRAINT chk_ticket_end_after_start CHECK (end_time IS NULL OR start_time IS NULL OR end_time > start_time);

-- Order constraints
ALTER TABLE "order" ADD CONSTRAINT chk_order_total_non_negative CHECK (total_amount >= 0);

-- Payment constraints
ALTER TABLE payment ADD CONSTRAINT chk_payment_amount_positive CHECK (amount > 0);

-- Cart constraints
ALTER TABLE cart ADD CONSTRAINT chk_cart_quantity_positive CHECK (quantity > 0);

-- OrderItem constraints
ALTER TABLE order_item ADD CONSTRAINT chk_order_item_quantity_positive CHECK (quantity > 0);
ALTER TABLE order_item ADD CONSTRAINT chk_order_item_price_non_negative CHECK (price >= 0);

-- Event constraints
ALTER TABLE event ADD CONSTRAINT chk_event_end_after_start CHECK (end_time > start_time);

-- NotificationPreference constraints
ALTER TABLE notification_preference ADD CONSTRAINT chk_notification_preference_at_least_one_enabled 
    CHECK (email_enabled = TRUE OR sms_enabled = TRUE OR push_enabled = TRUE);

-- UserNotification constraints
ALTER TABLE user_notification ADD CONSTRAINT chk_user_notification_read_at 
    CHECK ((status = 'READ' AND read_at IS NOT NULL) OR (status = 'UNREAD' AND read_at IS NULL));

-- ============================================================================
-- INDEXES
-- ============================================================================

-- User indexes
CREATE INDEX idx_user_email ON "user"(email);
CREATE INDEX idx_user_cognito_id ON "user"(cognito_user_id);

-- Category indexes
CREATE INDEX idx_category_name ON category(name);

-- Address indexes
CREATE INDEX idx_address_city_state ON address(city, state);

-- Event indexes
CREATE INDEX idx_event_organizer ON event(organizer_id);
CREATE INDEX idx_event_category ON event(category_id);
CREATE INDEX idx_event_start_time ON event(start_time);
CREATE INDEX idx_event_marketing ON event(marketing_enabled);

-- Ticket indexes
CREATE INDEX idx_ticket_event ON ticket(event_id);
CREATE INDEX idx_ticket_status ON ticket(ticket_status);
CREATE INDEX idx_ticket_type ON ticket(ticket_type);
CREATE INDEX idx_ticket_purchaser ON ticket(purchaser_id);

-- Cart indexes
CREATE INDEX idx_cart_user ON cart(user_id);
CREATE INDEX idx_cart_ticket ON cart(ticket_id);

-- Order indexes
CREATE INDEX idx_order_user ON "order"(user_id);
CREATE INDEX idx_order_status ON "order"(status);
CREATE INDEX idx_order_number ON "order"(order_number);
CREATE INDEX idx_order_date ON "order"(order_date);

-- OrderItem indexes
CREATE INDEX idx_order_item_order ON order_item(order_id);
CREATE INDEX idx_order_item_ticket ON order_item(ticket_id);

-- Payment indexes
CREATE INDEX idx_payment_order ON payment(order_id);
CREATE INDEX idx_payment_status ON payment(status);
CREATE INDEX idx_payment_transaction_id ON payment(transaction_id);
CREATE INDEX idx_payment_date ON payment(payment_date);

-- Notification indexes
CREATE INDEX idx_notification_type ON notification(type);
CREATE INDEX idx_notification_delivery ON notification(delivery_type);

-- UserNotification indexes
CREATE INDEX idx_user_notification_user ON user_notification(user_id);
CREATE INDEX idx_user_notification_status ON user_notification(status);
CREATE INDEX idx_user_notification_created ON user_notification(created_at);

-- NotificationPreference index (unique index already created via unique constraint)
-- idx_notification_preference_user is handled by unique constraint

