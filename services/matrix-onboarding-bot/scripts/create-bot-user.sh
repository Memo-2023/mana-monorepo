#!/bin/bash
# Create Matrix bot user for onboarding bot
# Run this script on the Mac Mini server

set -e

# Configuration
BOT_USERNAME="onboarding-bot"
BOT_PASSWORD="$(openssl rand -base64 32)"
HOMESERVER_URL="${MATRIX_HOMESERVER_URL:-http://localhost:4000}"
REGISTRATION_SECRET="${SYNAPSE_REGISTRATION_SECRET:-}"

echo "=== Matrix Onboarding Bot User Setup ==="
echo ""

# Check if registration secret is set
if [ -z "$REGISTRATION_SECRET" ]; then
    echo "Error: SYNAPSE_REGISTRATION_SECRET environment variable not set"
    echo "Run: export SYNAPSE_REGISTRATION_SECRET=<your-secret>"
    exit 1
fi

# Generate the HMAC for registration
generate_mac() {
    local nonce="$1"
    local username="$2"
    local password="$3"
    local admin="$4"

    echo -n "${nonce}\x00${username}\x00${password}\x00${admin}" | \
        openssl dgst -sha1 -hmac "$REGISTRATION_SECRET" | \
        awk '{print $2}'
}

echo "1. Getting registration nonce..."
NONCE=$(curl -s "${HOMESERVER_URL}/_synapse/admin/v1/register" | jq -r '.nonce')

if [ -z "$NONCE" ] || [ "$NONCE" = "null" ]; then
    echo "Error: Could not get registration nonce"
    exit 1
fi

echo "   Nonce: ${NONCE:0:20}..."

echo ""
echo "2. Registering bot user: @${BOT_USERNAME}:matrix.mana.how"

MAC=$(generate_mac "$NONCE" "$BOT_USERNAME" "$BOT_PASSWORD" "notadmin")

REGISTER_RESPONSE=$(curl -s -X POST "${HOMESERVER_URL}/_synapse/admin/v1/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"nonce\": \"$NONCE\",
        \"username\": \"$BOT_USERNAME\",
        \"password\": \"$BOT_PASSWORD\",
        \"admin\": false,
        \"mac\": \"$MAC\"
    }")

# Check if user already exists
if echo "$REGISTER_RESPONSE" | grep -q "User ID already taken"; then
    echo "   User already exists, logging in instead..."

    # Login to get access token
    LOGIN_RESPONSE=$(curl -s -X POST "${HOMESERVER_URL}/_matrix/client/v3/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"type\": \"m.login.password\",
            \"user\": \"$BOT_USERNAME\",
            \"password\": \"$BOT_PASSWORD\"
        }")

    if echo "$LOGIN_RESPONSE" | grep -q "Invalid username"; then
        echo "   Cannot login with generated password."
        echo "   You need to reset the password or use existing credentials."
        echo ""
        echo "   To reset password, run in Synapse container:"
        echo "   docker exec -it mana-matrix-synapse /bin/bash"
        echo "   register_new_matrix_user -c /config/homeserver.yaml -u $BOT_USERNAME -p <password> --no-admin"
        exit 1
    fi

    ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token')
else
    ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.access_token')
fi

if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" = "null" ]; then
    echo "Error: Could not get access token"
    echo "Response: $REGISTER_RESPONSE"
    exit 1
fi

echo ""
echo "3. Setting display name..."
curl -s -X PUT "${HOMESERVER_URL}/_matrix/client/v3/profile/@${BOT_USERNAME}:matrix.mana.how/displayname" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"displayname": "Onboarding Bot"}'

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Add these to your .env file or docker-compose environment:"
echo ""
echo "MATRIX_ONBOARDING_BOT_TOKEN=$ACCESS_TOKEN"
echo "MATRIX_ONBOARDING_BOT_ROOMS=#welcome:matrix.mana.how"
echo ""
echo "Bot User: @${BOT_USERNAME}:matrix.mana.how"
echo ""
