# EventPro Platform

A full-stack event ticketing platform built with a **Modular Monolith Architecture**.

## Project Structure

```text
eventpro-site/
├── backend/                   # Modular Monolith (Backend Application)
│   ├── modules/
│   │   ├── eventpro-core/     # Users, Auth, Common utilities
│   │   ├── eventpro-event/   # Events, Tickets, Search
│   │   ├── eventpro-order/    # Cart, Orders, Checkout
│   │   ├── eventpro-payment/  # Payment Processing (Stripe)
│   │   ├── eventpro-notification/ # Email, SMS, WebSocket
│   │   └── eventpro-api/      # Main Application Module
│   ├── build.gradle
│   ├── settings.gradle
│   ├── Dockerfile
│   └── README.md
│
├── frontend/                  # Frontend (React + TypeScript)
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
│
├── infrastructure/            # Infrastructure as Code
│   ├── environments/
│   │   ├── dev/
│   │   └── local/
│   └── modules/
│
├── secret-rotation/          # Lambda for secret rotation
│   └── lambda_function.py
│
├── specs/                    # Project specifications
│   └── 001-eventpro-platform/
│
├── .gitlab-ci.yml           # CI/CD pipeline
└── README.md                # This file
```

## Main Application: EventPro API

**Modular Monolith** - Single Spring Boot application with 6 modules:

- **eventpro-core**: User management, authentication, common utilities
- **eventpro-event**: Event management, tickets, search
- **eventpro-order**: Shopping cart, orders, checkout
- **eventpro-payment**: Payment processing (Stripe)
- **eventpro-notification**: Notifications (Email, SMS, WebSocket)
- **eventpro-api**: Main application module

**See `backend/README.md` for detailed backend documentation.**

## Quick Start

### Build Backend

```bash
cd backend
./gradlew build
```

### Run Backend Locally

```bash
cd backend
./gradlew :eventpro-api:bootRun
```

### Build Docker Image

```bash
cd backend
docker build -t backend:latest .
```

## Local Development

### Prerequisites

- **Java 21** - [Download](https://adoptium.net/)
- **Node.js 22+** and **npm** - [Download](https://nodejs.org/)
- **Docker** and **Docker Compose** - [Download](https://www.docker.com/get-started)
- **Terraform 1.5+** - [Download](https://www.terraform.io/downloads)
- **AWS CLI** - [Download](https://aws.amazon.com/cli/) (for testing LocalStack)

### Quick Start (Local Development)

**Simplified Setup**: Docker Compose runs everything with hot reload enabled via volume mounts.

```bash
# 1. Provision LocalStack resources (creates/updates .env file automatically)
make local-infra

# 2. Start everything with one command
make local-up

# Or manually:
docker-compose up
```

**How it works:**

- `make local-infra` provisions LocalStack resources and automatically creates/updates `.env` file with Cognito values
- `make local-up` reads `.env` file and starts all services
- Frontend can use `.env.local` file when running directly (see LOCAL_DEVELOPMENT.md)

**Alternative: Run services separately** (if you prefer direct control):

```bash
# Start only infrastructure
make local-infra-only
make local-infra

# Then run backend/frontend directly on your machine
# (see LOCAL_DEVELOPMENT.md for details)
```

### Verify Setup

**1. Check Backend Health:**

```bash
curl http://localhost:8080/actuator/health
# Expected: {"status":"UP"}
```

**2. Check Database Migrations:**

```bash
docker exec -it postgres psql -U eventpro -d eventpro -c "\dt"
# Should show all 12 tables created
```

**3. Check LocalStack Resources:**

```bash
# SQS Queues
aws --endpoint-url=http://localhost:4566 sqs list-queues

# S3 Buckets
aws --endpoint-url=http://localhost:4566 s3 ls

# Cognito User Pools
aws --endpoint-url=http://localhost:4566 cognito-idp list-user-pools --max-results 10
```

**4. Access Frontend:**

- Open `http://localhost:5173` in your browser

### Makefile Commands

| Command | Description |
|---------|-------------|
| `make local-up` | Start all services (PostgreSQL, LocalStack, Backend, Frontend) |
| `make local-infra-only` | Start only infrastructure (PostgreSQL + LocalStack) |
| `make local-down` | Stop all local services |
| `make local-infra` | Provision LocalStack resources via Terraform |
| `make local-clean` | Clean up all local resources (Terraform destroy + volumes) |
| `make local-outputs` | Show Terraform outputs (Cognito IDs, queue URLs, etc.) |
| `make local-logs` | View logs from all services |
| `make local-logs-api` | View logs from backend API only |
| `make local-logs-frontend` | View logs from frontend only |

### Testing Locally

**Test SQS Queue:**

```bash
# Send test message
aws --endpoint-url=http://localhost:4566 sqs send-message \
  --queue-url http://localhost:4566/000000000000/order-queue \
  --message-body '{"orderId": "test-123"}'
```

**Test S3 Upload:**

```bash
# Upload test image
aws --endpoint-url=http://localhost:4566 s3 cp test.jpg \
  s3://eventpro-images-local/test.jpg
```

**Test Cognito:**

```bash
# Get user pool ID
POOL_ID=$(cd infrastructure/environments/local && terraform output -raw cognito_user_pool_id)

# Create test user
aws --endpoint-url=http://localhost:4566 cognito-idp admin-create-user \
  --user-pool-id $POOL_ID \
  --username testuser \
  --user-attributes Name=email,Value=test@example.com \
  --temporary-password TempPass123!
```

### Cleanup

```bash
# Stop services
make local-down

# Clean up everything (including volumes)
make local-clean
```

<details>
<summary><strong>📖 Detailed Local Development Guide</strong></summary>

This section provides comprehensive step-by-step instructions for local development setup, troubleshooting, and advanced configuration.

## Prerequisites

Before starting, ensure you have installed:

- **Java 21** - [Download](https://adoptium.net/)
- **Gradle 8.5+** - Included via Gradle wrapper (`./gradlew`)
- **Node.js 22+** and **npm** - [Download](https://nodejs.org/)
- **Docker** and **Docker Compose** - [Download](https://www.docker.com/get-started)
- **Terraform 1.5+** - [Download](https://www.terraform.io/downloads)
- **AWS CLI** - [Download](https://aws.amazon.com/cli/) (for testing LocalStack resources)

## Step-by-Step Setup

### Step 1: Start Infrastructure Services

**Option A: Start Everything with Docker Compose (Recommended)**

```bash
# First, provision LocalStack resources
make local-infra

# Get Cognito values
cd infrastructure/environments/local
export COGNITO_USER_POOL_ID=$(terraform output -raw cognito_user_pool_id)
export COGNITO_CLIENT_ID=$(terraform output -raw cognito_user_pool_client_id)
cd ../../..

# Start all services (infrastructure + backend + frontend)
COGNITO_USER_POOL_ID=$COGNITO_USER_POOL_ID \
COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID \
docker-compose up
```

**Benefits:**
- One command starts everything
- Hot reload works via volume mounts
- All environment variables configured
- Easy to view logs: `docker-compose logs -f`

**Option B: Start Only Infrastructure**

If you prefer to run backend/frontend directly on your machine:

```bash
make local-infra-only
```

Or manually:

```bash
docker-compose up -d postgres localstack
```

**Verify services are running:**

```bash
# Check PostgreSQL
docker exec postgres pg_isready -U eventpro

# Check LocalStack
curl http://localhost:4566/_localstack/health
```

### Step 2: Provision LocalStack Resources

Provision AWS resources (SQS queues, S3 buckets, Cognito, Secrets Manager) in LocalStack:

```bash
make local-infra
```

Or manually:

```bash
cd infrastructure/environments/local
terraform init
terraform apply
```

**Get resource outputs:**

```bash
cd infrastructure/environments/local
terraform output
```

**Important outputs:**
- `cognito_user_pool_id` - Use in frontend `.env.local`
- `cognito_user_pool_client_id` - Use in frontend `.env.local`
- `sqs_order_queue_url` - Used by backend
- `s3_images_bucket_name` - Used by backend and frontend

### Step 3: Configure Backend

The backend uses `application-local.yml` when `SPRING_PROFILES_ACTIVE=local` is set.

**If using Docker Compose (Option A):**
- Backend runs automatically in `backend` container
- Environment variables are pre-configured
- Code changes trigger hot reload via volume mounts
- View logs: `docker-compose logs -f backend`

**If running directly (Option B):**

**Set environment variables:**

```bash
export SPRING_PROFILES_ACTIVE=local
export DB_URL=jdbc:postgresql://localhost:5432/eventpro
export DB_USERNAME=eventpro
export DB_PASSWORD=eventpro
export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
```

**Get Cognito values from Terraform outputs:**

```bash
cd infrastructure/environments/local
export COGNITO_USER_POOL_ID=$(terraform output -raw cognito_user_pool_id)
export COGNITO_CLIENT_ID=$(terraform output -raw cognito_user_pool_client_id)
export S3_BUCKET_NAME=$(terraform output -raw s3_images_bucket_name)
cd ../../..
```

**Start the backend:**

```bash
cd backend
./gradlew :eventpro-api:bootRun
```

**Verify backend is running:**

```bash
curl http://localhost:8080/actuator/health
```

Expected response:
```json
{"status":"UP"}
```

### Step 4: Configure Frontend

**If using Docker Compose (Option A):**
- Frontend runs automatically in `frontend-dev` container
- Environment variables are read from `.env` file (created by `make local-infra`)
- Hot Module Replacement (HMR) works via volume mounts
- View logs: `docker-compose logs -f frontend-dev`
- Access at: `http://localhost:5173`

**If running directly (Option B):**

**Create `.env.local` file** (Vite automatically reads this):

```bash
cd frontend

# Get Cognito values from Terraform
cd ../infrastructure/environments/local
COGNITO_USER_POOL_ID=$(terraform output -raw cognito_user_pool_id)
COGNITO_CLIENT_ID=$(terraform output -raw cognito_user_pool_client_id)
cd ../../..

# Create .env.local file
cat > frontend/.env.local << EOF
VITE_API_BASE_URL=http://localhost:8080
VITE_COGNITO_USER_POOL_ID=$COGNITO_USER_POOL_ID
VITE_COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID
VITE_AWS_REGION=us-east-1
VITE_S3_BUCKET_NAME=eventpro-images-local
EOF

# Start the frontend
cd frontend
npm install
npm run dev
```

Frontend will be available at `http://localhost:5173`

**Note**: Vite reads environment variables from:
1. `.env.local` file (highest priority, gitignored)
2. Process environment variables (when running in Docker)
3. `.env` file (lower priority)

**Benefits of running frontend directly:**
- Better debugging with browser DevTools
- Direct access to Vite dev server logs

### Step 5: Verify Setup

**1. Database Migrations**

Check that Flyway migrations ran successfully:

```bash
# Connect to PostgreSQL
docker exec -it postgres psql -U eventpro -d eventpro

# List tables
\dt

# Should see: category, "user", address, event, ticket, cart, "order", order_item, payment, notification, user_notification, notification_preference

# Check categories were seeded
SELECT * FROM category;

# Exit
\q
```

**2. LocalStack Resources**

**SQS Queues:**
```bash
aws --endpoint-url=http://localhost:4566 sqs list-queues
```

**S3 Buckets:**
```bash
aws --endpoint-url=http://localhost:4566 s3 ls
```

**Cognito User Pool:**
```bash
aws --endpoint-url=http://localhost:4566 cognito-idp list-user-pools --max-results 10
```

**Secrets Manager:**
```bash
aws --endpoint-url=http://localhost:4566 secretsmanager list-secrets
```

**3. API Health Check**

```bash
curl http://localhost:8080/actuator/health
```

**4. Frontend**

Open `http://localhost:5173` in your browser. You should see the EventPro frontend.

## Development Workflow

### Option 1: Docker Compose (Simplified)

**Start everything with one command:**

```bash
# 1. Provision LocalStack resources (creates/updates .env file)
make local-infra

# 2. Start all services (reads .env file automatically)
make local-up

# Or manually:
docker-compose up
```

**The `.env` file** (created by `make local-infra`):
```bash
COGNITO_USER_POOL_ID=<value-from-terraform>
COGNITO_CLIENT_ID=<value-from-terraform>
```

**View logs:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend-dev
```

**Hot reload works automatically** via volume mounts - code changes reflect immediately.

**Update Cognito values:**
If you re-run `make local-infra`, the `.env` file is automatically updated. Restart services:
```bash
docker-compose restart frontend-dev backend
```

### Option 2: Run Services Separately

**Backend runs directly on your machine** (for IDE debugging):

```bash
# Set environment variables
export SPRING_PROFILES_ACTIVE=local
export DB_URL=jdbc:postgresql://localhost:5432/eventpro
export DB_USERNAME=eventpro
export DB_PASSWORD=eventpro
export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test

# Get Cognito values from Terraform
cd infrastructure/environments/local
export COGNITO_USER_POOL_ID=$(terraform output -raw cognito_user_pool_id)
export COGNITO_CLIENT_ID=$(terraform output -raw cognito_user_pool_client_id)
export S3_BUCKET_NAME=$(terraform output -raw s3_images_bucket_name)
cd ../../..

# Run backend
cd backend
./gradlew :eventpro-api:bootRun
```

**Frontend runs directly on your machine:**

```bash
cd frontend

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

**Note**: Choose the approach that works best for you. Docker Compose is simpler, but running directly gives better IDE integration.

### Testing LocalStack Resources

**Send test message to SQS:**

```bash
aws --endpoint-url=http://localhost:4566 sqs send-message \
  --queue-url http://localhost:4566/000000000000/order-queue \
  --message-body '{"orderId": "test-123", "userId": "test-user"}'
```

**Upload test image to S3:**

```bash
aws --endpoint-url=http://localhost:4566 s3 cp test.jpg \
  s3://eventpro-images-local/test.jpg
```

**Create test user in Cognito:**

```bash
# Get user pool ID
POOL_ID=$(cd infrastructure/environments/local && terraform output -raw cognito_user_pool_id)

# Create user
aws --endpoint-url=http://localhost:4566 cognito-idp admin-create-user \
  --user-pool-id $POOL_ID \
  --username testuser \
  --user-attributes Name=email,Value=test@example.com \
  --temporary-password TempPass123!
```

## Troubleshooting

### PostgreSQL Connection Issues

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check PostgreSQL logs
docker logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### LocalStack Connection Issues

```bash
# Check if LocalStack is running
docker ps | grep localstack

# Check LocalStack logs
docker logs localstack

# Restart LocalStack
docker-compose restart localstack

# Re-provision resources
make local-infra
```

### Database Migration Issues

```bash
# Check Flyway migration status
# Connect to database
docker exec -it postgres psql -U eventpro -d eventpro

# Check flyway_schema_history table
SELECT * FROM flyway_schema_history;

# If migrations failed, check application logs
```

### Frontend Not Connecting to Backend

1. Verify backend is running: `curl http://localhost:8080/actuator/health`
2. Check `.env.local` has correct `VITE_API_BASE_URL`
3. Check browser console for CORS errors
4. Verify backend CORS configuration allows `http://localhost:5173`

### Cognito Authentication Issues

1. Verify Cognito User Pool and Client ID in `.env.local`
2. Check Terraform outputs: `cd infrastructure/environments/local && terraform output`
3. Verify LocalStack Cognito is accessible: `aws --endpoint-url=http://localhost:4566 cognito-idp list-user-pools`

## Cleanup

**Stop all services:**

```bash
make local-down
```

**Clean up everything (including volumes):**

```bash
make local-clean
```

**Manual cleanup:**

```bash
# Destroy Terraform resources
cd infrastructure/environments/local
terraform destroy

# Stop and remove containers
docker-compose down -v
```

## Next Steps

After local setup is complete:

1. **Create test users** in Cognito (via Terraform or AWS CLI)
2. **Test API endpoints** using Postman or curl
3. **Test frontend** authentication flow
4. **Test SQS message processing** (when implemented)
5. **Test S3 image uploads** (when implemented)

## Additional Resources

- [Infrastructure Local Environment README](./infrastructure/environments/local/README.md)
- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)
- [LocalStack Documentation](https://docs.localstack.cloud/)

</details>

## Architecture Benefits

- ✅ **Single Build System** - No Spring Boot + Quarkus conflicts
- ✅ **Simplified Deployment** - One Docker image, one ECS service
- ✅ **Easier Development** - Single application to run locally
- ✅ **Lower Costs** - ~$81/month vs ~$170/month (52% reduction)
- ✅ **Future-Proof** - Can extract modules to microservices when needed

---

<details>
<summary><strong>📋 Project Structure & Architecture</strong></summary>

### Current Architecture: Modular Monolith

- **Backend**: Single Spring Boot 3.5.7 application with 6 modules
- **Frontend**: React 19 + TypeScript + Vite
- **Infrastructure**: AWS (ECS Fargate, RDS, S3, CloudFront, Cognito)
- **Database**: PostgreSQL (RDS Multi-AZ)
- **Payment**: Stripe integration
- **Notifications**: AWS SES (Email), SNS (SMS), WebSocket

### Module Structure

```text
backend/
├── modules/
│   ├── eventpro-core/         # Users, Auth, Common utilities
│   ├── eventpro-event/       # Events, Tickets, Search
│   ├── eventpro-order/       # Cart, Orders, Checkout
│   ├── eventpro-payment/      # Payment Processing (Stripe)
│   ├── eventpro-notification/ # Email, SMS, WebSocket
│   └── eventpro-api/         # Main Application Module
├── build.gradle
├── settings.gradle
└── Dockerfile
```

### Technology Stack

**Backend:**

- Spring Boot 3.5.7, Java 21, Gradle 8.5
- PostgreSQL (via Spring Data JPA)
- Spring Security + AWS Cognito
- AWS SDK 2.21.29

**Frontend:**

- React 19.2.0, TypeScript 5.9.3, Vite 7.2.2
- Redux Toolkit 2.10.1, React Router 7.9.6
- shadcn/ui (Radix UI + Tailwind CSS)

**Infrastructure:**

- Terraform 1.5+, AWS Provider 6.21.0+

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

</details>

<details>
<summary><strong>🔄 Migration Status</strong></summary>

**Completed**

1. Project structure created
2. Build system configured (Gradle)
3. Module boundaries defined
4. Main application class created
5. Configuration files created
6. Shared utilities migrated to `eventpro-core`
7. Old microservices removed
8. Old Lambda functions removed (except analytics-service)

### In Progress

1. **eventpro-core**: User management, authentication
2. **eventpro-event**: Event CRUD, tickets
3. **eventpro-order**: Cart, orders, checkout
4. **eventpro-payment**: Stripe integration
5. **eventpro-notification**: Notifications

**Pending**

1. Code migration from old services (if available)
2. API endpoint implementation
3. Database entity creation
4. Service layer implementation
5. Controller layer implementation
6. Integration tests
7. Terraform updates for monolith
8. CI/CD pipeline updates
9. Frontend API integration

### Migration Strategy

**Recommended Approach (Incremental):**

1. Start with `eventpro-core` (users, auth)
2. Then `eventpro-event` (events, tickets)
3. Then `eventpro-order` (cart, orders)
4. Then `eventpro-payment` (payments)
5. Finally `eventpro-notification` (notifications)

### Key Differences from Microservices

1. **No SQS Queues** (initially)
   - Order processing: Synchronous within transaction
   - Payment processing: Synchronous within transaction
   - Notifications: Spring Events (async within application)

2. **Single Database**
   - All entities in one PostgreSQL database
   - Module boundaries via package structure

3. **Single Deployment**
   - One Docker image
   - One ECS service
   - Simpler CI/CD

4. **Module Communication**
   - Direct method calls (same JVM)
   - Spring dependency injection
   - Spring Events for async

</details>

<details>
<summary><strong>Implementation Status</strong></summary>

### Project Structure: Completed

**Project Structure:**

- ✅ Created modular monolith structure with 6 modules
- ✅ Configured Gradle build system
- ✅ Set up module dependencies
- ✅ Created main application class
- ✅ Created Dockerfile
- ✅ Created application.yml configuration
- ✅ Build system verified

**Code Migration:**

- ✅ Migrated `BaseEntity` to `eventpro-core`
- ✅ Migrated `BusinessException` to `eventpro-core`
- ✅ Migrated `SQSMessagePublisher` to `eventpro-core`

### Core Module: In Progress

**Core Module (`eventpro-core`):**

- ⏳ User entity and repository
- ⏳ User service
- ⏳ Authentication/Cognito integration
- ⏳ Security configuration
- ⏳ REST controllers

### Current Structure

```text
backend/
├── build.gradle              ✅ Root build config
├── settings.gradle            ✅ Project settings
├── Dockerfile                 ✅ Docker build
├── README.md                  ✅ Documentation
│
└── modules/
    ├── eventpro-core/         ✅ Structure created
    │   ├── common/            ✅ BaseEntity, BusinessException
    │   └── messaging/         ✅ SQSMessagePublisher
    │
    ├── eventpro-event/        ✅ Structure created
    ├── eventpro-order/        ✅ Structure created
    ├── eventpro-payment/      ✅ Structure created
    ├── eventpro-notification/ ✅ Structure created
    │
    └── eventpro-api/          ✅ Structure created
        ├── EventProApplication.java ✅ Created
        └── application.yml    ✅ Created
```

</details>

---

## Additional Documentation

- `backend/README.md` - Backend application documentation
- `frontend/README.md` - Frontend application documentation
- `z_docs/modular-monolith-architecture.md` - Detailed architecture design
