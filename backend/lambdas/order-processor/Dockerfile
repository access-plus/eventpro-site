# Multi-stage Dockerfile for Spring Boot Order Processor Lambda
# Build context: backend/ directory

# Build stage
FROM gradle:9.2.1-jdk25-corretto AS build
WORKDIR /app

COPY lambdas/order-processor ./lambdas/order-processor
COPY shared ./shared

WORKDIR /app/lambdas/order-processor
RUN ./gradlew bootJar --no-daemon -x test

# Runtime stage - AWS Lambda Java 25 base image
FROM public.ecr.aws/lambda/java:25

COPY --from=build /app/lambdas/order-processor/build/libs/*.jar /var/task/

# Handler: FunctionInvoker::handleRequest
# Set Lambda env: spring_cloud_function_definition=processOrder
CMD ["org.springframework.cloud.function.adapter.aws.FunctionInvoker::handleRequest"]
