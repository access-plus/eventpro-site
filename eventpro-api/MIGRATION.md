# Migration Guide: Microservices to Modular Monolith

## Current Status

✅ **Completed:**
- Project structure created
- Build system configured (Gradle)
- Module structure defined
- Main application class created
- Shared utilities migrated to `eventpro-core`
- Dockerfile created
- Basic configuration files

## Project Structure

```
eventpro-api/
├── build.gradle              # Root build configuration
├── settings.gradle            # Project settings
├── Dockerfile                 # Docker build file
├── README.md                  # Project documentation
│
└── modules/
    ├── eventpro-core/         # Core module (Users, Auth, Common)
    │   ├── build.gradle
    │   └── src/main/java/com/accessplus/eventpro/core/
    │       ├── common/        # BaseEntity, BusinessException
    │       └── messaging/     # SQSMessagePublisher
    │
    ├── eventpro-event/         # Event module (Events, Tickets, Search)
    │   ├── build.gradle
    │   └── src/main/java/com/accessplus/eventpro/event/
    │
    ├── eventpro-order/         # Order module (Cart, Orders, Checkout)
    │   ├── build.gradle
    │   └── src/main/java/com/accessplus/eventpro/order/
    │
    ├── eventpro-payment/       # Payment module (Stripe)
    │   ├── build.gradle
    │   └── src/main/java/com/accessplus/eventpro/payment/
    │
    ├── eventpro-notification/  # Notification module (Email, SMS, WebSocket)
    │   ├── build.gradle
    │   └── src/main/java/com/accessplus/eventpro/notification/
    │
    └── eventpro-api/          # Main application module
        ├── build.gradle
        └── src/main/
            ├── java/com/accessplus/eventpro/
            │   └── EventProApplication.java
            └── resources/
                └── application.yml
```

## Next Steps

### Phase 1: Migrate Core Module (In Progress)

**From:** `services/core-api` → **To:** `eventpro-api/modules/eventpro-core`

**Tasks:**
1. ✅ Create module structure
2. ✅ Migrate shared utilities (BaseEntity, BusinessException, SQSMessagePublisher)
3. ⏳ Migrate User entity and repository
4. ⏳ Migrate User service
5. ⏳ Migrate Authentication/Cognito integration
6. ⏳ Migrate Security configuration
7. ⏳ Create REST controllers

**Package Mapping:**
- `com.accessplus.eventpro.core.*` → `com.accessplus.eventpro.core.*` (same)

### Phase 2: Migrate Event Module

**From:** `services/event-api` → **To:** `eventpro-api/modules/eventpro-event`

**Tasks:**
1. Create Event entity
2. Create Ticket entity
3. Create repositories
4. Create services
5. Create REST controllers
6. Migrate search functionality

**Package Mapping:**
- `com.accessplus.eventpro.event.*` → `com.accessplus.eventpro.event.*` (same)

### Phase 3: Migrate Order Module

**From:** `services/lambdas/order-processor` → **To:** `eventpro-api/modules/eventpro-order`

**Tasks:**
1. Create Cart entity
2. Create Order entity
3. Create OrderItem entity
4. Create services (CartService, OrderService, CheckoutService)
5. Convert async SQS processing to synchronous
6. Create REST controllers

**Package Mapping:**
- `com.accessplus.eventpro.order.*` → `com.accessplus.eventpro.order.*` (same)

### Phase 4: Migrate Payment Module

**From:** `services/lambdas/payment-processor` → **To:** `eventpro-api/modules/eventpro-payment`

**Tasks:**
1. Create Payment entity
2. Create StripeService
3. Create PaymentService
4. Create webhook handler
5. Convert async SQS processing to synchronous
6. Create REST controllers

**Package Mapping:**
- `com.accessplus.eventpro.payment.*` → `com.accessplus.eventpro.payment.*` (same)

### Phase 5: Migrate Notification Module

**From:** `services/lambdas/notification-sender` → **To:** `eventpro-api/modules/eventpro-notification`

**Tasks:**
1. Create Notification entity
2. Create EmailService (AWS SES)
3. Create SmsService (AWS SNS)
4. Create WebSocketService
5. Create NotificationService
6. Create Spring Event listeners
7. Create REST controllers

**Package Mapping:**
- `com.accessplus.eventpro.notification.*` → `com.accessplus.eventpro.notification.*` (same)

## Testing the Build

```bash
cd services/eventpro-api
./gradlew build
```

This should build all modules successfully.

## Running Locally

```bash
cd services/eventpro-api
./gradlew :eventpro-api:bootRun
```

## Building Docker Image

```bash
cd services/eventpro-api
docker build -t eventpro-api:latest .
```

## Key Differences from Microservices

1. **No SQS Queues** (initially)
   - Order processing: Synchronous within transaction
   - Payment processing: Synchronous within transaction
   - Notifications: Spring Events (async within application)

2. **Single Database**
   - All entities in one PostgreSQL database
   - Module boundaries via package structure

3. **Single Deployment**
   - One Docker image
   - One ECS service
   - Simpler CI/CD

4. **Module Communication**
   - Direct method calls (same JVM)
   - Spring dependency injection
   - Spring Events for async

## When to Add Back SQS

Consider adding SQS back if:
- High-volume scenarios (10,000+ orders/hour)
- Need guaranteed delivery
- Need retry logic with backoff
- Need dead letter queues
- Need cross-service communication (future microservices)

For now, Spring Events provide sufficient async capabilities within the monolith.

