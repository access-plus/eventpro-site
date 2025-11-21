.PHONY: help clean build test verify all web-build web-dev web-preview api-run api-build api-test api-clean docker-build

# Variables
API_DIR := backend
WEB_DIR := frontend
ANALYTICS_DIR := services/lambdas/analytics-service
SECRET_ROTATION_DIR := secret-rotation

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
	@echo ""
	@echo "Docker Images:"
	@echo "  make docker-build   - Build EventPro API Docker image"
	@echo "  make docker-analytics - Build Analytics Service Docker image"
	@echo "  make docker-secret-rotation - Build Secret Rotation Lambda image"
	@echo ""
	@echo "Local Development:"
	@echo "  make local-setup    - Complete first-time setup (all steps)"
	@echo "  make local-infra-only - Step 1: Start PostgreSQL + LocalStack"
	@echo "  make local-infra    - Step 2: Provision resources + create .env"
	@echo "  make local-up       - Step 3: Start Backend + Frontend"
	@echo "  make local-down     - Stop all services"
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
	cd $(API_DIR) && docker build -t backend:latest .

docker-analytics:
	@echo "Building Analytics Service Docker image..."
	@if [ -d "$(ANALYTICS_DIR)" ]; then \
		cd $(ANALYTICS_DIR) && docker build -f Dockerfile -t analytics-service:latest .; \
	else \
		echo "Analytics Service directory not found: $(ANALYTICS_DIR)"; \
	fi

docker-secret-rotation:
	@echo "Building Secret Rotation Lambda Docker image..."
	cd $(SECRET_ROTATION_DIR) && docker build -f Dockerfile -t secret-rotation:latest .

# ============================================================================
# Local Development (Docker Compose + LocalStack)
# ============================================================================

# Complete setup (first time) - runs all steps in order
local-setup: local-infra-only local-infra local-up
	@echo ""
	@echo "🎉 Complete setup finished!"
	@echo "   Frontend: http://localhost:5173"
	@echo "   Backend:  http://localhost:8080"

# Step 1: Start infrastructure (PostgreSQL + LocalStack)
local-infra-only:
	@echo "Step 1: Starting infrastructure services (PostgreSQL + LocalStack)..."
	@docker-compose up -d postgres localstack || \
		(echo ""; \
		 echo "⚠️  Container conflict! Run: make local-reset"; \
		 exit 1)
	@echo "⏳ Waiting for services to be healthy..."
	@sleep 10
	@echo "✓ Infrastructure ready"

# Step 2: Provision AWS resources (Terraform) and create .env files
local-infra:
	@echo "Step 2: Provisioning AWS resources (Cognito, S3, SQS)..."
	@if ! docker ps | grep -q "localstack"; then \
		echo "⚠️  LocalStack not running. Starting it..."; \
		$(MAKE) local-infra-only; \
	fi
	@cd infrastructure/environments/local && \
		terraform init && \
		terraform apply -auto-approve
	@echo "Step 3: Creating environment files..."
	@cd infrastructure/environments/local && \
		COGNITO_USER_POOL_ID=$$(terraform output -raw cognito_user_pool_id) && \
		COGNITO_CLIENT_ID=$$(terraform output -raw cognito_user_pool_client_id) && \
		S3_BUCKET_NAME=$$(terraform output -raw s3_images_bucket_name) && \
		cd ../../.. && \
		echo "COGNITO_USER_POOL_ID=$$COGNITO_USER_POOL_ID" > .env && \
		echo "COGNITO_CLIENT_ID=$$COGNITO_CLIENT_ID" >> .env && \
		echo "S3_BUCKET_NAME=$$S3_BUCKET_NAME" >> .env && \
		echo "VITE_API_BASE_URL=http://localhost:8080" > frontend/.env.local && \
		echo "VITE_COGNITO_USER_POOL_ID=$$COGNITO_USER_POOL_ID" >> frontend/.env.local && \
		echo "VITE_COGNITO_CLIENT_ID=$$COGNITO_CLIENT_ID" >> frontend/.env.local && \
		echo "VITE_AWS_REGION=us-east-1" >> frontend/.env.local && \
		echo "VITE_S3_BUCKET_NAME=$$S3_BUCKET_NAME" >> frontend/.env.local
	@echo "✓ Environment files created"

# Step 3: Start all services (Backend + Frontend)
# Note: Flyway migrations run automatically when backend starts
local-up:
	@echo "Step 4: Starting application services..."
	@if [ ! -f .env ]; then \
		echo "⚠️  .env file not found. Run 'make local-infra' first."; \
		exit 1; \
	fi
	@if ! docker ps | grep -q "postgres"; then $(MAKE) local-infra-only; fi
	@docker-compose --env-file .env up -d backend frontend-dev
	@echo "⏳ Waiting for services to start (migrations run automatically)..."
	@sleep 15
	@echo ""
	@echo "✅ All services started!"
	@echo "   Frontend: http://localhost:5173"
	@echo "   Backend:  http://localhost:8080"

# Stop all services
local-down:
	@docker-compose down
	@echo "✓ Services stopped"

# Reset containers (fixes conflicts)
local-reset:
	@docker-compose down 2>/dev/null || true
	@docker rm -f postgres localstack backend frontend-dev 2>/dev/null || true
	@echo "✓ Containers reset"

# View logs
local-logs:
	@docker-compose logs -f

local-logs-backend:
	@docker-compose logs -f backend

local-logs-frontend:
	@docker-compose logs -f frontend-dev

# Clean everything (containers + Terraform resources)
local-clean:
	@cd infrastructure/environments/local && terraform destroy -auto-approve || true
	@docker-compose down -v
	@rm -f .env frontend/.env.local
	@echo "✓ Everything cleaned up"

# ============================================================================
# Development Helpers
# ============================================================================

# Run API and Web together (requires separate terminals or background processes)
dev-all:
	@echo "Starting all development servers..."
	@echo "API: cd $(API_DIR) && ./gradlew :eventpro-api:bootRun"
	@echo "Frontend: cd $(WEB_DIR) && npm run dev"
	@echo "Run these commands in separate terminals"

# Check if all required directories exist
check-structure:
	@echo "Checking project structure..."
	@test -d "$(API_DIR)" || (echo "ERROR: $(API_DIR) not found" && exit 1)
	@test -d "$(WEB_DIR)" || (echo "ERROR: $(WEB_DIR) not found" && exit 1)
	@echo "✓ API directory: $(API_DIR)"
	@echo "✓ Frontend directory: $(WEB_DIR)"
	@if [ -d "$(ANALYTICS_DIR)" ]; then \
		echo "✓ Analytics Service directory: $(ANALYTICS_DIR)"; \
	else \
		echo "Analytics Service directory not found: $(ANALYTICS_DIR)"; \
	fi
	@echo "Structure check complete!"
