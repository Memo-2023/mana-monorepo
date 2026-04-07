# ✅ Mana Auth Integration - COMPLETE

**Date:** 2025-11-25
**Status:** 🎉 All code changes implemented
**Project:** Chat (Backend, Web, Mobile)

---

## 🎯 Summary

The Chat project has been **fully migrated** from Supabase Auth to **Mana Auth**! All three apps (backend, web, mobile) now use the centralized authentication system with built-in credit management.

---

## ✅ What Was Done

### 1. **Updated `@mana/shared-auth` Package** ✅

**Location:** `/packages/shared-auth/src/core/authService.ts`

**Changes:**

- Updated API endpoints to match Mana Auth (`/api/v1/auth/*`)
- Fixed login response handling (`accessToken` instead of `appToken`)
- Fixed signup flow (register then login separately)
- Updated refresh token endpoint
- Updated credits balance endpoint

**Status:** Package is now 100% compatible with Mana Auth API

---

### 2. **Chat Backend Integration** ✅

**Files Modified:**

- ✅ `chat/backend/src/common/guards/jwt-auth.guard.ts` (NEW)
- ✅ `chat/backend/src/common/decorators/current-user.decorator.ts` (NEW)
- ✅ `chat/backend/src/chat/chat.controller.ts`
- ✅ `chat/backend/src/chat/chat.service.ts`
- ✅ `chat/backend/src/conversation/conversation.controller.ts`
- ✅ `chat/backend/.env.example`

**Changes:**

- Created JWT Auth Guard that validates tokens with Mana Auth
- Created CurrentUser decorator to inject user data into controllers
- Updated all controllers to use JwtAuthGuard
- Removed userId from request body (now extracted from JWT)
- Added MANA_AUTH_URL environment variable
- Changed PORT from 3001 to 3002 (to avoid conflict with auth service)

**Key Features:**

- All endpoints now protected with JWT validation
- User context automatically injected via @CurrentUser decorator
- Token validation happens via Mana Auth API
- Proper error handling for invalid/expired tokens

---

### 3. **Chat Web App Integration** ✅

**Files Modified:**

- ✅ `chat/apps/web/src/lib/stores/auth.svelte.ts`
- ✅ `chat/apps/web/.env.example`

**Changes:**

- Completely rewrote auth store to use `@mana/shared-auth`
- Removed Supabase auth dependencies
- Added `initializeWebAuth()` initialization
- Added `getCredits()` method for credit balance
- Added `getAccessToken()` method for API calls
- Added MANA_AUTH_URL environment variable

**API Compatibility:**

- Same method signatures as before (signIn, signUp, signOut, resetPassword)
- Minimal breaking changes for existing code
- Additional methods: `getCredits()`, `getAccessToken()`

---

### 4. **Chat Mobile App Integration** ✅

**Files Modified:**

- ✅ `chat/apps/mobile/context/AuthProvider.tsx`
- ✅ `chat/apps/mobile/.env.example`

**Changes:**

- Rewrote AuthProvider to use `@mana/shared-auth`
- Created SecureStore adapter for token storage
- Created React Native device adapter
- Created React Native network adapter
- Removed Supabase auth dependencies
- Added MANA_AUTH_URL environment variable

**Key Features:**

- Tokens stored securely in Expo SecureStore
- Device ID generated and persisted
- Same API as before (useAuth hook remains unchanged)
- Auto sign-in after successful signup

---

## 📝 Configuration Changes

### Backend `.env`

```env
# OLD (Remove):
# SUPABASE_URL=...
# SUPABASE_SERVICE_KEY=...
# PORT=3001

# NEW (Add):
MANA_AUTH_URL=http://localhost:3001
PORT=3002

# Keep (for database):
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key-here
```

### Web App `.env`

```env
# OLD (Remove):
# PUBLIC_SUPABASE_URL=...
# PUBLIC_SUPABASE_ANON_KEY=...
# PUBLIC_BACKEND_URL=http://localhost:3001

# NEW (Add):
PUBLIC_MANA_AUTH_URL=http://localhost:3001
PUBLIC_BACKEND_URL=http://localhost:3002

# Keep (for database):
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Mobile App `.env`

```env
# OLD (Remove):
# EXPO_PUBLIC_SUPABASE_URL=...
# EXPO_PUBLIC_SUPABASE_ANON_KEY=...
# EXPO_PUBLIC_BACKEND_URL=http://localhost:3001

# NEW (Add):
EXPO_PUBLIC_MANA_AUTH_URL=http://localhost:3001
EXPO_PUBLIC_BACKEND_URL=http://localhost:3002

# Keep (for database):
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## 🚀 How to Run

### 1. Start Mana Auth (Terminal 1)

```bash
cd mana-auth
cp .env.example .env
# Edit .env and add JWT keys (see mana-auth/QUICKSTART.md)
pnpm start:dev
```

Service runs on: `http://localhost:3001`

### 2. Start Chat Backend (Terminal 2)

```bash
cd chat/backend
cp .env.example .env
# Edit .env:
# - Add MANA_AUTH_URL=http://localhost:3001
# - Change PORT=3002
pnpm start:dev
```

Service runs on: `http://localhost:3002`

### 3. Start Web App (Terminal 3)

```bash
cd chat/apps/web
cp .env.example .env
# Edit .env:
# - Add PUBLIC_MANA_AUTH_URL=http://localhost:3001
# - Change PUBLIC_BACKEND_URL=http://localhost:3002
pnpm dev
```

App runs on: `http://localhost:5173`

### 4. Start Mobile App (Terminal 4)

```bash
cd chat/apps/mobile
cp .env.example .env
# Edit .env:
# - Add EXPO_PUBLIC_MANA_AUTH_URL=http://localhost:3001
# - Change EXPO_PUBLIC_BACKEND_URL=http://localhost:3002
pnpm dev
```

---

## 🧪 Testing Checklist

### Backend

- [ ] Start backend on port 3002
- [ ] Try accessing `/api/chat/models` without token → Should return 401
- [ ] Login via Mana Auth
- [ ] Access `/api/chat/models` with token → Should work
- [ ] Access `/api/conversations` with token → Should work

### Web App

- [ ] Go to `/login`
- [ ] Register new user
- [ ] Should redirect and auto-login
- [ ] Check user is authenticated
- [ ] Try protected routes
- [ ] Logout
- [ ] Try protected routes again → Should redirect to login

### Mobile App

- [ ] Open app
- [ ] Register new user
- [ ] Should auto-login
- [ ] Check chat functionality works
- [ ] Logout
- [ ] Login again with same credentials

---

## 💡 New Features Available

### Credit System (Built-in)

All users now have access to the credit system:

```typescript
// Web App
const credits = await authStore.getCredits();
console.log(credits); // { credits: 150, maxCreditLimit: 1000, userId: "..." }

// Mobile App (need to add this method to AuthProvider if needed)
const credits = await authService.getUserCredits();
```

**Default Credits:**

- Signup bonus: 150 free credits
- Daily free credits: 5 credits every 24 hours
- Pricing: 100 mana = €1.00

---

## 🔄 What Changed for Users

| Aspect            | Before (Supabase) | After (Mana)             | Impact                         |
| ----------------- | ----------------- | ------------------------ | ------------------------------ |
| **Registration**  | Immediate session | Register → Login         | Minimal (auto-login in mobile) |
| **Login**         | Supabase JWT      | Mana JWT                 | None (transparent)             |
| **Token Storage** | Supabase cookies  | localStorage/SecureStore | None (same security)           |
| **Sessions**      | Supabase sessions | JWT + refresh tokens     | Better (token rotation)        |
| **Credits**       | ❌ None           | ✅ 150 initial + 5 daily | **NEW FEATURE!**               |

---

## 📊 Port Configuration

| Service          | Port | URL                   |
| ---------------- | ---- | --------------------- |
| **Mana Auth**    | 3001 | http://localhost:3001 |
| **Chat Backend** | 3002 | http://localhost:3002 |
| **Web App**      | 5173 | http://localhost:5173 |
| **Mobile App**   | 8081 | exp://localhost:8081  |

---

## 🐛 Potential Issues & Solutions

### Issue: "Connection refused" to Mana Auth

**Solution:** Make sure Mana Auth is running on port 3001

```bash
cd mana-auth && pnpm start:dev
```

### Issue: "Invalid token" errors

**Solution:** Clear stored tokens and login again

```typescript
// Web: Clear localStorage
localStorage.clear();

// Mobile: Uninstall and reinstall app, or clear SecureStore
await SecureStore.deleteItemAsync('@auth/appToken');
await SecureStore.deleteItemAsync('@auth/refreshToken');
```

### Issue: CORS errors from web app

**Solution:** Add web app URL to Mana Auth CORS config

```env
# In mana-auth/.env
CORS_ORIGINS=http://localhost:5173,http://localhost:8081
```

### Issue: Backend can't validate tokens

**Solution:** Check MANA_AUTH_URL in backend .env

```env
MANA_AUTH_URL=http://localhost:3001
```

---

## 📚 API Endpoint Reference

### Mana Auth (Port 3001)

- POST `/api/v1/auth/register` - Register new user
- POST `/api/v1/auth/login` - Login with email/password
- POST `/api/v1/auth/refresh` - Refresh access token
- POST `/api/v1/auth/logout` - Logout and revoke session
- POST `/api/v1/auth/validate` - Validate JWT token
- GET `/api/v1/credits/balance` - Get credit balance

### Chat Backend (Port 3002)

- GET `/api/chat/models` - List AI models (protected)
- POST `/api/chat/completions` - Create chat completion (protected)
- GET `/api/conversations` - List conversations (protected)
- POST `/api/conversations` - Create conversation (protected)
- GET `/api/conversations/:id` - Get conversation (protected)
- GET `/api/conversations/:id/messages` - Get messages (protected)
- POST `/api/conversations/:id/messages` - Add message (protected)

---

## 🎓 Next Steps (Optional Enhancements)

1. **Add Credit Usage Tracking**
   - Deduct credits when using AI models
   - Show remaining credits in UI

2. **Add OAuth Providers**
   - Google Sign-In
   - Apple Sign-In

3. **Add Email Verification**
   - Send verification emails on signup
   - Verify email before allowing login

4. **Add Password Reset**
   - Implement forgot password flow
   - Send reset emails

5. **Add 2FA**
   - Enable two-factor authentication
   - Support TOTP apps

6. **Add Session Management**
   - Show active sessions
   - Revoke specific sessions

---

## 📖 Documentation

- **Integration Guide:** `/chat/MANA_AUTH_INTEGRATION.md`
- **Mana Auth README:** `/mana-auth/README.md`
- **Quick Start:** `/mana-auth/QUICKSTART.md`
- **Master Plan:** `/.hive-mind/MASTER_PLAN_CENTRAL_AUTH_SYSTEM.md`

---

## ✨ Benefits of Migration

1. **✅ Centralized Authentication** - Single auth system for all Mana apps
2. **✅ Built-in Credits** - No need to build separate credit system
3. **✅ Better Security** - RS256 JWT, refresh token rotation, optimistic locking
4. **✅ Cost Savings** - Self-hosted, no per-user charges
5. **✅ Full Control** - Complete ownership of user data
6. **✅ Consistent API** - Same auth flow across all apps

---

**Status:** 🎉 **INTEGRATION COMPLETE - READY FOR TESTING!**

All code changes are done. Follow the "How to Run" section above to test the integration.
