# Testing Guide: Cognito Migration Validation

This guide provides step-by-step procedures for validating the removal of mock authentication and ensuring real AWS Cognito integration works correctly.

## Prerequisites

- AWS Account with Cognito User Pool created
- Cognito User Pool ID and Client ID available
- LocalStack running (for S3, SQS, Secrets Manager)
- PostgreSQL running
- Docker Compose available

---

## T024: Backend Testing

### Test 1: Backend Startup with Cognito Credentials

**Objective**: Verify backend starts successfully with Cognito credentials.

**Steps**:

1. **Set Cognito credentials**:
   ```bash
   export COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
   export COGNITO_CLIENT_ID=your-client-id
   ```

2. **Start infrastructure**:
   ```bash
   make local-infra-only
   make local-infra
   ```

3. **Update `.env` file** with Cognito credentials:
   ```bash
   echo "COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX" >> .env
   echo "COGNITO_CLIENT_ID=your-client-id" >> .env
   ```

4. **Start backend**:
   ```bash
   make local-up
   # OR
   docker-compose --env-file .env up -d backend
   ```

5. **Verify startup**:
   ```bash
   # Check logs for successful startup
   docker-compose logs backend | grep -i "started\|cognito"
   
   # Check health endpoint
   curl http://localhost:8080/actuator/health
   ```

**Expected Results**:
- ✅ Backend starts without errors
- ✅ Logs show "CognitoConfig" loading
- ✅ Health endpoint returns `{"status":"UP"}`
- ✅ No errors about missing Cognito credentials

---

### Test 2: Backend Startup Failure Without Cognito Credentials

**Objective**: Verify backend fails to start if Cognito credentials are missing.

**Steps**:

1. **Remove Cognito credentials from `.env`**:
   ```bash
   # Comment out or remove these lines
   # COGNITO_USER_POOL_ID=
   # COGNITO_CLIENT_ID=
   ```

2. **Try to start backend**:
   ```bash
   docker-compose --env-file .env up -d backend
   ```

3. **Check logs for error**:
   ```bash
   docker-compose logs backend | grep -i "error\|exception\|cognito"
   ```

**Expected Results**:
- ✅ Backend fails to start
- ✅ Error message: "aws.cognito.userPoolId must be configured"
- ✅ `IllegalStateException` thrown in logs

---

### Test 3: CognitoConfig Loading

**Objective**: Verify CognitoConfig bean is created correctly.

**Steps**:

1. **Check Spring context**:
   ```bash
   docker-compose logs backend | grep -i "CognitoConfig\|JwtDecoder\|CognitoIdentityProviderClient"
   ```

2. **Verify JWT decoder configuration**:
   ```bash
   # Check logs for JWK Set URI
   docker-compose logs backend | grep -i "jwks\|jwk"
   ```

**Expected Results**:
- ✅ CognitoConfig bean created
- ✅ JwtDecoder configured with Cognito JWK Set URI
- ✅ CognitoIdentityProviderClient bean created
- ✅ No references to LocalAuthConfig

---

### Test 4: JWT Token Validation

**Objective**: Verify JWT decoder uses Cognito public keys.

**Steps**:

1. **Get a valid Cognito token** (from frontend after sign-in)

2. **Test authentication endpoint**:
   ```bash
   curl -H "Authorization: Bearer YOUR_COGNITO_TOKEN" \
        http://localhost:8080/api/v1/users/me
   ```

3. **Check backend logs**:
   ```bash
   docker-compose logs backend | grep -i "jwt\|token\|validation"
   ```

**Expected Results**:
- ✅ Token validated successfully
- ✅ User information returned
- ✅ No "Invalid token" errors
- ✅ Token signature verified using Cognito public keys

---

## T025: Frontend Testing

### Test 1: Sign Up Flow with Cognito

**Objective**: Verify user can sign up using Cognito.

**Steps**:

1. **Start frontend**:
   ```bash
   make local-up
   # OR
   docker-compose --env-file .env up -d frontend
   ```

2. **Navigate to sign up page**: <http://localhost:5173/signup>

3. **Fill in form**:
   - First Name: `Test`
   - Last Name: `User`
   - Email: `test@example.com`
   - Password: `Test123!@#`
   - Confirm Password: `Test123!@#`

4. **Submit form**

**Expected Results**:
- ✅ Form submits successfully
- ✅ User created in Cognito User Pool
- ✅ Email verification sent
- ✅ Redirected to login page
- ✅ Success message displayed

---

### Test 2: Sign In Flow with Cognito

**Objective**: Verify user can sign in using Cognito.

**Steps**:

1. **Navigate to login page**: <http://localhost:5173/login>

2. **Enter credentials** (after email verification):
   - Email: `test@example.com`
   - Password: `Test123!@#`

3. **Submit form**

**Expected Results**:
- ✅ User authenticated successfully
- ✅ Tokens stored in localStorage
- ✅ Redirected to home page
- ✅ User info displayed

---

### Test 3: Token Storage

**Objective**: Verify tokens are stored correctly.

**Steps**:

1. **After sign in**, open browser DevTools → Application → Local Storage

2. **Check for tokens**:
   - `eventpro_access_token`
   - `eventpro_id_token`
   - `eventpro_refresh_token`

**Expected Results**:
- ✅ All three tokens present
- ✅ Tokens are valid JWT format
- ✅ Tokens contain Cognito claims (sub, email, cognito:groups)

---

### Test 4: API Requests with Cognito Tokens

**Objective**: Verify API requests include Cognito tokens.

**Steps**:

1. **After sign in**, open browser DevTools → Network tab

2. **Make API request** (e.g., navigate to profile page)

3. **Check request headers**:
   - Look for `Authorization: Bearer <token>` header

**Expected Results**:
- ✅ Authorization header present
- ✅ Token included in requests
- ✅ API requests succeed (200 OK)
- ✅ User data returned correctly

---

### Test 5: Token Refresh

**Objective**: Verify token refresh works.

**Steps**:

1. **Wait for token to expire** (or manually trigger refresh)

2. **Make API request**

3. **Check browser console and network tab**

**Expected Results**:
- ✅ Tokens refreshed automatically
- ✅ No 401 errors
- ✅ User remains authenticated

---

### Test 6: Sign Out

**Objective**: Verify sign out clears tokens.

**Steps**:

1. **Sign in** to the application

2. **Click sign out**

3. **Check localStorage**

**Expected Results**:
- ✅ Tokens removed from localStorage
- ✅ User redirected to login page
- ✅ User state cleared

---

### Test 7: Frontend Graceful Failure

**Objective**: Verify frontend fails gracefully if Cognito credentials are missing.

**Steps**:

1. **Remove Cognito credentials from `frontend/.env.local`**:
   ```bash
   # Comment out or remove
   # VITE_COGNITO_USER_POOL_ID=
   # VITE_COGNITO_CLIENT_ID=
   ```

2. **Restart frontend**:
   ```bash
   docker-compose restart frontend
   ```

3. **Open browser console**

**Expected Results**:
- ✅ Frontend shows error message about missing Cognito configuration
- ✅ No crashes or blank pages
- ✅ Clear error message displayed to user

---

## T026: Integration Testing

### End-to-End Authentication Flow

**Objective**: Verify complete authentication flow works end-to-end.

**Steps**:

1. **Sign Up New User**:
   - Navigate to <http://localhost:5173/signup>
   - Create new user account
   - Verify email sent

2. **Verify User in Cognito**:
   ```bash
   # Using AWS CLI
   aws cognito-idp list-users \
     --user-pool-id us-east-1_XXXXXXXXX \
     --filter "email = \"test@example.com\""
   ```

3. **Verify Email Verification Required**:
   - Check email for verification link
   - Click verification link OR verify via Cognito console

4. **Sign In**:
   - Navigate to <http://localhost:5173/login>
   - Sign in with verified credentials

5. **Verify JWT Token**:
   - Check token in browser localStorage
   - Decode token at https://jwt.io
   - Verify signature using Cognito public keys

6. **Make Authenticated API Request**:
   ```bash
   # Get token from browser localStorage
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:8080/api/v1/users/me
   ```

7. **Verify User Data Synced to Database**:
   ```bash
   docker exec -it postgres psql -U eventpro -d eventpro
   SELECT id, email, first_name, last_name, cognito_user_id 
   FROM "user" 
   WHERE email = 'test@example.com';
   ```

8. **Test User Promotion**:
   - As admin, promote user to ORGANIZER role
   - Verify user group updated in Cognito
   - Verify user can access organizer features

**Expected Results**:
- ✅ User created in Cognito
- ✅ Email verification required and works
- ✅ Sign in successful after verification
- ✅ JWT token valid and signed by Cognito
- ✅ API requests authenticated successfully
- ✅ User data synced to database
- ✅ User promotion works correctly

---

## T027: Infrastructure Testing

### Terraform Provisioning

**Objective**: Verify Terraform creates Cognito resources correctly.

**Steps**:

1. **Initialize Terraform**:
   ```bash
   cd infrastructure/environments/local
   terraform init -upgrade
   ```

2. **Apply Terraform**:
   ```bash
   terraform apply -auto-approve
   ```

3. **Verify Cognito Resources** (if using LocalStack Pro):
   ```bash
   # Check outputs
   terraform output cognito_user_pool_id
   terraform output cognito_user_pool_client_id
   
   # Should NOT be null
   ```

4. **Verify Resources Created**:
   ```bash
   # Using AWS CLI (for real AWS) or LocalStack
   aws --endpoint-url=http://localhost:4566 cognito-idp list-user-pools \
     --max-results 10
   ```

5. **Verify Outputs**:
   ```bash
   terraform output
   # Should show:
   # - cognito_user_pool_id (not null)
   # - cognito_user_pool_client_id (not null)
   # - cognito_user_pool_arn
   ```

6. **Test Terraform Destroy**:
   ```bash
   terraform destroy -auto-approve
   ```

7. **Verify Resources Removed**:
   ```bash
   terraform output cognito_user_pool_id
   # Should show: null (after destroy)
   ```

**Expected Results**:
- ✅ Terraform applies successfully (if LocalStack Pro or real AWS)
- ✅ Cognito resources created (User Pool, Client, Groups)
- ✅ Outputs contain Cognito IDs (not null)
- ✅ Terraform destroy removes all resources
- ✅ No errors during provisioning

**Note**: If using LocalStack Community Edition, Cognito creation will fail (expected). You'll need to provide Cognito credentials from your AWS account manually.

---

## Test Checklist

Use this checklist to track your testing progress:

### Backend Testing (T024)
- [ ] Backend starts with Cognito credentials
- [ ] Backend fails without Cognito credentials
- [ ] CognitoConfig loads correctly
- [ ] JWT decoder uses Cognito public keys
- [ ] Authentication endpoint works with Cognito token
- [ ] No LocalAuthConfig references in logs

### Frontend Testing (T025)
- [ ] Sign up flow works
- [ ] Sign in flow works
- [ ] Token refresh works
- [ ] Sign out works
- [ ] Tokens stored correctly
- [ ] API requests include Cognito tokens
- [ ] Frontend fails gracefully without Cognito credentials

### Integration Testing (T026)
- [ ] End-to-end sign up works
- [ ] User created in Cognito
- [ ] Email verification required
- [ ] Sign in after verification works
- [ ] JWT token valid
- [ ] Authenticated API requests work
- [ ] User data synced to database
- [ ] User promotion works

### Infrastructure Testing (T027)
- [ ] Terraform init works
- [ ] Terraform apply creates Cognito resources (if LocalStack Pro)
- [ ] Terraform outputs contain Cognito IDs
- [ ] Terraform destroy removes resources

---

## Troubleshooting

### Backend Won't Start

**Issue**: Backend fails with "aws.cognito.userPoolId must be configured"

**Solution**: 
- Verify `.env` file contains `COGNITO_USER_POOL_ID` and `COGNITO_CLIENT_ID`
- Check environment variables: `docker-compose exec backend env | grep COGNITO`

### Frontend Shows "Cognito configuration is missing"

**Issue**: Frontend can't find Cognito credentials

**Solution**:
- Verify `frontend/.env.local` contains `VITE_COGNITO_USER_POOL_ID` and `VITE_COGNITO_CLIENT_ID`
- Restart frontend: `docker-compose restart frontend`

### JWT Token Validation Fails

**Issue**: 401 Unauthorized errors

**Solution**:
- Verify token is from correct Cognito User Pool
- Check token expiration
- Verify Cognito User Pool is accessible
- Check backend logs for validation errors

---

## Notes

- All tests require actual Cognito User Pool in AWS account (or LocalStack Pro)
- For LocalStack Community Edition, provide Cognito credentials manually
- Ensure email verification is configured in Cognito User Pool
- Test with different user roles (USER, ORGANIZER, ADMIN)

