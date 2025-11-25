# EventPro Platform

A comprehensive full-stack event ticketing platform built with a **Modular Monolith Architecture** and **Serverless Lambda Functions**. EventPro enables event organizers to create, manage, and sell tickets for events while providing customers with a seamless experience to discover, purchase, and attend events.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Core Features](#core-features)
6. [Services & Infrastructure](#services--infrastructure)
7. [Getting Started](#getting-started)
8. [Local Development](#local-development)
9. [API Documentation](#api-documentation)
10. [Additional Resources](#additional-resources)

---

## Overview

EventPro is a modern event ticketing platform designed to handle the complete lifecycle of event management and ticket sales. The platform supports:

- **Event Management**: Create, update, and manage events with rich metadata
- **Ticket Sales**: Multiple ticket types (VIP, Regular, Early Bird) with dynamic pricing
- **User Management**: Role-based access control (Admin, Organizer, User) with authentication
- **Shopping Cart & Checkout**: Seamless cart management and order processing
- **Payment Processing**: Stripe integration for secure payments
- **Notifications**: Multi-channel notifications (Email, SMS, In-App, Push)
- **Search & Discovery**: Advanced event search and filtering capabilities
- **Async Processing**: Event-driven order processing, payment processing, and notifications via Lambda functions

### Key Characteristics

- **Modular Monolith**: Single deployable unit with clear module boundaries
- **Serverless Functions**: Quarkus-based Lambda functions for async processing
- **Shared Module**: Framework-agnostic entities, enums, and utilities
- **Cloud-Native**: Built for AWS with infrastructure as code
- **Scalable**: Designed to scale from startup to enterprise
- **Secure**: AWS Cognito authentication, JWT-based authorization, encrypted data
- **Developer-Friendly**: Hot reload, comprehensive testing, clear documentation

---

## Architecture

### High-Level Architecture

<details>
<summary>Click to expand</summary>

```txt
┌─────────────────────────────────────────────────────────────┐
│              Frontend (React + TypeScript + Vite)           │
│              Deployed on S3 + CloudFront CDN                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│         Application Load Balancer (ALB)                     │
│         - Authentication (AWS Cognito)                      │
│         - SSL/TLS Termination                               │
│         - Request Routing                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│    EventPro API (Modular Monolith - Spring Boot 4.0.0)      │
│    ECS Fargate - Single Service                             │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Core Module │  │ Event Module │  │ Order Module │       │
│  │  (Users,     │  │ (Search,     │  │ (Cart,       │       │
│  │   Auth)      │  │  Tickets)    │  │  Checkout)   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │Payment Module│  │Notification  │                         │
│  │ (Stripe)     │  │  Module      │                         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│         PostgreSQL (RDS Multi-AZ)                           │
│         - All entities in single database                   │
│         - Module boundaries via package structure           │
│         - Flyway for database migrations                    │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
            ┌──────────────┐    ┌──────────────┐
            │  AWS SQS     │    │  AWS SES     │
            │  (Queues)    │    │  (Email)     │
            └──────────────┘    └──────────────┘
                    │                   │
                    ▼                   ▼
        ┌───────────────────┐   ┌──────────────┐
        │  Lambda Functions │   │  AWS SNS     │
        │  (Quarkus)        │   │  (SMS)       │
        │  - Order Processor│   └──────────────┘
        │  - Payment Proc.  │
        │  - Notification   │
        └───────────────────┘
                    │
                    ▼
            ┌──────────────┐
            │  AWS S3      │
            │  (Images)    │
            └──────────────┘
```

</details>

### Architecture Pattern: Modular Monolith + Serverless

EventPro uses a **Modular Monolith** architecture for the main API service, combined with **Serverless Lambda Functions** for async processing:

**Main API Service (Spring Boot):**
- ✅ **Single Build System**: No Spring Boot + Quarkus conflicts
- ✅ **Simplified Deployment**: One Docker image, one ECS service
- ✅ **Easier Development**: Single application to run locally
- ✅ **Lower Costs**: ~$81/month vs ~$170/month (52% reduction)
- ✅ **Future-Proof**: Can extract modules to microservices when needed

**Lambda Functions (Quarkus):**
- ✅ **Fast Cold Starts**: 50-200ms with native compilation
- ✅ **Cost-Effective**: Pay per invocation
- ✅ **Auto-Scaling**: Handles traffic spikes automatically
- ✅ **Event-Driven**: SQS-triggered async processing

**Shared Module:**
- ✅ **Single Source of Truth**: Entities, enums, DTOs defined once
- ✅ **Framework-Agnostic**: Works with both Spring Boot and Quarkus
- ✅ **Type Safety**: Same types across backend and Lambda
- ✅ **No Duplication**: Eliminates code duplication

**Module Communication:**

- **Within Monolith**: Direct method calls, Spring Dependency Injection, Spring Events
- **Async Processing**: SQS queues → Lambda functions (Order Processor, Payment Processor, Notification Sender)
- **External**: REST API, Database (PostgreSQL), AWS Services (SQS, SES, SNS, S3)

**When to Extract to Microservices:**

- Multiple teams need independent deployment cycles
- Clear scaling differences between modules
- Technology diversity requirements
- Service boundaries are well-defined and stable

---

## Technology Stack

<details>

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Java** | 21 | Programming language |
| **Spring Boot** | 4.0.0 | Application framework (Main API) |
| **Quarkus** | 3.27.0 | Lambda framework (Async processing) |
| **Gradle** | 9.2.1 | Build tool |
| **PostgreSQL** | 16+ | Primary database |
| **Spring Data JPA** | - | Database access layer |
| **Hibernate Panache** | - | Database access (Lambda) |
| **Spring Security** | - | Security framework |
| **AWS SDK** | 2.38.7 | AWS service integration |
| **Flyway** | - | Database migrations |
| **JUnit 5** | - | Testing framework |
| **JaCoCo** | - | Code coverage |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2.0 | UI framework |
| **TypeScript** | 5.9.3 | Type-safe JavaScript |
| **Vite** | 7.2.2 | Build tool & dev server |
| **Redux Toolkit** | 2.10.1 | State management |
| **React Router** | 7.9.6 | Client-side routing |
| **shadcn/ui** | - | UI component library |
| **Tailwind CSS** | 3.4.18 | Utility-first CSS |
| **Radix UI** | - | Accessible UI primitives |
| **Amazon Cognito JS** | 6.3.15 | Authentication SDK |
| **Vitest** | 2.1.8 | Testing framework |

### Infrastructure

| Technology | Version | Purpose |
|------------|---------|---------|
| **Terraform** | 1.5+ | Infrastructure as Code |
| **AWS Provider** | 6.21.0+ | AWS resource management |
| **Docker** | - | Containerization |
| **Docker Compose** | - | Local development orchestration |
| **LocalStack** | 4.10.0 | AWS service emulation |

### AWS Services

| Service | Purpose |
|---------|---------|
| **ECS Fargate** | Container orchestration for backend |
| **Lambda** | Serverless functions (Order, Payment, Notification processing) |
| **RDS PostgreSQL** | Managed database (Multi-AZ) |
| **S3** | Image storage for events |
| **CloudFront** | CDN for frontend and images |
| **Cognito** | User authentication and authorization |
| **ALB** | Application Load Balancer |
| **Route53** | DNS management |
| **Secrets Manager** | Secure credential storage |
| **SES** | Email notifications |
| **SNS** | SMS notifications |
| **SQS** | Message queuing (for async processing) |
| **ECR** | Container registry for Lambda images |

---

</details>

## Project Structure

<details>
<summary>Click to expand</summary>

```txt
eventpro-site/
├── backend/                      # Backend Application
│   ├── services/                 # Spring Boot Modular Monolith
│   │   ├── modules/
│   │   │   ├── eventpro-core/   # Core module: Users, Auth, Common utilities
│   │   │   ├── eventpro-event/  # Event module: Events, Tickets, Search
│   │   │   ├── eventpro-order/  # Order module: Cart, Orders, Checkout
│   │   │   ├── eventpro-payment/# Payment module: Stripe integration
│   │   │   ├── eventpro-notification/# Notification module: Email, SMS, WebSocket
│   │   │   └── eventpro-api/    # Main application module (REST API layer)
│   │   ├── build.gradle         # Root build configuration
│   │   ├── settings.gradle      # Project settings
│   │   ├── Dockerfile           # Docker image definition
│   │   └── README.md            # Backend documentation
│   │
│   ├── lambdas/                 # AWS Lambda Functions (Quarkus)
│   │   ├── order-processor/     # Order processing Lambda
│   │   │   ├── src/
│   │   │   ├── build.gradle
│   │   │   ├── Dockerfile       # JVM build
│   │   │   ├── Dockerfile.native# Native build
│   │   │   └── settings.gradle
│   │   ├── payment-processor/   # Payment processing Lambda
│   │   ├── notification-sender/ # Notification Lambda
│   │   └── secret-rotation/    # Secret rotation Lambda (Python)
│   │
│   └── shared/                   # Shared Module (Framework-agnostic)
│       ├── src/main/java/com/accessplus/eventpro/shared/
│       │   ├── entity/          # JPA entities (BaseEntity, OrderEntity, etc.)
│       │   ├── enums/           # Enums (OrderStatus, TicketStatus, etc.)
│       │   ├── model/           # DTOs (OrderMessage, PaymentMessage)
│       │   ├── exception/       # Common exceptions
│       │   └── util/            # Common utilities
│       ├── build.gradle
│       └── settings.gradle
│
├── frontend/                     # Frontend Application (React + TypeScript)
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── pages/                # Page components
│   │   ├── services/             # API service layer
│   │   ├── store/                # Redux store and slices
│   │   ├── hooks/                # Custom React hooks
│   │   └── lib/                  # Utility functions
│   ├── public/                   # Static assets
│   ├── package.json              # Dependencies and scripts
│   ├── vite.config.ts           # Vite configuration
│   ├── tailwind.config.js       # Tailwind CSS configuration
│   └── README.md                # Frontend documentation
│
├── infrastructure/               # Infrastructure as Code (Terraform)
│   ├── environments/
│   │   ├── local/                # Local development environment
│   │   └── dev/                  # Development environment
│   └── modules/                  # Reusable Terraform modules
│       ├── alb/                  # Application Load Balancer
│       ├── cloudfront/           # CloudFront CDN
│       ├── cognito/              # Cognito User Pool
│       ├── ecs/                  # ECS Fargate service
│       ├── lambda/               # Lambda functions
│       ├── rds/                  # RDS PostgreSQL
│       ├── route53/              # Route53 DNS
│       ├── s3/                   # S3 buckets
│       ├── secrets-manager/      # Secrets Manager
│       ├── sqs/                  # SQS queues
│       └── vpc/                  # VPC and networking
│
├── specs/                       # Project specifications and documentation
│   └── 001-eventpro-platform/
│       ├── data-model.md        # Database schema documentation
│       ├── plan.md              # Implementation plan
│       └── tasks.md             # Task tracking
│
├── z_docs/                      # Additional documentation
│   ├── architecture-recommendation.md
│   ├── modular-monolith-architecture.md
│   ├── project-structure.md
│   └── guideline.md
│
├── docker-compose.yml           # Local development orchestration
├── Makefile                     # Development automation commands
├── .gitlab-ci.yml              # CI/CD pipeline configuration
├── LOCAL_DEVELOPMENT_GUIDE.md  # Comprehensive local development guide
├── SHARED_MODULE_GUIDE.md      # Shared module documentation
├── LAMBDA_IMPLEMENTATION_GUIDE.md # Lambda functions documentation
└── README.md                   # This file
```

</details>

### Module Breakdown

<details>
<summary>Click to expand</summary>

#### Backend Services Modules (Spring Boot)

1. **eventpro-core**
   - User management (CRUD operations)
   - Authentication/Authorization (AWS Cognito integration)
   - Role management (ADMIN, ORGANIZER, USER)
   - Common utilities, exceptions, and base entities
   - JWT token validation and security configuration

2. **eventpro-event**
   - Event CRUD operations
   - Ticket management (VIP, Regular, Early Bird)
   - Event search and filtering
   - Category management
   - QR code generation for tickets

3. **eventpro-order**
   - Shopping cart management
   - Order creation and processing
   - Checkout flow
   - Order history
   - SQS message publishing for async processing

4. **eventpro-payment**
   - Stripe payment integration
   - Payment processing
   - Webhook handling
   - Payment status management

5. **eventpro-notification**
   - Email notifications (AWS SES)
   - SMS notifications (AWS SNS)
   - In-app notifications
   - Push notifications (future)
   - Notification preferences

6. **eventpro-api**
   - REST API controllers
   - DTOs (Data Transfer Objects)
   - API configuration
   - Main application entry point
   - Global exception handling

#### Lambda Functions (Quarkus)

1. **order-processor**
   - Processes orders from SQS queue
   - Validates orders and reserves tickets
   - Publishes to payment queue
   - Uses shared module for entities and enums

2. **payment-processor**
   - Processes payments from SQS queue
   - Stripe payment integration
   - Updates order status
   - Publishes to notification queue

3. **notification-sender**
   - Sends notifications from SQS queue
   - Email (SES) and SMS (SNS) delivery
   - Notification preferences handling

4. **secret-rotation** (Python)
   - Rotates database credentials
   - Secrets Manager integration
   - Scheduled execution

#### Shared Module

- **Entities**: BaseEntity, OrderEntity, OrderItemEntity, TicketEntity
- **Enums**: OrderStatus, TicketStatus, TicketType
- **Models**: OrderMessage, PaymentMessage
- **Exceptions**: BusinessException, ResourceNotFoundException, ValidationException, etc.
- **Utilities**: DateUtils, StringUtils, UuidUtils

</details>

## Core Features

<details>
<summary>Click to expand</summary>

### User Management

- User registration and authentication (Email/Password, OAuth - planned)
- Role-based access control (ADMIN, ORGANIZER, USER)
- User profile management
- Account settings and preferences

### Event Management

- Create, update, and delete events
- Event categorization (Music, Sports, Arts & Crafts, etc.)
- Event search and filtering
- Event image upload and management
- Marketing enablement per event

### Ticket Management

- Multiple ticket types (VIP, Regular, Early Bird)
- Dynamic pricing
- Ticket availability tracking
- QR code generation for tickets
- Ticket status management (Available, Sold, Reserved)

### Shopping & Orders

- Shopping cart functionality
- Add/remove/update cart items
- Secure checkout process
- Order history and tracking
- Order confirmation
- Async order processing via Lambda

### Payment Processing

- Stripe integration for secure payments
- Payment status tracking
- Payment webhook handling
- Async payment processing via Lambda
- Refund processing (future)

### Notifications

- Email notifications (order confirmations, event reminders)
- SMS notifications (optional)
- In-app notifications
- Async notification delivery via Lambda
- Notification preferences management

### Search & Discovery

- Full-text event search
- Category-based filtering
- Upcoming events discovery
- Event recommendations (future)

</details>

## Services & Infrastructure

### AWS Services Used

<details>
<summary>Click to expand</summary>

#### Compute

- **ECS Fargate**: Hosts the EventPro API backend service
  - Auto-scaling based on CPU/memory metrics
  - Multi-AZ deployment for high availability

- **Lambda**: Serverless functions for async processing
  - Order Processor (Quarkus)
  - Payment Processor (Quarkus)
  - Notification Sender (Quarkus)
  - Secret Rotation (Python)
  - Container images deployed via ECR

#### Database

- **RDS PostgreSQL (Multi-AZ)**: Primary database
  - Automated backups
  - Point-in-time recovery
  - Read replicas (optional)

#### Storage

- **S3**: Event image storage
  - Public read access for images
  - CloudFront integration for CDN

- **ECR**: Container registry
  - Lambda function images
  - Versioned deployments

#### Networking

- **VPC**: Isolated network environment
  - Public and private subnets
  - NAT Gateway for outbound internet access
- **ALB**: Application Load Balancer
  - SSL/TLS termination
  - Health checks
  - Request routing
- **Route53**: DNS management
  - Domain name resolution
  - Health check routing

#### Security

- **Cognito**: User authentication and authorization
  - User pools for user management
  - JWT token generation
  - OAuth integration (planned)
- **Secrets Manager**: Secure credential storage
  - Database credentials
  - API keys
  - JWT secrets
  - Automatic rotation via Lambda

#### Messaging & Notifications

- **SES**: Email notifications
  - Transactional emails
  - Email templates
- **SNS**: SMS notifications
  - SMS delivery
  - Topic subscriptions
- **SQS**: Message queuing
  - Order queue (order processing)
  - Payment queue (payment processing)
  - Notification queue (notifications)
  - Dead letter queues for error handling

#### CDN

- **CloudFront**: Content delivery network
  - Frontend static assets
  - Event images
  - Caching and performance optimization

</details>

### Local Development Services

For local development, the following services are used:

- **PostgreSQL (Docker)**: Local database
- **LocalStack (Docker)**: AWS service emulation
  - S3, SQS, Cognito, Secrets Manager, SES, SNS
- **Docker Compose**: Service orchestration

---

## Getting Started

### Prerequisites

- **Java 21** - [Download](https://adoptium.net/)
- **Node.js 22+** and **npm** - [Download](https://nodejs.org/)
- **Docker** and **Docker Compose** - [Download](https://www.docker.com/get-started)
- **Terraform 1.5+** - [Download](https://www.terraform.io/downloads)
- **AWS CLI** - [Download](https://aws.amazon.com/cli/) (optional, for testing LocalStack)

### Quick Start

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd eventpro-site
   ```

2. **Start local development environment**

   ```bash
   # Provision infrastructure (LocalStack resources)
   make local-infra
   
   # Start all services
   make local-up
   ```

3. **Access the application**
   - Frontend: <http://localhost:5173>
   - Backend API: <http://localhost:8080>
   - Health Check: <http://localhost:8080/actuator/health>
   - Swagger UI: <http://localhost:8080/swagger-ui/index.html>

### Build Commands

**Backend Services:**

```bash
cd backend/services
./gradlew build          # Build all modules
./gradlew test           # Run all tests
./gradlew :eventpro-api:bootRun  # Run application
```

**Lambda Functions:**

```bash
cd backend/lambdas/order-processor
./gradlew build          # Build Lambda function
./gradlew test           # Run tests
```

**Shared Module:**

```bash
cd backend/shared
./gradlew build          # Build shared module
```

**Frontend:**

```bash
cd frontend
npm install              # Install dependencies
npm run dev              # Start development server
npm run build            # Build for production
npm test                 # Run tests
```

**Docker:**

```bash
# Build backend services image
cd backend/services
docker build -t eventpro-api:latest .

# Build Lambda image
cd backend/lambdas/order-processor
docker build -t eventpro-order-processor:latest -f Dockerfile .
```

---

## Local Development

For comprehensive local development setup, testing, and troubleshooting instructions, see:

📖 **[LOCAL_DEVELOPMENT_GUIDE.md](./LOCAL_DEVELOPMENT_GUIDE.md)**

The local development guide covers:

- Detailed setup instructions
- Authentication using AWS Cognito (requires Cognito User Pool)
- Step-by-step configuration
- Testing procedures
- Troubleshooting common issues
- Makefile commands reference
- Service management

### Quick Reference

| Service | URL | Port |
|---------|-----|------|
| Frontend | <http://localhost:5173> | 5173 |
| Backend API | <http://localhost:8080> | 8080 |
| Health Check | <http://localhost:8080/actuator/health> | 8080 |
| Swagger UI | <http://localhost:8080/swagger-ui/index.html> | 8080 |
| LocalStack | <http://localhost:4566> | 4566 |
| PostgreSQL | localhost:5432 | 5432 |

| Cognito Configuration |
|----------------------|
| User Pool ID: Required |
| Client ID: Required |
| Note: Create users in your Cognito User Pool |

---

## API Documentation

### Base URL

All API endpoints are prefixed with `/api/v1`

### Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```txt
Authorization: Bearer <jwt_token>
```

### Available Endpoints

<details>
<summary><strong>Click to expand</strong></summary>

#### Users API (`/api/v1/users`)

- `GET /api/v1/users` - List users (paginated, ADMIN only)
- `GET /api/v1/users/{id}` - Get user by ID
- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/{id}` - Update user profile
- `POST /api/v1/users/sync` - Sync user from Cognito

#### Events API (`/api/v1/events`)

- `GET /api/v1/events` - List/search events
- `GET /api/v1/events/{id}` - Get event details
- `POST /api/v1/events` - Create event (ORGANIZER/ADMIN)
- `PUT /api/v1/events/{id}` - Update event (ORGANIZER/ADMIN)
- `DELETE /api/v1/events/{id}` - Delete event (ORGANIZER/ADMIN)
- `GET /api/v1/events/category/{categoryName}` - Get events by category
- `GET /api/v1/events/upcoming` - Get upcoming events
- `GET /api/v1/events/search?keyword={keyword}` - Search events

#### Tickets API (`/api/v1/tickets`)

- `GET /api/v1/tickets/{id}` - Get ticket by ID
- `GET /api/v1/tickets/event/{eventId}` - Get event tickets
- `POST /api/v1/tickets` - Create tickets (ORGANIZER/ADMIN)
- `PUT /api/v1/tickets/{id}` - Update ticket (ORGANIZER/ADMIN)
- `DELETE /api/v1/tickets/{id}` - Delete ticket (ORGANIZER/ADMIN)

#### Orders API (`/api/v1/orders`)

- `GET /api/v1/orders` - List orders (paginated, ADMIN only)
- `GET /api/v1/orders/{id}` - Get order by ID
- `GET /api/v1/orders/users/{userId}` - Get user's orders
- `POST /api/v1/orders` - Create order

#### Cart API (`/api/v1/user/{userId}/cart`)

- `GET /api/v1/user/{userId}/cart` - Get user's cart
- `POST /api/v1/user/{userId}/cart/add` - Add item to cart
- `PATCH /api/v1/user/{userId}/cart/increment/ticket/{eventIdAndType}` - Increment quantity
- `PATCH /api/v1/user/{userId}/cart/decrement/ticket/{eventIdAndType}` - Decrement quantity
- `DELETE /api/v1/user/{userId}/cart/clearCart` - Clear cart

</details>

### Interactive API Documentation

When running locally, access Swagger UI at:

- <http://localhost:8080/swagger-ui/index.html>

### Response Format

**Success Response:**

```json
{
  "id": "uuid",
  "field1": "value1",
  "field2": "value2"
}
```

**Error Response:**

```json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Error message",
  "path": "/api/v1/endpoint"
}
```

**Paginated Response:**

```json
{
  "content": [...],
  "page": 0,
  "size": 10,
  "totalElements": 100,
  "totalPages": 10,
  "last": false
}
```

---

## Additional Resources

### Documentation

- **[LOCAL_DEVELOPMENT_GUIDE.md](./LOCAL_DEVELOPMENT_GUIDE.md)** - Comprehensive local development guide
- **[SHARED_MODULE_GUIDE.md](./SHARED_MODULE_GUIDE.md)** - Shared module architecture and usage
- **[LAMBDA_IMPLEMENTATION_GUIDE.md](./z_docs/LAMBDA_IMPLEMENTATION_GUIDE.md)** - Lambda functions implementation guide
- **[backend/services/README.md](./backend/services/README.md)** - Backend application documentation
- **[backend/shared/README.md](./backend/shared/README.md)** - Shared module documentation
- **[frontend/README.md](./frontend/README.md)** - Frontend application documentation
- **[z_docs/modular-monolith-architecture.md](./z_docs/modular-monolith-architecture.md)** - Detailed architecture design
- **[specs/001-eventpro-platform/data-model.md](./specs/001-eventpro-platform/data-model.md)** - Database schema documentation

### External Resources

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Quarkus Documentation](https://quarkus.io/)
- [React Documentation](https://react.dev/)
- [AWS Documentation](https://docs.aws.amazon.com/)
- [Terraform Documentation](https://www.terraform.io/docs)
- [LocalStack Documentation](https://docs.localstack.cloud/)

### CI/CD

- GitLab CI/CD pipeline configuration: `.gitlab-ci.yml`
- Automated testing, building, and deployment
- Docker image builds for backend services and Lambda functions
- ECR integration for Lambda container images

### Testing

- **Backend**: JUnit 5, JaCoCo for coverage
- **Lambda**: Quarkus JUnit 5, Mockito
- **Frontend**: Vitest, React Testing Library
- **Integration**: Docker Compose for local integration testing

---

## License

[Add your license information here]

---

## Engineering

- Alhagie Bai Cham
- Jerome Joof

## Support

For issues, questions, or contributions, please refer to the project documentation or contact the development team.
