#!/bin/bash
# Script to verify the build and local Docker testing for Manadeck Backend

set -e  # Exit on error

echo "=========================================="
echo "Manadeck Backend Build Verification"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print success
success() {
  echo -e "${GREEN}✓${NC} $1"
}

# Function to print error
error() {
  echo -e "${RED}✗${NC} $1"
}

# Function to print warning
warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

# Check current directory
echo "1. Checking directory..."
if [ ! -f "package.json" ]; then
  error "package.json not found. Please run this script from manadeck/backend directory"
  exit 1
fi
success "Running from correct directory: $(pwd)"
echo ""

# Check for required files
echo "2. Checking required files..."
REQUIRED_FILES=("Dockerfile" "cloudbuild.yaml" "tsconfig.json" "nest-cli.json" "src/main.ts")
for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ]; then
    success "$file exists"
  else
    error "$file not found"
    exit 1
  fi
done
echo ""

# Check Node.js version
echo "3. Checking Node.js version..."
if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v)
  success "Node.js version: $NODE_VERSION"
else
  error "Node.js not installed"
  exit 1
fi
echo ""

# Install dependencies
echo "4. Installing dependencies..."
if [ ! -d "node_modules" ]; then
  warning "node_modules not found. Running npm ci..."
  npm ci
else
  success "node_modules exists"
fi
echo ""

# Run linter
echo "5. Running linter..."
if npm run lint; then
  success "Linting passed"
else
  warning "Linting failed (non-blocking)"
fi
echo ""

# Build the project
echo "6. Building the project..."
if npm run build; then
  success "Build successful"
else
  error "Build failed"
  exit 1
fi
echo ""

# Check dist directory
echo "7. Checking build output..."
if [ -d "dist" ]; then
  success "dist directory exists"

  if [ -f "dist/main.js" ]; then
    success "dist/main.js exists"
    FILE_SIZE=$(du -h dist/main.js | cut -f1)
    echo "   File size: $FILE_SIZE"
  else
    error "dist/main.js not found"
    exit 1
  fi
else
  error "dist directory not found"
  exit 1
fi
echo ""

# Check for .env file
echo "8. Checking environment configuration..."
if [ -f ".env" ]; then
  success ".env file exists"
else
  warning ".env file not found (required for local testing)"
  echo "   Create .env from .env.example for local development"
fi
echo ""

# Docker build test (optional)
echo "9. Docker build test..."
read -p "Do you want to test Docker build? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Building Docker image..."

  if command -v docker &> /dev/null; then
    if docker build -t manadeck-backend:test .; then
      success "Docker build successful"

      # Optional: Run container for health check
      read -p "Do you want to test the Docker container? (y/N) " -n 1 -r
      echo
      if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Starting Docker container..."

        # Check if .env exists for env vars
        if [ -f ".env" ]; then
          docker run -d --name manadeck-test -p 8080:8080 --env-file .env manadeck-backend:test
        else
          warning "No .env file found. Starting container without environment variables..."
          docker run -d --name manadeck-test -p 8080:8080 manadeck-backend:test
        fi

        echo "Waiting for service to start..."
        sleep 5

        # Test health endpoint
        echo "Testing health endpoint..."
        if curl -s http://localhost:8080/health > /dev/null; then
          success "Health check passed"
          curl http://localhost:8080/health | jq . || cat
        else
          warning "Health check failed (may need environment variables)"
        fi

        # Cleanup
        echo ""
        echo "Stopping and removing test container..."
        docker stop manadeck-test > /dev/null 2>&1
        docker rm manadeck-test > /dev/null 2>&1
        success "Cleanup complete"
      fi

      # Optional: Remove test image
      read -p "Do you want to remove the test Docker image? (y/N) " -n 1 -r
      echo
      if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker rmi manadeck-backend:test > /dev/null 2>&1
        success "Test image removed"
      fi
    else
      error "Docker build failed"
      exit 1
    fi
  else
    warning "Docker not installed. Skipping Docker build test."
  fi
else
  echo "Skipping Docker build test"
fi
echo ""

# Check cloudbuild.yaml version
echo "10. Checking cloudbuild.yaml version..."
if [ -f "cloudbuild.yaml" ]; then
  CURRENT_VERSION=$(grep -o "manadeck-backend:v[0-9.]*" cloudbuild.yaml | head -1 | sed 's/manadeck-backend://')
  success "Current version in cloudbuild.yaml: $CURRENT_VERSION"

  warning "Before deploying, consider incrementing the version in cloudbuild.yaml"
else
  error "cloudbuild.yaml not found"
fi
echo ""

# Summary
echo "=========================================="
echo "Build Verification Summary"
echo "=========================================="
success "All required files present"
success "Dependencies installed"
success "Build completed successfully"
success "Build artifacts verified"
echo ""

echo "Next steps:"
echo "1. Review and update version in cloudbuild.yaml if needed"
echo "2. Commit your changes to git"
echo "3. Push to main branch to trigger automatic deployment"
echo "   OR"
echo "   Deploy manually:"
echo "   cd $(pwd)"
echo "   gcloud builds submit --project=memo-2c4c4 --config=cloudbuild.yaml ."
echo ""

echo "For deployment help, see DEPLOY_MANUAL.md"
echo ""
