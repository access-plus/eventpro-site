# Local Development Authentication Guide

## Overview

This guide explains how to develop locally without requiring AWS Cognito, while maintaining seamless compatibility with production environments that use Cognito.

## Problem Statement

- **Production/Dev Environments**: Use AWS Cognito for authentication
- **Local Development**: Cognito requires LocalStack Pro (paid) or real AWS account
- **Solution**: Mock authentication system that works identically to Cognito

## Architecture

### Backend Mock Authentication

The backend automatically switches to mock authentication when:
- `LOCAL_AUTH_ENABLED=true` is set, OR
- `COGNITO_USER_POOL_ID` is empty/missing

**Components:**
1. **LocalAuthConfig**: Provides mock JWT decoder that accepts unsigned tokens
2. **LocalCognitoAdminService**: Mock implementation of Cognito Admin API
3. **Conditional Configuration**: Real Cognito config only loads when local auth is disabled

### Frontend Mock Authentication

The frontend automatically switches to mock authentication when:
- `VITE_LOCAL_AUTH_ENABLED=true` is set, OR
- `VITE_COGNITO_USER_POOL_ID` or `VITE_COGNITO_CLIENT_ID` are missing

**Components:**
1. **localAuthService**: Mock authentication service that generates JWT tokens
2. **authService**: Automatically delegates to localAuthService when enabled

## Setup Instructions

### Backend Configuration

1. **Enable Local Auth** (already configured in `application-local.yml`):
   ```yaml
   local:
     auth:
       enabled: ${LOCAL_AUTH_ENABLED:true}  # Defaults to true for local profile
   ```

2. **Environment Variables** (optional, defaults provided):
   ```bash
   LOCAL_AUTH_ENABLED=true
   LOCAL_AUTH_USER_ID=local-user-123
   LOCAL_AUTH_EMAIL=dev@local.test
   LOCAL_AUTH_GROUPS=USER
   ```

3. **Disable Local Auth** (to use real Cognito):
   ```bash
   LOCAL_AUTH_ENABLED=false
   COGNITO_USER_POOL_ID=your-pool-id
   COGNITO_CLIENT_ID=your-client-id
   ```

### Frontend Configuration

1. **Enable Local Auth** in `.env.local`:
   ```bash
   VITE_LOCAL_AUTH_ENABLED=true
   # Don't set VITE_COGNITO_USER_POOL_ID or VITE_COGNITO_CLIENT_ID
   ```

2. **Disable Local Auth** (to use real Cognito):
   ```bash
   VITE_LOCAL_AUTH_ENABLED=false
   VITE_COGNITO_USER_POOL_ID=your-pool-id
   VITE_COGNITO_CLIENT_ID=your-client-id
   ```

## Usage

### Default Test User

When using local auth, a default test user is automatically created:

- **Email**: `dev@local.test`
- **Password**: `password123`
- **Groups**: `USER`

### Creating Additional Users

Users are created automatically on sign-up in local mode. No email verification is required.

### Testing Different Roles

To test with different roles, you can:

1. **Modify default groups** in `application-local.yml`:
   ```yaml
   local:
     auth:
       default-groups: ADMIN,ORGANIZER,USER
   ```

2. **Or modify user groups** in the frontend `localAuthService.ts` mock user store

## How It Works

### Backend Flow

1. **Request arrives** with JWT token in `Authorization: Bearer <token>` header
2. **LocalAuthConfig** intercepts and uses mock JWT decoder
3. **Mock decoder** parses token (no signature validation) and extracts claims
4. **SecurityConfig** validates token and extracts roles from `cognito:groups` claim
5. **Controllers** work identically to production (extract user ID, roles, etc.)

### Frontend Flow

1. **User signs in** via Login page
2. **authService** detects local auth mode and delegates to `localAuthService`
3. **localAuthService** validates credentials against in-memory user store
4. **Mock JWT tokens** are generated and stored in localStorage
5. **API requests** include tokens in `Authorization` header
6. **Backend** accepts and validates tokens (mock mode)

## Token Format

Local auth generates JWT tokens with the same structure as Cognito:

```json
{
  "sub": "local-user-123",
  "email": "dev@local.test",
  "given_name": "Local",
  "family_name": "Developer",
  "cognito:groups": ["USER"],
  "iat": 1234567890,
  "exp": 1234571490
}
```

## Switching Between Modes

### Local → Production

1. Set `LOCAL_AUTH_ENABLED=false` (backend)
2. Set `VITE_LOCAL_AUTH_ENABLED=false` (frontend)
3. Provide real Cognito credentials
4. Restart applications

### Production → Local

1. Set `LOCAL_AUTH_ENABLED=true` (backend)
2. Set `VITE_LOCAL_AUTH_ENABLED=true` (frontend)
3. Remove/clear Cognito credentials
4. Restart applications

## Benefits

✅ **No LocalStack Pro Required**: Works with free LocalStack Community Edition
✅ **No AWS Account Needed**: Fully local development
✅ **Identical Behavior**: Same JWT structure, claims, and role mapping
✅ **Seamless Switching**: Toggle between local and real Cognito via environment variables
✅ **No Code Changes**: Application code works identically in both modes

## Troubleshooting

### Backend Issues

**Problem**: JWT validation fails
- **Solution**: Ensure `LOCAL_AUTH_ENABLED=true` and `local.auth.enabled=true` in config

**Problem**: CognitoAdminService not found
- **Solution**: Check that `LOCAL_AUTH_ENABLED=true` (LocalCognitoAdminService should load)

### Frontend Issues

**Problem**: Authentication fails
- **Solution**: Check `VITE_LOCAL_AUTH_ENABLED=true` and clear localStorage

**Problem**: Still trying to use Cognito
- **Solution**: Ensure `VITE_COGNITO_USER_POOL_ID` and `VITE_COGNITO_CLIENT_ID` are not set

## Security Notes

⚠️ **Important**: Local auth mode is for **development only**. Never enable in production.

- Tokens are unsigned (no signature validation)
- User passwords are stored in plain text (in-memory only)
- No rate limiting or security features
- Always use real Cognito in production environments

## Migration Path

When deploying to higher environments:

1. **Dev/Staging**: Use real Cognito (set `LOCAL_AUTH_ENABLED=false`)
2. **Production**: Use real Cognito (set `LOCAL_AUTH_ENABLED=false`)
3. **Local**: Use mock auth (set `LOCAL_AUTH_ENABLED=true`)

The same codebase works in all environments with just environment variable changes.

