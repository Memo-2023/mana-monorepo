#!/bin/bash
# Run Tests with Coverage
#
# Executes tests for specific packages or all packages with coverage reporting.
# Automatically sets up test databases and cleans up after execution.
#
# Usage:
#   ./scripts/run-tests-with-coverage.sh [package-filter]
#
# Examples:
#   ./scripts/run-tests-with-coverage.sh                    # Run all tests
#   ./scripts/run-tests-with-coverage.sh mana-auth     # Run auth tests only
#   ./scripts/run-tests-with-coverage.sh chat-backend       # Run chat backend tests only

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
COVERAGE_THRESHOLD=${COVERAGE_THRESHOLD:-80}
PACKAGE_FILTER=${1:-""}

echo -e "${GREEN}Running tests with coverage${NC}"
echo "Coverage threshold: ${COVERAGE_THRESHOLD}%"

# Check if Docker is running (for database tests)
if ! docker ps > /dev/null 2>&1; then
  echo -e "${YELLOW}Warning: Docker is not running. Database tests may fail.${NC}"
  echo "Start Docker and run: pnpm docker:up"
fi

# Function to run tests for a package
run_package_tests() {
  local package_name=$1
  local package_path=$2

  echo -e "\n${GREEN}Testing ${package_name}...${NC}"

  cd "$package_path"

  # Check if package has tests
  if ! grep -q "\"test\"" package.json 2>/dev/null; then
    echo -e "${YELLOW}No test script found in ${package_name}, skipping${NC}"
    cd - > /dev/null
    return 0
  fi

  # Setup test database if needed
  if grep -q "DATABASE_URL" .env* 2>/dev/null || grep -q "db:push" package.json 2>/dev/null; then
    echo "Setting up test database..."

    # Extract database name from package
    DB_NAME=$(echo "$package_name" | sed 's/-backend$//' | sed 's/mana-core-//')

    export DATABASE_URL="postgresql://mana:devpassword@localhost:5432/${DB_NAME}"
    export NODE_ENV="test"

    # Run migrations if available
    if grep -q "db:push" package.json; then
      pnpm run db:push 2>/dev/null || echo "No migrations to run"
    fi
  fi

  # Run tests with coverage
  if grep -q "test:cov" package.json; then
    pnpm run test:cov
  elif grep -q "\"test\"" package.json; then
    pnpm run test -- --coverage
  fi

  # Check coverage threshold
  if [ -f "coverage/coverage-summary.json" ]; then
    COVERAGE=$(node -e "const c = require('./coverage/coverage-summary.json'); console.log(c.total.lines.pct)")
    echo -e "Coverage: ${COVERAGE}%"

    if (( $(echo "$COVERAGE < $COVERAGE_THRESHOLD" | bc -l) )); then
      echo -e "${RED}✗ Coverage ${COVERAGE}% is below threshold ${COVERAGE_THRESHOLD}%${NC}"
      cd - > /dev/null
      return 1
    else
      echo -e "${GREEN}✓ Coverage ${COVERAGE}% meets threshold${NC}"
    fi
  fi

  cd - > /dev/null
  return 0
}

# Collect packages to test
PACKAGES=()

if [ -n "$PACKAGE_FILTER" ]; then
  # Test specific package
  if [ -d "services/$PACKAGE_FILTER" ]; then
    PACKAGES+=("services/$PACKAGE_FILTER")
  elif [ -d "apps/$PACKAGE_FILTER/apps/backend" ]; then
    PACKAGES+=("apps/$PACKAGE_FILTER/apps/backend")
  else
    echo -e "${RED}Package not found: $PACKAGE_FILTER${NC}"
    exit 1
  fi
else
  # Test all backend packages
  for service in services/*; do
    if [ -d "$service" ] && [ -f "$service/package.json" ]; then
      PACKAGES+=("$service")
    fi
  done

  for app_backend in apps/*/apps/backend; do
    if [ -d "$app_backend" ] && [ -f "$app_backend/package.json" ]; then
      PACKAGES+=("$app_backend")
    fi
  done
fi

echo -e "\n${GREEN}Found ${#PACKAGES[@]} package(s) to test${NC}\n"

# Run tests for each package
FAILED_PACKAGES=()
PASSED_PACKAGES=()

for pkg in "${PACKAGES[@]}"; do
  pkg_name=$(basename "$pkg")

  if run_package_tests "$pkg_name" "$pkg"; then
    PASSED_PACKAGES+=("$pkg_name")
  else
    FAILED_PACKAGES+=("$pkg_name")
  fi
done

# Summary
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Test Summary${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Passed: ${GREEN}${#PASSED_PACKAGES[@]}${NC}"
echo -e "Failed: ${RED}${#FAILED_PACKAGES[@]}${NC}"

if [ ${#FAILED_PACKAGES[@]} -gt 0 ]; then
  echo -e "\n${RED}Failed packages:${NC}"
  for pkg in "${FAILED_PACKAGES[@]}"; do
    echo -e "  - ${RED}${pkg}${NC}"
  done
  exit 1
fi

echo -e "\n${GREEN}✓ All tests passed!${NC}"
exit 0
