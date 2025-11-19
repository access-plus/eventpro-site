.PHONY: help clean build test verify all web-build web-dev web-preview api-run api-build api-test api-clean docker-build

# Variables
API_DIR := eventpro-api
WEB_DIR := web
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
	@echo "  make web-build      - Build Web Frontend"
	@echo "  make web-dev        - Start Web development server"
	@echo "  make web-preview    - Preview production build"
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
	cd $(API_DIR) && docker build -t eventpro-api:latest .

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
# Development Helpers
# ============================================================================

# Run API and Web together (requires separate terminals or background processes)
dev-all:
	@echo "Starting all development servers..."
	@echo "API: cd $(API_DIR) && ./gradlew :eventpro-api:bootRun"
	@echo "Web: cd $(WEB_DIR) && npm run dev"
	@echo "Run these commands in separate terminals"

# Check if all required directories exist
check-structure:
	@echo "Checking project structure..."
	@test -d "$(API_DIR)" || (echo "ERROR: $(API_DIR) not found" && exit 1)
	@test -d "$(WEB_DIR)" || (echo "ERROR: $(WEB_DIR) not found" && exit 1)
	@echo "✓ API directory: $(API_DIR)"
	@echo "✓ Web directory: $(WEB_DIR)"
	@if [ -d "$(ANALYTICS_DIR)" ]; then \
		echo "✓ Analytics Service directory: $(ANALYTICS_DIR)"; \
	else \
		echo "⚠ Analytics Service directory not found: $(ANALYTICS_DIR)"; \
	fi
	@echo "Structure check complete!"
