.PHONY: help clean build test verify all web-build web-dev web-preview api-run api-build api-test api-clean docker-build backend-build frontend-build

# Variables
API_DIR := backend/services
WEB_DIR := frontend
ANALYTICS_DIR := backend/lambdas/analytics-service
# SECRET_ROTATION_DIR := backend/lambdas/secret-rotation  # Removed - RDS manages credential rotation natively

# Default target
.DEFAULT_GOAL := help

# Help target
help:
	@echo "EventPro Site - Makefile Commands"
	@echo ""
	@echo "All Projects:"
	@echo "  make clean          - Clean all projects"
	@echo "  make build          - Build all projects"
	@echo "  make test           - Test all projects"
	@echo "  make verify         - Clean, build, and test all projects"
	@echo ""
	@echo "EventPro API (Modular Monolith):"
	@echo "  make api-clean      - Clean EventPro API"
	@echo "  make api-build      - Build EventPro API"
	@echo "  make api-test       - Test EventPro API"
	@echo "  make api-run        - Run EventPro API locally"
	@echo "  make api            - Clean, build, and test EventPro API"
	@echo "  make backend-build  - Build Backend (alias for api-build)"
	@echo ""
	@echo "Individual Modules:"
	@echo "  make core-build     - Build eventpro-core module"
	@echo "  make event-build    - Build eventpro-event module"
	@echo "  make order-build    - Build eventpro-order module"
	@echo "  make payment-build  - Build eventpro-payment module"
	@echo "  make notification-build - Build eventpro-notification module"
	@echo ""
	@echo "Analytics Service Lambda:"
	@echo "  make analytics-clean   - Clean Analytics Service"
	@echo "  make analytics-build   - Build Analytics Service"
	@echo "  make analytics-test    - Test Analytics Service"
	@echo "  make analytics        - Clean, build, and test Analytics Service"
	@echo ""
	@echo "Web Frontend (React + Vite):"
	@echo "  make web-build      - Build Frontend"
	@echo "  make web-dev        - Start Frontend development server"
	@echo "  make web-preview    - Preview Frontend production build"
	@echo "  make frontend-build - Build Frontend (alias for web-build)"
	@echo ""
	@echo "Docker Images:"
	@echo "  make docker-build   - Build EventPro API Docker image"
	@echo "  make docker-analytics - Build Analytics Service Docker image"
	@echo "  make lambda-build   - Build all Lambda Docker images"
	@echo "  make lambda-build-payment - Build payment-processor Lambda image"
	@echo "  make lambda-build-notification - Build notification-sender Lambda image"
	@echo ""
	@echo "Local Development:"
	@echo "  make local-setup    - Complete first-time setup (all steps)"
	@echo "  make local-infra-only - Step 1: Start PostgreSQL + LocalStack"
	@echo "  make local-infra    - Step 2: Provision resources + create .env"
	@echo "  make local-up       - Step 3: Start Backend + Frontend"
	@echo "  make local-down     - Stop all services"
	@echo "  make local-restart  - Restart Backend + Frontend"
	@echo "  make local-reset    - Reset containers (fixes conflicts)"
	@echo "  make local-clean    - Clean everything (containers + Terraform)"
	@echo "  make local-logs    - View all logs"
	@echo ""
	@echo "Quick Commands:"
	@echo "  make rebuild        - Clean and rebuild everything"
	@echo "  make test-no-cache  - Run all tests without build cache"

# ============================================================================
# All Projects
# ============================================================================

clean:
	@echo "Cleaning all projects..."
	cd $(API_DIR) && ./gradlew clean
	@if [ -d "$(ANALYTICS_DIR)" ]; then \
		cd $(ANALYTICS_DIR) && ./gradlew clean; \
	fi

build:
	@echo "Building all projects..."
	cd $(API_DIR) && ./gradlew build
	@if [ -d "$(ANALYTICS_DIR)" ]; then \
		cd $(ANALYTICS_DIR) && ./gradlew build; \
	fi

test:
	@echo "Testing all projects..."
	cd $(API_DIR) && ./gradlew test
	@if [ -d "$(ANALYTICS_DIR)" ]; then \
		cd $(ANALYTICS_DIR) && ./gradlew test; \
	fi

verify: clean build test
	@echo "Verification complete!"

rebuild: clean build
	@echo "Rebuild complete!"

test-no-cache:
	@echo "Running all tests without build cache..."
	cd $(API_DIR) && ./gradlew test --no-build-cache
	@if [ -d "$(ANALYTICS_DIR)" ]; then \
		cd $(ANALYTICS_DIR) && ./gradlew test --no-build-cache; \
	fi

# ============================================================================
# EventPro API (Modular Monolith)
# ============================================================================

api-clean:
	@echo "Cleaning EventPro API..."
	cd $(API_DIR) && ./gradlew clean

api-build:
	@echo "Building EventPro API..."
	cd $(API_DIR) && ./gradlew build

backend-build: api-build
	@echo "Backend build complete!"

api-test:
	@echo "Testing EventPro API..."
	cd $(API_DIR) && ./gradlew test

api-run:
	@echo "Running EventPro API locally..."
	cd $(API_DIR) && ./gradlew :eventpro-api:bootRun

api: api-clean api-build api-test
	@echo "EventPro API verification complete!"

# ============================================================================
# Individual Modules
# ============================================================================

core-build:
	@echo "Building eventpro-core module..."
	cd $(API_DIR) && ./gradlew :eventpro-core:build

event-build:
	@echo "Building eventpro-event module..."
	cd $(API_DIR) && ./gradlew :eventpro-event:build

order-build:
	@echo "Building eventpro-order module..."
	cd $(API_DIR) && ./gradlew :eventpro-order:build

payment-build:
	@echo "Building eventpro-payment module..."
	cd $(API_DIR) && ./gradlew :eventpro-payment:build

notification-build:
	@echo "Building eventpro-notification module..."
	cd $(API_DIR) && ./gradlew :eventpro-notification:build

# ============================================================================
# Analytics Service Lambda
# ============================================================================

analytics-clean:
	@echo "Cleaning Analytics Service..."
	@if [ -d "$(ANALYTICS_DIR)" ]; then \
		cd $(ANALYTICS_DIR) && ./gradlew clean; \
	else \
		echo "Analytics Service directory not found: $(ANALYTICS_DIR)"; \
	fi

analytics-build:
	@echo "Building Analytics Service..."
	@if [ -d "$(ANALYTICS_DIR)" ]; then \
		cd $(ANALYTICS_DIR) && ./gradlew build; \
	else \
		echo "Analytics Service directory not found: $(ANALYTICS_DIR)"; \
	fi

analytics-test:
	@echo "Testing Analytics Service..."
	@if [ -d "$(ANALYTICS_DIR)" ]; then \
		cd $(ANALYTICS_DIR) && ./gradlew test; \
	else \
		echo "Analytics Service directory not found: $(ANALYTICS_DIR)"; \
	fi

analytics: analytics-clean analytics-build analytics-test
	@echo "Analytics Service verification complete!"

# ============================================================================
# Web Frontend
# ============================================================================

web-build:
	@echo "Building Web Frontend..."
	cd $(WEB_DIR) && npm run build

frontend-build: web-build
	@echo "Frontend build complete!"

web-dev:
	@echo "Starting Web development server..."
	cd $(WEB_DIR) && npm run dev

web-preview:
	@echo "Previewing Web production build..."
	cd $(WEB_DIR) && npm run preview

web-install:
	@echo "Installing Web Frontend dependencies..."
	cd $(WEB_DIR) && npm install

# ============================================================================
# Docker Images
# ============================================================================

docker-build:
	@echo "Building EventPro API Docker image..."
	cd backend && docker build -f services/Dockerfile -t backend:latest .

docker-analytics:
	@echo "Building Analytics Service Docker image..."
	@if [ -d "$(ANALYTICS_DIR)" ]; then \
		cd $(ANALYTICS_DIR) && docker build -f Dockerfile -t analytics-service:latest .; \
	else \
		echo "Analytics Service directory not found: $(ANALYTICS_DIR)"; \
	fi

# docker-secret-rotation: Removed - RDS now manages credential rotation natively
# docker-secret-rotation:
# 	@echo "Building Secret Rotation Lambda Docker image..."
# 	cd $(SECRET_ROTATION_DIR) && docker build -f Dockerfile -t secret-rotation:latest .

# Lambda Docker Images
lambda-build:
	@echo "Building all Lambda Docker images..."
	@./scripts/build-lambda-images.sh all latest

lambda-build-payment:
	@echo "Building payment-processor Lambda Docker image..."
	@./scripts/build-lambda-images.sh payment-processor latest

lambda-build-notification:
	@echo "Building notification-sender Lambda Docker image..."
	@./scripts/build-lambda-images.sh notification-sender latest

lambda-build-order:
	@echo "Building order-processor Lambda Docker image..."
	@./scripts/build-lambda-images.sh order-processor latest

# ============================================================================
# Local Development (Docker Compose + LocalStack)
# ============================================================================

# Complete setup (first time) - runs all steps in order
local-setup: local-infra-only local-infra local-up
	@echo ""
	@echo "🎉 Complete setup finished!"
	@echo "   Frontend: http://localhost:5173"
	@echo "   Backend:  http://localhost:8080/actuator/health"

# Step 1: Start infrastructure (PostgreSQL + LocalStack)
local-infra-only:
	@echo "Step 1: Starting infrastructure services (PostgreSQL + LocalStack)..."
	@docker-compose up -d postgres localstack || \
		(echo ""; \
		 echo "Container conflict! Run: make local-reset"; \
		 exit 1)
	@echo "Waiting for services to be healthy..."
	@sleep 10
	@echo "Infrastructure ready"

# Step 2: Provision AWS resources (Terraform) and create .env files
local-infra:
	@echo "Step 2: Building Lambda images..."
	@$(MAKE) lambda-build || (echo "⚠️  Lambda build failed. Continuing anyway..."; true)
	@echo "Tagging Lambda images for LocalStack..."
	@docker tag eventpro-order-processor:latest eventpro-order-processor:local 2>/dev/null || true
	@docker tag eventpro-payment-processor:latest eventpro-payment-processor:local 2>/dev/null || true
	@docker tag eventpro-notification-sender:latest eventpro-notification-sender:local 2>/dev/null || true
	@echo "Step 3: Provisioning AWS resources..."
	@echo "  - LocalStack resources: S3, SQS, Secrets Manager, Lambda Functions"
	@if ! docker ps | grep -q "localstack"; then \
		echo "LocalStack not running. Starting it..."; \
		$(MAKE) local-infra-only; \
	fi
	@cd infrastructure/environments/local && \
		terraform init -upgrade && \
		terraform apply -auto-approve || \
		(echo ""; \
		 echo "⚠️  Terraform apply completed with errors."; \
		 echo "   Check Terraform output for details."; \
		 echo ""; \
		 true)
	@echo "Step 4: Creating environment files..."
	@cd infrastructure/environments/local && \
		S3_BUCKET_NAME=$$(terraform output -raw s3_images_bucket_name 2>/dev/null || echo "") && \
		ORDER_QUEUE_URL=$$(terraform output -raw sqs_order_queue_url 2>/dev/null || echo "") && \
		PAYMENT_QUEUE_URL=$$(terraform output -raw sqs_payment_queue_url 2>/dev/null || echo "") && \
		NOTIFICATION_QUEUE_URL=$$(terraform output -raw sqs_notification_queue_url 2>/dev/null || echo "") && \
		cd ../../.. && \
		echo "S3_BUCKET_NAME=$$S3_BUCKET_NAME" > .env && \
		echo "ORDER_QUEUE_URL=$$ORDER_QUEUE_URL" >> .env && \
		echo "PAYMENT_QUEUE_URL=$$PAYMENT_QUEUE_URL" >> .env && \
		echo "NOTIFICATION_QUEUE_URL=$$NOTIFICATION_QUEUE_URL" >> .env && \
		VITE_STRIPE_PUBLISHABLE_KEY=$$(grep '^VITE_STRIPE_PUBLISHABLE_KEY=' .env 2>/dev/null | cut -d'=' -f2- | tr -d ' ' || echo "") && \
		echo "VITE_API_BASE_URL=http://localhost:8080" > frontend/.env.local && \
		echo "VITE_AWS_REGION=us-east-1" >> frontend/.env.local && \
		echo "VITE_S3_BUCKET_NAME=$$S3_BUCKET_NAME" >> frontend/.env.local && \
		if [ -n "$$VITE_STRIPE_PUBLISHABLE_KEY" ]; then \
			echo "VITE_STRIPE_PUBLISHABLE_KEY=$$VITE_STRIPE_PUBLISHABLE_KEY" >> frontend/.env.local; \
		fi
	@echo "Environment files created"

# Step 3: Start all services (Backend + Frontend)
# Note: Lambda functions are managed by LocalStack via Terraform
# Note: Flyway migrations run automatically when backend starts
local-up:
	@echo "Step 5: Starting application services..."
	@if [ ! -f .env ]; then \
		echo ".env file not found. Run 'make local-infra' first."; \
		exit 1; \
	fi
	@if ! docker ps | grep -q "postgres"; then $(MAKE) local-infra-only; fi
	@docker-compose --env-file .env up -d backend frontend
	@echo "Waiting for services to start (migrations run automatically)..."
	@sleep 15
	@echo ""
	@echo "All services started!"
	@echo "   Frontend: http://localhost:5173"
	@echo "   Backend health:  http://localhost:8080/actuator/health"
	@echo "   Backend swagger:  http://localhost:8080/swagger-ui/index.html"
	@echo "   Lambda functions: Managed by LocalStack (automatically triggered by SQS)"
	@echo ""
	@echo "To verify Lambda functions:"
	@echo "   make local-lambda-status"

local-down:
	@echo "Stopping services..."
	@cd infrastructure/environments/local && terraform destroy -auto-approve || true
	cd ../../../
	@rm -f .env frontend/.env.local
	@docker-compose down backend frontend postgres -v

local-restart:
	@echo "Restarting application services..."
	@docker-compose restart backend frontend
	@echo "Services restarted!"

backend-logs:
	@docker-compose logs -f backend

frontend-logs:
	@docker-compose logs -f frontend

# Clean everything (containers + Terraform resources)
local-clean:
	@cd infrastructure/environments/local && terraform destroy -auto-approve || true
	@docker-compose down -v
	@rm -f .env frontend/.env.local
	@echo "Everything cleaned up"

start-pg-and-localstack:
	@echo "Starting PostgreSQL and LocalStack..."
	@docker-compose up -d postgres localstack

start-backend:
	@echo "Starting backend..."
	@docker-compose --env-file .env up -d backend
	@echo "   Backend API: http://localhost:8080"
	@echo "   Backend health:  http://localhost:8080/actuator/health"
	@echo "   Backend swagger:  http://localhost:8080/swagger-ui/index.html"

start-frontend:
	@echo "Starting frontend..."
	@docker-compose --env-file frontend/.env.local up -d frontend
	@echo "   Frontend UI: http://localhost:5173"

start-localstack:
	@echo "Starting LocalStack..."
	@docker-compose up -d localstack

start-postgres:
	@echo "Starting PostgreSQL..."
	@docker-compose up -d postgres

destroy-infrastructure:
	@echo "Destroying infrastructure..."
	cd infrastructure/environments/local && terraform destroy -auto-approve || true
	cd ../../../
	@rm -f .env frontend/.env.local
	@echo "Infrastructure destroyed"

# Lambda verification targets
local-lambda-status:
	@echo "Lambda Functions in LocalStack:"
	@aws --endpoint-url=http://localhost:4566 lambda list-functions --query 'Functions[*].[FunctionName,State,LastModified]' --output table 2>/dev/null || \
		(echo "⚠️  Could not list Lambda functions. Is LocalStack running?"; exit 1)

local-lambda-logs:
	@if [ -z "$(FUNCTION)" ]; then \
		echo "Usage: make local-lambda-logs FUNCTION=<function-name>"; \
		echo "Example: make local-lambda-logs FUNCTION=local-order-processor"; \
		exit 1; \
	fi
	@echo "Fetching logs for $(FUNCTION)..."
	@aws --endpoint-url=http://localhost:4566 logs tail "/aws/lambda/$(FUNCTION)" --follow 2>/dev/null || \
		(echo "⚠️  Could not fetch logs. Check function name and LocalStack status."; exit 1)

local-event-mappings:
	@echo "Event Source Mappings in LocalStack:"
	@aws --endpoint-url=http://localhost:4566 lambda list-event-source-mappings --query 'EventSourceMappings[*].[EventSourceArn,FunctionArn,State,LastModified]' --output table 2>/dev/null || \
		(echo "⚠️  Could not list event source mappings. Is LocalStack running?"; exit 1)
