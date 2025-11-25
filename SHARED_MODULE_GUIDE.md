# Shared Module Guide

**Date**: 2025-01-24  
**Purpose**: Framework-agnostic shared module for EventPro Platform  
**Used By**: Spring Boot backend services and Quarkus Lambda functions

---

## Table of Contents

<details>
<summary>1. Architecture Overview</summary>

### Problem

Code duplication exists between:
- Backend modules (Spring Boot) - `backend/services/modules/eventpro-*/`
- Lambda functions (Quarkus) - `backend/lambdas/*/`

Duplicated code includes:
- Entities: `OrderEntity`, `OrderItemEntity`, `TicketEntity`, `BaseEntity`
- Enums: `OrderStatus`, `TicketStatus`, `TicketType`
- DTOs/Models: `OrderMessage`, `PaymentMessage`
- Exceptions: `BusinessException`, `ResourceNotFoundException`, `ValidationException`, etc.
- Utilities: `DateUtils`, `StringUtils`, `UuidUtils`

### Solution: Shared Module

Create a **framework-agnostic shared module** that contains:
- JPA entities (compatible with both Spring Boot and Quarkus)
- Enums
- DTOs/Models
- Common exceptions
- Common utilities

### Architecture

```
eventpro-site/
├── backend/
│   ├── shared/                # Shared module
│   │   ├── build.gradle
│   │   └── src/main/java/com/accessplus/eventpro/shared/
│   │       ├── entity/        # JPA entities (framework-agnostic)
│   │       ├── enums/         # Enums
│   │       ├── model/         # DTOs/Message models
│   │       ├── exception/     # Common exceptions
│   │       └── util/          # Common utilities
│   ├── services/              # Spring Boot modules
│   │   └── modules/
│   │       └── eventpro-*/    # Depend on shared module
│   └── lambdas/               # Quarkus Lambda functions
│       └── order-processor/   # Depend on shared module
```

### Benefits

1. **Single Source of Truth**: Entities defined once
2. **Type Safety**: Same types across backend and Lambda
3. **Consistency**: Schema changes propagate automatically
4. **Maintainability**: Update once, use everywhere
5. **Framework Agnostic**: Works with Spring Boot and Quarkus

### Dependencies

The shared module has **minimal dependencies**:
- Jakarta Persistence API (JPA)
- Hibernate annotations (for UUID, timestamps)
- Lombok (for boilerplate reduction)
- Jackson (for JSON serialization in DTOs)

**No framework-specific dependencies** (no Spring, no Quarkus)

### Usage

**Backend services modules:**
```gradle
dependencies {
    implementation 'com.accessplus.eventpro:eventpro-shared:1.0.0'
}
```

**Lambda functions:**
```gradle
dependencies {
    implementation 'com.accessplus.eventpro:eventpro-shared:1.0.0'
}
```

### Migration Strategy

1. ✅ Create `backend/shared/` module structure
2. ✅ Move entities from backend to shared
3. ✅ Move entities from Lambda to shared (remove duplicates)
4. ✅ Update backend modules to depend on shared
5. ✅ Update Lambda to depend on shared
6. ✅ Remove duplicate code
7. ✅ Test and verify

</details>

<details>
<summary>2. Quick Reference (TL;DR)</summary>

### TL;DR

**Q: Do I need to build and publish the shared module before using it?**  
**A: No! Gradle Composite Builds handle it automatically.**

### How It Works (Simple Version)

```
┌─────────────────────────────────────────────────────────┐
│  You run: ./gradlew build in backend or Lambda          │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Gradle sees: includeBuild '../shared'                  │
│  in settings.gradle                                     │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Gradle automatically:                                   │
│  1. Builds shared module first                          │
│  2. Makes it available to your project                  │
│  3. Builds your project with shared included           │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  ✅ Done! No manual steps needed                        │
└─────────────────────────────────────────────────────────┘
```

### What You Need to Do

#### 1. Add to settings.gradle

**Backend Services:**
```gradle
// File: backend/services/settings.gradle
includeBuild '../shared'
```

**Lambda:**
```gradle
// File: backend/lambdas/order-processor/settings.gradle
includeBuild '../../shared'
```

#### 2. Add dependency

**Both:**
```gradle
dependencies {
    implementation 'com.accessplus.eventpro:eventpro-shared:1.0.0'
}
```

#### 3. Update Dockerfiles

**Copy shared module into build context:**
```dockerfile
# Backend services Dockerfile (build context: backend/)
COPY shared ./shared

# Lambda Dockerfile (build context: backend/)
COPY shared ./shared
```

#### 4. Update imports

```java
// Old
import com.accessplus.eventpro.order.order.entity.OrderEntity;
import com.accessplus.eventpro.order.order.entity.OrderStatus;

// New
import com.accessplus.eventpro.shared.entity.OrderEntity;
import com.accessplus.eventpro.shared.enums.OrderStatus;
```

### Environments

#### Local Development
```bash
cd backend/services
./gradlew build
# Shared module built automatically ✅
```

#### CI/CD Pipeline
```yaml
gradle-build-backend:
  script:
    - cd backend/services
    - ./gradlew build
    # Shared module built automatically ✅
```

#### Docker Build
```dockerfile
COPY shared ./shared
RUN ./gradlew build
# Shared module built automatically ✅
```

### Key Points

1. **No Publishing** - Gradle handles it internally
2. **Automatic** - Builds when needed
3. **Same Everywhere** - Local, CI/CD, Docker all work the same
4. **No Version Management** - Always uses latest code
5. **Simple** - Just add `includeBuild` and dependency

### Comparison

| Approach | Publishing Needed? | CI/CD Complexity | Best For |
|----------|-------------------|------------------|----------|
| **Composite Builds** ✅ | No | Simple | Single repo |
| Maven Local | Yes | Medium | Testing |
| Remote Maven | Yes | Complex | Multiple repos |

### Your Setup = Composite Builds ✅

Perfect for:
- ✅ Single repository
- ✅ Backend + Lambdas
- ✅ Simple CI/CD
- ✅ No version management needed

### Troubleshooting

**"Could not find shared module"**
- Check `includeBuild` path is correct
- Ensure shared module is in Docker build context

**"Build fails in CI/CD"**
- Ensure shared module is copied in Dockerfile
- Check relative paths are correct

**"Version conflicts"**
- Composite builds use exact version from shared/build.gradle
- No conflicts possible

### Summary

**You don't need to do anything special!**

Just:
1. Add `includeBuild` to settings.gradle
2. Add dependency to build.gradle
3. Copy shared in Dockerfile
4. Update imports

Gradle handles the rest automatically in all environments! 🎉

</details>

<details>
<summary>3. Implementation Guide</summary>

### Quick Answer

**No, you don't need to build and publish the shared module separately!**

With **Gradle Composite Builds**, the shared module is built automatically when you build backend or Lambda projects. It works seamlessly in CI/CD.

### How It Works

#### Local Development

1. You run `./gradlew build` in backend or Lambda
2. Gradle sees `includeBuild '../shared'` in settings.gradle
3. **Automatically builds shared module first**
4. Makes it available to your project
5. Builds your project with shared module included

**No manual steps needed!**

#### CI/CD Pipeline

Same process:
1. CI runs `./gradlew build` in backend
2. Gradle automatically builds shared module
3. Everything works together

**No extra CI jobs needed!**

#### Docker Builds

1. Copy shared module into Docker build context
2. Gradle composite build works the same way
3. Everything builds together

### Implementation Steps

#### Step 1: Update Backend Settings

**File: `backend/services/settings.gradle`**
```gradle
rootProject.name = 'services'

// Include shared module as composite build
includeBuild '../shared'

// Modular Monolith Modules
include 'eventpro-core'
include 'eventpro-event'
include 'eventpro-order'
include 'eventpro-payment'
include 'eventpro-notification'
include 'eventpro-api'

project(':eventpro-core').projectDir = file('modules/eventpro-core')
project(':eventpro-event').projectDir = file('modules/eventpro-event')
project(':eventpro-order').projectDir = file('modules/eventpro-order')
project(':eventpro-payment').projectDir = file('modules/eventpro-payment')
project(':eventpro-notification').projectDir = file('modules/eventpro-notification')
project(':eventpro-api').projectDir = file('modules/eventpro-api')
```

#### Step 2: Update Backend Module to Use Shared

**File: `backend/services/modules/eventpro-order/build.gradle`**
```gradle
dependencies {
    // Spring Boot
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    // ... other dependencies
    
    // Shared module (via composite build)
    implementation 'com.accessplus.eventpro:eventpro-shared:1.0.0'
    
    // Module dependencies
    implementation project(':eventpro-core')
    implementation project(':eventpro-event')
}
```

#### Step 3: Update Lambda Settings

**File: `backend/lambdas/order-processor/settings.gradle`**
```gradle
rootProject.name = 'order-processor'

// Include shared module as composite build
includeBuild '../../shared'
```

#### Step 4: Update Lambda Dependencies

**File: `backend/lambdas/order-processor/build.gradle`**
```gradle
dependencies {
    // Quarkus Platform BOM
    implementation enforcedPlatform("${quarkusPlatformGroupId}:${quarkusPlatformArtifactId}:${quarkusPlatformVersion}")
    
    // Shared module (via composite build)
    implementation 'com.accessplus.eventpro:eventpro-shared:1.0.0'
    
    // Quarkus AWS Lambda
    implementation 'io.quarkus:quarkus-amazon-lambda'
    // ... rest of dependencies
}
```

#### Step 5: Update Backend Dockerfile

**File: `backend/services/Dockerfile`**
```dockerfile
# Multi-stage build for EventPro API (Modular Monolith)
# Build context: backend/ directory
FROM gradle:9.2.1-jdk21-corretto AS build
WORKDIR /app

# Copy entire services directory structure
COPY services ./services

# Copy shared module (for composite build)
COPY shared ./shared

# Build the application from services directory
WORKDIR /app/services
RUN ./gradlew :eventpro-api:bootJar --no-daemon -x test

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy the built JAR
COPY --from=build /app/services/modules/eventpro-api/build/libs/eventpro-api-*.jar app.jar

# Set Java options for container
ENV JAVA_TOOL_OPTIONS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
```

#### Step 6: Update Lambda Dockerfile

**File: `backend/lambdas/order-processor/Dockerfile`**
```dockerfile
# Multi-stage Dockerfile for Quarkus Order Processor Lambda (JVM)
# This builds a container image for AWS Lambda
# Build context: backend/ directory

# Build stage
FROM gradle:9.2.1-jdk21-corretto AS build
WORKDIR /app

# Copy entire lambda directory structure
COPY lambdas/order-processor ./lambdas/order-processor

# Copy shared module (for composite build)
COPY shared ./shared

# Build the Quarkus application
WORKDIR /app/lambdas/order-processor
RUN ./gradlew build --no-daemon -x test

# Runtime stage - Use AWS Lambda Java base image
FROM public.ecr.aws/lambda/java:21

# Copy the Quarkus runner JAR and dependencies
COPY --from=build /app/lambdas/order-processor/build/quarkus-app/lib/ /var/task/lib/
COPY --from=build /app/lambdas/order-processor/build/*-runner.jar /var/task/lib/quarkus-lambda.jar

# Set the handler
CMD ["io.quarkus.amazon.lambda.runtime.QuarkusStreamHandler::handleRequest"]
```

#### Step 7: Update Imports in Code

**Replace:**
```java
import com.accessplus.eventpro.order.order.entity.OrderEntity;
import com.accessplus.eventpro.order.order.entity.OrderStatus;
```

**With:**
```java
import com.accessplus.eventpro.shared.entity.OrderEntity;
import com.accessplus.eventpro.shared.enums.OrderStatus;
```

### CI/CD - No Changes Needed!

Your current CI/CD pipeline works perfectly:

```yaml
gradle-build-backend:
  extends: .build-backend
  stage: build
  script:
    - cd backend/services
    - ./gradlew build -x test
    # Shared module is built automatically! ✨
```

Gradle composite builds work in CI/CD exactly the same as locally.

### Testing Locally

```bash
# Test backend services with shared module
cd backend/services
./gradlew build

# Test Lambda with shared module
cd backend/lambdas/order-processor
./gradlew build

# Both automatically build shared module first!
```

### What Happens in Production

1. **CI/CD Pipeline:**
   - Runs `./gradlew build` in backend
   - Gradle automatically builds shared module
   - Backend builds with shared module included
   - Docker image includes everything

2. **Docker Build:**
   - Copies shared module into build context
   - Gradle composite build works the same way
   - Everything builds together
   - Final image has all dependencies

3. **Runtime:**
   - Shared module classes are in the JAR
   - No separate deployment needed
   - Everything works together

### Benefits

✅ **No Publishing Step** - Gradle handles it  
✅ **Always Latest Code** - No version management  
✅ **Simple CI/CD** - No extra jobs needed  
✅ **Works Everywhere** - Local, CI/CD, Docker  
✅ **Type Safety** - Same entities everywhere

### Summary

**You don't need to build and publish the shared module separately!**

Gradle Composite Builds handle everything automatically:
- Builds shared module when needed
- Makes it available to dependent projects
- Works in local, CI/CD, and Docker builds
- No manual steps required

Just add `includeBuild '../shared'` to your settings.gradle files and use the dependency. That's it!

</details>

<details>
<summary>4. CI/CD Integration</summary>

### Overview

This section explains how the shared module works in different environments (local, CI/CD, production) and the recommended approach for your setup.

### Three Approaches Compared

#### Approach 1: Gradle Composite Builds (Recommended ✅)

**How it works:**
- No publishing required
- Gradle automatically builds shared module when needed
- Works seamlessly in CI/CD
- Same code, same build

**Local Development:**
```gradle
// In backend/services/settings.gradle or backend/lambdas/order-processor/settings.gradle
includeBuild '../shared'
```

**CI/CD:**
- Build shared module first (or as part of composite build)
- Other projects automatically use it

**Pros:**
- ✅ No publishing step needed
- ✅ Always uses latest code
- ✅ Simple setup
- ✅ Works in CI/CD automatically

**Cons:**
- ⚠️ Requires all projects in same repository (you have this)

---

#### Approach 2: Maven Local Repository

**How it works:**
- Build and publish shared module to local Maven repository
- Other projects reference it as external dependency
- Requires publishing step before using

**Local Development:**
```bash
cd backend/shared
./gradlew publishToMavenLocal
```

Then in other projects:
```gradle
dependencies {
    implementation 'com.accessplus.eventpro:eventpro-shared:1.0.0'
}
```

**CI/CD:**
- Must build and publish shared module first
- Then build other projects

**Pros:**
- ✅ Traditional approach
- ✅ Can version independently
- ✅ Can publish to remote repository later

**Cons:**
- ❌ Requires publishing step
- ❌ More complex CI/CD pipeline
- ❌ Version management overhead

---

#### Approach 3: Remote Maven Repository (Future)

**How it works:**
- Publish shared module to Maven Central, GitHub Packages, or private repository
- Other projects reference it like any external dependency

**Pros:**
- ✅ Can version and release independently
- ✅ Can share across multiple repositories
- ✅ Professional approach for libraries

**Cons:**
- ❌ Most complex setup
- ❌ Requires repository infrastructure
- ❌ Overkill for single repository

---

### Recommended Approach: Composite Builds

For your setup (single repository, backend + lambdas), **Gradle Composite Builds** is the best choice.

### How It Works

1. **Shared module is built automatically** when any project that depends on it is built
2. **No publishing required** - Gradle handles it internally
3. **Always uses latest code** - No version management needed
4. **Works in CI/CD** - Just build the projects, Gradle handles the rest

### Implementation

#### Step 1: Update Backend Settings

**File: `backend/services/settings.gradle`**
```gradle
rootProject.name = 'services'

// Include shared module as composite build
includeBuild '../shared'

// Existing modules
include 'eventpro-core'
// ... rest of modules
```

#### Step 2: Update Backend Module Dependencies

**File: `backend/services/modules/eventpro-order/build.gradle`**
```gradle
dependencies {
    // Use shared module via composite build
    implementation 'com.accessplus.eventpro:eventpro-shared:1.0.0'
    
    // Remove duplicate entities - use shared instead
    // implementation project(':eventpro-core') // Keep if needed for other things
}
```

#### Step 3: Update Lambda Settings

**File: `backend/lambdas/order-processor/settings.gradle`**
```gradle
rootProject.name = 'order-processor'

// Include shared module as composite build
includeBuild '../../shared'
```

#### Step 4: Update Lambda Dependencies

**File: `backend/lambdas/order-processor/build.gradle`**
```gradle
dependencies {
    // Use shared module via composite build
    implementation 'com.accessplus.eventpro:eventpro-shared:1.0.0'
    
    // Remove duplicate entities
}
```

### CI/CD Pipeline Updates

Your current pipeline structure works perfectly! Just ensure shared module is built:

**Option A: Build shared as part of backend build (Recommended)**
```yaml
gradle-build-backend:
  extends: .build-backend
  stage: build
  script:
    - cd backend/services
    - ./gradlew build -x test
    # Shared module is built automatically via composite build
```

**Option B: Build shared separately first**
```yaml
gradle-build-shared:
  stage: build
  image: eclipse-temurin:21-jdk-alpine
  script:
    - cd backend/shared
    - ./gradlew build
  artifacts:
    paths:
      - backend/shared/build/libs/
    expire_in: 1 week

gradle-build-backend:
  extends: .build-backend
  stage: build
  needs:
    - gradle-build-shared
  # ... rest of config
```

### Docker Builds

Your Dockerfiles already work! The shared module is included in the build context:

**Backend Dockerfile:**
```dockerfile
FROM gradle:9.2.1-jdk21-corretto AS build
WORKDIR /app
COPY services ./services
COPY shared ./shared  # Shared module included
RUN ./gradlew :eventpro-api:bootJar --no-daemon -x test
```

**Lambda Dockerfile:**
```dockerfile
FROM gradle:9.2.1-jdk21-corretto AS build
WORKDIR /app
COPY lambdas/order-processor ./lambdas/order-processor
COPY shared ./shared  # Shared module included
RUN ./gradlew build --no-daemon -x test
```

### How Gradle Composite Builds Work

1. When you run `./gradlew build` in backend or Lambda:
   - Gradle detects `includeBuild '../shared'` in settings.gradle
   - Automatically builds shared module first
   - Makes it available to the current project
   - No manual publishing needed!

2. In CI/CD:
   - Same process - Gradle handles everything
   - Shared module is built automatically
   - No extra steps needed

3. In Docker builds:
   - Copy shared module into build context
   - Gradle composite build works the same way
   - Everything builds together

### Migration Steps

1. ✅ Shared module created (done)
2. ✅ Update `backend/services/settings.gradle` to include shared (done)
3. ✅ Update `backend/lambdas/*/settings.gradle` to include shared (done)
4. ✅ Update module `build.gradle` files to use shared dependency (done)
5. ✅ Remove duplicate entities from backend and Lambda (done)
6. ✅ Test locally (done)
7. ✅ Update CI/CD if needed (not needed!)
8. ✅ Deploy

### Benefits in Production

- **Consistency**: Same entities everywhere
- **Type Safety**: Compile-time checks across projects
- **Maintainability**: Update once, use everywhere
- **No Version Drift**: Always uses latest code
- **Simple CI/CD**: No publishing steps needed

### Troubleshooting

**Issue**: "Could not find module 'eventpro-shared'"
- **Solution**: Ensure `includeBuild '../shared'` is in settings.gradle

**Issue**: "Shared module not building in CI/CD"
- **Solution**: Ensure shared module is in build context (copied in Dockerfile or available in CI)

**Issue**: "Version conflicts"
- **Solution**: Composite builds use the exact version from shared/build.gradle, no conflicts

### Summary

**For your setup, use Gradle Composite Builds:**
- ✅ Simple
- ✅ No publishing needed
- ✅ Works in CI/CD automatically
- ✅ Always uses latest code
- ✅ Perfect for single repository

No need to publish to Maven Local or remote repositories unless you plan to share the module across multiple repositories in the future.

</details>

---

## Quick Reference

### Essential Commands

```bash
# Build backend services (automatically builds shared)
cd backend/services
./gradlew build

# Build Lambda (automatically builds shared)
cd backend/lambdas/order-processor
./gradlew build

# Build shared module directly (optional)
cd backend/shared
./gradlew build
```

### File Locations

```
backend/
├── shared/                          # Shared module
│   ├── build.gradle
│   ├── settings.gradle
│   └── src/main/java/com/accessplus/eventpro/shared/
│       ├── entity/                  # Entities (BaseEntity, OrderEntity, etc.)
│       ├── enums/                   # Enums (OrderStatus, TicketStatus, etc.)
│       ├── model/                   # DTOs (OrderMessage, PaymentMessage)
│       ├── exception/               # Exceptions (BusinessException, etc.)
│       └── util/                    # Utilities (DateUtils, StringUtils, etc.)
├── services/
│   ├── settings.gradle              # Contains: includeBuild '../shared'
│   └── modules/eventpro-*/build.gradle  # Contains: implementation 'com.accessplus.eventpro:eventpro-shared:1.0.0'
└── lambdas/
    └── order-processor/
        ├── settings.gradle          # Contains: includeBuild '../../shared'
        └── build.gradle             # Contains: implementation 'com.accessplus.eventpro:eventpro-shared:1.0.0'
```

### Import Examples

```java
// Entities
import com.accessplus.eventpro.shared.entity.BaseEntity;
import com.accessplus.eventpro.shared.entity.OrderEntity;
import com.accessplus.eventpro.shared.entity.TicketEntity;

// Enums
import com.accessplus.eventpro.shared.enums.OrderStatus;
import com.accessplus.eventpro.shared.enums.TicketStatus;
import com.accessplus.eventpro.shared.enums.TicketType;

// Models
import com.accessplus.eventpro.shared.model.OrderMessage;
import com.accessplus.eventpro.shared.model.PaymentMessage;

// Exceptions
import com.accessplus.eventpro.shared.exception.BusinessException;
import com.accessplus.eventpro.shared.exception.ResourceNotFoundException;
import com.accessplus.eventpro.shared.exception.ValidationException;

// Utilities
import com.accessplus.eventpro.shared.util.DateUtils;
import com.accessplus.eventpro.shared.util.StringUtils;
import com.accessplus.eventpro.shared.util.UuidUtils;
```

---

## Support

For detailed instructions, refer to the collapsible sections above:
- **Section 1**: Architecture overview and problem statement
- **Section 2**: Quick reference and TL;DR
- **Section 3**: Step-by-step implementation guide
- **Section 4**: CI/CD integration details

