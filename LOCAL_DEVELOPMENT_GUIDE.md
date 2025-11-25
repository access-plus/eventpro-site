# Local Development Guide

Complete guide for setting up, running, and testing the EventPro application locally.

**Note**: This project has been reorganized. The new structure is:
- `backend/services/` - Spring Boot modular monolith (was `backend/`)
- `backend/lambdas/` - Lambda functions (was `lambdas/`)
- `backend/shared/` - Shared entities and DTOs (was `shared/`)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [One by One Setup](#one-by-one-setup)
4. [Detailed Setup](#detailed-setup)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)
7. [Clean Up](#clean-up)
8. [Useful Commands](#useful-commands)

---

## Prerequisites

1. **Docker & Docker Compose** installed and running
2. **Terraform 1.5+** installed
3. **Node.js 22+** (if running frontend directly)
4. **Java 21** (if running backend services or lambdas directly)
5. **Gradle 9.2+** (or use the Gradle wrapper included in each project)
6. **AWS CLI** (optional, for testing LocalStack resources)
7. **AWS Account with Credentials** (required for Cognito)
   - Cognito is created in real AWS (not LocalStack)
   - Configure AWS credentials using one of these methods:
     - Set `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` environment variables, OR
     - Run `aws configure` to set up credentials
   - Terraform will automatically create Cognito User Pool and Client in your AWS account
   - See [Setting Up Cognito Credentials](#setting-up-cognito-credentials) for details

### Project Structure

```txt
eventpro-site/
├── backend/
│   ├── services/          # Spring Boot modular monolith
│   │   ├── modules/       # Individual service modules
│   │   ├── build.gradle
│   │   └── settings.gradle
│   ├── lambdas/           # AWS Lambda functions
│   │   ├── order-processor/
│   │   ├── payment-processor/
│   │   ├── notification-sender/
│   │   └── secret-rotation/
│   └── shared/            # Shared entities, enums, DTOs
├── frontend/              # React frontend
└── infrastructure/        # Terraform configurations
```

---

## Quick Start

<details>
<summary>Click to expand</summary>

### Option 1: Using Make Commands (Recommended)

```bash
# Step 1: Provision infrastructure (LocalStack resources)
make local-infra

# Step 2: Set Cognito credentials (if not created by Terraform)
# If using LocalStack Community Edition, you'll need to provide Cognito credentials
# from your AWS account. See "Setting Up Cognito Credentials" section below.

# Step 3: Start all services
make local-up
```

**Important**: After `make local-infra`, check if Cognito credentials were set. If you see a warning about missing Cognito credentials:

1. **Create a Cognito User Pool in your AWS account** (if you don't have one)
2. **Edit `.env` file** and add:

   ```bash
   COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
   COGNITO_CLIENT_ID=your-client-id
   ```

3. **Edit `frontend/.env.local`** and add:

   ```bash
   VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
   VITE_COGNITO_CLIENT_ID=your-client-id
   ```

**Then** the application will be available at:

- **Frontend**: <http://localhost:5173>
- **Backend API**: <http://localhost:8080>
- **Health Check**: <http://localhost:8080/actuator/health>

### Option 2: Manual Setup

See [Detailed Setup](#detailed-setup) section below.

</details>

## Detailed Setup

<details>
<summary>Click to expand</summary>

### Step 1: Start Infrastructure Services

```bash
make start-pg-and-localstack
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

- Cognito credentials are **REQUIRED** for local development
- If Terraform outputs are null (LocalStack Community Edition), you must provide Cognito credentials from your AWS account
- Backend uses `application-local.yml` which requires `COGNITO_USER_POOL_ID` and `COGNITO_CLIENT_ID`
- Frontend requires `VITE_COGNITO_USER_POOL_ID` and `VITE_COGNITO_CLIENT_ID` environment variables

#### Setting Up Cognito Credentials

<details>
<summary>Click to expand</summary>

**Using Real AWS Cognito**

Terraform will automatically create Cognito resources in your real AWS account. You just need to configure AWS credentials:

1. **Configure AWS Credentials** (choose one method):

   **Method A: Environment Variables**

   ```bash
   export AWS_ACCESS_KEY_ID=your-access-key
   export AWS_SECRET_ACCESS_KEY=your-secret-key
   export AWS_REGION=us-east-1
   ```

   **Method B: AWS CLI Configuration**

   ```bash
   aws configure
   # Enter your Access Key ID, Secret Access Key, and Region
   ```

2. **Run `make local-infra`**:
   - Terraform will create Cognito User Pool and Client in your AWS account
   - Cognito credentials will be automatically added to `.env` and `frontend/.env.local`

3. **Verify Cognito was created**:

   ```bash
   # Check .env file
   cat .env | grep COGNITO
   
   # Or check Terraform outputs
   cd infrastructure/environments/local
   terraform output cognito_user_pool_id
   terraform output cognito_user_pool_client_id
   ```

**Note**: If Terraform fails to create Cognito (e.g., missing AWS credentials), you can still create it manually in the AWS Console and add the credentials to `.env` and `frontend/.env.local`.

</details>

---

### Step 4: Start Backend

**Important**: The `.env` file must exist before starting the backend. If you skipped Step 2, run `make local-infra` first.

```bash
# Using Make (recommended - automatically uses .env file)
make local-up

# OR manually with docker-compose (requires .env file)
make start-backend
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
make start-frontend
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

### Test 1: Sign In

1. **Open Frontend**: <http://localhost:5173>
2. **Navigate to Login**: Click "Sign In" or go to <http://localhost:5173/login>
3. **Enter credentials** (use a user from your Cognito User Pool):
   - Email: `your-email@example.com`
   - Password: `your-password`
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

### Test 2: Sign Up

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
   - ✅ User created in Cognito User Pool
   - ✅ Email verification sent (check your email)

**Note**: Users are created in your Cognito User Pool. Email verification is required before signing in.

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

## Troubleshooting

<details>
<summary>Click to expand</summary>

### Issue: Frontend Shows "Cognito configuration is missing"

**Symptoms**: Frontend error about missing Cognito config

**Solution**:

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
2. **Check CORS configuration** in `backend/services/modules/eventpro-api/src/main/resources/application-local.yml`
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

**Solution**:

```bash
# Verify Cognito credentials are set
docker-compose exec backend env | grep COGNITO

# Check backend logs for Cognito configuration
docker-compose logs backend | grep -i "cognito"

# Verify Cognito User Pool exists and is accessible
# Check that COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID are correct

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
terraform output -raw cognito_user_pool_id  # null if LocalStack Community Edition

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

### Building Services and Lambdas

```bash
# Build backend services
cd backend/services
./gradlew clean build

# Build a specific Lambda (example: order-processor)
cd backend/lambdas/order-processor
./gradlew clean build

# Build shared module
cd backend/shared
./gradlew clean build

# Run backend services locally (without Docker)
cd backend/services
./gradlew :eventpro-api:bootRun
# Or use the script:
./run-backend-local.sh
```

</details>

## Expected Test Results

After completing all tests, you should verify:

✅ **Sign In**: User authenticated, tokens stored  
✅ **Sign Up**: User created in Cognito User Pool  
✅ **Email Verification**: Verification email sent  
✅ **Auto-Sync**: User synced to database automatically  
✅ **Profile View**: User profile loads successfully  
✅ **Profile Update**: Profile updates work  
✅ **Page Refresh**: Auth state persists  
✅ **Token Refresh**: Tokens refresh automatically  

---

## Deploying to Higher Environments

<details>
<summary>Click to expand</summary>

When deploying to **dev**, **staging**, or **production** environments, ensure Cognito credentials are properly configured.

### Backend Configuration

**Important**: The `application-local.yml` file (located at `backend/services/modules/eventpro-api/src/main/resources/application-local.yml`) is **only used when `SPRING_PROFILES_ACTIVE=local`**.

**For higher environments:**

#### Option 1: Don't Set SPRING_PROFILES_ACTIVE (Simplest - Recommended)

**Just provide Cognito credentials** - that's it! The application will automatically use Cognito:

```bash
COGNITO_USER_POOL_ID=your-actual-pool-id
COGNITO_CLIENT_ID=your-actual-client-id
AWS_REGION=us-east-1
# Don't set SPRING_PROFILES_ACTIVE (or set it to 'prod', 'dev', etc. - anything except 'local')
```

#### Option 2: Set SPRING_PROFILES_ACTIVE

If you want to use a specific profile:

```bash
SPRING_PROFILES_ACTIVE=prod  # or dev, staging, etc. (anything except 'local')
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
  - COGNITO_USER_POOL_ID=${COGNITO_USER_POOL_ID}
  - COGNITO_CLIENT_ID=${COGNITO_CLIENT_ID}
  - AWS_REGION=us-east-1
  # Do NOT set AWS_ENDPOINT_URL (removes LocalStack endpoint)
```

**Example for ECS/EC2:**

```bash
export SPRING_PROFILES_ACTIVE=prod
export COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
export COGNITO_CLIENT_ID=your-client-id
export AWS_REGION=us-east-1
```

### Frontend Configuration

**Provide Cognito credentials**:

```bash
VITE_COGNITO_USER_POOL_ID=your-actual-pool-id
VITE_COGNITO_CLIENT_ID=your-actual-client-id
VITE_AWS_REGION=us-east-1
```

**Example for build process:**

```bash
# Build frontend with production environment variables
VITE_COGNITO_USER_POOL_ID=${COGNITO_USER_POOL_ID} \
VITE_COGNITO_CLIENT_ID=${COGNITO_CLIENT_ID} \
VITE_AWS_REGION=us-east-1 \
VITE_API_BASE_URL=https://api.yourdomain.com \
npm run build
```

### How It Works

- **Local Development**: `application-local.yml` is loaded when `SPRING_PROFILES_ACTIVE=local`
  - Cognito credentials are required (from LocalStack Pro or real AWS account)
  - LocalStack endpoints are configured for S3, SQS, Secrets Manager

- **Higher Environments**: Use `application.yml` (default) or environment-specific profiles
  - Cognito credentials are required
  - No LocalStack endpoints → Real AWS services are used

### Verification Checklist

Before deploying to higher environments, verify:

- ✅ Cognito credentials are provided (backend: `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`)
- ✅ Cognito credentials are provided (frontend: `VITE_COGNITO_USER_POOL_ID`, `VITE_COGNITO_CLIENT_ID`)
- ✅ No LocalStack endpoints configured
- ✅ AWS credentials/permissions are configured
- ✅ Cognito User Pool exists and is accessible
- ✅ Cognito User Pool Client is configured correctly

### Troubleshooting Higher Environments

**Issue**: Cognito authentication not working

**Solution**:

```bash
# Verify Cognito credentials are set
echo $COGNITO_USER_POOL_ID
echo $COGNITO_CLIENT_ID
# Should output: your-pool-id and your-client-id

# Check Spring profile
echo $SPRING_PROFILES_ACTIVE
# Should NOT be "local" (or should be explicitly set to prod/dev/staging)

# Check backend logs
# Should see: "CognitoConfig" loading
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
# Backend services tests
cd backend/services
./gradlew test

# Lambda tests (example: order-processor)
cd backend/lambdas/order-processor
   ./gradlew test

   # Frontend tests
   cd frontend
   npm test
   ```

2. **Check code coverage**:

   ```bash
cd backend/services
   ./gradlew test jacocoTestReport
   ```

3. **Review authentication implementation**: Authentication uses AWS Cognito. Ensure Cognito credentials are properly configured.

4. **Prepare for deployment**: Follow the "Deploying to Higher Environments" section above

</details>

## Support

<details>
<summary>Click to expand</summary>

If you encounter issues:

1. **Check service logs**: `docker-compose logs -f`
2. **Verify environment variables**:
   - Backend: `docker-compose exec backend env | grep -E "COGNITO"`
   - Frontend: `cat frontend/.env.local | grep -E "COGNITO"`
3. **Check service health**: `docker-compose ps`
4. **Review this guide's troubleshooting section**
5. **Verify Cognito credentials**: Ensure `COGNITO_USER_POOL_ID` and `COGNITO_CLIENT_ID` are set correctly

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

| Cognito Configuration |
| -------------------- |
| User Pool ID: Set in `.env` |
| Client ID: Set in `.env` |
| Note: Create users in your Cognito User Pool |
| Role: `USER`                  |

</details>
