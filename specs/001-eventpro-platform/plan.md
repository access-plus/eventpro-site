# Implementation Plan: EventPro Platform

**Branch**: `001-eventpro-platform` | **Date**: 2025-01-15 | **Spec**: [User Stories & Requirements](./spec.md)
**Input**: Comprehensive event ticketing platform with microservices architecture, event-driven processing, and AWS infrastructure

**Note**: This plan is generated from z_docs documentation including user stories, architecture recommendations, guidelines, and setup guides.

## Summary

EventPro Site is a microservices-based event ticketing platform that enables users to browse events, purchase tickets, and manage event listings. The platform uses a hybrid architecture with Spring Boot services on ECS Fargate for synchronous operations, Quarkus Lambda functions for event-driven processing, React 19 frontend, and PostgreSQL as the primary database. The system processes orders asynchronously through SQS queues, handles payments via Stripe, and sends notifications via AWS SES/SNS.

**Primary Requirements**:
- User authentication and authorization via AWS Cognito
- Event CRUD operations with categories, locations, and images
- Ticket management with QR code generation
- Shopping cart and checkout flow
- Asynchronous order and payment processing
- Email, SMS, and WebSocket notifications
- Analytics dashboard for organizers

**Technical Approach**: Microservices architecture with event-driven patterns, AWS-native infrastructure, and modern web technologies (React 19, Spring Boot 3.5.7, Quarkus 3.26.2).

## Technical Context

**Language/Version**: 
- Java 21 (backend services and Lambda functions)
- TypeScript 5.x (frontend, strict mode)
- Terraform 1.5+ (infrastructure)

**Primary Dependencies**:
- **Frontend**: React 19.x, Vite 7.x, TypeScript 5.x, shadcn/ui (latest), Tailwind CSS 3.x, Redux Toolkit, React Router
- **Backend ECS**: Spring Boot 3.5.7+, Spring Data JPA, Spring Security, AWS SDK v2 (SQS, S3, Secrets Manager, Cognito)
- **Backend Lambda**: Quarkus 3.26.2+, Hibernate ORM, AWS Lambda Java Core, Stripe Java SDK
- **Infrastructure**: AWS Terraform Provider 6.21.0+, Terraform 1.5+
- **Database**: PostgreSQL 15+ (RDS Multi-AZ)
- **Messaging**: AWS SQS, AWS SNS, AWS SES
- **Authentication**: AWS Cognito
- **Payment**: Stripe API

**Storage**: 
- PostgreSQL (RDS Multi-AZ) - Primary database for all relational data
- DynamoDB (Optional) - Session/cart storage, analytics counters, caching
- S3 - Event images, frontend static assets

**Testing**: 
- JUnit 5, Mockito (Java backend)
- Jest, React Testing Library (frontend)
- Integration tests for all API endpoints
- E2E tests for critical user flows
- Minimum 80% unit test coverage for services

**Target Platform**: 
- AWS Cloud (ECS Fargate, Lambda, RDS, S3, CloudFront)
- Web browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)
- Mobile responsive design

**Project Type**: Web application (frontend + backend microservices)

**Performance Goals**: 
- API response time: p95 < 500ms for synchronous operations
- Lambda cold start: < 3 seconds
- Frontend initial load: < 3 seconds
- Support 1000+ concurrent users
- Handle 10,000+ ticket purchases per event

**Constraints**: 
- AWS-exclusive infrastructure (no other cloud providers)
- PostgreSQL as primary database (no DynamoDB as primary)
- Spring Boot for ECS services only (Quarkus for Lambda)
- React 19 + shadcn/ui for frontend (no other UI libraries)
- Microservices architecture (no monolith)
- Event-driven patterns for async operations (SQS + Lambda)

**Scale/Scope**: 
- 15+ database entities with complex relationships
- 3 ECS services (Core API, Event API, Payment API)
- 4 Lambda functions (Order Processor, Payment Processor, Notification Sender, Analytics Service)
- 3 SQS queues (order-queue, payment-queue, notification-queue)
- Multiple user roles (ADMIN, ORGANIZER, USER)
- Full event lifecycle (creation, ticket sales, order processing, notifications)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**MCP Usage Verification**:
- [x] Latest dependency versions verified via Context7 MCP (React 19, Spring Boot 3.5.7+, Quarkus 3.26.2+, shadcn/ui)
- [x] AWS Terraform configuration verified via AWS Terraform MCP (Provider 6.21.0+)
- [x] shadcn/ui components researched via shadcn MCP (for React UI work)

**Architecture Compliance**:
- [x] Microservices boundaries respected (no shared databases - each service owns its data domain)
- [x] Event-driven patterns used for async operations (SQS queues + Lambda functions)
- [x] AWS-exclusive infrastructure (Terraform for all AWS resources)
- [x] Technology stack boundaries followed (Spring Boot 3.5.7+ for ECS, Quarkus 3.26.2+ for Lambda)

**Quality Gates**:
- [x] Testing approach planned (unit tests 80% coverage, integration tests for APIs, E2E for critical flows)
- [x] Security considerations addressed (AWS Cognito for auth, Secrets Manager for secrets, encryption at rest/transit)
- [x] Performance requirements defined (p95 < 500ms API, < 3s Lambda cold start, < 3s frontend load)
- [x] Code quality standards documented (Google Java Style Guide, Airbnb TypeScript Style Guide)

**Constitution Status**: ✅ **PASSED** - All gates satisfied

## Project Structure

### Documentation (this feature)

```text
specs/001-eventpro-platform/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── api-spec.json    # OpenAPI 3.0 specification
│   └── sqs-spec.md      # SQS message contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
services/                        # Backend Microservices
├── core-api/                    # Core API Service (ECS Fargate - Spring Boot)
│   ├── src/main/java/com/accessplus/eventpro/core/
│   │   ├── api/controller/     # REST controllers
│   │   ├── service/             # Business logic
│   │   ├── repository/          # Data access
│   │   ├── entity/              # JPA entities
│   │   ├── dto/                 # Data transfer objects
│   │   ├── config/              # Configuration classes
│   │   ├── security/            # Security configuration
│   │   └── messaging/           # SQS message publishing
│   ├── src/main/resources/
│   │   └── application.yml      # Configuration
│   ├── src/test/                # Tests
│   ├── build.gradle
│   └── Dockerfile
│
├── event-api/                   # Event API Service (ECS Fargate - Spring Boot)
│   └── [similar structure to core-api]
│
└── lambdas/                     # Lambda Functions (Quarkus)
    ├── order-processor/          # Order Processing Lambda
    │   ├── src/main/java/com/accessplus/eventpro/order/
    │   │   ├── handler/          # Lambda handlers
    │   │   ├── service/          # Business logic
    │   │   └── model/            # Data models
    │   └── build.gradle
    │
    ├── payment-processor/       # Payment Processing Lambda
    ├── notification-sender/      # Notification Service Lambda
    └── analytics-service/       # Analytics Service Lambda

shared/                          # Shared Libraries
├── common/                      # Common utilities, exceptions, base entities
├── messaging/                   # SQS messaging utilities
└── database/                    # Database utilities

web/                            # Frontend Application
├── src/
│   ├── components/              # React components
│   │   ├── common/              # Shared components
│   │   ├── events/              # Event-related components
│   │   ├── tickets/             # Ticket components
│   │   ├── cart/                # Cart components
│   │   ├── payments/             # Payment components
│   │   └── dashboard/            # Dashboard components
│   ├── pages/                   # Page components
│   ├── store/                   # Redux store
│   │   └── slices/               # Redux slices
│   ├── services/                # API service clients
│   ├── hooks/                   # Custom React hooks
│   ├── utils/                   # Utility functions
│   ├── types/                   # TypeScript type definitions
│   └── config/                  # Configuration
├── public/                      # Static assets
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js

infrastructure/                 # Infrastructure as Code
├── environments/
│   ├── dev/                     # Development environment
│   └── prod/                    # Production environment
└── modules/
    ├── vpc/                     # VPC module
    ├── rds/                     # RDS PostgreSQL module
    ├── ecs/                     # ECS Fargate module
    ├── lambda/                  # Lambda functions module
    ├── alb/                     # Application Load Balancer module
    ├── s3/                      # S3 buckets module
    ├── cloudfront/              # CloudFront module
    ├── cognito/                 # Cognito User Pool module
    ├── sqs/                     # SQS queues module
    └── secrets-manager/          # Secrets Manager module
```

**Structure Decision**: Web application with separate frontend and backend microservices. The backend is split into multiple services (Core API, Event API) and Lambda functions for event-driven processing. Shared modules provide common functionality. Infrastructure is managed via Terraform modules for reusability across environments.

## Complexity Tracking

> **No violations** - All architecture decisions align with constitution principles.

The microservices architecture, event-driven patterns, and AWS-exclusive approach are all justified by the requirements:
- **Microservices**: Independent scaling of event search vs. core operations, isolated failure domains
- **Event-Driven**: Asynchronous order/payment processing prevents blocking user requests
- **AWS-Exclusive**: Simplifies operations and leverages AWS ecosystem
- **PostgreSQL Primary**: Complex relational data with 15+ entities requires ACID transactions
- **Quarkus for Lambda**: Lower memory footprint and faster cold starts vs. Spring Boot

