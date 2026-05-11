# Multi-stage Dockerfile for Spring Boot Payment Processor Lambda
# Build context: backend/

FROM gradle:9.2.1-jdk25-corretto AS build
WORKDIR /app

COPY lambdas/payment-processor ./lambdas/payment-processor

WORKDIR /app/lambdas/payment-processor
RUN ./gradlew bootJar --no-daemon -x test

FROM curlimages/curl:8.8.0 AS newrelic
RUN curl -fsSL "https://download.newrelic.com/newrelic/java-agent/newrelic-agent/current/newrelic.jar" -o /tmp/newrelic.jar

FROM public.ecr.aws/lambda/java:25

COPY --from=build /app/lambdas/payment-processor/build/libs/*.jar /var/task/
COPY --from=newrelic /tmp/newrelic.jar /opt/newrelic/newrelic.jar

# Handler: FunctionInvoker::handleRequest
# Set Lambda env: spring_cloud_function_definition=processPayment
CMD ["org.springframework.cloud.function.adapter.aws.FunctionInvoker::handleRequest"]
