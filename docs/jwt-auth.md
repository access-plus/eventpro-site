# JWT Auth Migration Plan (Remove Cognito)

## Goals
- Remove AWS Cognito authentication/authorization from backend, frontend, and infrastructure.
- Sign up calls a backend endpoint and persists the user in the database.
- Login returns a bearer JWT used for subsequent API calls.

## Current Cognito Touchpoints (high level)
- Backend: `CognitoConfig`, `CognitoRoleMapper`, `CognitoAdminService`, Cognito claims in `JwtUtils`, and user sync flow in `UserController`.
- Frontend: `frontend/src/lib/cognito.ts`, `AuthContext` uses Cognito for signup/login/verify/reset.
- Infrastructure: Terraform Cognito module, ALB Cognito auth, env vars, Docker/Makefile setup.
- Docs/specs: Cognito references in README, VARIABLES, specs, and OpenAPI descriptions.

## Target JWT Design (proposed)
- Token issuer: backend (`eventpro-api`).
- Signing: HS256 with `JWT_SECRET` (or RS256 with keypair if preferred).
- Claims:
  - `sub`: user UUID
  - `email`
  - `role` (single role string) or `roles` (array)
  - `iat`, `exp`, `iss`
- Access token TTL: configurable via env (e.g., `JWT_ACCESS_TTL_SECONDS`).
- Refresh tokens (optional):
  - If kept, issue and store hashed refresh tokens in DB; add `/auth/refresh`.
  - If dropped, remove refresh usage in frontend and API types.

## Migration Plan

### Phase 1: Data Model & User Storage
- Add password storage to users:
  - New column: `password_hash` (BCrypt).
  - Optional: `password_updated_at`, `password_reset_token`, `password_reset_expires_at`.
- Remove or repurpose `cognito_user_id`:
  - Option A (clean): drop column, constraints, and indexes; update entity and repository.
  - Option B (compat): keep column but make nullable and stop using it.
- Add migration in `backend/services/modules/eventpro-api/src/main/resources/db/migration/` for the schema change.
- Update `UserEntity` and `UserRepository` to align with new fields and drop Cognito-specific methods.

### Phase 2: Backend Auth Services & Endpoints
- Add DTOs for signup/login:
  - `AuthSignupRequest`, `AuthLoginRequest`, `AuthResponse` (token, expiresIn, user).
- Add `AuthService`:
  - Sign up: validate email uniqueness, hash password, set role/status, save user.
  - Login: verify password, return JWT.
- Add endpoints under `AuthController`:
  - `POST /api/v1/auth/signup`
  - `POST /api/v1/auth/login`
  - (Optional) `POST /api/v1/auth/refresh`
- Update `UserService` to support create-by-password (rename from Cognito terminology).

### Phase 3: JWT Security Configuration
- Replace `CognitoConfig` with `JwtConfig`:
  - `JwtDecoder` uses `JWT_SECRET` (or public key).
  - `JwtEncoder` for issuing tokens.
- Replace `CognitoRoleMapper` with `JwtRoleMapper`:
  - Map `role`/`roles` claims to `ROLE_*`.
- Update `JwtUtils`:
  - `getCurrentUserId()` (UUID from `sub`)
  - `getCurrentUserEmail()` and/or `getCurrentUserRole()`
  - Remove Cognito-specific claim fallbacks.
- Keep `SecurityConfig` resource server flow, but point at new decoder and role mapper.

### Phase 4: Controller & Service Updates
- Replace `getCurrentUserCognitoId()` usage with `getCurrentUserId()`:
  - Controllers: `UserController`, `EventController`, `OrganizerController`, `OrderController`, `CartController`, `PaymentController`, `TicketController`, `AdminController`.
- Remove Cognito admin sync flows:
  - Delete `CognitoAdminServiceInterface` usages and user sync endpoints (`/users/sync`).
  - Update role promotion to only update DB role.
- Update `UserResponse` documentation fields (remove Cognito references).

### Phase 5: Frontend Auth Flow
- Replace Cognito SDK usage:
  - Remove `frontend/src/lib/cognito.ts` and usages.
- Update `AuthContext`:
  - `signUp` calls backend `/auth/signup`.
  - `login` calls backend `/auth/login` and stores access token.
  - Remove `syncUser` step; backend already creates the user.
- Update pages:
  - `SignUp.tsx` -> backend signup.
  - `Login.tsx` -> backend login.
  - `Verify.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx`:
    - Option A: implement backend email verification + reset flows.
    - Option B: remove/disable if not required yet.
- Update `frontend/src/types/api.ts` to match new auth responses (remove refresh token if not used).

### Phase 6: Infrastructure & Environment
- Remove Cognito resources:
  - Terraform: `infrastructure/modules/cognito`, `environments/dev/*` Cognito module, `cognito-admins.tf`.
  - ALB: remove `authenticate-cognito` actions in `infrastructure/modules/alb`.
- Add JWT env vars:
  - `JWT_SECRET`, `JWT_ISSUER`, `JWT_ACCESS_TTL_SECONDS` (and refresh settings if applicable).
- Update `docker-compose.yml`, `Makefile`, and `.env` templates.

### Phase 7: Docs & Tests
- Update docs to remove Cognito references:
  - `README.md`, `docs/VARIABLES.md`, `docs/project-structure.md`, specs.
- Update OpenAPI config description in `OpenApiConfig`.
- Update tests referencing Cognito:
  - `UserControllerTest` and any service tests.
- Add new tests:
  - Auth signup/login, JWT validation, role-based access.

## Verification Checklist
- Sign up creates a user in DB with hashed password.
- Login returns a bearer JWT and authenticated endpoints accept it.
- Role checks (`@PreAuthorize`) work with JWT roles.
- Existing features that require user identity (orders, cart, events) work with JWT `sub` user ID.
- Cognito resources removed from Terraform and local/dev environments.
- Docs and environment variables reflect JWT auth.

## Open Questions / Decisions Needed
- HS256 vs RS256 for signing?
- Keep refresh tokens or access-token-only?
- Email verification required for signup?
- Migration strategy for existing Cognito users (force password reset vs manual import)?
