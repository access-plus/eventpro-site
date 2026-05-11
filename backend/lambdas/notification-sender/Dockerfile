# Multi-stage Dockerfile for Spring Boot Notification Sender Lambda
# Build context: backend/

FROM gradle:9.2.1-jdk25-corretto AS build
WORKDIR /app

COPY lambdas/notification-sender ./lambdas/notification-sender

WORKDIR /app/lambdas/notification-sender
RUN ./gradlew bootJar --no-daemon -x test

FROM curlimages/curl:8.8.0 AS newrelic
RUN curl -fsSL "https://download.newrelic.com/newrelic/java-agent/newrelic-agent/current/newrelic.jar" -o /tmp/newrelic.jar

FROM public.ecr.aws/lambda/java:25

COPY --from=build /app/lambdas/notification-sender/build/libs/*.jar /var/task/
COPY --from=newrelic /tmp/newrelic.jar /opt/newrelic/newrelic.jar

# Handler: FunctionInvoker::handleRequest
# Set Lambda env: spring_cloud_function_definition=sendNotification
CMD ["org.springframework.cloud.function.adapter.aws.FunctionInvoker::handleRequest"]
