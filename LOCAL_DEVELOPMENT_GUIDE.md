# Local Development Guide

Complete guide for setting up and running the EventPro application locally using Make commands.

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

# Step 2: Add JWT keys to .env (required for backend auth)
# See "Step 2: Configure JWT Keys" below

# Step 3: Start application services (backend + frontend)
# Lambda functions are already running via LocalStack
make local-up
```

**Important Notes:**

- **You don't need to build Lambda images separately** - `make local-infra` automatically builds them for local development
- **No AWS credentials needed for Lambda builds** - The build script detects local development mode and uses local image tags (e.g., `eventpro-order-processor:latest`) instead of ECR tags
- **Don't set `AWS_ACCOUNT_ID`** unless you're actually deploying to AWS - see Prerequisites section for details
- **JWT keys are required** for backend auth - add them to `.env` after `make local-infra` (see Step 2)

**That's it!** Your application is now running:

- **Frontend**: <http://localhost:5173>
- **Backend API**: <http://localhost:8080>
- **Backend Health**: <http://localhost:8080/actuator/health>
- **Swagger UI**: <http://localhost:8080/swagger-ui/index.html>
- **LocalStack**: <http://localhost:4566>

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
   - `frontend/.env.local` (frontend configuration)

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
openssl genpkey -algorithm RSA -out jwt-private.pem -pkeyopt rsa_keygen_bits:2048
openssl rsa -in jwt-private.pem -pubout -out jwt-public.pem
```

**Convert to single-line base64 (DER format, recommended for .env):**

```bash
# macOS
JWT_PRIVATE_KEY=$(openssl pkcs8 -topk8 -inform PEM -outform DER -in jwt-private.pem -nocrypt | base64 | tr -d '\n')
JWT_PUBLIC_KEY=$(openssl rsa -in jwt-private.pem -pubout -outform DER | base64 | tr -d '\n')

# Linux
JWT_PRIVATE_KEY=$(openssl pkcs8 -topk8 -inform PEM -outform DER -in jwt-private.pem -nocrypt | base64 -w0)
JWT_PUBLIC_KEY=$(openssl rsa -in jwt-private.pem -pubout -outform DER | base64 -w0)
```

**Add to `.env`:**

```bash
JWT_ISSUER=eventpro
JWT_ACCESS_TTL_SECONDS=3600
JWT_PRIVATE_KEY=<value from command above>
JWT_PUBLIC_KEY=<value from command above>
```

**Note:** The backend accepts PEM or base64 DER keys. Base64 DER is recommended for single-line `.env` values.

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

**Wait time:** ~30 seconds for services to start

**Verify services are running:**

```bash
# Check all services
docker-compose ps

# Test backend health
curl http://localhost:8080/actuator/health

# Check frontend
curl http://localhost:5173
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

1. Navigate to Sign Up: <http://localhost:5173/signup>
2. Create a new account
3. Sign in with your credentials (email verification is disabled in local dev)

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

### Issue: "JWT keys are not set"

**Solution:**

1. Check if `.env` file exists: `cat .env`
2. If missing, run: `make local-infra`
3. Add JWT keys and restart backend (see "Step 2: Configure JWT Keys")

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

- **Missing JWT keys**: `JWT_PUBLIC_KEY` and `JWT_PRIVATE_KEY` are REQUIRED. The application will fail to start without them.
- **Database connection**: Verify `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` are set in docker-compose.yml (they are by default).

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
cat frontend/.env.local | grep VITE_API_BASE_URL
# Should be: VITE_API_BASE_URL=http://localhost:8080

# Restart frontend
make start-frontend
```

### Issue: Services won't start (container conflicts)

**Solution:**

```bash
# Stop all services
make local-down

# Clean everything
make local-clean

# Start fresh
make local-infra
make local-up
```

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
   docker network inspect eventpro-site_eventpro
   # Should show postgres, localstack, backend, frontend containers
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

- `DB_HOST=postgres` (PostgreSQL container name)
- `DB_PORT=5432`
- `DB_NAME=eventpro`
- `DB_USERNAME=eventpro`
- `DB_PASSWORD=eventpro`

**Important:** The local profile does NOT use AWS Secrets Manager for database credentials. It reads directly from environment variables, making local development simpler and faster.

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
- **JWT keys** (`JWT_PUBLIC_KEY`, `JWT_PRIVATE_KEY`) are REQUIRED and must be in `.env` file
- **Stripe secrets** can be set via environment variables or use defaults from `application-local.yml`
- **Lambda functions** connect to PostgreSQL using `postgres:5432` (Docker network hostname). If Lambda functions cannot connect, check that LocalStack is on the same Docker network as PostgreSQL.

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

Created automatically by `make local-infra`. Add JWT keys manually after generation. Contains:

- `JWT_ISSUER` - JWT issuer (optional, defaults to eventpro)
- `JWT_ACCESS_TTL_SECONDS` - JWT access token TTL in seconds (optional)
- `JWT_PUBLIC_KEY` - JWT public key (REQUIRED)
- `JWT_PRIVATE_KEY` - JWT private key (REQUIRED)
- `S3_BUCKET_NAME` - S3 bucket for images
- `ORDER_QUEUE_URL` - SQS order queue URL
- `PAYMENT_QUEUE_URL` - SQS payment queue URL
- `NOTIFICATION_QUEUE_URL` - SQS notification queue URL

**Note:** Database credentials (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`) are set directly in `docker-compose.yml` and do not need to be in `.env`. The local profile uses `LocalDataSourceConfig` which reads these environment variables - it does NOT use Secrets Manager.

### Frontend Environment (`frontend/.env.local`)

Created automatically by `make local-infra`. Contains:

- `VITE_API_BASE_URL` - Backend API URL
- `VITE_AWS_REGION` - AWS region
- `VITE_S3_BUCKET_NAME` - S3 bucket name
- `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (optional, for payment features)

**Note:** These files are automatically generated. Manual edits may be overwritten when running `make local-infra`. Re-add JWT keys after regenerating `.env`. To add Stripe key, either:

1. Add it to the root `.env` file before running `make local-infra`, or
2. Manually add it to `frontend/.env.local` after running `make local-infra`

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
   - Frontend: `frontend/src/`
   - Lambda functions: `backend/lambdas/`

3. **Check Documentation:**
   - Environment Variables: `docs/VARIABLES.md`
   - Lambda Deployment: `docs/LAMBDA_DEPLOYMENT.md`
   - Local Environment Services: `docs/LOCAL_ENVIRONMENT_SERVICES.md`

---

## 💡 Tips

- **Hot Reload:** Backend and frontend support hot reload. Changes are automatically reflected.
- **Database Migrations:** Run automatically on backend startup via Flyway.
- **Database Configuration:** Local profile uses `LocalDataSourceConfig` which reads `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` from environment variables (set in docker-compose.yml). It does NOT use Secrets Manager.
- **Lambda Functions:** Managed by LocalStack and automatically triggered by SQS event source mappings. No manual invocation needed. Lambda functions use Secrets Manager for database credentials (different from backend API).
- **JWT Auth:** Backend uses RS256 keys from `.env`. Update `JWT_PUBLIC_KEY`/`JWT_PRIVATE_KEY` and restart backend if you rotate keys.
- **LocalStack:** Emulates AWS services locally. All SQS, S3, Secrets Manager, and Lambda operations go through LocalStack.
- **Secrets Manager:** Used by Lambda functions for database credentials. Backend API (local profile) uses environment variables directly, not Secrets Manager.

---

## 🆘 Getting Help

If you encounter issues:

1. **Check service logs:** `docker-compose logs -f [service-name]`
2. **Verify environment variables:** See "Check Environment Variables" above
3. **Review troubleshooting section:** See "Troubleshooting" above
4. **Check service status:** `docker-compose ps`
5. **Clean and restart:** `make local-clean && make local-infra && make local-up`
6. **Verify Lambda functions:** `make local-lambda-status`
7. **Check event source mappings:** `make local-event-mappings`

---

## 📚 Additional Resources

- **Environment Variables:** See `docs/VARIABLES.md` for complete variable reference
- **Lambda Functions:** See `docs/LAMBDA_DEPLOYMENT.md` for lambda deployment details
- **Local Services:** See `docs/LOCAL_ENVIRONMENT_SERVICES.md` for service architecture
- **Project Structure:** See project README for architecture overview

---

**Happy Coding! 🎉**
