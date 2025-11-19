# Research: EventPro Platform

**Date**: 2025-01-15  
**Phase**: 0 - Research & Technology Validation  
**Sources**: Context7 MCP, AWS Terraform MCP, shadcn MCP, Project Documentation

## Technology Stack Decisions

### Frontend Framework: React 19

**Decision**: Use React 19.x with TypeScript 5.x and Vite 7.x

**Rationale**:
- React 19 is the latest stable version with improved performance and developer experience
- TypeScript 5.x provides strong type safety in strict mode
- Vite 7.x offers fast HMR and optimized builds
- Context7 MCP confirms React 19 best practices for TypeScript integration

**Key Findings from Context7 MCP**:
- React 19 requires `@types/react@^19.0.0` and `@types/react-dom@^19.0.0`
- `useRef` and `createContext` now require arguments (even if `undefined`)
- `ReactElement` props default to `unknown` instead of `any` (better type safety)
- Migration codemod available: `npx types-react-codemod@latest preset-19`
- Virtual threads can be enabled in Spring Boot for better I/O performance

**Alternatives Considered**:
- React 18: Rejected - Missing React 19 performance improvements and features
- Next.js: Rejected - Overkill for this SPA, adds unnecessary complexity
- Vue/Angular: Rejected - Team expertise and project requirements favor React

### UI Component Library: shadcn/ui

**Decision**: Use shadcn/ui (latest) with Tailwind CSS 3.x

**Rationale**:
- shadcn/ui provides copy-paste components (not a dependency)
- Built on Radix UI primitives for accessibility
- Fully customizable with Tailwind CSS
- TypeScript-first design
- Constitution requires shadcn/ui (no Material-UI or Ant Design)

**Key Findings from shadcn MCP**:
- Components installed via CLI: `npx shadcn@latest add [component]`
- Update all components: `npx shadcn@latest add --all --overwrite`
- Registry configured: `@shadcn` (verified in project)
- Components are copied into project (not npm dependencies)

**Alternatives Considered**:
- Material-UI: Rejected - Constitution explicitly forbids
- Ant Design: Rejected - Constitution explicitly forbids
- Custom components: Rejected - Too time-consuming, shadcn provides better foundation

### Backend ECS Services: Spring Boot 3.5.7+

**Decision**: Use Spring Boot 3.5.7+ with Java 21 for ECS Fargate services

**Rationale**:
- Spring Boot 3.5.7+ is the latest stable version
- Java 21 provides virtual threads and performance improvements
- Spring Boot ecosystem well-suited for microservices on ECS
- Better for always-on services vs. Lambda (Quarkus)

**Key Findings from Context7 MCP**:
- Spring Boot supports virtual threads: `spring.threads.virtual.enabled: true`
- RESTful API patterns well-documented
- Global exception handling recommended
- Health check endpoints available via Actuator
- YAML configuration best practices documented

**Alternatives Considered**:
- Spring Boot in Lambda: Rejected - Constitution requires Quarkus for Lambda
- Quarkus for ECS: Rejected - Spring Boot better for always-on services, team expertise

### Backend Lambda Functions: Quarkus 3.26.2+

**Decision**: Use Quarkus 3.26.2+ with Java 21 for AWS Lambda functions

**Rationale**:
- Quarkus optimized for serverless (lower memory, faster cold starts)
- 30-40% less memory than Spring Boot
- Better cold start performance
- Constitution requires Quarkus for Lambda functions

**Key Findings from Context7 MCP**:
- Lambda handler configuration: `quarkus.lambda.handler=test` in `application.properties`
- Handler class must be annotated with `@Named("test")` matching config
- Supports `RequestHandler<?, ?>` and `RequestStreamHandler`
- SAM YAML configuration: `Handler: io.quarkus.amazon.lambda.runtime.QuarkusStreamHandler::handleRequest`
- Runtime: `java21` (latest supported)
- Native builds supported but not required for this project
- SQS event source mapping supported via Terraform

**Alternatives Considered**:
- Spring Boot in Lambda: Rejected - Constitution explicitly forbids, worse performance
- Node.js/Python: Rejected - Team expertise in Java, consistency with ECS services

### Infrastructure: AWS Terraform Provider 6.21.0+

**Decision**: Use AWS Terraform Provider 6.21.0+ for all infrastructure

**Rationale**:
- Latest stable provider version
- Supports all required AWS services
- Constitution requires Terraform for IaC

**Key Findings from AWS Terraform MCP**:

#### ECS Service (aws_ecs_service)
- Supports Fargate launch type (required)
- Blue/Green deployment strategy available
- Canary and Linear deployment strategies supported
- Deployment circuit breaker for automatic rollback
- Service Connect for service discovery
- CloudWatch deployment alarms
- Network configuration for VPC (private subnets)
- Health check grace period configurable
- Auto-scaling via `desired_count` and capacity providers

#### Lambda Function (aws_lambda_function)
- Supports Java 21 runtime (`java21`)
- VPC configuration for database access
- Dead letter queue configuration
- Environment variables support
- Ephemeral storage up to 10GB
- SnapStart for faster cold starts
- X-Ray tracing support
- Logging configuration (JSON format recommended)
- Event source mapping via `aws_lambda_event_source_mapping`

#### SQS Queue (aws_sqs_queue)
- Dead letter queue support
- Visibility timeout configuration
- Message retention (up to 14 days)
- FIFO queues for ordered processing (if needed)
- Encryption at rest and in transit

**Alternatives Considered**:
- CloudFormation: Rejected - Terraform provides better module reusability
- AWS CDK: Rejected - Team preference for HCL, better for infrastructure teams

### Database: PostgreSQL 15+ (RDS Multi-AZ)

**Decision**: Use PostgreSQL 15+ on RDS Multi-AZ as primary database

**Rationale**:
- Complex relational data model (15+ entities with relationships)
- ACID transactions required for order processing
- Complex queries (joins, aggregations, reporting)
- Cost-effective for steady workloads
- Constitution requires PostgreSQL as primary database

**Key Findings from Architecture Documentation**:
- Production cost: ~$315/month (Multi-AZ, db.r6g.large)
- Dev cost: ~$60/month (single-AZ, db.t3.medium)
- Multi-AZ automatic failover (< 60 seconds)
- Automated backups (7-day retention)
- Encryption at rest enabled
- Parameter groups for optimization

**Alternatives Considered**:
- DynamoDB as primary: Rejected - Constitution forbids, complex queries not suitable
- MySQL: Rejected - PostgreSQL better for complex queries and JSON support
- Aurora: Considered but rejected - Higher cost, PostgreSQL sufficient

### Messaging: AWS SQS

**Decision**: Use AWS SQS for asynchronous message queuing

**Rationale**:
- Event-driven architecture requirement
- 99.999999999% message durability
- Dead letter queues for error handling
- Cost-effective (pay per message)
- Constitution requires SQS for async operations

**Queue Configuration**:
- **order-queue**: Visibility timeout 5 minutes, retention 14 days, batch size 10
- **payment-queue**: Visibility timeout 15 minutes, retention 14 days, batch size 1
- **notification-queue**: Visibility timeout 60 seconds, retention 7 days, batch size 10
- All queues have DLQ configured

**Alternatives Considered**:
- SNS: Rejected - SQS better for point-to-point messaging, guaranteed delivery
- EventBridge: Considered for analytics but SQS sufficient for order processing
- Kafka: Rejected - Overkill, higher cost, SQS sufficient

### Authentication: AWS Cognito

**Decision**: Use AWS Cognito User Pool for authentication

**Rationale**:
- Constitution requires Cognito
- Managed service (no infrastructure to maintain)
- Supports email/phone verification
- Custom attributes for roles (ADMIN, ORGANIZER, USER)
- JWT tokens for API authentication
- Integration with Spring Security

**Key Findings**:
- User Pool with custom attributes for roles
- User Pool Client for frontend
- Cognito Groups for role management
- Password policy configurable
- Email and phone OTP support

**Alternatives Considered**:
- Auth0: Rejected - Constitution requires AWS Cognito
- Keycloak: Rejected - Self-hosted complexity, Cognito is managed
- Custom auth: Rejected - Security risk, Cognito provides battle-tested solution

### Payment Processing: Stripe

**Decision**: Use Stripe Java SDK for payment processing

**Rationale**:
- Industry standard for payment processing
- PCI compliance handled by Stripe
- Webhook support for payment status updates
- Java SDK available
- Supports multiple payment methods

**Key Findings**:
- Stripe Java SDK latest version required
- Webhook endpoint in Payment Processor Lambda
- Secret keys stored in AWS Secrets Manager
- Payment intents for secure processing

**Alternatives Considered**:
- PayPal: Rejected - Stripe better developer experience, more features
- Square: Rejected - Stripe more widely adopted, better documentation

## Architecture Patterns

### Microservices Architecture

**Decision**: Microservices with clear service boundaries

**Rationale**:
- Independent scaling (event search vs. core operations)
- Isolated failure domains
- Technology flexibility (Spring Boot for ECS, Quarkus for Lambda)
- Constitution requires microservices architecture

**Service Boundaries**:
- **Core API**: User management, Event CRUD, Ticket management, Cart, Orders
- **Event API**: Event search, filtering, analytics, recommendations
- **Order Processor Lambda**: Order validation, ticket reservation
- **Payment Processor Lambda**: Stripe processing, order fulfillment
- **Notification Sender Lambda**: Email, SMS, WebSocket notifications
- **Analytics Service Lambda**: Real-time analytics, metrics, reports

**Alternatives Considered**:
- Monolith: Rejected - Constitution requires microservices
- Serverless-only: Rejected - ECS better for always-on services

### Event-Driven Processing

**Decision**: SQS queues + Lambda functions for async operations

**Rationale**:
- Better resilience (messages persist if service fails)
- Auto-scaling (Lambda scales automatically)
- Cost-effective (pay per execution)
- Constitution requires event-driven patterns for async operations

**Flow**:
1. User places order → Core API creates order (PENDING) → Publishes to order-queue
2. Order Processor Lambda → Validates order → Reserves tickets → Publishes to payment-queue
3. Payment Processor Lambda → Processes payment → Updates order → Assigns tickets → Publishes to notification-queue
4. Notification Sender Lambda → Sends email/SMS → Updates order status

**Alternatives Considered**:
- Synchronous processing: Rejected - Blocks user requests, poor UX
- Direct service calls: Rejected - Tight coupling, no resilience

## Performance Requirements

**Decision**: Defined performance targets based on user requirements

**Rationale**: Ensures good user experience and system scalability

**Targets**:
- API response time: p95 < 500ms for synchronous operations
- Lambda cold start: < 3 seconds
- Frontend initial load: < 3 seconds
- Support 1000+ concurrent users
- Handle 10,000+ ticket purchases per event

**Optimization Strategies**:
- Database indexes on frequently queried fields
- Connection pooling (HikariCP for Spring Boot)
- Caching layer (DynamoDB optional for high-traffic data)
- CDN for frontend assets (CloudFront)
- Lambda SnapStart for faster cold starts (if needed)

## Security Requirements

**Decision**: Security-first design with multiple layers

**Rationale**: Payment processing platform requires high security

**Measures**:
- AWS Cognito for authentication (managed service)
- AWS Secrets Manager for secrets (no hardcoded credentials)
- Encryption at rest (RDS, S3)
- Encryption in transit (HTTPS, TLS)
- VPC with private subnets for services
- Security groups with least privilege
- Input validation on all endpoints
- JWT token validation
- Role-based access control (ADMIN, ORGANIZER, USER)

## Cost Optimization

**Decision**: Optimize for cost while maintaining performance

**Rationale**: Production cost target ~$440-625/month

**Strategies**:
- RDS Reserved Instances (~30% savings)
- Spot Instances for dev (~70% savings)
- S3 Lifecycle Policies (move old images to Glacier)
- CloudWatch Logs 7-day retention (vs. 30 days)
- Lambda reserved concurrency only where needed
- DynamoDB on-demand pricing (variable traffic)

**Estimated Monthly Costs**:
- Infrastructure: ~$600/month
- Serverless (Lambda + SQS): ~$7/month
- Other Services: ~$18/month
- **Total: ~$625/month** (can optimize to ~$440/month)

## Testing Strategy

**Decision**: Comprehensive testing without TDD mandate

**Rationale**: Constitution requires tests but allows flexible timing

**Approach**:
- Unit tests: 80% coverage minimum for services
- Integration tests: All API endpoints
- E2E tests: Critical user flows (purchase, checkout, payment)
- Tests written before, during, or after implementation (flexible)
- All tests must pass before merge

**Tools**:
- JUnit 5, Mockito (Java backend)
- Jest, React Testing Library (frontend)
- TestContainers for integration tests (optional)

## Deployment Strategy

**Decision**: Blue/Green deployment for zero-downtime

**Rationale**: ECS supports blue/green deployments natively

**Approach**:
- ECS Blue/Green deployment via Terraform
- Target groups for traffic shifting
- Health checks before traffic switch
- Automatic rollback on failure
- Frontend: S3 + CloudFront invalidation

**CI/CD**:
- GitLab CI/CD pipeline
- Test → Build → Deploy stages
- Auto-deploy to dev on `develop` branch
- Manual approval for production

## Unresolved Questions

**None** - All technical decisions resolved via MCP research and documentation review.

## Next Steps

1. **Phase 1**: Generate data model from user stories
2. **Phase 1**: Create API contracts (OpenAPI specification)
3. **Phase 1**: Generate quickstart guide
4. **Phase 2**: Break down into tasks (via `/speckit.tasks`)

