# EventPro Platform

A comprehensive full-stack event ticketing platform built with a **Modular Monolith Architecture**. EventPro enables event organizers to create, manage, and sell tickets for events while providing customers with a seamless experience to discover, purchase, and attend events.

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

### Key Characteristics

- **Modular Monolith**: Single deployable unit with clear module boundaries
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
            │  AWS SES     │    │  AWS SNS     │
            │  (Email)     │    │  (SMS)       │
            └──────────────┘    └──────────────┘
                    │
                    ▼
            ┌──────────────┐
            │  AWS S3      │
            │  (Images)    │
            └──────────────┘
```

</details>

### Architecture Pattern: Modular Monolith

EventPro uses a **Modular Monolith** architecture, which provides:

- ✅ **Single Build System**: No Spring Boot + Quarkus conflicts
- ✅ **Simplified Deployment**: One Docker image, one ECS service
- ✅ **Easier Development**: Single application to run locally
- ✅ **Lower Costs**: ~$81/month vs ~$170/month (52% reduction)
- ✅ **Future-Proof**: Can extract modules to microservices when needed

**Module Communication:**

- **Within Monolith**: Direct method calls, Spring Dependency Injection, Spring Events
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
| **Spring Boot** | 4.0.0 | Application framework |
| **Gradle** | 8.5+ | Build tool |
| **PostgreSQL** | 16+ | Primary database |
| **Spring Data JPA** | - | Database access layer |
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
| **Lambda** | Serverless functions (analytics, scheduled tasks) |

---

</details>

## Project Structure

<details>
<summary>Click to expand</summary>

```txt
eventpro-site/
├── backend/                      # Backend Application (Modular Monolith)
│   ├── modules/
│   │   ├── eventpro-core/        # Core module: Users, Auth, Common utilities
│   │   ├── eventpro-event/       # Event module: Events, Tickets, Search
│   │   ├── eventpro-order/       # Order module: Cart, Orders, Checkout
│   │   ├── eventpro-payment/     # Payment module: Stripe integration
│   │   ├── eventpro-notification/# Notification module: Email, SMS, WebSocket
│   │   └── eventpro-api/         # Main application module (REST API layer)
│   ├── build.gradle              # Root build configuration
│   ├── settings.gradle           # Project settings
│   ├── Dockerfile                # Docker image definition
│   └── README.md                 # Backend documentation
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
│       ├── rds/                  # RDS PostgreSQL
│       ├── route53/              # Route53 DNS
│       ├── s3/                   # S3 buckets
│       ├── secrets-manager/      # Secrets Manager
│       └── vpc/                  # VPC and networking
│
├── secret-rotation/             # Lambda function for secret rotation
│   ├── lambda_function.py
│   ├── requirements.txt
│   └── Dockerfile
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
└── README.md                   # This file
```

</details>

### Module Breakdown

<details>
<summary>Click to expand</summary>

#### Backend Modules

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

### Payment Processing

- Stripe integration for secure payments
- Payment status tracking
- Payment webhook handling
- Refund processing (future)

### Notifications

- Email notifications (order confirmations, event reminders)
- SMS notifications (optional)
- In-app notifications
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
<summary>Click to expan</summary>

#### Compute

- **ECS Fargate**: Hosts the EventPro API backend service
  - Auto-scaling based on CPU/memory metrics
  - Multi-AZ deployment for high availability

#### Database

- **RDS PostgreSQL (Multi-AZ)**: Primary database
  - Automated backups
  - Point-in-time recovery
  - Read replicas (optional)

#### Storage

- **S3**: Event image storage
  - Public read access for images
  - CloudFront integration for CDN

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

#### Messaging & Notifications

- **SES**: Email notifications
  - Transactional emails
  - Email templates
- **SNS**: SMS notifications
  - SMS delivery
  - Topic subscriptions
- **SQS**: Message queuing
  - Async order processing
  - Event-driven workflows

#### CDN

- **CloudFront**: Content delivery network
  - Frontend static assets
  - Event images
  - Caching and performance optimization

#### Serverless

- **Lambda**: Serverless functions
  - Analytics processing
  - Scheduled tasks
  - Secret rotation

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

**Backend:**

```bash
cd backend
./gradlew build          # Build all modules
./gradlew test           # Run all tests
./gradlew :eventpro-api:bootRun  # Run application
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
# Build backend image
cd backend
docker build -t eventpro-api:latest .

# Build frontend image (if needed)
cd frontend
docker build -t eventpro-frontend:latest .
```

---

## Local Development

For comprehensive local development setup, testing, and troubleshooting instructions, see:

📖 **[LOCAL_DEVELOPMENT_GUIDE.md](./LOCAL_DEVELOPMENT_GUIDE.md)**

The local development guide covers:

- Detailed setup instructions
- Authentication modes (Mock vs Real Cognito)
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

| Default Test User (Mock Auth) |
|--------------------------------|
| Email: `dev@local.test` |
| Password: `password123` |
| Role: `USER` |

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
- **[backend/README.md](./backend/README.md)** - Backend application documentation
- **[frontend/README.md](./frontend/README.md)** - Frontend application documentation
- **[z_docs/modular-monolith-architecture.md](./z_docs/modular-monolith-architecture.md)** - Detailed architecture design
- **[specs/001-eventpro-platform/data-model.md](./specs/001-eventpro-platform/data-model.md)** - Database schema documentation

### External Resources

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [React Documentation](https://react.dev/)
- [AWS Documentation](https://docs.aws.amazon.com/)
- [Terraform Documentation](https://www.terraform.io/docs)
- [LocalStack Documentation](https://docs.localstack.cloud/)

### CI/CD

- GitLab CI/CD pipeline configuration: `.gitlab-ci.yml`
- Automated testing, building, and deployment

### Testing

- **Backend**: JUnit 5, JaCoCo for coverage
- **Frontend**: Vitest, React Testing Library
- **Integration**: Docker Compose for local integration testing

---

## License

[Add your license information here]

---

## Contributing

[Add contributing guidelines here]

---

## Support

For issues, questions, or contributions, please refer to the project documentation or contact the development team.
