# Migration Guide: Using Shared Module

## Overview

The `shared/` module contains framework-agnostic entities, enums, and DTOs that can be used by both:
- Backend modules (Spring Boot)
- Lambda functions (Quarkus)

This eliminates code duplication and ensures consistency.

## What's in the Shared Module

- **Entities**: `BaseEntity`, `OrderEntity`, `OrderItemEntity`, `TicketEntity`
- **Enums**: `OrderStatus`, `TicketStatus`, `TicketType`
- **Models/DTOs**: `OrderMessage`, `PaymentMessage`

## Migration Steps

### 1. Build and Publish Shared Module

```bash
cd shared
./gradlew build publishToMavenLocal
```

### 2. Update Backend Modules

**Option A: Use Composite Build (Recommended)**

Update `backend/services/settings.gradle`:
```gradle
includeBuild '../shared'
```

Then in `backend/services/modules/eventpro-order/build.gradle`:
```gradle
dependencies {
    // Replace local entities with shared module
    implementation 'com.accessplus.eventpro:eventpro-shared:1.0.0'
    
    // Remove duplicate entity classes
    // Keep only service/repository/controller code
}
```

**Option B: Use Project Dependency (If using root-level multi-project)**

Update `backend/settings.gradle`:
```gradle
include ':shared'
project(':shared').projectDir = file('../shared')
```

Then in module `build.gradle`:
```gradle
dependencies {
    implementation project(':shared')
}
```

### 3. Update Lambda Functions

**Option A: Use Composite Build**

Update `backend/lambdas/order-processor/settings.gradle`:
```gradle
includeBuild '../shared'
```

Then in `backend/lambdas/order-processor/build.gradle`:
```gradle
dependencies {
    implementation 'com.accessplus.eventpro:eventpro-shared:1.0.0'
    
    // Remove duplicate entity/enum/model classes
}
```

**Option B: Use Maven Local**

After publishing shared module:
```gradle
dependencies {
    implementation 'com.accessplus.eventpro:eventpro-shared:1.0.0'
}
```

### 4. Update Imports

Replace imports:
- `com.accessplus.eventpro.order.order.entity.OrderEntity` 
  → `com.accessplus.eventpro.shared.entity.OrderEntity`
- `com.accessplus.eventpro.order.order.entity.OrderStatus`
  → `com.accessplus.eventpro.shared.enum.OrderStatus`
- etc.

### 5. Handle Entity Relationships

**Important**: The shared module uses UUID references for cross-module relationships (e.g., `userId`, `eventId`) instead of entity relationships to maintain framework independence.

**Backend modules** can extend shared entities or add entity relationships:

```java
// In backend module, create extended entity if needed
@Entity
@Table(name = "order")
public class OrderEntity extends com.accessplus.eventpro.shared.entity.OrderEntity {
    
    // Add Spring-specific relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private UserEntity user;
}
```

**Or use the UUID directly** and fetch entities separately when needed.

### 6. Remove Duplicate Code

After migration:
- Delete duplicate entity classes from backend modules
- Delete duplicate entity classes from Lambda functions
- Delete duplicate enum classes
- Delete duplicate model classes

### 7. Update Tests

Update test imports to use shared module classes.

## Benefits

✅ **Single Source of Truth**: Entities defined once  
✅ **Type Safety**: Same types across backend and Lambda  
✅ **Consistency**: Schema changes propagate automatically  
✅ **Maintainability**: Update once, use everywhere  
✅ **Framework Agnostic**: Works with Spring Boot and Quarkus  

## Notes

- The shared module uses UUID references for cross-module relationships
- Backend modules can add entity relationships via `@ManyToOne` if needed
- Lambda functions typically work with UUIDs directly
- All JPA annotations are compatible with both Spring Boot and Quarkus

