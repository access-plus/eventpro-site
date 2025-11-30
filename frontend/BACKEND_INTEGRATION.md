# Backend Integration Guide for User Management

This document outlines the required backend API endpoints for the User Management feature.

## Required Endpoints

### 1. Get All Users (Admin)

```http
GET /api/v1/admin/users
```

**Authentication:** Required (Admin only)

**Response:**
```json
{
  "status": "success",
  "message": "Users retrieved successfully",
  "data": {
    "content": [
      {
        "id": "uuid",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "phoneNumber": "+1234567890",
        "role": "USER",
        "status": "ACTIVE",
        "profilePictureUrl": "https://...",
        "bio": "User bio",
        "location": "New York, NY",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-15T00:00:00Z"
      }
    ]
  },
  "timestamp": "2024-01-15T12:00:00Z"
}
```

### 2. Update User (Admin)

```http
PUT /api/v1/admin/users/{userId}
```

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "bio": "Updated bio",
  "location": "San Francisco, CA"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "User updated successfully",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+1234567890",
    "role": "USER",
    "status": "ACTIVE",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T12:00:00Z"
  },
  "timestamp": "2024-01-15T12:00:00Z"
}
```

### 3. Update User Status (Admin)

```http
PATCH /api/v1/admin/users/{userId}/status
```

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "status": "SUSPENDED"
}
```

**Valid Status Values:**
- `ACTIVE` - User has full access
- `SUSPENDED` - User account is temporarily disabled
- `PENDING_VERIFICATION` - User hasn't verified email yet

**Response:**
```json
{
  "status": "success",
  "message": "User status updated successfully",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "status": "SUSPENDED",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T12:00:00Z"
  },
  "timestamp": "2024-01-15T12:00:00Z"
}
```

### 4. Update User Role (Admin)

```http
PATCH /api/v1/admin/users/{userId}/role
```

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "role": "ORGANIZER"
}
```

**Valid Role Values:**
- `USER` - Regular user (can purchase tickets)
- `ORGANIZER` - Can create and manage events
- `ADMIN` - Full platform access

**Response:**
```json
{
  "status": "success",
  "message": "User role updated successfully",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "ORGANIZER",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T12:00:00Z"
  },
  "timestamp": "2024-01-15T12:00:00Z"
}
```

## Implementation Notes

### Security Considerations

1. **Authorization:** All endpoints must verify the requesting user has ADMIN role
2. **Input Validation:** Validate all user inputs on the backend
3. **Status Changes:** When suspending a user:
   - Invalidate their active sessions/tokens
   - Consider sending notification email
4. **Role Changes:** When changing roles:
   - Verify the requester isn't downgrading their own admin role
   - Consider requiring additional confirmation for admin role grants
5. **Audit Logging:** Log all admin actions for security auditing

### Database Schema

The `User` entity should include:

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    profile_picture_url TEXT,
    bio TEXT,
    location VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_VERIFICATION',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
```

### AWS Cognito Integration

Since the application uses AWS Cognito for authentication:

1. **User Sync:** When users sign up via Cognito, sync their data to your database
2. **Status Management:**
   - `SUSPENDED` users should have their Cognito account disabled
   - Use Cognito's `AdminDisableUser` API
3. **Role Storage:**
   - Store roles in your database, not in Cognito custom attributes
   - Roles are business logic, not authentication data

### Error Responses

**401 Unauthorized:**
```json
{
  "status": "error",
  "message": "Authentication required",
  "timestamp": "2024-01-15T12:00:00Z"
}
```

**403 Forbidden:**
```json
{
  "status": "error",
  "message": "Admin access required",
  "timestamp": "2024-01-15T12:00:00Z"
}
```

**404 Not Found:**
```json
{
  "status": "error",
  "message": "User not found",
  "timestamp": "2024-01-15T12:00:00Z"
}
```

**400 Bad Request:**
```json
{
  "status": "error",
  "message": "Invalid status value",
  "timestamp": "2024-01-15T12:00:00Z"
}
```

## Testing

### Test Scenarios

1. **Get All Users:**
   - Verify only admins can access
   - Test pagination if implemented
   - Test search/filter functionality

2. **Update User:**
   - Test updating each field individually
   - Test partial updates
   - Verify email cannot be changed

3. **Suspend User:**
   - Verify suspended users cannot login
   - Test re-activating suspended users
   - Ensure active sessions are invalidated

4. **Change Role:**
   - Test role escalation (USER → ORGANIZER → ADMIN)
   - Test role de-escalation
   - Verify admins cannot remove their own admin role

### Sample cURL Commands

```bash
# Get all users
curl -X GET http://localhost:8080/api/v1/admin/users \
  -H "Authorization: Bearer {admin_token}"

# Update user
curl -X PUT http://localhost:8080/api/v1/admin/users/{userId} \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"firstName": "Jane", "lastName": "Smith"}'

# Suspend user
curl -X PATCH http://localhost:8080/api/v1/admin/users/{userId}/status \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"status": "SUSPENDED"}'

# Change user role
curl -X PATCH http://localhost:8080/api/v1/admin/users/{userId}/role \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"role": "ORGANIZER"}'
```

## Frontend Integration

The frontend implementation is complete in:
- **Page:** `src/pages/UserManagement.tsx`
- **Route:** `/admin/users` (Admin only)
- **API Service:** `src/lib/api.ts` (methods: `getAllUsers`, `updateUser`, `updateUserStatus`, `updateUserRole`)

## Next Steps

1. Implement the backend endpoints as documented
2. Set up proper role-based access control middleware
3. Add audit logging for all admin actions
4. Consider implementing email notifications for status changes
5. Add rate limiting to prevent abuse
