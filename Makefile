.PHONY: help clean build test verify all web-build web-dev web-preview

# Variables
SERVICES_DIR := services
GRADLEW := $(SERVICES_DIR)/gradlew
WEB_DIR := web

# Default target
.DEFAULT_GOAL := help

# Help target
help:
	@echo "EventPro Site - Makefile Commands"
	@echo ""
	@echo "All Services:"
	@echo "  make clean          - Clean all projects"
	@echo "  make build          - Build all projects"
	@echo "  make test           - Test all projects"
	@echo "  make verify         - Clean, build, and test all projects"
	@echo ""
	@echo "Core API (Spring Boot):"
	@echo "  make core-api-clean - Clean Core API"
	@echo "  make core-api-build - Build Core API"
	@echo "  make core-api-test  - Test Core API"
	@echo "  make core-api       - Clean, build, and test Core API"
	@echo ""
	@echo "Event API (Spring Boot):"
	@echo "  make event-api-clean - Clean Event API"
	@echo "  make event-api-build - Build Event API"
	@echo "  make event-api-test  - Test Event API"
	@echo "  make event-api       - Clean, build, and test Event API"
	@echo ""
	@echo "Order Processor Lambda (Quarkus):"
	@echo "  make order-processor-clean - Clean Order Processor"
	@echo "  make order-processor-build - Build Order Processor"
	@echo "  make order-processor-test  - Test Order Processor"
	@echo "  make order-processor       - Clean, build, and test Order Processor"
	@echo ""
	@echo "Payment Processor Lambda (Quarkus):"
	@echo "  make payment-processor-clean - Clean Payment Processor"
	@echo "  make payment-processor-build - Build Payment Processor"
	@echo "  make payment-processor-test  - Test Payment Processor"
	@echo "  make payment-processor       - Clean, build, and test Payment Processor"
	@echo ""
	@echo "Notification Sender Lambda (Quarkus):"
	@echo "  make notification-sender-clean - Clean Notification Sender"
	@echo "  make notification-sender-build - Build Notification Sender"
	@echo "  make notification-sender-test  - Test Notification Sender"
	@echo "  make notification-sender       - Clean, build, and test Notification Sender"
	@echo ""
	@echo "Analytics Service Lambda (Quarkus):"
	@echo "  make analytics-service-clean - Clean Analytics Service"
	@echo "  make analytics-service-build - Build Analytics Service"
	@echo "  make analytics-service-test  - Test Analytics Service"
	@echo "  make analytics-service       - Clean, build, and test Analytics Service"
	@echo ""
	@echo "Web Frontend (React + Vite):"
	@echo "  make web-build              - Build Web Frontend"
	@echo "  make web-dev                - Start Web development server"
	@echo "  make web-preview            - Preview production build"
	@echo ""
	@echo "Quick Verification:"
	@echo "  make verify-apis    - Verify all APIs build successfully"
	@echo "  make verify-lambdas - Verify all Lambdas build successfully"
	@echo "  make test-no-cache  - Run all tests without build cache"
	@echo "  make rebuild        - Clean and rebuild everything"

# All Services - Clean, Build, Test
clean:
	@echo "Cleaning all projects..."
	cd $(SERVICES_DIR) && ./gradlew clean

build:
	@echo "Building all projects..."
	cd $(SERVICES_DIR) && ./gradlew build

test:
	@echo "Testing all projects..."
	cd $(SERVICES_DIR) && ./gradlew test

verify: clean build test
	@echo "Verification complete!"

# Core API
core-api-clean:
	@echo "Cleaning Core API..."
	cd $(SERVICES_DIR) && ./gradlew :core-api:clean

core-api-build:
	@echo "Building Core API..."
	cd $(SERVICES_DIR) && ./gradlew :core-api:build

core-api-test:
	@echo "Testing Core API..."
	cd $(SERVICES_DIR) && ./gradlew :core-api:test

core-api: core-api-clean core-api-build core-api-test
	@echo "Core API verification complete!"

# Event API
event-api-clean:
	@echo "Cleaning Event API..."
	cd $(SERVICES_DIR) && ./gradlew :event-api:clean

event-api-build:
	@echo "Building Event API..."
	cd $(SERVICES_DIR) && ./gradlew :event-api:build

event-api-test:
	@echo "Testing Event API..."
	cd $(SERVICES_DIR) && ./gradlew :event-api:test

event-api: event-api-clean event-api-build event-api-test
	@echo "Event API verification complete!"

# Order Processor Lambda
order-processor-clean:
	@echo "Cleaning Order Processor..."
	cd $(SERVICES_DIR) && ./gradlew :lambdas:order-processor:clean

order-processor-build:
	@echo "Building Order Processor..."
	cd $(SERVICES_DIR) && ./gradlew :lambdas:order-processor:build

order-processor-test:
	@echo "Testing Order Processor..."
	cd $(SERVICES_DIR) && ./gradlew :lambdas:order-processor:test

order-processor: order-processor-clean order-processor-build order-processor-test
	@echo "Order Processor verification complete!"

# Payment Processor Lambda
payment-processor-clean:
	@echo "Cleaning Payment Processor..."
	cd $(SERVICES_DIR) && ./gradlew :lambdas:payment-processor:clean

payment-processor-build:
	@echo "Building Payment Processor..."
	cd $(SERVICES_DIR) && ./gradlew :lambdas:payment-processor:build

payment-processor-test:
	@echo "Testing Payment Processor..."
	cd $(SERVICES_DIR) && ./gradlew :lambdas:payment-processor:test

payment-processor: payment-processor-clean payment-processor-build payment-processor-test
	@echo "Payment Processor verification complete!"

# Notification Sender Lambda
notification-sender-clean:
	@echo "Cleaning Notification Sender..."
	cd $(SERVICES_DIR) && ./gradlew :lambdas:notification-sender:clean

notification-sender-build:
	@echo "Building Notification Sender..."
	cd $(SERVICES_DIR) && ./gradlew :lambdas:notification-sender:build

notification-sender-test:
	@echo "Testing Notification Sender..."
	cd $(SERVICES_DIR) && ./gradlew :lambdas:notification-sender:test

notification-sender: notification-sender-clean notification-sender-build notification-sender-test
	@echo "Notification Sender verification complete!"

# Analytics Service Lambda
analytics-service-clean:
	@echo "Cleaning Analytics Service..."
	cd $(SERVICES_DIR) && ./gradlew :lambdas:analytics-service:clean

analytics-service-build:
	@echo "Building Analytics Service..."
	cd $(SERVICES_DIR) && ./gradlew :lambdas:analytics-service:build

analytics-service-test:
	@echo "Testing Analytics Service..."
	cd $(SERVICES_DIR) && ./gradlew :lambdas:analytics-service:test

analytics-service: analytics-service-clean analytics-service-build analytics-service-test
	@echo "Analytics Service verification complete!"

# Quick Verification Commands
verify-apis:
	@echo "Verifying all APIs build successfully..."
	cd $(SERVICES_DIR) && ./gradlew :core-api:build :event-api:build

verify-lambdas:
	@echo "Verifying all Lambdas build successfully..."
	cd $(SERVICES_DIR) && ./gradlew :lambdas:order-processor:build :lambdas:payment-processor:build :lambdas:notification-sender:build :lambdas:analytics-service:build

test-no-cache:
	@echo "Running all tests without build cache..."
	cd $(SERVICES_DIR) && ./gradlew test --no-build-cache

rebuild: clean build
	@echo "Rebuild complete!"

# Web Frontend
web-build:
	@echo "Building Web Frontend..."
	cd $(WEB_DIR) && npm run build

web-dev:
	@echo "Starting Web development server..."
	cd $(WEB_DIR) && npm run dev

web-preview:
	@echo "Previewing Web production build..."
	cd $(WEB_DIR) && npm run preview

image-core-api:
	@echo "Building Core API Docker image..."
	cd $(SERVICES_DIR) && docker image build -f core-api/Dockerfile -t access-core-api:latest .

image-event-api:
	@echo "Building Event API Docker image..."
	cd $(SERVICES_DIR) && docker image build -f event-api/Dockerfile -t access-event-api:latest .

image-order-processor:
	@echo "Building Order Processor Docker image..."
	cd $(SERVICES_DIR) && docker image build -f lambdas/order-processor/Dockerfile -t access-order-processor:latest .

image-payment-processor:
	@echo "Building Payment Processor Docker image..."
	cd $(SERVICES_DIR) && docker image build -f lambdas/payment-processor/Dockerfile -t access-payment-processor:latest .

image-notification-sender:
	@echo "Building Notification Sender Docker image..."
	cd $(SERVICES_DIR) && docker image build -f lambdas/notification-sender/Dockerfile -t access-notification-sender:latest .

image-analytics-service:
	@echo "Building Analytics Service Docker image..."
	cd $(SERVICES_DIR) && docker image build -f lambdas/analytics-service/Dockerfile -t access-analytics-service:latest .

image-secret-rotation-lambda:
	@echo "Building Secret Rotation Lambda Docker image..."
	cd secret-rotation && docker image build -f Dockerfile -t access-secret-rotation:latest .