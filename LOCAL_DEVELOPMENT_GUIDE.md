# Local Development Guide

Complete guide for setting up and running the EventPro application locally using Make commands.

<details>
<summary><strong>localhost</strong></summary>

## 📖 Quick Reference

| Task | Command |
|------|---------|
| **First-time setup** | `make local-infra` → Add JWT keys to `.env` → (optional) add Stripe keys to `.env` → `make local-up` |
| **Start services** | `make local-up` |
| **Stop services** | `make local-down` |
| **Clean everything** | `make local-clean` |
| **View backend logs** | `make backend-logs` |
| **View frontend logs** | `make frontend-logs` |
| **Check Lambda status** | `make local-lambda-status` |
| **View Lambda logs** | `make local-lambda-logs FUNCTION=local-order-processor` |
| **Restart services** | `make local-restart` |
| **Access services** | Frontend: <http://localhost:5173>, Backend: <http://localhost:8080>, Swagger: <http://localhost:8080/swagger-ui/index.html> |

---

## Current App State (Important)

- This guide is current for **local development** using `docker-compose`, LocalStack, and `make local-infra` / `make local-up`.
- The AWS deployment layout is now **component Terraform** (`backend/services/terraform`, `eventpro-frontend/terraform`, `backend/lambdas/*/terraform`); the older `infrastructure/` Terraform tree still exists for legacy workflows and reference.
- Async lambdas are **Spring Boot container images** (not Quarkus).
- The checkout UI is present, but end-to-end frontend payment submission wiring is still in progress; for async pipeline validation, use Swagger/API calls and the queue/Lambda verification steps in this guide.

---

## 🚀 Quick Start (3 Simple Steps)

### First Time Setup

```bash
# Step 1: Provision infrastructure, build Lambdas, and create environment files
# This will automatically:
#   - Build Lambda Docker images (no AWS credentials needed for local dev)
#   - Start PostgreSQL and LocalStack (if not running)
#   - Deploy Lambda functions to LocalStack with event source mappings
#   - Generate .env files
make local-infra
```

<details>
<summary>jwt keys</summary>

Option 1

```bash
make jwt-keys
```

Option 2

<details>
<summary>manual</summary>

```bash
openssl genpkey -algorithm RSA -out jwt-private.pem -pkeyopt rsa_keygen_bits:2048
openssl rsa -in jwt-private.pem -pubout -out jwt-public.pem
JWT_PRIVATE_KEY=$(openssl pkcs8 -topk8 -inform PEM -outform DER -in jwt-private.pem -nocrypt | base64 | tr -d '\n')
JWT_PUBLIC_KEY=$(openssl rsa -in jwt-private.pem -pubout -outform DER | base64 | tr -d '\n')
echo "JWT_PRIVATE_KEY=$JWT_PRIVATE_KEY" >> .env
echo "JWT_PUBLIC_KEY=$JWT_PUBLIC_KEY" >> .env
echo "JWT_ISSUER=eventpro" >> .env
```
</details>

</details>

```bash
# Step 3: Start application services (backend + frontend)
# Lambda functions are already running via LocalStack
make local-up
```

**Important Notes:**

- **You don't need to build Lambda images separately** - `make local-infra` automatically builds them for local development
- **No AWS credentials needed for Lambda builds** - The build script detects local development mode and uses local image tags (e.g., `eventpro-order-processor:latest`) instead of ECR tags
- **Don't set `AWS_ACCOUNT_ID`** unless you're actually deploying to AWS - see Prerequisites section for details
- **JWT keys are required** for backend auth - add them to `.env` after `make local-infra` (see Step 2)
- **Stripe (optional):** add `STRIPE_*` keys and subscription price IDs to root `.env` (see [Environment Files](#environment-files)); for checkout in the browser, set `VITE_STRIPE_PUBLISHABLE_KEY` in `eventpro-frontend/.env.local` (or rely on root `.env` if `make local-infra` copies it there)

**That's it!** Your application is now running:

- **Frontend**: <http://localhost:5173>
- **Backend API**: <http://localhost:8080>
- **Backend Health**: <http://localhost:8080/actuator/health>
- **Swagger UI**: <http://localhost:8080/swagger-ui/index.html>
- **LocalStack**: <http://localhost:4566>

**Quick Verification:**

```bash
# Check all services are running
docker-compose ps

# Test backend health
curl http://localhost:8080/actuator/health
# Should return: {"status":"UP"}

# Verify Lambda functions
make local-lambda-status
# Should show 3 functions: local-order-processor, local-payment-processor, local-notification-sender
```

### Subsequent Starts

After the first setup, you only need:

```bash
make local-up
```

**Note:**

- If you've made changes to **Lambda functions**, rebuild and redeploy:

  ```bash
  make local-infra   # This automatically rebuilds Lambda images and redeploys to LocalStack
  ```

  You can also rebuild Lambda images separately if needed:

  ```bash
  make lambda-build  # Rebuild Lambda images (optional - local-infra does this automatically)
  ```

- If you've made changes to **infrastructure** (Terraform), redeploy:

  ```bash
  make local-infra   # This will apply Terraform changes
  ```

- If you've made changes to **backend or frontend code**, just restart:

  ```bash
  make local-up      # Restart services (hot reload will pick up changes)
  ```

---

## 📋 Prerequisites

Before starting, ensure you have:

1. ✅ **Docker & Docker Compose** installed and running
2. ✅ **Terraform 1.12+** installed
3. ✅ **Make** installed (usually pre-installed on macOS/Linux)
4. ✅ **AWS CLI** (optional, for testing LocalStack resources)
5. ✅ **OpenSSL** (or equivalent) for generating JWT RSA keys

### ⚠️ Important: AWS Account ID for Local Development

**For local development, you do NOT need to set `AWS_ACCOUNT_ID`.**

The build script automatically detects local development mode and uses simple local Docker image tags (e.g., `eventpro-order-processor:latest`) instead of ECR tags. This means:

- ✅ **You can run `make local-infra` without any AWS credentials** - Lambda images will build with local tags
- ✅ **No ECR repository needed** - Images are built locally and used by LocalStack
- ⚠️ **If you have `AWS_ACCOUNT_ID` set in your environment**, the build script will try to use ECR tags. For local development, you can either:
  - **Option 1 (Recommended):** Unset it: `unset AWS_ACCOUNT_ID`
  - **Option 2:** Leave it set - the build will still work, but images will have ECR-style tags (they just won't be pushed to ECR)

**Only set `AWS_ACCOUNT_ID` if you're building images to push to AWS ECR for deployment.**

---

## 🔧 Detailed Setup Steps

### Step 1: Provision Infrastructure

```bash
make local-infra
```

**What this does:**

1. **Builds Lambda Docker images** automatically (no AWS credentials needed)
   - Uses local image tags (e.g., `eventpro-order-processor:latest`) for development
   - If AWS credentials are configured, can optionally push to ECR
2. **Tags images** for LocalStack (`eventpro-{name}:local`)
3. **Starts infrastructure** (PostgreSQL + LocalStack) if not already running
4. **Provisions Terraform resources** in LocalStack:
   - S3 bucket
   - SQS queues (order, payment, notification + DLQs)
   - Secrets Manager secrets (for Lambda functions only - backend API uses environment variables)
   - **Lambda Functions** (order-processor, payment-processor, notification-sender)
   - **Event Source Mappings** (automatically trigger Lambdas from SQS queues)
   - IAM roles and policies
5. **Creates environment files**:
   - `.env` (backend configuration)
   - `eventpro-frontend/.env.local` (frontend configuration)
   - Does **not** add Stripe keys—set optional `STRIPE_*` variables in root `.env` if you use payment or subscription features

**Wait time:** ~2-5 minutes (first time, includes Lambda image builds)

**Verify it worked:**

```bash
# Check .env file was created
cat .env

# Should contain (after Step 2):
# - ORDER_QUEUE_URL
# - PAYMENT_QUEUE_URL
# - NOTIFICATION_QUEUE_URL
# - S3_BUCKET_NAME
# - JWT_ISSUER (optional, defaults to eventpro)
# - JWT_ACCESS_TTL_SECONDS (optional, defaults to 3600)
# - JWT_PUBLIC_KEY (required)
# - JWT_PRIVATE_KEY (required)

# Note: Database credentials are set in docker-compose.yml, not in .env
# The local profile uses environment variables directly, not Secrets Manager

# Verify Lambda functions are registered
make local-lambda-status
# Should show: local-order-processor, local-payment-processor, local-notification-sender

# Verify event source mappings are created
make local-event-mappings
# Should show 3 mappings (one for each queue)
```

---

### Step 2: Configure JWT Keys

JWT authentication uses RS256 (RSA) keys. Generate a key pair and store the values in the root `.env` file.

**Generate RSA keys (one-time):**

```bash
# Generate private key (2048-bit RSA)
openssl genpkey -algorithm RSA -out jwt-private.pem -pkeyopt rsa_keygen_bits:2048

# Extract public key from private key
openssl rsa -in jwt-private.pem -pubout -out jwt-public.pem

# Verify keys were created
ls -la jwt-private.pem jwt-public.pem
# Should show both files
```

**Security Note:** Keep these key files secure. Do not commit them to version control. You can delete the `.pem` files after adding the keys to `.env` (the base64 values are what you need).

**Convert to single-line base64 (DER format, recommended for .env):**

```bash
# macOS
JWT_PRIVATE_KEY=$(openssl pkcs8 -topk8 -inform PEM -outform DER -in jwt-private.pem -nocrypt | base64 | tr -d '\n')
JWT_PUBLIC_KEY=$(openssl rsa -in jwt-private.pem -pubout -outform DER | base64 | tr -d '\n')

# Linux
JWT_PRIVATE_KEY=$(openssl pkcs8 -topk8 -inform PEM -outform DER -in jwt-private.pem -nocrypt | base64 -w0)
JWT_PUBLIC_KEY=$(openssl rsa -in jwt-private.pem -pubout -outform DER | base64 -w0)
```

**Display the keys (to copy to `.env`):**

```bash
# Both macOS and Linux use the same command
echo "JWT_PRIVATE_KEY=$JWT_PRIVATE_KEY"
echo "JWT_PUBLIC_KEY=$JWT_PUBLIC_KEY"
```

**Copy the output** - you'll need to paste these values into your `.env` file.

**Add to `.env` file:**

Open the `.env` file and add the following lines (replace the values with the output from the commands above):

```bash
# Edit .env file (in project root)
nano .env
# or
vim .env
# or use your preferred editor

# Add these lines:
JWT_ISSUER=eventpro
JWT_ACCESS_TTL_SECONDS=3600
JWT_PRIVATE_KEY=<paste the JWT_PRIVATE_KEY value from command above>
JWT_PUBLIC_KEY=<paste the JWT_PUBLIC_KEY value from command above>
```

**Example `.env` file after adding JWT keys:**

```env
S3_BUCKET_NAME=eventpro-images-local
ORDER_QUEUE_URL=http://localhost:4566/000000000000/order-queue
PAYMENT_QUEUE_URL=http://localhost:4566/000000000000/payment-queue
NOTIFICATION_QUEUE_URL=http://localhost:4566/000000000000/notification-queue
JWT_ISSUER=eventpro
JWT_ACCESS_TTL_SECONDS=3600
JWT_PRIVATE_KEY=MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
JWT_PUBLIC_KEY=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
```

**Alternative: Direct PEM format (also supported):**

If you prefer to use PEM format directly, you can add the keys as multi-line strings in `.env`:

```bash
JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
<base64 content>
-----END PRIVATE KEY-----"

JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
<base64 content>
-----END PUBLIC KEY-----"
```

**Note:** 
- The backend accepts PEM or base64 DER keys. Base64 DER is recommended for single-line `.env` values.
- After adding keys, restart the backend: `make start-backend` or `docker-compose restart backend`
- If backend is not running yet, just run `make local-up` which will start it with the new keys

**Where to store:**
- Store keys in the root `.env` file (used by `docker-compose.yml`).
- Do not commit `.env` or key files to version control.
- If running backend outside Docker, export the same variables in your shell.

---

### Step 3: Start Application Services

```bash
make local-up
```

**What this does:**

- ✅ Starts Backend API (Spring Boot) on port 8080
- ✅ Starts Frontend (React) on port 5173
- ✅ **Lambda functions are already running** (managed by LocalStack via Terraform)
- ✅ Runs database migrations automatically
- ✅ Enables hot reload for development

**Wait time:** ~30 seconds for services to start (longer on first run due to database migrations)

**Verify services are running:**

```bash
# Check all services status
docker-compose ps
# Should show: postgres (healthy), localstack (healthy), backend (running), frontend (running)

# Test backend health
curl http://localhost:8080/actuator/health
# Should return: {"status":"UP"}

# Test backend API (public endpoint)
curl http://localhost:8080/api/v1/events
# Should return paginated events list

# Check frontend is serving
curl -I http://localhost:5173
# Should return HTTP 200

# Verify Lambda functions are registered
make local-lambda-status
# Should show 3 functions

# Verify event source mappings
make local-event-mappings
# Should show 3 mappings
```

---

## 🎯 Available Make Commands

### Essential Commands

| Command | Description |
|---------|-------------|
| `make local-infra` | Provision infrastructure and create environment files (builds Lambdas, starts infrastructure if needed, runs Terraform) |
| `make local-up` | Start all services (backend, frontend) - Lambda functions are already running via LocalStack |
| `make local-down` | Stop all services and destroy Terraform resources |
| `make local-clean` | Stop services and remove all data (clean slate) |

### Service Management

| Command | Description |
|---------|-------------|
| `make local-infra-only` | Start only infrastructure (PostgreSQL + LocalStack) |
| `make start-pg-and-localstack` | Alias for `local-infra-only` |
| `make start-backend` | Start only backend service |
| `make start-frontend` | Start only frontend service |
| `make backend-logs` | View backend logs (follow mode) |
| `make frontend-logs` | View frontend logs (follow mode) |
| `make local-restart` | Restart backend and frontend services |

### Lambda Verification

| Command | Description |
|---------|-------------|
| `make local-lambda-status` | List all Lambda functions registered in LocalStack |
| `make local-lambda-logs FUNCTION=<name>` | View logs for a specific Lambda function |
| `make local-event-mappings` | List all SQS event source mappings |

### One-Command Setup (First Time)

```bash
make local-setup
```

This runs all setup steps in order: `local-infra-only` → `local-infra` → `local-up`

**Note:** This is optional. You can also just run `make local-infra` followed by `make local-up`, as `local-infra` will automatically start infrastructure if needed.

### Viewing Logs

```bash
# View all service logs
docker-compose logs -f

# View specific service logs
make backend-logs
make frontend-logs

# View Lambda function logs
make local-lambda-logs FUNCTION=local-order-processor
make local-lambda-logs FUNCTION=local-payment-processor
make local-lambda-logs FUNCTION=local-notification-sender
```

---

## 🔄 Common Development Workflows

### Daily Development

```bash
# Start services (if not already running)
make local-up

# Make code changes (hot reload will pick them up automatically)
# Backend: Edit files in backend/services/
# Frontend: Edit files in eventpro-frontend/src/

# View logs if needed
make backend-logs
make frontend-logs
```

### After Pulling Latest Changes

```bash
# Stop services
make local-down

# Pull latest code
git pull

# Restart services (migrations will run automatically)
make local-up
```

### After Changing Lambda Functions

```bash
# Rebuild Lambda images and redeploy
make local-infra
# This automatically rebuilds images and redeploys to LocalStack
```

### After Changing Infrastructure (Terraform)

```bash
# Reapply Terraform changes
make local-infra
# This will update LocalStack resources
```

### After Changing Environment Variables

```bash
# If you changed .env or docker-compose.yml environment variables
docker-compose restart backend frontend
# or
make local-restart
```

### Debugging Backend Issues

```bash
# View backend logs
make backend-logs

# Check backend health
curl http://localhost:8080/actuator/health

# Check database connection
docker exec -it postgres psql -U eventpro -d eventpro -c "SELECT 1;"

# Verify JWT keys are set
grep JWT_PUBLIC_KEY .env
```

### Debugging Lambda Issues

```bash
# Check Lambda status
make local-lambda-status

# View Lambda logs
make local-lambda-logs FUNCTION=local-order-processor

# Check event source mappings
make local-event-mappings

# Test SQS queue
aws --endpoint-url=http://localhost:4566 sqs get-queue-attributes \
  --queue-url <queue-url> \
  --attribute-names ApproximateNumberOfMessages
```

---

## 🧪 Testing the Application

### 1. Test Backend Health

```bash
curl http://localhost:8080/actuator/health
# Should return: {"status":"UP"}
```

### 2. Test Frontend

1. Open browser: <http://localhost:5173>
2. You should see the EventPro application

### 3. Test Authentication

1. **Sign Up:**
   - Navigate to: <http://localhost:5173/signup>
   - Fill in required fields: email, password (min 8 chars), firstName, lastName
   - Optional: phoneNumber, role (USER or ORGANIZER)
   - Submit the form

2. **Sign In:**
   - Navigate to: <http://localhost:5173/login>
   - Enter your email and password
   - You should be redirected to your profile page after successful login

3. **Verify JWT Token:**
   - Open browser DevTools → Application → Local Storage
   - Check for `accessToken` key
   - Token should be a JWT string starting with `eyJ...`

### 4. Test API Endpoints

```bash
# Get Swagger UI
open http://localhost:8080/swagger-ui/index.html

# Test with authentication (get token from browser localStorage)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8080/api/v1/users/me
```

### 5. Test Lambda-SQS Integration

**Verify Lambda functions are registered:**

```bash
make local-lambda-status
# Should show 3 functions: local-order-processor, local-payment-processor, local-notification-sender
```

**Verify event source mappings:**

```bash
make local-event-mappings
# Should show 3 mappings connecting queues to Lambda functions
```

**Test the complete flow:**

1. **Create an order** via Frontend or API
2. **Check order-queue** for message (should be processed quickly):

   ```bash
   # Get queue URL from .env or Terraform output
   ORDER_QUEUE_URL=$(grep ORDER_QUEUE_URL .env | cut -d'=' -f2)
   aws --endpoint-url=http://localhost:4566 sqs get-queue-attributes \
     --queue-url "$ORDER_QUEUE_URL" \
     --attribute-names ApproximateNumberOfMessages
   ```

3. **Watch order-processor Lambda logs** (in a separate terminal):

   ```bash
   make local-lambda-logs FUNCTION=local-order-processor
   ```

   You should see the Lambda processing the order message.
4. **Verify order status** updated in database:

   ```bash
   docker exec -it postgres psql -U eventpro -d eventpro -c \
     "SELECT id, status, total_amount FROM \"order\" ORDER BY created_at DESC LIMIT 5;"
   ```

5. **Check payment-queue** for message (order-processor should have published):

   ```bash
   PAYMENT_QUEUE_URL=$(grep PAYMENT_QUEUE_URL .env | cut -d'=' -f2)
   aws --endpoint-url=http://localhost:4566 sqs get-queue-attributes \
     --queue-url "$PAYMENT_QUEUE_URL" \
     --attribute-names ApproximateNumberOfMessages
   ```

6. **Watch payment-processor Lambda logs**:

   ```bash
   make local-lambda-logs FUNCTION=local-payment-processor
   ```

7. **Continue through the chain**: payment → notification-queue → notification-sender

---

## 🐛 Troubleshooting

### Issue: "JWT keys are not set" or "JWT_PUBLIC_KEY is invalid or missing"

**Symptoms:** Backend fails to start with error about JWT keys

**Solution:**

1. **Check if `.env` file exists:**
   ```bash
   cat .env
   ```

2. **If missing, run:**
   ```bash
   make local-infra
   ```

3. **Verify JWT keys are present:**
   ```bash
   grep JWT_PUBLIC_KEY .env
   grep JWT_PRIVATE_KEY .env
   ```

4. **If keys are missing, add them (see "Step 2: Configure JWT Keys"):**
   - Generate RSA key pair
   - Convert to base64 DER format
   - Add `JWT_PUBLIC_KEY` and `JWT_PRIVATE_KEY` to `.env`

5. **Restart backend:**
   ```bash
   make start-backend
   # or
   docker-compose restart backend
   ```

**Note:** JWT keys are **REQUIRED** - the backend will not start without them. The keys must be valid RSA keys in PEM or base64 DER format.

### Issue: Backend fails to start

**Symptoms:** Errors about missing environment variables or "Could not resolve placeholder"

**Solution:**

```bash
# Verify .env file exists and has required values
cat .env | grep QUEUE_URL
cat .env | grep JWT  # JWT_PUBLIC_KEY and JWT_PRIVATE_KEY are REQUIRED

# Check database environment variables (set in docker-compose.yml)
docker-compose exec backend env | grep -E "DB_|JWT"

# Regenerate .env file
make local-infra

# Restart backend
make start-backend
```

**Common Issues:**

- **Missing JWT keys**: `JWT_PUBLIC_KEY` and `JWT_PRIVATE_KEY` are **REQUIRED**. The application will fail to start without them. See "Issue: JWT keys are not set" above.
- **Database connection**: Verify `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` are set in `docker-compose.yml` (they are by default).
- **Invalid JWT key format**: Keys must be valid RSA keys. Use the commands in "Step 2: Configure JWT Keys" to generate properly formatted keys.
- **Environment variables not loaded**: Ensure `.env` file exists and contains the required variables. Backend reads from `.env` via `docker-compose --env-file .env`.

### Issue: Database connection failed

**Solution:**

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Restart PostgreSQL
docker-compose restart postgres

# Wait for health check
docker-compose ps postgres  # Should show "healthy"
```

### Issue: Frontend can't connect to backend

**Solution:**

```bash
# Verify backend is running
curl http://localhost:8080/actuator/health

# Check frontend environment variables
cat eventpro-frontend/.env.local | grep VITE_API_BASE_URL
# Should be: VITE_API_BASE_URL=http://localhost:8080

# Restart frontend
make start-frontend
```

### Issue: Services won't start (container conflicts)

**Symptoms:** Error messages about container names already in use or port conflicts

**Solution:**

```bash
# Option 1: Stop and remove containers (recommended for conflicts)
docker-compose down
make local-infra
make local-up

# Option 2: Clean everything and start fresh
make local-clean
make local-infra
# Add JWT keys to .env
make local-up
```

**If ports are in use:**
- Check what's using the ports: `lsof -i :8080` (backend), `lsof -i :5173` (frontend), `lsof -i :5432` (postgres), `lsof -i :4566` (localstack)
- Stop conflicting services or change ports in `docker-compose.yml`

### Issue: Lambda functions not processing messages

**Solution:**

1. **Verify Lambda functions are registered in LocalStack:**

   ```bash
   make local-lambda-status
   # Should show: local-order-processor, local-payment-processor, local-notification-sender
   ```

2. **Check event source mappings:**

   ```bash
   make local-event-mappings
   # Should show 3 mappings (one for each queue)
   ```

3. **Check Lambda logs:**

   ```bash
   make local-lambda-logs FUNCTION=local-order-processor
   ```

4. **Verify messages in queues:**

   ```bash
   aws --endpoint-url=http://localhost:4566 sqs get-queue-attributes \
     --queue-url <queue-url> \
     --attribute-names ApproximateNumberOfMessages
   ```

5. **If Lambda functions are missing, rebuild and redeploy:**

   ```bash
   make local-infra  # This automatically rebuilds Lambda images and redeploys
   ```

### Issue: Lambda functions cannot connect to PostgreSQL

**Symptoms:** Lambda logs show database connection errors like "Connection refused" or "Name or service not known"

**Solution:**

Lambda functions connect to PostgreSQL using `postgres:5432` (Docker network hostname). If this fails:

1. **Verify all services are on the same Docker network:**

   ```bash
   # Network name is {project-directory}_eventpro (e.g., eventpro-site_eventpro)
   docker network inspect eventpro-site_eventpro
   # Should show postgres, localstack, backend, frontend containers
   
   # Or list all networks to find the correct one
   docker network ls | grep eventpro
   ```

2. **Check LocalStack Lambda executor configuration:**
   - LocalStack uses `LAMBDA_EXECUTOR=docker` which should allow Lambda containers to access the same network
   - If issues persist, you may need to use `host.docker.internal:5432` instead of `postgres:5432` in Lambda environment variables

3. **Restart LocalStack to refresh network configuration:**

   ```bash
   docker-compose restart localstack
   make local-infra  # Redeploy Lambda functions
   ```

### Issue: Docker image build fails with "invalid tag" error

**Symptoms:** Error like `invalid tag ".dkr.ecr.us-east-1.amazonaws.com/..."`

**Cause:** This error occurs when `AWS_ACCOUNT_ID` is set but empty or malformed, causing the build script to generate an invalid ECR tag.

**Solution:**

1. **Check if `AWS_ACCOUNT_ID` is set:**

   ```bash
   echo $AWS_ACCOUNT_ID
   ```

2. **If it's set but empty or incorrect, unset it:**

   ```bash
   unset AWS_ACCOUNT_ID
   ```

3. **Verify it's unset:**

   ```bash
   echo $AWS_ACCOUNT_ID
   # Should output nothing (empty)
   ```

4. **Run `make local-infra` again:**

   ```bash
   make local-infra
   ```

**How the build script works:**

- ✅ **When `AWS_ACCOUNT_ID` is NOT set:** Uses local tags (e.g., `eventpro-order-processor:latest`) - perfect for local development
- ✅ **When `AWS_ACCOUNT_ID` IS set:** Uses ECR tags (e.g., `123456789012.dkr.ecr.us-east-1.amazonaws.com/eventpro-order-processor:latest`) - for AWS deployment
- ⚠️ **When `AWS_ACCOUNT_ID` is set but empty:** Causes the invalid tag error

**For local development, keep `AWS_ACCOUNT_ID` unset.**

---

## 📊 Service Overview

### Services Running in Docker

| Service | Port | Description |
|---------|------|-------------|
| **Frontend** | 5173 | React development server |
| **Backend API** | 8080 | Spring Boot application |
| **PostgreSQL** | 5432 | Database |
| **LocalStack** | 4566 | AWS services emulator |
| **Order Processor Lambda** | Managed by LocalStack | Processes orders from SQS (auto-triggered) |
| **Payment Processor Lambda** | Managed by LocalStack | Processes payments from SQS (auto-triggered) |
| **Notification Sender Lambda** | Managed by LocalStack | Sends notifications from SQS (auto-triggered) |

### View Service Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Lambda logs (managed by LocalStack)
make local-lambda-logs FUNCTION=local-order-processor
make local-lambda-logs FUNCTION=local-payment-processor
make local-lambda-logs FUNCTION=local-notification-sender
```

### Check Service Status

```bash
docker-compose ps
```

---

## 🗄️ Database Access

### Database Configuration (Local Profile)

The local profile uses `LocalDataSourceConfig` which reads database credentials directly from environment variables set in `docker-compose.yml`:

- `DB_HOST=postgres` (PostgreSQL container name, not `localhost`)
- `DB_PORT=5432`
- `DB_NAME=eventpro`
- `DB_USERNAME=eventpro`
- `DB_PASSWORD=eventpro`

**Important Notes:**

- The local profile does NOT use AWS Secrets Manager for database credentials. It reads directly from environment variables, making local development simpler and faster.
- When connecting from the backend container, use `DB_HOST=postgres` (Docker network hostname), not `localhost`.
- When connecting from your host machine, use `localhost:5432`.
- Database credentials are set in `docker-compose.yml` and do NOT need to be in `.env` file.

### Connect to PostgreSQL

```bash
docker exec -it postgres psql -U eventpro -d eventpro
```

### Useful Database Queries

```sql
-- View all users
SELECT id, email, first_name, last_name, role, status, created_at
FROM users
ORDER BY created_at DESC;

-- Check migrations
SELECT * FROM flyway_schema_history ORDER BY installed_rank DESC;

-- View orders
SELECT id, user_id, status, total_amount, created_at 
FROM "order" 
ORDER BY created_at DESC;

-- View events
SELECT id, name, start_time, end_time, organizer_id, created_at
FROM event
ORDER BY created_at DESC;

-- View tickets
SELECT id, event_id, ticket_type, price, ticket_status, purchaser_id
FROM ticket
ORDER BY created_at DESC;

-- View cart items
SELECT id, user_id, ticket_id, quantity, created_at
FROM cart
ORDER BY created_at DESC;
```

---

## 🧹 Clean Up

### Stop Services (Keep Data)

```bash
make local-down
```

### Clean Everything (Remove All Data)

```bash
make local-clean
```

**Warning:** This deletes all data including:

- Database data
- LocalStack resources
- Environment files

### Remove Only Containers

```bash
docker-compose down
```

### Remove Containers and Volumes

```bash
docker-compose down -v
```

---

## 🔍 Useful Commands Reference

### Check Environment Variables

```bash
# Backend environment variables
docker-compose exec backend env | grep -E "JWT|QUEUE_URL|S3|DB_|STRIPE"

# Frontend environment variables
docker-compose exec frontend env | grep VITE_

# Lambda environment variables (check via LocalStack)
aws --endpoint-url=http://localhost:4566 lambda get-function-configuration \
  --function-name local-order-processor --query 'Environment.Variables' --output json
```

**Important Notes:**

- **Database credentials** (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`) are set in `docker-compose.yml` and used by `LocalDataSourceConfig` for the local profile
- **Local profile does NOT use Secrets Manager** for database credentials - it reads directly from environment variables
- **JWT keys** (`JWT_PUBLIC_KEY`, `JWT_PRIVATE_KEY`) are **REQUIRED** and must be in `.env` file - backend will fail to start without them
- **Stripe secrets** can be set via environment variables or use defaults from `application-local.yml` (test values)
- **Lambda functions** connect to PostgreSQL using `postgres:5432` (Docker network hostname). If Lambda functions cannot connect, check that LocalStack is on the same Docker network as PostgreSQL.
- **SQS Queue URLs** are automatically generated by Terraform and added to `.env` by `make local-infra`
- **S3 Bucket Name** is automatically generated by Terraform and added to `.env` by `make local-infra`

### Test LocalStack Resources

```bash
# List S3 buckets
aws --endpoint-url=http://localhost:4566 s3 ls

# List SQS queues
aws --endpoint-url=http://localhost:4566 sqs list-queues

# List secrets (used by Lambda functions, not by backend API in local profile)
aws --endpoint-url=http://localhost:4566 secretsmanager list-secrets
```

**Note:** Secrets Manager secrets in LocalStack are used by Lambda functions for database credentials. The backend API (local profile) uses environment variables directly from `docker-compose.yml`, not Secrets Manager.

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend
docker-compose restart frontend
```

### Build Lambda Images

**Note:** For local development, you typically don't need to build Lambda images separately - `make local-infra` does this automatically. These commands are useful if you want to rebuild specific Lambdas or build for AWS deployment.

```bash
# Build all lambda images (for local development - no AWS credentials needed)
make lambda-build

# Build specific lambda
make lambda-build-order
make lambda-build-payment
make lambda-build-notification
```

**For AWS deployment:** Set `AWS_ACCOUNT_ID` environment variable to build and push to ECR:

```bash
AWS_ACCOUNT_ID=123456789012 AWS_REGION=us-east-1 make lambda-build
```

---

## 📝 Environment Files

### Backend Environment (`.env`)

Created automatically by `make local-infra`. **You must add JWT keys manually** after generation (see Step 2).

**Automatically generated by `make local-infra`:**
- `S3_BUCKET_NAME` - S3 bucket for images (from Terraform output)
- `ORDER_QUEUE_URL` - SQS order queue URL (from Terraform output)
- `PAYMENT_QUEUE_URL` - SQS payment queue URL (from Terraform output)
- `NOTIFICATION_QUEUE_URL` - SQS notification queue URL (from Terraform output)

**You must add manually (REQUIRED for backend to start):**
- `JWT_ISSUER` - JWT issuer (optional, defaults to `eventpro` if not set)
- `JWT_ACCESS_TTL_SECONDS` - JWT access token TTL in seconds (optional, defaults to `3600` if not set)
- `JWT_PUBLIC_KEY` - JWT public key (**REQUIRED** - backend will fail without this)
- `JWT_PRIVATE_KEY` - JWT private key (**REQUIRED** - backend will fail without this)

**Optional (for Stripe payment features):**
- `STRIPE_SECRET_KEY` - Stripe secret key (defaults to `sk_test_local` if not set)
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (defaults to `pk_test_local` if not set)
- `STRIPE_WEBHOOK_SECRET` - Signing secret for verifying Stripe webhooks (defaults to `whsec_test_local` if not set). See [Webhook signing secret (CLI vs Dashboard)](#webhook-signing-secret-cli-vs-dashboard) below.

**Optional subscription price IDs** (Stripe Dashboard → Products → copy each Price ID, e.g. `price_xxx`):
- `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_YEARLY`
- `STRIPE_PRICE_ENTERPRISE_MONTHLY`, `STRIPE_PRICE_ENTERPRISE_YEARLY`

**Note:** Database credentials (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`) are set directly in `docker-compose.yml` and do NOT need to be in `.env`. The local profile uses `LocalDataSourceConfig` which reads these environment variables - it does NOT use Secrets Manager.

**Frontend (Vite) and publishable key:** put `STRIPE_PUBLISHABLE_KEY=pk_test_...` in root **`.env`** so `docker compose` can pass `VITE_STRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY}` into the frontend container, and/or set **`VITE_STRIPE_PUBLISHABLE_KEY`** in **`eventpro-frontend/.env.local`** (Vite reads that file from the mounted repo).

#### Webhook signing secret (CLI vs Dashboard)

`STRIPE_WEBHOOK_SECRET` — Ticket checkout uses **confirm-in-app** flows and does **not** require webhooks for basic local testing. The backend **does** expose **`POST /api/v1/webhooks/stripe`** for **subscription** lifecycle events (`invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted`). If you set `STRIPE_WEBHOOK_SECRET`, it must match how you deliver webhooks:

| How you test | Where the `whsec_...` secret comes from |
|----------------|-------------------------------------------|
| **Stripe CLI** (typical for localhost) | Run **`stripe listen`** and forward to this API. The CLI prints a **Signing secret** (`whsec_...`) in the terminal—paste that into `.env` as `STRIPE_WEBHOOK_SECRET`. You often **will not** see a matching user-created webhook endpoint in **Stripe Dashboard → Developers → Webhooks**; that is normal. The secret can **change** when you start a new `stripe listen` session—update your env if verification starts failing. |
| **Stripe Dashboard** (typical for deployed HTTPS) | **Developers → Webhooks → Add endpoint** → URL `https://<your-domain>/api/v1/webhooks/stripe` → select events → **Reveal** the endpoint’s **Signing secret** and use that in production. |

Example local forward (backend on port 8080):

```bash
stripe listen --forward-to localhost:8080/api/v1/webhooks/stripe
```

Install the [Stripe CLI](https://stripe.com/docs/stripe-cli) and run `stripe login` first.

### Frontend Environment (`eventpro-frontend/.env.local`)

Created automatically by `make local-infra`. Contains:

**Automatically generated:**
- `VITE_API_BASE_URL` - Backend API URL (defaults to `http://localhost:8080`)
- `VITE_AWS_REGION` - AWS region (defaults to `us-east-1`)
- `VITE_S3_BUCKET_NAME` - S3 bucket name (from Terraform output)

**Optional (preserved if already exists):**
- `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (for payment features; must match `STRIPE_PUBLISHABLE_KEY` in root `.env`)

**Note:** 
- These files are automatically generated by `make local-infra`.
- If you manually edit `eventpro-frontend/.env.local`, your changes may be overwritten when running `make local-infra` again.
- To preserve Stripe key across regenerations, add it to the root `.env` file before running `make local-infra` (it will be copied to `eventpro-frontend/.env.local`).
- Alternatively, manually add it to `eventpro-frontend/.env.local` after running `make local-infra`.
- Ensure **`VITE_STRIPE_PUBLISHABLE_KEY`** is set here or supplied via root `.env` (see `make local-infra` behavior above) so it matches **`STRIPE_PUBLISHABLE_KEY`** in root `.env`.

---

## 🚀 Next Steps

After local setup is working:

1. **Run Tests:**

   ```bash
   # Backend tests
   cd backend/services && ./gradlew test
   
   # Frontend tests
   cd frontend && npm test
   ```

2. **Review Code:**
   - Backend API: `backend/services/`
   - Frontend: `eventpro-frontend/src/`
   - Lambda functions: `backend/lambdas/`

3. **Check Documentation:**
   - Environment Variables: `docs/VARIABLES.md`
   - Lambda Deployment: `docs/LAMBDA_DEPLOYMENT.md`
   - Local Environment Services: `docs/LOCAL_ENVIRONMENT_SERVICES.md`
   - Frontend-Backend Endpoints: `docs/ENDPOINTS_FRONT_BACK.md`

4. **Explore the API:**
   - Swagger UI: <http://localhost:8080/swagger-ui/index.html>
   - API Docs: <http://localhost:8080/v3/api-docs>

---

## 💡 Tips

- **Hot Reload:** Backend and frontend support hot reload. Changes are automatically reflected without restarting containers.
- **Database Migrations:** Run automatically on backend startup via Flyway. Check migration status in database: `SELECT * FROM flyway_schema_history ORDER BY installed_rank DESC;`
- **Database Configuration:** Local profile uses `LocalDataSourceConfig` which reads `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` from environment variables (set in docker-compose.yml). It does NOT use Secrets Manager.
- **Lambda Functions:** Managed by LocalStack and automatically triggered by SQS event source mappings. No manual invocation needed. Lambda functions use Secrets Manager for database credentials (different from backend API).
- **JWT Auth:** Backend uses RS256 keys from `.env`. Update `JWT_PUBLIC_KEY`/`JWT_PRIVATE_KEY` and restart backend if you rotate keys. Keys are **REQUIRED** - backend will not start without them.
- **LocalStack:** Emulates AWS services locally. All SQS, S3, Secrets Manager, and Lambda operations go through LocalStack at `http://localhost:4566`.
- **Secrets Manager:** Used by Lambda functions for database credentials. Backend API (local profile) uses environment variables directly from `docker-compose.yml`, not Secrets Manager.
- **Environment Files:** `.env` and `eventpro-frontend/.env.local` are automatically generated by `make local-infra`. JWT keys must be added manually. Optional Stripe keys (`STRIPE_*`) go in root **`.env`**; other values are preserved if they exist.
- **Container Networking:** All services are on the `eventpro` Docker network. Backend connects to PostgreSQL using `postgres:5432` (container name), not `localhost`.
- **Port Conflicts:** If ports 8080, 5173, 5432, or 4566 are already in use, stop the conflicting services or change ports in `docker-compose.yml`.

---

## 🆘 Getting Help

If you encounter issues:

1. **Check service logs:**
   ```bash
   docker-compose logs -f [service-name]
   # or
   make backend-logs
   make frontend-logs
   ```

2. **Verify environment variables:** See "Check Environment Variables" section above

3. **Review troubleshooting section:** See "🐛 Troubleshooting" section above

4. **Check service status:**
   ```bash
   docker-compose ps
   # All services should show "Up" or "healthy"
   ```

5. **Verify JWT keys are set:**
   ```bash
   grep JWT_PUBLIC_KEY .env
   grep JWT_PRIVATE_KEY .env
   # Both should show values
   ```

6. **Clean and restart (last resort):**
   ```bash
   make local-clean
   make local-infra
   # Add JWT keys to .env
   make local-up
   ```

7. **Verify Lambda functions:**
   ```bash
   make local-lambda-status
   make local-event-mappings
   ```

8. **Check database connection:**
   ```bash
   docker exec -it postgres psql -U eventpro -d eventpro -c "SELECT 1;"
   # Should return: ?column? | 1
   ```

---

## 📚 Additional Resources

- **Environment Variables:** See `docs/VARIABLES.md` for complete variable reference
- **Lambda Functions:** See `docs/LAMBDA_DEPLOYMENT.md` for lambda deployment details
- **Local Services:** See `docs/LOCAL_ENVIRONMENT_SERVICES.md` for service architecture
- **Project Structure:** See project README for architecture overview

---

## ✅ Setup Verification Checklist

After completing setup, verify everything is working:

- [ ] All Docker containers are running (`docker-compose ps` - should show 4 services: postgres, localstack, backend, frontend)
- [ ] Backend health check returns `{"status":"UP"}` (`curl http://localhost:8080/actuator/health`)
- [ ] Frontend is accessible (`curl -I http://localhost:5173` - should return HTTP 200)
- [ ] JWT keys are set in `.env` (`grep JWT_PUBLIC_KEY .env` - should show a value)
- [ ] Lambda functions are registered (`make local-lambda-status` - should show 3 functions: local-order-processor, local-payment-processor, local-notification-sender)
- [ ] Event source mappings exist (`make local-event-mappings` - should show 3 mappings)
- [ ] Database is accessible (`docker exec -it postgres psql -U eventpro -d eventpro -c "SELECT 1;"` - should return `?column? | 1`)
- [ ] Can sign up a new user (frontend: <http://localhost:5173/signup> - form should submit successfully)
- [ ] Can log in with credentials (frontend: <http://localhost:5173/login> - should redirect to profile)
- [ ] Swagger UI is accessible (<http://localhost:8080/swagger-ui/index.html> - should show API documentation)
- [ ] JWT token is stored after login (browser DevTools → Application → Local Storage → `accessToken` key exists)

---

## 📝 Summary

This guide covers:

- ✅ **Complete setup process** - From zero to running application in 3 steps
- ✅ **JWT authentication** - RSA key generation and configuration
- ✅ **All Make commands** - Quick reference for common tasks
- ✅ **Troubleshooting** - Solutions for common issues
- ✅ **Service management** - Starting, stopping, and monitoring services
- ✅ **Lambda functions** - Verification and debugging
- ✅ **Database access** - Connection and useful queries
- ✅ **Development workflows** - Common day-to-day tasks
- ✅ **Environment variables** - Complete reference

**For more information:**
- Environment Variables: `docs/VARIABLES.md`
- Frontend-Backend Endpoints: `docs/ENDPOINTS_FRONT_BACK.md`
- Lambda Deployment: `docs/LAMBDA_DEPLOYMENT.md`
- Local Environment Services: `docs/LOCAL_ENVIRONMENT_SERVICES.md`

</details>

---

<details>
<summary><strong>Complete LocalStack Pro deployment</strong></summary>

This is the full AWS-emulation path for the production-shaped Terraform stacks. It is separate from the Docker Compose hybrid local development flow that uses `make local-infra` and `infrastructure/environments/local`.

Use this path when you want to exercise:
- `backend/shared-infra`
- `backend/services/terraform`
- `eventpro-frontend/terraform`
- `backend/lambdas/*/terraform`

The deploy order is the same as higher environments:

```text
shared-infra
  -> services
  -> frontend
  -> order-processor
  -> payment-processor
  -> notification-sender
```

LocalStack Pro uses different credentials and backend/provider wiring:
- Credentials are mock values: `AWS_ACCESS_KEY_ID=test`, `AWS_SECRET_ACCESS_KEY=test`.
- LocalStack environment values live in `.env.lstk`.
- Each stack initializes Terraform state with `backend.lstk.tfbackend`.
- Each stack plans/applies resource variables with `terraform.lstk.tfvars`.
- The shared Terraform state bucket must exist inside LocalStack before `terraform init`.
- Do not use `terraform.tfvars` for this flow.

*load LocalStack Pro environment and start LocalStack*

```bash
set -a
source .env.lstk
set +a

# Set LOCALSTACK_AUTH_TOKEN in .env.lstk or export it in your shell before starting LocalStack Pro.
: "${LOCALSTACK_AUTH_TOKEN:?Set LOCALSTACK_AUTH_TOKEN for LocalStack Pro}"

lstk start
```

If LocalStack Pro is already running, confirm it is reachable:

```bash
lstk status
AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-test}" \
AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-test}" \
AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-us-east-1}" \
aws --endpoint-url="${AWS_ENDPOINT_URL:-http://localhost:4566}" sts get-caller-identity
```

If you used `make lstk-start`, remember that Make sources `.env.lstk` inside a subshell. Run `set -a; source .env.lstk; set +a` in your current terminal before manual `aws` commands, or use the Make shortcuts below.

*create the emulated Terraform state bucket*

```bash
AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-test}" \
AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-test}" \
AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-us-east-1}" \
aws --endpoint-url="${AWS_ENDPOINT_URL:-http://localhost:4566}" s3 mb s3://eventpro-site-state
```

If the bucket already exists, this command can fail safely. Confirm with:

```bash
AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-test}" \
AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-test}" \
AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-us-east-1}" \
aws --endpoint-url="${AWS_ENDPOINT_URL:-http://localhost:4566}" s3 ls
```

Make shortcuts are available for this full LocalStack Pro flow:

```bash
make lstk-start
make lstk-state-bucket
make lstk-tf-all                 # defaults to plan
make lstk-tf-all LSTK_TF_ACTION=apply
```

Individual stack shortcuts:

```bash
make lstk-tf-shared-infra
make lstk-tf-services
make lstk-tf-frontend
make lstk-tf-lambdas
```

*deploy shared infrastructure first*

```bash
cd backend/shared-infra
terraform init -reconfigure -backend-config=backend.lstk.tfbackend
terraform workspace select "$WORKSPACE" || terraform workspace new "$WORKSPACE"
terraform plan -var-file=terraform.lstk.tfvars
terraform apply -var-file=terraform.lstk.tfvars
cd ../..
```

*deploy services*

Build or tag an API image that the LocalStack/ECS emulation can reference, then apply the stack:

```bash
cd backend/services/terraform
terraform init -reconfigure -backend-config=backend.lstk.tfbackend
terraform workspace select "$WORKSPACE" || terraform workspace new "$WORKSPACE"
terraform plan -var-file=terraform.lstk.tfvars
terraform apply -var-file=terraform.lstk.tfvars
cd ../../..
```

*deploy frontend*

Build frontend assets before applying if you need to sync or inspect the generated S3/CloudFront resources:

```bash
cd eventpro-frontend
npm ci
npm run build
cd terraform
terraform init -reconfigure -backend-config=backend.lstk.tfbackend
terraform workspace select "$WORKSPACE" || terraform workspace new "$WORKSPACE"
terraform plan -var-file=terraform.lstk.tfvars
terraform apply -var-file=terraform.lstk.tfvars
cd ../..
```

*deploy lambdas*

Build or tag Lambda images as `localstack/eventpro-*-processor:local` or update each lambda's `terraform.lstk.tfvars` image values to match your local image names.

```bash
cd backend/lambdas/order-processor/terraform
terraform init -reconfigure -backend-config=backend.lstk.tfbackend
terraform workspace select "$WORKSPACE" || terraform workspace new "$WORKSPACE"
terraform plan -var-file=terraform.lstk.tfvars
terraform apply -var-file=terraform.lstk.tfvars
cd ../../../..
```

```bash
cd backend/lambdas/payment-processor/terraform
terraform init -reconfigure -backend-config=backend.lstk.tfbackend
terraform workspace select "$WORKSPACE" || terraform workspace new "$WORKSPACE"
terraform plan -var-file=terraform.lstk.tfvars
terraform apply -var-file=terraform.lstk.tfvars
cd ../../../..
```

```bash
cd backend/lambdas/notification-sender/terraform
terraform init -reconfigure -backend-config=backend.lstk.tfbackend
terraform workspace select "$WORKSPACE" || terraform workspace new "$WORKSPACE"
terraform plan -var-file=terraform.lstk.tfvars
terraform apply -var-file=terraform.lstk.tfvars
cd ../../../..
```

*verify LocalStack resources*

```bash
aws --endpoint-url="$AWS_ENDPOINT_URL" s3 ls
aws --endpoint-url="$AWS_ENDPOINT_URL" sqs list-queues
aws --endpoint-url="$AWS_ENDPOINT_URL" rds describe-db-instances
aws --endpoint-url="$AWS_ENDPOINT_URL" lambda list-functions
aws --endpoint-url="$AWS_ENDPOINT_URL" route53 list-hosted-zones
```

Route53 and DNS notes:
- `terraform.lstk.tfvars` uses `eventpro.localhost.localstack.cloud` as the default domain.
- LocalStack can emulate Route53 records, but your host machine will not automatically resolve every emulated hosted-zone record unless you configure DNS resolution or use LocalStack's supported localhost domains.
- For browser testing, you may still need `/etc/hosts`, LocalStack DNS, or direct localhost URLs depending on which service you are testing.
- ACM validation records are emulated; do not expect public DNS validation behavior.

Switching notes:
- To switch a stack back to real AWS, run `terraform init -reconfigure` without `backend.lstk.tfbackend`, then use `terraform.tfvars`.
- If Terraform asks to migrate state while switching between AWS and LocalStack, stop unless you intentionally want to copy state between targets.
- Keep the same workspace name across all stacks so downstream state reads find the matching `shared-infra` outputs.

Full runbook: `docs/TERRAFORM_DEPLOY_TARGETS.md`.

</details>

---

<details>
<summary><strong>higher env deployment from local</strong></summary>

Higher environments use `.env.remote` and `backend/shared-infra` as the only upstream Terraform state. Services, frontend, and lambdas can be deployed independently, but the matching workspace must already have shared infra applied.

*deploy shared infrastructure only*

```bash
./scripts/pipeline-deploy.sh --env-file .env.remote --only shared-infra --apply
```

*preview shared infrastructure only*

```bash
./scripts/pipeline-deploy.sh --env-file .env.remote --only shared-infra --plan
```

*build and deploy everything in dependency order*

```bash
./scripts/pipeline-deploy.sh --env-file .env.remote --apply --image-tag abc4150605
```

Notes:
- `DOMAIN_NAME` is required in `.env.remote`.
- Dependency order is `shared-infra -> services/frontend/lambdas`.
- If you run `--only services`, `--only frontend`, or `--only lambdas`, shared infra must already be applied for that workspace.
- For existing deployed environments, migrate Terraform state from `services/terraform.tfstate` to `shared-infra/terraform.tfstate` before applying this refactor.
- The full Terraform AWS-emulation stacks keep LocalStack values in each stack's `terraform.lstk.tfvars` and LocalStack backend settings in `backend.lstk.tfbackend`; see `docs/TERRAFORM_DEPLOY_TARGETS.md` before switching between real AWS and LocalStack Pro.

<details>
<summary>services only</summary>

*build and deploy*

```bash
./scripts/pipeline-deploy.sh --env-file .env.remote --only services --apply --image-tag abc4150605
```

If shared infra is not already applied for the workspace, run this first:

```bash
./scripts/pipeline-deploy.sh --env-file .env.remote --only shared-infra --apply
```

*deploy existing image*

Make sure the image is in the ECR registry and the image tag is set in the .env file.

```bash
export SERVICES_IMAGE_REGISTRY=123456789012.dkr.ecr.us-east-1.amazonaws.com
export SERVICES_IMAGE_NAME=eventpro-api
export SERVICES_IMAGE_TAG=abc4150605
```

```bash
./scripts/pipeline-deploy.sh \
  --env-file .env.remote \
  --only services \
  --services-image-source existing \
  --apply
```

</details>

---

<details>
<summary>frontend only</summary>

*build and deploy*

```bash
./scripts/pipeline-deploy.sh --env-file .env.remote --only frontend --apply --image-tag abc4150605
```

*preview terraform changes only (no S3 sync / CloudFront invalidation in plan mode)*

```bash
./scripts/pipeline-deploy.sh --env-file .env.remote --only frontend --plan
```

*deploy frontend infra/build, but skip asset sync and/or invalidation (apply mode)*

```bash
./scripts/pipeline-deploy.sh \
  --env-file .env.remote \
  --only frontend \
  --no-frontend-sync \
  --no-frontend-invalidate \
  --apply
```

Notes:
- `DOMAIN_NAME` is required (loaded from `.env.remote` via `--env-file .env.remote`).
- `VITE_API_BASE_URL` is optional; if omitted the script uses `https://<workspace>-api.$DOMAIN_NAME`.
- Frontend reads the CloudFront certificate and hosted zone from `shared-infra/terraform.tfstate`.
- The script runs **`npm ci` inside `eventpro-frontend/`** (not the repo root). Dependencies must resolve from the public npm registry. Do not list **unpublished** packages (for example a local workspace name like `@eventpro/shared`) unless you publish them or replace them with `file:` paths that exist in the deploy context.
- `eventpro-frontend/.npmrc` sets **`legacy-peer-deps=true`** so `npm ci` succeeds with React 19 while some UI libraries still declare React 18 peer ranges (this matches older npm’s peer resolution).

</details>

---

<details>
<summary>lambdas only</summary>

*build and deploy all lambdas*

```bash
./scripts/pipeline-deploy.sh --env-file .env.remote --only lambdas --apply --image-tag abc4150605
```

*deploy only specific lambdas*

```bash
./scripts/pipeline-deploy.sh \
  --env-file .env.remote \
  --only lambdas \
  --lambdas order-processor,payment-processor \
  --apply --image-tag abc4150605
```

*deploy existing images (all lambdas)*

Make sure the images already exist in ECR and the image tags are set in your environment (or `.env.remote`).

```bash
export ORDER_PROCESSOR_IMAGE_REGISTRY=123456789012.dkr.ecr.us-east-1.amazonaws.com
export ORDER_PROCESSOR_IMAGE_NAME=eventpro-order-processor
export ORDER_PROCESSOR_IMAGE_TAG=sha-123456789012

export PAYMENT_PROCESSOR_IMAGE_REGISTRY=123456789012.dkr.ecr.us-east-1.amazonaws.com
export PAYMENT_PROCESSOR_IMAGE_NAME=eventpro-payment-processor
export PAYMENT_PROCESSOR_IMAGE_TAG=sha-123456789012

export NOTIFICATION_SENDER_IMAGE_REGISTRY=123456789012.dkr.ecr.us-east-1.amazonaws.com
export NOTIFICATION_SENDER_IMAGE_NAME=eventpro-notification-sender
export NOTIFICATION_SENDER_IMAGE_TAG=sha-123456789012
```

```bash
./scripts/pipeline-deploy.sh \
  --env-file .env.remote \
  --only lambdas \
  --lambdas-image-source existing \
  --apply --image-tag abc4150605
```

*mix build + existing image sources per lambda (example)*

```bash
./scripts/pipeline-deploy.sh \
  --env-file .env.remote \
  --only lambdas \
  --order-processor-image-source existing \
  --payment-processor-image-source build \
  --notification-sender-image-source build \
  --apply --image-tag abc4150605
```

Notes:
- Lambdas read queues, database outputs, subnets, and security groups from `shared-infra/terraform.tfstate`.
- `payment-processor` requires `STRIPE_SECRET_KEY`.
- `notification-sender` uses `SES_SENDER_EMAIL` when set.
- `--lambdas` accepts: `order-processor`, `payment-processor`, `notification-sender`.
- In **build** mode, `--image-tag` (or per-lambda `--*-image-tag`) supplies the tag used for the Docker build and for Terraform. If you have a local `backend/lambdas/*/terraform/terraform.tfvars` (often gitignored) with placeholders such as `image_tag = "REPLACE_ME"`, that file used to override `TF_VAR_*` and could break deploys; the script now passes matching values via `terraform plan` / `apply` **`-var=...`**, which takes precedence over `terraform.tfvars`.

</details>

---

</details>

---

**Happy Coding! 🎉**
