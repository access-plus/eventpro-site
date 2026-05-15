# Multi-stage Dockerfile for Spring Boot Payment Processor Lambda
# Build context: backend/

FROM gradle:9.2.1-jdk21-corretto AS build
WORKDIR /app

COPY lambdas/payment-processor ./lambdas/payment-processor

WORKDIR /app/lambdas/payment-processor
RUN ./gradlew bootJar --no-daemon -x test

FROM public.ecr.aws/newrelic-lambda-layers-for-docker/newrelic-lambda-layers-java:21 AS newrelic

FROM public.ecr.aws/lambda/java:21

COPY --from=build /app/lambdas/payment-processor/build/libs/*.jar /var/task/
COPY --from=newrelic /opt/ /opt/

# Handler: FunctionInvoker::handleRequest
# Set Lambda env: spring_cloud_function_definition=processPayment
CMD ["org.springframework.cloud.function.adapter.aws.FunctionInvoker::handleRequest"]
