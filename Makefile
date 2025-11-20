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

# Start local development environment (all services)
local-up:
	@echo "Starting local development environment..."
	@if [ ! -f .env ]; then \
		echo ".env file not found. Creating from Terraform outputs..."; \
		cd infrastructure/environments/local && \
		terraform output -json > /dev/null 2>&1 || (echo "Terraform not initialized. Run 'make local-infra' first" && exit 1); \
		export COGNITO_USER_POOL_ID=$$(terraform output -raw cognito_user_pool_id 2>/dev/null || echo ""); \
		export COGNITO_CLIENT_ID=$$(terraform output -raw cognito_user_pool_client_id 2>/dev/null || echo ""); \
		cd ../../..; \
		if [ -z "$$COGNITO_USER_POOL_ID" ] || [ -z "$$COGNITO_CLIENT_ID" ]; then \
			echo "Cognito values not found. Run 'make local-infra' first to provision resources."; \
			exit 1; \
		fi; \
		echo "COGNITO_USER_POOL_ID=$$COGNITO_USER_POOL_ID" > .env; \
		echo "COGNITO_CLIENT_ID=$$COGNITO_CLIENT_ID" >> .env; \
		echo "✓ Created .env file with Cognito values"; \
	fi
	@echo "Starting services..."
	@docker-compose --env-file .env up -d
	@echo "Waiting for services to be healthy..."
	@sleep 10
	@echo "✓ PostgreSQL: http://localhost:5432"
	@echo "✓ LocalStack: http://localhost:4566"
	@echo "✓ Backend API: http://localhost:8080"
	@echo "✓ Frontend: http://localhost:5173"
	@echo ""
	@echo "View logs: docker-compose logs -f"
	@echo "Update .env file if Cognito values change, then restart: docker-compose restart frontend-dev"

# Start only infrastructure (PostgreSQL + LocalStack)
local-infra-only:
	@echo "Starting infrastructure services only..."
	@docker-compose up -d postgres localstack
	@echo "Waiting for services to be healthy..."
	@sleep 5
	@echo "✓ PostgreSQL: http://localhost:5432"
	@echo "✓ LocalStack: http://localhost:4566"
	@echo "Run 'make local-infra' to provision AWS resources"

# Stop local development environment
local-down:
	@echo "Stopping local development environment..."
	@docker-compose down
	@echo "✓ Services stopped"

# View logs from all services
local-logs:
	@docker-compose logs -f

# View logs from specific service
local-logs-api:
	@docker-compose logs -f backend

local-logs-frontend:
	@docker-compose logs -f frontend-dev

# Provision LocalStack resources via Terraform
local-infra:
	@echo "Provisioning LocalStack resources..."
	@cd infrastructure/environments/local && \
		terraform init && \
		terraform apply -auto-approve
	@echo "✓ LocalStack resources provisioned"
	@echo ""
	@echo "Creating/updating .env file with Cognito values..."
	@cd infrastructure/environments/local && \
		COGNITO_USER_POOL_ID=$$(terraform output -raw cognito_user_pool_id) && \
		COGNITO_CLIENT_ID=$$(terraform output -raw cognito_user_pool_client_id) && \
		S3_BUCKET_NAME=$$(terraform output -raw s3_images_bucket_name) && \
		cd ../../.. && \
		echo "# EventPro Platform - Environment Variables" > .env && \
		echo "# Auto-generated by 'make local-infra' - DO NOT EDIT MANUALLY" >> .env && \
		echo "# Regenerate by running: make local-infra" >> .env && \
		echo "" >> .env && \
		echo "COGNITO_USER_POOL_ID=$$COGNITO_USER_POOL_ID" >> .env && \
		echo "COGNITO_CLIENT_ID=$$COGNITO_CLIENT_ID" >> .env && \
		echo "S3_BUCKET_NAME=$$S3_BUCKET_NAME" >> .env && \
		echo "✓ Created/updated .env file"
	@echo ""
	@echo "Creating frontend/.env.local for frontend (when running directly)..."
	@cd infrastructure/environments/local && \
		COGNITO_USER_POOL_ID=$$(terraform output -raw cognito_user_pool_id) && \
		COGNITO_CLIENT_ID=$$(terraform output -raw cognito_user_pool_client_id) && \
		S3_BUCKET_NAME=$$(terraform output -raw s3_images_bucket_name) && \
		cd ../../.. && \
		echo "# EventPro Frontend - Local Development Environment Variables" > frontend/.env.local && \
		echo "# Auto-generated by 'make local-infra' - DO NOT EDIT MANUALLY" >> frontend/.env.local && \
		echo "# Regenerate by running: make local-infra" >> frontend/.env.local && \
		echo "" >> frontend/.env.local && \
		echo "VITE_API_BASE_URL=http://localhost:8080" >> frontend/.env.local && \
		echo "VITE_COGNITO_USER_POOL_ID=$$COGNITO_USER_POOL_ID" >> frontend/.env.local && \
		echo "VITE_COGNITO_CLIENT_ID=$$COGNITO_CLIENT_ID" >> frontend/.env.local && \
		echo "VITE_AWS_REGION=us-east-1" >> frontend/.env.local && \
		echo "VITE_S3_BUCKET_NAME=$$S3_BUCKET_NAME" >> frontend/.env.local && \
		echo "✓ Created/updated frontend/.env.local file"
	@echo ""
	@echo "Summary:"
	@echo "  ✓ .env file created (for docker-compose)"
	@echo "  ✓ frontend/.env.local file created (for direct frontend execution)"
	@echo ""
	@echo "You can now run: make local-up"

# Clean up local resources (Terraform destroy + Docker volumes)
local-clean:
	@echo "Cleaning up local resources..."
	@cd infrastructure/environments/local && terraform destroy -auto-approve || true
	@docker-compose down -v
	@echo "✓ Local resources cleaned up"

# Show LocalStack resource outputs
local-outputs:
	@echo "LocalStack Resource Outputs:"
	@cd infrastructure/environments/local && terraform output

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
