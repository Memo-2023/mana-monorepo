#!/bin/bash
# Setup Matrix Synapse on Mac Mini
# Run this script once to initialize Matrix

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
MATRIX_DIR="$PROJECT_DIR/docker/matrix"

echo "============================================"
echo "  ManaCore Matrix Setup"
echo "============================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if postgres is running
echo "Checking PostgreSQL..."
if ! docker exec manacore-postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo -e "${RED}Error: PostgreSQL is not running.${NC}"
    echo "Start it with: docker compose -f docker-compose.macmini.yml up -d postgres"
    exit 1
fi
echo -e "${GREEN}PostgreSQL is running${NC}"

# Create matrix database
echo ""
echo "Creating Matrix database..."
if docker exec manacore-postgres psql -U postgres -lqt | cut -d \| -f 1 | grep -qw matrix; then
    echo -e "${YELLOW}Database 'matrix' already exists${NC}"
else
    docker exec manacore-postgres psql -U postgres -c "CREATE DATABASE matrix;"
    echo -e "${GREEN}Database 'matrix' created${NC}"
fi

# Create synapse user
echo ""
echo "Creating Synapse database user..."
if docker exec manacore-postgres psql -U postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='synapse'" | grep -q 1; then
    echo -e "${YELLOW}User 'synapse' already exists${NC}"
else
    # Generate a random password if not set
    SYNAPSE_DB_PASSWORD=${SYNAPSE_DB_PASSWORD:-$(openssl rand -base64 24)}
    docker exec manacore-postgres psql -U postgres -c "CREATE USER synapse WITH PASSWORD '$SYNAPSE_DB_PASSWORD';"
    docker exec manacore-postgres psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE matrix TO synapse;"
    docker exec manacore-postgres psql -U postgres -c "ALTER DATABASE matrix OWNER TO synapse;"
    echo -e "${GREEN}User 'synapse' created${NC}"
    echo ""
    echo -e "${YELLOW}IMPORTANT: Add this to your .env file:${NC}"
    echo "SYNAPSE_DB_PASSWORD=$SYNAPSE_DB_PASSWORD"
fi

# Create logs directory in volume
echo ""
echo "Creating logs directory..."
mkdir -p "$MATRIX_DIR/logs" 2>/dev/null || true

# Generate signing key if not exists
echo ""
echo "Checking signing key..."
if docker volume ls | grep -q manacore-synapse; then
    echo -e "${YELLOW}Synapse volume already exists - signing key should be present${NC}"
else
    echo "Signing key will be generated on first Synapse start"
fi

# Generate secrets if not set
echo ""
echo "============================================"
echo "  Required Environment Variables"
echo "============================================"
echo ""
echo "Add these to your .env file (generate secure values!):"
echo ""

# Generate random secrets for display
echo "SYNAPSE_DB_PASSWORD=$(openssl rand -base64 24)"
echo "SYNAPSE_PASSWORD_PEPPER=$(openssl rand -base64 32)"
echo "SYNAPSE_FORM_SECRET=$(openssl rand -base64 32)"
echo "SYNAPSE_MACAROON_SECRET=$(openssl rand -base64 32)"
echo "SYNAPSE_REGISTRATION_SECRET=$(openssl rand -base64 32)"

echo ""
echo "============================================"
echo "  Cloudflare Tunnel Configuration"
echo "============================================"
echo ""
echo "Add these ingress rules to ~/.cloudflared/config.yml:"
echo ""
echo "  - hostname: matrix.mana.how"
echo "    service: http://localhost:8008"
echo ""
echo "  - hostname: element.mana.how"
echo "    service: http://localhost:8087"
echo ""

echo ""
echo "============================================"
echo "  Next Steps"
echo "============================================"
echo ""
echo "1. Add environment variables to .env file"
echo "2. Update Cloudflare Tunnel config"
echo "3. Start Matrix services:"
echo "   docker compose -f docker-compose.macmini.yml up -d synapse element-web"
echo ""
echo "4. Wait for Synapse to start (check logs):"
echo "   docker logs -f manacore-synapse"
echo ""
echo "5. Create admin user:"
echo "   docker exec -it manacore-synapse register_new_matrix_user \\"
echo "     -c /data/homeserver.yaml http://localhost:8008 -a"
echo ""
echo "6. Test endpoints:"
echo "   curl https://matrix.mana.how/health"
echo "   open https://element.mana.how"
echo ""
echo -e "${GREEN}Setup complete!${NC}"
