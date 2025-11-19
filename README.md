# EventPro Site

A modern, microservices-based event ticketing platform built for scalability, resilience, and cost-effectiveness. EventPro enables users to discover events, purchase tickets, and manage their event listings with a seamless, secure experience.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Running the Application](#running-the-application)
- [Using the Application](#using-the-application)
- [Development Workflow](#development-workflow)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Contributing](#contributing)

## Overview

EventPro Site is a full-stack event ticketing platform that allows:

- **Users** to browse events, purchase tickets, and manage their orders
- **Organizers** to create and manage events, set up ticket types, and track sales
- **Admins** to oversee the platform, manage users, and view analytics

The platform is built using a **microservices architecture** with **event-driven patterns**, ensuring high availability, scalability, and resilience. It leverages AWS cloud services for infrastructure, providing a cost-effective and reliable solution.

### Key Characteristics

- **Microservices Architecture**: Independent services that can scale independently
- **Event-Driven Processing**: Asynchronous order and payment processing using SQS queues
- **Serverless Components**: Lambda functions for event-driven operations
- **High Availability**: Multi-AZ deployment with automatic failover
- **Cost-Optimized**: Estimated production cost of ~$440-625/month with optimizations

## Architecture

<details>
<summary>High-Level Architecture</summary>

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                  │
│              Deployed on S3 + CloudFront CDN                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Application Load Balancer (ALB)                │
│              - Authentication (AWS Cognito)                 │
│              - Request Routing                              │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌───────────────┐    ┌────────────────┐
│   Core API   │    │  Event API    │    │  Payment API   │
│ (ECS Fargate)│    │(ECS Fargate)  │    │ (ECS Fargate)  │
│ Spring Boot  │    │ Spring Boot   │    │ Spring Boot    │
└──────────────┘    └───────────────┘    └────────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌───────────────┐
│  PostgreSQL  │    │   SQS Queue  │    │   SQS Queue   │
│(RDS Multi-AZ)│    │ (Order Queue)│    │(Payment Queue)│
└──────────────┘    └──────────────┘    └───────────────┘
                              │                     │
                              ▼                     ▼
                    ┌───────────────┐    ┌─────────────────┐
                    │   Lambda      │    │   Lambda        │
                    │Order Processor│    │Payment Processor│
                    │  (Quarkus)    │    │   (Quarkus)     │
                    └───────────────┘    └─────────────────┘
                              │                     │
                              ▼                     ▼
                    ┌──────────────┐    ┌────────────────┐
                    │   SQS Queue  │    │  PostgreSQL    │
                    │(Notification │    │  (RDS Multi-AZ)│
                    │    Queue)    │    └────────────────┘
                    └──────────────┘
                              │
                              ▼
                    ┌──────────────┐
                    │   Lambda     │
                    │Notification  │
                    │   Sender     │
                    │  (Quarkus)   │
                    └──────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
            ┌──────────────┐    ┌──────────────┐
            │  AWS SES     │    │  AWS SNS     │
            │  (Email)     │    │  (SMS)       │
            └──────────────┘    └──────────────┘
```

</details>

<details>
<summary>Service Breakdown</summary>

#### 1. **Core API Service** (ECS Fargate - Spring Boot)
- **Port**: 8080
- **Responsibilities**: User management, Event CRUD, Ticket management, Cart operations, Authentication/Authorization
- **Database**: PostgreSQL (RDS Multi-AZ)
- **Endpoints**: `/api/v1/users/**`, `/api/v1/events/**`, `/api/v1/tickets/**`, `/api/v1/cart/**`, `/api/v1/orders/**`

#### 2. **Event API Service** (ECS Fargate - Spring Boot)
- **Port**: 8081
- **Responsibilities**: Event search, filtering, analytics, recommendations
- **Database**: PostgreSQL + DynamoDB (caching)

#### 3. **Order Processing Lambda** (Quarkus)
- **Trigger**: SQS Queue (`order-queue`)
- **Responsibilities**: Order validation, ticket reservation, order status updates
- **Flow**: User places order → Core API creates order → Publishes to SQS → Lambda processes → Publishes to payment-queue

#### 4. **Payment Processing Lambda** (Quarkus)
- **Trigger**: SQS Queue (`payment-queue`)
- **Responsibilities**: Stripe payment processing, webhook handling, order fulfillment, ticket assignment
- **Flow**: OrderProcessor publishes → PaymentProcessor processes → Updates order status → Assigns tickets → Publishes to notification-queue

#### 5. **Notification Service Lambda** (Quarkus)
- **Trigger**: SQS Queue (`notification-queue`)
- **Responsibilities**: Email (SES), SMS (SNS), WebSocket notifications

#### 6. **Analytics Service Lambda** (Quarkus)
- **Trigger**: EventBridge (scheduled) or on-demand
- **Responsibilities**: Real-time analytics, event metrics, sales reports

</details>

<details>
<summary>Why This Architecture?</summary>

- **Microservices**: Independent scaling, isolated failure domains, technology flexibility
- **Event-Driven**: Asynchronous processing for better performance and resilience
- **Serverless (Lambda)**: Cost-effective for event-driven operations, auto-scaling
- **ECS Fargate**: Always-on services for synchronous operations, better for long-running connections
- **PostgreSQL**: Complex relational data, ACID transactions, cost-effective for steady workloads

</details>

## Technology Stack

<details>
<summary>Technology Stack</summary>

### Frontend
- **Framework**: React 19
- **Language**: TypeScript 5.x (strict mode)
- **Build Tool**: Vite 5.2.2+
- **UI Library**: shadcn/ui
- **Styling**: Tailwind CSS 3.x
- **State Management**: Redux Toolkit
- **Routing**: React Router
- **Authentication**: AWS Cognito SDK

### Backend (ECS Services)
- **Framework**: Spring Boot 3.5.7
- **Language**: Java 21
- **Build Tool**: Gradle 8.5+
- **Database**: PostgreSQL 15+ (RDS Multi-AZ)
- **ORM**: Spring Data JPA / Hibernate
- **Security**: Spring Security + AWS Cognito
- **Messaging**: AWS SQS SDK
- **Storage**: AWS S3 SDK
- **Secrets**: AWS Secrets Manager

### Backend (Lambda Functions)
- **Framework**: Quarkus 3.26.2
- **Language**: Java 21
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

## Features

### User Features
- **Authentication**: Sign up, sign in, and profile management via AWS Cognito
- **Event Discovery**: Browse events by category, search, and filter
- **Shopping Cart**: Add tickets to cart, update quantities, and checkout
- **Payment Processing**: Secure payment processing via Stripe
- **Notifications**: Email, SMS, and in-app notifications
- **Ticket Management**: View purchased tickets, download, and print with QR codes

### Organizer Features
- **Event Management**: Create, update, and manage events
- **Ticket Management**: Create ticket types (VIP, Regular, Early Bird), set prices, and manage availability
- **Analytics Dashboard**: View event performance, sales analytics, and user engagement metrics
- **Image Upload**: Upload event images to S3

### Admin Features
- **User Management**: View and manage all users
- **Platform Oversight**: Monitor platform health and performance
- **Analytics**: Platform-wide analytics and reporting

</details>

## Project Structure

<details>
<summary>Project Structure</summary>

```
eventpro-site/
├── services/                    # Backend Microservices
│   ├── core-api/              # Core API Service (ECS Fargate - Spring Boot)
│   │   ├── src/main/java/...  # Java source code
│   │   ├── build.gradle       # Build configuration
│   │   └── Dockerfile         # Docker image definition
│   ├── event-api/             # Event API Service (ECS Fargate - Spring Boot)
│   └── lambdas/               # Lambda Functions (Quarkus)
│       ├── order-processor/   # Order Processing Lambda
│       ├── payment-processor/ # Payment Processing Lambda
│       ├── notification-sender/# Notification Service Lambda
│       └── analytics-service/ # Analytics Service Lambda
│   └── shared/                # Shared Libraries/Modules
│       ├── common/            # Common utilities
│       ├── messaging/         # Messaging utilities (SQS)
│       └── database/         # Database utilities
├── web/                       # Frontend Application
│   ├── src/                  # React source code
│   ├── package.json          # Node.js dependencies
│   └── vite.config.ts        # Vite configuration
├── terraform/                 # Infrastructure as Code
│   ├── environments/         # Environment-specific configs
│   │   ├── dev/             # Development environment
│   │   └── prod/            # Production environment
│   └── modules/              # Reusable Terraform modules
│       ├── vpc/             # VPC module
│       ├── rds/             # RDS PostgreSQL module
│       ├── ecs/             # ECS Fargate module
│       ├── lambda/          # Lambda functions module
│       ├── alb/             # Application Load Balancer module
│       ├── s3/              # S3 buckets module
│       ├── cloudfront/      # CloudFront module
│       ├── cognito/         # Cognito User Pool module
│       └── secrets-manager/ # Secrets Manager module
└── z_docs/                   # Documentation
    ├── architecture-recommendation.md
    ├── guideline.md
    ├── project-structure.md
    ├── setup-guide.md
    └── user-stories.md
```

</details>

## Prerequisites

Before you begin, ensure you have the following installed:

- **Java 21** - [Download](https://adoptium.net/)
- **Gradle 8.5+** - [Download](https://gradle.org/install/) (or use Gradle wrapper)
- **Node.js 18+** and **npm** - [Download](https://nodejs.org/)
- **Docker** - [Download](https://www.docker.com/get-started) (for local development)
- **AWS CLI** - [Download](https://aws.amazon.com/cli/) (for deployment)
- **Terraform** - [Download](https://www.terraform.io/downloads) (for infrastructure)
- **Git** - [Download](https://git-scm.com/downloads)

<details>
<summary>AWS Account Setup</summary>

### AWS Account Setup

1. Create an AWS account
2. Configure AWS CLI:
   ```bash
   aws configure
   ```
3. Set up IAM user with appropriate permissions for development

</details>

## Getting Started

<details>
<summary>Getting Started</summary>

### 1. Clone the Repository

```bash
git clone <repository-url>
cd eventpro-site
```

### 2. Set Up Backend Services

#### Build All Services

```bash
cd services
./gradlew build
```

#### Build Specific Service

```bash
# Core API
./gradlew :services:core-api:build

# Event API
./gradlew :services:event-api:build

# Lambda Functions (Quarkus automatically generates function.zip)
./gradlew :services:lambdas:order-processor:build
./gradlew :services:lambdas:payment-processor:build
./gradlew :services:lambdas:notification-sender:build
./gradlew :services:lambdas:analytics-service:build
```

### 3. Set Up Frontend

```bash
cd web
npm install
```

### 4. Configure Environment Variables

#### Backend (Core API)

Create `services/core-api/src/main/resources/application-dev.yml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/eventpro
    username: eventpro
    password: eventpro

aws:
  cognito:
    userPoolId: ${COGNITO_USER_POOL_ID}
    clientId: ${COGNITO_CLIENT_ID}
    region: us-east-1
  sqs:
    orderQueueUrl: ${ORDER_QUEUE_URL}
    paymentQueueUrl: ${PAYMENT_QUEUE_URL}
    notificationQueueUrl: ${NOTIFICATION_QUEUE_URL}
```

#### Frontend

Create `web/.env.local`:

```env
VITE_API_URL=http://localhost:8080
VITE_COGNITO_USER_POOL_ID=your-pool-id
VITE_COGNITO_CLIENT_ID=your-client-id
VITE_AWS_REGION=us-east-1
```

</details>

## Running the Application

<details>
<summary>Running the Application</summary>

### Local Development Setup

#### 1. Start Infrastructure Services (Docker)

```bash
# Start PostgreSQL and LocalStack (for local AWS services)
docker-compose up -d
```

Create `docker-compose.yml` in the root directory:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: eventpro
      POSTGRES_USER: eventpro
      POSTGRES_PASSWORD: eventpro
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  localstack:
    image: localstack/localstack:latest
    environment:
      - SERVICES=sqs,secretsmanager,s3
      - DEBUG=1
    ports:
      - "4566:4566"
    volumes:
      - localstack_data:/var/lib/localstack

volumes:
  postgres_data:
  localstack_data:
```

#### 2. Run Core API Service

```bash
cd services/core-api
./gradlew bootRun
```

The API will be available at `http://localhost:8080`

#### 3. Run Event API Service

```bash
cd services/event-api
./gradlew bootRun
```

The API will be available at `http://localhost:8081`

#### 4. Run Frontend

```bash
cd web
npm run dev
```

The frontend will be available at `http://localhost:5173`

</details>

### Running Tests

<details>
<summary>Running Tests</summary>

```bash
# Run all tests
cd services
./gradlew test

# Run specific service tests
./gradlew :core-api:test

# Run frontend tests
cd web
npm test
```

</details>

### Services Verification

<details>
<summary>Services Verification - Clean, Build, and Test</summary>

#### Clean, Build, and Test All Services

```bash
# From services/ directory
cd services

# Clean all projects
./gradlew clean

# Build all projects
./gradlew build

# Test all projects
./gradlew test

# Clean, build, and test in one command
./gradlew clean build test
```

#### Individual Service Commands

##### Core API (Spring Boot)

```bash
cd services

# Clean
./gradlew :core-api:clean

# Build
./gradlew :core-api:build

# Test
./gradlew :core-api:test

# Clean, build, and test
./gradlew :core-api:clean :core-api:build :core-api:test
```

##### Event API (Spring Boot)

```bash
cd services

# Clean
./gradlew :event-api:clean

# Build
./gradlew :event-api:build

# Test
./gradlew :event-api:test

# Clean, build, and test
./gradlew :event-api:clean :event-api:build :event-api:test
```

##### Order Processor Lambda (Quarkus)

```bash
cd services

# Clean
./gradlew :lambdas:order-processor:clean

# Build
./gradlew :lambdas:order-processor:build

# Test
./gradlew :lambdas:order-processor:test

# Clean, build, and test
./gradlew :lambdas:order-processor:clean :lambdas:order-processor:build :lambdas:order-processor:test
```

##### Payment Processor Lambda (Quarkus)

```bash
cd services

# Clean
./gradlew :lambdas:payment-processor:clean

# Build
./gradlew :lambdas:payment-processor:build

# Test
./gradlew :lambdas:payment-processor:test

# Clean, build, and test
./gradlew :lambdas:payment-processor:clean :lambdas:payment-processor:build :lambdas:payment-processor:test
```

##### Notification Sender Lambda (Quarkus)

```bash
cd services

# Clean
./gradlew :lambdas:notification-sender:clean

# Build
./gradlew :lambdas:notification-sender:build

# Test
./gradlew :lambdas:notification-sender:test

# Clean, build, and test
./gradlew :lambdas:notification-sender:clean :lambdas:notification-sender:build :lambdas:notification-sender:test
```

##### Analytics Service Lambda (Quarkus)

```bash
cd services

# Clean
./gradlew :lambdas:analytics-service:clean

# Build
./gradlew :lambdas:analytics-service:build

# Test
./gradlew :lambdas:analytics-service:test

# Clean, build, and test
./gradlew :lambdas:analytics-service:clean :lambdas:analytics-service:build :lambdas:analytics-service:test
```

#### Quick Verification Commands

```bash
cd services

# Verify all APIs build successfully
./gradlew :core-api:build :event-api:build

# Verify all Lambdas build successfully
./gradlew :lambdas:order-processor:build :lambdas:payment-processor:build :lambdas:notification-sender:build :lambdas:analytics-service:build

# Run all tests without building
./gradlew test --no-build-cache

# Clean and rebuild everything
./gradlew clean build

# Full verification (clean, build, test all)
./gradlew clean build test
```

</details>

### Building for Production

<details>
<summary>Building for Production</summary>

<details>
<summary>Docker Image Build Commands</summary>

```bash
cd services
```

**Important**: All Docker image build commands must be executed from the project root

#### For API Services (Core API, Event API)

```bash
docker image build -f core-api/Dockerfile -t access-core-api:latest .
docker image build -f event-api/Dockerfile -t access-event-api:latest .
```

#### For Lambda Functions

```bash
docker image build -f lambdas/order-processor/Dockerfile -t access-order-processor:latest .
docker image build -f lambdas/payment-processor/Dockerfile -t access-payment-processor:latest .
docker image build -f lambdas/notification-sender/Dockerfile -t access-notification-sender:latest .
docker image build -f lambdas/analytics-service/Dockerfile -t access-analytics-service:latest .
```

```bash
# From root directory
docker image build -f secret-rotation/Dockerfile -t access-secret-rotation:latest .
```

**Note**: The Dockerfile in each service directory expects to be run from that directory's context, which is why you must execute the build command from within the service directory.

</details>

#### Backend Gradle Build Commands 

```bash
# From root directory
cd services

# Build all projects
./gradlew build

# Build all Lambda functions (Quarkus automatically generates function.zip)
./gradlew :lambdas:order-processor:build
./gradlew :lambdas:payment-processor:build
./gradlew :lambdas:notification-sender:build
./gradlew :lambdas:analytics-service:build

# Lambda packages are ready in build/function.zip for each service
```

#### Frontend

```bash
cd web
npm run build
# Production build will be in: dist/
```

</details>

## Using the Application

<details>
<summary>Using the Application</summary>

### For End Users

1. **Sign Up / Sign In**
   - Navigate to the login page
   - Create an account or sign in with existing credentials
   - Verify email/phone if required

2. **Browse Events**
   - Browse available events on the home page
   - Filter by category (Music, Sports, Arts & Crafts, etc.)
   - Search for specific events
   - View event details

3. **Purchase Tickets**
   - Select an event
   - Choose ticket types and quantities
   - Add to cart
   - Proceed to checkout
   - Enter payment information
   - Complete purchase

4. **Manage Tickets**
   - View purchased tickets in "My Tickets"
   - Download tickets as PDF
   - View QR codes for event entry

### For Organizers

1. **Create Events**
   - Navigate to "Create Event"
   - Fill in event details (name, description, date, location)
   - Upload event image
   - Select category
   - Save event

2. **Manage Tickets**
   - Navigate to event management
   - Create ticket types (VIP, Regular, Early Bird)
   - Set prices and quantities
   - Manage ticket availability

3. **View Analytics**
   - Access analytics dashboard
   - View event performance metrics
   - Track sales and revenue
   - Monitor user engagement

### API Endpoints

#### Core API (Port 8080)

- **User Controller**
  - `GET /api/v1/users/me` - Get current user profile
  - `PUT /api/v1/users/me` - Update current user profile
  - `GET /api/v1/users/{id}` - Get user by ID (admin only)

- **Ticket Controller**
  - `GET /api/v1/tickets/event/{eventId}` - Get tickets by event
  - `POST /api/v1/tickets` - Create tickets (admin/organizer)
  - `PATCH /api/v1/tickets/{id}` - Update ticket (admin/organizer)
  - `DELETE /api/v1/tickets/{id}` - Delete ticket (admin/organizer)

- **Event Controller**
  - `GET /api/v1/events` - List all events
  - `GET /api/v1/events/{id}` - Get event by ID
  - `POST /api/v1/events` - Create event (admin/organizer)
  - `PATCH /api/v1/events/{id}` - Update event (admin/organizer)
  - `DELETE /api/v1/events/{id}` - Delete event (admin/organizer)

- **Ticket Controller**
  - `GET /api/v1/tickets/event/{eventId}` - Get tickets by event
  - `POST /api/v1/tickets` - Create tickets (admin/organizer)
  - `PATCH /api/v1/tickets/{id}` - Update ticket (admin/organizer)

- **Cart Controller**
  - `POST /api/v1/cart/add` - Add item to cart
  - `GET /api/v1/cart` - Get user's cart
  - `POST /api/v1/orders` - Create order from cart
  - `GET /api/v1/orders` - Get user's orders

#### Event API (Port 8081)

- `GET /api/v1/events/search` - Search events
- `GET /api/v1/events/analytics` - Event analytics (admin/organizer)

</details>

## Development Workflow

<details>
<summary>Development Workflow</summary>

### Git Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Write code following the project guidelines
   - Write tests
   - Update documentation if needed

3. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

4. **Push and Create Merge Request**
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Standards

- **Java**: Follow Google Java Style Guide
- **TypeScript/React**: Follow Airbnb TypeScript Style Guide
- **Testing**: Minimum 80% coverage for services
- **Commits**: Use conventional commit messages

### Running Linters

```bash
# Backend (if configured)
cd services
./gradlew checkstyleMain

# Frontend
cd web
npm run lint
```

</details>

## Deployment

<details>
<summary>Deployment</summary>

### Infrastructure Deployment

1. **Initialize Terraform**
   ```bash
   cd terraform/environments/dev
   terraform init
   ```

2. **Plan Deployment**
   ```bash
   terraform plan
   ```

3. **Apply Infrastructure**
   ```bash
   terraform apply
   ```

### Application Deployment

#### ECS Services

1. **Build and Push Docker Image**
   ```bash
   docker image build -t core-api:latest .
   docker image tag core-api:latest <ecr-registry>/core-api:latest
   docker image push <ecr-registry>/core-api:latest
   ```

2. **Update ECS Service**
   ```bash
   aws ecs update-service --cluster eventpro-dev --service core-api --force-new-deployment
   ```

#### Lambda Functions

1. **Build Lambda Package**
   ```bash
   cd services/lambdas/order-processor
   ./gradlew build
   # Package will be in: build/function.zip
   ```

2. **Deploy via Terraform**
   - Terraform will automatically deploy Lambda functions when infrastructure is applied

#### Frontend

1. **Build Production Bundle**
   ```bash
   cd web
   npm run build
   ```

2. **Upload to S3**
   ```bash
   aws s3 sync dist/ s3://<frontend-bucket>/
   ```

3. **Invalidate CloudFront Cache**
   ```bash
   aws cloudfront create-invalidation --distribution-id <distribution-id> --paths "/*"
   ```

### CI/CD Pipeline

The project uses GitLab CI/CD with the following stages:

1. **Test**: Run unit and integration tests
2. **Build**: Build Docker images and Lambda packages
3. **Deploy**: Deploy to dev/prod environments

See `.gitlab-ci.yml` for detailed pipeline configuration.

</details>

## Documentation

Comprehensive documentation is available in the `z_docs/` directory:

- **[Architecture Recommendation](./z_docs/architecture-recommendation.md)**: Detailed architecture decisions and rationale
- **[Development Guidelines](./z_docs/guideline.md)**: Technical guidelines, architecture, and development boundaries
- **[Project Structure](./z_docs/project-structure.md)**: Detailed project structure and file organization
- **[Setup Guide](./z_docs/setup-guide.md)**: Step-by-step setup instructions
- **[User Stories](./z_docs/user-stories.md)**: Comprehensive requirements and user stories

## Contributing

1. Read the [Development Guidelines](./z_docs/guideline.md)
2. Follow the code standards and conventions
3. Write tests for new features
4. Update documentation as needed
5. Create merge requests with clear descriptions

## License

[Add your license information here]

## Team

- **Tech Lead**: [Your Name]
- **Product Manager**: [Name]
- **DevOps Engineer**: [Name]

## Useful Links

- [AWS Documentation](https://docs.aws.amazon.com/)
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Quarkus Documentation](https://quarkus.io/)
- [React Documentation](https://react.dev/)
- [Terraform Documentation](https://www.terraform.io/docs)

## Support

For questions or issues, please:
1. Check the documentation in `z_docs/`
2. Search existing issues
3. Create a new issue with detailed information

---

**Last Updated**: 2024  
**Version**: 1.0.0
