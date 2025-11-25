# EventPro Shared Module

Framework-agnostic shared code for EventPro platform.

## Purpose

This module contains entities, enums, and DTOs that are used by both:
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

