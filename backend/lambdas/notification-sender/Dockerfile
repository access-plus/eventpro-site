# Multi-stage Dockerfile for Quarkus Notification Sender Lambda (JVM)
# This builds a container image for AWS Lambda
# Build context: backend/ directory

# Build stage
FROM gradle:9.2.1-jdk21-corretto AS build
WORKDIR /app

# Copy entire lambda directory structure
COPY lambdas/notification-sender ./lambdas/notification-sender

# Copy shared module (for composite build)
COPY shared ./shared

# Build the Quarkus application
WORKDIR /app/lambdas/notification-sender
RUN ./gradlew build --no-daemon -x test

# Runtime stage - Use AWS Lambda Java base image
FROM public.ecr.aws/lambda/java:21

# Copy the Quarkus runner JAR and dependencies
COPY --from=build /app/lambdas/notification-sender/build/quarkus-app/lib/ /var/task/lib/
COPY --from=build /app/lambdas/notification-sender/build/*-runner.jar /var/task/lib/quarkus-lambda.jar

# Set the handler
CMD ["io.quarkus.amazon.lambda.runtime.QuarkusStreamHandler::handleRequest"]

