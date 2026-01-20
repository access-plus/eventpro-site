# Remove Cognito and Implement Database JWT Authentication

## Current State Assessment

### ✅ Already Completed

1. **Database**: `password_hash` column exists in V1 migration, `cognito_user_id` removed
2. **UserEntity**: Has `passwordHash` field, `cognitoUserId` removed, indexes updated
3. **UserRepository**: Has `findByEmailIgnoreCase()`, Cognito methods removed
4. **UserService**: Updated to `createUser()` with password hash, all Cognito methods removed
5. **AuthService**: Implemented with signup/login - currently uses Nimbus JWT (Spring OAuth2)
6. **AuthController**: Has signup/login endpoints at `/api/v1/auth/signup` and `/api/v1/auth/login`
7. **Auth DTOs**: AuthSignupRequest, AuthLoginRequest, AuthResponse created
8. **JwtConfig**: Created using Nimbus (RS256 with RSA keys from JwtProperties)
9. **JwtProperties**: Configuration properties for JWT (issuer, TTL, public/private keys)
10. **JwtRoleMapper**: Replaces CognitoRoleMapper, reads role from JWT claims
11. **SecurityConfig**: Updated to use JwtRoleMapper, auth endpoints are public
12. **JwtUtils**: Updated with `getCurrentUserId()` method (extracts UUID from sub claim)
13. **UserController**: Cognito dependencies removed, uses `getCurrentUserId()`, sync endpoint removed
14. **Frontend**: 
    - `cognito.ts` deleted
    - `AuthContext` updated to use `apiService.signUp()` and `apiService.login()`
    - `api.ts` has signup/login methods
    - Types updated (AuthResponse, SignUpRequest)
15. **Infrastructure**: Cognito removed from local environment Terraform
16. **Docker**: Cognito env vars removed, JWT config (JWT_PUBLIC_KEY, JWT_PRIVATE_KEY) added
17. **Documentation**: 
    - VARIABLES.md updated with JWT config
    - LOCAL_DEVELOPMENT_GUIDE.md updated with JWT key generation
    - OpenApiConfig updated (removed Cognito reference)

### ⚠️ Needs Update: Switch from Nimbus (Spring OAuth2) to jjwt 0.12.6

Currently using Spring OAuth2 Resource Server with Nimbus JWT library. Need to replace with jjwt 0.12.6 library as requested.

## Remaining Work

### 1. Update Dependencies (Switch from Nimbus to jjwt 0.12.6)

**File: `backend/services/modules/eventpro-core/build.gradle`**

Current dependencies:
- `spring-boot-starter-oauth2-resource-server` (provides Nimbus JWT)
- `spring-security-oauth2-jose` (Nimbus dependency)

Changes needed:
- Remove: `spring-boot-starter-oauth2-resource-server`
- Remove: `spring-security-oauth2-jose`
- Add: `io.jsonwebtoken:jjwt-api:0.12.6`
- Add: `io.jsonwebtoken:jjwt-impl:0.12.6` (runtime)
- Add: `io.jsonwebtoken:jjwt-jackson:0.12.6` (runtime)
- Keep: `spring-boot-starter-security` (still needed for Spring Security)
- Add: `org.springframework.security:spring-security-crypto` (explicitly add for BCrypt - currently comes transitively but should be explicit)

### 2. Create JwtService using jjwt 0.12.6

**File: `backend/services/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/security/JwtService.java`**

Create new service using jjwt library:
- Annotate with `@Service`
- Inject `JwtProperties` and RSA keys (PrivateKey, PublicKey)
- Generate JWT tokens using `io.jsonwebtoken.Jwts.builder()`
- Validate JWT tokens using `io.jsonwebtoken.Jwts.parser()`
- Use RS256 signing with RSA keys from JwtProperties
- Extract claims: sub (userId as UUID string), email, role, iss, iat, exp
- Handle token expiration (jjwt validates automatically)
- Throw appropriate exceptions for invalid tokens (`JwtException`, `ExpiredJwtException`, etc.)

Key methods:
- `generateToken(UUID userId, String email, String role): String`
  - Use `Jwts.builder().subject(userId.toString()).claim("email", email).claim("role", role).issuer(issuer).issuedAt(Date).expiration(Date).signWith(privateKey, SignatureAlgorithm.RS256).compact()`
- `validateToken(String token): Claims`
  - Use `Jwts.parser().verifyWith(publicKey).build().parseSignedClaims(token).getPayload()`
- `getUserId(Claims claims): UUID` - Extract from "sub" claim
- `getEmail(Claims claims): String` - Extract from "email" claim
- `getRole(Claims claims): String` - Extract from "role" claim

### 3. Update JwtConfig to use jjwt

**File: `backend/services/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/config/JwtConfig.java`**

Current state: Uses Nimbus JwtDecoder/JwtEncoder with NimbusDS imports

Changes needed:
- Remove Nimbus imports: `com.nimbusds.jose.*` packages
- Remove Spring OAuth2 imports: `org.springframework.security.oauth2.jwt.*`
- Remove `JwtDecoder` bean (used by OAuth2 Resource Server)
- Remove `JwtEncoder` bean (used by AuthService)
- Create `JwtService` bean instead, passing `JwtProperties` and parsed RSA keys
- Keep `PasswordEncoder` bean (BCrypt)
- Keep RSA key parsing logic (reuse for jjwt RS256 - methods can stay)
- Create `PrivateKey` and `PublicKey` beans from JwtProperties for jjwt (or pass directly to JwtService)
- Note: Key format is DER base64 (as per LOCAL_DEVELOPMENT_GUIDE.md update)

### 4. Update AuthService to use JwtService

**File: `backend/services/modules/eventpro-api/src/main/java/com/accessplus/eventpro/api/service/impl/AuthServiceImpl.java`**

Current state: Uses `JwtEncoder` from Nimbus

Changes needed:
- Replace `JwtEncoder` dependency with `JwtService`
- Remove `JwtProperties` dependency (JwtService will handle it)
- Update `issueToken()` method to call `jwtService.generateToken(user.getId(), user.getEmail(), user.getRole())`
- Keep password hashing logic (already correct with BCrypt)
- Keep email/role normalization logic

### 5. Create JwtAuthenticationFilter

**File: `backend/services/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/security/JwtAuthenticationFilter.java`**

Create new filter to replace OAuth2 Resource Server:
- Extend `OncePerRequestFilter`
- Inject `JwtService` dependency
- Extract JWT from `Authorization: Bearer <token>` header
- Skip filter for public endpoints (health, swagger, public GET /events, /api/v1/auth/*)
- Validate token using `JwtService.validateToken()` - catch exceptions and return 401
- Extract userId, email, role from validated claims using `JwtService` helper methods
- Create `UsernamePasswordAuthenticationToken` with:
  - Principal: userId (UUID as String) or email
  - Credentials: null (stateless)
  - Authorities: `List.of(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))`
- Set `SecurityContextHolder.getContext().setAuthentication()`
- Continue filter chain with `filterChain.doFilter(request, response)`
- Handle exceptions: catch `JwtException` and return 401 Unauthorized

### 6. Update SecurityConfig

**File: `backend/services/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/security/SecurityConfig.java`**

Current state: Uses OAuth2 Resource Server with JwtDecoder and JwtRoleMapper

Changes needed:
- Remove `oauth2ResourceServer()` configuration (entire block)
- Remove `JwtDecoder` dependency from constructor
- Remove `JwtRoleMapper` dependency (authorities extracted in filter, not needed here)
- Remove `BearerTokenResolver` bean (no longer needed)
- Remove `jwtAuthenticationConverter()` method (no longer needed)
- Add `JwtAuthenticationFilter` dependency to constructor
- Add `JwtAuthenticationFilter` to filter chain using `http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)`
- Public endpoints already configured correctly (`/api/v1/auth/signup`, `/api/v1/auth/login` are already public)
- Keep CORS configuration
- Keep session management (STATELESS)

### 7. Update README.md

**File: `README.md`**

- Verify authentication flow diagrams (lines 410-445) - already show JWT auth, verify accuracy
- Update prerequisites section (around line 1111) - remove Cognito requirement, add JWT keys requirement
- Update "How Authentication Works" section if it exists
- Verify no remaining Cognito references (grep shows 0 matches, but double-check)

### 8. Update JwtUtils to work with new authentication type

**File: `backend/services/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/security/JwtUtils.java`**

Current state: Uses `JwtAuthenticationToken` from Spring OAuth2

Changes needed:
- Remove Spring OAuth2 imports: `org.springframework.security.oauth2.jwt.Jwt`, `org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken`
- Update `getCurrentUserId()` to work with `UsernamePasswordAuthenticationToken`:
  - Get `Authentication` from `SecurityContextHolder`
  - Check if it's `UsernamePasswordAuthenticationToken`
  - Extract principal (should be userId as String or UUID)
  - Convert to UUID
- Update `getCurrentJwt()` method - may need to be removed or changed to extract from SecurityContext differently
- Update `getClaim()` method - may need to be removed or changed to work with new auth type
- Alternative: Store JWT claims in Authentication details or create custom Authentication object

**Note**: This is critical - all controllers use `JwtUtils.getCurrentUserId()`. Must ensure it works with new auth type.

### 9. Remove JwtRoleMapper (or update if needed)

**File: `backend/services/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/security/JwtRoleMapper.java`**

Current state: Implements `Converter<Jwt, Collection<GrantedAuthority>>` for Spring OAuth2

Changes needed:
- **Option A (Recommended)**: Delete this file entirely - authorities are extracted in JwtAuthenticationFilter
- **Option B**: Keep but mark as deprecated - not used after filter implementation
- If keeping, it will need to be updated to work with jjwt Claims instead of Spring OAuth2 Jwt

### 10. Verify Infrastructure Cleanup

**Files to check:**
- `infrastructure/environments/dev/main.tf` - Verify Cognito module removed (already verified - no cognito references)
- `infrastructure/modules/cognito/` - Can be marked deprecated or removed
- `infrastructure/environments/local/main.tf` - Already cleaned (verified no cognito references)

## Implementation Details

### JWT Token Structure (jjwt)
```json
{
  "sub": "userId-uuid",
  "email": "user@example.com",
  "role": "USER",
  "iat": 1234567890,
  "exp": 1234654290,
  "iss": "eventpro"
}
```

### JwtService Interface
```java
@Service
public class JwtService {
    String generateToken(UUID userId, String email, String role)
    Claims validateToken(String token) throws JwtException
    UUID getUserId(Claims claims)
    String getEmail(Claims claims)
    String getRole(Claims claims)
}
```

**Implementation Notes:**
- Use `io.jsonwebtoken.Jwts` for builder and parser
- Use `SignatureAlgorithm.RS256` for signing
- Keys are DER base64 format (per LOCAL_DEVELOPMENT_GUIDE.md)
- Handle `ExpiredJwtException`, `MalformedJwtException`, `SignatureException`

### JwtAuthenticationFilter Flow
1. Extract token from `Authorization: Bearer <token>` header
2. Skip filter if public endpoint (health, swagger, public GET /events, /api/v1/auth/*)
3. If no token, continue filter chain (will fail at authorization check)
4. Validate token using `JwtService.validateToken()` - catch exceptions
5. Extract userId, email, role from validated claims using JwtService helper methods
6. Create `UsernamePasswordAuthenticationToken` with:
   - Principal: userId (UUID as String) or email
   - Credentials: null
   - Authorities: `List.of(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))`
7. Set `SecurityContextHolder.getContext().setAuthentication(auth)`
8. Continue filter chain: `filterChain.doFilter(request, response)`
9. On exception: Return 401 Unauthorized response

## Implementation Order (Critical)

**Important**: Follow this order to avoid breaking the application:

1. **First**: Update dependencies (Step 1) - This will break compilation, which is expected
2. **Second**: Create JwtService (Step 2) - Core service needed by everything else
3. **Third**: Update JwtConfig (Step 3) - Provides JwtService bean
4. **Fourth**: Update AuthService (Step 4) - Uses JwtService for token generation
5. **Fifth**: Create JwtAuthenticationFilter (Step 5) - Handles token validation
6. **Sixth**: Update SecurityConfig (Step 6) - Integrates filter into security chain
7. **Seventh**: Update JwtUtils (Step 8) - Critical - all controllers depend on this
8. **Eighth**: Remove JwtRoleMapper (Step 9) - Cleanup after filter is working
9. **Ninth**: Update README.md (Step 7) - Documentation
10. **Tenth**: Verify infrastructure (Step 10) - Final verification

**Breaking Changes During Migration:**
- After Step 1: Application won't compile (OAuth2 dependencies removed)
- After Step 6: Application won't start (SecurityConfig needs filter)
- After Step 7: Controllers will fail (JwtUtils needs update)
- After Step 8: Application should work end-to-end

**Testing Strategy:**
- Test after Step 4: Signup/login should work (token generation)
- Test after Step 6: Protected endpoints should work (token validation)
- Test after Step 8: All controllers should work (JwtUtils fixed)

## Testing Checklist

- [ ] Signup creates user with hashed password
- [ ] Login returns valid JWT token
- [ ] JWT token contains correct claims (sub, email, role)
- [ ] Protected endpoints require valid JWT
- [ ] Public endpoints work without JWT
- [ ] Role-based authorization works (@PreAuthorize)
- [ ] Token expiration works
- [ ] Invalid tokens are rejected
- [ ] Frontend can signup/login and use token for API calls

## Summary

### What's Done ✅
- Database schema updated (password_hash added, cognito_user_id removed)
- User entity and repository updated
- Auth service and controller implemented (using Nimbus currently)
- Frontend fully migrated to new auth endpoints
- Infrastructure Cognito removed from local
- Documentation updated (VARIABLES.md, LOCAL_DEVELOPMENT_GUIDE.md)

### What Remains ⚠️
- Switch from Nimbus (Spring OAuth2) to jjwt 0.12.6 library
- Create JwtService using jjwt
- Create JwtAuthenticationFilter to replace OAuth2 Resource Server
- Update SecurityConfig to use custom filter
- Update README.md to remove Cognito references

### Key Decision
The application currently uses Spring OAuth2 Resource Server with Nimbus JWT library. The remaining work is to replace this with jjwt 0.12.6 as requested, which requires:
1. Replacing Nimbus JwtDecoder/JwtEncoder with jjwt-based JwtService
2. Replacing OAuth2 Resource Server filter with custom JwtAuthenticationFilter
3. Maintaining RS256 signing with existing RSA keys

### Files to Modify
- `backend/services/modules/eventpro-core/build.gradle` - Update dependencies
- `backend/services/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/security/JwtService.java` - **Create new**
- `backend/services/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/config/JwtConfig.java` - **Update** (remove Nimbus, add JwtService)
- `backend/services/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/security/JwtAuthenticationFilter.java` - **Create new**
- `backend/services/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/security/SecurityConfig.java` - **Update** (remove OAuth2, add filter)
- `backend/services/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/security/JwtUtils.java` - **Update** (work with UsernamePasswordAuthenticationToken)
- `backend/services/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/security/JwtRoleMapper.java` - **Delete** (authorities in filter)
- `backend/services/modules/eventpro-api/src/main/java/com/accessplus/eventpro/api/service/impl/AuthServiceImpl.java` - **Update** (use JwtService)
- `README.md` - Verify/update authentication flow diagrams and prerequisites

### Critical Dependencies
- All controllers use `JwtUtils.getCurrentUserId()` - must work after migration
- JwtRoleMapper currently used by SecurityConfig - will be removed
- Key format: DER base64 (as per LOCAL_DEVELOPMENT_GUIDE.md)
