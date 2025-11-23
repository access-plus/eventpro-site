# Quickstart Guide: EventPro Platform

**Date**: 2025-01-15  
**Phase**: 1 - Design & Contracts

## Overview

This guide provides step-by-step instructions to get the EventPro platform running locally for development and testing.

## Prerequisites

Before starting, ensure you have installed:

- **Java 21** - [Download](https://adoptium.net/)
- **Gradle 8.5+** - [Download](https://gradle.org/install/) (or use Gradle wrapper)
- **Node.js 18+** and **npm** - [Download](https://nodejs.org/)
- **Docker** and **Docker Compose** - [Download](https://www.docker.com/get-started)
- **AWS CLI** - [Download](https://aws.amazon.com/cli/) (configured with credentials)
- **Terraform 1.5+** - [Download](https://www.terraform.io/downloads)

## Step 1: Clone and Setup Repository

```bash
# Clone repository (if not already cloned)
git clone <repository-url>
cd eventpro-site

# Ensure you're on the correct branch
git checkout 001-eventpro-platform
```

## Step 2: Start Local Infrastructure

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
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U eventpro"]
      interval: 10s
      timeout: 5s
      retries: 5

  localstack:
    image: localstack/localstack:latest
    environment:
      - SERVICES=sqs,secretsmanager,s3
      - DEBUG=1
      - DATA_DIR=/tmp/localstack/data
    ports:
      - "4566:4566"
    volumes:
      - localstack_data:/var/lib/localstack

volumes:
  postgres_data:
  localstack_data:
```

Start infrastructure:

```bash
docker-compose up -d

# Verify services are running
docker-compose ps
```

## Step 3: Setup Backend Services

### 3.1 Build Shared Modules

```bash
cd services

# Build all shared modules first
./gradlew :shared:common:build
./gradlew :shared:messaging:build
./gradlew :shared:database:build
```

### 3.2 Configure Core API

Create `services/core-api/src/main/resources/application-dev.yml`:

```yaml
spring:
  application:
    name: core-api
  datasource:
    url: jdbc:postgresql://localhost:5432/eventpro
    username: eventpro
    password: eventpro
    hikari:
      maximum-pool-size: 10
      minimum-idle: 2
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true

aws:
  cognito:
    userPoolId: ${COGNITO_USER_POOL_ID:local-pool-id}
    clientId: ${COGNITO_CLIENT_ID:local-client-id}
    region: ${AWS_REGION:us-east-1}
  sqs:
    orderQueueUrl: ${ORDER_QUEUE_URL:http://localhost:4566/000000000000/order-queue}
    paymentQueueUrl: ${PAYMENT_QUEUE_URL:http://localhost:4566/000000000000/payment-queue}
    notificationQueueUrl: ${NOTIFICATION_QUEUE_URL:http://localhost:4566/000000000000/notification-queue}
  s3:
    endpoint: http://localhost:4566
    region: us-east-1
    imagesBucket: eventpro-images-dev
  secrets:
    manager:
      endpoint: http://localhost:4566
      databaseSecret: eventpro-db-secret

server:
  port: 8080

logging:
  level:
    com.accessplus.eventpro: DEBUG
    org.springframework: INFO
```

### 3.3 Run Core API

```bash
cd services/core-api
./gradlew bootRun
```

Verify API is running:
```bash
curl http://localhost:8080/actuator/health
```

Expected response:
```json
{"status":"UP"}
```

## Step 4: Setup Frontend

### 4.1 Install Dependencies

```bash
cd web
npm install
```

### 4.2 Configure Environment

Create `web/.env.local`:

```env
VITE_API_URL=http://localhost:8080
VITE_COGNITO_USER_POOL_ID=local-pool-id
VITE_COGNITO_CLIENT_ID=local-client-id
VITE_AWS_REGION=us-east-1
```

### 4.3 Initialize shadcn/ui

```bash
cd web
npx shadcn@latest init
# Follow prompts, use default settings
```

### 4.4 Run Frontend

```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`

## Step 5: Setup LocalStack SQS Queues

```bash
# Create SQS queues in LocalStack
aws --endpoint-url=http://localhost:4566 sqs create-queue \
  --queue-name order-queue

aws --endpoint-url=http://localhost:4566 sqs create-queue \
  --queue-name payment-queue

aws --endpoint-url=http://localhost:4566 sqs create-queue \
  --queue-name notification-queue

# Verify queues created
aws --endpoint-url=http://localhost:4566 sqs list-queues
```

## Step 6: Setup LocalStack S3 Buckets

```bash
# Create S3 buckets in LocalStack
aws --endpoint-url=http://localhost:4566 s3 mb s3://eventpro-images-dev
aws --endpoint-url=http://localhost:4566 s3 mb s3://eventpro-frontend

# Verify buckets created
aws --endpoint-url=http://localhost:4566 s3 ls
```

## Step 7: Verify Setup

### 7.1 Check Backend Health

```bash
curl http://localhost:8080/actuator/health
```

### 7.2 Check Frontend

Open browser: `http://localhost:5173`

You should see the EventPro application.

### 7.3 Check Database

```bash
# Connect to PostgreSQL
docker exec -it eventpro-site-postgres-1 psql -U eventpro -d eventpro

# List tables
\dt

# Exit
\q
```

## Step 8: Run Tests

### 8.1 Backend Tests

```bash
cd services
./gradlew test
```

### 8.2 Frontend Tests

```bash
cd web
npm test
```

## Common Issues and Solutions

### Issue: Port Already in Use

**Solution**: 
- Change port in `application-dev.yml` (backend) or `vite.config.ts` (frontend)
- Or stop the process using the port:
  ```bash
  # Find process using port 8080
  lsof -i :8080
  # Kill process
  kill -9 <PID>
  ```

### Issue: Database Connection Failed

**Solution**:
- Verify PostgreSQL is running: `docker-compose ps`
- Check connection string in `application-dev.yml`
- Verify database exists: `docker exec -it <postgres-container> psql -U eventpro -l`

### Issue: LocalStack Not Responding

**Solution**:
- Restart LocalStack: `docker-compose restart localstack`
- Check logs: `docker-compose logs localstack`
- Verify port 4566 is not in use

### Issue: shadcn/ui Components Not Found

**Solution**:
- Reinitialize: `npx shadcn@latest init`
- Check `components.json` exists in `web/` directory
- Verify Tailwind CSS is configured

## Next Steps

1. **Create Test User**: Use Cognito CLI or AWS Console to create test user
2. **Seed Database**: Run migration scripts to create categories
3. **Test API**: Use Postman or curl to test API endpoints
4. **Test Frontend**: Navigate through UI and verify functionality

## Development Workflow

1. **Make Changes**: Edit code in your IDE
2. **Backend**: Changes auto-reload via Spring Boot DevTools (if configured)
3. **Frontend**: Changes auto-reload via Vite HMR
4. **Test**: Run tests before committing
5. **Commit**: Use conventional commit messages

## Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

## Additional Resources

- **Backend API Docs**: `http://localhost:8080/swagger-ui.html` (if Swagger configured)
- **Frontend Docs**: See `web/README.md`
- **Architecture**: See `z_docs/architecture-recommendation.md`
- **User Stories**: See `z_docs/user-stories.md`

