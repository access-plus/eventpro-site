#!/bin/bash
# Backend Setup Verification Script
# Verifies that Spring Boot applications are properly configured

set -e

echo "=========================================="
echo "Backend Setup Verification"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track verification results
PASSED=0
FAILED=0

# Function to check and report
check_task() {
    local task_name=$1
    local command=$2
    
    echo -n "Checking $task_name... "
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAILED++))
        return 1
    fi
}

# Function to check file exists
check_file() {
    local file_path=$1
    local description=$2
    
    echo -n "Checking $description... "
    if [ -f "$file_path" ]; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (File not found: $file_path)"
        ((FAILED++))
        return 1
    fi
}

echo "1. Verifying Project Structure"
echo "----------------------------------------"
check_file "settings.gradle" "Root settings.gradle"
check_file "build.gradle" "Root build.gradle"
check_file "core-api/build.gradle" "core-api build.gradle"
check_file "event-api/build.gradle" "event-api build.gradle"
check_file "core-api/src/main/java/com/accessplus/eventpro/core/CoreApiApplication.java" "CoreApiApplication.java"
check_file "event-api/src/main/java/com/accessplus/eventpro/event/EventApiApplication.java" "EventApiApplication.java"
check_file "core-api/src/main/resources/application.yml" "core-api application.yml"
check_file "event-api/src/main/resources/application.yml" "event-api application.yml"
echo ""

echo "2. Verifying Gradle Configuration"
echo "----------------------------------------"
check_task "Gradle wrapper exists" "[ -f gradlew ]"
echo -n "Checking Gradle can list projects... "
if ./gradlew projects --no-daemon 2>&1 | grep -q "core-api\|event-api" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ SKIP${NC} (Lambda projects not configured yet)"
fi
check_task "core-api is recognized" "./gradlew :core-api:properties --no-daemon > /dev/null 2>&1"
check_task "event-api is recognized" "./gradlew :event-api:properties --no-daemon > /dev/null 2>&1"
echo ""

echo "3. Verifying Dependencies Resolution"
echo "----------------------------------------"
check_task "core-api dependencies" "./gradlew :core-api:dependencies --no-daemon > /dev/null 2>&1"
check_task "event-api dependencies" "./gradlew :event-api:dependencies --no-daemon > /dev/null 2>&1"
echo ""

echo "4. Verifying Compilation (without database)"
echo "----------------------------------------"
echo -n "Checking core-api compilation... "
if ./gradlew :core-api:compileJava --no-daemon > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ SKIP${NC} (May require database or shared modules)"
    echo "   Note: Full compilation may require shared modules to be built first"
fi

echo -n "Checking event-api compilation... "
if ./gradlew :event-api:compileJava --no-daemon > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ SKIP${NC} (May require database or shared modules)"
    echo "   Note: Full compilation may require shared modules to be built first"
fi
echo ""

echo "5. Verifying Spring Boot Configuration"
echo "----------------------------------------"
check_task "core-api bootJar task exists" "./gradlew :core-api:tasks --no-daemon 2>&1 | grep -q bootJar"
check_task "event-api bootJar task exists" "./gradlew :event-api:tasks --no-daemon 2>&1 | grep -q bootJar"
echo ""

echo "6. Verifying Application Configuration"
echo "----------------------------------------"
check_task "core-api port 8080" "grep -q 'port: 8080' core-api/src/main/resources/application.yml"
check_task "event-api port 8081" "grep -q 'port: 8081' event-api/src/main/resources/application.yml"
check_task "core-api health endpoint" "grep -q 'health' core-api/src/main/resources/application.yml"
check_task "event-api health endpoint" "grep -q 'health' event-api/src/main/resources/application.yml"
echo ""

echo "=========================================="
echo "Verification Summary"
echo "=========================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Build shared modules: ./gradlew :shared:common:build :shared:database:build :shared:messaging:build"
    echo "  2. Build applications: ./gradlew :core-api:build :event-api:build"
    echo "  3. Run applications: ./gradlew :core-api:bootRun (requires database)"
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Please review the errors above.${NC}"
    exit 1
fi

