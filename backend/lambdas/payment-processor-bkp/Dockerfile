# Multi-stage Dockerfile for Quarkus Payment Processor Lambda (JVM)
# This builds a container image for AWS Lambda
# Build context: backend/ directory

# Build stage
FROM gradle:9.2.1-jdk25-corretto AS build
WORKDIR /app

# Copy entire lambda directory structure
COPY lambdas/payment-processor ./lambdas/payment-processor

# Copy shared module (for composite build)
COPY shared ./shared

# Build the Quarkus application
WORKDIR /app/lambdas/payment-processor
RUN ./gradlew build --no-daemon -x test

# Runtime stage - Use AWS Lambda Java base image
FROM public.ecr.aws/lambda/java:25

# Copy the Quarkus runner JAR and dependencies
COPY --from=build /app/lambdas/payment-processor/build/quarkus-app/lib/ /var/task/lib/
COPY --from=build /app/lambdas/payment-processor/build/*-runner.jar /var/task/lib/quarkus-lambda.jar

# Set the handler
CMD ["io.quarkus.amazon.lambda.runtime.QuarkusStreamHandler::handleRequest"]

