# EventPro Platform - Modular Monolith Architecture

## Executive Summary

This document outlines the **Modular Monolith Architecture** for EventPro Platform, consolidating the microservices approach into a single deployable unit with clear module boundaries. This architecture reduces operational complexity while maintaining the ability to extract services later when needed.

**Key Benefits:**
- ✅ Single build system (no Spring Boot + Quarkus conflicts)
- ✅ Simpler deployment and operations
- ✅ Lower infrastructure costs (~$200-300/month vs $440-625/month)
- ✅ Easier local development and testing
- ✅ Faster development velocity
- ✅ Can extract modules to microservices later when scale demands it

**When to Extract to Microservices:**
- Multiple teams need independent deployment cycles
- Clear scaling differences between modules
- Technology diversity requirements
- Service boundaries are well-defined and stable

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                  │
│              Deployed on S3 + CloudFront CDN                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Application Load Balancer (ALB)                │
│              - Authentication (AWS Cognito)                 │
│              - Request Routing                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│         EventPro API (Modular Monolith - Spring Boot)       │
│         ECS Fargate - Single Service                        │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Core Module │  │ Event Module │  │ Order Module │       │
│  │  (Users,     │  │ (Search,     │  │ (Cart,       │       │
│  │   Auth)      │  │  Analytics)  │  │  Checkout)   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │Payment Module│  │Notification  │  │  Shared      │       │
│  │ (Stripe)     │  │  Module      │  │  Utilities   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL (RDS Multi-AZ)                      │
│              - All entities in single database              │
│              - Module boundaries via package structure      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│         Lambda Functions (Serverless Only)                  │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │  Analytics   │  │  Scheduled   │                         │
│  │  Service     │  │  Tasks       │                         │
│  │  (Quarkus)   │  │  (Quarkus)   │                         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
            ┌──────────────┐    ┌──────────────┐
            │  AWS SES     │    │  AWS SNS     │
            │  (Email)     │    │  (SMS)       │
            └──────────────┘    └──────────────┘
```

---

## Module Structure

### Module Boundaries

The monolith is organized into **modules** (not microservices) with clear boundaries:

```
eventpro-api/
├── eventpro-core/          # Core business logic
│   ├── user/              # User management
│   ├── auth/              # Authentication/Authorization
│   └── common/            # Common utilities
│
├── eventpro-event/        # Event management
│   ├── event/             # Event CRUD
│   ├── ticket/            # Ticket management
│   └── search/            # Event search
│
├── eventpro-order/        # Order processing
│   ├── cart/              # Shopping cart
│   ├── order/             # Order management
│   └── checkout/          # Checkout flow
│
├── eventpro-payment/       # Payment processing
│   ├── stripe/            # Stripe integration
│   └── webhook/           # Payment webhooks
│
├── eventpro-notification/  # Notifications
│   ├── email/             # Email notifications
│   ├── sms/               # SMS notifications
│   └── websocket/         # Real-time notifications
│
└── eventpro-api/          # REST API layer
    ├── controller/        # REST controllers
    ├── dto/               # Data transfer objects
    └── config/            # Configuration
```

### Module Communication

**Within Monolith:**
- Direct method calls (same JVM)
- Spring `@Autowired` dependency injection
- Event-driven within application (Spring Events)

**External:**
- REST API endpoints (HTTP)
- Database (PostgreSQL)
- AWS Services (SQS, SES, SNS, S3)

---

## Detailed Module Design

### 1. Core Module (`eventpro-core`)

**Responsibilities:**
- User management (CRUD operations)
- Authentication/Authorization (Cognito integration)
- Role management (ADMIN, ORGANIZER, USER)
- Common utilities and exceptions

**Package Structure:**
```
com.accessplus.eventpro.core/
├── user/
│   ├── UserService.java
│   ├── UserRepository.java
│   └── UserEntity.java
├── auth/
│   ├── CognitoService.java
│   ├── SecurityConfig.java
│   └── JwtTokenProvider.java
└── common/
    ├── BaseEntity.java
    ├── BusinessException.java
    └── Constants.java
```

**API Endpoints:**
- `GET /api/v1/users` - List users
- `GET /api/v1/users/{id}` - Get user
- `PUT /api/v1/users/{id}` - Update user
- `GET /api/v1/users/me` - Get current user

---

### 2. Event Module (`eventpro-event`)

**Responsibilities:**
- Event CRUD operations
- Ticket management
- Event search and filtering
- Event analytics (read-only)

**Package Structure:**
```
com.accessplus.eventpro.event/
├── event/
│   ├── EventService.java
│   ├── EventRepository.java
│   └── EventEntity.java
├── ticket/
│   ├── TicketService.java
│   ├── TicketRepository.java
│   └── TicketEntity.java
└── search/
    ├── EventSearchService.java
    └── EventSearchRepository.java
```

**API Endpoints:**
- `GET /api/v1/events` - List/search events
- `GET /api/v1/events/{id}` - Get event details
- `POST /api/v1/events` - Create event (ORGANIZER)
- `PUT /api/v1/events/{id}` - Update event (ORGANIZER)
- `DELETE /api/v1/events/{id}` - Delete event (ORGANIZER)
- `GET /api/v1/events/{id}/tickets` - Get event tickets
- `GET /api/v1/events/{id}/analytics` - Get event analytics (ORGANIZER)

---

### 3. Order Module (`eventpro-order`)

**Responsibilities:**
- Shopping cart management
- Order creation and management
- Checkout flow
- Order status tracking

**Package Structure:**
```
com.accessplus.eventpro.order/
├── cart/
│   ├── CartService.java
│   ├── CartRepository.java
│   └── CartEntity.java
├── order/
│   ├── OrderService.java
│   ├── OrderRepository.java
│   └── OrderEntity.java
└── checkout/
    └── CheckoutService.java
```

**API Endpoints:**
- `GET /api/v1/cart` - Get user's cart
- `POST /api/v1/cart/items` - Add item to cart
- `PUT /api/v1/cart/items/{id}` - Update cart item
- `DELETE /api/v1/cart/items/{id}` - Remove cart item
- `POST /api/v1/orders` - Create order from cart
- `GET /api/v1/orders` - List user's orders
- `GET /api/v1/orders/{id}` - Get order details

**Processing Flow:**
```
User clicks "Checkout"
    ↓
CheckoutService.validateCart()
    ↓
CheckoutService.createOrder() [Transaction]
    - Create OrderEntity (PENDING)
    - Create OrderItems
    - Reserve tickets (update availability)
    ↓
PaymentService.processPayment()
    - Create Stripe payment intent
    - Process payment
    ↓
On Success:
    - Update OrderEntity (PAID)
    - Assign tickets to user
    - Generate QR codes
    - Send notifications (async via Spring Events)
```

---

### 4. Payment Module (`eventpro-payment`)

**Responsibilities:**
- Stripe payment processing
- Payment webhook handling
- Payment status management

**Package Structure:**
```
com.accessplus.eventpro.payment/
├── stripe/
│   ├── StripeService.java
│   ├── PaymentIntentService.java
│   └── PaymentEntity.java
└── webhook/
    ├── StripeWebhookController.java
    └── WebhookHandler.java
```

**API Endpoints:**
- `POST /api/v1/payments/intent` - Create payment intent
- `POST /api/v1/payments/confirm` - Confirm payment
- `POST /api/v1/payments/webhook` - Stripe webhook endpoint

**Processing:**
- Synchronous payment processing (within transaction)
- Webhook handling for async Stripe events
- Payment status updates via Spring Events

---

### 5. Notification Module (`eventpro-notification`)

**Responsibilities:**
- Email notifications (AWS SES)
- SMS notifications (AWS SNS)
- WebSocket notifications (real-time)
- Notification preferences

**Package Structure:**
```
com.accessplus.eventpro.notification/
├── email/
│   └── EmailService.java
├── sms/
│   └── SmsService.java
├── websocket/
│   └── WebSocketService.java
└── NotificationService.java
```

**Event Listeners:**
```java
@EventListener
public void handleOrderCreated(OrderCreatedEvent event) {
    notificationService.sendOrderConfirmation(event.getOrder());
}

@EventListener
public void handlePaymentSuccess(PaymentSuccessEvent event) {
    notificationService.sendPaymentConfirmation(event.getOrder());
}
```

**API Endpoints:**
- `GET /api/v1/notifications` - Get user notifications
- `PUT /api/v1/notifications/preferences` - Update preferences
- `WebSocket: /ws/notifications` - Real-time notifications

---

## Database Design

### Single Database, Module Boundaries via Schema

**Option 1: Single Schema (Recommended)**
- All tables in `public` schema
- Module boundaries via naming conventions:
  - `core_users`, `core_roles`
  - `event_events`, `event_tickets`
  - `order_orders`, `order_order_items`
  - `payment_payments`
  - `notification_notifications`

**Option 2: Schema per Module**
- `core` schema for core module
- `event` schema for event module
- `order` schema for order module
- etc.

**Recommendation:** Option 1 (single schema) for simplicity. Can migrate to schemas later if needed.

### Entity Relationships

All relationships remain the same as microservices design:
- User → Events (one-to-many)
- User → Orders (one-to-many)
- Event → Tickets (one-to-many)
- Order → OrderItems (one-to-many)
- Order → Payment (one-to-one)

---

## Build System

### Single Gradle Project

```
eventpro-api/
├── build.gradle              # Root build file
├── settings.gradle           # Project settings
├── gradle.properties         # Gradle properties
│
├── eventpro-core/
│   ├── build.gradle
│   └── src/
│
├── eventpro-event/
│   ├── build.gradle
│   └── src/
│
├── eventpro-order/
│   ├── build.gradle
│   └── src/
│
├── eventpro-payment/
│   ├── build.gradle
│   └── src/
│
├── eventpro-notification/
│   ├── build.gradle
│   └── src/
│
└── eventpro-api/            # Main application module
    ├── build.gradle
    └── src/
        └── main/
            └── java/
                └── EventProApplication.java
```

### build.gradle Structure

**Root build.gradle:**
```gradle
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.5.7'
    id 'io.spring.dependency-management' version '1.1.7'
}

allprojects {
    group = 'com.accessplus.eventpro'
    version = '1.0.0'
    
    repositories {
        mavenCentral()
    }
}

subprojects {
    apply plugin: 'java'
    
    java {
        sourceCompatibility = JavaVersion.VERSION_21
        targetCompatibility = JavaVersion.VERSION_21
    }
}
```

**Module build.gradle (example - eventpro-core):**
```gradle
dependencies {
    // Spring Boot
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-security'
    
    // AWS SDK
    implementation platform('software.amazon.awssdk:bom:2.21.29')
    implementation 'software.amazon.awssdk:cognitoidentityprovider'
    
    // Database
    runtimeOnly 'org.postgresql:postgresql'
    
    // Lombok
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'
}
```

**Main application build.gradle (eventpro-api):**
```gradle
dependencies {
    // Include all modules
    implementation project(':eventpro-core')
    implementation project(':eventpro-event')
    implementation project(':eventpro-order')
    implementation project(':eventpro-payment')
    implementation project(':eventpro-notification')
    
    // Spring Boot
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-actuator'
    
    // WebSocket
    implementation 'org.springframework.boot:spring-boot-starter-websocket'
}
```

---

## Deployment

### Dockerfile

```dockerfile
# Multi-stage build
FROM gradle:8.5-jdk21 AS build
WORKDIR /app

# Copy build files
COPY build.gradle settings.gradle gradle.properties ./
COPY gradlew .
COPY gradle gradle

# Copy all modules
COPY eventpro-core ./eventpro-core
COPY eventpro-event ./eventpro-event
COPY eventpro-order ./eventpro-order
COPY eventpro-payment ./eventpro-payment
COPY eventpro-notification ./eventpro-notification
COPY eventpro-api ./eventpro-api

# Build
RUN chmod +x gradlew
RUN ./gradlew build --no-daemon -x test

# Runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=build /app/eventpro-api/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
```

### ECS Configuration

**Single ECS Service:**
- Service Name: `eventpro-api`
- Task Definition: 1 vCPU, 2GB RAM (can scale)
- Desired Count: 2 (for HA)
- Auto Scaling: 2-10 tasks based on CPU/Memory

**Cost Estimate:**
- 2 tasks (1 vCPU, 2GB RAM each) = ~$60/month
- ALB = ~$20/month
- **Total: ~$80/month** (vs $140/month for 2 services)

---

## Lambda Functions (Serverless Only)

Keep Lambda functions only for truly serverless needs:

### 1. Analytics Service (Quarkus Lambda)

**When to use:**
- Scheduled reports (EventBridge cron)
- Heavy analytics processing
- Batch operations

**Trigger:** EventBridge (scheduled) or API Gateway (on-demand)

### 2. Scheduled Tasks (Quarkus Lambda)

**When to use:**
- Daily/weekly reports
- Data cleanup jobs
- Email digests

**Trigger:** EventBridge cron expressions

---

## Migration Path from Microservices

### Phase 1: Consolidate Core API and Event API (Week 1-2)

1. Create new `eventpro-api` project structure
2. Move Core API code to `eventpro-core` module
3. Move Event API code to `eventpro-event` module
4. Create main `eventpro-api` application module
5. Update API endpoints (remove service prefixes)
6. Test and validate

### Phase 2: Integrate Order Processing (Week 3-4)

1. Move Order Processor Lambda logic to `eventpro-order` module
2. Convert async SQS processing to synchronous within monolith
3. Update checkout flow to be synchronous
4. Remove `order-queue` SQS (or keep for future async needs)
5. Test and validate

### Phase 3: Integrate Payment Processing (Week 5-6)

1. Move Payment Processor Lambda logic to `eventpro-payment` module
2. Convert to synchronous payment processing
3. Keep Stripe webhook endpoint
4. Remove `payment-queue` SQS (or keep for retry logic)
5. Test and validate

### Phase 4: Integrate Notifications (Week 7-8)

1. Move Notification Sender Lambda logic to `eventpro-notification` module
2. Use Spring Events for async notifications
3. Keep SQS for high-volume scenarios (optional)
4. Remove `notification-queue` SQS (or keep for resilience)
5. Test and validate

### Phase 5: Cleanup (Week 9-10)

1. Remove unused Lambda functions
2. Remove unused SQS queues (or keep for future)
3. Update Terraform infrastructure
4. Update CI/CD pipelines
5. Update documentation

---

## When to Extract Back to Microservices

Extract a module to a microservice when:

1. **Independent Scaling Needed**
   - Event search needs 10x more instances than core API
   - Payment processing needs different resource allocation

2. **Technology Diversity**
   - Need different framework (e.g., Go for high-performance search)
   - Need different database (e.g., Elasticsearch for search)

3. **Team Boundaries**
   - Multiple teams need independent deployment
   - Different release cycles

4. **Failure Isolation**
   - Payment processing failures shouldn't affect event browsing
   - Clear service boundaries are well-defined

5. **Regulatory/Compliance**
   - Payment module needs separate infrastructure
   - Different security requirements

---

## Cost Comparison

### Microservices Architecture
- ECS Core API: ~$70/month
- ECS Event API: ~$70/month
- ALB: ~$20/month
- Lambda functions: ~$7/month
- SQS: ~$3/month
- **Total: ~$170/month** (services only)

### Modular Monolith Architecture
- ECS EventPro API: ~$60/month (2 tasks)
- ALB: ~$20/month
- Lambda (analytics only): ~$1/month
- **Total: ~$81/month** (services only)

**Savings: ~$89/month (~52% reduction)**

---

## Benefits Summary

### Development Benefits
- ✅ Single build system (no Spring Boot + Quarkus conflicts)
- ✅ Faster local development (single application)
- ✅ Easier testing (integration tests in single JVM)
- ✅ Simpler debugging (no distributed tracing needed initially)
- ✅ Shared code via modules (no JAR dependencies)

### Operational Benefits
- ✅ Single deployment (one Docker image)
- ✅ Simpler monitoring (one service to monitor)
- ✅ Lower infrastructure costs
- ✅ Easier scaling (scale entire application)
- ✅ Simpler CI/CD pipeline

### Business Benefits
- ✅ Faster time to market
- ✅ Lower operational overhead
- ✅ Easier to maintain
- ✅ Can extract services later when needed

---

## Next Steps

1. **Review and Approve** this architecture
2. **Create migration plan** with detailed tasks
3. **Set up new project structure** (eventpro-api)
4. **Migrate modules** one at a time
5. **Update infrastructure** (Terraform)
6. **Update CI/CD** pipelines
7. **Deploy and validate**

---

**Document Version**: 1.0  
**Created**: 2025-01-17  
**Status**: Proposal - Awaiting Approval

