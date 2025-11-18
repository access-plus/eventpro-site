# Multi-stage build for Event API
# Build context should be from services/ directory
FROM gradle:8.5-jdk21 AS build
WORKDIR /app

# Copy root build files
COPY build.gradle settings.gradle ./

# Copy shared modules
COPY shared ./shared

# Copy event-api source and build files
COPY event-api/build.gradle ./event-api/
COPY event-api/src ./event-api/src

# Build the application (using project path from settings.gradle)
RUN gradle :event-api:build -x test

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy JAR from build stage
COPY --from=build /app/event-api/build/libs/*.jar app.jar

EXPOSE 8081

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]

