# Quarkus Lambda Docker Deployment Best Practices

## Research Summary

Based on research using Context7 and Quarkus official documentation, here are the best practices for deploying Quarkus applications as Docker container images to AWS Lambda.

## Key Findings

### 1. Quarkus Lambda Deployment Approaches

Quarkus supports two main approaches for AWS Lambda container images:

#### Approach 1: Function ZIP (Recommended for Lambda)
- Quarkus Lambda extension generates `function.zip` in the build directory
- Contains all necessary files: bootstrap, runner, libraries, certificates
- Requires unzipping in the Docker image
- **This is the approach currently used in the project**

#### Approach 2: Direct JAR + Libs (Alternative)
- Copy `quarkus-run.jar` from `build/quarkus-app/`
- Copy `lib/` directory from `build/quarkus-app/lib/`
- Simpler but requires standard Quarkus build output
- Works well for JVM-based Lambda deployments

### 2. Docker Base Images

For JVM-based Lambda deployments:
- **Base Image**: `public.ecr.aws/lambda/java:21` (Java 21)
- **Handler**: `io.quarkus.amazon.lambda.runtime.QuarkusStreamHandler::handleRequest`

For Native Lambda deployments:
- **Base Image**: `public.ecr.aws/lambda/provided`
- **Binary**: Copy native executable to `/var/runtime/bootstrap`
- Requires native build with GraalVM/Mandrel

### 3. Gradle Build Compatibility

**Issue Found**: Quarkus 3.26.2 has compatibility issues with Gradle 8.5 when using project dependencies.

**Solution Applied**:
- Updated Quarkus from 3.26.2 to 3.27.0
- Added `gradlePluginPortal()` to repositories
- Updated in:
  - `services/settings.gradle`
  - `services/lambdas/payment-processor/gradle.properties`
  - `services/build.gradle`

### 4. Multi-Stage Docker Build Best Practices

```dockerfile
# Stage 1: Build
FROM gradle:8.5-jdk21 AS build
WORKDIR /app

# Copy build configuration files first (for better caching)
COPY build.gradle settings.gradle ./
COPY shared ./shared
COPY lambdas/payment-processor/build.gradle ./lambdas/payment-processor/
COPY lambdas/payment-processor/src ./lambdas/payment-processor/src
COPY lambdas/payment-processor/gradle.properties ./lambdas/payment-processor/

# Build the Lambda function
RUN gradle :lambdas:payment-processor:build -x test

# Stage 2: Runtime
FROM public.ecr.aws/lambda/java:21

# Copy and extract function.zip
COPY --from=build /app/lambdas/payment-processor/build/function.zip ${LAMBDA_TASK_ROOT}/
RUN yum install -y unzip && \
    unzip -q ${LAMBDA_TASK_ROOT}/function.zip -d ${LAMBDA_TASK_ROOT} && \
    rm ${LAMBDA_TASK_ROOT}/function.zip && \
    yum remove -y unzip && \
    yum clean all

CMD [ "io.quarkus.amazon.lambda.runtime.QuarkusStreamHandler::handleRequest" ]
```

## Build Process

### Gradle Build Command
```bash
gradle :lambdas:payment-processor:build -x test
```

### Docker Build Command
```bash
cd services && docker image build -f lambdas/payment-processor/Dockerfile -t access-payment-processor:latest .
```

## Configuration Requirements

### application.properties
```properties
# Lambda Handler Configuration
quarkus.lambda.handler=paymentProcessor
```

### build.gradle
```gradle
plugins {
    id 'java'
    id 'io.quarkus'
}

dependencies {
    implementation enforcedPlatform("${quarkusPlatformGroupId}:${quarkusPlatformArtifactId}:${quarkusPlatformVersion}")
    implementation 'io.quarkus:quarkus-amazon-lambda'
    // ... other dependencies
}
```

## Troubleshooting

### Issue: Gradle Build Fails with ProjectDependency.getPath() Error

**Symptoms**:
```
A problem occurred configuring project ':lambdas:payment-processor'.
> Failed to notify project evaluation listener.
   > 'java.lang.String org.gradle.api.artifacts.ProjectDependency.getPath()'
```

**Solution**:
1. Update Quarkus to 3.27.0 or later
2. Ensure `gradlePluginPortal()` is in repositories
3. Verify Gradle version compatibility (8.5+)

### Issue: function.zip Not Found

**Possible Causes**:
1. Quarkus Lambda extension not properly configured
2. Build didn't complete successfully
3. Wrong build output directory

**Solution**:
- Verify `quarkus-amazon-lambda` dependency is present
- Check build logs for errors
- Verify build output directory structure

## Performance Considerations

1. **Layer Caching**: Copy build files before source code for better Docker layer caching
2. **Build Optimization**: Use `-x test` to skip tests during Docker builds
3. **Image Size**: Consider native builds for smaller images (but longer build times)
4. **Cold Start**: JVM images have faster builds but slower cold starts than native

## References

- [Quarkus AWS Lambda Guide](https://quarkus.io/guides/amazon-lambda)
- [Quarkus Container Image Guide](https://quarkus.io/guides/container-image)
- [AWS Lambda Container Images](https://docs.aws.amazon.com/lambda/latest/dg/images-create.html)

## Next Steps

1. ✅ Fixed Gradle compatibility issues (Quarkus 3.27.0)
2. ✅ Updated Dockerfile with best practices
3. ⏳ Test Docker build locally
4. ⏳ Deploy to AWS Lambda and verify functionality
5. ⏳ Consider native builds for production if cold start time is critical

