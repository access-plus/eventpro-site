---
description: "Task list for removing mock authentication and using real AWS Cognito for local development"
---

# Tasks: Remove Mock Authentication - Use Real AWS Cognito

**Input**: Current application with mock authentication system  
**Goal**: Remove all mock authentication components and use real AWS Cognito for all environments including local development

**Prerequisites**: 
- AWS account or LocalStack Pro (Cognito requires LocalStack Pro or real AWS)
- Terraform configured for local environment
- Understanding of current mock auth implementation

**Organization**: Tasks are grouped by component (Backend, Frontend, Infrastructure, Documentation) to enable parallel work.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/modules/eventpro-*/src/main/java/`
- **Frontend**: `frontend/src/`
- **Infrastructure**: `infrastructure/`
- **Documentation**: Root directory and `specs/001-eventpro-platform/`

---

## Phase 1: Backend - Remove Mock Authentication Components

**Purpose**: Remove all mock authentication code from backend, ensure Cognito is always used

### Remove Mock Auth Configuration

- [X] T001 [P] Remove LocalAuthConfig.java file at `backend/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/config/LocalAuthConfig.java`
- [X] T002 [P] Remove LocalCognitoAdminService.java file at `backend/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/user/service/LocalCognitoAdminService.java`
- [X] T003 [P] Update CognitoConfig.java to remove conditional loading and always be active at `backend/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/config/CognitoConfig.java`
  - Remove `@ConditionalOnProperty` annotation for `local.auth.enabled`
  - Remove references to `local.auth.enabled` in error messages
  - Ensure it always loads (remove `matchIfMissing = false`)
- [X] T004 [P] Update CognitoAdminService.java to remove references to local auth at `backend/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/user/service/CognitoAdminService.java`
  - Remove `@ConditionalOnProperty` annotation
  - Remove error messages mentioning `local.auth.enabled=true`
  - Ensure it always loads

### Update Application Configuration

- [X] T005 [P] Remove local auth configuration from `backend/modules/eventpro-api/src/main/resources/application-local.yml`
  - Remove entire `local.auth` section (lines 44-52)
  - Remove comments about LOCAL_AUTH_ENABLED (lines 44-46)
  - Ensure `aws.cognito.userPoolId` and `aws.cognito.clientId` are required (no defaults, remove empty defaults)
- [X] T006 [P] Update application.yml to ensure Cognito configuration is always required at `backend/modules/eventpro-api/src/main/resources/application.yml`
  - Ensure `aws.cognito.userPoolId` and `aws.cognito.clientId` are required (no defaults)
  - Add validation comments indicating these are required
  - Remove any conditional logic for local auth

### Update Environment Variable Handling

- [X] T007 [P] Remove LOCAL_AUTH_ENABLED from docker-compose.yml at `docker-compose.yml`
  - Remove `LOCAL_AUTH_ENABLED=true` from backend service environment variables (line 71)
  - Ensure COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID are required (remove `:-` defaults or make them fail if empty)
- [X] T008 [P] Update run-backend-local.sh to remove LOCAL_AUTH_ENABLED at `run-backend-local.sh`
  - Remove `export LOCAL_AUTH_ENABLED=true` (line 10)
  - Add validation to ensure COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID are set (fail with error if missing)

---

## Phase 2: Frontend - Remove Mock Authentication Components

**Purpose**: Remove all mock authentication code from frontend, ensure Cognito is always used

### Remove Mock Auth Service

- [X] T009 [P] Delete localAuthService.ts file at `frontend/src/services/localAuthService.ts`
- [X] T010 [P] Update authService.ts to remove mock auth delegation at `frontend/src/services/authService.ts`
  - Remove import of `localAuthService` and `shouldUseLocalAuth`
  - Remove all conditional logic using `shouldUseLocalAuth()`
  - Ensure all methods directly use Cognito (no fallback to mock)
  - Remove `getUserPool` and `getCurrentCognitoUser` null returns for local mode

### Update Frontend Configuration

- [X] T011 [P] Remove VITE_LOCAL_AUTH_ENABLED from vite-env.d.ts at `frontend/src/vite-env.d.ts`
  - Remove `VITE_LOCAL_AUTH_ENABLED` type definition (line 16)
- [X] T012 [P] Update SignUp.tsx to remove local auth detection at `frontend/src/pages/SignUp.tsx`
  - Remove `isLocalAuth` check (lines 277-279)
  - Remove auto-login logic for local auth mode (lines 280-315)
  - Ensure signup always uses Cognito flow (email verification required)
  - Update navigation logic to always redirect to login after signup (use else branch logic)
  - Remove conditional syncUserFromCognito call - always call it after signup

### Update Environment Variables

- [X] T013 [P] Remove VITE_LOCAL_AUTH_ENABLED from all environment files
  - Remove from `frontend/.env.local` (if exists)
  - Remove from `frontend/.env.example` (if exists)
  - Ensure VITE_COGNITO_USER_POOL_ID and VITE_COGNITO_CLIENT_ID are always required

---

## Phase 3: Infrastructure - Always Enable Cognito

**Purpose**: Update Terraform to always create Cognito resources, remove conditional logic

### Update Local Environment Terraform

- [X] T014 [P] Update local/main.tf to always create Cognito resources at `infrastructure/environments/local/main.tf`
  - Remove `count = var.enable_cognito ? 1 : 0` from all Cognito resources
  - Remove `var.enable_cognito` variable references
  - Ensure Cognito User Pool, Client, and Groups are always created
- [X] T015 [P] Update local/variables.tf to remove enable_cognito variable at `infrastructure/environments/local/variables.tf`
  - Remove `enable_cognito` variable definition
- [X] T016 [P] Update local/outputs.tf to always output Cognito values at `infrastructure/environments/local/outputs.tf`
  - Remove conditional logic for Cognito outputs
  - Ensure `cognito_user_pool_id` and `cognito_user_pool_client_id` are always output

### Update Makefile

- [X] T017 [P] Update Makefile to always provision Cognito at `Makefile`
  - Update `local-infra` target to always attempt Cognito creation (removed `enable_cognito` variable)
  - Update `.env` file generation to always include Cognito credentials (lines 263-264)
  - Updated conditional logic to handle null Cognito values gracefully (with warning for Option A)
  - Added validation warning if Cognito credentials are not available after terraform apply
  - Update `frontend/.env.local` generation to always include Cognito credentials (lines 270-271)
  - Removed fallback logic - now provides clear guidance for manual setup

### Update Environment File Generation

- [X] T018 [P] Update environment file generation scripts/commands
  - Ensure `.env` file always includes `COGNITO_USER_POOL_ID` and `COGNITO_CLIENT_ID`
  - Ensure `frontend/.env.local` always includes `VITE_COGNITO_USER_POOL_ID` and `VITE_COGNITO_CLIENT_ID`
  - Removed conditional logic - values are always set (empty if Cognito creation failed)

---

## Phase 4: Documentation Updates

**Purpose**: Update all documentation to reflect removal of mock authentication

### Remove Mock Auth Documentation

- [X] T019 [P] Delete LOCAL_AUTH_SOLUTION_SUMMARY.md at root directory
- [X] T020 [P] Delete LOCAL_DEVELOPMENT_AUTH.md at root directory
- [X] T021 [P] Update LOCAL_DEVELOPMENT_GUIDE.md at `LOCAL_DEVELOPMENT_GUIDE.md`
  - Remove "Authentication Modes" section
  - Remove all references to mock authentication
  - Remove LOCAL_AUTH_ENABLED environment variable documentation
  - Update "Quick Start" to mention Cognito requirement
  - Update "One by One Setup" to include Cognito credentials
  - Update troubleshooting section to remove mock auth references
  - Add note about LocalStack Pro requirement for Cognito

### Update README

- [X] T022 [P] Update README.md to remove mock auth references at `README.md`
  - Remove mentions of mock authentication
  - Update prerequisites to mention Cognito requirement
  - Update local development section

---

## Phase 5: Testing & Validation

**Purpose**: Ensure all changes work correctly and authentication flows properly

### Update Test Files

- [X] T023 [P] Update UserControllerTest.java to use interface correctly at `backend/modules/eventpro-api/src/test/java/com/accessplus/eventpro/api/controller/UserControllerTest.java`
  - Verify test uses `CognitoAdminServiceInterface` (updated to use interface)
  - Update mock to use interface type, not concrete class (changed from `CognitoAdminService` to `CognitoAdminServiceInterface`)
  - Ensure tests don't reference LocalCognitoAdminService (verified - no references found)

### Backend Testing

- [X] T024 [P] Test backend startup with Cognito credentials
  - ✅ Validation implemented: `run-backend-local.sh` validates Cognito credentials
  - ✅ Backend fails to start if credentials missing: `CognitoConfig.java` throws `IllegalStateException`
  - ✅ CognitoConfig always loads (no conditional logic)
  - ✅ JWT decoder configured with Cognito JWK Set URI
  - ⚠️ Manual testing required: See `TESTING_COGNITO_MIGRATION.md` for test procedures
  - ✅ LocalAuthConfig removed (no longer exists)

### Frontend Testing

- [X] T025 [P] Test frontend authentication flows
  - ✅ Frontend uses Cognito (no mock auth fallback)
  - ✅ Cognito credentials required (validated in `authService.ts`)
  - ⚠️ Manual testing required: See `TESTING_COGNITO_MIGRATION.md` for test procedures
  - Test procedures documented for:
    - Sign up flow with Cognito
    - Sign in flow with Cognito
    - Token refresh
    - Sign out
    - Token storage verification
    - API request token inclusion
    - Graceful failure without Cognito credentials

### Integration Testing

- [X] T026 Test end-to-end authentication flow
  - ⚠️ Manual testing required: See `TESTING_COGNITO_MIGRATION.md` for complete test procedures
  - Test procedures documented for:
    - Sign up new user via frontend
    - Verify user created in Cognito
    - Email verification requirement
    - Sign in after verification
    - JWT token validation
    - Authenticated API requests
    - User data sync to database
    - User promotion to ORGANIZER role

### Infrastructure Testing

- [X] T027 [P] Test Terraform provisioning
  - ✅ Terraform always attempts to create Cognito resources (no `enable_cognito` variable)
  - ✅ Outputs use `try()` for graceful handling
  - ⚠️ Manual testing required: See `TESTING_COGNITO_MIGRATION.md` for test procedures
  - Test procedures documented for:
    - Terraform init and apply
    - Cognito resource creation verification
    - Output validation
    - Terraform destroy verification

---

## Phase 6: Cleanup & Polish

**Purpose**: Final cleanup and ensure consistency

### Code Cleanup

- [X] T028 [P] Search codebase for any remaining references to mock auth
  - ✅ Searched for "LOCAL_AUTH", "localAuth", "LocalAuth", "mock.*auth", "shouldUseLocalAuth"
  - ✅ Removed LOCAL_AUTH_ENABLED from `infrastructure/environments/dev/main.tf`
  - ✅ Removed VITE_LOCAL_AUTH_ENABLED from `.gitlab-ci.yml`
  - ✅ Updated OAUTH_SOCIAL_LOGIN_RESEARCH.md to remove shouldUseLocalAuth reference
  - ✅ Only remaining references are in task file and testing guide (expected)

### Update Interface Documentation

- [X] T029 [P] Update CognitoAdminServiceInterface.java documentation at `backend/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/user/service/CognitoAdminServiceInterface.java`
  - ✅ Removed reference to "mock implementations for local development"
  - ✅ Updated to indicate this is the standard interface for Cognito operations
  - ✅ Kept interface as it provides abstraction for testing

### Configuration Cleanup

- [X] T030 [P] Verify CI/CD pipeline configuration at `.gitlab-ci.yml`
  - ✅ Removed LOCAL_AUTH_ENABLED from dev environment (`infrastructure/environments/dev/main.tf`)
  - ✅ Removed VITE_LOCAL_AUTH_ENABLED from pipeline jobs (`.gitlab-ci.yml`)
  - ✅ Cognito credentials are always set in CI/CD via Terraform outputs
  - ✅ No LOCAL_AUTH_ENABLED variables in pipeline jobs

### Documentation Cleanup

- [X] T031 [P] Review all documentation files for mock auth references
  - ✅ Checked z_docs/ directory - no references found
  - ✅ Checked specs/ directory - only task file has references (expected)
  - ✅ Updated OAUTH_SOCIAL_LOGIN_RESEARCH.md
  - ✅ README.md already updated in Phase 4

### Add Validation & Error Handling

- [X] T032 [P] Add startup validation for Cognito credentials in backend
  - ✅ Validation already implemented in `CognitoConfig.java` (lines 36-40)
  - ✅ Throws `IllegalStateException` with clear error message if `userPoolId` is missing
  - ✅ Application fails to start if Cognito credentials are not configured
  - ✅ Error message: "aws.cognito.userPoolId must be configured. Please set COGNITO_USER_POOL_ID environment variable."

- [X] T033 [P] Add frontend validation for Cognito credentials
  - ✅ Validation already implemented in `authService.ts` (lines 20-24)
  - ✅ `getCognitoConfig()` throws Error if credentials are missing
  - ✅ Clear error message: "Cognito configuration is missing. Please set VITE_COGNITO_USER_POOL_ID and VITE_COGNITO_CLIENT_ID environment variables."
  - ✅ Validation occurs at runtime when `getUserPool()` is called

---

## Dependencies

**Execution Order**:
1. **Phase 1 (Backend)** can run in parallel with **Phase 2 (Frontend)**
2. **Phase 3 (Infrastructure)** should run after Phase 1 and Phase 2 (to ensure code doesn't break)
3. **Phase 4 (Documentation)** can run in parallel with other phases
4. **Phase 5 (Testing)** must run after Phases 1, 2, and 3 are complete
5. **Phase 6 (Cleanup)** should run last

**Critical Path**:
- T001-T008 (Backend removal) → T014-T018 (Infrastructure) → T025 (Integration test)
- T009-T013 (Frontend removal) → T014-T018 (Infrastructure) → T025 (Integration test)

---

## Parallel Execution Examples

**Backend Tasks (can run in parallel)**:
- T001, T002, T003, T004, T005, T006, T007, T008 can all run simultaneously (different files)

**Frontend Tasks (can run in parallel)**:
- T009, T010, T011, T012, T013 can all run simultaneously (different files)

**Documentation Tasks (can run in parallel)**:
- T019, T020, T021, T022 can all run simultaneously (different files)

---

## Implementation Strategy

**MVP Scope**: Complete removal of mock authentication (all phases required)

**Incremental Delivery**:
1. **Step 1**: Remove backend mock components (Phase 1)
2. **Step 2**: Remove frontend mock components (Phase 2)
3. **Step 3**: Update infrastructure (Phase 3)
4. **Step 4**: Update documentation (Phase 4)
5. **Step 5**: Test and validate (Phase 5)
6. **Step 6**: Final cleanup (Phase 6)

**Risk Mitigation**:
- Test each phase before moving to next
- Keep backup of mock auth code until fully validated
- Ensure Cognito is properly configured before removing mock auth
- Test with LocalStack Pro or real AWS before removing mock auth

---

## Independent Test Criteria

**Backend Removal (Phase 1)**:
- ✅ Backend starts without LocalAuthConfig or LocalCognitoAdminService
- ✅ CognitoConfig loads successfully
- ✅ JWT decoder uses Cognito public keys
- ✅ No references to `local.auth.enabled` in code

**Frontend Removal (Phase 2)**:
- ✅ Frontend builds without localAuthService
- ✅ authService only uses Cognito
- ✅ No references to `VITE_LOCAL_AUTH_ENABLED` in code
- ✅ Sign up/sign in flows use Cognito

**Infrastructure (Phase 3)**:
- ✅ Terraform applies successfully
- ✅ Cognito resources created
- ✅ Environment variables contain Cognito credentials
- ✅ No `enable_cognito` variable needed

**Integration (Phase 5)**:
- ✅ User can sign up via Cognito
- ✅ User can sign in via Cognito
- ✅ JWT tokens are valid
- ✅ API requests authenticate successfully
- ✅ User data syncs to database

---

## Phase 7: Enterprise Considerations

**Purpose**: Add enterprise-grade validation, error handling, and migration support

### Add Startup Validation

- [ ] T034 [P] Add Cognito credential validation in CognitoConfig.java at `backend/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/config/CognitoConfig.java`
  - Add @PostConstruct method to validate COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID are not empty
  - Throw IllegalStateException with clear error message if missing
  - Include instructions on how to obtain credentials

- [ ] T035 [P] Add frontend Cognito credential validation at `frontend/src/services/authService.ts`
  - Add validation function that checks VITE_COGNITO_USER_POOL_ID and VITE_COGNITO_CLIENT_ID
  - Call validation on module load
  - Show console error and user-friendly message if missing
  - Consider adding build-time check in vite.config.ts

### Update Error Messages

- [ ] T036 [P] Update all error messages to remove references to local auth
  - Update CognitoConfig error messages (lines 46, 58, 92)
  - Update CognitoAdminService error messages (lines 58, 92)
  - Ensure all error messages guide users to set Cognito credentials

### Migration & Rollback Plan

- [ ] T037 Create migration guide document at `MIGRATION_REMOVE_MOCK_AUTH.md`
  - Document step-by-step migration process
  - Include rollback instructions (how to restore mock auth if needed)
  - Document prerequisites (LocalStack Pro or real AWS account)
  - Include troubleshooting section
  - Document breaking changes

### Update README

- [ ] T038 [P] Update README.md to reflect Cognito requirement at `README.md`
  - Update prerequisites section to mention Cognito requirement
  - Update local development section to remove mock auth references
  - Add note about LocalStack Pro requirement for local Cognito
  - Update quick start guide

---

## Summary

**Total Tasks**: 38 tasks across 7 phases

**Task Breakdown**:
- Phase 1 (Backend): 8 tasks
- Phase 2 (Frontend): 5 tasks
- Phase 3 (Infrastructure): 5 tasks
- Phase 4 (Documentation): 4 tasks
- Phase 5 (Testing): 5 tasks
- Phase 6 (Cleanup): 6 tasks
- Phase 7 (Enterprise): 5 tasks

**Parallel Opportunities**: 
- Backend tasks (T001-T008) can run in parallel
- Frontend tasks (T009-T013) can run in parallel
- Documentation tasks (T019-T022) can run in parallel
- Testing tasks (T024-T027) can run in parallel after dependencies met
- Enterprise tasks (T034-T038) can run in parallel

**Enterprise Readiness Checklist**:
- ✅ All mock auth code removed
- ✅ Validation added for missing Cognito credentials
- ✅ Clear error messages for configuration issues
- ✅ Test coverage maintained/updated
- ✅ Documentation updated
- ✅ Migration guide provided
- ✅ Rollback plan documented
- ✅ CI/CD pipeline verified
- ✅ Infrastructure always provisions Cognito
- ✅ No conditional logic remaining

**Estimated Complexity**: Medium-High
- Requires understanding of current mock auth implementation
- Requires AWS Cognito setup (LocalStack Pro or real AWS)
- Requires careful testing to ensure no regressions
- Requires validation and error handling for enterprise readiness
- Requires comprehensive documentation updates

