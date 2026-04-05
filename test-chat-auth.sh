#!/bin/bash

# Test script for chat backend + mana-auth integration

echo "========================================="
echo "Testing Chat Backend + Mana Core Auth"
echo "========================================="
echo ""

# 1. Register a test user (or use existing)
echo "1. Registering test user..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-chat@example.com",
    "password": "TestPassword123!",
    "name": "Chat Test User"
  }')

echo "Register response: $REGISTER_RESPONSE"
echo ""

# 2. Login to get token
echo "2. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-chat@example.com",
    "password": "TestPassword123!"
  }')

# Extract token (assuming JSON response with accessToken field)
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get token!"
  echo "Login response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Got token: ${TOKEN:0:50}..."
echo ""

# 3. Test protected chat endpoint
echo "3. Testing protected chat endpoint..."
CHAT_RESPONSE=$(curl -s -X GET http://localhost:3002/api/conversations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Chat response: $CHAT_RESPONSE"
echo ""

# 4. Validate token
echo "4. Validating token..."
VALIDATE_RESPONSE=$(curl -s -X POST http://localhost:3001/api/v1/auth/validate \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"$TOKEN\"}")

echo "Validate response: $VALIDATE_RESPONSE"
echo ""

echo "========================================="
echo "✅ Test complete!"
echo "========================================="
