#!/bin/bash
# Register and setup Matrix Mana Bot (Gateway)
# Run this after Matrix Synapse is running

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo "============================================"
echo "  Matrix Mana Bot Setup"
echo "============================================"
echo ""

# Default values
HOMESERVER_URL="${MATRIX_HOMESERVER_URL:-http://localhost:8008}"
BOT_USERNAME="mana"
BOT_DISPLAY_NAME="Mana"

# Check if Synapse is running
echo "Checking Synapse..."
if ! curl -s "${HOMESERVER_URL}/health" > /dev/null 2>&1; then
    echo -e "${RED}Error: Synapse is not reachable at ${HOMESERVER_URL}${NC}"
    echo "Start it with: docker compose -f docker-compose.macmini.yml up -d synapse"
    exit 1
fi
echo -e "${GREEN}Synapse is running${NC}"
echo ""

# Check if registration secret is available
if [ -z "$SYNAPSE_REGISTRATION_SECRET" ]; then
    echo -e "${YELLOW}SYNAPSE_REGISTRATION_SECRET not set.${NC}"
    echo "Please provide the registration secret from your .env file:"
    read -sp "Registration Secret: " SYNAPSE_REGISTRATION_SECRET
    echo ""
fi

# Generate bot password
BOT_PASSWORD=$(openssl rand -base64 24)

echo "Registering bot user @${BOT_USERNAME}..."

# Generate HMAC for registration
generate_mac() {
    local nonce=$1
    local user=$2
    local password=$3
    local user_type=$4
    local admin=$5

    local mac_input="${nonce}\x00${user}\x00${password}\x00${user_type}\x00${admin}"
    echo -n "$mac_input" | openssl dgst -sha1 -hmac "$SYNAPSE_REGISTRATION_SECRET" | cut -d' ' -f2
}

# Get nonce
NONCE=$(curl -s "${HOMESERVER_URL}/_synapse/admin/v1/register" | jq -r '.nonce')

if [ -z "$NONCE" ] || [ "$NONCE" = "null" ]; then
    echo -e "${RED}Failed to get registration nonce. Is admin registration enabled?${NC}"
    exit 1
fi

# Calculate MAC
MAC=$(generate_mac "$NONCE" "$BOT_USERNAME" "$BOT_PASSWORD" "bot" "false")

# Register user
REGISTER_RESPONSE=$(curl -s -X POST "${HOMESERVER_URL}/_synapse/admin/v1/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"nonce\": \"${NONCE}\",
        \"username\": \"${BOT_USERNAME}\",
        \"password\": \"${BOT_PASSWORD}\",
        \"displayname\": \"${BOT_DISPLAY_NAME}\",
        \"user_type\": \"bot\",
        \"admin\": false,
        \"mac\": \"${MAC}\"
    }")

# Check if registration was successful
if echo "$REGISTER_RESPONSE" | jq -e '.access_token' > /dev/null 2>&1; then
    ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.access_token')
    USER_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.user_id')

    echo -e "${GREEN}Bot registered successfully!${NC}"
    echo ""
    echo -e "${CYAN}User ID:${NC} ${USER_ID}"
    echo ""
else
    ERROR=$(echo "$REGISTER_RESPONSE" | jq -r '.error // .errcode // "Unknown error"')

    # Check if user already exists
    if echo "$ERROR" | grep -qi "user.*exists\|already.*registered\|M_USER_IN_USE"; then
        echo -e "${YELLOW}User @${BOT_USERNAME} already exists. Getting access token via login...${NC}"

        echo "Please enter the existing bot password:"
        read -sp "Password: " EXISTING_PASSWORD
        echo ""

        LOGIN_RESPONSE=$(curl -s -X POST "${HOMESERVER_URL}/_matrix/client/r0/login" \
            -H "Content-Type: application/json" \
            -d "{
                \"type\": \"m.login.password\",
                \"user\": \"${BOT_USERNAME}\",
                \"password\": \"${EXISTING_PASSWORD}\"
            }")

        if echo "$LOGIN_RESPONSE" | jq -e '.access_token' > /dev/null 2>&1; then
            ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token')
            USER_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.user_id')
            echo -e "${GREEN}Login successful!${NC}"
        else
            echo -e "${RED}Login failed. Please check the password.${NC}"
            exit 1
        fi
    else
        echo -e "${RED}Registration failed: ${ERROR}${NC}"
        exit 1
    fi
fi

echo ""
echo "============================================"
echo "  Add to .env file"
echo "============================================"
echo ""
echo -e "${CYAN}# Matrix Mana Bot (Gateway)${NC}"
echo "MATRIX_MANA_BOT_TOKEN=${ACCESS_TOKEN}"
echo ""

# Optional: Set display name and avatar
echo "Setting display name..."
curl -s -X PUT "${HOMESERVER_URL}/_matrix/client/r0/profile/${USER_ID}/displayname" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"displayname\": \"🤖 ${BOT_DISPLAY_NAME}\"}" > /dev/null

echo ""
echo "============================================"
echo "  Next Steps"
echo "============================================"
echo ""
echo "1. Add the MATRIX_MANA_BOT_TOKEN to your .env file"
echo ""
echo "2. Build the bot image:"
echo "   docker build -t matrix-mana-bot ./services/matrix-mana-bot"
echo ""
echo "3. Start the bot:"
echo "   docker compose -f docker-compose.macmini.yml up -d matrix-mana-bot"
echo ""
echo "4. Invite the bot to a room in Element:"
echo "   /invite @mana:mana.how"
echo ""
echo -e "${GREEN}Setup complete!${NC}"
