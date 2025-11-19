# Multi-stage build for Payment Processor Lambda
# Build context should be from services/ directory
FROM gradle:8.5-jdk21 AS build
WORKDIR /app

# Copy root build files
COPY build.gradle settings.gradle ./

# Copy shared modules
COPY shared ./shared

# Copy payment-processor source and build files
COPY lambdas/payment-processor/build.gradle ./lambdas/payment-processor/
COPY lambdas/payment-processor/src ./lambdas/payment-processor/src
COPY lambdas/payment-processor/gradle.properties ./lambdas/payment-processor/

# Build the Lambda function
# Quarkus Lambda extension generates function.zip for Lambda deployment
# Alternative: can also use runner JAR + libs from build/quarkus-app/
RUN gradle :lambdas:payment-processor:build -x test

# Runtime stage - AWS Lambda base image
FROM public.ecr.aws/lambda/java:21

# Option 1: Use function.zip (Lambda-specific, recommended by Quarkus for Lambda)
# Quarkus Lambda extension generates function.zip in build/ directory
COPY --from=build /app/lambdas/payment-processor/build/function.zip ${LAMBDA_TASK_ROOT}/

# Unzip the function.zip to extract all necessary files
RUN yum install -y unzip && \
    unzip -q ${LAMBDA_TASK_ROOT}/function.zip -d ${LAMBDA_TASK_ROOT} && \
    rm ${LAMBDA_TASK_ROOT}/function.zip && \
    yum remove -y unzip && \
    yum clean all

# Alternative Option 2 (if function.zip is not generated):
# Copy runner JAR and libs from quarkus-app directory
# COPY --from=build /app/lambdas/payment-processor/build/quarkus-app/quarkus-run.jar ${LAMBDA_TASK_ROOT}/lib/
# COPY --from=build /app/lambdas/payment-processor/build/quarkus-app/lib/ ${LAMBDA_TASK_ROOT}/lib/

# Set the handler (Quarkus Lambda handler)
CMD [ "io.quarkus.amazon.lambda.runtime.QuarkusStreamHandler::handleRequest" ]

