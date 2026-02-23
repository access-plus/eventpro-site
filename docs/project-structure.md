# EventPro Site - Project Structure

## Overview

This document outlines the recommended project structure for the EventPro Site microservices architecture. The structure follows best practices for microservices, monorepo management, and AWS deployment.

---

## Repository Structure (Monorepo Approach)

```
eventpro-site/
├── .gitignore
├── .gitlab-ci.yml                    # Main CI/CD pipeline
├── README.md
├── docker-compose.yml                # Local development
├── package.json                      # Root package.json for scripts
│
├── frontend/                         # React 19 + TypeScript Frontend
│   ├── src/
│   │   ├── components/              # React components
│   │   │   ├── common/              # Shared components
│   │   │   ├── events/              # Event-related components
│   │   │   ├── tickets/             # Ticket components
│   │   │   ├── cart/                # Cart components
│   │   │   ├── payments/            # Payment components
│   │   │   ├── notifications/       # Notification components
│   │   │   └── dashboard/           # Dashboard components
│   │   ├── pages/                   # Page components
│   │   ├── store/                   # Redux store
│   │   │   ├── slices/
│   │   │   │   ├── authSlice.ts
│   │   │   │   ├── eventSlice.ts
│   │   │   │   ├── ticketSlice.ts
│   │   │   │   ├── cartSlice.ts
│   │   │   │   └── notificationSlice.ts
│   │   │   └── index.ts
│   │   ├── services/                # API service clients
│   │   │   ├── api/
│   │   │   │   ├── coreApi.ts       # Core API client
│   │   │   │   ├── eventApi.ts      # Event API client
│   │   │   │   └── websocketApi.ts  # WebSocket client
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── utils/                   # Utility functions
│   │   ├── types/                   # TypeScript type definitions
│   │   ├── config/                  # Configuration
│   │   │   ├── api.config.ts
│   │   └── App.tsx
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── components.json              # shadcn/ui config
│
├── services/                        # Backend Microservices
│   │
│   ├── core-api/                    # Core API Service (ECS Fargate)
│   │   ├── src/
│   │   │   ├── main/
│   │   │   │   ├── java/com/accessplus/eventpro/core/
│   │   │   │   │   ├── api/
│   │   │   │   │   │   ├── controller/
│   │   │   │   │   │   │   ├── UserController.java
│   │   │   │   │   │   │   ├── TicketController.java
│   │   │   │   │   │   │   ├── CartController.java
│   │   │   │   │   │   │   └── OrderController.java
│   │   │   │   │   │   ├── dto/
│   │   │   │   │   │   ├── request/
│   │   │   │   │   │   └── response/
│   │   │   │   │   ├── service/
│   │   │   │   │   │   ├── UserService.java
│   │   │   │   │   │   ├── TicketService.java
│   │   │   │   │   │   ├── CartService.java
│   │   │   │   │   │   └── OrderService.java
│   │   │   │   │   ├── repository/
│   │   │   │   │   │   ├── UserRepository.java
│   │   │   │   │   │   ├── TicketRepository.java
│   │   │   │   │   │   ├── CartRepository.java
│   │   │   │   │   │   └── OrderRepository.java
│   │   │   │   │   ├── entity/
│   │   │   │   │   │   ├── UserEntity.java
│   │   │   │   │   │   ├── TicketEntity.java
│   │   │   │   │   │   ├── CartEntity.java
│   │   │   │   │   │   └── OrderEntity.java
│   │   │   │   │   ├── config/
│   │   │   │   │   │   ├── DatabaseConfig.java
│   │   │   │   │   │   ├── JwtConfig.java
│   │   │   │   │   │   └── SQSConfig.java
│   │   │   │   │   ├── security/
│   │   │   │   │   │   ├── SecurityConfig.java
│   │   │   │   │   │   ├── JwtService.java
│   │   │   │   │   │   ├── JwtAuthenticationFilter.java
│   │   │   │   │   │   └── JwtUtils.java
│   │   │   │   │   ├── messaging/
│   │   │   │   │   │   └── SQSMessagePublisher.java
│   │   │   │   │   ├── exception/
│   │   │   │   │   │   └── GlobalExceptionHandler.java
│   │   │   │   │   └── CoreApiApplication.java
│   │   │   │   └── resources/
│   │   │   │       ├── application.yml
│   │   │   │       ├── application-dev.yml
│   │   │   │       └── application-prod.yml
│   │   │   └── test/
│   │   ├── build.gradle
│   │   ├── settings.gradle
│   │   ├── Dockerfile
│   │   └── .dockerignore
│   │
│   ├── event-api/                   # Event API Service (ECS Fargate)
│   │   ├── src/
│   │   │   ├── main/
│   │   │   │   ├── java/com/accessplus/eventpro/event/
│   │   │   │   │   ├── api/
│   │   │   │   │   │   ├── controller/
│   │   │   │   │   │   │   ├── EventController.java
│   │   │   │   │   │   │   └── EventSearchController.java
│   │   │   │   │   │   ├── dto/
│   │   │   │   │   │   ├── request/
│   │   │   │   │   │   └── response/
│   │   │   │   │   ├── service/
│   │   │   │   │   │   ├── EventService.java
│   │   │   │   │   │   └── EventSearchService.java
│   │   │   │   │   ├── repository/
│   │   │   │   │   │   ├── EventRepository.java
│   │   │   │   │   │   └── CategoryRepository.java
│   │   │   │   │   ├── entity/
│   │   │   │   │   │   ├── EventEntity.java
│   │   │   │   │   │   └── CategoryEntity.java
│   │   │   │   │   ├── config/
│   │   │   │   │   │   ├── DatabaseConfig.java
│   │   │   │   │   │   ├── DynamoDBConfig.java
│   │   │   │   │   │   └── S3Config.java
│   │   │   │   │   └── EventApiApplication.java
│   │   │   │   └── resources/
│   │   │   │       ├── application.yml
│   │   │   │       ├── application-dev.yml
│   │   │   │       └── application-prod.yml
│   │   │   └── test/
│   │   ├── build.gradle
│   │   ├── settings.gradle
│   │   ├── Dockerfile
│   │   └── .dockerignore
│   │
│   └── lambdas/                     # Lambda Functions (Quarkus)
│       ├── order-processor/         # Order Processing Lambda
│       │   ├── src/
│       │   │   ├── main/
│       │   │   │   ├── java/com/accessplus/eventpro/order/
│       │   │   │   │   ├── handler/
│       │   │   │   │   │   └── OrderProcessorHandler.java
│       │   │   │   │   ├── service/
│       │   │   │   │   │   ├── OrderValidationService.java
│       │   │   │   │   │   └── TicketReservationService.java
│       │   │   │   │   ├── model/
│       │   │   │   │   │   └── OrderRequest.java
│       │   │   │   │   ├── config/
│       │   │   │   │   │   ├── DatabaseConfig.java
│       │   │   │   │   │   └── SQSConfig.java
│       │   │   │   │   └── OrderProcessorApplication.java
│       │   │   │   └── resources/
│       │   │   │       └── application.properties
│       │   │   └── test/
│       │   ├── build.gradle
│       │   └── gradle.properties
│       │
│       ├── payment-processor/       # Payment Processing Lambda
│       │   ├── src/
│       │   │   ├── main/
│       │   │   │   ├── java/com/accessplus/eventpro/payment/
│       │   │   │   │   ├── handler/
│       │   │   │   │   │   ├── PaymentProcessorHandler.java
│       │   │   │   │   │   └── StripeWebhookHandler.java
│       │   │   │   │   ├── service/
│       │   │   │   │   │   ├── StripeService.java
│       │   │   │   │   │   ├── PaymentService.java
│       │   │   │   │   │   └── TicketAssignmentService.java
│       │   │   │   │   ├── model/
│       │   │   │   │   │   └── PaymentRequest.java
│       │   │   │   │   ├── config/
│       │   │   │   │   │   ├── DatabaseConfig.java
│       │   │   │   │   │   ├── StripeConfig.java
│       │   │   │   │   │   └── SQSConfig.java
│       │   │   │   │   └── PaymentProcessorApplication.java
│       │   │   │   └── resources/
│       │   │   │       └── application.properties
│       │   │   └── test/
│       │   ├── build.gradle
│       │   └── gradle.properties
│       │
│       ├── notification-sender/     # Notification Service Lambda
│       │   ├── src/
│       │   │   ├── main/
│       │   │   │   ├── java/com/accessplus/eventpro/notification/
│       │   │   │   │   ├── handler/
│       │   │   │   │   │   └── NotificationSenderHandler.java
│       │   │   │   │   ├── service/
│       │   │   │   │   │   ├── EmailService.java
│       │   │   │   │   │   ├── SMSService.java
│       │   │   │   │   │   └── WebSocketService.java
│       │   │   │   │   ├── model/
│       │   │   │   │   │   └── NotificationRequest.java
│       │   │   │   │   ├── config/
│       │   │   │   │   │   ├── SESConfig.java
│       │   │   │   │   │   ├── SNSConfig.java
│       │   │   │   │   │   └── SQSConfig.java
│       │   │   │   │   └── NotificationSenderApplication.java
│       │   │   │   └── resources/
│       │   │   │       └── application.properties
│       │   │   └── test/
│       │   ├── build.gradle
│       │   └── gradle.properties
│       │
│       └── analytics-service/       # Analytics Service Lambda
│           ├── src/
│           │   ├── main/
│           │   │   ├── java/com/accessplus/eventpro/analytics/
│           │   │   │   ├── handler/
│           │   │   │   │   └── AnalyticsHandler.java
│           │   │   │   ├── service/
│           │   │   │   │   ├── EventAnalyticsService.java
│           │   │   │   │   ├── SalesAnalyticsService.java
│           │   │   │   │   └── UserAnalyticsService.java
│           │   │   │   ├── model/
│           │   │   │   │   └── AnalyticsRequest.java
│           │   │   │   ├── config/
│           │   │   │   │   ├── DatabaseConfig.java
│           │   │   │   │   └── DynamoDBConfig.java
│           │   │   │   └── AnalyticsServiceApplication.java
│           │   │   │   └── resources/
│           │   │   │       └── application.properties
│           │   └── test/
│           ├── build.gradle
│           └── gradle.properties
│
├── shared/                          # Shared Libraries/Modules
│   ├── common/                      # Common utilities
│   │   ├── src/
│   │   │   ├── main/java/com/accessplus/eventpro/common/
│   │   │   │   ├── exception/
│   │   │   │   │   ├── BusinessException.java
│   │   │   │   │   └── ErrorCode.java
│   │   │   │   ├── model/
│   │   │   │   │   └── BaseEntity.java
│   │   │   │   ├── utils/
│   │   │   │   │   └── DateUtils.java
│   │   │   │   └── constants/
│   │   │   │       └── Constants.java
│   │   └── build.gradle
│   │
│   ├── messaging/                  # Messaging utilities
│   │   ├── src/
│   │   │   ├── main/java/com/accessplus/eventpro/messaging/
│   │   │   │   ├── sqs/
│   │   │   │   │   ├── SQSMessagePublisher.java
│   │   │   │   │   └── SQSMessageConsumer.java
│   │   │   │   └── model/
│   │   │   │       ├── OrderMessage.java
│   │   │   │       ├── PaymentMessage.java
│   │   │   │       └── NotificationMessage.java
│   │   └── build.gradle
│   │
│   └── database/                   # Database utilities
│       ├── src/
│       │   ├── main/java/com/accessplus/eventpro/database/
│       │   │   ├── config/
│       │   │   │   └── DatabaseConfig.java
│       │   │   └── repository/
│       │   │       └── BaseRepository.java
│       └── build.gradle
│
├── infrastructure/                  # Infrastructure as Code
│   ├── environments/
│   │   ├── dev/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   ├── outputs.tf
│   │   │   └── terraform.tfvars
│   │   └── prod/
│   │       ├── main.tf
│   │       ├── variables.tf
│   │       ├── outputs.tf
│   │       └── terraform.tfvars
│   ├── lambda-packages/            # Lambda deployment packages (generated)
│   │   ├── order-processor.zip
│   │   ├── payment-processor.zip
│   │   ├── notification-sender.zip
│   │   └── analytics-service.zip
│   ├── modules/
│   │   ├── vpc/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   └── outputs.tf
│   │   ├── rds/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   └── outputs.tf
│   │   ├── ecs/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   └── outputs.tf
│   │   ├── alb/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   └── outputs.tf
│   │   ├── lambda/
│   │   │   ├── main.tf              # Lambda functions, layers, event sources
│   │   │   ├── variables.tf
│   │   │   └── outputs.tf
│   │   ├── api-gateway/             # API Gateway for Lambda webhooks
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   └── outputs.tf
│   │   ├── sqs/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   └── outputs.tf
│   │   ├── s3/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   └── outputs.tf
│   │   ├── cloudfront/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   └── outputs.tf
│   │   │   └── outputs.tf
│   │   ├── secrets-manager/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   └── outputs.tf
│   │   └── route53/
│   │       ├── main.tf
│   │       ├── variables.tf
│   │       └── outputs.tf
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
│
├── scripts/                        # Utility scripts
│   ├── deploy.sh                   # Deployment script
│   ├── build.sh                    # Build script
│   ├── test.sh                     # Test script
│   └── local-setup.sh              # Local development setup
│
└── docs/                           # Documentation
    ├── architecture.md
    ├── api.md
    ├── deployment.md
    └── development.md
```

---

## Detailed Service Structures

### 1. Core API Service Structure

```
services/core-api/
├── src/
│   ├── main/
│   │   ├── java/com/accessplus/eventpro/core/
│   │   │   ├── api/
│   │   │   │   ├── controller/
│   │   │   │   │   ├── UserController.java
│   │   │   │   │   │   - GET    /api/v1/users/me
│   │   │   │   │   │   - PUT    /api/v1/users/me
│   │   │   │   │   │   - GET    /api/v1/users/{id}
│   │   │   │   │   │   - GET    /api/v1/users
│   │   │   │   │   │
│   │   │   │   │   ├── TicketController.java
│   │   │   │   │   │   - GET    /api/v1/tickets/{id}
│   │   │   │   │   │   - GET    /api/v1/tickets/event/{eventId}
│   │   │   │   │   │   - POST   /api/v1/tickets
│   │   │   │   │   │   - PATCH  /api/v1/tickets/{id}
│   │   │   │   │   │   - DELETE /api/v1/tickets/{id}
│   │   │   │   │   │
│   │   │   │   │   ├── CartController.java
│   │   │   │   │   │   - POST   /api/v1/cart/add
│   │   │   │   │   │   - GET    /api/v1/cart
│   │   │   │   │   │   - PATCH  /api/v1/cart/update
│   │   │   │   │   │   - DELETE /api/v1/cart/delete/{itemId}
│   │   │   │   │   │   - DELETE /api/v1/cart/clear
│   │   │   │   │   │
│   │   │   │   │   └── OrderController.java
│   │   │   │   │       - POST   /api/v1/orders
│   │   │   │   │       - GET    /api/v1/orders/{id}
│   │   │   │   │       - GET    /api/v1/orders
│   │   │   │   │
│   │   │   │   ├── dto/
│   │   │   │   │   ├── UserDto.java
│   │   │   │   │   ├── TicketDto.java
│   │   │   │   │   ├── CartDto.java
│   │   │   │   │   └── OrderDto.java
│   │   │   │   │
│   │   │   │   ├── request/
│   │   │   │   │   ├── UserUpdateRequest.java
│   │   │   │   │   ├── TicketCreateRequest.java
│   │   │   │   │   ├── AddToCartRequest.java
│   │   │   │   │   └── CreateOrderRequest.java
│   │   │   │   │
│   │   │   │   └── response/
│   │   │   │       ├── UserResponse.java
│   │   │   │       ├── TicketResponse.java
│   │   │   │       ├── CartResponse.java
│   │   │   │       └── OrderResponse.java
│   │   │   │
│   │   │   ├── service/
│   │   │   │   ├── UserService.java
│   │   │   │   ├── TicketService.java
│   │   │   │   ├── CartService.java
│   │   │   │   └── OrderService.java
│   │   │   │
│   │   │   ├── repository/
│   │   │   │   ├── UserRepository.java
│   │   │   │   ├── TicketRepository.java
│   │   │   │   ├── CartRepository.java
│   │   │   │   └── OrderRepository.java
│   │   │   │
│   │   │   ├── entity/
│   │   │   │   ├── UserEntity.java
│   │   │   │   ├── TicketEntity.java
│   │   │   │   ├── CartEntity.java
│   │   │   │   └── OrderEntity.java
│   │   │   │
│   │   │   ├── config/
│   │   │   │   ├── DatabaseConfig.java
│   │   │   │   ├── JwtConfig.java
│   │   │   │   └── SQSConfig.java
│   │   │   │
│   │   │   ├── security/
│   │   │   │   ├── SecurityConfig.java
│   │   │   │   ├── JwtService.java
│   │   │   │   ├── JwtAuthenticationFilter.java
│   │   │   │   └── JwtUtils.java
│   │   │   │
│   │   │   ├── messaging/
│   │   │   │   └── SQSMessagePublisher.java
│   │   │   │       - publishOrderMessage()
│   │   │   │
│   │   │   ├── exception/
│   │   │   │   └── GlobalExceptionHandler.java
│   │   │   │
│   │   │   └── CoreApiApplication.java
│   │   │
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-dev.yml
│   │       └── application-prod.yml
│   │
│   └── test/
│       └── java/com/accessplus/eventpro/core/
│           ├── service/
│           ├── controller/
│           └── repository/
│
├── build.gradle
├── settings.gradle
├── Dockerfile
└── .dockerignore
```

### 2. Order Processor Lambda Structure

```
services/lambdas/order-processor/
├── src/
│   ├── main/
│   │   ├── java/com/accessplus/eventpro/order/
│   │   │   ├── handler/
│   │   │   │   └── OrderProcessorHandler.java
│   │   │   │       @Component
│   │   │   │       public class OrderProcessorHandler 
│   │   │   │           implements RequestHandler<SQSEvent, Void> {
│   │   │   │           // Process SQS messages
│   │   │   │       }
│   │   │   │
│   │   │   ├── service/
│   │   │   │   ├── OrderValidationService.java
│   │   │   │   │   - validateOrder()
│   │   │   │   │   - checkTicketAvailability()
│   │   │   │   │
│   │   │   │   └── TicketReservationService.java
│   │   │   │       - reserveTickets()
│   │   │   │       - releaseReservations()
│   │   │   │
│   │   │   ├── model/
│   │   │   │   └── OrderRequest.java
│   │   │   │
│   │   │   ├── config/
│   │   │   │   ├── DatabaseConfig.java
│   │   │   │   └── SQSConfig.java
│   │   │   │
│   │   │   └── OrderProcessorApplication.java
│   │   │
│   │   └── resources/
│   │       └── application.yml
│   │
│   └── test/
│       └── java/com/accessplus/eventpro/order/
│
└── build.gradle
```

**Note:** Lambda infrastructure is defined in `infrastructure/modules/lambda/` (see Terraform section below)

### 3. Payment Processor Lambda Structure

```
services/lambdas/payment-processor/
├── src/
│   ├── main/
│   │   ├── java/com/accessplus/eventpro/payment/
│   │   │   ├── handler/
│   │   │   │   ├── PaymentProcessorHandler.java
│   │   │   │   │   @Component
│   │   │   │   │   public class PaymentProcessorHandler 
│   │   │   │   │       implements RequestHandler<SQSEvent, Void>
│   │   │   │   │
│   │   │   │   └── StripeWebhookHandler.java
│   │   │   │       @Component
│   │   │   │       public class StripeWebhookHandler 
│   │   │   │           implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent>
│   │   │   │
│   │   │   ├── service/
│   │   │   │   ├── StripeService.java
│   │   │   │   │   - createPaymentIntent()
│   │   │   │   │   - confirmPayment()
│   │   │   │   │   - handleWebhook()
│   │   │   │   │
│   │   │   │   ├── PaymentService.java
│   │   │   │   │   - processPayment()
│   │   │   │   │   - updatePaymentStatus()
│   │   │   │   │
│   │   │   │   └── TicketAssignmentService.java
│   │   │   │       - assignTickets()
│   │   │   │       - generateQRCodes()
│   │   │   │
│   │   │   ├── model/
│   │   │   │   └── PaymentRequest.java
│   │   │   │
│   │   │   ├── config/
│   │   │   │   ├── DatabaseConfig.java
│   │   │   │   ├── StripeConfig.java
│   │   │   │   └── SQSConfig.java
│   │   │   │
│   │   │   └── PaymentProcessorApplication.java
│   │   │
│   │   └── resources/
│   │       └── application.yml
│   │
│   └── test/
│
└── build.gradle
```

---

## Terraform Lambda Module Structure

### infrastructure/modules/lambda/main.tf

```hcl
# Order Processor Lambda
resource "aws_lambda_function" "order_processor" {
  filename         = var.order_processor_zip_path
  function_name    = "${var.environment}-order-processor"
  role            = aws_iam_role.lambda_order_processor.arn
  handler         = "io.quarkus.amazon.lambda.runtime.QuarkusStreamHandler::handleRequest"
  runtime         = "java21"
  package_type    = "Zip"
  memory_size     = 512
  timeout         = 300
  source_code_hash = filebase64sha256(var.order_processor_zip_path)

  environment {
    variables = {
      DB_HOST            = var.db_host
      DB_NAME            = var.db_name
      DB_SECRET_ARN      = var.db_secret_arn
      SQS_PAYMENT_QUEUE  = var.payment_queue_url
      AWS_REGION         = var.aws_region
    }
  }

  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [aws_security_group.lambda.id]
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_order_processor,
    aws_cloudwatch_log_group.order_processor
  ]
}

# SQS Event Source Mapping
resource "aws_lambda_event_source_mapping" "order_processor_sqs" {
  event_source_arn = var.order_queue_arn
  function_name    = aws_lambda_function.order_processor.arn
  batch_size       = 10
  enabled          = true
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "order_processor" {
  name              = "/aws/lambda/${var.environment}-order-processor"
  retention_in_days = 7
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_order_processor" {
  name = "${var.environment}-order-processor-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

# IAM Policy for Lambda
resource "aws_iam_role_policy" "lambda_order_processor" {
  name = "${var.environment}-order-processor-lambda-policy"
  role = aws_iam_role.lambda_order_processor.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = var.order_queue_arn
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = var.payment_queue_arn
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = var.db_secret_arn
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ]
        Resource = "*"
      }
    ]
  })
}

# Payment Processor Lambda
resource "aws_lambda_function" "payment_processor" {
  filename         = var.payment_processor_zip_path
  function_name    = "${var.environment}-payment-processor"
  role            = aws_iam_role.lambda_payment_processor.arn
  handler         = "io.quarkus.amazon.lambda.runtime.QuarkusStreamHandler::handleRequest"
  runtime         = "java21"
  package_type    = "Zip"
  memory_size     = 1024
  timeout         = 900
  source_code_hash = filebase64sha256(var.payment_processor_zip_path)

  environment {
    variables = {
      DB_HOST                = var.db_host
      DB_NAME                = var.db_name
      DB_SECRET_ARN          = var.db_secret_arn
      STRIPE_SECRET_KEY_ARN  = var.stripe_secret_key_arn
      SQS_NOTIFICATION_QUEUE = var.notification_queue_url
      AWS_REGION             = var.aws_region
    }
  }

  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [aws_security_group.lambda.id]
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_payment_processor,
    aws_cloudwatch_log_group.payment_processor
  ]
}

# SQS Event Source Mapping for Payment Processor
resource "aws_lambda_event_source_mapping" "payment_processor_sqs" {
  event_source_arn = var.payment_queue_arn
  function_name    = aws_lambda_function.payment_processor.arn
  batch_size       = 1
  enabled          = true
}

# CloudWatch Log Group for Payment Processor
resource "aws_cloudwatch_log_group" "payment_processor" {
  name              = "/aws/lambda/${var.environment}-payment-processor"
  retention_in_days = 7
}

# IAM Role for Payment Processor Lambda
resource "aws_iam_role" "lambda_payment_processor" {
  name = "${var.environment}-payment-processor-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

# IAM Policy for Payment Processor Lambda
resource "aws_iam_role_policy" "lambda_payment_processor" {
  name = "${var.environment}-payment-processor-lambda-policy"
  role = aws_iam_role.lambda_payment_processor.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = var.payment_queue_arn
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = var.notification_queue_arn
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          var.db_secret_arn,
          var.stripe_secret_key_arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ]
        Resource = "*"
      }
    ]
  })
}

# Notification Sender Lambda
resource "aws_lambda_function" "notification_sender" {
  filename         = var.notification_sender_zip_path
  function_name    = "${var.environment}-notification-sender"
  role            = aws_iam_role.lambda_notification_sender.arn
  handler         = "io.quarkus.amazon.lambda.runtime.QuarkusStreamHandler::handleRequest"
  runtime         = "java21"
  package_type    = "Zip"
  memory_size     = 256
  timeout         = 60
  source_code_hash = filebase64sha256(var.notification_sender_zip_path)

  environment {
    variables = {
      SES_REGION           = var.aws_region
      SNS_REGION          = var.aws_region
      AWS_REGION          = var.aws_region
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_notification_sender,
    aws_cloudwatch_log_group.notification_sender
  ]
}

# SQS Event Source Mapping for Notification Sender
resource "aws_lambda_event_source_mapping" "notification_sender_sqs" {
  event_source_arn = var.notification_queue_arn
  function_name    = aws_lambda_function.notification_sender.arn
  batch_size       = 10
  enabled          = true
}

# CloudWatch Log Group for Notification Sender
resource "aws_cloudwatch_log_group" "notification_sender" {
  name              = "/aws/lambda/${var.environment}-notification-sender"
  retention_in_days = 7
}

# IAM Role for Notification Sender Lambda
resource "aws_iam_role" "lambda_notification_sender" {
  name = "${var.environment}-notification-sender-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

# IAM Policy for Notification Sender Lambda
resource "aws_iam_role_policy" "lambda_notification_sender" {
  name = "${var.environment}-notification-sender-lambda-policy"
  role = aws_iam_role.lambda_notification_sender.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = var.notification_queue_arn
      },
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = "*"
      }
    ]
  })
}

# Analytics Service Lambda
resource "aws_lambda_function" "analytics_service" {
  filename         = var.analytics_service_zip_path
  function_name    = "${var.environment}-analytics-service"
  role            = aws_iam_role.lambda_analytics_service.arn
  handler         = "io.quarkus.amazon.lambda.runtime.QuarkusStreamHandler::handleRequest"
  runtime         = "java21"
  package_type    = "Zip"
  memory_size     = 512
  timeout         = 300
  source_code_hash = filebase64sha256(var.analytics_service_zip_path)

  environment {
    variables = {
      DB_HOST    = var.db_host
      DB_NAME    = var.db_name
      DB_SECRET_ARN = var.db_secret_arn
      AWS_REGION = var.aws_region
    }
  }

  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [aws_security_group.lambda.id]
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_analytics_service,
    aws_cloudwatch_log_group.analytics_service
  ]
}

# EventBridge Rule for Scheduled Analytics
resource "aws_cloudwatch_event_rule" "analytics_schedule" {
  name                = "${var.environment}-analytics-schedule"
  description         = "Trigger analytics service on schedule"
  schedule_expression = "rate(1 hour)"
}

# EventBridge Target
resource "aws_cloudwatch_event_target" "analytics_target" {
  rule      = aws_cloudwatch_event_rule.analytics_schedule.name
  target_id = "AnalyticsServiceTarget"
  arn       = aws_lambda_function.analytics_service.arn
}

# Lambda Permission for EventBridge
resource "aws_lambda_permission" "analytics_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.analytics_service.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.analytics_schedule.arn
}

# CloudWatch Log Group for Analytics Service
resource "aws_cloudwatch_log_group" "analytics_service" {
  name              = "/aws/lambda/${var.environment}-analytics-service"
  retention_in_days = 7
}

# IAM Role for Analytics Service Lambda
resource "aws_iam_role" "lambda_analytics_service" {
  name = "${var.environment}-analytics-service-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

# IAM Policy for Analytics Service Lambda
resource "aws_iam_role_policy" "lambda_analytics_service" {
  name = "${var.environment}-analytics-service-lambda-policy"
  role = aws_iam_role.lambda_analytics_service.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = var.db_secret_arn
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query"
        ]
        Resource = var.dynamodb_table_arn
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ]
        Resource = "*"
      }
    ]
  })
}

# Security Group for Lambda functions
resource "aws_security_group" "lambda" {
  name        = "${var.environment}-lambda-sg"
  description = "Security group for Lambda functions"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment}-lambda-sg"
  }
}
```

### infrastructure/modules/lambda/variables.tf

```hcl
variable "environment" {
  description = "Environment name (dev, prod)"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for Lambda functions"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for Lambda VPC configuration"
  type        = list(string)
}

variable "order_processor_zip_path" {
  description = "Path to Order Processor Lambda deployment package"
  type        = string
}

variable "payment_processor_zip_path" {
  description = "Path to Payment Processor Lambda deployment package"
  type        = string
}

variable "notification_sender_zip_path" {
  description = "Path to Notification Sender Lambda deployment package"
  type        = string
}

variable "analytics_service_zip_path" {
  description = "Path to Analytics Service Lambda deployment package"
  type        = string
}

variable "order_queue_arn" {
  description = "ARN of the order queue"
  type        = string
}

variable "payment_queue_arn" {
  description = "ARN of the payment queue"
  type        = string
}

variable "notification_queue_arn" {
  description = "ARN of the notification queue"
  type        = string
}

variable "db_host" {
  description = "Database host"
  type        = string
}

variable "db_name" {
  description = "Database name"
  type        = string
}

variable "db_secret_arn" {
  description = "ARN of the database secret in Secrets Manager"
  type        = string
}

variable "stripe_secret_key_arn" {
  description = "ARN of the Stripe secret key in Secrets Manager"
  type        = string
}

variable "payment_queue_url" {
  description = "URL of the payment queue"
  type        = string
}

variable "notification_queue_url" {
  description = "URL of the notification queue"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "dynamodb_table_arn" {
  description = "ARN of DynamoDB table for analytics"
  type        = string
  default     = ""
}
```

### infrastructure/modules/lambda/outputs.tf

```hcl
output "order_processor_function_arn" {
  description = "ARN of the Order Processor Lambda function"
  value       = aws_lambda_function.order_processor.arn
}

output "payment_processor_function_arn" {
  description = "ARN of the Payment Processor Lambda function"
  value       = aws_lambda_function.payment_processor.arn
}

output "notification_sender_function_arn" {
  description = "ARN of the Notification Sender Lambda function"
  value       = aws_lambda_function.notification_sender.arn
}

output "analytics_service_function_arn" {
  description = "ARN of the Analytics Service Lambda function"
  value       = aws_lambda_function.analytics_service.arn
}
```

---

## Build Configuration

### Root build.gradle (if using Gradle composite builds)

```gradle
// Root build.gradle
plugins {
    id 'java'
}

allprojects {
    group = 'com.accessplus.eventpro'
    version = '1.0.0'
}

subprojects {
    repositories {
        mavenCentral()
    }
}
```

### Core API build.gradle

```gradle
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.5.3'
    id 'io.spring.dependency-management' version '1.1.4'
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-security'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    
    // AWS SDK
    implementation 'software.amazon.awssdk:s3:2.21.0'
    implementation 'software.amazon.awssdk:sqs:2.21.0'
    implementation 'software.amazon.awssdk:secretsmanager:2.21.0'
    
    // Database
    runtimeOnly 'org.postgresql:postgresql'
    
    // JWT (jjwt)
    implementation 'io.jsonwebtoken:jjwt-api:0.12.6'
    
    // Shared modules
    implementation project(':shared:common')
    implementation project(':shared:messaging')
    implementation project(':shared:database')
    
    // Testing
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}

jar {
    enabled = false
}
```

### Lambda build.gradle (Order Processor example)

```gradle
plugins {
    id 'java'
}

dependencies {
    // AWS Lambda
    implementation 'com.amazonaws:aws-lambda-java-core:1.2.3'
    implementation 'com.amazonaws:aws-lambda-java-events:3.11.3'
    
    // Spring Boot (for dependency injection)
    implementation 'org.springframework.boot:spring-boot-starter:3.5.3'
    
    // Database
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa:3.5.3'
    runtimeOnly 'org.postgresql:postgresql'
    
    // AWS SDK
    implementation 'software.amazon.awssdk:sqs:2.21.0'
    implementation 'software.amazon.awssdk:secretsmanager:2.21.0'
    
    // Shared modules
    implementation project(':shared:common')
    implementation project(':shared:messaging')
    implementation project(':shared:database')
}

// Task to build Lambda deployment package
task buildZip(type: Zip) {
    from compileJava
    from processResources
    into('lib') {
        from configurations.runtimeClasspath
    }
    archiveFileName = "${project.name}-${project.version}.zip"
    destinationDirectory = file("${buildDir}/distributions")
}

// Task to prepare Lambda package for Terraform
task prepareLambdaPackage(type: Copy) {
    dependsOn buildZip
    from "${buildDir}/distributions/${project.name}-${project.version}.zip"
    into "${rootProject.projectDir}/infrastructure/lambda-packages"
    rename { "${project.name}.zip" }
}
```

---

## Docker Configuration

### Core API Dockerfile

```dockerfile
# Multi-stage build
FROM gradle:8.5-jdk17 AS build
WORKDIR /app
COPY services/core-api/build.gradle services/core-api/settings.gradle ./
COPY services/core-api/src ./src
COPY shared ./shared
RUN gradle build -x test

FROM eclipse-temurin:25-jre-alpine
WORKDIR /app
COPY --from=build /app/build/libs/core-api-*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### docker-compose.yml (Local Development)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: eventpro
      POSTGRES_USER: eventpro
      POSTGRES_PASSWORD: eventpro
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  localstack:
    image: localstack/localstack:latest
    environment:
      - SERVICES=sqs,secretsmanager,s3
      - DEBUG=1
    ports:
      - "4566:4566"
    volumes:
      - localstack_data:/var/lib/localstack

  core-api:
    build:
      context: .
      dockerfile: services/core-api/Dockerfile
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/eventpro
      SPRING_DATASOURCE_USERNAME: eventpro
      SPRING_DATASOURCE_PASSWORD: eventpro
      AWS_ENDPOINT_URL: http://localstack:4566
    depends_on:
      - postgres
      - localstack

volumes:
  postgres_data:
  localstack_data:
```

---

## CI/CD Pipeline Structure

### .gitlab-ci.yml

```yaml
stages:
  - test
  - build
  - deploy

variables:
  ECR_REGISTRY: ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
  AWS_REGION: us-east-1

# Test all services
test-core-api:
  stage: test
  image: gradle:8.5-jdk17
  script:
    - cd services/core-api
    - ./gradlew test
  only:
    - merge_requests
    - main
    - develop

test-event-api:
  stage: test
  image: gradle:8.5-jdk17
  script:
    - cd services/event-api
    - ./gradlew test
  only:
    - merge_requests
    - main
    - develop

test-lambdas:
  stage: test
  image: gradle:8.5-jdk17
  script:
    - cd services/lambdas/order-processor && ./gradlew test
    - cd ../payment-processor && ./gradlew test
    - cd ../notification-sender && ./gradlew test
  only:
    - merge_requests
    - main
    - develop

# Build services
build-core-api:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - cd services/core-api
    - docker build -t $ECR_REGISTRY/core-api:$CI_COMMIT_SHA .
    - docker push $ECR_REGISTRY/core-api:$CI_COMMIT_SHA
  only:
    - main
    - develop

build-lambdas:
  stage: build
  image: gradle:8.5-jdk17
  script:
    - cd services/lambdas/order-processor && ./gradlew build
    - cd ../payment-processor && ./gradlew build
    - cd ../notification-sender && ./gradlew build
    - cd ../analytics-service && ./gradlew build
    - |
      # Copy Lambda packages to S3 for Terraform (Quarkus generates function.zip)
      aws s3 cp services/lambdas/order-processor/build/function.zip \
        s3://$S3_BUCKET/lambdas/order-processor-$CI_COMMIT_SHA.zip
      aws s3 cp services/lambdas/payment-processor/build/function.zip \
        s3://$S3_BUCKET/lambdas/payment-processor-$CI_COMMIT_SHA.zip
      aws s3 cp services/lambdas/notification-sender/build/function.zip \
        s3://$S3_BUCKET/lambdas/notification-sender-$CI_COMMIT_SHA.zip
      aws s3 cp services/lambdas/analytics-service/build/function.zip \
        s3://$S3_BUCKET/lambdas/analytics-service-$CI_COMMIT_SHA.zip
  artifacts:
    paths:
      - services/lambdas/*/build/function.zip
    expire_in: 1 hour
  only:
    - main
    - develop

# Deploy services
deploy-core-api-dev:
  stage: deploy
  image: amazon/aws-cli:latest
  script:
    - aws ecs update-service --cluster eventpro-dev --service core-api --force-new-deployment
  environment:
    name: dev
  only:
    - develop

deploy-lambdas-dev:
  stage: deploy
  image: hashicorp/terraform:latest
  script:
    - cd infrastructure/environments/dev
    - terraform init
    - terraform plan -var="order_processor_zip_path=../../lambda-packages/order-processor.zip"
    - terraform apply -auto-approve -var="order_processor_zip_path=../../lambda-packages/order-processor.zip"
  environment:
    name: dev
  only:
    - develop
  dependencies:
    - build-lambdas
```

---

## Environment Configuration

### application.yml (Core API)

```yaml
spring:
  application:
    name: core-api
  datasource:
    url: ${DB_URL:jdbc:postgresql://localhost:5432/eventpro}
    username: ${DB_USERNAME:eventpro}
    password: ${DB_PASSWORD:eventpro}
    hikari:
      maximum-pool-size: 10
      minimum-idle: 2
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect

aws:
  sqs:
    orderQueueUrl: ${ORDER_QUEUE_URL}
    paymentQueueUrl: ${PAYMENT_QUEUE_URL}
    notificationQueueUrl: ${NOTIFICATION_QUEUE_URL}
  secrets:
    manager:
      databaseSecret: ${DB_SECRET_ARN}

server:
  port: 8080

logging:
  level:
    com.accessplus.eventpro: INFO
    org.springframework: WARN
```

---

## Key Files Summary

### Root Level
- `.gitlab-ci.yml` - Main CI/CD pipeline
- `docker-compose.yml` - Local development
- `README.md` - Project documentation

### Each Service Contains
- `build.gradle` - Build configuration
- `Dockerfile` - Container image (for ECS services only)
- `src/main/resources/application.yml` - Configuration

**Note:** Lambda functions are deployed via Terraform (see `infrastructure/modules/lambda/`)

### Shared Modules
- Common utilities, messaging, database configs
- Reusable across all services

### Terraform
- Infrastructure as Code for all AWS resources
- Environment-specific configurations

---

## Development Workflow

1. **Local Development:**
   ```bash
   docker-compose up -d          # Start PostgreSQL, LocalStack
   cd services/core-api
   ./gradlew bootRun            # Run Core API locally
   ```

2. **Testing:**
   ```bash
   ./gradlew test               # Run unit tests
   ./gradlew integrationTest    # Run integration tests
   ```

3. **Building:**
   ```bash
   # ECS Services
   ./gradlew build              # Build JAR
   docker build -t core-api .   # Build Docker image
   
   # Lambda Functions (Quarkus generates function.zip automatically)
   ./gradlew :services:lambdas:order-processor:build
   # Lambda package will be in: services/lambdas/order-processor/build/function.zip
   ```

4. **Deployment:**
   - Push to GitLab
   - CI/CD pipeline automatically:
     - Runs tests
     - Builds Docker images (ECS services)
     - Builds Lambda packages (ZIP files)
     - Deploys via Terraform:
       - ECS services to ECS Fargate
       - Lambda functions to AWS Lambda
       - Infrastructure updates

---

**Document Version**: 1.0  
**Created**: 2024  
**Maintained By**: Tech Lead

