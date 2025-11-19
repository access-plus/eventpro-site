# EventPro Platform - Project Structure Analysis

**Date**: 2025-01-17  
**Status**: Modular Monolith Architecture (Migrated from Microservices)

---

## Executive Summary

EventPro Platform is a **full-stack event ticketing platform** that has been restructured from a microservices architecture to a **modular monolith** to simplify development, reduce operational complexity, and lower costs. The platform enables users to browse events, purchase tickets, and manage event listings.

### Current Architecture: Modular Monolith

- **Backend**: Single Spring Boot 3.5.7 application with 6 modules
- **Frontend**: React 19 + TypeScript + Vite
- **Infrastructure**: AWS (ECS Fargate, RDS, S3, CloudFront, Cognito)
- **Database**: PostgreSQL (RDS Multi-AZ)
- **Payment**: Stripe integration
- **Notifications**: AWS SES (Email), SNS (SMS), WebSocket

---

## Project Structure

```
eventpro-site/
├── eventpro-api/              # ✅ Modular Monolith (Main Backend)
│   ├── modules/
│   │   ├── eventpro-core/     # Users, Auth, Common utilities
│   │   ├── eventpro-event/    # Events, Tickets, Search
│   │   ├── eventpro-order/    # Cart, Orders, Checkout
│   │   ├── eventpro-payment/  # Payment Processing (Stripe)
│   │   ├── eventpro-notification/ # Email, SMS, WebSocket
│   │   └── eventpro-api/      # Main Application Module
│   ├── build.gradle
│   ├── settings.gradle
│   ├── Dockerfile
│   └── README.md
│
├── web/                       # ✅ Frontend (React 19 + TypeScript)
│   ├── src/
│   │   ├── components/        # UI components (shadcn/ui)
│   │   ├── pages/             # Page components
│   │   ├── store/             # Redux store
│   │   └── lib/               # Utilities
│   ├── package.json
│   └── vite.config.ts
│
├── terraform/                  # ✅ Infrastructure as Code
│   ├── environments/dev/      # Dev environment
│   └── modules/               # Reusable modules
│       ├── alb/               # Application Load Balancer
│       ├── ecs/               # ECS Fargate
│       ├── rds/               # PostgreSQL RDS
│       ├── cognito/           # AWS Cognito
│       ├── s3/                # S3 buckets
│       ├── cloudfront/        # CloudFront CDN
│       └── vpc/               # VPC networking
│
├── specs/                     # ✅ Project Specifications
│   └── 001-eventpro-platform/
│       ├── contracts/         # API contracts
│       ├── data-model.md      # Database schema
│       └── plan.md            # Implementation plan
│
├── z_docs/                    # ✅ Architecture Documentation
│   ├── modular-monolith-architecture.md
│   ├── architecture-recommendation.md
│   ├── guideline.md
│   └── setup-guide.md
│
├── secret-rotation/           # ✅ Lambda for secret rotation
│   └── lambda_function.py
│
├── Makefile                   # ⚠️ Needs update (references old services)
├── README.md                  # Main project README
└── STRUCTURE.md               # Structure documentation
```

---

## Backend: EventPro API (Modular Monolith)

### Technology Stack
- **Framework**: Spring Boot 3.5.7
- **Java**: 21
- **Build Tool**: Gradle 8.5
- **Database**: PostgreSQL (via Spring Data JPA)
- **Security**: Spring Security + AWS Cognito
- **AWS SDK**: 2.21.29

### Module Structure

#### 1. `eventpro-core` (Core Module)
**Purpose**: User management, authentication, common utilities

**Dependencies**:
- Spring Boot: Data JPA, Security, Validation
- AWS SDK: Cognito, Secrets Manager, SQS
- Database: PostgreSQL driver

**Current Code**:
- ✅ `BaseEntity` - Base entity with timestamps
- ✅ `BusinessException` - Custom exception
- ✅ `SQSMessagePublisher` - SQS message publishing

**Status**: ⏳ **In Progress** - Needs User entity, UserService, Auth integration

---

#### 2. `eventpro-event` (Event Module)
**Purpose**: Event management, tickets, search

**Dependencies**:
- Spring Boot: Data JPA, Web
- AWS SDK: S3 (for event images)
- Database: PostgreSQL driver
- Depends on: `eventpro-core`

**Status**: ⏳ **Pending** - Structure created, no code yet

---

#### 3. `eventpro-order` (Order Module)
**Purpose**: Shopping cart, orders, checkout

**Dependencies**:
- Spring Boot: Data JPA, Web
- Database: PostgreSQL driver
- Depends on: `eventpro-core`, `eventpro-event`

**Status**: ⏳ **Pending** - Structure created, no code yet

---

#### 4. `eventpro-payment` (Payment Module)
**Purpose**: Payment processing (Stripe)

**Dependencies**:
- Spring Boot: Data JPA, Web
- Stripe: stripe-java 23.6.0
- Database: PostgreSQL driver
- Depends on: `eventpro-core`, `eventpro-order`

**Status**: ⏳ **Pending** - Structure created, no code yet

---

#### 5. `eventpro-notification` (Notification Module)
**Purpose**: Email, SMS, WebSocket notifications

**Dependencies**:
- Spring Boot: Web, WebSocket
- AWS SDK: SES, SNS
- Depends on: `eventpro-core`

**Status**: ⏳ **Pending** - Structure created, no code yet

---

#### 6. `eventpro-api` (Main Application Module)
**Purpose**: Main application, REST API, configuration

**Dependencies**:
- All other modules
- Spring Boot: Web, Actuator, WebSocket

**Current Code**:
- ✅ `EventProApplication` - Main Spring Boot application
- ✅ `application.yml` - Configuration file

**Status**: ✅ **Ready** - Main application structure complete

---

## Frontend: Web (React 19)

### Technology Stack
- **Framework**: React 19.2.0
- **Language**: TypeScript 5.9.3
- **Build Tool**: Vite 7.2.2
- **UI Library**: shadcn/ui (Radix UI + Tailwind CSS)
- **State Management**: Redux Toolkit 2.10.1
- **Routing**: React Router 7.9.6

### Current Structure
```
web/
├── src/
│   ├── components/ui/         # shadcn/ui components (button, card, input)
│   ├── pages/                 # Page components (Home, About, etc.)
│   ├── store/                 # Redux store (counterSlice example)
│   └── lib/                   # Utilities
├── package.json
└── vite.config.ts
```

**Status**: ✅ **Basic structure ready** - Needs integration with backend API

---

## Infrastructure: Terraform

### Current Modules
- ✅ **VPC** - Networking infrastructure
- ✅ **ALB** - Application Load Balancer
- ✅ **ECS** - ECS Fargate service definitions
- ✅ **RDS** - PostgreSQL database
- ✅ **Cognito** - User authentication
- ✅ **S3** - Storage buckets
- ✅ **CloudFront** - CDN for frontend
- ✅ **Route53** - DNS management
- ✅ **Secrets Manager** - Secret storage

### Environment
- **Dev**: `terraform/environments/dev/`
  - Configuration files ready
  - Variables defined
  - Needs update for modular monolith (single ECS service)

**Status**: ⚠️ **Needs Update** - Currently configured for microservices

---

## Key Configuration Files

### Backend Configuration (`application.yml`)
```yaml
spring:
  application:
    name: eventpro-api
  datasource:
    url: ${DB_URL:jdbc:postgresql://localhost:5432/eventpro}
  jpa:
    hibernate:
      ddl-auto: validate

aws:
  cognito:
    userPoolId: ${COGNITO_USER_POOL_ID}
  s3:
    bucketName: ${S3_BUCKET_NAME}

stripe:
  secretKey: ${STRIPE_SECRET_KEY}

server:
  port: 8080
```

### Build Configuration
- **Root `build.gradle`**: Common configuration for all modules
- **Module `build.gradle`**: Module-specific dependencies
- **Dockerfile**: Multi-stage build (Gradle → JRE)

---

## Migration Status

### ✅ Completed
1. Project structure created
2. Build system configured (Gradle)
3. Module boundaries defined
4. Main application class created
5. Configuration files created
6. Shared utilities migrated to `eventpro-core`
7. Old microservices removed
8. Old Lambda functions removed (except analytics-service)

### ⏳ In Progress
1. **eventpro-core**: User management, authentication
2. **eventpro-event**: Event CRUD, tickets
3. **eventpro-order**: Cart, orders, checkout
4. **eventpro-payment**: Stripe integration
5. **eventpro-notification**: Notifications

### 📋 Pending
1. Code migration from old services (if available)
2. API endpoint implementation
3. Database entity creation
4. Service layer implementation
5. Controller layer implementation
6. Integration tests
7. Terraform updates for monolith
8. CI/CD pipeline updates
9. Frontend API integration

---

## Architecture Decisions

### Why Modular Monolith?
1. **Simplified Development**: Single build system, no Spring Boot + Quarkus conflicts
2. **Lower Costs**: ~$81/month vs ~$170/month (52% reduction)
3. **Easier Operations**: Single deployment, simpler monitoring
4. **Faster Development**: Single application to run locally
5. **Future-Proof**: Can extract modules to microservices when needed

### Module Communication
- **Within Monolith**: Direct method calls, Spring DI, Spring Events
- **External**: REST API, Database, AWS Services (SQS, SES, SNS, S3)

### Database Strategy
- **Primary**: PostgreSQL (RDS Multi-AZ) - All entities in single database
- **Module Boundaries**: Enforced via package structure, not separate databases

---

## Dependencies & Versions

### Backend
- Spring Boot: 3.5.7
- Java: 21
- Gradle: 8.5
- AWS SDK: 2.21.29
- PostgreSQL Driver: 42.7.1
- Lombok: 1.18.30
- Stripe Java: 23.6.0

### Frontend
- React: 19.2.0
- TypeScript: 5.9.3
- Vite: 7.2.2
- Redux Toolkit: 2.10.1
- React Router: 7.9.6
- Tailwind CSS: 3.4.18

### Infrastructure
- Terraform: 1.5+
- AWS Provider: 6.21.0+

---

## Development Workflow

### Building
```bash
# Backend
cd eventpro-api
./gradlew build

# Frontend
cd web
npm install
npm run build
```

### Running Locally
```bash
# Backend
cd eventpro-api
./gradlew :eventpro-api:bootRun

# Frontend
cd web
npm run dev
```

### Docker
```bash
# Backend
cd eventpro-api
docker build -t eventpro-api:latest .
```

---

## Next Steps

### Immediate (Phase 1)
1. ✅ Complete `eventpro-core` module (User entity, UserService, Auth)
2. ✅ Implement REST controllers for core functionality
3. ✅ Create database entities for all modules

### Short Term (Phase 2-3)
1. Implement `eventpro-event` module
2. Implement `eventpro-order` module
3. Implement `eventpro-payment` module
4. Implement `eventpro-notification` module

### Medium Term (Phase 4-5)
1. Update Terraform for monolith architecture
2. Update CI/CD pipelines
3. Frontend API integration
4. End-to-end testing
5. Deployment to dev environment

---

## Known Issues & TODOs

### Build System
- ✅ Build system works correctly
- ⚠️ Makefile references old services (needs update)

### Infrastructure
- ⚠️ Terraform configured for microservices (needs update for monolith)
- ⚠️ CI/CD pipelines may need updates

### Code
- ⏳ Most modules are empty (structure only)
- ⏳ Need to implement business logic
- ⏳ Need to create database entities
- ⏳ Need to implement REST controllers

---

## Documentation

### Architecture Docs
- `z_docs/modular-monolith-architecture.md` - Detailed architecture design
- `z_docs/architecture-recommendation.md` - Original architecture recommendations
- `z_docs/guideline.md` - Development guidelines

### Project Docs
- `eventpro-api/README.md` - Backend documentation
- `eventpro-api/MIGRATION.md` - Migration guide
- `eventpro-api/IMPLEMENTATION_STATUS.md` - Current status
- `README.md` - Main project README

---

## Summary

The EventPro Platform has been successfully restructured as a **modular monolith**, with a clean project structure and clear module boundaries. The foundation is solid, but most modules are still empty and need implementation. The architecture is designed to be simple now, with the ability to extract modules to microservices later when scale demands it.

**Current State**: Foundation ready, implementation in progress  
**Next Priority**: Complete `eventpro-core` module with User management and authentication

