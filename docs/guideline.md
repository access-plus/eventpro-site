# EventPro Site - Development Guidelines

## Document Purpose

This document serves as the **single source of truth** for understanding the EventPro Site project architecture, structure, and development practices. It consolidates architectural decisions, project structure, setup procedures, and development boundaries to help AI agents and developers maintain clear context and stay within project boundaries.

**Target Audience**: AI Agents, Developers, Architects, DevOps Engineers  
**Last Updated**: 2024  
**Version**: 1.0

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture Decisions](#architecture-decisions)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Development Guidelines](#development-guidelines)
6. [Deployment Guidelines](#deployment-guidelines)
7. [Boundaries & Constraints](#boundaries--constraints)
8. [Quick Reference](#quick-reference)

---

## Project Overview

### What is EventPro Site?

EventPro Site is a **microservices-based event ticketing platform** that enables users to:
- Browse and search events
- Purchase tickets for events
- Manage their event listings (organizers)
- Process payments securely
- Receive real-time notifications

### Core Business Requirements

1. **User Management**: Authentication via JWT tokens, role-based access (ADMIN, ORGANIZER, USER)
2. **Event Management**: CRUD operations for events with categories, locations, and images
3. **Ticket Management**: Create, sell, and manage tickets with QR code generation
4. **Shopping Cart & Checkout**: Add tickets to cart, checkout, and order processing
5. **Payment Processing**: Stripe integration for secure payment processing
6. **Notifications**: Email (SES), SMS (SNS), and real-time WebSocket notifications
7. **Analytics**: Event performance, sales analytics, and user engagement metrics

### Key Constraints

- **Database**: PostgreSQL (RDS Multi-AZ) for primary data storage
- **Architecture**: Microservices with event-driven patterns
- **Cloud Provider**: AWS exclusively
- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Spring Boot 3.5.7 (ECS) + Quarkus 3.26.2 (Lambda)
- **Infrastructure**: Terraform for IaC
- **CI/CD**: GitLab CI/CD

---

## Architecture Decisions

### Database Strategy: Hybrid Approach

**Primary Database: PostgreSQL (RDS Multi-AZ)**

**Why PostgreSQL?**
- Complex relational data model (15+ entities with intricate relationships)
- ACID transactions required for order processing
- Complex queries (joins, aggregations, reporting)
- Cost-effective for steady workloads
- Full-text search capabilities
- JSONB support for flexible data

**Secondary Database: DynamoDB (Optional)**
- Session/Cart storage (temporary, high-throughput)
- Real-time analytics counters
- Caching layer
- Audit logs (high-volume writes)

**Cost Estimate (Production)**:
- PostgreSQL Multi-AZ: ~$315/month
- DynamoDB (if used): ~$15/month for moderate traffic

### Microservices Architecture

The application follows a **microservices architecture** with **event-driven patterns**:

```
Frontend (React) 
    ↓
API Gateway / ALB
    ↓
┌─────────────┬─────────────┬──────────────┐
│  Core API   │  Event API  │  Payment API │
│ (ECS Fargate│ (ECS Fargate│ (ECS Fargate)│
│ Spring Boot)│ Spring Boot)│ Spring Boot) │
└─────────────┴─────────────┴──────────────┘
    ↓              ↓              ↓
PostgreSQL    PostgreSQL    SQS Queues
    ↓              ↓              ↓
            ┌──────────────┐
            │   Lambda     │
            │  Functions   │
            │  (Quarkus)   │
            └──────────────┘
```

### Service Breakdown

#### 1. Core API Service (ECS Fargate - Spring Boot)
- **Responsibilities**: User management, Event CRUD, Ticket management, Cart management, Authentication/Authorization
- **Database**: PostgreSQL (RDS Multi-AZ)
- **Why ECS Fargate**: Always-on service, better for long-running connections, cost-effective for steady traffic
- **Endpoints**: `/api/v1/users/**`, `/api/v1/events/**`, `/api/v1/tickets/**`, `/api/v1/cart/**`

#### 2. Event API Service (ECS Fargate - Spring Boot)
- **Responsibilities**: Event search, filtering, analytics, recommendations
- **Database**: PostgreSQL + DynamoDB (caching)
- **Why Separate**: Independent scaling, different performance requirements, isolated failure domain

#### 3. Order Processing Service (Lambda + SQS - Quarkus)
- **Responsibilities**: Order validation, ticket reservation, order status updates
- **Trigger**: SQS Queue (`order-queue`)
- **Why Lambda**: Event-driven, auto-scaling, cost-effective (pay per execution)
- **Flow**: User places order → Core API creates order (PENDING) → Publishes to SQS → Lambda processes → Publishes to payment-queue

#### 4. Payment Processing Service (Lambda + SQS - Quarkus)
- **Responsibilities**: Stripe payment processing, webhook handling, order fulfillment, ticket assignment
- **Trigger**: SQS Queue (`payment-queue`)
- **Why Lambda**: Event-driven, high security, cost-effective for sporadic operations
- **Flow**: OrderProcessor publishes → PaymentProcessor processes → Updates order status → Assigns tickets → Publishes to notification-queue

#### 5. Notification Service (Lambda + SQS - Quarkus)
- **Responsibilities**: Email (SES), SMS (SNS), WebSocket notifications
- **Trigger**: SQS Queue (`notification-queue`)
- **Why Lambda**: Event-driven, high throughput, pay per notification

#### 6. Analytics Service (Lambda + EventBridge - Quarkus)
- **Responsibilities**: Real-time analytics, event metrics, sales reports
- **Trigger**: EventBridge (scheduled) or on-demand
- **Database**: DynamoDB (counters) + PostgreSQL (detailed reports)

### Why Quarkus for Lambda?

**Quarkus is used for Lambda functions** because:
- **Lower Memory Footprint**: ~30-40% less memory than Spring Boot
- **Faster Cold Starts**: Better optimized for serverless
- **Smaller Deployment Packages**: Compile-time optimizations
- **Better for Event-Driven**: Designed for cloud-native, serverless architectures

**Spring Boot is used for ECS services** because:
- Always-on services benefit less from Quarkus optimizations
- Better for long-running connections
- More familiar ecosystem for most developers

### SQS Queue Configuration

| Queue | Visibility Timeout | Retention | Batch Size | DLQ |
|-------|-------------------|-----------|------------|-----|
| order-queue | 5 minutes | 14 days | 10 | Yes |
| payment-queue | 15 minutes | 14 days | 1 | Yes |
| notification-queue | 60 seconds | 7 days | 10 | Yes |

### Resilience & High Availability

1. **Database**: RDS Multi-AZ with automatic failover (< 60 seconds)
2. **Application**: ECS tasks across multiple AZs, auto-scaling, health checks
3. **Lambda**: Dead Letter Queues, retry logic, reserved concurrency
4. **SQS**: 99.999999999% message durability, DLQ fallback
5. **Network**: Multi-AZ deployment, VPC with private subnets

### Cost Optimization

**Monthly Cost Estimate (Production - Optimized)**:
- Infrastructure: ~$600/month
- Serverless (Lambda + SQS): ~$7/month
- Other Services: ~$18/month
- **Total: ~$625/month** (can be optimized to ~$440/month with Reserved Instances)

**Optimization Strategies**:
1. RDS Reserved Instances: ~30% savings
2. Spot Instances for dev: ~70% savings
3. S3 Lifecycle Policies: Move old images to Glacier
4. CloudWatch Logs: 7-day retention instead of 30 days

---

## Technology Stack

### Frontend
- **Framework**: React 19
- **Language**: TypeScript 5.x (strict mode)
- **Build Tool**: Vite 5.2.2+
- **UI Library**: shadcn/ui
- **Styling**: Tailwind CSS 3.x
- **State Management**: Redux Toolkit
- **Routing**: React Router
- **HTTP Client**: Axios or Fetch API
- **Authentication**: JWT tokens (via backend API)

### Backend (ECS Services)
- **Framework**: Spring Boot 3.5.7
- **Language**: Java 25
- **Build Tool**: Gradle 8.5+
- **Database**: PostgreSQL 15+ (RDS Multi-AZ)
- **ORM**: Spring Data JPA / Hibernate
- **Security**: Spring Security + JWT (jjwt library)
- **Messaging**: AWS SQS SDK
- **Storage**: AWS S3 SDK
- **Secrets**: AWS Secrets Manager

### Backend (Lambda Functions)
- **Framework**: Quarkus 3.26.2
- **Language**: Java 25
- **Build Tool**: Gradle 8.5+
- **Database**: PostgreSQL (via RDS) + DynamoDB (analytics)
- **ORM**: Hibernate ORM (Quarkus)
- **Messaging**: AWS SQS SDK
- **Payment**: Stripe Java SDK
- **Notifications**: AWS SES/SNS SDK

### Infrastructure
- **IaC**: Terraform
- **Container Registry**: AWS ECR
- **Container Orchestration**: AWS ECS Fargate
- **Load Balancer**: AWS Application Load Balancer (ALB)
- **CDN**: AWS CloudFront
- **DNS**: AWS Route53
- **CI/CD**: GitLab CI/CD
- **Monitoring**: AWS CloudWatch
- **Tracing**: AWS X-Ray (optional)

### AWS Services Used
- **Compute**: ECS Fargate, Lambda
- **Database**: RDS PostgreSQL, DynamoDB (optional)
- **Storage**: S3
- **Networking**: VPC, ALB, CloudFront, Route53
- **Security**: Cognito, Secrets Manager, WAF
- **Messaging**: SQS, SNS, SES
- **Monitoring**: CloudWatch, X-Ray

---

## Project Structure

[Project Structure](./project-structure.md)

### Package Naming Convention

- **Base Package**: `com.accessplus.eventpro`
- **Core API**: `com.accessplus.eventpro.core`
- **Event API**: `com.accessplus.eventpro.event`
- **Order Processor**: `com.accessplus.eventpro.order`
- **Payment Processor**: `com.accessplus.eventpro.payment`
- **Notification Sender**: `com.accessplus.eventpro.notification`
- **Analytics Service**: `com.accessplus.eventpro.analytics`
- **Shared Modules**: `com.accessplus.eventpro.common`, `com.accessplus.eventpro.messaging`, `com.accessplus.eventpro.database`

---

## Development Guidelines

### Code Standards

1. **Java Code Style**:
   - Follow Google Java Style Guide
   - Use Lombok for boilerplate reduction
   - Use meaningful variable and method names
   - Write Javadoc for public APIs
   - Maximum method length: 50 lines
   - Maximum class length: 500 lines

2. **TypeScript/React Code Style**:
   - Follow Airbnb TypeScript Style Guide
   - Use functional components with hooks
   - Use TypeScript strict mode
   - Maximum component length: 200 lines
   - Extract complex logic to custom hooks

3. **Testing Requirements**:
   - Unit test coverage: Minimum 80% for services
   - Integration tests for all API endpoints
   - E2E tests for critical user flows
   - All tests must pass before merge

4. **Git Workflow**:
   - Feature branches from `develop`
   - Merge requests require approval
   - Commits must be meaningful and atomic
   - Use conventional commit messages

### API Design Standards

1. **RESTful API Design**:
   - Use REST conventions (GET, POST, PUT, PATCH, DELETE)
   - Version APIs: `/api/v1/...`
   - Use proper HTTP status codes
   - Return consistent JSON response format

2. **Error Handling**:
   - Use `GlobalExceptionHandler` for centralized error handling
   - Return structured error responses
   - Include error codes and messages
   - Log errors appropriately

3. **Security**:
   - All endpoints must be secured (except public endpoints)
   - Use `@PreAuthorize` for role-based access
   - Validate all inputs
   - Never expose sensitive data in responses

### Database Guidelines

1. **Entity Design**:
   - All entities extend `BaseEntity` (createdAt, updatedAt)
   - Use UUID for primary keys
   - Use JPA annotations properly
   - Define relationships clearly

2. **Repository Pattern**:
   - Use Spring Data JPA repositories
   - Create custom query methods when needed
   - Use `@Query` for complex queries
   - Avoid N+1 query problems

3. **Migrations**:
   - Use Flyway or Liquibase for database migrations
   - Never modify existing migrations
   - Test migrations in dev before production

### Lambda Development Guidelines

1. **Handler Design**:
   - Keep handlers thin (delegate to services)
   - Handle errors gracefully
   - Use Dead Letter Queues for failed messages
   - Log all important operations

2. **Configuration**:
   - Use environment variables for configuration
   - Store secrets in Secrets Manager
   - Use Quarkus configuration properties

3. **Testing**:
   - Test handlers with mock SQS events
   - Test error scenarios
   - Test with different message sizes

### Frontend Development Guidelines

1. **Component Structure**:
   - One component per file
   - Use TypeScript interfaces for props
   - Extract reusable logic to hooks
   - Use shadcn/ui components when possible

2. **State Management**:
   - Use Redux Toolkit for global state
   - Use React state for local component state
   - Use React Query for server state (optional)

3. **API Integration**:
   - Create service classes for API calls
   - Use async/await for async operations
   - Handle loading and error states
   - Implement retry logic for failed requests

### Local Development Setup

1. **Prerequisites**:
   - Java 25 installed
   - Gradle 8.5+ (or use Gradle wrapper)
   - Docker installed
   - Node.js 18+ and npm
   - AWS CLI configured (for deployment)

2. **Running Locally**:
   ```bash
   # Start infrastructure (PostgreSQL, LocalStack)
   docker-compose up -d
   
   # Run Core API
   cd services/core-api
   ./gradlew bootRun
   
   # Run Frontend
   cd frontend
   npm install
   npm run dev
   ```

3. **Testing Locally**:
   ```bash
   # Run all tests
   ./gradlew test
   
   # Run specific service tests
   ./gradlew :services:core-api:test
   
   # Run frontend tests
   cd frontend && npm test
   ```

---

## Deployment Guidelines

### Infrastructure Deployment

1. **Terraform Workflow**:
   ```bash
   cd infrastructure/environments/dev
   terraform init
   terraform plan
   terraform apply
   ```

2. **Deployment Order**:
   1. VPC and networking
   2. RDS PostgreSQL
   3. S3 buckets
   5. Secrets Manager
   6. ECS cluster and services
   7. ALB
   8. CloudFront
   9. Route53

### Application Deployment

1. **ECS Services**:
   - Build Docker image
   - Push to ECR
   - Update ECS service (blue-green deployment)

2. **Lambda Functions**:
   - Build Lambda package (Quarkus generates `function.zip`)
   - Deploy via Terraform or AWS CLI
   - Update function code

3. **Frontend**:
   - Build production bundle
   - Upload to S3
   - Invalidate CloudFront cache

### CI/CD Pipeline

**Stages**:
1. **Test**: Run unit and integration tests
2. **Build**: Build Docker images and Lambda packages
3. **Deploy**: Deploy to dev/prod environments

**Branch Strategy**:
- `main`: Production
- `develop`: Development
- `feature/*`: Feature branches

**Deployment Triggers**:
- `develop` → Auto-deploy to dev
- `main` → Manual approval → Deploy to prod

### Environment Configuration

**Environments**:
- **dev**: Development environment (single-AZ RDS, smaller instances)
- **prod**: Production environment (Multi-AZ RDS, larger instances, auto-scaling)

**Configuration Management**:
- Use environment variables for configuration
- Store secrets in AWS Secrets Manager
- Use Terraform variables for infrastructure configuration

---

## Boundaries & Constraints

### Technology Boundaries

**MUST USE**:
- ✅ PostgreSQL (RDS Multi-AZ) for primary database
- ✅ Spring Boot 3.5.7 for ECS services
- ✅ Quarkus 3.26.2 for Lambda functions
- ✅ React 19 + TypeScript for frontend
- ✅ AWS services exclusively
- ✅ Terraform for infrastructure
- ✅ Gradle for Java builds
- ✅ GitLab CI/CD for pipelines

**MUST NOT USE**:
- ❌ No other cloud providers (Azure, GCP)
- ❌ No other databases as primary (DynamoDB, MongoDB, MySQL)
- ❌ No other frameworks for Lambda (Spring Boot in Lambda)
- ❌ No other build tools (Maven)
- ❌ No other state management (MobX, Zustand) - use Redux Toolkit
- ❌ No other UI libraries (Material-UI, Ant Design) - use shadcn/ui

### Architecture Boundaries

**MUST FOLLOW**:
- ✅ Microservices architecture (no monolith)
- ✅ Event-driven patterns for async operations
- ✅ SQS for message queuing
- ✅ Lambda for event-driven processing
- ✅ ECS Fargate for always-on services
- ✅ API Gateway or ALB for routing

**MUST NOT DO**:
- ❌ No direct database access from frontend
- ❌ No synchronous payment processing (use async with SQS)
- ❌ No direct service-to-service calls for async operations (use SQS)
- ❌ No shared database between services
- ❌ No hardcoded credentials

### Code Boundaries

**MUST FOLLOW**:
- ✅ Package naming: `com.accessplus.eventpro.*`
- ✅ All entities extend `BaseEntity`
- ✅ Use shared modules for common code
- ✅ Use DTOs for API responses
- ✅ Use proper exception handling

**MUST NOT DO**:
- ❌ No business logic in controllers
- ❌ No business logic in entities
- ❌ No direct database queries in controllers
- ❌ No hardcoded configuration values
- ❌ No sensitive data in logs

### Security Boundaries

**MUST FOLLOW**:
- ✅ All endpoints secured (except public)
- ✅ Use JWT tokens for authentication
- ✅ Use Secrets Manager for secrets
- ✅ Encrypt data at rest and in transit
- ✅ Use least privilege IAM policies
- ✅ Validate all inputs

**MUST NOT DO**:
- ❌ No credentials in code or config files
- ❌ No SQL injection vulnerabilities
- ❌ No XSS vulnerabilities
- ❌ No CORS misconfigurations
- ❌ No exposed sensitive endpoints

---

## Quick Reference

### Common Commands

```bash
# Build all projects
./gradlew build

# Build specific service
./gradlew :services:core-api:build

# Build Lambda package (Quarkus generates function.zip automatically)
./gradlew :services:lambdas:order-processor:build

# Run Core API locally
cd services/core-api && ./gradlew bootRun

# Run Frontend locally
cd frontend && npm run dev

# Run tests
./gradlew test

# Deploy infrastructure
cd infrastructure/environments/dev && terraform apply
```

### Key Endpoints

**Core API** (Port 8080):
- `/api/v1/users/**` - User management
- `/api/v1/events/**` - Event CRUD
- `/api/v1/tickets/**` - Ticket management
- `/api/v1/cart/**` - Cart operations
- `/api/v1/orders/**` - Order management

**Event API** (Port 8081):
- `/api/v1/events/search` - Event search
- `/api/v1/events/analytics` - Event analytics

### Important Files

- `architecture-recommendation.md` - Detailed architecture decisions
- `project-structure.md` - Detailed project structure
- `setup-guide.md` - Step-by-step setup instructions
- `user-stories.md` - User stories and requirements
- `guideline.md` - This document

### Support & Documentation

- **Architecture Questions**: Refer to `architecture-recommendation.md`
- **Setup Questions**: Refer to `setup-guide.md`
- **Structure Questions**: Refer to `project-structure.md`
- **Requirements**: Refer to `user-stories.md`

---

## Version History

- **v1.0** (2024): Initial comprehensive guideline document

---

**Document Maintained By**: Tech Lead  
**Next Review**: After major architecture changes

