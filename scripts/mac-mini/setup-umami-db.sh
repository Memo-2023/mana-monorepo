#!/bin/bash
# Setup Umami database on Mac Mini
# Run this script after starting PostgreSQL container

set -e

echo "Creating Umami database..."

# Check if running inside docker network or from host
if docker ps | grep -q manacore-postgres; then
    docker exec -i manacore-postgres psql -U postgres <<EOF
SELECT 'CREATE DATABASE umami' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'umami')\gexec
EOF
    echo "Umami database created successfully!"
else
    echo "Error: PostgreSQL container 'manacore-postgres' is not running"
    echo "Please start it with: docker compose -f docker-compose.macmini.yml up -d postgres"
    exit 1
fi

echo ""
echo "Next steps:"
echo "1. Start Umami: docker compose -f docker-compose.macmini.yml up -d umami"
echo "2. Access Umami at: https://analytics.mana.how"
echo "3. Default login: admin / umami"
echo "4. Change the password immediately!"
echo "5. Create websites and get tracking IDs for your apps"
