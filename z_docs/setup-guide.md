# EventPro Site - Setup Guide

## Prerequisites

- Java 21 installed
- Gradle 8.5+ installed (or use Gradle wrapper)
- Docker installed (for local development)
- AWS CLI configured (for deployment)

---

## Step 1
<details>
<summary>Create Root Project Structure</summary>

```bash
cd eventpro-site

# Create root settings.gradle
cat > settings.gradle << 'EOF'
rootProject.name = 'eventpro-site'

include 'services:core-api'
include 'services:event-api'
include 'services:lambdas:order-processor'
include 'services:lambdas:payment-processor'
include 'services:lambdas:notification-sender'
include 'services:lambdas:analytics-service'
include 'shared:common'
include 'shared:messaging'
include 'shared:database'
EOF

# Create root build.gradle
cat > build.gradle << 'EOF'
plugins {
    id 'java'
}

allprojects {
    group = 'com.accessplus.eventpro'
    version = '1.0.0'
    
    repositories {
        mavenCentral()
    }
}

subprojects {
    apply plugin: 'java'
    
    java {
        sourceCompatibility = JavaVersion.VERSION_21
        targetCompatibility = JavaVersion.VERSION_21
    }
}
EOF
```

</details>

## Step 2
<details>
<summary>Create Shared Modules</summary>

<details>
<summary>2.1 Common Module</summary>

```bash
mkdir -p shared/common/src/main/java/com/accessplus/eventpro/common
mkdir -p shared/common/src/main/java/com/accessplus/eventpro/common/exception
mkdir -p shared/common/src/main/java/com/accessplus/eventpro/common/model
mkdir -p shared/common/src/main/java/com/accessplus/eventpro/common/utils
mkdir -p shared/common/src/main/java/com/accessplus/eventpro/common/constants

# Create build.gradle
cat > shared/common/build.gradle << 'EOF'
dependencies {
    // Spring Boot
    implementation 'org.springframework.boot:spring-boot-starter:3.5.7'
    
    // Lombok
    compileOnly 'org.projectlombok:lombok:1.18.30'
    annotationProcessor 'org.projectlombok:lombok:1.18.30'
}
EOF

# Create BaseEntity
cat > shared/common/src/main/java/com/accessplus/eventpro/common/model/BaseEntity.java << 'EOF'
package com.accessplus.eventpro.common.model;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@MappedSuperclass
@Getter
@Setter
public abstract class BaseEntity {
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
EOF

# Create BusinessException
cat > shared/common/src/main/java/com/accessplus/eventpro/common/exception/BusinessException.java << 'EOF'
package com.accessplus.eventpro.common.exception;

public class BusinessException extends RuntimeException {
    private final String errorCode;
    
    public BusinessException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }
    
    public String getErrorCode() {
        return errorCode;
    }
}
EOF
```

</details>

<details>
<summary>2.2 Messaging Module</summary>

```bash
mkdir -p shared/messaging/src/main/java/com/accessplus/eventpro/messaging/sqs
mkdir -p shared/messaging/src/main/java/com/accessplus/eventpro/messaging/model

# Create build.gradle
cat > shared/messaging/build.gradle << 'EOF'
dependencies {
    // AWS SDK
    implementation 'software.amazon.awssdk:sqs:2.21.0'
    
    // Jackson for JSON
    implementation 'com.fasterxml.jackson.core:jackson-databind:2.15.2'
    
    // Shared common
    implementation project(':shared:common')
}
EOF

# Create SQSMessagePublisher
cat > shared/messaging/src/main/java/com/accessplus/eventpro/messaging/sqs/SQSMessagePublisher.java << 'EOF'
package com.accessplus.eventpro.messaging.sqs;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.SendMessageRequest;

@Slf4j
@RequiredArgsConstructor
public class SQSMessagePublisher {
    private final SqsClient sqsClient;
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    public void publish(String queueUrl, Object message) {
        try {
            String messageBody = objectMapper.writeValueAsString(message);
            
            SendMessageRequest request = SendMessageRequest.builder()
                .queueUrl(queueUrl)
                .messageBody(messageBody)
                .build();
            
            sqsClient.sendMessage(request);
            log.info("Message published to queue: {}", queueUrl);
        } catch (Exception e) {
            log.error("Error publishing message to queue: {}", queueUrl, e);
            throw new RuntimeException("Failed to publish message", e);
        }
    }
}
EOF
```

</details>

<details>
<summary>2.3 Database Module</summary>

```bash
mkdir -p shared/database/src/main/java/com/accessplus/eventpro/database/config

# Create build.gradle
cat > shared/database/build.gradle << 'EOF'
dependencies {
    // Spring Data JPA
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa:3.5.7'
    
    // PostgreSQL
    runtimeOnly 'org.postgresql:postgresql'
    
    // AWS Secrets Manager
    implementation 'software.amazon.awssdk:secretsmanager:2.21.0'
}
EOF
```
</details>

</details>

## Step 3
<details>
<summary>Create Core API Service (ECS)</summary>

<details>
<summary>Create core api service</summary>

```bash
cd services

# Use Spring Initializr or create manually
# Option 1: Using Spring Initializr (recommended)
curl https://start.spring.io/starter.zip \
  -d type=gradle-project \
  -d language=java \
  -d bootVersion=3.5.7 \
  -d baseDir=core-api \
  -d groupId=com.accessplus.eventpro \
  -d artifactId=core-api \
  -d name=core-api \
  -d packageName=com.accessplus.eventpro.core \
  -d packaging=jar \
  -d javaVersion=21 \
  -d dependencies=web,data-jpa,security,validation,postgresql \
  -o core-api.zip

unzip core-api.zip -d .
rm core-api.zip

# Option 2: Create manually
mkdir -p core-api/src/main/java/com/accessplus/eventpro/core
mkdir -p core-api/src/main/resources
mkdir -p core-api/src/test/java/com/accessplus/eventpro/core
```

</details>

<details>
<summary>Update Core API build.gradle</summary>


```bash
cat > core-api/build.gradle << 'EOF'
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.5.7'
    id 'io.spring.dependency-management' version '1.1.7'
}

dependencies {
    // Spring Boot
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-security'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    
    // AWS SDK
    implementation 'software.amazon.awssdk:s3:2.21.0'
    implementation 'software.amazon.awssdk:sqs:2.21.0'
    implementation 'software.amazon.awssdk:secretsmanager:2.21.0'
    implementation 'com.amazonaws:aws-java-sdk-cognitoidp:1.12.500'
    
    // Database
    runtimeOnly 'org.postgresql:postgresql'
    
    // Lombok
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'
    
    // Shared modules
    implementation project(':shared:common')
    implementation project(':shared:messaging')
    implementation project(':shared:database')
    
    // Testing
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'org.springframework.security:spring-security-test'
}

jar {
    enabled = false
}
EOF
```

</details>

<details>
<summary>Create Core API Application Class</summary>

```bash
cat > services/core-api/src/main/java/com/accessplus/eventpro/core/CoreApiApplication.java << 'EOF'
package com.accessplus.eventpro.core;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CoreApiApplication {
    public static void main(String[] args) {
        SpringApplication.run(CoreApiApplication.class, args);
    }
}
EOF
```

</details>

<details>
<summary>Create application.yml</summary>

```bash
cat > core-api/src/main/resources/application.yml << 'EOF'
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
  cognito:
    userPoolId: ${COGNITO_USER_POOL_ID}
    clientId: ${COGNITO_CLIENT_ID}
    region: ${AWS_REGION:us-east-1}
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
EOF
```

</details>

<details>
<summary>Create Dockerfile</summary>

```bash
cat > core-api/Dockerfile << 'EOF'
# Multi-stage build
FROM gradle:8.5-jdk21 AS build
WORKDIR /app

# Copy build files
COPY build.gradle settings.gradle ./
COPY shared ../shared
COPY services/core-api ./services/core-api

# Build
RUN gradle :services:core-api:build -x test

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy JAR
COPY --from=build /app/services/core-api/build/libs/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
EOF
```
</details>

</details>

## Step 4
<details>
<summary>Create Event API Service (ECS)</summary>

```bash
# Similar to Core API
curl https://start.spring.io/starter.zip \
  -d type=gradle-project \
  -d language=java \
  -d bootVersion=3.5.7 \
  -d baseDir=event-api \
  -d groupId=com.accessplus.eventpro \
  -d artifactId=event-api \
  -d name=event-api \
  -d packageName=com.accessplus.eventpro.event \
  -d packaging=jar \
  -d javaVersion=21 \
  -d dependencies=web,data-jpa,postgresql \
  -o event-api.zip

unzip event-api.zip -d .
rm event-api.zip
```

### Update Event API build.gradle

```bash
cat > event-api/build.gradle << 'EOF'
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.5.7'
    id 'io.spring.dependency-management' version '1.1.7'
}

dependencies {
    // Spring Boot
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    
    // AWS SDK
    implementation 'software.amazon.awssdk:s3:2.21.0'
    implementation 'software.amazon.awssdk:dynamodb:2.21.0'
    
    // Database
    runtimeOnly 'org.postgresql:postgresql'
    
    // Lombok
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'
    
    // Shared modules
    implementation project(':shared:common')
    implementation project(':shared:database')
    
    // Testing
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}

jar {
    enabled = false
}
EOF
```

</details>


## Step 5
<details>
<summary>Create Lambda Functions (Using Quarkus)</summary>

**Why Quarkus for Lambda?**
- **Lower Memory Footprint**: Quarkus uses ~30-40% less memory than Spring Boot
- **Faster Cold Starts**: Better optimized for serverless environments
- **Smaller Deployment Packages**: Compile-time optimizations reduce package size
- **Better for Event-Driven**: Designed for cloud-native, serverless architectures

**Note**: We'll use **Quarkus** for Lambda functions and **Spring Boot** for ECS services (always-on services benefit less from Quarkus optimizations).

### 5.1 Order Processor Lambda

```bash
mkdir -p services/lambdas/order-processor/src/main/java/com/accessplus/eventpro/order
mkdir -p services/lambdas/order-processor/src/main/java/com/accessplus/eventpro/order/handler
mkdir -p services/lambdas/order-processor/src/main/java/com/accessplus/eventpro/order/service
mkdir -p services/lambdas/order-processor/src/main/java/com/accessplus/eventpro/order/model
mkdir -p services/lambdas/order-processor/src/main/java/com/accessplus/eventpro/order/config
mkdir -p services/lambdas/order-processor/src/main/resources
mkdir -p services/lambdas/order-processor/src/test/java/com/accessplus/eventpro/order
```

### Create Order Processor build.gradle (Quarkus)

```bash
cat > services/lambdas/order-processor/build.gradle << 'EOF'
plugins {
    id 'java'
    id 'io.quarkus' version '3.26.2'
}

repositories {
    mavenCentral()
    mavenLocal()
    gradlePluginPortal()
}

dependencies {
    // Quarkus Platform BOM
    implementation enforcedPlatform("${quarkusPlatformGroupId}:${quarkusPlatformArtifactId}:${quarkusPlatformVersion}")
    implementation enforcedPlatform("software.amazon.awssdk:bom:2.21.29")
    
    // Quarkus AWS Lambda
    implementation 'io.quarkus:quarkus-amazon-lambda-rest'
    implementation 'io.quarkus:quarkus-rest-jackson'
    implementation 'io.quarkus:quarkus-rest'
    implementation 'io.quarkus:quarkus-arc'
    implementation 'io.quarkus:quarkus-hibernate-validator'
    
    // Database (Quarkus JPA)
    implementation 'io.quarkus:quarkus-hibernate-orm'
    implementation 'io.quarkus:quarkus-jdbc-postgresql'
    
    // AWS SDK
    implementation 'software.amazon.awssdk:sqs'
    implementation 'software.amazon.awssdk:secretsmanager'
    
    // Logging
    implementation 'io.quarkus:quarkus-logging-json'
    
    // Health checks
    implementation 'io.quarkus:quarkus-smallrye-health'
    
    // Lombok
    compileOnly 'org.projectlombok:lombok:1.18.36'
    annotationProcessor 'org.projectlombok:lombok:1.18.36'
    
    // Shared modules
    implementation project(':shared:common')
    implementation project(':shared:messaging')
    implementation project(':shared:database')
    
    // Testing
    testImplementation 'io.quarkus:quarkus-junit5'
}

group = 'com.accessplus.eventpro'
version = '1.0.0-SNAPSHOT'

java {
    sourceCompatibility = JavaVersion.VERSION_21
    targetCompatibility = JavaVersion.VERSION_21
}

// Configure annotation processing for Lombok
configurations {
    compileOnly {
        extendsFrom annotationProcessor
    }
}

// Configure compiler options for Lombok + Quarkus compatibility
compileJava {
    options.encoding = 'UTF-8'
    options.compilerArgs << '-parameters'
    // Critical for Lombok + Quarkus Jackson compatibility
    options.compilerArgs += [
        '-Ajackson.annotation.processing.disabled=true'
    ]
}

compileTestJava {
    options.encoding = 'UTF-8'
}

test {
    systemProperty "java.util.logging.manager", "org.jboss.logmanager.LogManager"
}

// Quarkus automatically generates the Lambda deployment package
// Run: ./gradlew build
// The package will be in: build/function.zip (ready to deploy)
EOF
```

### Create gradle.properties for Quarkus

```bash
cat > services/lambdas/order-processor/gradle.properties << 'EOF'
quarkusPlatformGroupId=io.quarkus
quarkusPlatformArtifactId=quarkus-bom
quarkusPlatformVersion=3.26.2
EOF
```

### Create Order Processor Handler (Quarkus)

```bash
cat > services/lambdas/order-processor/src/main/java/com/accessplus/eventpro/order/handler/OrderProcessorHandler.java << 'EOF'
package com.accessplus.eventpro.order.handler;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.SQSEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@ApplicationScoped
public class OrderProcessorHandler implements RequestHandler<SQSEvent, Void> {
    
    @Inject
    ObjectMapper objectMapper;
    
    // Inject your services here
    // @Inject
    // OrderValidationService orderValidationService;
    
    // @Inject
    // TicketReservationService ticketReservationService;
    
    @Override
    public Void handleRequest(SQSEvent event, Context context) {
        log.info("Processing {} SQS messages", event.getRecords().size());
        
        for (SQSEvent.SQSMessage message : event.getRecords()) {
            try {
                String body = message.getBody();
                log.info("Processing order message: {}", body);
                
                // TODO: Implement order processing logic
                // 1. Parse order request using objectMapper
                // 2. Validate order
                // 3. Reserve tickets
                // 4. Update order status
                // 5. Publish to payment queue
                
            } catch (Exception e) {
                log.error("Error processing order message", e);
                throw new RuntimeException("Failed to process order", e);
            }
        }
        
        return null;
    }
}
EOF
```

### Create application.properties for Order Processor

```bash
cat > services/lambdas/order-processor/src/main/resources/application.properties << 'EOF'
# Quarkus Configuration
quarkus.application.name=order-processor
quarkus.application.version=1.0.0

# Logging
quarkus.log.level=INFO
quarkus.log.console.format=%d{yyyy-MM-dd HH:mm:ss} %-5p [%c{2.}] (%t) %s%e%n

# Lambda Handler Configuration
quarkus.lambda.handler=orderProcessor

# Database Configuration (if needed)
quarkus.datasource.db-kind=postgresql
quarkus.datasource.username=${DB_USERNAME:eventpro}
quarkus.datasource.password=${DB_PASSWORD:eventpro}
quarkus.datasource.jdbc.url=${DB_URL:jdbc:postgresql://localhost:5432/eventpro}

# Hibernate
quarkus.hibernate-orm.database.generation=none
quarkus.hibernate-orm.log.sql=false

# AWS Configuration
aws.region=${AWS_REGION:us-east-1}
sqs.payment.queue.url=${PAYMENT_QUEUE_URL}
EOF
```

### 5.2 Payment Processor Lambda

```bash
mkdir -p services/lambdas/payment-processor/src/main/java/com/accessplus/eventpro/payment
mkdir -p services/lambdas/payment-processor/src/main/java/com/accessplus/eventpro/payment/handler
mkdir -p services/lambdas/payment-processor/src/main/java/com/accessplus/eventpro/payment/service
mkdir -p services/lambdas/payment-processor/src/main/java/com/accessplus/eventpro/payment/model
mkdir -p services/lambdas/payment-processor/src/main/java/com/accessplus/eventpro/payment/config
mkdir -p services/lambdas/payment-processor/src/main/resources
```

### Create Payment Processor build.gradle (Quarkus)

```bash
cat > services/lambdas/payment-processor/build.gradle << 'EOF'
plugins {
    id 'java'
    id 'io.quarkus' version '3.26.2'
}

repositories {
    mavenCentral()
    mavenLocal()
    gradlePluginPortal()
}

dependencies {
    // Quarkus Platform BOM
    implementation enforcedPlatform("${quarkusPlatformGroupId}:${quarkusPlatformArtifactId}:${quarkusPlatformVersion}")
    implementation enforcedPlatform("software.amazon.awssdk:bom:2.21.29")
    
    // Quarkus AWS Lambda
    implementation 'io.quarkus:quarkus-amazon-lambda-rest'
    implementation 'io.quarkus:quarkus-rest-jackson'
    implementation 'io.quarkus:quarkus-rest'
    implementation 'io.quarkus:quarkus-arc'
    implementation 'io.quarkus:quarkus-hibernate-validator'
    
    // Database (Quarkus JPA)
    implementation 'io.quarkus:quarkus-hibernate-orm'
    implementation 'io.quarkus:quarkus-jdbc-postgresql'
    
    // AWS SDK
    implementation 'software.amazon.awssdk:sqs'
    implementation 'software.amazon.awssdk:secretsmanager'
    
    // Stripe
    implementation 'com.stripe:stripe-java:23.6.0'
    
    // Logging
    implementation 'io.quarkus:quarkus-logging-json'
    
    // Health checks
    implementation 'io.quarkus:quarkus-smallrye-health'
    
    // Lombok
    compileOnly 'org.projectlombok:lombok:1.18.36'
    annotationProcessor 'org.projectlombok:lombok:1.18.36'
    
    // Shared modules
    implementation project(':shared:common')
    implementation project(':shared:messaging')
    implementation project(':shared:database')
    
    // Testing
    testImplementation 'io.quarkus:quarkus-junit5'
}

group = 'com.accessplus.eventpro'
version = '1.0.0-SNAPSHOT'

java {
    sourceCompatibility = JavaVersion.VERSION_21
    targetCompatibility = JavaVersion.VERSION_21
}

configurations {
    compileOnly {
        extendsFrom annotationProcessor
    }
}

compileJava {
    options.encoding = 'UTF-8'
    options.compilerArgs << '-parameters'
    options.compilerArgs += [
        '-Ajackson.annotation.processing.disabled=true'
    ]
}

compileTestJava {
    options.encoding = 'UTF-8'
}

test {
    systemProperty "java.util.logging.manager", "org.jboss.logmanager.LogManager"
}
EOF
```

### Create gradle.properties for Payment Processor

```bash
cat > services/lambdas/payment-processor/gradle.properties << 'EOF'
quarkusPlatformGroupId=io.quarkus
quarkusPlatformArtifactId=quarkus-bom
quarkusPlatformVersion=3.26.2
EOF
```

### Create Payment Processor Handler (Quarkus)

```bash
cat > services/lambdas/payment-processor/src/main/java/com/accessplus/eventpro/payment/handler/PaymentProcessorHandler.java << 'EOF'
package com.accessplus.eventpro.payment.handler;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.SQSEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@ApplicationScoped
public class PaymentProcessorHandler implements RequestHandler<SQSEvent, Void> {
    
    @Inject
    ObjectMapper objectMapper;
    
    // Inject your services here
    // @Inject
    // StripeService stripeService;
    
    // @Inject
    // PaymentService paymentService;
    
    @Override
    public Void handleRequest(SQSEvent event, Context context) {
        log.info("Processing {} payment messages", event.getRecords().size());
        
        for (SQSEvent.SQSMessage message : event.getRecords()) {
            try {
                String body = message.getBody();
                log.info("Processing payment message: {}", body);
                
                // TODO: Implement payment processing logic
                // 1. Parse payment request using objectMapper
                // 2. Process Stripe payment
                // 3. Update order status
                // 4. Assign tickets
                // 5. Generate QR codes
                // 6. Publish to notification queue
                
            } catch (Exception e) {
                log.error("Error processing payment message", e);
                throw new RuntimeException("Failed to process payment", e);
            }
        }
        
        return null;
    }
}
EOF
```

### Create application.properties for Payment Processor

```bash
cat > services/lambdas/payment-processor/src/main/resources/application.properties << 'EOF'
# Quarkus Configuration
quarkus.application.name=payment-processor
quarkus.application.version=1.0.0

# Logging
quarkus.log.level=INFO
quarkus.log.console.format=%d{yyyy-MM-dd HH:mm:ss} %-5p [%c{2.}] (%t) %s%e%n

# Lambda Handler Configuration
quarkus.lambda.handler=paymentProcessor

# Database Configuration
quarkus.datasource.db-kind=postgresql
quarkus.datasource.username=${DB_USERNAME:eventpro}
quarkus.datasource.password=${DB_PASSWORD:eventpro}
quarkus.datasource.jdbc.url=${DB_URL:jdbc:postgresql://localhost:5432/eventpro}

# Hibernate
quarkus.hibernate-orm.database.generation=none
quarkus.hibernate-orm.log.sql=false

# AWS Configuration
aws.region=${AWS_REGION:us-east-1}
sqs.notification.queue.url=${NOTIFICATION_QUEUE_URL}

# Stripe Configuration
stripe.secret.key=${STRIPE_SECRET_KEY}
EOF
```

### 5.3 Notification Sender Lambda

```bash
mkdir -p services/lambdas/notification-sender/src/main/java/com/accessplus/eventpro/notification
mkdir -p services/lambdas/notification-sender/src/main/java/com/accessplus/eventpro/notification/handler
mkdir -p services/lambdas/notification-sender/src/main/java/com/accessplus/eventpro/notification/service
mkdir -p services/lambdas/notification-sender/src/main/java/com/accessplus/eventpro/notification/model
mkdir -p services/lambdas/notification-sender/src/main/java/com/accessplus/eventpro/notification/config
mkdir -p services/lambdas/notification-sender/src/main/resources
```

### Create Notification Sender build.gradle (Quarkus)

```bash
cat > services/lambdas/notification-sender/build.gradle << 'EOF'
plugins {
    id 'java'
    id 'io.quarkus' version '3.26.2'
}

repositories {
    mavenCentral()
    mavenLocal()
    gradlePluginPortal()
}

dependencies {
    // Quarkus Platform BOM
    implementation enforcedPlatform("${quarkusPlatformGroupId}:${quarkusPlatformArtifactId}:${quarkusPlatformVersion}")
    implementation enforcedPlatform("software.amazon.awssdk:bom:2.21.29")
    
    // Quarkus AWS Lambda
    implementation 'io.quarkus:quarkus-amazon-lambda-rest'
    implementation 'io.quarkus:quarkus-rest-jackson'
    implementation 'io.quarkus:quarkus-rest'
    implementation 'io.quarkus:quarkus-arc'
    implementation 'io.quarkus:quarkus-hibernate-validator'
    
    // AWS SDK
    implementation 'software.amazon.awssdk:sqs'
    implementation 'software.amazon.awssdk:ses'
    implementation 'software.amazon.awssdk:sns'
    
    // Logging
    implementation 'io.quarkus:quarkus-logging-json'
    
    // Health checks
    implementation 'io.quarkus:quarkus-smallrye-health'
    
    // Lombok
    compileOnly 'org.projectlombok:lombok:1.18.36'
    annotationProcessor 'org.projectlombok:lombok:1.18.36'
    
    // Shared modules
    implementation project(':shared:common')
    implementation project(':shared:messaging')
    
    // Testing
    testImplementation 'io.quarkus:quarkus-junit5'
}

group = 'com.accessplus.eventpro'
version = '1.0.0-SNAPSHOT'

java {
    sourceCompatibility = JavaVersion.VERSION_21
    targetCompatibility = JavaVersion.VERSION_21
}

configurations {
    compileOnly {
        extendsFrom annotationProcessor
    }
}

compileJava {
    options.encoding = 'UTF-8'
    options.compilerArgs << '-parameters'
    options.compilerArgs += [
        '-Ajackson.annotation.processing.disabled=true'
    ]
}

compileTestJava {
    options.encoding = 'UTF-8'
}

test {
    systemProperty "java.util.logging.manager", "org.jboss.logmanager.LogManager"
}
EOF
```

### Create gradle.properties for Notification Sender

```bash
cat > services/lambdas/notification-sender/gradle.properties << 'EOF'
quarkusPlatformGroupId=io.quarkus
quarkusPlatformArtifactId=quarkus-bom
quarkusPlatformVersion=3.26.2
EOF
```

### Create Notification Sender Handler (Quarkus)

```bash
cat > services/lambdas/notification-sender/src/main/java/com/accessplus/eventpro/notification/handler/NotificationSenderHandler.java << 'EOF'
package com.accessplus.eventpro.notification.handler;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.SQSEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@ApplicationScoped
public class NotificationSenderHandler implements RequestHandler<SQSEvent, Void> {
    
    @Inject
    ObjectMapper objectMapper;
    
    // Inject your services here
    // @Inject
    // EmailService emailService;
    
    // @Inject
    // SMSService smsService;
    
    @Override
    public Void handleRequest(SQSEvent event, Context context) {
        log.info("Processing {} notification messages", event.getRecords().size());
        
        for (SQSEvent.SQSMessage message : event.getRecords()) {
            try {
                String body = message.getBody();
                log.info("Processing notification message: {}", body);
                
                // TODO: Implement notification logic
                // 1. Parse notification request using objectMapper
                // 2. Get user preferences
                // 3. Send email (SES)
                // 4. Send SMS (SNS)
                // 5. Send WebSocket message
                
            } catch (Exception e) {
                log.error("Error processing notification message", e);
                throw new RuntimeException("Failed to send notification", e);
            }
        }
        
        return null;
    }
}
EOF
```

### Create application.properties for Notification Sender

```bash
cat > services/lambdas/notification-sender/src/main/resources/application.properties << 'EOF'
# Quarkus Configuration
quarkus.application.name=notification-sender
quarkus.application.version=1.0.0

# Logging
quarkus.log.level=INFO
quarkus.log.console.format=%d{yyyy-MM-dd HH:mm:ss} %-5p [%c{2.}] (%t) %s%e%n

# Lambda Handler Configuration
quarkus.lambda.handler=notificationSender

# AWS Configuration
aws.region=${AWS_REGION:us-east-1}
EOF
```

### 5.4 Analytics Service Lambda

```bash
mkdir -p services/lambdas/analytics-service/src/main/java/com/accessplus/eventpro/analytics
mkdir -p services/lambdas/analytics-service/src/main/java/com/accessplus/eventpro/analytics/handler
mkdir -p services/lambdas/analytics-service/src/main/java/com/accessplus/eventpro/analytics/service
mkdir -p services/lambdas/analytics-service/src/main/java/com/accessplus/eventpro/analytics/model
mkdir -p services/lambdas/analytics-service/src/main/java/com/accessplus/eventpro/analytics/config
mkdir -p services/lambdas/analytics-service/src/main/resources
```

### Create Analytics Service build.gradle (Quarkus)

```bash
cat > services/lambdas/analytics-service/build.gradle << 'EOF'
plugins {
    id 'java'
    id 'io.quarkus' version '3.26.2'
}

repositories {
    mavenCentral()
    mavenLocal()
    gradlePluginPortal()
}

dependencies {
    // Quarkus Platform BOM
    implementation enforcedPlatform("${quarkusPlatformGroupId}:${quarkusPlatformArtifactId}:${quarkusPlatformVersion}")
    implementation enforcedPlatform("software.amazon.awssdk:bom:2.21.29")
    
    // Quarkus AWS Lambda
    implementation 'io.quarkus:quarkus-amazon-lambda-rest'
    implementation 'io.quarkus:quarkus-rest-jackson'
    implementation 'io.quarkus:quarkus-rest'
    implementation 'io.quarkus:quarkus-arc'
    implementation 'io.quarkus:quarkus-hibernate-validator'
    
    // Database (Quarkus JPA)
    implementation 'io.quarkus:quarkus-hibernate-orm'
    implementation 'io.quarkus:quarkus-jdbc-postgresql'
    
    // AWS SDK
    implementation 'software.amazon.awssdk:secretsmanager'
    implementation 'software.amazon.awssdk:dynamodb'
    implementation 'software.amazon.awssdk:dynamodb-enhanced'
    
    // Logging
    implementation 'io.quarkus:quarkus-logging-json'
    
    // Health checks
    implementation 'io.quarkus:quarkus-smallrye-health'
    
    // Lombok
    compileOnly 'org.projectlombok:lombok:1.18.36'
    annotationProcessor 'org.projectlombok:lombok:1.18.36'
    
    // Shared modules
    implementation project(':shared:common')
    implementation project(':shared:database')
    
    // Testing
    testImplementation 'io.quarkus:quarkus-junit5'
}

group = 'com.accessplus.eventpro'
version = '1.0.0-SNAPSHOT'

java {
    sourceCompatibility = JavaVersion.VERSION_21
    targetCompatibility = JavaVersion.VERSION_21
}

configurations {
    compileOnly {
        extendsFrom annotationProcessor
    }
}

compileJava {
    options.encoding = 'UTF-8'
    options.compilerArgs << '-parameters'
    options.compilerArgs += [
        '-Ajackson.annotation.processing.disabled=true'
    ]
}

compileTestJava {
    options.encoding = 'UTF-8'
}

test {
    systemProperty "java.util.logging.manager", "org.jboss.logmanager.LogManager"
}
EOF
```

### Create gradle.properties for Analytics Service

```bash
cat > services/lambdas/analytics-service/gradle.properties << 'EOF'
quarkusPlatformGroupId=io.quarkus
quarkusPlatformArtifactId=quarkus-bom
quarkusPlatformVersion=3.26.2
EOF
```

### Create Analytics Service Handler (Quarkus)

```bash
cat > services/lambdas/analytics-service/src/main/java/com/accessplus/eventpro/analytics/handler/AnalyticsHandler.java << 'EOF'
package com.accessplus.eventpro.analytics.handler;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.ScheduledEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@ApplicationScoped
public class AnalyticsHandler implements RequestHandler<ScheduledEvent, Void> {
    
    // Inject your services here
    // @Inject
    // EventAnalyticsService eventAnalyticsService;
    
    // @Inject
    // SalesAnalyticsService salesAnalyticsService;
    
    @Override
    public Void handleRequest(ScheduledEvent event, Context context) {
        log.info("Processing analytics request");
        
        try {
            // TODO: Implement analytics logic
            // 1. Calculate event metrics
            // 2. Calculate sales analytics
            // 3. Calculate user engagement
            // 4. Store in DynamoDB or PostgreSQL
            
        } catch (Exception e) {
            log.error("Error processing analytics", e);
            throw new RuntimeException("Failed to process analytics", e);
        }
        
        return null;
    }
}
EOF
```

### Create application.properties for Analytics Service

```bash
cat > services/lambdas/analytics-service/src/main/resources/application.properties << 'EOF'
# Quarkus Configuration
quarkus.application.name=analytics-service
quarkus.application.version=1.0.0

# Logging
quarkus.log.level=INFO
quarkus.log.console.format=%d{yyyy-MM-dd HH:mm:ss} %-5p [%c{2.}] (%t) %s%e%n

# Lambda Handler Configuration
quarkus.lambda.handler=analytics

# Database Configuration
quarkus.datasource.db-kind=postgresql
quarkus.datasource.username=${DB_USERNAME:eventpro}
quarkus.datasource.password=${DB_PASSWORD:eventpro}
quarkus.datasource.jdbc.url=${DB_URL:jdbc:postgresql://localhost:5432/eventpro}

# Hibernate
quarkus.hibernate-orm.database.generation=none
quarkus.hibernate-orm.log.sql=false

# AWS Configuration
aws.region=${AWS_REGION:us-east-1}
dynamodb.table.name=${DYNAMODB_TABLE_NAME:analytics}
EOF
```

</details>

## Step 6
<details>
<summary>Build Lambda Packages</summary>

**Note**: Quarkus automatically generates `function.zip` in the `build/` directory when you run `./gradlew build`. No custom tasks needed!

```bash
# Build all Lambda functions
./gradlew :services:lambdas:order-processor:build
./gradlew :services:lambdas:payment-processor:build
./gradlew :services:lambdas:notification-sender:build
./gradlew :services:lambdas:analytics-service:build

# Lambda packages will be in:
# services/lambdas/order-processor/build/function.zip
# services/lambdas/payment-processor/build/function.zip
# services/lambdas/notification-sender/build/function.zip
# services/lambdas/analytics-service/build/function.zip
```

</details>

## Step 7
<details>
<summary>Build All Projects</summary>

```bash
# From root directory
cd eventpro-site

# Build all projects
./gradlew build

# Build all Lambda functions (Quarkus automatically generates function.zip)
./gradlew :services:lambdas:order-processor:build
./gradlew :services:lambdas:payment-processor:build
./gradlew :services:lambdas:notification-sender:build
./gradlew :services:lambdas:analytics-service:build

# Lambda packages are ready in build/function.zip for each service
```

</details>

## Step 8
<details>
<summary>Verify Structure</summary>

```bash
# Verify directory structure
tree -L 3 -I 'build|.gradle|target' eventpro-site

# Expected structure:
# eventpro-site/
# ├── build.gradle
# ├── settings.gradle
# ├── services/
# │   ├── core-api/
# │   ├── event-api/
# │   └── lambdas/
# │       ├── order-processor/
# │       ├── payment-processor/
# │       ├── notification-sender/
# │       └── analytics-service/
# ├── shared/
# │   ├── common/
# │   ├── messaging/
# │   └── database/
# └── infrastructure/
#     └── lambda-packages/
```

</details>

## Step 9
<details>
<summary>Test Local Development</summary>

### Test Core API

```bash
cd services/core-api

# Run locally
./gradlew bootRun

# Or with environment variables
DB_URL=jdbc:postgresql://localhost:5432/eventpro \
DB_USERNAME=eventpro \
DB_PASSWORD=eventpro \
./gradlew bootRun
```

### Test Lambda Locally

```bash
# Build Lambda package (Quarkus automatically generates function.zip)
cd services/lambdas/order-processor
./gradlew build
# Lambda package will be in: build/function.zip

# Test with SAM Local or AWS Lambda Runtime Interface Emulator
# (Note: You'll need to set up local testing environment)
```

</details>

## Step 10
<details>
<summary>Next Steps</summary>

1. **Implement Business Logic**: Add service classes, repositories, and controllers
2. **Create Entities**: Define JPA entities for your domain model
3. **Configure Security**: Set up Cognito integration
4. **Set Up Terraform**: Create Terraform modules for infrastructure
5. **Configure CI/CD**: Set up GitLab CI/CD pipeline

</details>

## Quick Reference Commands
<details>
<summary>Quick Reference Commands</summary>

```bash
# Build all projects
./gradlew build

# Build specific service
./gradlew :services:core-api:build

# Build Lambda package (Quarkus generates function.zip automatically)
./gradlew :services:lambdas:order-processor:build
# Package location: services/lambdas/order-processor/build/function.zip

# Run Core API
cd services/core-api && ./gradlew bootRun

# Clean build
./gradlew clean build

# Run tests
./gradlew test

# View dependencies
./gradlew dependencies
```

</details>

**Document Version**: 1.0  
**Created**: 2024  
**Maintained By**: Tech Lead

