# Multi-stage build for Order Processor Lambda
# Build context should be from services/ directory
FROM gradle:8.5-jdk21 AS build
WORKDIR /app

# Copy root build files
COPY build.gradle settings.gradle ./

# Copy shared modules
COPY shared ./shared

# Copy order-processor source and build files
COPY lambdas/order-processor/build.gradle ./lambdas/order-processor/
COPY lambdas/order-processor/src ./lambdas/order-processor/src
COPY lambdas/order-processor/gradle.properties ./lambdas/order-processor/

# Build the Lambda function
# Quarkus Lambda extension generates function.zip in build/ directory
RUN gradle :lambdas:order-processor:build -x test

# Runtime stage - AWS Lambda base image
FROM public.ecr.aws/lambda/java:21

# Copy the function.zip from build stage
COPY --from=build /app/lambdas/order-processor/build/function.zip ${LAMBDA_TASK_ROOT}/

# Unzip the function
RUN yum install -y unzip && \
    unzip ${LAMBDA_TASK_ROOT}/function.zip -d ${LAMBDA_TASK_ROOT} && \
    rm ${LAMBDA_TASK_ROOT}/function.zip && \
    yum remove -y unzip && \
    yum clean all

# Set the handler (Quarkus Lambda handler)
CMD [ "io.quarkus.amazon.lambda.runtime.QuarkusStreamHandler::handleRequest" ]

