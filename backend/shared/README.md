# EventPro Shared Module

**DEPRECATED** – This module is no longer used. Code has been inlined:

- **Services**: Use `eventpro-core` and other modules in `backend/services/modules/`
- **Lambdas**: Each lambda (`order-processor`, `payment-processor`, `notification-sender`) has its own local copies under `com.accessplus.eventpro.shared.*`

This folder remains for reference only. Do not add new dependencies.

---

## Original Purpose (Historical)

Framework-agnostic shared code for EventPro platform.

This module contained entities, enums, and DTOs that were used by both:
- Backend modules (Spring Boot)
- Lambda functions (Quarkus)

## Contents

- **Entities**: JPA entities (OrderEntity, OrderItemEntity, TicketEntity, BaseEntity)
- **Enums**: OrderStatus, TicketStatus, TicketType
- **Models/DTOs**: OrderMessage, PaymentMessage

## Dependencies

Minimal dependencies:
- Jakarta Persistence API (JPA)
- Hibernate Core (for annotations)
- Jackson (for JSON serialization)
- Lombok (for boilerplate reduction)

**No framework-specific dependencies** (no Spring, no Quarkus)

## Building

```bash
./gradlew build
```

## Publishing to Local Maven Repository

```bash
./gradlew publishToMavenLocal
```

This makes the module available to other projects via:
```gradle
implementation 'com.accessplus.eventpro:eventpro-shared:1.0.0'
```

## Usage

See [MIGRATION_TO_SHARED_MODULE.md](../MIGRATION_TO_SHARED_MODULE.md) for migration instructions.

## Architecture Decision

The shared module uses **UUID references** for cross-module relationships (e.g., `userId`, `eventId`) instead of entity relationships to maintain framework independence. This allows:

- Backend modules to add entity relationships via `@ManyToOne` if needed
- Lambda functions to work with UUIDs directly
- Framework-agnostic code that works with both Spring Boot and Quarkus

