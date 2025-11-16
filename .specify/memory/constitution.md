<!--
Sync Impact Report:
Version change: 1.1.0 → 2.0.0 (MAJOR: Removed Test-First Development principle - backward incompatible change)
Modified principles: 
  - Removed: III. Test-First Development (NON-NEGOTIABLE)
  - Added: III. Testing Requirements (non-TDD approach)
  - Renumbered: IV→III, V→IV, VI→V, VII→VI, VIII→VII
Added sections: None
Removed sections: Test-First Development principle
Templates requiring updates:
  ✅ plan-template.md - Removed TDD requirement from constitution check
  ✅ tasks-template.md - Updated test writing guidance to remove TDD requirement
  ✅ spec-template.md - No changes needed
Follow-up TODOs: None
-->

# EventPro Site Constitution

## Core Principles

### I. Microservices Architecture (NON-NEGOTIABLE)
EventPro Site MUST follow a microservices architecture with clear service boundaries. Each service MUST be independently deployable, scalable, and testable. Services communicate via well-defined APIs (REST) and asynchronous messaging (SQS). No shared databases between services - each service owns its data domain. This principle ensures fault isolation, independent scaling, and technology flexibility.

**Rationale**: Microservices enable independent development, deployment, and scaling of components, critical for a production event ticketing platform with varying load patterns.

### II. Event-Driven Processing (NON-NEGOTIABLE)
Asynchronous operations MUST use event-driven patterns with SQS queues. Order processing, payment processing, and notifications MUST be handled asynchronously via Lambda functions triggered by SQS events. Synchronous operations are only permitted for user-facing API requests that require immediate responses. All long-running or resource-intensive operations MUST be asynchronous.

**Rationale**: Event-driven architecture provides better resilience, scalability, and cost-effectiveness for operations that don't require immediate user feedback.

### III. Testing Requirements
Tests MUST be written for all business logic, API endpoints, and critical user flows. Minimum 80% unit test coverage for services. Integration tests required for all API endpoints. E2E tests required for critical user flows. All tests MUST pass before merge. Tests may be written before, during, or after implementation as appropriate for the development workflow.

**Rationale**: Comprehensive testing ensures code quality, prevents regressions, and provides living documentation of system behavior. Flexible test timing allows teams to choose the most effective approach for their workflow.

### IV. Latest Dependencies Policy (NON-NEGOTIABLE)
MUST use the latest stable versions of all dependencies. When implementing features or updating code, MUST verify and use latest versions via Context7 MCP for libraries and AWS Terraform MCP for infrastructure. Dependencies MUST be updated during feature development, not deferred. Version pinning is allowed only for security or compatibility reasons with documented justification.

**Current Latest Versions** (as of constitution update):
- **Frontend**: React 19.x, TypeScript 5.x, Vite 7.x, shadcn/ui (latest)
- **Backend ECS**: Spring Boot 3.5.7+, Java 21, Gradle 8.5+
- **Backend Lambda**: Quarkus 3.26.2+, Java 21, Gradle 8.5+
- **Infrastructure**: AWS Terraform Provider 6.21.0+, Terraform 1.5+
- **Database**: PostgreSQL 15+ (RDS Multi-AZ)
- **UI Components**: shadcn/ui (latest via shadcn MCP)

**Rationale**: Using latest dependencies ensures security patches, performance improvements, and access to modern features while maintaining compatibility.

### V. MCP-First Research (NON-NEGOTIABLE)
MUST use available MCPs (Model Context Protocol) for dependency research and configuration:
- **Context7 MCP**: For latest library versions, documentation, and best practices (React, Spring Boot, Quarkus, shadcn/ui, etc.)
- **AWS Terraform MCP**: For AWS infrastructure configuration, provider documentation, and resource definitions
- **shadcn MCP**: For React UI component discovery, examples, and installation commands

Before implementing any feature or updating dependencies, MUST query relevant MCPs to ensure latest versions and best practices are followed. MCP usage MUST be documented in implementation plans.

**Rationale**: MCPs provide authoritative, up-to-date information ensuring we use latest stable versions and follow current best practices.

### VI. AWS-Exclusive Infrastructure
All infrastructure MUST be deployed on AWS. Terraform MUST be used for Infrastructure as Code. No other cloud providers (Azure, GCP) are permitted. AWS services MUST be used according to best practices as documented in AWS Terraform MCP. Infrastructure changes MUST be version-controlled and reviewed.

**Rationale**: AWS-exclusive approach simplifies operations, reduces complexity, and leverages AWS ecosystem benefits.

### VII. Technology Stack Boundaries
**MUST USE**:
- PostgreSQL (RDS Multi-AZ) for primary database
- Spring Boot 3.5.7+ for ECS Fargate services
- Quarkus 3.26.2+ for Lambda functions
- React 19 + TypeScript 5.x for frontend
- shadcn/ui for React UI components
- AWS services exclusively
- Terraform for infrastructure version: 1.12.0+
- Gradle for Java builds
- GitLab CI/CD for pipelines

**MUST NOT USE**:
- Other cloud providers
- Other databases as primary (DynamoDB, MongoDB, MySQL as primary)
- Spring Boot in Lambda (use Quarkus)
- Other build tools (Maven)
- Other state management (MobX, Zustand) - use Redux Toolkit
- Other UI libraries (Material-UI, Ant Design) - use shadcn/ui

**Rationale**: Consistent technology stack reduces complexity, improves maintainability, and ensures team expertise alignment.

### VIII. Security-First Design
All endpoints MUST be secured (except explicitly public endpoints). AWS Cognito MUST be used for authentication. Secrets MUST be stored in AWS Secrets Manager, never in code or configuration files. All data MUST be encrypted at rest and in transit. Input validation MUST be performed on all user inputs. Least privilege IAM policies MUST be enforced.

**Rationale**: Security is critical for a payment processing platform handling sensitive user and financial data.

## Additional Constraints

### Database Strategy
PostgreSQL (RDS Multi-AZ) is the primary database for all services. DynamoDB may be used optionally for high-throughput temporary data (sessions, analytics counters). No direct database access from frontend. Each service owns its database schema. Database migrations MUST use Flyway or Liquibase.

### Flyway for Database Migrations
Use Flyway for database migrations. Never modify existing migrations. Test migrations in dev before production.

**Rationale**: Flyway is a mature and reliable database migration tool that is easy to use and understand. It is a good choice for the EventPro project because it is easy to use and understand.

### API Design Standards
RESTful APIs MUST follow conventions: GET, POST, PUT, PATCH, DELETE. APIs MUST be versioned: `/api/v1/...`. Consistent JSON response format required. Proper HTTP status codes MUST be used. Global exception handling MUST be implemented.

### Code Quality Standards
- **Java**: Follow Google Java Style Guide, maximum method length 50 lines, maximum class length 500 lines
- **TypeScript/React**: Follow Airbnb TypeScript Style Guide, functional components with hooks, maximum component length 200 lines
- **Package Naming**: `com.accessplus.eventpro.*` for Java, consistent naming for TypeScript modules
- **Documentation**: Javadoc for public APIs, TypeScript interfaces for all props, README updates for new features

### Performance Requirements
- API response time: p95 < 500ms for synchronous operations
- Lambda cold start: < 3 seconds
- Frontend initial load: < 3 seconds
- Database query optimization: All queries must use indexes, avoid N+1 problems

## Development Workflow

### Git Workflow
- Feature branches from `develop`
- Merge requests require approval
- Commits MUST use conventional commit messages
- All tests MUST pass before merge
- Code review MUST verify constitution compliance

### Local Development
- Docker Compose for local infrastructure (PostgreSQL, LocalStack)
- Environment variables for configuration
- Secrets MUST NOT be committed to repository
- Local development MUST mirror production architecture patterns

### CI/CD Pipeline
- **Test Stage**: Run all unit and integration tests
- **Build Stage**: Build Docker images and Lambda packages
- **Deploy Stage**: Deploy to dev/prod environments
- Branch strategy: `main` (production), `develop` (development), `feature/*` (features)
- Auto-deploy to dev on `develop` merge
- Manual approval required for production deployment

### Code Review Checklist
- [ ] Constitution compliance verified
- [ ] Tests written and passing
- [ ] Latest dependencies verified via MCPs
- [ ] Security best practices followed
- [ ] Documentation updated
- [ ] No hardcoded secrets or credentials
- [ ] Performance considerations addressed

## Governance

This constitution supersedes all other development practices and guidelines. All PRs and code reviews MUST verify compliance with these principles. Any violation of NON-NEGOTIABLE principles requires explicit justification and approval from tech lead.

**Amendment Process**:
1. Proposed changes MUST be documented with rationale
2. Changes require team review and approval
3. Version MUST be incremented per semantic versioning:
   - **MAJOR**: Backward incompatible principle removals or redefinitions
   - **MINOR**: New principle/section added or materially expanded guidance
   - **PATCH**: Clarifications, wording, typo fixes, non-semantic refinements
4. Dependent templates and documentation MUST be updated
5. Sync Impact Report MUST be generated

**Compliance Review**:
- Constitution compliance MUST be checked in every code review
- Complexity additions MUST be justified
- Technology stack deviations MUST be approved
- Use `z_docs/guideline.md` for runtime development guidance

**Version**: 2.0.0 | **Ratified**: 2025-01-15 | **Last Amended**: 2025-01-15
