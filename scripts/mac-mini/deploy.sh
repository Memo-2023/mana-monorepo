#!/bin/bash
# Mac Mini Deployment Script
# Pulls latest images and starts all containers

set -e

# Ensure PATH includes docker
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.macmini.yml"
ENV_FILE="$PROJECT_ROOT/.env.macmini"

echo "=== ManaCore Mac Mini Deployment ==="
echo ""
echo "Project root: $PROJECT_ROOT"
echo "Compose file: $COMPOSE_FILE"
echo ""

# Check if env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Warning: $ENV_FILE not found"
    echo "Creating from template..."
    cat > "$ENV_FILE" << 'EOF'
# Mac Mini Production Environment
# Copy this to .env.macmini and fill in the values

# Database
POSTGRES_PASSWORD=your-secure-password

# Redis
REDIS_PASSWORD=your-redis-password

# JWT Keys (from mana-auth)
JWT_SECRET=your-jwt-secret
JWT_PUBLIC_KEY=
JWT_PRIVATE_KEY=

# Supabase (if needed)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Azure OpenAI (for chat)
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_API_KEY=
EOF
    echo ""
    echo "Please edit $ENV_FILE with your values and run this script again."
    exit 1
fi

# Login to GitHub Container Registry
echo "=== Logging into GitHub Container Registry ==="
echo "Please enter your GitHub Personal Access Token (with read:packages scope):"
read -s GITHUB_TOKEN
echo "$GITHUB_TOKEN" | docker login ghcr.io -u memo-2023 --password-stdin

echo ""
echo "=== Pulling latest images ==="
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull

echo ""
echo "=== Starting containers ==="
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

echo ""
echo "=== Waiting for services to start (30s) ==="
sleep 30

echo ""
echo "=== Container Status ==="
docker compose -f "$COMPOSE_FILE" ps

echo ""
echo "=== Creating databases ==="
docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U postgres -c "CREATE DATABASE manacore_auth;" 2>/dev/null || echo "manacore_auth exists"
docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U postgres -c "CREATE DATABASE chat;" 2>/dev/null || echo "chat exists"
docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U postgres -c "CREATE DATABASE todo;" 2>/dev/null || echo "todo exists"
docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U postgres -c "CREATE DATABASE calendar;" 2>/dev/null || echo "calendar exists"
docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U postgres -c "CREATE DATABASE clock;" 2>/dev/null || echo "clock exists"

echo ""
echo "=== Health Checks ==="
check_health() {
    local name=$1
    local url=$2
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200"; then
        echo "  $name: OK"
    else
        echo "  $name: FAILED"
    fi
}

check_health "Auth API" "http://localhost:3001/health"
check_health "ManaCore Web" "http://localhost:5000/health"
check_health "Chat Backend" "http://localhost:3030/health"
check_health "Chat Web" "http://localhost:5010/health"
check_health "Todo Backend" "http://localhost:3031/health"
check_health "Todo Web" "http://localhost:5011/health"
check_health "Calendar Backend" "http://localhost:3032/health"
check_health "Calendar Web" "http://localhost:5012/health"
check_health "Clock Backend" "http://localhost:3033/health"
check_health "Clock Web" "http://localhost:5013/health"
check_health "Contacts Backend" "http://localhost:3034/health"
check_health "Contacts Web" "http://localhost:5014/health"

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "URLs via Cloudflare Tunnel:"
echo "  https://mana.how          - Dashboard"
echo "  https://auth.mana.how     - Auth API"
echo "  https://chat.mana.how     - Chat"
echo "  https://todo.mana.how     - Todo"
echo "  https://calendar.mana.how - Calendar"
echo "  https://clock.mana.how    - Clock"
echo ""
