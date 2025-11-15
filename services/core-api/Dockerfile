# Multi-stage build
FROM gradle:8.5-jdk21 AS build
WORKDIR /app

# Copy build files
COPY build.gradle settings.gradle ./
COPY shared ../shared
COPY services/core-api ./services/core-api

# Build
RUN gradle :services:core-api:build -x test

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy JAR
COPY --from=build /app/services/core-api/build/libs/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
