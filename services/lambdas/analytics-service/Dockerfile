# Multi-stage build for Analytics Service Lambda
# Build context should be from services/ directory
FROM gradle:8.5-jdk21 AS build
WORKDIR /app

# Copy root build files
COPY build.gradle settings.gradle ./

# Copy shared modules
COPY shared ./shared

# Copy analytics-service source and build files
COPY lambdas/analytics-service/build.gradle ./lambdas/analytics-service/
COPY lambdas/analytics-service/src ./lambdas/analytics-service/src
COPY lambdas/analytics-service/gradle.properties ./lambdas/analytics-service/

# Build the Lambda function
# Quarkus Lambda extension generates function.zip in build/ directory
RUN gradle :lambdas:analytics-service:build -x test

# Runtime stage - AWS Lambda base image
FROM public.ecr.aws/lambda/java:21

# Copy the function.zip from build stage
COPY --from=build /app/lambdas/analytics-service/build/function.zip ${LAMBDA_TASK_ROOT}/

# Unzip the function
RUN yum install -y unzip && \
    unzip ${LAMBDA_TASK_ROOT}/function.zip -d ${LAMBDA_TASK_ROOT} && \
    rm ${LAMBDA_TASK_ROOT}/function.zip && \
    yum remove -y unzip && \
    yum clean all

# Set the handler (Quarkus Lambda handler)
CMD [ "io.quarkus.amazon.lambda.runtime.QuarkusStreamHandler::handleRequest" ]

