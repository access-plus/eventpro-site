# Multi-stage Dockerfile for Spring Boot Notification Sender Lambda
# Build context: backend/

FROM gradle:9.2.1-jdk25-corretto AS build
WORKDIR /app

COPY lambdas/notification-sender ./lambdas/notification-sender

WORKDIR /app/lambdas/notification-sender
RUN ./gradlew bootJar --no-daemon -x test

FROM public.ecr.aws/lambda/java:25

COPY --from=build /app/lambdas/notification-sender/build/libs/*.jar /var/task/

# Handler: FunctionInvoker::handleRequest
# Set Lambda env: spring_cloud_function_definition=sendNotification
CMD ["org.springframework.cloud.function.adapter.aws.FunctionInvoker::handleRequest"]
