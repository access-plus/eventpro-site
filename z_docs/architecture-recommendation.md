# EventPro Site - Architecture Recommendation

## Executive Summary

After analyzing your application requirements, data model, and cost considerations, I recommend a **hybrid database approach** with **microservices architecture** and **event-driven patterns**. This document provides detailed recommendations for achieving resilience, high availability, and cost optimization.

---

## Database Strategy: Hybrid Approach

### Recommendation: PostgreSQL (Primary) + DynamoDB (Secondary)

**Why NOT DynamoDB as Primary:**
1. **Complex Relational Data**: Your application has 15 entities with intricate relationships (many-to-many, one-to-many, foreign keys)
2. **Complex Queries**: You need joins, aggregations, and complex reporting (analytics dashboard)
3. **ACID Transactions**: Order processing requires transactional integrity across multiple tables
4. **Data Consistency**: Ticket availability checks need strong consistency

**Why PostgreSQL is Better for Your Core:**
- **Relational Integrity**: Natural fit for your entity relationships
- **Complex Queries**: Analytics, reporting, and aggregations are straightforward
- **ACID Transactions**: Critical for order processing and ticket sales
- **Cost-Effective for Steady Load**: Your ticketing service likely has predictable patterns
- **Full-Text Search**: Built-in for event search functionality
- **JSONB Support**: Can store flexible data when needed

**Where DynamoDB Makes Sense:**
- **Session/Cart Storage**: Temporary, high-throughput data
- **Real-time Analytics**: Event streams and counters
- **Caching Layer**: Frequently accessed data
- **Audit Logs**: High-volume write operations

### Cost Analysis

**PostgreSQL (RDS Multi-AZ) - Estimated Monthly Cost:**
- **Dev Environment**: 
  - Instance: `db.t3.medium` (2 vCPU, 4GB RAM) = ~$48/month
  - Storage: 100GB = ~$11.50/month
  - **Total: ~$60/month**
- **Production Environment**:
  - Instance: `db.r6g.large` (2 vCPU, 16GB RAM, Multi-AZ) = ~$200/month
  - Storage: 500GB = ~$57.50/month
  - Backup: 500GB = ~$57.50/month
  - **Total: ~$315/month**

**DynamoDB (if used for high-traffic operations) - Estimated Monthly Cost:**
- **On-Demand Pricing** (recommended for variable traffic):
  - 1M writes = $1.25
  - 1M reads = $0.25
  - Storage: $0.25/GB/month
- **Example**: 10M writes, 50M reads, 100GB storage = ~$15/month

**Conclusion**: For your use case with complex relational data, PostgreSQL is **more cost-effective** and **better suited** than DynamoDB as the primary database.

---

## Recommended Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                       │
│  React 19 + TypeScript + Vite (S3 + CloudFront)             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                      │
│  AWS API Gateway / Application Load Balancer                │
│  - Authentication (Cognito)                                 │
│  - Rate Limiting                                            │
│  - Request Routing                                          │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌───────────────┐
│   Core API   │    │  Event API   │    │  Payment API  │
│  (ECS Fargate│    │ (ECS Fargate)│    │ (ECS Fargate) │
│   Spring Boot│    │ Spring Boot) │    │ Spring Boot)  │
└──────────────┘    └──────────────┘    └───────────────┘
        │                     │                     │
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌───────────────┐
│  PostgreSQL  │    │   SQS Queue  │    │   SQS Queue   │
│  (RDS Multi- │    │  (Order Queue│    │ (Payment Queue│
│     AZ)      │    │              │    │               │
└──────────────┘    └──────────────┘    └───────────────┘
                              │                     │
                              ▼                     ▼
                    ┌──────────────┐    ┌─────────────────┐
                    │   Lambda     │    │   Lambda        │
                    │ Order Processor│  │Payment Processor│
                    └──────────────┘    └─────────────────┘
                              │                     │
                              ▼                     ▼
                    ┌──────────────┐    ┌──────────────┐
                    │  PostgreSQL  │    │  PostgreSQL  │
                    │  (RDS Multi- │    │  (RDS Multi- │
                    │     AZ)      │    │     AZ)      │
                    └──────────────┘    └──────────────┘
                              │
                              ▼
                    ┌──────────────┐
                    │   SQS Queue  │
                    │(Notification │
                    │    Queue)    │
                    └──────────────┘
                              │
                              ▼
                    ┌──────────────┐
                    │   Lambda     │
                    │Notification  │
                    │   Sender     │
                    └──────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
            ┌──────────────┐    ┌──────────────┐
            │  AWS SES     │    │  AWS SNS     │
            │  (Email)     │    │  (SMS)       │
            └──────────────┘    └──────────────┘
```

### Microservices Breakdown

#### 1. **Core API Service** (ECS Fargate - Spring Boot)
**Responsibilities:**
- User management
- Event CRUD operations
- Ticket management
- Cart management
- Authentication/Authorization

**Database:** PostgreSQL (RDS Multi-AZ)

**Why ECS Fargate:**
- Always-on service for synchronous operations
- Better for long-running connections
- Cost-effective for steady traffic
- Easy integration with RDS

---

#### 2. **Event API Service** (ECS Fargate - Spring Boot)
**Responsibilities:**
- Event search and filtering
- Event analytics
- Event recommendations

**Database:** PostgreSQL (RDS Multi-AZ) + DynamoDB (for caching)

**Why Separate:**
- Can scale independently
- Different performance requirements
- Isolated failure domain

---

#### 3. **Order Processing Service** (Lambda + SQS)
**Responsibilities:**
- Order creation from cart
- Order validation
- Ticket reservation
- Order status updates

**Flow:**
```
User places order
    ↓
Core API creates order (PENDING status)
    ↓
Publishes to SQS: order-queue
    ↓
Lambda: OrderProcessor
    ↓
Validates order
Reserves tickets
Updates order status (PROCESSING)
    ↓
Publishes to SQS: payment-queue
```

**Why Lambda:**
- Event-driven, only runs when needed
- Auto-scaling
- Cost-effective (pay per execution)
- No idle costs

---

#### 4. **Payment Processing Service** (Lambda + SQS)
**Responsibilities:**
- Payment processing (Stripe)
- Payment webhook handling
- Order fulfillment
- Ticket assignment

**Flow:**
```
OrderProcessor publishes to payment-queue
    ↓
Lambda: PaymentProcessor
    ↓
Creates Stripe payment intent
Processes payment
    ↓
On Success:
  - Updates order status (PAID)
  - Assigns tickets to user
  - Generates QR codes
  - Publishes to notification-queue
    ↓
On Failure:
  - Updates order status (FAILED)
  - Releases ticket reservations
  - Publishes to notification-queue
```

**Why Lambda:**
- Payment processing is event-driven
- High security (no persistent connections)
- Cost-effective for sporadic operations
- Easy integration with Stripe webhooks

---

#### 5. **Notification Service** (Lambda + SQS)
**Responsibilities:**
- Email notifications (SES)
- SMS notifications (SNS)
- In-app notifications (WebSocket)

**Flow:**
```
PaymentProcessor/OrderProcessor publishes to notification-queue
    ↓
Lambda: NotificationSender
    ↓
Reads user preferences
Sends email (SES)
Sends SMS (SNS)
Sends WebSocket message (API Gateway)
```

**Why Lambda:**
- Event-driven notifications
- High throughput capability
- Cost-effective (pay per notification)
- Easy integration with SES/SNS

---

#### 6. **Analytics Service** (Lambda + EventBridge)
**Responsibilities:**
- Real-time analytics
- Event metrics
- Sales reports

**Database:** DynamoDB (for counters) + PostgreSQL (for detailed reports)

**Why Lambda:**
- Scheduled reports (EventBridge cron)
- On-demand analytics
- Cost-effective for batch processing

---

## Detailed Service Architecture

### Core API Service

**Technology Stack:**
- Spring Boot 3.5.3
- PostgreSQL (RDS Multi-AZ)
- ECS Fargate
- Application Load Balancer

**Endpoints:**
- `/api/v1/users/**` - User management
- `/api/v1/events/**` - Event CRUD
- `/api/v1/tickets/**` - Ticket management
- `/api/v1/cart/**` - Cart operations

**Database Schema:**
- All 15 entities in PostgreSQL
- Optimized indexes for common queries
- Connection pooling (HikariCP)

**Scaling:**
- Auto-scaling based on CPU/Memory
- Min: 2 tasks, Max: 10 tasks
- Target: 70% CPU utilization

**Cost Estimate:**
- 2 tasks (0.5 vCPU, 1GB RAM each) = ~$30/month
- ALB = ~$20/month
- **Total: ~$50/month (dev)**
- 4 tasks (1 vCPU, 2GB RAM each) = ~$120/month
- ALB = ~$20/month
- **Total: ~$140/month (prod)**

---

### Order Processing Lambda

**Configuration:**
```yaml
Function: OrderProcessor
Runtime: Java 21
Memory: 512 MB
Timeout: 5 minutes
Reserved Concurrency: 10 (to prevent over-processing)
```

**Trigger:**
- SQS Queue: `order-queue`
- Batch Size: 10 messages
- Visibility Timeout: 5 minutes

**Logic:**
```java
@LambdaFunction
public void processOrder(SQSEvent event) {
    for (SQSMessage message : event.getRecords()) {
        OrderRequest orderRequest = parseMessage(message);
        
        // Validate order
        if (!validateOrder(orderRequest)) {
            sendToDLQ(message);
            return;
        }
        
        // Reserve tickets
        reserveTickets(orderRequest);
        
        // Update order status
        updateOrderStatus(orderRequest.getOrderId(), PROCESSING);
        
        // Publish to payment queue
        publishToPaymentQueue(orderRequest);
    }
}
```

**Error Handling:**
- Dead Letter Queue (DLQ) for failed messages
- Retry logic (3 attempts)
- Alerting on DLQ messages

**Cost Estimate:**
- 1000 orders/day = 1000 invocations
- 512MB, 2s average = ~$0.50/month
- SQS: 1000 messages = ~$0.40/month
- **Total: ~$1/month**

---

### Payment Processing Lambda

**Configuration:**
```yaml
Function: PaymentProcessor
Runtime: Java 21
Memory: 1024 MB
Timeout: 15 minutes (for Stripe API calls)
Reserved Concurrency: 5
```

**Trigger:**
- SQS Queue: `payment-queue`
- Batch Size: 1 (one payment at a time for safety)

**Logic:**
```java
@LambdaFunction
public void processPayment(SQSEvent event) {
    PaymentRequest paymentRequest = parseMessage(event);
    
    try {
        // Process Stripe payment
        PaymentResult result = stripeService.processPayment(paymentRequest);
        
        if (result.isSuccess()) {
            // Update order status
            updateOrderStatus(paymentRequest.getOrderId(), PAID);
            
            // Assign tickets
            assignTickets(paymentRequest.getOrderId());
            
            // Generate QR codes
            generateQRCodes(paymentRequest.getOrderId());
            
            // Publish to notification queue
            publishToNotificationQueue(paymentRequest, SUCCESS);
        } else {
            // Release ticket reservations
            releaseTicketReservations(paymentRequest.getOrderId());
            
            // Update order status
            updateOrderStatus(paymentRequest.getOrderId(), FAILED);
            
            // Publish to notification queue
            publishToNotificationQueue(paymentRequest, FAILURE);
        }
    } catch (Exception e) {
        // Send to DLQ
        sendToDLQ(event);
    }
}
```

**Webhook Handler:**
- Separate Lambda for Stripe webhooks
- API Gateway endpoint: `/api/v1/payments/webhook`
- Signature verification

**Cost Estimate:**
- 1000 payments/day = 1000 invocations
- 1024MB, 5s average = ~$2/month
- SQS: 1000 messages = ~$0.40/month
- **Total: ~$2.50/month**

---

### Notification Service Lambda

**Configuration:**
```yaml
Function: NotificationSender
Runtime: Java 21
Memory: 256 MB
Timeout: 1 minute
Reserved Concurrency: 20
```

**Trigger:**
- SQS Queue: `notification-queue`
- Batch Size: 10 messages

**Logic:**
```java
@LambdaFunction
public void sendNotifications(SQSEvent event) {
    for (SQSMessage message : event.getRecords()) {
        NotificationRequest request = parseMessage(message);
        
        // Get user preferences
        NotificationPreferences prefs = getPreferences(request.getUserId());
        
        // Send email
        if (prefs.isEmailEnabled()) {
            sesService.sendEmail(request);
        }
        
        // Send SMS
        if (prefs.isSmsEnabled()) {
            snsService.sendSMS(request);
        }
        
        // Send WebSocket (via API Gateway)
        if (prefs.isPushEnabled()) {
            websocketService.sendMessage(request);
        }
    }
}
```

**Cost Estimate:**
- 5000 notifications/day = 5000 invocations
- 256MB, 1s average = ~$0.50/month
- SQS: 5000 messages = ~$2/month
- SES: 5000 emails = ~$0.50/month
- SNS: 1000 SMS = ~$6.50/month
- **Total: ~$9.50/month**

---

## SQS Queue Configuration

### Order Queue
```yaml
QueueName: order-queue
VisibilityTimeout: 300 seconds (5 minutes)
MessageRetentionPeriod: 14 days
DeadLetterQueue: order-queue-dlq
MaxReceiveCount: 3
```

### Payment Queue
```yaml
QueueName: payment-queue
VisibilityTimeout: 900 seconds (15 minutes)
MessageRetentionPeriod: 14 days
DeadLetterQueue: payment-queue-dlq
MaxReceiveCount: 3
FIFO: false (can process payments in parallel)
```

### Notification Queue
```yaml
QueueName: notification-queue
VisibilityTimeout: 60 seconds
MessageRetentionPeriod: 7 days
DeadLetterQueue: notification-queue-dlq
MaxReceiveCount: 3
```

---

## Resilience & High Availability

### 1. **Database Resilience**
- **RDS Multi-AZ**: Automatic failover (< 60 seconds)
- **Automated Backups**: Daily backups, 7-day retention
- **Point-in-time Recovery**: 7-day window
- **Read Replicas**: For analytics queries (optional)

### 2. **Application Resilience**
- **ECS Service**: Multiple tasks across AZs
- **Health Checks**: ALB health checks every 30s
- **Auto-Scaling**: Scale based on CPU/Memory/Request count
- **Circuit Breakers**: Hystrix/Resilience4j for external calls

### 3. **Lambda Resilience**
- **Dead Letter Queues**: Capture failed messages
- **Retry Logic**: Exponential backoff
- **Reserved Concurrency**: Prevent over-processing
- **Error Monitoring**: CloudWatch Alarms

### 4. **SQS Resilience**
- **Message Durability**: 99.999999999% (11 9's)
- **DLQ**: Automatic retry with DLQ fallback
- **Visibility Timeout**: Prevents duplicate processing

### 5. **Network Resilience**
- **Multi-AZ Deployment**: All services in multiple AZs
- **VPC**: Isolated network with private subnets
- **Security Groups**: Least privilege access

---

## Cost Optimization

### Monthly Cost Estimate (Production)

#### Infrastructure
- **RDS PostgreSQL Multi-AZ**: ~$315/month
- **ECS Fargate (Core API)**: ~$140/month
- **ECS Fargate (Event API)**: ~$70/month
- **ALB**: ~$20/month
- **S3 (images, frontend)**: ~$10/month
- **CloudFront**: ~$5/month
- **Route53**: ~$1/month
- **VPC/NAT Gateway**: ~$35/month
- **ECR**: ~$5/month

**Subtotal: ~$600/month**

#### Serverless (Lambda + SQS)
- **Order Processing Lambda**: ~$1/month
- **Payment Processing Lambda**: ~$2.50/month
- **Notification Lambda**: ~$0.50/month
- **SQS (3 queues)**: ~$3/month

**Subtotal: ~$7/month**

#### Other Services
- **Cognito**: ~$0.50/month (first 50K MAU free)
- **SES**: ~$0.50/month
- **SNS**: ~$6.50/month
- **Secrets Manager**: ~$0.40/month
- **CloudWatch**: ~$10/month

**Subtotal: ~$18/month**

#### **Total Estimated Cost: ~$625/month**

### Cost Optimization Strategies

1. **Reserved Instances**: 
   - RDS Reserved Instance (1-year): ~30% savings = ~$95/month savings
   - **New Total: ~$530/month**

2. **Spot Instances** (for dev):
   - Use Spot for dev ECS tasks: ~70% savings
   - **Dev Cost: ~$200/month**

3. **Lambda Optimization**:
   - Right-size memory (not over-provisioning)
   - Use provisioned concurrency only if needed
   - Already optimized in design

4. **S3 Lifecycle Policies**:
   - Move old images to Glacier: ~70% savings
   - **S3 Cost: ~$3/month**

5. **CloudWatch Logs**:
   - Set retention to 7 days (not 30): ~70% savings
   - **CloudWatch Cost: ~$3/month**

**Optimized Total: ~$440/month**

---

## Migration Path from Monolith

### Phase 1: Extract Order Processing (Week 1-2)
1. Create `order-queue` SQS queue
2. Create OrderProcessor Lambda
3. Modify Core API to publish to queue instead of processing
4. Test and validate

### Phase 2: Extract Payment Processing (Week 3-4)
1. Create `payment-queue` SQS queue
2. Create PaymentProcessor Lambda
3. Modify OrderProcessor to publish to payment queue
4. Test and validate

### Phase 3: Extract Notifications (Week 5-6)
1. Create `notification-queue` SQS queue
2. Create NotificationSender Lambda
3. Modify services to publish to notification queue
4. Test and validate

### Phase 4: Extract Event API (Week 7-8)
1. Create separate Event API service
2. Deploy to ECS
3. Update API Gateway routing
4. Test and validate

---

## Monitoring & Observability

### CloudWatch Metrics
- **ECS Metrics**: CPU, Memory, Request count
- **Lambda Metrics**: Invocations, Duration, Errors
- **RDS Metrics**: CPU, Connections, IOPS
- **SQS Metrics**: Queue depth, Message age
- **ALB Metrics**: Request count, Response time, Error rate

### CloudWatch Alarms
- **Critical**: Error rate > 5%, CPU > 80%, Queue depth > 1000
- **Warning**: Memory > 75%, Response time > 2s

### CloudWatch Dashboards
- **Application Dashboard**: Request rates, error rates, response times
- **Infrastructure Dashboard**: ECS, RDS, Lambda metrics
- **Business Dashboard**: Orders, payments, revenue

### Distributed Tracing
- **AWS X-Ray**: Trace requests across services
- **Correlation IDs**: Track requests through queues

---

## Security Considerations

### 1. **Network Security**
- VPC with private subnets
- Security groups (least privilege)
- NAT Gateway for outbound (no public IPs)

### 2. **Application Security**
- Cognito for authentication
- IAM roles for Lambda (least privilege)
- Secrets Manager for credentials
- WAF on ALB

### 3. **Data Security**
- Encryption at rest (RDS, S3)
- Encryption in transit (TLS)
- Database credentials rotation

### 4. **Lambda Security**
- VPC configuration (if accessing RDS)
- IAM roles with minimal permissions
- Environment variables encryption

---

## Recommended Next Steps

1. **Start with Core API + PostgreSQL**
   - Deploy Core API to ECS
   - Set up RDS PostgreSQL Multi-AZ
   - Validate functionality

2. **Add Order Processing Lambda**
   - Create order-queue
   - Create OrderProcessor Lambda
   - Integrate with Core API

3. **Add Payment Processing Lambda**
   - Create payment-queue
   - Create PaymentProcessor Lambda
   - Integrate with OrderProcessor

4. **Add Notification Lambda**
   - Create notification-queue
   - Create NotificationSender Lambda
   - Integrate with all services

5. **Extract Event API**
   - Create separate Event API service
   - Deploy to ECS
   - Update routing

---

## Conclusion

**Database Choice**: **PostgreSQL (RDS Multi-AZ)** is the right choice for your application due to:
- Complex relational data model
- ACID transaction requirements
- Cost-effectiveness for steady workloads
- Better fit for your use case

**Architecture**: **Microservices + Lambda + SQS** provides:
- **Resilience**: Isolated failure domains, automatic retries
- **High Availability**: Multi-AZ, auto-scaling, health checks
- **Cost Optimization**: Pay-per-use Lambda, right-sized ECS
- **Scalability**: Independent scaling of services

**Estimated Cost**: ~$440-625/month (production) with optimizations

This architecture balances performance, cost, and operational complexity while providing the resilience and scalability needed for a ticketing platform.

---

**Document Version**: 1.0  
**Created**: 2024  
**Maintained By**: Tech Lead  
**Next Review**: After Phase 1 implementation

