# Local Environment Services Overview

This document explains what services are provisioned in the local Terraform environment and how they're used by the EventPro application.

## Services Provisioned in Local Terraform

### 1. **SQS Queues** (LocalStack)
All queues are provisioned in LocalStack and used for asynchronous message processing:

#### Primary Queues:
- **`order-queue`** - Receives order messages from the backend API
- **`payment-queue`** - Receives payment messages from order-processor Lambda
- **`notification-queue`** - Receives notification messages from payment-processor Lambda

#### Dead Letter Queues (DLQs):
- **`order-queue-dlq`** - Failed order messages after 3 retries
- **`payment-queue-dlq`** - Failed payment messages after 3 retries
- **`notification-queue-dlq`** - Failed notification messages after 3 retries

**Configuration:**
- Message retention: 4 days (primary), 14 days (DLQ)
- Visibility timeout: 30 seconds
- Long polling: 20 seconds
- Max receive count: 3 (before moving to DLQ)

**Used By:**
- Backend API (Spring Boot) publishes to `order-queue`
- Order-processor Lambda consumes from `order-queue`, publishes to `payment-queue`
- Payment-processor Lambda consumes from `payment-queue`, publishes to `notification-queue`
- Notification-sender Lambda consumes from `notification-queue`

---

### 2. **S3 Bucket** (LocalStack)
- **`eventpro-images-local`** - Stores event images and user profile pictures

**Configuration:**
- Public read access (for local development)
- CORS enabled for `http://localhost:5173` and `http://localhost:3000`
- Force destroy enabled (for easy cleanup)

**Used By:**
- Backend API uploads event images and profile pictures
- Frontend displays images via S3 URLs

---

### 3. **Secrets Manager** (LocalStack)
Three secrets are provisioned for local development:

#### Database Secret (`eventpro-db-secret`)
```json
{
  "host": "localhost",
  "port": "5432",
  "dbname": "eventpro",
  "username": "eventpro",
  "password": "eventpro"
}
```

#### JWT Secret (`eventpro-jwt-secret`)
- Plain text secret: `Dh7fjbnd2O2iSkqpYL/lz2nM3LE/8fC36iFNPHERysc=`

#### Stripe Keys (`eventpro-stripe-keys`)
```json
{
  "secret_key": "sk_test_local",
  "publishable_key": "pk_test_local",
  "webhook_secret": "whsec_test_local"
}
```

**Used By:**
- Backend API (optional - can use environment variables instead)
- Payment-processor Lambda (reads Stripe secret for payment processing)

---

### 4. **Cognito User Pool** (Real AWS)
**Note:** Cognito is provisioned in **real AWS**, not LocalStack, because LocalStack Community Edition doesn't fully support Cognito.

**Resources:**
- User Pool: `eventpro-local-user-pool`
- User Pool Client: `eventpro-local-client`
- User Groups: `ADMIN`, `ORGANIZER`, `USER`

**Used By:**
- Frontend for user authentication (sign up, sign in, password reset)
- Backend API for JWT token validation and user authorization

---

## Application Flow

### Complete Order Processing Flow

```
1. User places order (Frontend)
   ↓
2. Backend API (Spring Boot - Docker)
   - Creates OrderEntity (status: PENDING)
   - Publishes OrderMessage to order-queue (SQS)
   ↓
3. Order-Processor Lambda (Quarkus - managed by LocalStack)
   - Automatically triggered by SQS event source mapping when message arrives in order-queue
   - Consumes from order-queue
   - Validates order
   - Reserves tickets (updates TicketEntity status to RESERVED)
   - Updates order status to PROCESSING
   - Publishes PaymentMessage to payment-queue
   ↓
4. Payment-Processor Lambda (Quarkus - managed by LocalStack)
   - Automatically triggered by SQS event source mapping when message arrives in payment-queue
   - Consumes from payment-queue
   - Processes payment via Stripe (using secret from Secrets Manager)
   - On success:
     * Updates order status to PAID
     * Assigns tickets to user (updates TicketEntity purchaser and status to SOLD)
     * Publishes NotificationMessage to notification-queue
   - On failure:
     * Updates order status to CANCELLED
     * Releases reserved tickets (status back to AVAILABLE)
     * Publishes failure notification
   ↓
5. Notification-Sender Lambda (Quarkus - managed by LocalStack)
   - Automatically triggered by SQS event source mapping when message arrives in notification-queue
   - Consumes from notification-queue
   - Sends email via SES (or LocalStack SES)
   - Sends SMS via SNS (or LocalStack SNS)
   - Stores in-app notification (database)
```

---

## Service Locations

### LocalStack (Port 4566)
- **SQS** - All queues (order, payment, notification + DLQs)
- **S3** - Image storage bucket
- **Secrets Manager** - Database, JWT, Stripe secrets
- **SES** - Email sending (for notification-sender Lambda)
- **SNS** - SMS sending (for notification-sender Lambda)

### Real AWS
- **Cognito** - User authentication (requires AWS credentials)

### Docker Containers
- **PostgreSQL** - Database (port 5432)
- **Backend API** - Spring Boot application (port 8080)
- **Frontend** - React development server (port 5173)
- **LocalStack** - AWS services emulator (port 4566)

### LocalStack Managed (Lambda Functions)
- **Lambda Functions** - Managed by LocalStack via Terraform
  - Order-processor Lambda (automatically triggered by order-queue)
  - Payment-processor Lambda (automatically triggered by payment-queue)
  - Notification-sender Lambda (automatically triggered by notification-queue)

---

## How Services Connect

### Backend API Configuration
The backend API connects to:
1. **PostgreSQL** - Direct connection (`jdbc:postgresql://postgres:5432/eventpro`)
2. **LocalStack SQS** - Via `AWS_ENDPOINT_URL=http://localstack:4566`
3. **LocalStack S3** - Via `AWS_ENDPOINT_URL=http://localstack:4566`
4. **LocalStack Secrets Manager** - Via `AWS_ENDPOINT_URL=http://localstack:4566`
5. **Real AWS Cognito** - Via AWS SDK (uses real AWS credentials)

### Lambda Functions Configuration
Lambda functions (managed by LocalStack) connect to:
1. **PostgreSQL** - Direct connection via Docker network (`postgres:5432`)
2. **LocalStack SQS** - Via `AWS_ENDPOINT_URL=http://localstack:4566`
3. **LocalStack Secrets Manager** - Via `AWS_ENDPOINT_URL=http://localstack:4566`
4. **Stripe API** - Real Stripe API (uses test keys in local)
5. **Event Source Mappings** - Automatically trigger Lambdas when messages arrive in queues

---

## Environment Variables

### Backend API (.env file)
```bash
# Database
DB_URL=jdbc:postgresql://postgres:5432/eventpro
DB_USERNAME=eventpro
DB_PASSWORD=eventpro

# AWS/LocalStack
AWS_ENDPOINT_URL=http://localstack:4566
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test

# Cognito (Real AWS)
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=your-client-id

# SQS Queues (from Terraform outputs)
ORDER_QUEUE_URL=http://localhost:4566/000000000000/order-queue
PAYMENT_QUEUE_URL=http://localhost:4566/000000000000/payment-queue
NOTIFICATION_QUEUE_URL=http://localhost:4566/000000000000/notification-queue

# S3
S3_BUCKET_NAME=eventpro-images-local
```

### Lambda Functions (when running locally)
```bash
# Database
DB_URL=jdbc:postgresql://localhost:5432/eventpro
DB_USERNAME=eventpro
DB_PASSWORD=eventpro

# AWS/LocalStack
AWS_ENDPOINT_URL=http://localhost:4566
AWS_REGION=us-east-1

# SQS
SQS_PAYMENT_QUEUE_URL=http://localhost:4566/000000000000/payment-queue
SQS_NOTIFICATION_QUEUE_URL=http://localhost:4566/000000000000/notification-queue

# Stripe (from Secrets Manager ARN or direct)
STRIPE_SECRET_KEY_ARN=arn:aws:secretsmanager:us-east-1:000000000000:secret:eventpro-stripe-keys
```

---

## Key Points

1. **LocalStack is for AWS service emulation** - SQS, S3, Secrets Manager, SES, SNS, Lambda
2. **Cognito must be real AWS** - LocalStack Community doesn't fully support it
3. **Lambdas are managed by LocalStack** - Registered via Terraform, automatically triggered by SQS event source mappings
4. **PostgreSQL is separate** - Docker container, not in LocalStack
5. **DLQs handle failures** - Messages that fail 3 times go to DLQ for manual inspection
6. **All services use same database** - Single PostgreSQL instance for all components
7. **Event Source Mappings** - Automatically trigger Lambda functions when messages arrive in SQS queues

---

## Testing the Flow Locally

1. **Start infrastructure:**
   ```bash
   make local-infra-only  # Starts PostgreSQL + LocalStack
   make local-infra        # Provisions Terraform resources
   ```

2. **Start application:**
   ```bash
   make local-up           # Starts Backend + Frontend
   ```

3. **Verify Lambda functions are registered:**
   ```bash
   make local-lambda-status
   # Should show 3 functions registered in LocalStack
   ```

4. **Verify event source mappings:**
   ```bash
   make local-event-mappings
   # Should show 3 mappings connecting queues to Lambda functions
   ```

5. **Test the flow:**
   - Create order via Frontend
   - Watch backend logs for SQS publish
   - Watch Lambda logs: `make local-lambda-logs FUNCTION=local-order-processor`
   - Verify messages are automatically processed
   - Check DLQs if messages fail: `aws --endpoint-url=http://localhost:4566 sqs get-queue-attributes --queue-url <dlq-url> --attribute-names ApproximateNumberOfMessages`

---

## Summary

The local Terraform environment provisions:
- ✅ **6 SQS Queues** (3 primary + 3 DLQs) in LocalStack
- ✅ **1 S3 Bucket** in LocalStack
- ✅ **3 Secrets** in LocalStack (database, JWT, Stripe)
- ✅ **3 Lambda Functions** in LocalStack (order-processor, payment-processor, notification-sender)
- ✅ **3 Event Source Mappings** connecting SQS queues to Lambda functions
- ✅ **1 Cognito User Pool** in real AWS (with groups)

These services support the complete async order processing flow:
**Order → Order-Processor → Payment-Processor → Notification-Sender**

All services connect to the same PostgreSQL database and use LocalStack for AWS service emulation (except Cognito which uses real AWS). Lambda functions are automatically triggered by SQS event source mappings, providing production-like behavior for local development.

