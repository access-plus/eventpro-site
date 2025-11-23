#!/bin/bash
# Run backend locally with required environment variables

cd backend

export SPRING_PROFILES_ACTIVE=local
export DB_URL=jdbc:postgresql://localhost:5432/eventpro
export DB_USERNAME=eventpro
export DB_PASSWORD=eventpro
export LOCAL_AUTH_ENABLED=true
export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test

./gradlew :eventpro-api:bootRun

