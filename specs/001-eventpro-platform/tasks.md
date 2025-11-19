# Tasks: EventPro Platform

**Input**: Design documents from `/specs/001-eventpro-platform/`
**Prerequisites**: plan.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Organization**: Tasks are grouped by epic and priority to enable independent implementation and testing of each feature increment.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US-INFRA-001, US-AUTH-001)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Infrastructure & DevOps Foundation)

**Purpose**: Project initialization, build configuration, and development environment setup

**⚠️ CRITICAL**: This phase must complete before any development work can begin

### Backend Setup

- [X] T1-001 [P] [US-INFRA-001] Create root `eventpro-api/settings.gradle` with all subprojects
- [X] T1-002 [P] [US-INFRA-001] Create root `eventpro-api/build.gradle` with Java 21 and common dependencies
- [X] T1-003 [P] [US-INFRA-001] Initialize modular monolith structure with modules: eventpro-core, eventpro-event, eventpro-order, eventpro-payment, eventpro-notification, eventpro-api
- [X] T1-004 [P] [US-INFRA-001] Configure Java 21 in all backend modules (`sourceCompatibility`, `targetCompatibility`)
- [X] T1-005 [US-INFRA-001] Add Spring Boot dependencies to eventpro-core: Web, Data JPA, Security, Actuator
- [X] T1-006 [US-INFRA-001] Add Spring Boot dependencies to eventpro-api: Web, Data JPA, Security, Actuator, WebSocket
- [X] T1-007 [US-INFRA-001] Create `eventpro-api/modules/eventpro-api/src/main/resources/application.yml` with basic configuration
- [X] T1-008 [US-INFRA-001] Create `EventProApplication.java` in `eventpro-api/modules/eventpro-api/src/main/java/com/accessplus/eventpro/`
- [X] T1-009 [US-INFRA-001] Verify application runs on localhost:8080 with health check endpoint

### Module Structure Setup

- [X] T1-010 [P] [US-INFRA-001] Create `eventpro-api/modules/eventpro-core` module with `build.gradle` (common utilities, base entities)
- [X] T1-011 [P] [US-INFRA-001] Create `eventpro-api/modules/eventpro-event` module with `build.gradle` (event management)
- [X] T1-012 [P] [US-INFRA-001] Create `eventpro-api/modules/eventpro-order` module with `build.gradle` (cart, orders)
- [X] T1-013 [P] [US-INFRA-001] Create `eventpro-api/modules/eventpro-payment` module with `build.gradle` (payment processing)
- [X] T1-014 [P] [US-INFRA-001] Create `eventpro-api/modules/eventpro-notification` module with `build.gradle` (notifications)
- [X] T1-015 [US-INFRA-001] Configure all modules in root `eventpro-api/settings.gradle`

### Frontend Setup

- [X] T1-016 [P] [US-INFRA-002] Create React 19 + TypeScript + Vite project in `web/` directory
- [X] T1-017 [US-INFRA-002] Configure TypeScript 5.x with strict mode in `web/tsconfig.json`
- [X] T1-018 [US-INFRA-002] Configure Vite 7.x in `web/vite.config.ts`
- [X] T1-019 [US-INFRA-002] Install React Router in `web/package.json`
- [X] T1-020 [US-INFRA-002] Create basic routing structure in `web/src/App.tsx`
- [X] T1-021 [US-INFRA-002] Verify frontend runs on localhost:5173 with HMR working

### UI Library Setup

- [X] T1-022 [US-INFRA-003] Install Tailwind CSS 3.x in `web/` directory
- [X] T1-023 [US-INFRA-003] Configure Tailwind in `web/tailwind.config.js`
- [X] T1-024 [US-INFRA-003] Initialize shadcn/ui with `npx shadcn@latest init` in `web/`
- [X] T1-025 [US-INFRA-003] Add shadcn/ui Button component: `npx shadcn@latest add button`
- [X] T1-026 [US-INFRA-003] Add shadcn/ui Card component: `npx shadcn@latest add card`
- [X] T1-027 [US-INFRA-003] Add shadcn/ui Input component: `npx shadcn@latest add input`
- [X] T1-028 [US-INFRA-003] Verify shadcn/ui components render correctly in sample page

### State Management Setup

- [X] T1-029 [US-INFRA-004] Install Redux Toolkit and React-Redux in `web/package.json`
- [X] T1-030 [US-INFRA-004] Create `web/src/store/index.ts` with Redux store configuration
- [X] T1-031 [US-INFRA-004] Configure Redux DevTools integration
- [X] T1-032 [US-INFRA-004] Create `web/src/store/hooks.ts` with typed hooks (`useAppDispatch`, `useAppSelector`)
- [X] T1-033 [US-INFRA-004] Verify Redux store works with sample action/reducer

### Infrastructure as Code Setup

- [X] T1-034 [P] [US-INFRA-005] Create `terraform/modules/vpc/main.tf` with VPC configuration
- [X] T1-035 [P] [US-INFRA-005] Create `terraform/modules/vpc/variables.tf` and `outputs.tf`
- [X] T1-036 [P] [US-INFRA-006] Create `terraform/modules/rds/main.tf` for PostgreSQL 16+ RDS
- [X] T1-037 [P] [US-INFRA-006] Create `terraform/modules/rds/variables.tf` and `outputs.tf`
- [X] T1-038 [P] [US-INFRA-007] Create `terraform/modules/ecs/main.tf` for ECS Fargate cluster
- [X] T1-039 [P] [US-INFRA-007] Create `terraform/modules/ecs/variables.tf` and `outputs.tf`
- [X] T1-040 [P] [US-INFRA-008] Create `terraform/modules/alb/main.tf` for Application Load Balancer
- [X] T1-041 [P] [US-INFRA-008] Create `terraform/modules/alb/variables.tf` and `outputs.tf`
- [X] T1-042 [P] [US-INFRA-009] Create `terraform/modules/s3/main.tf` for images and frontend buckets
- [X] T1-043 [P] [US-INFRA-009] Create `terraform/modules/s3/variables.tf` and `outputs.tf`
- [X] T1-044 [P] [US-INFRA-010] Create `terraform/modules/cloudfront/main.tf` for CDN distribution
- [X] T1-045 [P] [US-INFRA-010] Create `terraform/modules/cloudfront/variables.tf` and `outputs.tf`
- [X] T1-046 [P] [US-INFRA-011] Create `terraform/modules/cognito/main.tf` for Cognito User Pool
- [X] T1-047 [P] [US-INFRA-011] Create `terraform/modules/cognito/variables.tf` and `outputs.tf`
- [X] T1-048 [P] [US-INFRA-012] Create `terraform/modules/secrets-manager/main.tf` for secrets
- [X] T1-049 [P] [US-INFRA-012] Create `terraform/modules/secrets-manager/variables.tf` and `outputs.tf`
- [X] T1-050 [US-INFRA-013] Create `terraform/data/route53.tf` to reference existing Route53 hosted zone (data source)
- [X] T1-051 [P] [US-INFRA-013] Create `terraform/modules/route53/main.tf` for DNS records (frontend, api)
- [X] T1-052 [P] [US-INFRA-013] Create `terraform/modules/route53/variables.tf` and `outputs.tf`
- [X] T1-053 [US-INFRA-013] Create Route53 A record (alias) for frontend pointing to CloudFront distribution
- [X] T1-054 [US-INFRA-013] Create Route53 A record (alias) for api pointing to ALB
- [X] T1-055 [P] [US-INFRA-014] Create `terraform/environments/dev/main.tf` using all modules
- [X] T1-056 [US-INFRA-014] Deploy dev environment infrastructure: `terraform init && terraform plan && terraform apply` (Configuration ready, see terraform/environments/dev/README.md)

### CI/CD Setup

- [ ] T1-057 [US-INFRA-015] Create `.gitlab-ci.yml` with test stage for backend unit tests
- [ ] T1-058 [US-INFRA-015] Create `.gitlab-ci.yml` with test stage for frontend unit tests
- [ ] T1-059 [US-INFRA-016] Create `.gitlab-ci.yml` with build stage for Docker images
- [ ] T1-060 [US-INFRA-016] Configure ECR push in build stage
- [ ] T1-061 [US-INFRA-017] Create `.gitlab-ci.yml` with deploy stage for dev environment
- [ ] T1-062 [US-INFRA-017] Configure blue-green deployment logic in deploy stage

### Docker Setup

- [X] T1-063 [US-INFRA-018] Create multi-stage `eventpro-api/Dockerfile` (Gradle build + JRE runtime)
- [X] T1-064 [US-INFRA-018] Create `.dockerignore` file for backend service
- [X] T1-065 [US-INFRA-018] Verify Docker image builds successfully and runs

**Checkpoint**: All infrastructure and project structure ready. Development can begin.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Base Entity and Common Utilities

- [X] T2-001 [P] [US-AUTH-003] Create `BaseEntity` abstract class in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/common/model/BaseEntity.java`
- [X] T2-002 [P] [US-AUTH-003] Create common exception classes in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/common/exception/`
- [X] T2-003 [P] [US-AUTH-003] Create `GlobalExceptionHandler` in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/common/exception/GlobalExceptionHandler.java`
- [X] T2-004 [P] [US-AUTH-003] Create utility classes in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/common/utils/`

### Database Configuration

- [X] T2-005 [US-AUTH-003] Configure PostgreSQL connection in `eventpro-api/modules/eventpro-api/src/main/resources/application.yml`
- [X] T2-006 [US-AUTH-003] Add Flyway dependency to `eventpro-api/modules/eventpro-api/build.gradle` (org.flywaydb:flyway-core)
- [X] T2-007 [US-AUTH-003] Configure Flyway in `eventpro-api/modules/eventpro-api/src/main/resources/application.yml` (enable Flyway, set locations to db/migration, set baseline-on-migrate to true)
- [X] T2-008 [US-AUTH-003] Verify JPA ddl-auto is set to `validate` (NOT create, update, or create-drop) to prevent JPA from managing schema
- [X] T2-009 [US-AUTH-003] Create migration directory `eventpro-api/modules/eventpro-api/src/main/resources/db/migration/`
- [X] T2-010 [US-AUTH-003] Verify Flyway creates schema history table on first run (Flyway automatically creates `flyway_schema_history` table - no manual migration needed)

### Authentication Framework

- [X] T2-011 [US-AUTH-001] Add AWS Cognito SDK dependency to `eventpro-api/modules/eventpro-core/build.gradle`
- [ ] T2-012 [US-AUTH-001] Create `CognitoConfig` class in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/config/CognitoConfig.java`
- [ ] T2-013 [US-AUTH-001] Configure JWT decoder for Cognito in `CognitoConfig`
- [ ] T2-014 [US-AUTH-001] Create `SecurityConfig` class in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/security/SecurityConfig.java`
- [ ] T2-015 [US-AUTH-001] Configure Spring Security filter chain with OAuth2 resource server
- [ ] T2-016 [US-AUTH-001] Configure JWT token validation in `SecurityConfig`
- [ ] T2-017 [US-AUTH-002] Create `CognitoRoleMapper` in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/security/CognitoRoleMapper.java`
- [ ] T2-018 [US-AUTH-002] Implement mapping from Cognito groups to Spring Security roles (ADMIN, ORGANIZER, USER)
- [ ] T2-019 [US-AUTH-001] Test authentication with sample protected endpoint

### SQS Messaging Framework

- [X] T2-020 [US-CART-004] Add AWS SQS SDK v2 dependency to `eventpro-api/modules/eventpro-core/build.gradle`
- [X] T2-021 [US-CART-004] Create `SQSMessagePublisher` in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/messaging/sqs/SQSMessagePublisher.java`
- [ ] T2-022 [US-CART-004] Create `SQSConfig` class in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/config/SQSConfig.java`
- [ ] T2-023 [US-CART-004] Implement methods to publish messages to order-queue, payment-queue, notification-queue

### API Structure

- [ ] T2-024 [US-AUTH-005] Create base controller structure with `/api/v1` prefix
- [ ] T2-025 [US-AUTH-005] Configure Swagger/OpenAPI documentation in `eventpro-api/modules/eventpro-api`
- [ ] T2-026 [US-AUTH-005] Create `ApiResponse` wrapper class for consistent JSON responses
- [ ] T2-027 [US-AUTH-005] Create `ErrorResponse` class matching API contract schema

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Management & Authentication (Epic 2 - Priority P0)

**Goal**: Users can sign up, sign in, and manage their profiles

**Independent Test**: User can create account, sign in, view profile, and update profile

### Backend: User Entity and Repository

- [ ] T3-001 [P] [US-AUTH-003] Create `UserEntity` in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/user/entity/UserEntity.java`
- [ ] T3-002 [P] [US-AUTH-003] Add JPA annotations: `@Entity`, `@Table`, `@Id`, `@Column`, relationships
- [ ] T3-003 [P] [US-AUTH-003] Create `UserRepository` interface in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/user/repository/UserRepository.java`
- [ ] T3-004 [P] [US-AUTH-003] Add custom query methods: `findByCognitoUserId`, `findByEmail`
- [ ] T3-005 [US-AUTH-003] Create Flyway migration `V2__create_user_table.sql` in `eventpro-api/modules/eventpro-api/src/main/resources/db/migration/`
- [ ] T3-006 [US-AUTH-003] Write unit tests for `UserRepository` in `eventpro-api/modules/eventpro-core/src/test/java/com/accessplus/eventpro/core/user/repository/UserRepositoryTest.java`

### Backend: User Service

- [ ] T3-007 [US-AUTH-004] Create `UserService` interface in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/user/service/UserService.java`
- [ ] T3-008 [US-AUTH-004] Create `UserServiceImpl` in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/user/service/UserServiceImpl.java`
- [ ] T3-009 [US-AUTH-004] Implement `createUserFromCognito` method (syncs user after Cognito signup)
- [ ] T3-010 [US-AUTH-004] Implement `getUserByCognitoId` method
- [ ] T3-011 [US-AUTH-004] Implement `updateUserProfile` method
- [ ] T3-012 [US-AUTH-004] Add error handling for user not found, duplicate email
- [ ] T3-013 [US-AUTH-004] Write unit tests for `UserService` (>80% coverage)

### Backend: User Controller

- [ ] T3-014 [US-AUTH-005] Create `UserController` in `eventpro-api/modules/eventpro-api/src/main/java/com/accessplus/eventpro/api/controller/UserController.java`
- [ ] T3-015 [US-AUTH-005] Implement `GET /api/v1/users/me` endpoint (get current user)
- [ ] T3-016 [US-AUTH-005] Implement `PUT /api/v1/users/me` endpoint (update current user)
- [ ] T3-017 [US-AUTH-005] Implement `GET /api/v1/users/{id}` endpoint (admin only, with `@PreAuthorize`)
- [ ] T3-018 [US-AUTH-005] Implement `GET /api/v1/users` endpoint (admin only, paginated)
- [ ] T3-019 [US-AUTH-005] Add input validation with `@Valid` annotations
- [ ] T3-020 [US-AUTH-005] Create DTOs: `UserResponse`, `UpdateUserRequest` in `eventpro-api/modules/eventpro-api/src/main/java/com/accessplus/eventpro/api/dto/`
- [ ] T3-021 [US-AUTH-005] Write integration tests for all UserController endpoints

### Frontend: Cognito Authentication

- [ ] T3-022 [US-AUTH-007] Install AWS Cognito SDK in `web/package.json`
- [ ] T3-023 [US-AUTH-007] Create `web/src/services/authService.ts` with Cognito client
- [ ] T3-024 [US-AUTH-007] Implement `signUp` method in `authService.ts`
- [ ] T3-025 [US-AUTH-007] Implement `signIn` method in `authService.ts`
- [ ] T3-026 [US-AUTH-007] Implement `signOut` method in `authService.ts`
- [ ] T3-027 [US-AUTH-007] Implement `getCurrentUser` method in `authService.ts`
- [ ] T3-028 [US-AUTH-007] Implement token storage and retrieval (localStorage)
- [ ] T3-029 [US-AUTH-007] Implement token refresh logic
- [ ] T3-030 [US-AUTH-007] Write unit tests for `authService.ts`

### Frontend: Redux Auth Slice

- [ ] T3-031 [US-AUTH-013] Create `web/src/store/slices/authSlice.ts` with Redux Toolkit
- [ ] T3-032 [US-AUTH-013] Define auth state: `user`, `token`, `isAuthenticated`, `isLoading`
- [ ] T3-033 [US-AUTH-013] Create actions: `signIn`, `signOut`, `setUser`, `setLoading`
- [ ] T3-034 [US-AUTH-013] Create async thunks: `signInAsync`, `signUpAsync`, `signOutAsync`, `fetchCurrentUser`
- [ ] T3-035 [US-AUTH-013] Implement token persistence in localStorage
- [ ] T3-036 [US-AUTH-013] Write unit tests for `authSlice.ts`

### Frontend: Login Page

- [ ] T3-037 [US-AUTH-008] Create `web/src/pages/Login.tsx` page component
- [ ] T3-038 [US-AUTH-008] Create login form with shadcn/ui Input components (email, password)
- [ ] T3-039 [US-AUTH-008] Add form validation with error messages
- [ ] T3-040 [US-AUTH-008] Add loading states during sign in
- [ ] T3-041 [US-AUTH-008] Integrate with `authService` and Redux `authSlice`
- [ ] T3-042 [US-AUTH-008] Add error handling and display error messages
- [ ] T3-043 [US-AUTH-008] Make page responsive (mobile-friendly)
- [ ] T3-044 [US-AUTH-008] Add accessibility attributes (WCAG 2.1 AA)

### Frontend: Sign Up Page

- [ ] T3-045 [US-AUTH-009] Create `web/src/pages/SignUp.tsx` page component
- [ ] T3-046 [US-AUTH-009] Create sign up form with fields: email, password, confirmPassword, firstName, lastName, phoneNumber
- [ ] T3-047 [US-AUTH-009] Add form validation (email format, password strength, matching passwords)
- [ ] T3-048 [US-AUTH-009] Add password strength indicator component
- [ ] T3-049 [US-AUTH-009] Integrate with `authService` signUp method
- [ ] T3-050 [US-AUTH-009] Handle email verification flow (redirect to verification page)
- [ ] T3-051 [US-AUTH-009] Add loading states and error handling
- [ ] T3-052 [US-AUTH-009] Make page responsive

### Frontend: Protected Routes

- [ ] T3-053 [US-AUTH-012] Create `web/src/components/common/ProtectedRoute.tsx` component
- [ ] T3-054 [US-AUTH-012] Implement route guard logic (check authentication)
- [ ] T3-055 [US-AUTH-012] Redirect to login if not authenticated
- [ ] T3-056 [US-AUTH-012] Create `AdminRoute` component for admin-only routes
- [ ] T3-057 [US-AUTH-012] Create `OrganizerRoute` component for organizer-only routes
- [ ] T3-058 [US-AUTH-012] Integrate protected routes in `web/src/App.tsx` routing

### Frontend: User Profile Page

- [ ] T3-059 [US-AUTH-011] Create `web/src/pages/Profile.tsx` page component
- [ ] T3-060 [US-AUTH-011] Display current user information (read-only view)
- [ ] T3-061 [US-AUTH-011] Create edit profile form (firstName, lastName, phoneNumber)
- [ ] T3-062 [US-AUTH-011] Add form validation
- [ ] T3-063 [US-AUTH-011] Integrate with `PUT /api/v1/users/me` endpoint
- [ ] T3-064 [US-AUTH-011] Add success/error messages
- [ ] T3-065 [US-AUTH-011] Add loading states
- [ ] T3-066 [US-AUTH-011] Make page responsive

**Checkpoint**: User authentication and profile management fully functional. Users can sign up, sign in, and manage profiles.

---

## Phase 4: Event Management (Epic 3 - Priority P0)

**Goal**: Organizers can create events, users can browse and view event details

**Independent Test**: Organizer can create event with image, users can browse events by category and view details

### Backend: Category Entity

- [ ] T4-001 [P] [US-EVENT-002] Create `CategoryEntity` in `eventpro-api/modules/eventpro-event/src/main/java/com/accessplus/eventpro/event/category/entity/CategoryEntity.java`
- [ ] T4-002 [P] [US-EVENT-002] Create `CategoryRepository` in `eventpro-api/modules/eventpro-event/src/main/java/com/accessplus/eventpro/event/category/repository/CategoryRepository.java`
- [ ] T4-003 [US-EVENT-002] Create Flyway migration `V3__create_category_table.sql`
- [ ] T4-004 [US-EVENT-002] Create seed data script `V4__seed_categories.sql` with predefined categories
- [ ] T4-005 [US-EVENT-002] Write unit tests for `CategoryRepository`

### Backend: Address Entity

- [ ] T4-006 [P] [US-EVENT-003] Create `AddressEntity` in `eventpro-api/modules/eventpro-event/src/main/java/com/accessplus/eventpro/event/address/entity/AddressEntity.java`
- [ ] T4-007 [P] [US-EVENT-003] Add one-to-one relationship with Event
- [ ] T4-008 [US-EVENT-003] Create `AddressRepository` in `eventpro-api/modules/eventpro-event/src/main/java/com/accessplus/eventpro/event/address/repository/AddressRepository.java`
- [ ] T4-009 [US-EVENT-003] Create Flyway migration `V5__create_address_table.sql`
- [ ] T4-010 [US-EVENT-003] Write unit tests for `AddressRepository`

### Backend: Event Entity

- [ ] T4-011 [US-EVENT-001] Create `EventEntity` in `eventpro-api/modules/eventpro-event/src/main/java/com/accessplus/eventpro/event/event/entity/EventEntity.java`
- [ ] T4-012 [US-EVENT-001] Add relationships: organizer (User), category, address, tickets
- [ ] T4-013 [US-EVENT-001] Create `EventRepository` in `eventpro-api/modules/eventpro-event/src/main/java/com/accessplus/eventpro/event/event/repository/EventRepository.java`
- [ ] T4-014 [US-EVENT-001] Add custom query methods: `findByCategory`, `findByOrganizer`, `findByMarketingEnabled`
- [ ] T4-015 [US-EVENT-001] Create Flyway migration `V6__create_event_table.sql`
- [ ] T4-016 [US-EVENT-001] Write unit tests for `EventRepository`

### Backend: S3 Image Service

- [ ] T180 [US-EVENT-005] Add AWS S3 SDK v2 dependency to `eventpro-api/modules/eventpro-core/build.gradle`
- [ ] T181 [US-EVENT-005] Create `AWSS3ImageService` in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/service/AWSS3ImageService.java`
- [ ] T182 [US-EVENT-005] Implement `uploadImage` method (multipart file upload)
- [ ] T183 [US-EVENT-005] Implement `deleteImage` method
- [ ] T184 [US-EVENT-005] Implement `getImageUrl` method
- [ ] T185 [US-EVENT-005] Add image validation (size, format: JPEG, PNG, WebP)
- [ ] T186 [US-EVENT-005] Add image optimization (resize, compress) - optional
- [ ] T187 [US-EVENT-005] Write unit tests for `AWSS3ImageService`

### Backend: Event Service

- [ ] T188 [US-EVENT-004] Create `EventService` interface in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/service/EventService.java`
- [ ] T189 [US-EVENT-004] Create `EventServiceImpl` in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/service/EventServiceImpl.java`
- [ ] T190 [US-EVENT-004] Implement `createEvent` method (with image upload)
- [ ] T191 [US-EVENT-004] Implement `updateEvent` method
- [ ] T192 [US-EVENT-004] Implement `deleteEvent` method
- [ ] T193 [US-EVENT-004] Implement `getEventById` method
- [ ] T194 [US-EVENT-004] Implement `getAllEvents` method (paginated)
- [ ] T195 [US-EVENT-004] Implement `getEventsByCategory` method
- [ ] T196 [US-EVENT-004] Implement `getEventsByOrganizer` method
- [ ] T197 [US-EVENT-004] Add error handling and validation
- [ ] T198 [US-EVENT-004] Write unit tests for `EventService` (>80% coverage)

### Backend: Event Controller

- [ ] T199 [US-EVENT-006] Create `EventController` in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/api/controller/EventController.java`
- [ ] T200 [US-EVENT-006] Implement `POST /api/v1/events` endpoint (admin/organizer only)
- [ ] T201 [US-EVENT-006] Implement `GET /api/v1/events/{id}` endpoint (public)
- [ ] T202 [US-EVENT-006] Implement `GET /api/v1/events` endpoint (public, paginated, searchable)
- [ ] T203 [US-EVENT-006] Implement `GET /api/v1/events/category/{categoryId}` endpoint (public)
- [ ] T204 [US-EVENT-006] Implement `PATCH /api/v1/events/{id}` endpoint (admin/organizer only)
- [ ] T205 [US-EVENT-006] Implement `DELETE /api/v1/events/{id}` endpoint (admin/organizer only)
- [ ] T206 [US-EVENT-006] Add multipart file upload support for image in POST endpoint
- [ ] T207 [US-EVENT-006] Create DTOs: `EventResponse`, `CreateEventRequest`, `UpdateEventRequest`
- [ ] T208 [US-EVENT-006] Add role-based authorization with `@PreAuthorize`
- [ ] T209 [US-EVENT-006] Write integration tests for all EventController endpoints

### Frontend: Redux Event Slice

- [ ] T210 [US-EVENT-011] Create `web/src/store/slices/eventSlice.ts` with Redux Toolkit
- [ ] T211 [US-EVENT-011] Define event state: `events`, `currentEvent`, `isLoading`, `error`
- [ ] T212 [US-EVENT-011] Create actions: `setEvents`, `setCurrentEvent`, `setLoading`, `setError`
- [ ] T213 [US-EVENT-011] Create async thunks: `fetchEvents`, `fetchEvent`, `createEvent`, `updateEvent`, `deleteEvent`
- [ ] T214 [US-EVENT-011] Add caching logic for events
- [ ] T215 [US-EVENT-011] Write unit tests for `eventSlice.ts`

### Frontend: Event API Service

- [ ] T216 [US-EVENT-007] Create `web/src/services/eventService.ts` with API client
- [ ] T217 [US-EVENT-007] Implement `getEvents` method (with pagination, search, category filter)
- [ ] T218 [US-EVENT-007] Implement `getEventById` method
- [ ] T219 [US-EVENT-007] Implement `createEvent` method (with image upload)
- [ ] T220 [US-EVENT-007] Implement `updateEvent` method
- [ ] T221 [US-EVENT-007] Implement `deleteEvent` method
- [ ] T222 [US-EVENT-007] Add error handling and retry logic
- [ ] T223 [US-EVENT-007] Write unit tests for `eventService.ts`

### Frontend: Event Listing Page

- [ ] T224 [US-EVENT-007] Create `web/src/pages/Events.tsx` page component
- [ ] T225 [US-EVENT-007] Create event card component in `web/src/components/events/EventCard.tsx`
- [ ] T226 [US-EVENT-007] Display event cards with image, name, date, location
- [ ] T227 [US-EVENT-007] Implement pagination or infinite scroll
- [ ] T228 [US-EVENT-007] Create category filter component
- [ ] T229 [US-EVENT-007] Create search input component
- [ ] T230 [US-EVENT-007] Implement sort by date, popularity
- [ ] T231 [US-EVENT-007] Add loading states (skeleton loaders)
- [ ] T232 [US-EVENT-007] Add error handling and error messages
- [ ] T233 [US-EVENT-007] Make page responsive
- [ ] T234 [US-EVENT-007] Integrate with Redux `eventSlice`

### Frontend: Event Detail Page

- [ ] T235 [US-EVENT-008] Create `web/src/pages/EventDetail.tsx` page component
- [ ] T236 [US-EVENT-008] Display event image, name, description, date, location
- [ ] T237 [US-EVENT-008] Display event organizer information
- [ ] T238 [US-EVENT-008] Display available tickets (from ticket component)
- [ ] T239 [US-EVENT-008] Integrate map component for location (Google Maps or similar)
- [ ] T240 [US-EVENT-008] Add share functionality (social sharing)
- [ ] T241 [US-EVENT-008] Add loading states
- [ ] T242 [US-EVENT-008] Add error handling
- [ ] T243 [US-EVENT-008] Make page responsive

### Frontend: Event Creation Form

- [ ] T244 [US-EVENT-009] Create `web/src/pages/CreateEvent.tsx` page component
- [ ] T245 [US-EVENT-009] Create event form with fields: name, description, category, startTime, endTime, address, image
- [ ] T246 [US-EVENT-009] Add form validation (all required fields, date validation)
- [ ] T247 [US-EVENT-009] Create image upload component with preview
- [ ] T248 [US-EVENT-009] Integrate address autocomplete (Google Places API or similar)
- [ ] T249 [US-EVENT-009] Add date/time picker component
- [ ] T250 [US-EVENT-009] Implement save functionality (POST to API)
- [ ] T251 [US-EVENT-009] Add success/error messages
- [ ] T252 [US-EVENT-009] Add loading states
- [ ] T253 [US-EVENT-009] Make form responsive
- [ ] T254 [US-EVENT-009] Protect route (organizer/admin only)

### Frontend: Event Update Form

- [ ] T255 [US-EVENT-010] Create `web/src/pages/EditEvent.tsx` page component
- [ ] T256 [US-EVENT-010] Pre-populate form with existing event data
- [ ] T257 [US-EVENT-010] Make all fields editable
- [ ] T258 [US-EVENT-010] Add image update functionality
- [ ] T259 [US-EVENT-010] Implement save functionality (PATCH to API)
- [ ] T260 [US-EVENT-010] Add success/error messages
- [ ] T261 [US-EVENT-010] Make form responsive
- [ ] T262 [US-EVENT-010] Protect route (organizer/admin only)

**Checkpoint**: Event management fully functional. Organizers can create/update events, users can browse and view event details.

---

## Phase 5: Ticket Management (Epic 4 - Priority P0)

**Goal**: Organizers can create tickets, users can view and select tickets for purchase

**Independent Test**: Organizer creates tickets for event, user views available tickets and selects quantity

### Backend: Ticket Entity

- [ ] T263 [P] [US-TICKET-001] Create `TicketEntity` in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/entity/TicketEntity.java`
- [ ] T264 [P] [US-TICKET-001] Add enums: `TicketType` (VIP, REGULAR, EARLY_BIRD), `TicketStatus` (AVAILABLE, SOLD, RESERVED)
- [ ] T265 [P] [US-TICKET-001] Add relationships: event, purchaser (User), creator (User), orderItem
- [ ] T266 [US-TICKET-001] Create `TicketRepository` in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/repository/TicketRepository.java`
- [ ] T267 [US-TICKET-001] Add custom query methods: `findByEvent`, `findByStatus`, `findByEventAndType`
- [ ] T268 [US-TICKET-001] Create Flyway migration `V7__create_ticket_table.sql`
- [ ] T269 [US-TICKET-001] Write unit tests for `TicketRepository`

### Backend: QR Code Service

- [ ] T270 [US-TICKET-003] Add QR code library dependency (e.g., ZXing) to `eventpro-api/modules/eventpro-core/build.gradle`
- [ ] T271 [US-TICKET-003] Create `QRCodeService` in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/service/QRCodeService.java`
- [ ] T272 [US-TICKET-003] Implement `generateQRCode` method (creates QR code image with ticket ID)
- [ ] T273 [US-TICKET-003] Implement `uploadQRCodeToS3` method (stores QR code image in S3)
- [ ] T274 [US-TICKET-003] Implement `getQRCodeUrl` method
- [ ] T275 [US-TICKET-003] Write unit tests for `QRCodeService`

### Backend: Ticket Service

- [ ] T276 [US-TICKET-002] Create `TicketService` interface in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/service/TicketService.java`
- [ ] T277 [US-TICKET-002] Create `TicketServiceImpl` in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/service/TicketServiceImpl.java`
- [ ] T278 [US-TICKET-002] Implement `createTickets` method (bulk creation for event)
- [ ] T279 [US-TICKET-002] Implement `updateTicket` method
- [ ] T280 [US-TICKET-002] Implement `deleteTicket` method
- [ ] T281 [US-TICKET-002] Implement `getTicketById` method
- [ ] T282 [US-TICKET-002] Implement `getTicketsByEvent` method
- [ ] T283 [US-TICKET-002] Implement `groupTicketsByType` method
- [ ] T284 [US-TICKET-002] Implement `checkTicketAvailability` method
- [ ] T285 [US-TICKET-002] Integrate QR code generation when ticket is sold
- [ ] T286 [US-TICKET-002] Add error handling and validation
- [ ] T287 [US-TICKET-002] Write unit tests for `TicketService` (>80% coverage)

### Backend: Ticket Controller

- [ ] T288 [US-TICKET-004] Create `TicketController` in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/api/controller/TicketController.java`
- [ ] T289 [US-TICKET-004] Implement `POST /api/v1/tickets` endpoint (admin/organizer only, bulk creation)
- [ ] T290 [US-TICKET-004] Implement `GET /api/v1/tickets/{id}` endpoint (public)
- [ ] T291 [US-TICKET-004] Implement `GET /api/v1/tickets/event/{eventId}` endpoint (public)
- [ ] T292 [US-TICKET-004] Implement `GET /api/v1/tickets/groupTickets/{eventId}` endpoint (public, groups by type)
- [ ] T293 [US-TICKET-004] Implement `GET /api/v1/tickets/group/{eventId}` endpoint (public, summary)
- [ ] T294 [US-TICKET-004] Implement `PATCH /api/v1/tickets/{id}` endpoint (admin/organizer only)
- [ ] T295 [US-TICKET-004] Implement `DELETE /api/v1/tickets/{id}` endpoint (admin/organizer only)
- [ ] T296 [US-TICKET-004] Create DTOs: `TicketResponse`, `CreateTicketRequest`, `BulkCreateTicketRequest`
- [ ] T297 [US-TICKET-004] Add role-based authorization
- [ ] T298 [US-TICKET-004] Write integration tests for all TicketController endpoints

### Frontend: Redux Ticket Slice

- [ ] T299 [US-TICKET-008] Create `web/src/store/slices/ticketSlice.ts` with Redux Toolkit
- [ ] T300 [US-TICKET-008] Define ticket state: `tickets`, `currentTicket`, `isLoading`, `error`
- [ ] T301 [US-TICKET-008] Create actions: `setTickets`, `setCurrentTicket`, `setLoading`, `setError`
- [ ] T302 [US-TICKET-008] Create async thunks: `fetchTickets`, `fetchTicket`, `createTickets`, `updateTicket`
- [ ] T303 [US-TICKET-008] Add caching logic
- [ ] T304 [US-TICKET-008] Write unit tests for `ticketSlice.ts`

### Frontend: Ticket API Service

- [ ] T305 [US-TICKET-005] Create `web/src/services/ticketService.ts` with API client
- [ ] T306 [US-TICKET-005] Implement `getTicketsByEvent` method
- [ ] T307 [US-TICKET-005] Implement `getTicketById` method
- [ ] T308 [US-TICKET-005] Implement `createTickets` method (bulk)
- [ ] T309 [US-TICKET-005] Implement `updateTicket` method
- [ ] T310 [US-TICKET-005] Write unit tests for `ticketService.ts`

### Frontend: Ticket Selection Interface

- [ ] T311 [US-TICKET-005] Create `web/src/components/tickets/TicketSelector.tsx` component
- [ ] T312 [US-TICKET-005] Display available ticket types with prices
- [ ] T313 [US-TICKET-005] Create quantity selector for each ticket type
- [ ] T314 [US-TICKET-005] Implement total price calculation
- [ ] T315 [US-TICKET-005] Add "Add to Cart" button functionality
- [ ] T316 [US-TICKET-005] Add availability indicators (sold out, low stock)
- [ ] T317 [US-TICKET-005] Add loading states
- [ ] T318 [US-TICKET-005] Add error handling
- [ ] T319 [US-TICKET-005] Make component responsive
- [ ] T320 [US-TICKET-005] Integrate with Redux `ticketSlice` and `cartSlice`

### Frontend: Ticket Creation Form

- [ ] T321 [US-TICKET-006] Create `web/src/pages/CreateTickets.tsx` page component
- [ ] T322 [US-TICKET-006] Create form with fields: name, price, ticketType, quantity, startTime, endTime
- [ ] T323 [US-TICKET-006] Add form validation
- [ ] T324 [US-TICKET-006] Support bulk ticket creation (multiple ticket types in one form)
- [ ] T325 [US-TICKET-006] Add preview functionality
- [ ] T326 [US-TICKET-006] Implement save functionality
- [ ] T327 [US-TICKET-006] Add success/error messages
- [ ] T328 [US-TICKET-006] Make form responsive
- [ ] T329 [US-TICKET-006] Protect route (organizer/admin only)

### Frontend: User Tickets Page

- [ ] T330 [US-TICKET-007] Create `web/src/pages/MyTickets.tsx` page component
- [ ] T331 [US-TICKET-007] Fetch and display user's purchased tickets
- [ ] T332 [US-TICKET-007] Display ticket details: event, type, price, date
- [ ] T333 [US-TICKET-007] Display QR code for each ticket
- [ ] T334 [US-TICKET-007] Implement download ticket functionality (PDF)
- [ ] T335 [US-TICKET-007] Implement print ticket functionality
- [ ] T336 [US-TICKET-007] Add filter by event, date
- [ ] T337 [US-TICKET-007] Add loading states
- [ ] T338 [US-TICKET-007] Add error handling
- [ ] T339 [US-TICKET-007] Make page responsive
- [ ] T340 [US-TICKET-007] Protect route (authenticated users only)

**Checkpoint**: Ticket management fully functional. Organizers can create tickets, users can view and select tickets.

---

## Phase 6: Shopping Cart & Orders (Epic 5 - Priority P0)

**Goal**: Users can add tickets to cart, checkout, and create orders

**Independent Test**: User adds tickets to cart, proceeds to checkout, creates order

### Backend: Cart Entity

- [ ] T341 [P] [US-CART-001] Create `CartEntity` in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/entity/CartEntity.java`
- [ ] T342 [P] [US-CART-001] Add relationships: user, ticket
- [ ] T343 [US-CART-001] Create `CartRepository` in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/repository/CartRepository.java`
- [ ] T344 [US-CART-001] Add custom query methods: `findByUser`, `findByUserAndTicket`
- [ ] T345 [US-CART-001] Create Flyway migration `V8__create_cart_table.sql` with unique constraint on user+ticket
- [ ] T346 [US-CART-001] Write unit tests for `CartRepository`

### Backend: Order and OrderItem Entities

- [ ] T347 [P] [US-CART-002] Create `OrderEntity` in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/entity/OrderEntity.java`
- [ ] T348 [P] [US-CART-002] Add enum: `OrderStatus` (PENDING, PAID, CANCELLED, REFUNDED)
- [ ] T349 [P] [US-CART-002] Add relationships: user, orderItems, payment
- [ ] T350 [P] [US-CART-002] Create `OrderItemEntity` in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/entity/OrderItemEntity.java`
- [ ] T351 [P] [US-CART-002] Add relationships: order, ticket
- [ ] T352 [US-CART-002] Create `OrderRepository` in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/repository/OrderRepository.java`
- [ ] T353 [US-CART-002] Create `OrderItemRepository` in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/repository/OrderItemRepository.java`
- [ ] T354 [US-CART-002] Add custom query methods: `findByUser`, `findByStatus`, `findByOrderNumber`
- [ ] T355 [US-CART-002] Create Flyway migration `V9__create_order_and_order_item_tables.sql`
- [ ] T356 [US-CART-002] Write unit tests for repositories

### Backend: Cart Service

- [ ] T357 [US-CART-003] Create `CartService` interface in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/service/CartService.java`
- [ ] T358 [US-CART-003] Create `CartServiceImpl` in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/service/CartServiceImpl.java`
- [ ] T359 [US-CART-003] Implement `addItemToCart` method (with ticket availability check)
- [ ] T360 [US-CART-003] Implement `updateCartItemQuantity` method
- [ ] T361 [US-CART-003] Implement `removeItemFromCart` method
- [ ] T362 [US-CART-003] Implement `getUserCart` method
- [ ] T363 [US-CART-003] Implement `clearCart` method
- [ ] T364 [US-CART-003] Add cart validation (ticket availability, quantity limits)
- [ ] T365 [US-CART-003] Add error handling
- [ ] T366 [US-CART-003] Write unit tests for `CartService` (>80% coverage)

### Backend: Order Service

- [ ] T367 [US-CART-004] Create `OrderService` interface in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/service/OrderService.java`
- [ ] T368 [US-CART-004] Create `OrderServiceImpl` in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/service/OrderServiceImpl.java`
- [ ] T369 [US-CART-004] Implement `createOrderFromCart` method (creates order, publishes to SQS)
- [ ] T370 [US-CART-004] Implement `getOrderById` method
- [ ] T371 [US-CART-004] Implement `getUserOrders` method
- [ ] T372 [US-CART-004] Implement `updateOrderStatus` method
- [ ] T373 [US-CART-004] Implement `generateOrderNumber` method (unique order number generation)
- [ ] T374 [US-CART-004] Integrate with `SQSMessagePublisher` to publish order to order-queue
- [ ] T375 [US-CART-004] Add error handling and validation
- [ ] T376 [US-CART-004] Write unit tests for `OrderService` (>80% coverage)

### Backend: Cart Controller

- [ ] T377 [US-CART-005] Create `CartController` in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/api/controller/CartController.java`
- [ ] T378 [US-CART-005] Implement `POST /api/v1/cart/add` endpoint (authenticated users only)
- [ ] T379 [US-CART-005] Implement `GET /api/v1/cart` endpoint (authenticated users only)
- [ ] T380 [US-CART-005] Implement `PATCH /api/v1/cart/update` endpoint (authenticated users only)
- [ ] T381 [US-CART-005] Implement `DELETE /api/v1/cart/delete/{itemId}` endpoint (authenticated users only)
- [ ] T382 [US-CART-005] Implement `DELETE /api/v1/cart/clear` endpoint (authenticated users only)
- [ ] T383 [US-CART-005] Create DTOs: `CartResponse`, `CartItemResponse`, `AddToCartRequest`, `UpdateCartRequest`
- [ ] T384 [US-CART-005] Write integration tests for all CartController endpoints

### Backend: Order Controller

- [ ] T385 [US-CART-006] Create `OrderController` in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/api/controller/OrderController.java`
- [ ] T386 [US-CART-006] Implement `POST /api/v1/orders` endpoint (create order from cart, authenticated users only)
- [ ] T387 [US-CART-006] Implement `GET /api/v1/orders/{id}` endpoint (authenticated users, own orders or admin)
- [ ] T388 [US-CART-006] Implement `GET /api/v1/orders` endpoint (user's orders, or all orders if admin)
- [ ] T389 [US-CART-006] Create DTOs: `OrderResponse`, `OrderItemResponse`, `CreateOrderRequest`
- [ ] T390 [US-CART-006] Add role-based authorization
- [ ] T391 [US-CART-006] Write integration tests for all OrderController endpoints

### Frontend: Redux Cart Slice

- [ ] T392 [US-CART-009] Create `web/src/store/slices/cartSlice.ts` with Redux Toolkit
- [ ] T393 [US-CART-009] Define cart state: `items`, `total`, `isLoading`, `error`
- [ ] T394 [US-CART-009] Create actions: `addItem`, `updateItem`, `removeItem`, `clearCart`, `setLoading`, `setError`
- [ ] T395 [US-CART-009] Create async thunks: `fetchCart`, `addToCart`, `updateCart`, `removeFromCart`, `clearCart`
- [ ] T396 [US-CART-009] Implement cart persistence in localStorage
- [ ] T397 [US-CART-009] Write unit tests for `cartSlice.ts`

### Frontend: Cart API Service

- [ ] T398 [US-CART-007] Create `web/src/services/cartService.ts` with API client
- [ ] T399 [US-CART-007] Implement `getCart` method
- [ ] T400 [US-CART-007] Implement `addToCart` method
- [ ] T401 [US-CART-007] Implement `updateCartItem` method
- [ ] T402 [US-CART-007] Implement `removeFromCart` method
- [ ] T403 [US-CART-007] Implement `clearCart` method
- [ ] T404 [US-CART-007] Write unit tests for `cartService.ts`

### Frontend: Shopping Cart Page

- [ ] T405 [US-CART-007] Create `web/src/pages/Cart.tsx` page component
- [ ] T406 [US-CART-007] Display cart items with ticket name, quantity, price
- [ ] T407 [US-CART-007] Implement update quantity functionality
- [ ] T408 [US-CART-007] Implement remove item functionality
- [ ] T409 [US-CART-007] Display total price calculation
- [ ] T410 [US-CART-007] Add "Proceed to Checkout" button
- [ ] T411 [US-CART-007] Create empty cart state component
- [ ] T412 [US-CART-007] Add loading states
- [ ] T413 [US-CART-007] Add error handling
- [ ] T414 [US-CART-007] Make page responsive
- [ ] T415 [US-CART-007] Integrate with Redux `cartSlice`

### Frontend: Checkout Flow

- [ ] T416 [US-CART-008] Create `web/src/pages/Checkout.tsx` page component
- [ ] T417 [US-CART-008] Display order summary (items, quantities, total)
- [ ] T418 [US-CART-008] Create payment method selection component
- [ ] T419 [US-CART-008] Create billing information form
- [ ] T420 [US-CART-008] Add form validation
- [ ] T421 [US-CART-008] Implement "Place Order" functionality (creates order, redirects to payment)
- [ ] T422 [US-CART-008] Add order confirmation message
- [ ] T423 [US-CART-008] Add loading states
- [ ] T424 [US-CART-008] Add error handling
- [ ] T425 [US-CART-008] Make page responsive
- [ ] T426 [US-CART-008] Protect route (authenticated users only)

**Checkpoint**: Shopping cart and order creation fully functional. Users can add tickets to cart, checkout, and create orders.

---

## Phase 7: Order Processing Lambda (Epic 5 - Priority P0)

**Goal**: Orders are validated and tickets are reserved asynchronously

**Independent Test**: Order created in database triggers Lambda, tickets are reserved, message published to payment queue

### Lambda: Order Processor Setup

- [ ] T427 [US-CART-004] Configure Quarkus Lambda handler in `lambdas/order-processor/src/main/resources/application.properties`
- [ ] T428 [US-CART-004] Add AWS SQS SDK dependency to `lambdas/order-processor/build.gradle`
- [ ] T429 [US-CART-004] Add PostgreSQL/Hibernate dependencies for database access
- [ ] T430 [US-CART-004] Create Lambda handler class in `lambdas/order-processor/src/main/java/com/accessplus/eventpro/order/handler/OrderProcessorHandler.java`
- [ ] T431 [US-CART-004] Implement `RequestHandler` interface for SQS event processing

### Lambda: Order Processing Logic

- [ ] T432 [US-CART-004] Create `OrderProcessorService` in `lambdas/order-processor/src/main/java/com/accessplus/eventpro/order/service/OrderProcessorService.java`
- [ ] T433 [US-CART-004] Implement `processOrder` method (validates order, reserves tickets)
- [ ] T434 [US-CART-004] Implement ticket availability check logic
- [ ] T435 [US-CART-004] Implement ticket reservation (update status to RESERVED)
- [ ] T436 [US-CART-004] Implement order status update (PENDING)
- [ ] T437 [US-CART-004] Implement publish to payment-queue (if validation successful)
- [ ] T438 [US-CART-004] Implement error handling (send to DLQ if validation fails)
- [ ] T439 [US-CART-004] Add logging for important operations
- [ ] T440 [US-CART-004] Write unit tests for `OrderProcessorService`

### Lambda: Configuration and Deployment

- [ ] T441 [US-CART-004] Configure environment variables (database URL, SQS queue URLs)
- [ ] T442 [US-CART-004] Create `terraform/modules/lambda/order-processor.tf` for Lambda function
- [ ] T443 [US-CART-004] Configure SQS event source mapping in Terraform
- [ ] T444 [US-CART-004] Configure IAM roles and policies for Lambda
- [ ] T445 [US-CART-004] Test Lambda locally with SQS event

**Checkpoint**: Order processing Lambda functional. Orders are validated and tickets reserved asynchronously.

---

## Phase 8: Payment Processing (Epic 6 - Priority P0)

**Goal**: Payments are processed securely via Stripe, orders are fulfilled

**Independent Test**: Payment processed successfully, order status updated to PAID, tickets assigned to user

### Backend: Payment Entity

- [ ] T446 [P] [US-PAY-002] Create `PaymentEntity` in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/entity/PaymentEntity.java`
- [ ] T447 [P] [US-PAY-002] Add enum: `PaymentStatus` (PENDING, SUCCESS, FAILED, REFUNDED)
- [ ] T448 [P] [US-PAY-002] Add relationship: order (one-to-one)
- [ ] T449 [US-PAY-002] Create `PaymentRepository` in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/repository/PaymentRepository.java`
- [ ] T450 [US-PAY-002] Create Flyway migration `V10__create_payment_table.sql`
- [ ] T451 [US-PAY-002] Write unit tests for `PaymentRepository`

### Backend: Stripe Integration

- [ ] T452 [US-PAY-001] Add Stripe Java SDK dependency to `eventpro-api/modules/eventpro-core/build.gradle`
- [ ] T453 [US-PAY-001] Create `StripeService` in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/service/StripeService.java`
- [ ] T454 [US-PAY-001] Implement `createPaymentIntent` method
- [ ] T455 [US-PAY-001] Implement `confirmPayment` method
- [ ] T456 [US-PAY-001] Implement `handleWebhook` method (signature verification)
- [ ] T457 [US-PAY-001] Configure Stripe API keys from AWS Secrets Manager
- [ ] T458 [US-PAY-001] Add error handling for Stripe API errors
- [ ] T459 [US-PAY-001] Write unit tests for `StripeService`

### Backend: Payment Service

- [ ] T460 [US-PAY-003] Create `PaymentService` interface in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/service/PaymentService.java`
- [ ] T461 [US-PAY-003] Create `PaymentServiceImpl` in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/service/PaymentServiceImpl.java`
- [ ] T462 [US-PAY-003] Implement `processPayment` method (creates payment intent, processes payment)
- [ ] T463 [US-PAY-003] Implement `handlePaymentWebhook` method (updates payment status from Stripe webhook)
- [ ] T464 [US-PAY-003] Implement `updatePaymentStatus` method
- [ ] T465 [US-PAY-003] Implement `refundPayment` method (admin only)
- [ ] T466 [US-PAY-003] Integrate order status update after payment
- [ ] T467 [US-PAY-003] Add payment validation (amount matching, order status)
- [ ] T468 [US-PAY-003] Add error handling
- [ ] T469 [US-PAY-003] Write unit tests for `PaymentService` (>80% coverage)

### Backend: Payment Controller

- [ ] T470 [US-PAY-004] Create `PaymentController` in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/api/controller/PaymentController.java`
- [ ] T471 [US-PAY-004] Implement `POST /api/v1/payments/stripe` endpoint (process Stripe payment)
- [ ] T472 [US-PAY-004] Implement `POST /api/v1/payments/webhook` endpoint (Stripe webhook, no auth required)
- [ ] T473 [US-PAY-004] Implement `GET /api/v1/payments/{id}` endpoint (authenticated users, own payments or admin)
- [ ] T474 [US-PAY-004] Implement `POST /api/v1/payments/{id}/refund` endpoint (admin only)
- [ ] T475 [US-PAY-004] Add webhook signature verification in webhook endpoint
- [ ] T476 [US-PAY-004] Create DTOs: `PaymentResponse`, `ProcessPaymentRequest`, `RefundRequest`
- [ ] T477 [US-PAY-004] Write integration tests for all PaymentController endpoints

### Lambda: Payment Processor Setup

- [ ] T478 [US-PAY-003] Configure Quarkus Lambda handler in `lambdas/payment-processor/src/main/resources/application.properties`
- [ ] T479 [US-PAY-003] Add Stripe Java SDK dependency to `lambdas/payment-processor/build.gradle`
- [ ] T480 [US-PAY-003] Add AWS SQS SDK and PostgreSQL dependencies
- [ ] T481 [US-PAY-003] Create Lambda handler class in `lambdas/payment-processor/src/main/java/com/accessplus/eventpro/payment/handler/PaymentProcessorHandler.java`

### Lambda: Payment Processing Logic

- [ ] T482 [US-PAY-003] Create `PaymentProcessorService` in `lambdas/payment-processor/src/main/java/com/accessplus/eventpro/payment/service/PaymentProcessorService.java`
- [ ] T483 [US-PAY-003] Implement `processPayment` method (processes payment via Stripe)
- [ ] T484 [US-PAY-003] Implement payment status update (SUCCESS or FAILED)
- [ ] T485 [US-PAY-003] Implement order status update (PAID or CANCELLED)
- [ ] T486 [US-PAY-003] Implement ticket assignment (update ticket purchaser and status to SOLD)
- [ ] T487 [US-PAY-003] Implement QR code generation for assigned tickets
- [ ] T488 [US-PAY-003] Implement publish to notification-queue (if payment successful)
- [ ] T489 [US-PAY-003] Implement ticket release (if payment failed, set status back to AVAILABLE)
- [ ] T490 [US-PAY-003] Add error handling and logging
- [ ] T491 [US-PAY-003] Write unit tests for `PaymentProcessorService`

### Lambda: Configuration and Deployment

- [ ] T492 [US-PAY-003] Configure environment variables (Stripe keys from Secrets Manager, SQS queue URLs)
- [ ] T493 [US-PAY-003] Create `terraform/modules/lambda/payment-processor.tf` for Lambda function
- [ ] T494 [US-PAY-003] Configure SQS event source mapping
- [ ] T495 [US-PAY-003] Configure IAM roles and policies (Stripe API access, SQS, S3, Secrets Manager)
- [ ] T496 [US-PAY-003] Test Lambda locally with SQS event

### Frontend: Stripe Payment UI

- [ ] T497 [US-PAY-005] Install Stripe.js in `web/package.json`
- [ ] T498 [US-PAY-005] Create `web/src/components/payments/StripePayment.tsx` component
- [ ] T499 [US-PAY-005] Integrate Stripe Elements (card input fields)
- [ ] T500 [US-PAY-005] Implement payment processing (create payment intent, confirm payment)
- [ ] T501 [US-PAY-005] Add loading states during payment
- [ ] T502 [US-PAY-005] Add success/error handling
- [ ] T503 [US-PAY-005] Add payment confirmation message
- [ ] T504 [US-PAY-005] Make component responsive
- [ ] T505 [US-PAY-005] Integrate with checkout flow

**Checkpoint**: Payment processing fully functional. Payments are processed via Stripe, orders fulfilled, tickets assigned.

---

## Phase 9: Notifications (Epic 7 - Priority P1)

**Goal**: Users receive email, SMS, and in-app notifications for order confirmations and updates

**Independent Test**: Order confirmation triggers notification, user receives email/SMS/in-app notification

### Backend: Notification Entities

- [ ] T506 [P] [US-NOTIF-001] Create `NotificationEntity` in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/entity/NotificationEntity.java`
- [ ] T507 [P] [US-NOTIF-001] Create `UserNotificationEntity` in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/entity/UserNotificationEntity.java`
- [ ] T508 [P] [US-NOTIF-001] Create `NotificationPreferenceEntity` in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/entity/NotificationPreferenceEntity.java`
- [ ] T509 [US-NOTIF-001] Create repositories for all notification entities
- [ ] T510 [US-NOTIF-001] Create Flyway migration `V11__create_notification_tables.sql`
- [ ] T511 [US-NOTIF-001] Write unit tests for repositories

### Backend: AWS SES Integration

- [ ] T512 [US-NOTIF-002] Add AWS SES SDK dependency to `eventpro-api/modules/eventpro-core/build.gradle`
- [ ] T513 [US-NOTIF-002] Create `AWSSesService` in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/service/AWSSesService.java`
- [ ] T514 [US-NOTIF-002] Implement `sendEmail` method
- [ ] T515 [US-NOTIF-002] Implement email template support
- [ ] T516 [US-NOTIF-002] Add error handling
- [ ] T517 [US-NOTIF-002] Write unit tests for `AWSSesService`

### Backend: AWS SNS Integration

- [ ] T518 [US-NOTIF-003] Add AWS SNS SDK dependency to `eventpro-api/modules/eventpro-core/build.gradle`
- [ ] T519 [US-NOTIF-003] Create `SNSService` in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/service/SNSService.java`
- [ ] T520 [US-NOTIF-003] Implement `sendSMS` method
- [ ] T521 [US-NOTIF-003] Add error handling
- [ ] T522 [US-NOTIF-003] Write unit tests for `SNSService`

### Backend: Notification Service

- [ ] T523 [US-NOTIF-004] Create `NotificationService` interface in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/service/NotificationService.java`
- [ ] T524 [US-NOTIF-004] Create `NotificationServiceImpl` in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/service/NotificationServiceImpl.java`
- [ ] T525 [US-NOTIF-004] Implement `createNotification` method
- [ ] T526 [US-NOTIF-004] Implement `sendNotification` method (email, SMS, in-app based on preferences)
- [ ] T527 [US-NOTIF-004] Implement `getUserNotifications` method
- [ ] T528 [US-NOTIF-004] Implement `markNotificationAsRead` method
- [ ] T529 [US-NOTIF-004] Implement `updateNotificationPreferences` method
- [ ] T530 [US-NOTIF-004] Add delivery logic based on user preferences
- [ ] T531 [US-NOTIF-004] Write unit tests for `NotificationService` (>80% coverage)

### Backend: WebSocket Server

- [ ] T532 [US-NOTIF-005] Add Spring WebSocket dependency to `eventpro-api/modules/eventpro-core/build.gradle`
- [ ] T533 [US-NOTIF-005] Create `WebSocketConfig` in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/config/WebSocketConfig.java`
- [ ] T534 [US-NOTIF-005] Create WebSocket endpoint in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/api/controller/NotificationWebSocketController.java`
- [ ] T535 [US-NOTIF-005] Implement authentication for WebSocket connections
- [ ] T536 [US-NOTIF-005] Implement message broadcasting
- [ ] T537 [US-NOTIF-005] Implement connection management
- [ ] T538 [US-NOTIF-005] Write unit tests for WebSocket functionality

### Backend: Notification Controller

- [ ] T539 [US-NOTIF-006] Create `NotificationController` in `eventpro-api/modules/eventpro-core/src/main/java/com/accessplus/eventpro/core/api/controller/NotificationController.java`
- [ ] T540 [US-NOTIF-006] Implement `GET /api/v1/notifications` endpoint (user's notifications)
- [ ] T541 [US-NOTIF-006] Implement `GET /api/v1/notifications/{id}` endpoint
- [ ] T542 [US-NOTIF-006] Implement `PATCH /api/v1/notifications/{id}/read` endpoint
- [ ] T543 [US-NOTIF-006] Implement `GET /api/v1/notifications/preferences` endpoint
- [ ] T544 [US-NOTIF-006] Implement `PUT /api/v1/notifications/preferences` endpoint
- [ ] T545 [US-NOTIF-006] Create DTOs: `NotificationResponse`, `NotificationPreferenceResponse`
- [ ] T546 [US-NOTIF-006] Write integration tests for all NotificationController endpoints

### Lambda: Notification Sender Setup

- [ ] T547 [US-NOTIF-004] Configure Quarkus Lambda handler in `lambdas/notification-sender/src/main/resources/application.properties`
- [ ] T548 [US-NOTIF-004] Add AWS SES, SNS SDK dependencies
- [ ] T549 [US-NOTIF-004] Create Lambda handler class in `lambdas/notification-sender/src/main/java/com/accessplus/eventpro/notification/handler/NotificationSenderHandler.java`

### Lambda: Notification Sending Logic

- [ ] T550 [US-NOTIF-004] Create `NotificationSenderService` in `lambdas/notification-sender/src/main/java/com/accessplus/eventpro/notification/service/NotificationSenderService.java`
- [ ] T551 [US-NOTIF-004] Implement `sendNotification` method (processes notification message from SQS)
- [ ] T552 [US-NOTIF-004] Implement email sending via SES
- [ ] T553 [US-NOTIF-004] Implement SMS sending via SNS
- [ ] T554 [US-NOTIF-004] Implement in-app notification storage (database update)
- [ ] T555 [US-NOTIF-004] Check user preferences before sending
- [ ] T556 [US-NOTIF-004] Add error handling and logging
- [ ] T557 [US-NOTIF-004] Write unit tests for `NotificationSenderService`

### Lambda: Configuration and Deployment

- [ ] T558 [US-NOTIF-004] Configure environment variables (SES, SNS, database URLs)
- [ ] T559 [US-NOTIF-004] Create `terraform/modules/lambda/notification-sender.tf` for Lambda function
- [ ] T560 [US-NOTIF-004] Configure SQS event source mapping
- [ ] T561 [US-NOTIF-004] Configure IAM roles and policies (SES, SNS, database access)
- [ ] T562 [US-NOTIF-004] Test Lambda locally with SQS event

### Frontend: Notification UI Components

- [ ] T563 [US-NOTIF-007] Create `web/src/components/notifications/NotificationBell.tsx` component
- [ ] T564 [US-NOTIF-007] Create `web/src/components/notifications/NotificationDropdown.tsx` component
- [ ] T565 [US-NOTIF-007] Display list of notifications
- [ ] T566 [US-NOTIF-007] Implement mark as read functionality
- [ ] T567 [US-NOTIF-007] Integrate WebSocket for real-time updates
- [ ] T568 [US-NOTIF-007] Create notification preferences page
- [ ] T569 [US-NOTIF-007] Add loading states
- [ ] T570 [US-NOTIF-007] Add error handling
- [ ] T571 [US-NOTIF-007] Make components responsive

**Checkpoint**: Notifications fully functional. Users receive email, SMS, and in-app notifications.

---

## Phase 10: Analytics (Epic 8 - Priority P2)

**Goal**: Organizers and admins can view event performance and sales analytics

**Independent Test**: Organizer views analytics dashboard, sees event metrics and sales data

### Backend: Analytics Endpoints

- [ ] T572 [US-ANALYTICS-001] Create `AnalyticsController` in `eventpro-api/modules/eventpro-event/src/main/java/com/accessplus/eventpro/event/api/controller/AnalyticsController.java`
- [ ] T573 [US-ANALYTICS-001] Implement `GET /api/v1/analytics/events` endpoint (event performance metrics)
- [ ] T574 [US-ANALYTICS-001] Implement `GET /api/v1/analytics/sales` endpoint (sales analytics)
- [ ] T575 [US-ANALYTICS-001] Implement `GET /api/v1/analytics/users` endpoint (user engagement metrics)
- [ ] T576 [US-ANALYTICS-001] Implement `GET /api/v1/analytics/revenue` endpoint (revenue analytics)
- [ ] T577 [US-ANALYTICS-001] Add data aggregation logic (queries, calculations)
- [ ] T578 [US-ANALYTICS-001] Add role-based authorization (admin/organizer only)
- [ ] T579 [US-ANALYTICS-001] Create DTOs: `EventAnalyticsResponse`, `SalesAnalyticsResponse`, `RevenueAnalyticsResponse`
- [ ] T580 [US-ANALYTICS-001] Write integration tests for all AnalyticsController endpoints

### Frontend: Analytics Dashboard

- [ ] T581 [US-ANALYTICS-002] Create `web/src/pages/Analytics.tsx` page component
- [ ] T582 [US-ANALYTICS-002] Install chart library (e.g., Recharts) in `web/package.json`
- [ ] T583 [US-ANALYTICS-002] Create revenue charts (line chart, bar chart)
- [ ] T584 [US-ANALYTICS-002] Display event performance metrics
- [ ] T585 [US-ANALYTICS-002] Display sales analytics
- [ ] T586 [US-ANALYTICS-002] Display user engagement metrics
- [ ] T587 [US-ANALYTICS-002] Add date range filters
- [ ] T588 [US-ANALYTICS-002] Implement export functionality (CSV/PDF)
- [ ] T589 [US-ANALYTICS-002] Add loading states
- [ ] T590 [US-ANALYTICS-002] Add error handling
- [ ] T591 [US-ANALYTICS-002] Make dashboard responsive
- [ ] T592 [US-ANALYTICS-002] Protect route (admin/organizer only)

**Checkpoint**: Analytics dashboard functional. Organizers and admins can view event and sales analytics.

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple features, documentation, and final validation

### Documentation

- [ ] T593 [P] Update `README.md` with setup instructions
- [ ] T594 [P] Update API documentation (Swagger) with all endpoints
- [ ] T595 [P] Create developer documentation in `docs/` directory
- [ ] T596 [P] Update `quickstart.md` with any changes

### Code Quality

- [ ] T597 [P] Run code formatter on all backend code (Google Java Style Guide)
- [ ] T598 [P] Run code formatter on all frontend code (Airbnb TypeScript Style Guide)
- [ ] T599 [P] Fix all linter warnings
- [ ] T600 [P] Review and refactor code for best practices

### Testing

- [ ] T601 [P] Ensure all services have >80% unit test coverage
- [ ] T602 [P] Run all integration tests and fix failures
- [ ] T603 [P] Run E2E tests for critical user flows (signup → browse → purchase → payment)
- [ ] T604 [P] Generate test coverage reports

### Performance

- [ ] T605 [P] Optimize database queries (add missing indexes, fix N+1 problems)
- [ ] T606 [P] Add caching where appropriate (Redis or in-memory)
- [ ] T607 [P] Optimize frontend bundle size (code splitting, lazy loading)
- [ ] T608 [P] Verify API response times meet p95 < 500ms requirement

### Security

- [ ] T609 [P] Security audit: Review all endpoints for proper authorization
- [ ] T610 [P] Verify all secrets are stored in AWS Secrets Manager
- [ ] T611 [P] Verify encryption at rest and in transit
- [ ] T612 [P] Run security scanning tools (OWASP, Snyk)

### Validation

- [ ] T613 Run `quickstart.md` validation (follow all steps, verify everything works)
- [ ] T614 Verify all user stories are independently testable
- [ ] T615 Verify all API contracts match implementation
- [ ] T616 Verify data model matches database schema

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 completion - **BLOCKS all user stories**
- **Phase 3 (User Management)**: Depends on Phase 2 - Can start after foundation
- **Phase 4 (Event Management)**: Depends on Phase 2 - Can start in parallel with Phase 3
- **Phase 5 (Ticket Management)**: Depends on Phase 4 (needs Event entity)
- **Phase 6 (Cart & Orders)**: Depends on Phase 5 (needs Ticket entity)
- **Phase 7 (Order Processing Lambda)**: Depends on Phase 6 (needs Order entity and SQS)
- **Phase 8 (Payment Processing)**: Depends on Phase 6 (needs Order entity)
- **Phase 9 (Notifications)**: Depends on Phase 8 (needs Payment completion)
- **Phase 10 (Analytics)**: Depends on Phase 4, 5, 6, 8 (needs data from events, tickets, orders, payments)
- **Phase 11 (Polish)**: Depends on all previous phases

### User Story Dependencies

- **US-AUTH-001 to US-AUTH-013**: Foundation for all authenticated features
- **US-EVENT-001 to US-EVENT-011**: Foundation for event-related features
- **US-TICKET-001 to US-TICKET-008**: Depends on US-EVENT-001 (needs Event entity)
- **US-CART-001 to US-CART-009**: Depends on US-TICKET-001 (needs Ticket entity)
- **US-PAY-001 to US-PAY-006**: Depends on US-CART-004 (needs Order entity)
- **US-NOTIF-001 to US-NOTIF-007**: Depends on US-PAY-003 (needs Payment completion)

### Parallel Opportunities

- **Phase 1**: All setup tasks marked [P] can run in parallel
- **Phase 2**: All foundational tasks marked [P] can run in parallel
- **Phase 3 & 4**: Can run in parallel after Phase 2 (different entities, no dependencies)
- **Phase 5**: Must wait for Phase 4 (needs Event entity)
- **Phase 6**: Must wait for Phase 5 (needs Ticket entity)
- **Phase 7 & 8**: Can run in parallel after Phase 6 (different Lambdas, different queues)
- **Phase 9**: Must wait for Phase 8 (needs Payment completion)
- **Phase 10**: Must wait for multiple phases (needs data from events, tickets, orders, payments)
- **Phase 11**: All polish tasks marked [P] can run in parallel

### Within Each Phase

- Models/Entities marked [P] can be created in parallel
- Services can be created after their dependent entities
- Controllers can be created after their dependent services
- Frontend components can be created after backend APIs
- Tests can be written in parallel with implementation (TDD approach)

---

## Implementation Strategy

### MVP First (Minimum Viable Product)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Management (authentication)
4. Complete Phase 4: Event Management (browse events)
5. Complete Phase 5: Ticket Management (view tickets)
6. Complete Phase 6: Cart & Orders (add to cart, checkout)
7. Complete Phase 7: Order Processing Lambda (validate orders)
8. Complete Phase 8: Payment Processing (Stripe integration)
9. **STOP and VALIDATE**: Test complete user flow: Sign up → Browse events → Add tickets to cart → Checkout → Pay → Receive confirmation

### Incremental Delivery

1. **Sprint 1**: Phase 1 (Setup) + Phase 2 (Foundational) → Foundation ready
2. **Sprint 2**: Phase 3 (User Management) → Users can sign up and manage profiles
3. **Sprint 3**: Phase 4 (Event Management) → Organizers can create events, users can browse
4. **Sprint 4**: Phase 5 (Ticket Management) → Organizers can create tickets, users can view
5. **Sprint 5**: Phase 6 (Cart & Orders) → Users can add to cart and checkout
6. **Sprint 6**: Phase 7 & 8 (Order Processing & Payment) → Complete purchase flow
7. **Sprint 7**: Phase 9 (Notifications) → Users receive confirmations
8. **Sprint 8**: Phase 10 (Analytics) → Organizers can view analytics
9. **Sprint 9**: Phase 11 (Polish) → Final improvements and validation

### Parallel Team Strategy

With multiple developers:

1. **Team completes Phase 1 & 2 together** (foundation is critical)
2. **Once Phase 2 is done**:
   - Developer A: Phase 3 (User Management)
   - Developer B: Phase 4 (Event Management)
   - Developer C: Phase 1 infrastructure tasks (Terraform modules)
3. **After Phase 3 & 4 complete**:
   - Developer A: Phase 5 (Ticket Management)
   - Developer B: Phase 6 (Cart & Orders)
   - Developer C: Phase 7 (Order Processing Lambda)
4. **After Phase 6 & 7 complete**:
   - Developer A: Phase 8 (Payment Processing)
   - Developer B: Phase 9 (Notifications)
   - Developer C: Phase 10 (Analytics)
5. **Final sprint**: All developers work on Phase 11 (Polish)

---

## Notes

- **[P]** tasks = different files, no dependencies - can run in parallel
- **[Story]** label maps task to specific user story for traceability
- Each phase should be independently completable and testable
- Verify tests fail before implementing (TDD approach)
- Commit after each task or logical group
- Stop at any checkpoint to validate independently
- Avoid: vague tasks, same file conflicts, cross-phase dependencies that break independence

