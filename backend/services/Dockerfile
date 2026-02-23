# Multi-stage build for EventPro API (Modular Monolith)
# Build context: backend/ directory
FROM gradle:9.2.1-jdk25-corretto AS build
WORKDIR /app

# Copy entire services directory structure
COPY services ./services

# Build the application from services directory
WORKDIR /app/services
RUN ./gradlew :eventpro-api:bootJar --no-daemon -x test

# Runtime stage
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

# Copy the built JAR
COPY --from=build /app/services/modules/eventpro-api/build/libs/eventpro-api-*.jar app.jar

# Set Java options for container
ENV JAVA_TOOL_OPTIONS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]

