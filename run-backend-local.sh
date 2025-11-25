#!/bin/bash
# Run backend locally with required environment variables

# Validate required Cognito environment variables
if [ -z "$COGNITO_USER_POOL_ID" ]; then
    echo "ERROR: COGNITO_USER_POOL_ID environment variable is required"
    echo "Please set COGNITO_USER_POOL_ID before running this script"
    echo "Example: export COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX"
    exit 1
fi

if [ -z "$COGNITO_CLIENT_ID" ]; then
    echo "ERROR: COGNITO_CLIENT_ID environment variable is required"
    echo "Please set COGNITO_CLIENT_ID before running this script"
    echo "Example: export COGNITO_CLIENT_ID=your-client-id"
    exit 1
fi

cd backend/services

export SPRING_PROFILES_ACTIVE=local
export DB_URL=jdbc:postgresql://localhost:5432/eventpro
export DB_USERNAME=eventpro
export DB_PASSWORD=eventpro
export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test

./gradlew :eventpro-api:bootRun

