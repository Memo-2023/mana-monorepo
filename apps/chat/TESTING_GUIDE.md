# Testing Guide - Mana Core Auth Integration

This guide walks you through testing the Chat project with Mana Core Auth.

---

## Prerequisites

Before testing, make sure you have:

- ✅ Node.js 20+
- ✅ pnpm installed
- ✅ All dependencies installed (`pnpm install` from monorepo root)
- ✅ PostgreSQL running (or Docker for Mana Core Auth)

---

## Step 1: Generate JWT Keys for Mana Core Auth

Mana Core Auth requires RS256 JWT keys. Generate them first:

```bash
cd mana-core-auth
chmod +x scripts/generate-keys.sh
./scripts/generate-keys.sh
```

**You'll see output like:**

```
Generating RS256 key pair...
Keys generated successfully!

Private key: private.pem
Public key: public.pem

Add these to your .env file:

JWT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKC...
-----END RSA PRIVATE KEY-----"

JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
MIIBIjANBg...
-----END PUBLIC KEY-----"
```

**Copy these keys - you'll need them in the next step!**

---

## Step 2: Configure Environment Variables

### 2.1 Mana Core Auth

```bash
cd mana-core-auth
cp .env.example .env
```

Edit `mana-core-auth/.env` and add:

```env
# Database
DATABASE_URL=postgresql://manacore:password@localhost:5432/manacore

# Paste the keys from Step 1
JWT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
YOUR_PRIVATE_KEY_HERE
-----END RSA PRIVATE KEY-----"

JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
YOUR_PUBLIC_KEY_HERE
-----END PUBLIC KEY-----"

# Other settings (use defaults for now)
REDIS_PASSWORD=
CORS_ORIGINS=http://localhost:5173,http://localhost:8081
PORT=3001
```

### 2.2 Chat Backend

```bash
cd ../chat/backend
cp .env.example .env
```

Edit `chat/backend/.env`:

```env
# Azure OpenAI (your existing keys)
AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_API_VERSION=2024-12-01-preview

# Mana Core Auth (NEW)
MANA_CORE_AUTH_URL=http://localhost:3001

# Supabase (for database, not auth)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key

# Server
PORT=3002
```

### 2.3 Chat Web App

```bash
cd ../apps/web
cp .env.example .env
```

Edit `chat/apps/web/.env`:

```env
# Mana Core Auth (NEW)
PUBLIC_MANA_CORE_AUTH_URL=http://localhost:3001

# Backend API (NEW PORT)
PUBLIC_BACKEND_URL=http://localhost:3002

# Supabase (for database)
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2.4 Chat Mobile App

```bash
cd ../mobile
cp .env.example .env
```

Edit `chat/apps/mobile/.env`:

```env
# Mana Core Auth (NEW)
EXPO_PUBLIC_MANA_CORE_AUTH_URL=http://localhost:3001

# Backend API (NEW PORT)
EXPO_PUBLIC_BACKEND_URL=http://localhost:3002

# Supabase (for database)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## Step 3: Start Services (4 Terminals)

### Terminal 1: Mana Core Auth

```bash
cd mana-core-auth

# Start PostgreSQL (if using Docker)
docker-compose up postgres -d

# Run migrations
pnpm migration:run

# Start auth service
pnpm start:dev
```

**Expected output:**

```
🚀 Mana Core Auth running on: http://localhost:3001
📚 Environment: development
```

**Leave this running!**

### Terminal 2: Chat Backend

```bash
cd chat/backend
pnpm start:dev
```

**Expected output:**

```
[Nest] LOG [NestApplication] Nest application successfully started
[Nest] LOG Listening on port 3002
```

**Leave this running!**

### Terminal 3: Chat Web App

```bash
cd chat/apps/web
pnpm dev
```

**Expected output:**

```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Leave this running!**

### Terminal 4: Chat Mobile App (Optional)

```bash
cd chat/apps/mobile
pnpm dev
```

**Expected output:**

```
› Metro waiting on exp://localhost:8081
› Scan the QR code above with Expo Go (Android) or Camera (iOS)
```

---

## Step 4: Test Web App Authentication

### 4.1 Open Web App

Open browser: http://localhost:5173

### 4.2 Register New User

1. Click **"Register"** or go to `/register`
2. Enter test credentials:
   - Email: `test@example.com`
   - Password: `Test1234!`
3. Click **"Register"**

**Expected:**

- Registration succeeds
- Automatically redirects to login
- Login happens automatically
- You're redirected to the main app

### 4.3 Check Authentication

Open browser console (F12) and run:

```javascript
// Check if user is authenticated
console.log('Authenticated:', window.localStorage.getItem('@auth/appToken'));
```

**Expected:** You should see a JWT token

### 4.4 Check Credits

In browser console:

```javascript
// Get credit balance
const authStore = window.authStore; // If exported globally
// Or navigate to a page that displays credits
```

**Expected:**

- 150 initial credits
- API call to `/api/v1/credits/balance` succeeds

### 4.5 Test Logout

1. Click **"Logout"** button
2. Check you're redirected to login page
3. Try accessing protected route → Should redirect to login

---

## Step 5: Test Backend API

### 5.1 Get Access Token

First, login via web app, then get the token from localStorage:

**In browser console:**

```javascript
const token = localStorage.getItem('@auth/appToken');
console.log(token);
// Copy this token!
```

### 5.2 Test Protected Endpoints

Use `curl` or Postman/Insomnia:

#### Test 1: Get AI Models (Protected)

```bash
# Without token - Should fail with 401
curl http://localhost:3002/api/chat/models

# With token - Should succeed
curl http://localhost:3002/api/chat/models \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "GPT-O3-Mini",
    "description": "Azure OpenAI O3-Mini: Effizientes Modell für schnelle Antworten.",
    ...
  },
  ...
]
```

#### Test 2: List Conversations (Protected)

```bash
curl http://localhost:3002/api/conversations \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected:** Array of conversations (may be empty for new user)

#### Test 3: Create Conversation (Protected)

```bash
curl -X POST http://localhost:3002/api/conversations \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "modelId": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Test Conversation"
  }'
```

**Expected:** New conversation object

#### Test 4: Chat Completion (Protected)

```bash
curl -X POST http://localhost:3002/api/chat/completions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "modelId": "550e8400-e29b-41d4-a716-446655440000",
    "messages": [
      {"role": "user", "content": "Say hello!"}
    ]
  }'
```

**Expected:** AI response with content and usage stats

---

## Step 6: Test Mobile App (Optional)

### 6.1 Install Expo Go

- **iOS:** Install from App Store
- **Android:** Install from Google Play Store

### 6.2 Scan QR Code

1. Look at Terminal 4 (mobile app terminal)
2. Scan the QR code with:
   - iOS: Camera app
   - Android: Expo Go app

### 6.3 Register/Login

1. App opens to login screen
2. Tap **"Register"**
3. Enter credentials:
   - Email: `mobile@example.com`
   - Password: `Mobile1234!`
4. Tap **"Register"**

**Expected:**

- Registration succeeds
- Auto-login
- Redirected to chat interface

### 6.4 Test Chat

1. Try sending a message
2. Should get AI response
3. Check conversation is saved

---

## Step 7: Test Token Validation

### 7.1 Test Invalid Token

```bash
curl http://localhost:3002/api/chat/models \
  -H "Authorization: Bearer invalid-token-here"
```

**Expected:**

```json
{
	"statusCode": 401,
	"message": "Invalid token"
}
```

### 7.2 Test Expired Token

After 15 minutes, the access token expires. Try using it:

```bash
curl http://localhost:3002/api/chat/models \
  -H "Authorization: Bearer EXPIRED_TOKEN"
```

**Expected:** 401 Unauthorized

### 7.3 Test Token Refresh

The `@manacore/shared-auth` package automatically refreshes tokens. To test:

1. Wait 15+ minutes (or change `JWT_ACCESS_TOKEN_EXPIRY=1m` for testing)
2. Make an API call from web/mobile app
3. Check Network tab - should see automatic refresh
4. Request succeeds with new token

---

## Step 8: Test Credit System

### 8.1 Check Initial Balance

```bash
curl http://localhost:3001/api/v1/credits/balance \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:**

```json
{
	"balance": 0,
	"freeCreditsRemaining": 150,
	"totalEarned": 0,
	"totalSpent": 0,
	"dailyFreeCredits": 5
}
```

### 8.2 Use Credits

```bash
curl -X POST http://localhost:3001/api/v1/credits/use \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10,
    "appId": "chat",
    "description": "Test chat completion",
    "idempotencyKey": "test-123"
  }'
```

**Expected:**

```json
{
  "success": true,
  "transaction": { ... },
  "newBalance": {
    "balance": 0,
    "freeCreditsRemaining": 140,
    "totalSpent": 10
  }
}
```

### 8.3 Check Transaction History

```bash
curl http://localhost:3001/api/v1/credits/transactions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** Array with signup bonus and usage transactions

---

## Common Issues & Solutions

### Issue 1: "Connection refused" to port 3001

**Problem:** Mana Core Auth not running

**Solution:**

```bash
cd mana-core-auth
pnpm start:dev
```

### Issue 2: "Invalid token" errors

**Problem:** JWT keys mismatch or token expired

**Solution:**

1. Clear tokens: `localStorage.clear()` in browser
2. Login again
3. Verify JWT keys are identical in Mana Core Auth .env

### Issue 3: CORS errors in browser

**Problem:** Web app URL not in CORS whitelist

**Solution:**
Edit `mana-core-auth/.env`:

```env
CORS_ORIGINS=http://localhost:5173,http://localhost:8081
```

Restart Mana Core Auth

### Issue 4: "Database connection failed"

**Problem:** PostgreSQL not running

**Solution:**

```bash
# If using Docker
cd mana-core-auth
docker-compose up postgres -d

# Check it's running
docker-compose ps
```

### Issue 5: "Port 3001 already in use"

**Problem:** Another service using port 3001

**Solution:**

```bash
# Find what's using the port
lsof -ti:3001

# Kill it
kill -9 $(lsof -ti:3001)
```

### Issue 6: Mobile app can't connect

**Problem:** Using localhost on mobile device

**Solution:**
Edit `chat/apps/mobile/.env`:

```env
# Replace localhost with your computer's IP
EXPO_PUBLIC_MANA_CORE_AUTH_URL=http://192.168.1.XXX:3001
EXPO_PUBLIC_BACKEND_URL=http://192.168.1.XXX:3002
```

Get your IP:

```bash
# macOS
ipconfig getifaddr en0

# Linux
hostname -I
```

---

## Quick Test Script

Save this as `test-auth.sh`:

```bash
#!/bin/bash

echo "🧪 Testing Mana Core Auth Integration"
echo ""

# Test 1: Register user
echo "1️⃣ Testing registration..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!"}')

echo "Response: $REGISTER_RESPONSE"
echo ""

# Test 2: Login
echo "2️⃣ Testing login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!"}')

# Extract token
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed!"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login successful! Token: ${TOKEN:0:50}..."
echo ""

# Test 3: Get credits
echo "3️⃣ Testing credit balance..."
CREDITS_RESPONSE=$(curl -s http://localhost:3001/api/v1/credits/balance \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $CREDITS_RESPONSE"
echo ""

# Test 4: Backend protected endpoint
echo "4️⃣ Testing backend protected endpoint..."
MODELS_RESPONSE=$(curl -s http://localhost:3002/api/chat/models \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $MODELS_RESPONSE"
echo ""

echo "✅ All tests complete!"
```

Make it executable and run:

```bash
chmod +x test-auth.sh
./test-auth.sh
```

---

## Testing Checklist

Use this checklist to verify everything works:

### Mana Core Auth ✅

- [ ] Service starts on port 3001
- [ ] Can register new user
- [ ] Can login with credentials
- [ ] Can refresh access token
- [ ] Can logout
- [ ] Can check credit balance
- [ ] Can use credits

### Chat Backend ✅

- [ ] Service starts on port 3002
- [ ] Protected endpoints return 401 without token
- [ ] Protected endpoints work with valid token
- [ ] Can list AI models
- [ ] Can create conversation
- [ ] Can list conversations
- [ ] Can send messages

### Web App ✅

- [ ] App loads on port 5173
- [ ] Can register new user
- [ ] Can login
- [ ] Can logout
- [ ] Can access protected routes
- [ ] Can send chat messages
- [ ] Can see conversations

### Mobile App ✅

- [ ] App loads in Expo Go
- [ ] Can register new user
- [ ] Can login
- [ ] Can logout
- [ ] Can send chat messages
- [ ] Can see conversations
- [ ] Tokens persist after app restart

---

**Status:** Ready for Testing! 🚀

Follow these steps and check off items as you test. If you encounter issues, check the "Common Issues" section above.
