# Services Directory

This directory contains the backend services for EventPro Platform using a **Modular Monolith Architecture**.

## Structure

```
services/
├── eventpro-api/              # Modular Monolith (Main Application)
│   ├── modules/
│   │   ├── eventpro-core/     # Users, Auth, Common utilities
│   │   ├── eventpro-event/    # Events, Tickets, Search
│   │   ├── eventpro-order/    # Cart, Orders, Checkout
│   │   ├── eventpro-payment/  # Payment Processing (Stripe)
│   │   ├── eventpro-notification/ # Email, SMS, WebSocket
│   │   └── eventpro-api/      # Main Application
│   └── README.md
│
└── lambdas/
    └── analytics-service/     # Analytics Lambda (Serverless - Scheduled Tasks)
```

## Main Application: EventPro API

**Modular Monolith** - Single Spring Boot application with 6 modules:
- **eventpro-core**: User management, authentication, common utilities
- **eventpro-event**: Event management, tickets, search
- **eventpro-order**: Shopping cart, orders, checkout
- **eventpro-payment**: Payment processing (Stripe)
- **eventpro-notification**: Notifications (Email, SMS, WebSocket)
- **eventpro-api**: Main application module

**See `eventpro-api/README.md` for detailed documentation.**

## Serverless: Analytics Service

**Lambda Function** - Remains as serverless for:
- Scheduled reports (EventBridge cron)
- Heavy analytics processing
- Batch operations

## Quick Start

### Build EventPro API
```bash
cd eventpro-api
./gradlew build
```

### Run EventPro API Locally
```bash
cd eventpro-api
./gradlew :eventpro-api:bootRun
```

### Build Docker Image
```bash
cd eventpro-api
docker build -t eventpro-api:latest .
```

### Build Analytics Service
```bash
cd lambdas/analytics-service
./gradlew build
```

## Architecture Benefits

- ✅ **Single Build System** - No Spring Boot + Quarkus conflicts
- ✅ **Simplified Deployment** - One Docker image, one ECS service
- ✅ **Easier Development** - Single application to run locally
- ✅ **Lower Costs** - ~$81/month vs ~$170/month (52% reduction)
- ✅ **Future-Proof** - Can extract modules to microservices when needed

## Documentation

- `eventpro-api/README.md` - Main application documentation
- `eventpro-api/MIGRATION.md` - Migration guide
- `z_docs/modular-monolith-architecture.md` - Architecture design

