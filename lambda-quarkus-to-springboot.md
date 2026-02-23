# Lambda Migration: Quarkus → Spring Boot 4

**Target**: order-processor, payment-processor, notification-sender  
**Stack**: Spring Boot 4.0.3, Java 25, Spring Cloud Function AWS Adapter  
**Reference**: [Context7 Spring Boot 4 docs](https://context7.com/spring-projects/spring-boot), [Spring Cloud Function AWS](https://docs.spring.io/spring-cloud-function/reference/adapters/aws-intro.html)

---

## Project Structure (Current)

The Quarkus lambdas have been renamed with `-bkp` suffix. New Spring Boot projects exist as empty scaffolds.

```
backend/lambdas/
├── order-processor-bkp/      # Quarkus 3.27 (source of truth for logic)
├── order-processor/           # Spring Boot 4.0.3 (migration target) ✓ scaffold exists
├── payment-processor-bkp/
├── payment-processor/         # Spring Boot 4.0.3 ✓ scaffold exists
├── notification-sender-bkp/
├── notification-sender/      # Spring Boot 4.0.3 ✓ scaffold exists
└── shared/                   # Shared entities, models, enums (used via includeBuild or Maven Local)
```

---

## Task Overview

**Approach**: One lambda at a time. Complete each lambda end-to-end (deps, config, code, Dockerfile, build) before moving to the next. This validates incrementally and reduces context switching.

| # | Task | Scope | Status |
|---|------|-------|--------|
| 1 | **order-processor** – full migration | deps, shared config, application.yml, function bean, services, repositories, config classes, Dockerfile, build | ✅ |
| 2 | **payment-processor** – full migration | same pattern + Stripe | ⬜ |
| 3 | **notification-sender** – full migration | same pattern, no JPA | ⬜ |
| 4 | **CI, Terraform & cleanup** | workflows, Lambda env vars, docs | ⬜ |

---

## Order-Processor Migration Review (Task 1)

### ✅ Functional Parity

| Component | -bkp (Quarkus) | New (Spring Boot) | Status |
|-----------|----------------|-------------------|--------|
| Message parsing | Wrapped payload + direct fallback | Same | ✅ |
| Order validation | null, empty items, status check | Same logic | ✅ |
| Ticket reservation | findById, status check, saveAndFlush | Same | ✅ |
| Rollback on error | releaseTickets in catch | Same | ✅ |
| Payment queue publish | SQSPublisher | Same | ✅ |
| Secrets Manager | DB_SECRET_ARN → credentials | DataSourceConfig bean | ✅ |
| LocalStack | AWS_ENDPOINT_URL for SQS | AwsConfig | ✅ |

### ✅ Validation Logic

- **-bkp**: `order.getStatus() != OrderStatus.PENDING && order.getStatus() != null` → reject
- **New**: `order.getStatus() != null && order.getStatus() != OrderStatus.PENDING` → reject  
  Same behavior: accept PENDING or null; reject PAID, CANCELLED, REFUNDED.

### ✅ Repository Mapping

| Panache | Spring Data JPA |
|---------|-----------------|
| findByIdWithItems (JPQL) | @Query with LEFT JOIN FETCH | ✅ |
| findById | findById | ✅ |
| persistAndFlush | saveAndFlush | ✅ |
| releaseTicket (update) | @Modifying @Query | ✅ |

### ⚠️ Findings & Recommendations

1. **SecretsManagerClient + LocalStack**: AwsConfig overrides endpoint for SqsClient only. For LocalStack, SecretsManager also needs `AWS_ENDPOINT_URL`. Consider adding endpoint override for SecretsManagerClient when `AWS_ENDPOINT_URL` is set.

2. **SQS batch partial failure**: Both -bkp and new throw on first failure (whole batch fails). For production, consider `Function<SQSEvent, SQSBatchResponse>` with `ReportBatchItemFailures` so only failed messages are retried.

3. **@Value for env vars**: `@Value("${AWS_ENDPOINT_URL:}")` – Spring resolves from Environment. Lambda env vars (e.g. `AWS_ENDPOINT_URL`) are typically available. If issues arise, add explicit mapping in `application.yml`.

4. **Tests**: -bkp tests are commented out (complex Panache mocking). No tests migrated. Consider adding integration tests later.

### ✅ Configuration Checklist

- [x] `spring.main.web-application-type: none`
- [x] `spring.threads.virtual.enabled: true`
- [x] `spring.cloud.function.definition=processOrder`
- [x] DataSource from Secrets Manager or env
- [x] JPA with `ddl-auto: none`
- [x] EntityScan for shared entities
- [x] Dockerfile with correct handler

---

## Executive Summary

Migrate the three SQS-triggered Lambdas from Quarkus 3.27 (in `*-bkp` folders) to Spring Boot 4.0.3 with Java 25. Spring Boot 4 brings virtual thread support, improved cold-start characteristics with Java 25, and framework consistency with the existing eventpro-api (Spring Boot) services. Spring Cloud Function provides the AWS Lambda adapter with minimal configuration.

**Benefits**:
- **Unified stack**: Same framework (Spring Boot) for ECS API and Lambdas
- **Java 25**: Virtual threads (`spring.threads.virtual.enabled: true`), structured concurrency
- **Simpler ops**: One build system, one dependency management style
- **Cold start**: Spring Boot 4 + Java 25 AOT/SnapStart improvements; consider Lambda SnapStart

---

## Source: Quarkus (-bkp) State

### Lambda Inventory

| Lambda | Trigger | DB | AWS Services | External |
|--------|---------|-----|--------------|----------|
| **order-processor-bkp** | SQS (order-queue) | Order, Ticket (JPA) | SQS, Secrets Manager | - |
| **payment-processor-bkp** | SQS (payment-queue) | Order, Ticket (JPA) | SQS, Secrets Manager | Stripe |
| **notification-sender-bkp** | SQS (notification-queue) | Config only (in-app TODO) | SES, SNS, Secrets Manager | - |

---

## Migration Tasks

### Task 1: order-processor – Full Migration ✅

**Source**: `order-processor-bkp/` → **Target**: `order-processor/`

| # | Sub-task | Status |
|---|----------|--------|
| 1.1 | Shared setup (includeBuild) | ✅ |
| 1.2 | Dependencies | ✅ |
| 1.3 | application.yml | ✅ |
| 1.4 | Function bean | ✅ |
| 1.5 | Services | ✅ |
| 1.6 | Repositories | ✅ |
| 1.7 | Config classes | ✅ |
| 1.8 | Dockerfile | ✅ |
| 1.9 | Build | ✅ |

### Task 2: payment-processor – Full Migration

**Source**: `payment-processor-bkp/` → **Target**: `payment-processor/`

| # | Sub-task | Description |
|---|----------|-------------|
| 2.1 | Dependencies | Same as order-processor + `com.stripe:stripe-java` |
| 2.2 | application.yml | Same pattern + Stripe config |
| 2.3 | Function bean | `Consumer<SQSEvent> processPayment` |
| 2.4 | Services | Migrate PaymentProcessorService, StripeServiceImpl, SQSPublisher |
| 2.5 | Repositories | OrderRepository, TicketRepository |
| 2.6 | Config classes | DatabaseSecretsConfig, SQSConfig, StripeConfig |
| 2.7 | Dockerfile | Create Dockerfile |
| 2.8 | Build | `./gradlew bootJar -x test` ✓ |

### Task 3: notification-sender – Full Migration

**Source**: `notification-sender-bkp/` → **Target**: `notification-sender/`

| # | Sub-task | Description |
|---|----------|-------------|
| 3.1 | Dependencies | No JPA; spring-cloud-function-adapter-aws, AWS SDK (ses, sns) |
| 3.2 | application.yml | `spring.cloud.function.definition=sendNotification` |
| 3.3 | Function bean | `Consumer<SQSEvent> sendNotification` |
| 3.4 | Services | NotificationSenderService, EmailServiceImpl, SMSServiceImpl |
| 3.5 | Config classes | SESConfig, SNSConfig |
| 3.6 | Dockerfile | Create Dockerfile |
| 3.7 | Build | `./gradlew bootJar -x test` ✓ |

### Task 4: CI, Terraform & Cleanup

| # | Sub-task | Description |
|---|----------|-------------|
| 4.1 | Workflows | Point to new lambdas (not -bkp) |
| 4.2 | Terraform | Add `spring_cloud_function_definition` env var |
| 4.3 | Validation | Build Docker images, deploy, test SQS flows |
| 4.4 | Docs | Update LAMBDA_IMPLEMENTATION_GUIDE.md, README.md |

---

## Dependency Mapping

### build.gradle (order-processor)

```gradle
implementation 'org.springframework.boot:spring-boot-starter'
implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
implementation 'org.springframework.cloud:spring-cloud-function-adapter-aws:4.0.5'
implementation 'com.amazonaws:aws-lambda-java-events:3.11.3'
implementation 'com.amazonaws:aws-lambda-java-core:1.2.3'
implementation platform("software.amazon.awssdk:bom:2.28.15")
implementation 'software.amazon.awssdk:sqs'
implementation 'software.amazon.awssdk:secretsmanager'
runtimeOnly 'org.postgresql:postgresql'
implementation 'com.accessplus.eventpro:eventpro-shared:1.0.0'
```

---

## Dockerfile Template

Build context: `backend/`

```dockerfile
FROM gradle:9.2.1-jdk25-corretto AS build
WORKDIR /app
COPY lambdas/<lambda-name> ./lambdas/<lambda-name>
COPY shared ./shared
WORKDIR /app/lambdas/<lambda-name>
RUN ./gradlew bootJar --no-daemon -x test

FROM public.ecr.aws/lambda/java:25
COPY --from=build /app/lambdas/<lambda-name>/build/libs/*.jar /var/task/
CMD ["org.springframework.cloud.function.adapter.aws.FunctionInvoker::handleRequest"]
```

Lambda env: `spring_cloud_function_definition=processOrder` | `processPayment` | `sendNotification`

---

## References

- [Spring Boot 4.0 Migration Guide](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide)
- [Spring Cloud Function AWS Adapter](https://docs.spring.io/spring-cloud-function/reference/adapters/aws-intro.html)
- [AWS Lambda Java](https://docs.aws.amazon.com/lambda/latest/dg/java-handler.html)
