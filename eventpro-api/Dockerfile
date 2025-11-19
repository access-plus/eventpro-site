# Multi-stage build for EventPro API (Modular Monolith)
FROM gradle:8.5-jdk21 AS build
WORKDIR /app

# Copy Gradle wrapper and build files
COPY gradlew .
COPY gradle ./gradle
COPY build.gradle settings.gradle ./

# Make gradlew executable
RUN chmod +x gradlew

# Copy all modules
COPY modules ./modules

# Build the application
RUN ./gradlew :eventpro-api:bootJar --no-daemon -x test

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy the built JAR
COPY --from=build /app/modules/eventpro-api/build/libs/eventpro-api-*.jar app.jar

# Set Java options for container
ENV JAVA_TOOL_OPTIONS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]

