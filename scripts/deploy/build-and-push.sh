#!/bin/bash

# Build and push Docker images for manacore services
# Usage: ./build-and-push.sh [service] [tag]
# Example: ./build-and-push.sh chat-backend v1.0.0
# Example: ./build-and-push.sh all latest

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOCKER_REGISTRY=${DOCKER_REGISTRY:-"wuesteon"}
SERVICE=${1:-"all"}
TAG=${2:-"latest"}
PLATFORM=${PLATFORM:-"linux/amd64"}

# Function to print colored output
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to build and push a service
build_and_push() {
    local service=$1
    local dockerfile=$2
    local context=${3:-.}
    local image_name="${DOCKER_REGISTRY}/${service}"

    log_info "Building ${service}..."

    # Build the image
    if docker buildx build \
        --platform ${PLATFORM} \
        --tag "${image_name}:${TAG}" \
        --tag "${image_name}:latest" \
        --file "${dockerfile}" \
        --progress plain \
        ${context}; then

        log_info "Successfully built ${service}"

        # Push the image
        log_info "Pushing ${service} to registry..."

        if docker push "${image_name}:${TAG}" && docker push "${image_name}:latest"; then
            log_info "Successfully pushed ${service}"
            return 0
        else
            log_error "Failed to push ${service}"
            return 1
        fi
    else
        log_error "Failed to build ${service}"
        return 1
    fi
}

# Function to build all services
build_all() {
    local services=(
        "mana-core-auth:services/mana-core-auth/Dockerfile"
        "maerchenzauber-backend:apps/maerchenzauber/apps/backend/Dockerfile"
        "chat-backend:apps/chat/apps/backend/Dockerfile"
        "manadeck-backend:apps/manadeck/apps/backend/Dockerfile"
        "nutriphi-backend:apps/nutriphi/apps/backend/Dockerfile"
        "news-api:apps/news/apps/api/Dockerfile"
    )

    local failed_services=()

    for service_config in "${services[@]}"; do
        IFS=':' read -r service dockerfile <<< "$service_config"

        if [ -f "$dockerfile" ]; then
            if ! build_and_push "$service" "$dockerfile" "."; then
                failed_services+=("$service")
            fi
        else
            log_warn "Dockerfile not found for ${service}: ${dockerfile}"
        fi

        echo ""
    done

    # Report results
    echo ""
    echo "=========================================="
    if [ ${#failed_services[@]} -eq 0 ]; then
        log_info "All services built and pushed successfully!"
        return 0
    else
        log_error "Failed to build/push the following services:"
        for service in "${failed_services[@]}"; do
            echo "  - ${service}"
        done
        return 1
    fi
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed or not in PATH"
    exit 1
fi

# Check if buildx is available
if ! docker buildx version &> /dev/null; then
    log_error "Docker buildx is not available"
    log_info "Install it with: docker buildx install"
    exit 1
fi

# Login to Docker registry
if [ -n "${DOCKER_USERNAME}" ] && [ -n "${DOCKER_PASSWORD}" ]; then
    log_info "Logging in to Docker registry..."
    echo "${DOCKER_PASSWORD}" | docker login -u "${DOCKER_USERNAME}" --password-stdin
fi

# Main execution
log_info "Starting build and push process..."
log_info "Registry: ${DOCKER_REGISTRY}"
log_info "Tag: ${TAG}"
log_info "Platform: ${PLATFORM}"
echo ""

if [ "$SERVICE" == "all" ]; then
    build_all
else
    # Build specific service
    case "$SERVICE" in
        "mana-core-auth")
            build_and_push "mana-core-auth" "services/mana-core-auth/Dockerfile" "."
            ;;
        "maerchenzauber-backend")
            build_and_push "maerchenzauber-backend" "apps/maerchenzauber/apps/backend/Dockerfile" "."
            ;;
        "chat-backend")
            build_and_push "chat-backend" "apps/chat/apps/backend/Dockerfile" "."
            ;;
        "manadeck-backend")
            build_and_push "manadeck-backend" "apps/manadeck/apps/backend/Dockerfile" "."
            ;;
        "nutriphi-backend")
            build_and_push "nutriphi-backend" "apps/nutriphi/apps/backend/Dockerfile" "."
            ;;
        "news-api")
            build_and_push "news-api" "apps/news/apps/api/Dockerfile" "."
            ;;
        *)
            log_error "Unknown service: $SERVICE"
            echo "Available services: all, mana-core-auth, maerchenzauber-backend, chat-backend, manadeck-backend, nutriphi-backend, news-api"
            exit 1
            ;;
    esac
fi

log_info "Build and push process completed!"
