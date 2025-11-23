# Local Development Guide

Complete guide for setting up, running, and testing the EventPro application locally.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Authentication Modes](#authentication-modes)
4. [One by One Setup](#one-by-one-setup)
5. [Detailed Setup](#detailed-setup)
6. [Testing](#testing)
7. [Manual Setup (Alternative)](#manual-setup-alternative)
8. [Troubleshooting](#troubleshooting)
9. [Clean Up](#clean-up)
10. [Useful Commands](#useful-commands)

---

## Prerequisites

1. **Docker & Docker Compose** installed and running
2. **Terraform 1.5+** installed
3. **Node.js 22+** (if running frontend directly)
4. **Java 21** (if running backend directly)
5. **AWS CLI** (optional, for testing LocalStack resources)

---

## Quick Start

<details>
<summary>Click to expand</summary>

### Option 1: Using Make Commands (Recommended)

```bash
# Step 1: Provision infrastructure (LocalStack resources)
make local-infra

# Step 2: Start all services
make local-up
```

**That's it!** The application will be available at:

- **Frontend**: <http://localhost:5173>
- **Backend API**: <http://localhost:8080>
- **Health Check**: <http://localhost:8080/actuator/health>

### Option 2: Manual Setup

See [Detailed Setup](#detailed-setup) section below.

</details>

## Authentication Modes

<details>
<summary>Click to expand</summary>

The application supports two authentication modes for local development:

### Mode 1: Mock Authentication (Default - Recommended)

**No Cognito required!** Works with LocalStack Community Edition (free).

- **Backend**: Uses mock JWT decoder (`LOCAL_AUTH_ENABLED=true` by default)
- **Frontend**: Uses mock auth service (when Cognito env vars are missing)
- **Default Test User**:
  - Email: `dev@local.test`
  - Password: `password123`
  - Role: `USER`

**Benefits:**

- ✅ No LocalStack Pro required
- ✅ No AWS account needed
- ✅ Faster startup
- ✅ Works identically to production (same JWT structure)

### Mode 2: Real Cognito (Optional)

Requires LocalStack Pro or real AWS account.

- **Backend**: Set `LOCAL_AUTH_ENABLED=false` and provide `COGNITO_USER_POOL_ID`
- **Frontend**: Set `VITE_LOCAL_AUTH_ENABLED=false` and provide Cognito credentials
- **Terraform**: Set `enable_cognito=true` when provisioning

**When to use:**

- Testing Cognito-specific features
- Validating Cognito integration
- Pre-production testing

</details>

## One by One Setup

<details>
<summary>Click to expand</summary>

This section provides step-by-step instructions for starting services individually with separate environment files for better control and clarity.

### Step 1: Start LocalStack

```bash
docker-compose up -d localstack
```

**Wait**: ~10 seconds for LocalStack to be healthy

**Verify:**

```bash
docker-compose ps localstack
# Should show "healthy"
```

---

### Step 2: Start PostgreSQL

```bash
docker-compose up -d postgres
```

**Wait**: ~10 seconds for PostgreSQL to be healthy

**Verify:**

```bash
docker-compose ps postgres
# Should show "healthy"
```

---

### Step 3: Provision Infrastructure (Terraform)

```bash
cd infrastructure/environments/local
terraform init -upgrade
terraform apply -auto-approve
cd ../../..
```

**What this creates:**

- S3 buckets (for images)
- SQS queues (order, payment, notification)
- Secrets Manager secrets (database, JWT, Stripe)
- Cognito User Pool (only if `enable_cognito=true`)

**Expected output:**

```txt
Apply complete! Resources: X added, 0 changed, 0 destroyed.

Outputs:
sqs_order_queue_url = "http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/order-queue"
sqs_payment_queue_url = "http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/payment-queue"
sqs_notification_queue_url = "http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/notification-queue"
s3_images_bucket_name = "eventpro-images-local"
```

---

### Step 4: Create Backend Environment File

Create `.env.backend` file with backend-specific environment variables:

```bash
cd infrastructure/environments/local
cat > ../../.env.backend << EOF
# AWS Configuration
AWS_ENDPOINT_URL=http://localhost:4566
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test

# SQS Queue URLs
ORDER_QUEUE_URL=$(terraform output -raw sqs_order_queue_url)
PAYMENT_QUEUE_URL=$(terraform output -raw sqs_payment_queue_url)
NOTIFICATION_QUEUE_URL=$(terraform output -raw sqs_notification_queue_url)

# S3 Configuration
S3_BUCKET_NAME=$(terraform output -raw s3_images_bucket_name)

# Cognito Configuration (empty for mock auth, or set if using real Cognito)
COGNITO_USER_POOL_ID=$(terraform output -raw cognito_user_pool_id 2>/dev/null | grep -v "^null$" || echo "")
COGNITO_CLIENT_ID=$(terraform output -raw cognito_user_pool_client_id 2>/dev/null | grep -v "^null$" || echo "")

# Local Auth (set to false if using real Cognito)
LOCAL_AUTH_ENABLED=true
EOF
cd ../../..
```

**Verify the file:**

```bash
cat .env.backend
```

Should contain:

```txt
AWS_ENDPOINT_URL=http://localhost:4566
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
ORDER_QUEUE_URL=http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/order-queue
PAYMENT_QUEUE_URL=http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/payment-queue
NOTIFICATION_QUEUE_URL=http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/notification-queue
S3_BUCKET_NAME=eventpro-images-local
COGNITO_USER_POOL_ID=
COGNITO_CLIENT_ID=
LOCAL_AUTH_ENABLED=true
```

---

### Step 5: Create Frontend Environment File

Create `.env.frontend` file with frontend-specific environment variables:

```bash
cd infrastructure/environments/local
cat > ../../.env.frontend << EOF
# API Configuration
VITE_API_BASE_URL=http://localhost:8080

# Cognito Configuration (empty for mock auth, or set if using real Cognito)
VITE_COGNITO_USER_POOL_ID=$(terraform output -raw cognito_user_pool_id 2>/dev/null | grep -v "^null$" || echo "")
VITE_COGNITO_CLIENT_ID=$(terraform output -raw cognito_user_pool_client_id 2>/dev/null | grep -v "^null$" || echo "")

# AWS Configuration
VITE_AWS_REGION=us-east-1
VITE_S3_BUCKET_NAME=$(terraform output -raw s3_images_bucket_name)

# Local Auth (optional - frontend auto-detects when Cognito credentials are empty)
VITE_LOCAL_AUTH_ENABLED=true
EOF
cd ../../..
```

**Verify the file:**

```bash
cat .env.frontend
```

Should contain:

```txt
VITE_API_BASE_URL=http://localhost:8080
VITE_COGNITO_USER_POOL_ID=
VITE_COGNITO_CLIENT_ID=
VITE_AWS_REGION=us-east-1
VITE_S3_BUCKET_NAME=eventpro-images-local
VITE_LOCAL_AUTH_ENABLED=true
```

---

### Step 6: Start Backend

```bash
docker-compose --env-file .env.backend up -d backend
```

**What it does:**

- Reads environment variables from `.env.backend` file
- Starts Spring Boot backend with `SPRING_PROFILES_ACTIVE=local`
- **Flyway migrations run automatically** during startup
- Backend available at <http://localhost:8080>

**Wait**: ~30 seconds for backend to start and migrations to complete

**Verify:**

```bash
# Check health
curl http://localhost:8080/actuator/health

# Check migrations
docker-compose logs backend | grep -i flyway
# Should see: "Flyway migration successful"

# Check environment variables are loaded
docker-compose exec backend env | grep -E "ORDER_QUEUE_URL|PAYMENT_QUEUE_URL|NOTIFICATION_QUEUE_URL"
# Should show the queue URLs from .env.backend file
```

---

### Step 7: Start Frontend

```bash
docker-compose --env-file .env.frontend up -d frontend
```

**What it does:**

- Reads environment variables from `.env.frontend` file
- Starts React dev server with hot reload
- Frontend available at <http://localhost:5173>

**Wait**: ~10 seconds for frontend to start

**Verify:**

```bash
curl http://localhost:5173
# Should return HTML

# Check frontend environment variables
docker-compose exec frontend env | grep VITE_
# Should show frontend configuration from .env.frontend
```

---

### Benefits of This Approach

✅ **Clear separation**: Backend and frontend configurations are in separate files  
✅ **Explicit control**: You know exactly which file each service uses  
✅ **Easy debugging**: Easy to verify which variables are loaded  
✅ **Flexible**: Can easily switch between different configurations  

### Command Reference

```bash
# Start infrastructure
docker-compose up -d localstack postgres

# Provision resources
cd infrastructure/environments/local && terraform apply -auto-approve && cd ../../..

# Create env files (see steps 4-5 above)

# Start services
docker-compose --env-file .env.backend up -d backend
docker-compose --env-file .env.frontend up -d frontend

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down
```

</details>

## Detailed Setup

<details>
<summary>Click to expand</summary>

### Step 1: Start Infrastructure Services

```bash
docker-compose up -d postgres localstack
```

**What it does:**

- Starts PostgreSQL database (port 5432)
- Starts LocalStack AWS emulator (port 4566)

**Wait**: ~10 seconds for services to be healthy

**Verify:**

```bash
docker-compose ps
# Both services should show "healthy"
```

---

### Step 2: Provision AWS Resources (Terraform) and Create Environment Files

**Important**: This step creates the `.env` file with all required configuration values (SQS queue URLs, S3 bucket name, Cognito credentials if enabled).

**Option A: Using Make (Recommended)**

```bash
make local-infra
```

This command:

1. Starts LocalStack if not running
2. Provisions Terraform resources (S3, SQS, Secrets Manager, optional Cognito)
3. **Automatically creates `.env` file** with all required values:
   - `ORDER_QUEUE_URL`
   - `PAYMENT_QUEUE_URL`
   - `NOTIFICATION_QUEUE_URL`
   - `S3_BUCKET_NAME`
   - `COGNITO_USER_POOL_ID` (if Cognito enabled)
   - `COGNITO_CLIENT_ID` (if Cognito enabled)
4. **Automatically creates `frontend/.env.local`** with frontend configuration

**Option B: Manual Terraform**

```bash
cd infrastructure/environments/local
terraform init -upgrade
terraform apply -auto-approve
cd ../../..
```

Then manually create `.env` file:

```bash
cd infrastructure/environments/local
cat > ../../.env << EOF
ORDER_QUEUE_URL=$(terraform output -raw sqs_order_queue_url)
PAYMENT_QUEUE_URL=$(terraform output -raw sqs_payment_queue_url)
NOTIFICATION_QUEUE_URL=$(terraform output -raw sqs_notification_queue_url)
S3_BUCKET_NAME=$(terraform output -raw s3_images_bucket_name)
COGNITO_USER_POOL_ID=$(terraform output -raw cognito_user_pool_id)
COGNITO_CLIENT_ID=$(terraform output -raw cognito_user_pool_client_id)
EOF
cd ../../..
```

**What this creates:**

- S3 buckets (for images)
- SQS queues (order, payment, notification)
- Secrets Manager secrets (database, JWT, Stripe)
- Cognito User Pool (only if `enable_cognito=true`)

**Expected output:**

```txt
Apply complete! Resources: X added, 0 changed, 0 destroyed.

Outputs:
sqs_order_queue_url = "http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/order-queue"
sqs_payment_queue_url = "http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/payment-queue"
sqs_notification_queue_url = "http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/notification-queue"
s3_images_bucket_name = "eventpro-images-local"
```

**Note**:

- If using mock auth (default), `cognito_user_pool_id` and `cognito_user_pool_client_id` outputs will be `null`
- The `.env` file is **required** - docker-compose reads from it to configure the backend
- The `frontend/.env.local` file is also created automatically by `make local-infra`

---

### Step 3: Verify Environment Files

**Check `.env` file exists and has required values:**

```bash
cat .env
```

Should contain:

```txt
ORDER_QUEUE_URL=http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/order-queue
PAYMENT_QUEUE_URL=http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/payment-queue
NOTIFICATION_QUEUE_URL=http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/notification-queue
S3_BUCKET_NAME=eventpro-images-local
COGNITO_USER_POOL_ID=
COGNITO_CLIENT_ID=
```

**Check `frontend/.env.local` file:**

```bash
cat frontend/.env.local
```

Should contain:

```txt
VITE_API_BASE_URL=http://localhost:8080
VITE_COGNITO_USER_POOL_ID=
VITE_COGNITO_CLIENT_ID=
VITE_AWS_REGION=us-east-1
VITE_S3_BUCKET_NAME=eventpro-images-local
```

**Note**:

- Empty Cognito values enable mock authentication (default)
- Backend uses `application-local.yml` which has defaults for local development
- Frontend will use mock auth when Cognito env vars are empty

#### For Real Cognito (Optional)

<details>
<summary>Click to expand</summary>

If you want to use real Cognito (requires LocalStack Pro):

1. **Terraform**: Set `enable_cognito=true`:

   ```bash
   cd infrastructure/environments/local
   terraform apply -var="enable_cognito=true" -auto-approve
   ```

2. **Get Cognito values**:

   ```bash
   export COGNITO_USER_POOL_ID=$(terraform output -raw cognito_user_pool_id)
   export COGNITO_CLIENT_ID=$(terraform output -raw cognito_user_pool_client_id)
   ```

3. **Backend**: Set `LOCAL_AUTH_ENABLED=false` and provide Cognito credentials

4. **Frontend**: Update `frontend/.env.local`:

   ```bash
   cat > frontend/.env.local << EOF
   VITE_API_BASE_URL=http://localhost:8080
   VITE_LOCAL_AUTH_ENABLED=false
   VITE_COGNITO_USER_POOL_ID=${COGNITO_USER_POOL_ID}
   VITE_COGNITO_CLIENT_ID=${COGNITO_CLIENT_ID}
   VITE_AWS_REGION=us-east-1
   VITE_S3_BUCKET_NAME=eventpro-images-local
   EOF
   ```

</details>

---

### Step 4: Start Backend

**Important**: The `.env` file must exist before starting the backend. If you skipped Step 2, run `make local-infra` first.

```bash
# Using Make (recommended - automatically uses .env file)
make local-up

# OR manually with docker-compose (requires .env file)
docker-compose --env-file .env up -d backend
```

**What it does:**

- Reads environment variables from `.env` file
- Starts Spring Boot backend with `SPRING_PROFILES_ACTIVE=local`
- **Flyway migrations run automatically** during startup
- Backend available at <http://localhost:8080>
- [swagger-ui](http://localhost:8080/swagger-ui/index.html)
- [actuator-health](http://localhost:8080/actuator/health)

**Wait**: ~30 seconds for backend to start and migrations to complete

**Verify:**

```bash
# Check health
curl http://localhost:8080/actuator/health

# Check migrations
docker-compose logs backend | grep -i flyway
# Should see: "Flyway migration successful"

# Check environment variables are loaded
docker-compose exec backend env | grep -E "ORDER_QUEUE_URL|PAYMENT_QUEUE_URL|NOTIFICATION_QUEUE_URL"
# Should show the queue URLs from .env file
```

**Troubleshooting**: If backend fails to start with "Could not resolve placeholder" errors:

1. Verify `.env` file exists: `cat .env`
2. Verify it contains SQS queue URLs: `grep QUEUE_URL .env`
3. Re-run `make local-infra` to regenerate the file

---

### Step 5: Start Frontend

```bash
# Using Make (recommended)
make local-up
# This starts both backend and frontend

# OR manually
docker-compose up -d frontend
```

**What it does:**

- Reads environment variables from `frontend/.env.local` (created by `make local-infra`)
- Starts React dev server with hot reload
- Frontend available at <http://localhost:5173>

**Wait**: ~10 seconds for frontend to start

**Verify:**

```bash
curl http://localhost:5173
# Should return HTML

# Check frontend environment variables
docker-compose exec frontend env | grep VITE_
# Should show frontend configuration
```

</details>

---

## Testing

<details>
<summary>Click to expand</summary>

### Test 1: Sign In (Mock Auth)

1. **Open Frontend**: <http://localhost:5173>
2. **Navigate to Login**: Click "Sign In" or go to <http://localhost:5173/login>
3. **Enter credentials** (mock auth default user):
   - Email: `dev@local.test`
   - Password: `password123`
4. **Submit**: Click "Sign In"
5. **Expected**:
   - ✅ Successfully authenticated
   - ✅ Redirected to home page
   - ✅ User session stored in localStorage
   - ✅ Redux state updated with user info

**Verify:**

- Check browser DevTools → Application → Local Storage
- Should see: `eventpro_access_token`, `eventpro_id_token`, `eventpro_refresh_token`
- Check Redux DevTools (if installed) → auth state should show user

---

### Test 2: Sign Up (Mock Auth)

1. **Navigate to Sign Up**: Click "Sign up" link or go to <http://localhost:5173/signup>
2. **Fill the form**:
   - First Name: `John`
   - Last Name: `Doe`
   - Email: `john.doe@example.com`
   - Phone Number: `+1234567890` (optional)
   - Password: `Test123!@#` (must meet requirements)
   - Confirm Password: `Test123!@#`
3. **Submit**: Click "Create Account"
4. **Expected**:
   - ✅ Success message
   - ✅ Redirect to login page
   - ✅ User created in mock auth store

**Note**: In mock auth mode, users are stored in-memory in the frontend. No Cognito required.

---

### Test 3: Auto-Sync to Database

After signing in, the user should be automatically synced to the database when accessing the profile.

1. **Navigate to Profile**: <http://localhost:5173/profile>
2. **Expected**:
   - ✅ Profile page loads successfully
   - ✅ User information displayed (email, firstName, lastName, phoneNumber)
   - ✅ No "User not found" errors

**Verify in Database:**

```bash
# Connect to PostgreSQL
docker exec -it postgres psql -U eventpro -d eventpro

# Query users table
SELECT id, email, first_name, last_name, phone_number, cognito_user_id, created_at 
FROM "user" 
ORDER BY created_at DESC;

# Should see your test user
```

**Check Backend Logs:**

```bash
docker-compose logs backend | grep -i "sync\|user"
```

You should see:

```txt
Getting current user profile
User not found in database, syncing from Cognito: cognitoUserId=...
Successfully auto-synced user from Cognito: id=..., email=...
```

---

### Test 4: Profile Update

1. **On Profile page**: Click "Edit Profile"
2. **Update fields**:
   - First Name: `Jane`
   - Last Name: `Smith`
   - Phone Number: `+9876543210`
3. **Save**: Click "Save Changes"
4. **Expected**:
   - ✅ Success message: "Profile updated successfully!"
   - ✅ Changes reflected immediately
   - ✅ Database updated

**Verify:**

```bash
# Check database
docker exec -it postgres psql -U eventpro -d eventpro -c \
  "SELECT first_name, last_name, phone_number FROM \"user\" WHERE email = 'dev@local.test';"
```

---

### Test 5: Auth State Persistence (Page Refresh)

1. **While authenticated**: Refresh the page (F5 or Cmd+R)
2. **Expected**:
   - ✅ User remains authenticated
   - ✅ No redirect to login
   - ✅ User info still displayed
   - ✅ AuthInitializer component restores session

**Verify:**

- Check browser console for errors
- Check Redux state (should still have user)
- Check localStorage (tokens should still be there)

---

### Test 6: Token Refresh

1. **Make API calls**: Navigate to profile, update profile, etc.
2. **Check backend logs** for token validation
3. **Expected**:
   - ✅ Tokens automatically refreshed if expired
   - ✅ No 401 errors
   - ✅ API calls succeed

**Monitor:**

```bash
# Watch backend logs for token-related messages
docker-compose logs -f backend | grep -i "token\|auth\|jwt"
```

</details>

## Manual Setup (Alternative)

<details>
<summary>Click to expand</summary>
If you prefer to run services directly (better for debugging):

### Start Infrastructure Only

```bash
docker-compose up -d postgres localstack
```

### Run Backend Directly

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
export LOCAL_AUTH_ENABLED=true  # Enable mock auth

# Get required values from Terraform
cd infrastructure/environments/local
export S3_BUCKET_NAME=$(terraform output -raw s3_images_bucket_name)
export ORDER_QUEUE_URL=$(terraform output -raw sqs_order_queue_url)
export PAYMENT_QUEUE_URL=$(terraform output -raw sqs_payment_queue_url)
export NOTIFICATION_QUEUE_URL=$(terraform output -raw sqs_notification_queue_url)
cd ../../..

# Run backend
cd backend
./gradlew :eventpro-api:bootRun
```

### Run Frontend Directly

```bash
cd frontend

# Install dependencies (first time only)
npm install

# Ensure .env.local exists (see Step 3 above)
# Start dev server
npm run dev
```

</details>

## Troubleshooting

<details>
<summary>Click to expand</summary>

### Issue: Frontend Shows "Cognito configuration is missing"

**Symptoms**: Frontend error about missing Cognito config

**Solution** (Mock Auth):

```bash
# Verify frontend/.env.local exists and has:
cat frontend/.env.local
# Should have: VITE_LOCAL_AUTH_ENABLED=true
# Should NOT have: VITE_COGNITO_USER_POOL_ID

# Restart frontend
docker-compose restart frontend
```

**Solution** (Real Cognito):

```bash
# Verify Cognito credentials are set
cat frontend/.env.local | grep COGNITO

# Re-run infrastructure provisioning
cd infrastructure/environments/local
terraform apply -var="enable_cognito=true" -auto-approve
cd ../../..
```

---

### Issue: Database Connection Failed

**Symptoms**: Backend logs show "Connection refused" or "Connection timeout"

**Solution**:

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres

# Wait for health check
docker-compose ps postgres  # Should show "healthy"
```

---

### Issue: User Not Syncing to Database

**Symptoms**: Profile page shows "User not found" error

**Solution**:

1. **Check backend logs** for sync errors:

   ```bash
   docker-compose logs backend | grep -i "sync\|createUserFromCognito"
   ```

2. **Verify JWT token contains required claims**:
   - Check backend logs for token claims
   - Ensure email, given_name, family_name are in token

3. **Manually trigger sync**:
   - After signing in, call `POST /api/v1/users/sync` endpoint
   - Or access profile page (triggers auto-sync)

---

### Issue: Frontend Can't Connect to Backend

**Symptoms**: API calls fail with CORS or connection errors

**Solution**:

1. **Check backend is running**: <http://localhost:8080/actuator/health>
2. **Check CORS configuration** in `application-local.yml`
3. **Verify VITE_API_BASE_URL** in `frontend/.env.local`:

   ```bash
   cat frontend/.env.local | grep VITE_API_BASE_URL
   # Should be: VITE_API_BASE_URL=http://localhost:8080
   ```

---

### Issue: LocalStack Resources Not Found

**Symptoms**: Backend errors about missing SQS queues or S3 buckets

**Solution**:

```bash
# Re-provision resources and regenerate .env file
make local-infra

# Verify resources exist
aws --endpoint-url=http://localhost:4566 s3 ls
aws --endpoint-url=http://localhost:4566 sqs list-queues

# Verify .env file has correct values
cat .env | grep QUEUE_URL
```

---

### Issue: Backend Fails with "Could not resolve placeholder" Error

**Symptoms**: Spring Boot startup fails with errors like:

```txt
Could not resolve placeholder 'aws.sqs.orderQueueUrl' in value "${aws.sqs.orderQueueUrl}"
```

**Solution**:

1. **Verify `.env` file exists and has SQS queue URLs**:

   ```bash
   cat .env
   # Should contain ORDER_QUEUE_URL, PAYMENT_QUEUE_URL, NOTIFICATION_QUEUE_URL
   ```

2. **Regenerate `.env` file**:

   ```bash
   make local-infra
   ```

3. **Verify docker-compose is using `.env` file**:

   ```bash
   # Make sure you're using --env-file .env
   docker-compose --env-file .env up -d backend
   
   # OR use make command which does this automatically
   make local-up
   ```

4. **Check environment variables in container**:

   ```bash
   docker-compose exec backend env | grep QUEUE_URL
   # Should show the queue URLs
   ```

---

### Issue: JWT Validation Fails (Backend)

**Symptoms**: 401 Unauthorized errors on API calls

**Solution** (Mock Auth):

```bash
# Verify LOCAL_AUTH_ENABLED is set
docker-compose logs backend | grep -i "local.*auth"

# Check application-local.yml has:
# local.auth.enabled: true

# Restart backend
docker-compose restart backend
```

</details>

## Clean Up

<details>
<summary>Click to expand</summary>

### Stop All Services

```bash
docker-compose down
# Or: make local-down
```

### Clean Up Everything (Including Volumes)

```bash
# Stop and remove containers
docker-compose down -v

# Remove Terraform resources
cd infrastructure/environments/local
terraform destroy -auto-approve
cd ../../..

# Remove .env files (optional)
rm -f .env frontend/.env.local
```

**Warning**: This deletes all data (database, LocalStack resources, etc.)

</details>

## Useful Commands

<details>
<summary>Click to expand</summary>

### Service Management

```bash
# View all service logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f localstack

# Check service status
docker-compose ps

# Restart a specific service
docker-compose restart backend
docker-compose restart frontend
```

### Terraform

```bash
# View Terraform outputs
cd infrastructure/environments/local
terraform output

# View specific output
terraform output -raw s3_images_bucket_name
terraform output -raw cognito_user_pool_id  # null if mock auth

# Re-apply changes
terraform apply -auto-approve
```

### API Testing

```bash
# Test API endpoint directly
curl http://localhost:8080/actuator/health

# Test with authentication (get token from browser localStorage)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8080/api/v1/users/me

# Test LocalStack resources
aws --endpoint-url=http://localhost:4566 s3 ls
aws --endpoint-url=http://localhost:4566 sqs list-queues
aws --endpoint-url=http://localhost:4566 secretsmanager list-secrets
```

### Database

```bash
# Connect to PostgreSQL
docker exec -it postgres psql -U eventpro -d eventpro

# Query users
SELECT id, email, first_name, last_name, cognito_user_id FROM "user";

# Check migrations
SELECT * FROM flyway_schema_history ORDER BY installed_rank DESC;
```

</details>

## Expected Test Results

After completing all tests, you should verify:

✅ **Sign In**: User authenticated, tokens stored  
✅ **Sign Up**: User created (in mock store or Cognito)  
✅ **Auto-Sync**: User synced to database automatically  
✅ **Profile View**: User profile loads successfully  
✅ **Profile Update**: Profile updates work  
✅ **Page Refresh**: Auth state persists  
✅ **Token Refresh**: Tokens refresh automatically  

---

## Deploying to Higher Environments

<details>
<summary>Click to expand</summary>

When deploying to **dev**, **staging**, or **production** environments, you need to disable mock authentication and use real Cognito.

### Backend Configuration

**Important**: The `application-local.yml` file is **only used when `SPRING_PROFILES_ACTIVE=local`**.

**✅ Safe Default Behavior**: If you **don't set `SPRING_PROFILES_ACTIVE`** (or set it to anything other than `local`), the application will:

- Use the base `application.yml` (which doesn't have mock auth config)
- **Automatically use real Cognito** (because `CognitoConfig` has `matchIfMissing = true`)
- **NOT load mock auth** (because `LocalAuthConfig` has `matchIfMissing = false`)

**For higher environments, you have two options:**

#### Option 1: Don't Set SPRING_PROFILES_ACTIVE (Simplest - Recommended)

**Just provide Cognito credentials** - that's it! The application will automatically use real Cognito:

```bash
COGNITO_USER_POOL_ID=your-actual-pool-id
COGNITO_CLIENT_ID=your-actual-client-id
AWS_REGION=us-east-1
# Don't set SPRING_PROFILES_ACTIVE (or set it to 'prod', 'dev', etc. - anything except 'local')
```

#### Option 2: Explicitly Disable Mock Auth

If you want to be explicit, you can also set:

```bash
SPRING_PROFILES_ACTIVE=prod  # or dev, staging, etc. (anything except 'local')
LOCAL_AUTH_ENABLED=false     # Optional - already defaults to false when not in 'local' profile
COGNITO_USER_POOL_ID=your-actual-pool-id
COGNITO_CLIENT_ID=your-actual-client-id
AWS_REGION=us-east-1
```

**Remove LocalStack endpoints** (if any):

- Don't set `AWS_ENDPOINT_URL` (or set it empty)
- The application will use real AWS services

**Example for Docker/Kubernetes:**

```yaml
# docker-compose.yml or kubernetes deployment
environment:
  - SPRING_PROFILES_ACTIVE=dev  # or staging, prod
  - LOCAL_AUTH_ENABLED=false
  - COGNITO_USER_POOL_ID=${COGNITO_USER_POOL_ID}
  - COGNITO_CLIENT_ID=${COGNITO_CLIENT_ID}
  - AWS_REGION=us-east-1
  # Do NOT set AWS_ENDPOINT_URL (removes LocalStack endpoint)
```

**Example for ECS/EC2:**

```bash
export SPRING_PROFILES_ACTIVE=prod
export LOCAL_AUTH_ENABLED=false
export COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
export COGNITO_CLIENT_ID=your-client-id
export AWS_REGION=us-east-1
```

### Frontend Configuration

1. **Set environment variable** to disable mock auth:

   ```bash
   VITE_LOCAL_AUTH_ENABLED=false
   ```

2. **Provide real Cognito credentials**:

   ```bash
   VITE_COGNITO_USER_POOL_ID=your-actual-pool-id
   VITE_COGNITO_CLIENT_ID=your-actual-client-id
   VITE_AWS_REGION=us-east-1
   ```

**Example for build process:**

```bash
# Build frontend with production environment variables
VITE_LOCAL_AUTH_ENABLED=false \
VITE_COGNITO_USER_POOL_ID=${COGNITO_USER_POOL_ID} \
VITE_COGNITO_CLIENT_ID=${COGNITO_CLIENT_ID} \
VITE_AWS_REGION=us-east-1 \
VITE_API_BASE_URL=https://api.yourdomain.com \
npm run build
```

### How It Works

- **Local Development**: `application-local.yml` is loaded when `SPRING_PROFILES_ACTIVE=local`
  - `local.auth.enabled` defaults to `true` → Mock auth is used
  - LocalStack endpoints are configured

- **Higher Environments**: Use `application.yml` (default) or environment-specific profiles
  - `LOCAL_AUTH_ENABLED=false` → Real Cognito is used
  - No LocalStack endpoints → Real AWS services are used

### Verification Checklist

Before deploying to higher environments, verify:

- ✅ `LOCAL_AUTH_ENABLED=false` is set (backend)
- ✅ `VITE_LOCAL_AUTH_ENABLED=false` is set (frontend)
- ✅ Real Cognito credentials are provided
- ✅ No LocalStack endpoints configured
- ✅ AWS credentials/permissions are configured
- ✅ Cognito User Pool exists and is accessible
- ✅ Cognito User Pool Client is configured correctly

### Troubleshooting Higher Environments

**Issue**: Mock auth still being used in production

**Solution**:

```bash
# Verify environment variable is set
echo $LOCAL_AUTH_ENABLED
# Should output: false

# Check Spring profile
echo $SPRING_PROFILES_ACTIVE
# Should NOT be "local"

# Check backend logs
# Should see: "CognitoConfig" loading, NOT "LocalAuthConfig"
```

**Issue**: Cognito authentication fails

**Solution**:

1. Verify Cognito credentials are correct
2. Check AWS IAM permissions
3. Verify Cognito User Pool is in the correct region
4. Check network connectivity to AWS

</details>

## Next Steps

<details>
<summary>Click to expand</summary>

Once local testing is successful:

1. **Run automated tests**:

   ```bash
   # Backend tests
   cd backend
   ./gradlew test

   # Frontend tests
   cd frontend
   npm test
   ```

2. **Check code coverage**:

   ```bash
   cd backend
   ./gradlew test jacocoTestReport
   ```

3. **Review authentication implementation**: See `LOCAL_DEVELOPMENT_AUTH.md` for details on mock auth system

4. **Prepare for deployment**: Follow the "Deploying to Higher Environments" section above

</details>

## Support

<details>
<summary>Click to expand</summary>

If you encounter issues:

1. **Check service logs**: `docker-compose logs -f`
2. **Verify environment variables**:
   - Backend: `docker-compose exec backend env | grep -E "LOCAL_AUTH|COGNITO"`
   - Frontend: `cat frontend/.env.local`
3. **Check service health**: `docker-compose ps`
4. **Review this guide's troubleshooting section**
5. **Check authentication mode**: Verify mock auth is enabled if Cognito is not available

</details>

## Quick Reference

<details>
<summary>Click to expand</summary>

| Service      | URL                                   | Port |
| ------------ | ------------------------------------- | ---- |
| Frontend     | <http://localhost:5173>                 | 5173 |
| Backend API  | <http://localhost:8080>                 | 8080 |
| Health Check | <http://localhost:8080/actuator/health> | 8080 |
| LocalStack   | <http://localhost:4566>                 | 4566 |
| PostgreSQL   | localhost:5432                        | 5432 |

| Default Test User (Mock Auth) |
| ----------------------------- |
| Email: `dev@local.test`       |
| Password: `password123`       |
| Role: `USER`                  |

</details>
