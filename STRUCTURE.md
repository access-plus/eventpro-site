# Services Directory - Final Structure

## Clean Architecture for Modular Monolith

This directory contains only what's necessary for the modular monolith architecture.

## Directory Structure

```
services/
├── README.md                  # Main documentation
│
├── eventpro-api/              # ✅ Modular Monolith (Main Application)
│   ├── build.gradle           # Build configuration
│   ├── settings.gradle        # Module definitions
│   ├── Dockerfile             # Docker build
│   ├── gradlew                # Gradle wrapper
│   ├── gradle/                # Gradle wrapper files
│   ├── README.md              # Application documentation
│   ├── MIGRATION.md           # Migration guide
│   ├── IMPLEMENTATION_STATUS.md # Implementation status
│   │
│   └── modules/               # Application modules
│       ├── eventpro-core/     # Users, Auth, Common
│       ├── eventpro-event/    # Events, Tickets, Search
│       ├── eventpro-order/    # Cart, Orders, Checkout
│       ├── eventpro-payment/  # Payment Processing
│       ├── eventpro-notification/ # Notifications
│       └── eventpro-api/      # Main Application
│
└── lambdas/
    └── analytics-service/     # ✅ Analytics Lambda (Serverless)
        ├── build.gradle       # Build configuration
        ├── settings.gradle    # Project settings
        ├── Dockerfile         # Docker build
        ├── gradlew            # Gradle wrapper
        ├── gradle/            # Gradle wrapper files
        └── src/               # Source code
```

## What's Included

### ✅ EventPro API (Modular Monolith)
- **6 modules** with clear boundaries
- **Single Spring Boot application**
- **Single database** (PostgreSQL)
- **Single deployment** (Docker image)
- **Independent build system** (own Gradle wrapper)

### ✅ Analytics Service (Lambda)
- **Serverless function** for scheduled tasks
- **Quarkus-based** Lambda
- **Independent build system** (own Gradle wrapper)
- **Scheduled reports** and batch processing

## What Was Removed

- ❌ Old microservices (`core-api`, `event-api`)
- ❌ Integrated Lambda functions (`order-processor`, `payment-processor`, `notification-sender`)
- ❌ Shared modules (code migrated to `eventpro-core`)
- ❌ Root build files (each project is independent)
- ❌ Root Gradle wrapper (each project has its own)
- ❌ Build artifacts (`.gradle`, `build/` directories)
- ❌ IDE files (`.idea`, `*.iml`)
- ❌ Temporary documentation files

## Building

Each project builds independently:

```bash
# Build EventPro API
cd eventpro-api
./gradlew build

# Build Analytics Service
cd lambdas/analytics-service
./gradlew build
```

## Running

```bash
# Run EventPro API locally
cd eventpro-api
./gradlew :eventpro-api:bootRun
```

## Docker

```bash
# Build EventPro API image
cd eventpro-api
docker build -t eventpro-api:latest .

# Build Analytics Service image
cd lambdas/analytics-service
docker build -t analytics-service:latest .
```

## Architecture Benefits

- ✅ **Clean Structure** - Only essential files
- ✅ **Independent Projects** - Each has its own build system
- ✅ **No Conflicts** - No Spring Boot + Quarkus mixing
- ✅ **Easy to Navigate** - Clear module boundaries
- ✅ **Future-Proof** - Can extract modules when needed

