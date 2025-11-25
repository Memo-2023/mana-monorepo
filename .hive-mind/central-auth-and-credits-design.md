# Central Auth and Mana Credit System Design

**Document Version:** 1.0
**Date:** 2025-11-25
**Status:** Design Specification

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [API Architecture](#api-architecture)
4. [Authentication Flows](#authentication-flows)
5. [Credit Transaction Logic](#credit-transaction-logic)
6. [Integration Patterns](#integration-patterns)
7. [Migration Scripts](#migration-scripts)

---

## Overview

This document specifies the database schema and API architecture for the central authentication and Mana credit system. The system is designed to:

- Support Better Auth compatibility for modern authentication
- Manage user accounts, sessions, and multi-device support
- Track Mana credit balances and transactions atomically
- Enable app-specific user data relations
- Provide webhook/event system for real-time updates

### Design Principles

1. **Atomic Transactions**: All credit operations use PostgreSQL transactions
2. **Multi-Tenancy**: Support multiple apps sharing the same auth system
3. **Audit Trail**: Complete transaction history with metadata
4. **Type Safety**: Compatible with Drizzle ORM for TypeScript type generation
5. **Security**: Row-Level Security (RLS) policies for data isolation
6. **Scalability**: Indexed columns for performance

---

## Database Schema

### Schema: `auth`

All authentication-related tables live in the `auth` schema.

### 1. Users Table

Core user identity table, compatible with Better Auth.

```sql
CREATE TABLE auth.users (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Authentication
  email TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMPTZ,

  -- Profile
  name TEXT,
  image TEXT, -- Avatar URL

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ, -- Soft delete support

  -- Indexes
  CONSTRAINT users_email_lowercase CHECK (email = LOWER(email))
);

-- Indexes
CREATE INDEX idx_users_email ON auth.users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created_at ON auth.users(created_at);
CREATE INDEX idx_users_deleted_at ON auth.users(deleted_at) WHERE deleted_at IS NOT NULL;

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION auth.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auth.update_updated_at_column();

-- Comments
COMMENT ON TABLE auth.users IS 'Core user identity table compatible with Better Auth';
COMMENT ON COLUMN auth.users.deleted_at IS 'Soft delete timestamp. User is deleted if NOT NULL';
```

### 2. Accounts Table

OAuth and social login provider accounts linked to users.

```sql
CREATE TABLE auth.accounts (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Provider information
  provider TEXT NOT NULL, -- 'email', 'google', 'apple', 'github', etc.
  provider_account_id TEXT NOT NULL, -- Provider's unique user ID

  -- OAuth tokens (encrypted at application level)
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  UNIQUE(provider, provider_account_id)
);

-- Indexes
CREATE INDEX idx_accounts_user_id ON auth.accounts(user_id);
CREATE INDEX idx_accounts_provider ON auth.accounts(provider);
CREATE UNIQUE INDEX idx_accounts_provider_account ON auth.accounts(provider, provider_account_id);

-- Trigger
CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON auth.accounts
  FOR EACH ROW
  EXECUTE FUNCTION auth.update_updated_at_column();

-- Comments
COMMENT ON TABLE auth.accounts IS 'OAuth and social login provider accounts';
COMMENT ON COLUMN auth.accounts.provider IS 'Authentication provider: email, google, apple, github';
```

### 3. Sessions Table

Active user sessions for token management.

```sql
CREATE TABLE auth.sessions (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Session tokens
  session_token TEXT UNIQUE NOT NULL,
  refresh_token TEXT UNIQUE NOT NULL,

  -- Token lifecycle
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_active_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Device information
  device_id TEXT,
  device_name TEXT,
  device_type TEXT, -- 'web', 'ios', 'android', 'desktop'
  platform TEXT,

  -- IP and location
  ip_address INET,
  user_agent TEXT,

  -- App context
  app_id TEXT NOT NULL, -- Which app this session belongs to

  -- Status
  revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_sessions_user_id ON auth.sessions(user_id);
CREATE INDEX idx_sessions_session_token ON auth.sessions(session_token) WHERE NOT revoked;
CREATE INDEX idx_sessions_refresh_token ON auth.sessions(refresh_token) WHERE NOT revoked;
CREATE INDEX idx_sessions_expires_at ON auth.sessions(expires_at);
CREATE INDEX idx_sessions_app_id ON auth.sessions(app_id);
CREATE INDEX idx_sessions_device_id ON auth.sessions(device_id);

-- Auto-update last_active_at
CREATE OR REPLACE FUNCTION auth.update_session_last_active()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_active_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sessions_last_active
  BEFORE UPDATE ON auth.sessions
  FOR EACH ROW
  WHEN (OLD.session_token IS DISTINCT FROM NEW.session_token OR OLD.refresh_token IS DISTINCT FROM NEW.refresh_token)
  EXECUTE FUNCTION auth.update_session_last_active();

-- Comments
COMMENT ON TABLE auth.sessions IS 'Active user sessions for multi-device support';
COMMENT ON COLUMN auth.sessions.app_id IS 'Application identifier (e.g., memoro, manadeck, picture)';
```

### 4. Password Reset Tokens

Temporary tokens for password reset flows.

```sql
CREATE TABLE auth.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  used_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_password_reset_tokens_user_id ON auth.password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token ON auth.password_reset_tokens(token) WHERE used_at IS NULL;
CREATE INDEX idx_password_reset_tokens_expires_at ON auth.password_reset_tokens(expires_at);

COMMENT ON TABLE auth.password_reset_tokens IS 'Temporary tokens for password reset';
```

### 5. Email Verification Tokens

Tokens for email verification.

```sql
CREATE TABLE auth.email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  verified_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_email_verification_tokens_user_id ON auth.email_verification_tokens(user_id);
CREATE INDEX idx_email_verification_tokens_token ON auth.email_verification_tokens(token) WHERE verified_at IS NULL;
CREATE INDEX idx_email_verification_tokens_expires_at ON auth.email_verification_tokens(expires_at);

COMMENT ON TABLE auth.email_verification_tokens IS 'Tokens for email verification';
```

---

### Schema: `credits`

All credit-related tables live in the `credits` schema.

### 6. Credit Balances Table

Current credit balance per user (single source of truth).

```sql
CREATE TABLE credits.balances (
  -- Primary key
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Balance tracking
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  max_credit_limit INTEGER NOT NULL DEFAULT 1000,

  -- Free tier tracking
  free_credits_remaining INTEGER NOT NULL DEFAULT 150, -- Initial free credits
  daily_free_credits INTEGER NOT NULL DEFAULT 5, -- Daily bonus
  last_daily_credit_at DATE, -- Last time daily credits were claimed

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Lifetime statistics
  total_earned INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  total_purchased INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX idx_balances_balance ON credits.balances(balance);
CREATE INDEX idx_balances_updated_at ON credits.balances(updated_at);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION credits.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_balances_updated_at
  BEFORE UPDATE ON credits.balances
  FOR EACH ROW
  EXECUTE FUNCTION credits.update_updated_at_column();

-- Auto-create balance for new users
CREATE OR REPLACE FUNCTION credits.create_balance_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO credits.balances (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_balance_on_user_creation
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION credits.create_balance_for_new_user();

-- Comments
COMMENT ON TABLE credits.balances IS 'Current credit balance per user (single source of truth)';
COMMENT ON COLUMN credits.balances.balance IS 'Current available credits. MUST be >= 0';
COMMENT ON COLUMN credits.balances.max_credit_limit IS 'Maximum credits user can hold (prevents abuse)';
```

### 7. Transactions Table

Complete audit trail of all credit operations.

```sql
CREATE TABLE credits.transactions (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Transaction details
  type TEXT NOT NULL, -- 'purchase', 'usage', 'refund', 'admin_adjustment', 'daily_bonus', 'signup_bonus'
  operation TEXT NOT NULL, -- App-specific operation (e.g., 'DECK_CREATION', 'STORY_GENERATION')
  amount INTEGER NOT NULL, -- Positive for credits added, negative for credits spent

  -- Balance tracking (for audit)
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,

  -- Context
  app_id TEXT NOT NULL, -- Which app triggered this transaction
  description TEXT NOT NULL,
  metadata JSONB, -- Flexible storage for operation-specific data

  -- References
  reference_id TEXT, -- External reference (e.g., Stripe payment ID, RevenueCat transaction ID)
  related_transaction_id UUID REFERENCES credits.transactions(id), -- For refunds/adjustments

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CHECK (
    (type = 'usage' AND amount < 0) OR
    (type IN ('purchase', 'refund', 'admin_adjustment', 'daily_bonus', 'signup_bonus') AND amount > 0) OR
    (type = 'admin_adjustment')
  )
);

-- Indexes
CREATE INDEX idx_transactions_user_id ON credits.transactions(user_id);
CREATE INDEX idx_transactions_type ON credits.transactions(type);
CREATE INDEX idx_transactions_app_id ON credits.transactions(app_id);
CREATE INDEX idx_transactions_operation ON credits.transactions(operation);
CREATE INDEX idx_transactions_created_at ON credits.transactions(created_at DESC);
CREATE INDEX idx_transactions_reference_id ON credits.transactions(reference_id) WHERE reference_id IS NOT NULL;
CREATE INDEX idx_transactions_metadata ON credits.transactions USING GIN(metadata);

-- Comments
COMMENT ON TABLE credits.transactions IS 'Complete audit trail of all credit operations';
COMMENT ON COLUMN credits.transactions.type IS 'Transaction type: purchase, usage, refund, admin_adjustment, daily_bonus, signup_bonus';
COMMENT ON COLUMN credits.transactions.amount IS 'Positive for credits added, negative for credits spent';
COMMENT ON COLUMN credits.transactions.metadata IS 'Flexible JSONB storage for operation-specific data';
```

### 8. Credit Packages Table

Available credit packages for purchase.

```sql
CREATE TABLE credits.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Package details
  name TEXT NOT NULL,
  credits INTEGER NOT NULL CHECK (credits > 0),
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'EUR',

  -- Display
  description TEXT,
  badge TEXT, -- e.g., 'BEST VALUE', 'POPULAR'
  sort_order INTEGER DEFAULT 0,

  -- Status
  active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_packages_active ON credits.packages(active, sort_order);

-- Trigger
CREATE TRIGGER update_packages_updated_at
  BEFORE UPDATE ON credits.packages
  FOR EACH ROW
  EXECUTE FUNCTION credits.update_updated_at_column();

-- Seed default packages
INSERT INTO credits.packages (name, credits, price_cents, badge, sort_order) VALUES
  ('Starter Pack', 100, 99, NULL, 1),
  ('Power Pack', 500, 499, 'POPULAR', 2),
  ('Pro Pack', 1000, 899, 'BEST VALUE', 3),
  ('Ultimate Pack', 5000, 3999, NULL, 4);

COMMENT ON TABLE credits.packages IS 'Available credit packages for purchase';
```

### 9. Operation Costs Table

Credit costs per operation per app.

```sql
CREATE TABLE credits.operation_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Operation identification
  app_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  cost INTEGER NOT NULL CHECK (cost >= 0),

  -- Display
  display_name TEXT NOT NULL,
  description TEXT,

  -- Status
  active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  UNIQUE(app_id, operation)
);

-- Indexes
CREATE INDEX idx_operation_costs_app_id ON credits.operation_costs(app_id);
CREATE INDEX idx_operation_costs_active ON credits.operation_costs(active);
CREATE UNIQUE INDEX idx_operation_costs_app_operation ON credits.operation_costs(app_id, operation) WHERE active;

-- Trigger
CREATE TRIGGER update_operation_costs_updated_at
  BEFORE UPDATE ON credits.operation_costs
  FOR EACH ROW
  EXECUTE FUNCTION credits.update_updated_at_column();

-- Seed operation costs for existing apps
INSERT INTO credits.operation_costs (app_id, operation, cost, display_name, description) VALUES
  -- Manadeck
  ('manadeck', 'DECK_CREATION', 10, 'Create Deck', 'Create a new flashcard deck'),
  ('manadeck', 'CARD_CREATION', 2, 'Add Card', 'Add a single card to a deck'),
  ('manadeck', 'AI_CARD_GENERATION', 5, 'AI Card Generation', 'Generate a card using AI'),
  ('manadeck', 'DECK_EXPORT', 3, 'Export Deck', 'Export deck to various formats'),

  -- Maerchenzauber
  ('maerchenzauber', 'STORY_GENERATION', 50, 'Generate Story', 'Generate a new AI story'),
  ('maerchenzauber', 'CHARACTER_CREATION', 20, 'Create Character', 'Create a custom character'),
  ('maerchenzauber', 'IMAGE_GENERATION', 30, 'Generate Image', 'Generate story illustration'),

  -- Memoro
  ('memoro', 'TRANSCRIPTION_PER_HOUR', 120, 'Audio Transcription', 'Per hour of audio transcribed'),
  ('memoro', 'HEADLINE_GENERATION', 10, 'Generate Headline', 'AI-generated memo headline'),
  ('memoro', 'MEMORY_CREATION', 10, 'Create Memory', 'Generate memory from memo'),
  ('memoro', 'BLUEPRINT_PROCESSING', 5, 'Process Blueprint', 'Apply AI blueprint to memo'),

  -- Picture
  ('picture', 'IMAGE_GENERATION', 25, 'Generate Image', 'AI image generation'),
  ('picture', 'IMAGE_UPSCALE', 15, 'Upscale Image', 'Upscale image quality'),
  ('picture', 'STYLE_TRANSFER', 20, 'Style Transfer', 'Apply style to image');

COMMENT ON TABLE credits.operation_costs IS 'Credit costs per operation per app';
```

---

### Schema: `app_data`

App-specific user data relations.

### 10. App User Settings

Per-app user preferences and settings.

```sql
CREATE TABLE app_data.user_settings (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id TEXT NOT NULL,

  -- Settings stored as JSONB for flexibility
  settings JSONB NOT NULL DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  PRIMARY KEY (user_id, app_id)
);

-- Indexes
CREATE INDEX idx_user_settings_app_id ON app_data.user_settings(app_id);
CREATE INDEX idx_user_settings_settings ON app_data.user_settings USING GIN(settings);

-- Trigger
CREATE OR REPLACE FUNCTION app_data.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON app_data.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION app_data.update_updated_at_column();

COMMENT ON TABLE app_data.user_settings IS 'Per-app user preferences and settings';
```

---

### Schema: `webhooks`

Event system for real-time credit updates.

### 11. Webhook Endpoints

Registered webhooks for apps.

```sql
CREATE TABLE webhooks.endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- App identification
  app_id TEXT NOT NULL,

  -- Webhook details
  url TEXT NOT NULL,
  secret TEXT NOT NULL, -- For HMAC signature verification

  -- Event filters
  events TEXT[] NOT NULL DEFAULT '{credit.updated, credit.low_balance}',

  -- Status
  active BOOLEAN DEFAULT true,

  -- Retry configuration
  max_retries INTEGER DEFAULT 3,
  retry_delay_seconds INTEGER DEFAULT 60,

  -- Statistics
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  failure_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_webhook_endpoints_app_id ON webhooks.endpoints(app_id);
CREATE INDEX idx_webhook_endpoints_active ON webhooks.endpoints(active);

COMMENT ON TABLE webhooks.endpoints IS 'Registered webhooks for apps';
```

### 12. Webhook Delivery Log

Audit trail of webhook deliveries.

```sql
CREATE TABLE webhooks.delivery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  endpoint_id UUID NOT NULL REFERENCES webhooks.endpoints(id) ON DELETE CASCADE,

  -- Event details
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,

  -- Delivery status
  status TEXT NOT NULL, -- 'pending', 'success', 'failed', 'retrying'
  attempt_count INTEGER DEFAULT 0,

  -- Response
  response_status_code INTEGER,
  response_body TEXT,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  delivered_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_delivery_log_endpoint_id ON webhooks.delivery_log(endpoint_id);
CREATE INDEX idx_delivery_log_status ON webhooks.delivery_log(status);
CREATE INDEX idx_delivery_log_created_at ON webhooks.delivery_log(created_at DESC);
CREATE INDEX idx_delivery_log_next_retry ON webhooks.delivery_log(next_retry_at) WHERE status = 'retrying';

COMMENT ON TABLE webhooks.delivery_log IS 'Audit trail of webhook deliveries';
```

---

## API Architecture

### Base URL

```
https://mana-core-middleware-111768794939.europe-west3.run.app
```

### API Design Principles

1. **RESTful**: Standard HTTP methods and status codes
2. **Versioned**: `/v1/` prefix for API versioning
3. **JWT Authentication**: Bearer token in `Authorization` header
4. **JSON**: All requests and responses use `application/json`
5. **Rate Limited**: 100 requests/minute per user
6. **CORS Enabled**: For web client support

---

### Authentication Endpoints

#### POST /auth/register

Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "deviceInfo": {
    "deviceId": "abc123",
    "deviceName": "iPhone 14",
    "deviceType": "ios",
    "platform": "mobile"
  }
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "emailVerified": false,
    "createdAt": "2025-11-25T10:00:00Z"
  },
  "tokens": {
    "manaToken": "jwt...", // Internal token
    "appToken": "jwt...",  // Supabase-compatible JWT
    "refreshToken": "rt_..."
  },
  "needsVerification": true
}
```

**Errors:**
- `400`: Invalid input (weak password, invalid email)
- `409`: Email already registered

---

#### POST /auth/login

Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "deviceInfo": {
    "deviceId": "abc123",
    "deviceName": "iPhone 14",
    "deviceType": "ios",
    "platform": "mobile"
  }
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "emailVerified": true
  },
  "tokens": {
    "manaToken": "jwt...",
    "appToken": "jwt...",
    "refreshToken": "rt_..."
  },
  "credits": {
    "balance": 150,
    "maxCreditLimit": 1000
  }
}
```

**Errors:**
- `401`: Invalid credentials
- `403`: Email not verified
- `429`: Too many login attempts

---

#### POST /auth/refresh

Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "rt_...",
  "deviceInfo": {
    "deviceId": "abc123"
  }
}
```

**Response (200 OK):**
```json
{
  "tokens": {
    "manaToken": "jwt...",
    "appToken": "jwt...",
    "refreshToken": "rt_..."
  }
}
```

**Errors:**
- `401`: Invalid or expired refresh token
- `403`: Device ID mismatch

---

#### POST /auth/logout

Revoke current session.

**Request:**
```json
{
  "refreshToken": "rt_..."
}
```

**Response (204 No Content)**

---

#### POST /auth/forgot-password

Request password reset.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "Password reset email sent"
}
```

---

#### POST /auth/reset-password

Reset password with token.

**Request:**
```json
{
  "token": "reset_token_...",
  "newPassword": "NewSecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "message": "Password reset successful"
}
```

**Errors:**
- `400`: Invalid or expired token
- `400`: Weak password

---

#### POST /auth/verify-email

Verify email with token.

**Request:**
```json
{
  "token": "verify_token_..."
}
```

**Response (200 OK):**
```json
{
  "message": "Email verified successfully"
}
```

---

#### POST /auth/google-signin

Sign in with Google OAuth.

**Request:**
```json
{
  "token": "google_id_token...",
  "deviceInfo": {
    "deviceId": "abc123",
    "deviceName": "iPhone 14",
    "deviceType": "ios"
  }
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@gmail.com",
    "name": "John Doe",
    "image": "https://..."
  },
  "tokens": {
    "manaToken": "jwt...",
    "appToken": "jwt...",
    "refreshToken": "rt_..."
  },
  "isNewUser": false
}
```

---

#### POST /auth/apple-signin

Sign in with Apple.

**Request:**
```json
{
  "token": "apple_id_token...",
  "deviceInfo": {
    "deviceId": "abc123"
  }
}
```

**Response:** Same as Google sign-in

---

### User Management Endpoints

#### GET /users/me

Get current user profile.

**Headers:**
```
Authorization: Bearer <manaToken>
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "image": null,
  "emailVerified": true,
  "createdAt": "2025-11-25T10:00:00Z"
}
```

---

#### PATCH /users/me

Update user profile.

**Request:**
```json
{
  "name": "Jane Doe",
  "image": "https://..."
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "Jane Doe",
  "image": "https://...",
  "updatedAt": "2025-11-25T10:30:00Z"
}
```

---

#### DELETE /users/me

Delete user account (soft delete).

**Response (204 No Content)**

---

#### GET /users/me/sessions

List all active sessions.

**Response (200 OK):**
```json
{
  "sessions": [
    {
      "id": "uuid",
      "deviceName": "iPhone 14",
      "deviceType": "ios",
      "lastActiveAt": "2025-11-25T10:00:00Z",
      "ipAddress": "192.168.1.1",
      "current": true
    },
    {
      "id": "uuid",
      "deviceName": "Chrome on MacBook",
      "deviceType": "web",
      "lastActiveAt": "2025-11-24T15:00:00Z",
      "ipAddress": "192.168.1.2",
      "current": false
    }
  ]
}
```

---

#### DELETE /users/me/sessions/:sessionId

Revoke a specific session.

**Response (204 No Content)**

---

### Credit Endpoints

#### GET /credits/balance

Get user's current credit balance.

**Headers:**
```
Authorization: Bearer <manaToken>
```

**Response (200 OK):**
```json
{
  "userId": "uuid",
  "balance": 150,
  "maxCreditLimit": 1000,
  "freeCreditsRemaining": 50,
  "dailyFreeCredits": 5,
  "lastDailyCreditAt": "2025-11-25",
  "totalEarned": 200,
  "totalSpent": 50,
  "totalPurchased": 0
}
```

---

#### POST /credits/validate

Validate if user has enough credits for an operation.

**Request:**
```json
{
  "appId": "manadeck",
  "operation": "DECK_CREATION",
  "amount": 10
}
```

**Response (200 OK):**
```json
{
  "hasCredits": true,
  "currentBalance": 150,
  "requiredAmount": 10,
  "balanceAfter": 140,
  "operationCost": 10
}
```

**Response (400 Bad Request - Insufficient Credits):**
```json
{
  "hasCredits": false,
  "currentBalance": 5,
  "requiredAmount": 10,
  "shortfall": 5,
  "error": "insufficient_credits",
  "message": "You need 5 more credits to perform this operation"
}
```

---

#### POST /credits/deduct

Deduct credits for an operation.

**Request:**
```json
{
  "appId": "manadeck",
  "operation": "DECK_CREATION",
  "amount": 10,
  "description": "Created deck: Spanish Vocabulary",
  "metadata": {
    "deckId": "uuid",
    "deckName": "Spanish Vocabulary"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "transactionId": "uuid",
  "balanceBefore": 150,
  "balanceAfter": 140,
  "amountDeducted": 10
}
```

**Errors:**
- `400`: Insufficient credits
- `404`: Operation cost not found

---

#### POST /credits/claim-daily

Claim daily free credits.

**Response (200 OK):**
```json
{
  "success": true,
  "creditsAdded": 5,
  "newBalance": 155,
  "nextClaimAt": "2025-11-26T00:00:00Z"
}
```

**Response (400 Bad Request - Already Claimed):**
```json
{
  "success": false,
  "message": "Daily credits already claimed today",
  "nextClaimAt": "2025-11-26T00:00:00Z"
}
```

---

#### GET /credits/transactions

Get transaction history.

**Query Parameters:**
- `limit` (default: 50, max: 100)
- `offset` (default: 0)
- `type` (optional filter: 'purchase', 'usage', 'refund')
- `appId` (optional filter)

**Response (200 OK):**
```json
{
  "transactions": [
    {
      "id": "uuid",
      "type": "usage",
      "operation": "DECK_CREATION",
      "amount": -10,
      "balanceBefore": 150,
      "balanceAfter": 140,
      "appId": "manadeck",
      "description": "Created deck: Spanish Vocabulary",
      "metadata": {
        "deckId": "uuid"
      },
      "createdAt": "2025-11-25T10:00:00Z"
    },
    {
      "id": "uuid",
      "type": "signup_bonus",
      "operation": "SIGNUP_BONUS",
      "amount": 150,
      "balanceBefore": 0,
      "balanceAfter": 150,
      "appId": "system",
      "description": "Welcome bonus",
      "createdAt": "2025-11-25T09:00:00Z"
    }
  ],
  "pagination": {
    "total": 2,
    "limit": 50,
    "offset": 0
  }
}
```

---

#### GET /credits/packages

Get available credit packages for purchase.

**Response (200 OK):**
```json
{
  "packages": [
    {
      "id": "uuid",
      "name": "Starter Pack",
      "credits": 100,
      "priceCents": 99,
      "currency": "EUR",
      "badge": null
    },
    {
      "id": "uuid",
      "name": "Power Pack",
      "credits": 500,
      "priceCents": 499,
      "currency": "EUR",
      "badge": "POPULAR"
    },
    {
      "id": "uuid",
      "name": "Pro Pack",
      "credits": 1000,
      "priceCents": 899,
      "currency": "EUR",
      "badge": "BEST VALUE"
    }
  ]
}
```

---

#### POST /credits/purchase

Initiate credit purchase (webhook from payment provider).

**Request:**
```json
{
  "packageId": "uuid",
  "paymentProvider": "stripe",
  "paymentIntentId": "pi_...",
  "amount": 499
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "transactionId": "uuid",
  "creditsAdded": 500,
  "newBalance": 650
}
```

---

#### GET /credits/operation-costs

Get credit costs for all operations in an app.

**Query Parameters:**
- `appId` (required)

**Response (200 OK):**
```json
{
  "appId": "manadeck",
  "operations": [
    {
      "operation": "DECK_CREATION",
      "cost": 10,
      "displayName": "Create Deck",
      "description": "Create a new flashcard deck"
    },
    {
      "operation": "CARD_CREATION",
      "cost": 2,
      "displayName": "Add Card",
      "description": "Add a single card to a deck"
    }
  ]
}
```

---

### Admin Endpoints

All admin endpoints require `admin` role in JWT.

#### POST /admin/credits/adjust

Manually adjust user credits (admin only).

**Request:**
```json
{
  "userId": "uuid",
  "amount": 100,
  "reason": "Compensation for service issue"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "transactionId": "uuid",
  "newBalance": 250
}
```

---

#### GET /admin/users

List all users with pagination.

**Query Parameters:**
- `limit` (default: 50)
- `offset` (default: 0)
- `search` (optional email search)

**Response (200 OK):**
```json
{
  "users": [...],
  "pagination": {
    "total": 1000,
    "limit": 50,
    "offset": 0
  }
}
```

---

#### PATCH /admin/operation-costs/:id

Update operation cost.

**Request:**
```json
{
  "cost": 15
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "operation": "DECK_CREATION",
  "cost": 15,
  "updatedAt": "2025-11-25T11:00:00Z"
}
```

---

## Authentication Flows

### 1. Email/Password Registration Flow

```
┌─────────┐                ┌──────────┐                ┌──────────┐
│  Client │                │   API    │                │ Database │
└────┬────┘                └────┬─────┘                └────┬─────┘
     │                          │                           │
     │ POST /auth/register      │                           │
     │ {email, password, name}  │                           │
     ├─────────────────────────>│                           │
     │                          │                           │
     │                          │ 1. Hash password (bcrypt) │
     │                          │                           │
     │                          │ BEGIN TRANSACTION         │
     │                          ├──────────────────────────>│
     │                          │                           │
     │                          │ 2. INSERT INTO auth.users │
     │                          ├──────────────────────────>│
     │                          │                           │
     │                          │ 3. Trigger creates balance│
     │                          │<──────────────────────────┤
     │                          │ credits.balances (150)    │
     │                          │                           │
     │                          │ 4. INSERT INTO accounts   │
     │                          ├──────────────────────────>│
     │                          │ (provider='email')        │
     │                          │                           │
     │                          │ 5. Generate verification  │
     │                          │    token                  │
     │                          ├──────────────────────────>│
     │                          │                           │
     │                          │ COMMIT                    │
     │                          │<──────────────────────────┤
     │                          │                           │
     │                          │ 6. Send verification email│
     │                          │    (async)                │
     │                          │                           │
     │                          │ 7. Generate JWT tokens    │
     │                          │    - manaToken            │
     │                          │    - appToken             │
     │                          │    - refreshToken         │
     │                          │                           │
     │ 201 Created              │                           │
     │ {user, tokens,           │                           │
     │  needsVerification: true}│                           │
     │<─────────────────────────┤                           │
     │                          │                           │
```

### 2. OAuth Sign-In Flow (Google/Apple)

```
┌─────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Client │    │   OAuth  │    │   API    │    │ Database │    │  OAuth   │
│         │    │ Provider │    │          │    │          │    │ Provider │
└────┬────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘    │  (G/A)   │
     │              │               │               │           └────┬─────┘
     │ 1. Initiate  │               │               │                │
     │    OAuth     │               │               │                │
     ├─────────────>│               │               │                │
     │              │               │               │                │
     │ 2. User auth │               │               │                │
     │    & consent │               │               │                │
     │<─────────────┤               │               │                │
     │              │               │               │                │
     │ 3. ID Token  │               │               │                │
     │<─────────────┤               │               │                │
     │              │               │               │                │
     │ POST /auth/google-signin    │               │                │
     │ {token, deviceInfo}          │               │                │
     ├─────────────────────────────>│               │                │
     │                              │               │                │
     │                              │ 4. Verify token with provider  │
     │                              ├───────────────────────────────>│
     │                              │                                │
     │                              │ 5. Token valid + user info     │
     │                              │<───────────────────────────────┤
     │                              │                                │
     │                              │ BEGIN TRANSACTION              │
     │                              ├──────────────────────────────>│
     │                              │                               │
     │                              │ 6. Check existing account     │
     │                              │    by provider_account_id     │
     │                              ├──────────────────────────────>│
     │                              │                               │
     │                              │ IF NOT EXISTS:                │
     │                              │ 7a. Create user               │
     │                              │ 7b. Create account            │
     │                              │ 7c. Trigger creates balance   │
     │                              ├──────────────────────────────>│
     │                              │                               │
     │                              │ 8. Create session             │
     │                              ├──────────────────────────────>│
     │                              │                               │
     │                              │ COMMIT                        │
     │                              │<──────────────────────────────┤
     │                              │                               │
     │                              │ 9. Generate JWT tokens        │
     │                              │                               │
     │ 200 OK                       │                               │
     │ {user, tokens, isNewUser}    │                               │
     │<─────────────────────────────┤                               │
     │                              │                               │
```

### 3. Token Refresh Flow

```
┌─────────┐                ┌──────────┐                ┌──────────┐
│  Client │                │   API    │                │ Database │
└────┬────┘                └────┬─────┘                └────┬─────┘
     │                          │                           │
     │ API Request with expired │                           │
     │ manaToken → 401          │                           │
     ├─────────────────────────>│                           │
     │<─────────────────────────┤                           │
     │                          │                           │
     │ POST /auth/refresh       │                           │
     │ {refreshToken, deviceInfo│                           │
     ├─────────────────────────>│                           │
     │                          │                           │
     │                          │ 1. Query session by       │
     │                          │    refresh_token          │
     │                          ├──────────────────────────>│
     │                          │                           │
     │                          │ 2. Validate session       │
     │                          │    - Not expired          │
     │                          │    - Not revoked          │
     │                          │    - Device ID matches    │
     │                          │<──────────────────────────┤
     │                          │                           │
     │                          │ BEGIN TRANSACTION         │
     │                          │                           │
     │                          │ 3. Generate new tokens    │
     │                          │                           │
     │                          │ 4. Update session         │
     │                          │    - new session_token    │
     │                          │    - new refresh_token    │
     │                          │    - extends expires_at   │
     │                          ├──────────────────────────>│
     │                          │                           │
     │                          │ COMMIT                    │
     │                          │<──────────────────────────┤
     │                          │                           │
     │ 200 OK                   │                           │
     │ {tokens}                 │                           │
     │<─────────────────────────┤                           │
     │                          │                           │
     │ Retry original API call  │                           │
     │ with new manaToken       │                           │
     ├─────────────────────────>│                           │
     │                          │                           │
```

### JWT Token Structure

#### manaToken (Internal Use)

```json
{
  "sub": "user_uuid",
  "email": "user@example.com",
  "role": "user",
  "app_id": "manadeck",
  "session_id": "session_uuid",
  "exp": 1732540800,
  "iat": 1732537200,
  "iss": "mana-core",
  "aud": "mana-ecosystem"
}
```

#### appToken (Supabase-Compatible)

```json
{
  "sub": "user_uuid",
  "email": "user@example.com",
  "role": "authenticated",
  "app_id": "manadeck",
  "aud": "authenticated",
  "exp": 1732540800,
  "iat": 1732537200,
  "iss": "mana-core",
  "user_metadata": {
    "email": "user@example.com"
  },
  "app_settings": {
    "b2b": {
      "disableRevenueCat": false
    }
  }
}
```

---

## Credit Transaction Logic

### Transaction Workflow

All credit operations follow this pattern:

```typescript
async function performCreditOperation(
  userId: string,
  appId: string,
  operation: string,
  description: string,
  metadata?: Record<string, any>
): Promise<TransactionResult> {
  // Use database transaction for atomicity
  return await db.transaction(async (tx) => {
    // 1. Get operation cost
    const operationCost = await tx.query.operationCosts.findFirst({
      where: and(
        eq(operationCosts.appId, appId),
        eq(operationCosts.operation, operation),
        eq(operationCosts.active, true)
      )
    });

    if (!operationCost) {
      throw new NotFoundError(`Operation ${operation} not found for app ${appId}`);
    }

    // 2. Lock user's balance row (SELECT FOR UPDATE)
    const balance = await tx
      .select()
      .from(balances)
      .where(eq(balances.userId, userId))
      .for('update');

    if (!balance || balance.length === 0) {
      throw new NotFoundError('User balance not found');
    }

    const currentBalance = balance[0].balance;
    const requiredAmount = operationCost.cost;

    // 3. Check sufficient credits
    if (currentBalance < requiredAmount) {
      throw new InsufficientCreditsError({
        currentBalance,
        requiredAmount,
        shortfall: requiredAmount - currentBalance
      });
    }

    // 4. Calculate new balance
    const newBalance = currentBalance - requiredAmount;

    // 5. Update balance
    await tx
      .update(balances)
      .set({
        balance: newBalance,
        totalSpent: sql`total_spent + ${requiredAmount}`,
        updatedAt: new Date()
      })
      .where(eq(balances.userId, userId));

    // 6. Create transaction record
    const [transaction] = await tx
      .insert(transactions)
      .values({
        userId,
        type: 'usage',
        operation,
        amount: -requiredAmount,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        appId,
        description,
        metadata: metadata || {},
        createdAt: new Date()
      })
      .returning();

    // 7. Trigger webhook (async, outside transaction)
    process.nextTick(() => {
      triggerWebhook('credit.updated', {
        userId,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        transactionId: transaction.id,
        operation,
        appId
      });
    });

    return {
      success: true,
      transactionId: transaction.id,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      amountDeducted: requiredAmount
    };
  });
}
```

### Validation Workflow (Pre-Flight Check)

```typescript
async function validateCredits(
  userId: string,
  appId: string,
  operation: string
): Promise<ValidationResult> {
  // No transaction needed - read-only

  // 1. Get operation cost
  const operationCost = await db.query.operationCosts.findFirst({
    where: and(
      eq(operationCosts.appId, appId),
      eq(operationCosts.operation, operation),
      eq(operationCosts.active, true)
    )
  });

  if (!operationCost) {
    throw new NotFoundError(`Operation ${operation} not found`);
  }

  // 2. Get current balance
  const balance = await db.query.balances.findFirst({
    where: eq(balances.userId, userId)
  });

  if (!balance) {
    throw new NotFoundError('User balance not found');
  }

  const hasCredits = balance.balance >= operationCost.cost;
  const shortfall = hasCredits ? 0 : operationCost.cost - balance.balance;

  return {
    hasCredits,
    currentBalance: balance.balance,
    requiredAmount: operationCost.cost,
    balanceAfter: hasCredits ? balance.balance - operationCost.cost : null,
    shortfall,
    operationCost: operationCost.cost
  };
}
```

### Purchase Workflow

```typescript
async function purchaseCredits(
  userId: string,
  packageId: string,
  paymentProvider: string,
  paymentReferenceId: string
): Promise<PurchaseResult> {
  return await db.transaction(async (tx) => {
    // 1. Get package details
    const pkg = await tx.query.packages.findFirst({
      where: and(
        eq(packages.id, packageId),
        eq(packages.active, true)
      )
    });

    if (!pkg) {
      throw new NotFoundError('Package not found');
    }

    // 2. Lock balance
    const balance = await tx
      .select()
      .from(balances)
      .where(eq(balances.userId, userId))
      .for('update');

    const currentBalance = balance[0].balance;
    const newBalance = currentBalance + pkg.credits;

    // 3. Check max credit limit
    if (newBalance > balance[0].maxCreditLimit) {
      throw new Error(`Exceeds maximum credit limit of ${balance[0].maxCreditLimit}`);
    }

    // 4. Update balance
    await tx
      .update(balances)
      .set({
        balance: newBalance,
        totalEarned: sql`total_earned + ${pkg.credits}`,
        totalPurchased: sql`total_purchased + ${pkg.credits}`,
        updatedAt: new Date()
      })
      .where(eq(balances.userId, userId));

    // 5. Create transaction
    const [transaction] = await tx
      .insert(transactions)
      .values({
        userId,
        type: 'purchase',
        operation: 'CREDIT_PURCHASE',
        amount: pkg.credits,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        appId: 'system',
        description: `Purchased ${pkg.name}`,
        metadata: {
          packageId: pkg.id,
          packageName: pkg.name,
          priceCents: pkg.priceCents,
          currency: pkg.currency
        },
        referenceId: paymentReferenceId,
        createdAt: new Date()
      })
      .returning();

    // 6. Trigger webhook
    process.nextTick(() => {
      triggerWebhook('credit.purchased', {
        userId,
        creditsAdded: pkg.credits,
        newBalance,
        transactionId: transaction.id,
        packageName: pkg.name
      });
    });

    return {
      success: true,
      transactionId: transaction.id,
      creditsAdded: pkg.credits,
      newBalance
    };
  });
}
```

### Daily Credit Claim

```typescript
async function claimDailyCredits(
  userId: string
): Promise<ClaimResult> {
  return await db.transaction(async (tx) => {
    // 1. Lock balance
    const balance = await tx
      .select()
      .from(balances)
      .where(eq(balances.userId, userId))
      .for('update');

    const today = new Date().toISOString().split('T')[0];
    const lastClaimDate = balance[0].lastDailyCreditAt?.toISOString().split('T')[0];

    // 2. Check if already claimed today
    if (lastClaimDate === today) {
      throw new Error('Daily credits already claimed today');
    }

    const dailyAmount = balance[0].dailyFreeCredits;
    const currentBalance = balance[0].balance;
    const newBalance = currentBalance + dailyAmount;

    // 3. Update balance
    await tx
      .update(balances)
      .set({
        balance: newBalance,
        totalEarned: sql`total_earned + ${dailyAmount}`,
        lastDailyCreditAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(balances.userId, userId));

    // 4. Create transaction
    const [transaction] = await tx
      .insert(transactions)
      .values({
        userId,
        type: 'daily_bonus',
        operation: 'DAILY_CLAIM',
        amount: dailyAmount,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        appId: 'system',
        description: 'Daily free credits',
        createdAt: new Date()
      })
      .returning();

    return {
      success: true,
      creditsAdded: dailyAmount,
      newBalance,
      nextClaimAt: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString()
    };
  });
}
```

---

## Integration Patterns

### Mobile App Integration (React Native + Expo)

#### 1. Setup Auth Service

```typescript
// features/auth/services/authService.ts
import { createAuthService } from '@manacore/shared-auth';

export const authService = createAuthService({
  baseUrl: process.env.EXPO_PUBLIC_MIDDLEWARE_API_URL!,
  storageKeys: {
    APP_TOKEN: '@auth/appToken',
    REFRESH_TOKEN: '@auth/refreshToken',
    USER_EMAIL: '@auth/userEmail'
  }
});
```

#### 2. Setup Credit Service

```typescript
// features/credits/creditService.ts
export class CreditService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.EXPO_PUBLIC_MIDDLEWARE_API_URL!;
  }

  async getBalance(): Promise<CreditBalance> {
    const token = await authService.getAppToken();
    const response = await fetch(`${this.baseUrl}/credits/balance`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch credits');
    }

    return response.json();
  }

  async validateOperation(
    appId: string,
    operation: string
  ): Promise<ValidationResult> {
    const token = await authService.getAppToken();
    const response = await fetch(`${this.baseUrl}/credits/validate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ appId, operation })
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.error === 'insufficient_credits') {
        throw new InsufficientCreditsError(data);
      }
      throw new Error(data.message);
    }

    return data;
  }

  async deductCredits(
    appId: string,
    operation: string,
    description: string,
    metadata?: Record<string, any>
  ): Promise<TransactionResult> {
    const token = await authService.getAppToken();
    const response = await fetch(`${this.baseUrl}/credits/deduct`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        appId,
        operation,
        description,
        metadata
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message);
    }

    return data;
  }
}

export const creditService = new CreditService();
```

#### 3. Usage in Component

```typescript
// app/(protected)/decks/create.tsx
import { useState } from 'react';
import { creditService } from '~/features/credits/creditService';
import { InsufficientCreditsModal } from '~/components/InsufficientCreditsModal';

export default function CreateDeckScreen() {
  const [loading, setLoading] = useState(false);
  const [showInsufficientCredits, setShowInsufficientCredits] = useState(false);
  const [creditError, setCreditError] = useState(null);

  const handleCreateDeck = async (deckData: DeckInput) => {
    setLoading(true);

    try {
      // 1. Validate credits BEFORE operation
      await creditService.validateOperation('manadeck', 'DECK_CREATION');

      // 2. Perform the actual operation
      const deck = await deckApi.createDeck(deckData);

      // 3. Deduct credits AFTER success
      await creditService.deductCredits(
        'manadeck',
        'DECK_CREATION',
        `Created deck: ${deckData.name}`,
        { deckId: deck.id }
      );

      // 4. Success!
      navigation.navigate('DeckDetail', { deckId: deck.id });

    } catch (error) {
      if (error instanceof InsufficientCreditsError) {
        setCreditError(error);
        setShowInsufficientCredits(true);
      } else {
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      {/* Your form UI */}

      <InsufficientCreditsModal
        visible={showInsufficientCredits}
        requiredCredits={creditError?.requiredAmount}
        availableCredits={creditError?.currentBalance}
        onClose={() => setShowInsufficientCredits(false)}
        onPurchase={() => navigation.navigate('CreditStore')}
      />
    </View>
  );
}
```

---

### Web App Integration (SvelteKit)

#### 1. Setup Server-Side Auth

```typescript
// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export const handle: Handle = async ({ event, resolve }) => {
  const authHeader = event.request.headers.get('authorization');

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      event.locals.user = decoded;
    } catch (error) {
      // Invalid token
      event.locals.user = null;
    }
  }

  return resolve(event);
};
```

#### 2. Create Credit Store

```typescript
// src/lib/stores/credits.svelte.ts
import { writable, derived } from 'svelte/store';

interface CreditState {
  balance: number;
  maxCreditLimit: number;
  loading: boolean;
}

function createCreditStore() {
  const { subscribe, set, update } = writable<CreditState>({
    balance: 0,
    maxCreditLimit: 1000,
    loading: false
  });

  return {
    subscribe,

    async fetchBalance() {
      update(state => ({ ...state, loading: true }));

      try {
        const response = await fetch('/api/credits/balance');
        const data = await response.json();

        set({
          balance: data.balance,
          maxCreditLimit: data.maxCreditLimit,
          loading: false
        });
      } catch (error) {
        console.error('Failed to fetch credits:', error);
        update(state => ({ ...state, loading: false }));
      }
    },

    updateBalance(newBalance: number) {
      update(state => ({ ...state, balance: newBalance }));
    }
  };
}

export const credits = createCreditStore();
```

#### 3. API Route for Credits

```typescript
// src/routes/api/credits/balance/+server.ts
import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals, fetch }) => {
  if (!locals.user) {
    throw error(401, 'Unauthorized');
  }

  const response = await fetch(
    `${process.env.MIDDLEWARE_URL}/credits/balance`,
    {
      headers: {
        'Authorization': `Bearer ${locals.session?.accessToken}`
      }
    }
  );

  if (!response.ok) {
    throw error(response.status, 'Failed to fetch credits');
  }

  const data = await response.json();
  return json(data);
};
```

#### 4. Usage in Component

```svelte
<!-- src/routes/(app)/decks/create/+page.svelte -->
<script lang="ts">
  import { credits } from '$lib/stores/credits.svelte';
  import InsufficientCreditsModal from '$lib/components/InsufficientCreditsModal.svelte';

  let deckName = $state('');
  let loading = $state(false);
  let showInsufficientCredits = $state(false);

  async function handleSubmit() {
    loading = true;

    try {
      // Validate credits
      const validation = await fetch('/api/credits/validate', {
        method: 'POST',
        body: JSON.stringify({
          appId: 'manadeck',
          operation: 'DECK_CREATION'
        })
      });

      if (!validation.ok) {
        const error = await validation.json();
        if (error.error === 'insufficient_credits') {
          showInsufficientCredits = true;
          return;
        }
        throw new Error(error.message);
      }

      // Create deck
      const response = await fetch('/api/decks', {
        method: 'POST',
        body: JSON.stringify({ name: deckName })
      });

      const deck = await response.json();

      // Deduct credits
      await fetch('/api/credits/deduct', {
        method: 'POST',
        body: JSON.stringify({
          appId: 'manadeck',
          operation: 'DECK_CREATION',
          description: `Created deck: ${deckName}`,
          metadata: { deckId: deck.id }
        })
      });

      // Update local credit balance
      await credits.fetchBalance();

      // Navigate to deck
      goto(`/decks/${deck.id}`);

    } catch (error) {
      alert(error.message);
    } finally {
      loading = false;
    }
  }
</script>

<form onsubmit={handleSubmit}>
  <input bind:value={deckName} placeholder="Deck name" />
  <button disabled={loading}>Create Deck (10 credits)</button>
</form>

<InsufficientCreditsModal
  bind:visible={showInsufficientCredits}
  requiredCredits={10}
  currentCredits={$credits.balance}
/>
```

---

### Backend Integration (NestJS)

#### 1. Module Setup

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ManaCoreModule } from '@mana-core/nestjs-integration';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ManaCoreModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        serviceKey: config.get('MANA_CORE_SERVICE_KEY'),
        baseUrl: config.get('MANA_CORE_URL'),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

#### 2. Protected Controller

```typescript
// src/decks/decks.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUser } from '@mana-core/nestjs-integration';
import { CreditClientService } from '@mana-core/nestjs-integration';

@Controller('api/decks')
@UseGuards(AuthGuard)
export class DecksController {
  constructor(
    private readonly decksService: DecksService,
    private readonly creditClient: CreditClientService,
  ) {}

  @Post()
  async createDeck(
    @CurrentUser() user: any,
    @Body() createDeckDto: CreateDeckDto,
  ) {
    const appId = 'manadeck';
    const operation = 'DECK_CREATION';

    // 1. Validate credits
    const validation = await this.creditClient.validateCredits(
      user.sub,
      appId,
      operation,
    );

    if (!validation.hasCredits) {
      throw new BadRequestException({
        error: 'insufficient_credits',
        message: `Insufficient credits. Required: ${validation.requiredAmount}, Available: ${validation.currentBalance}`,
        requiredAmount: validation.requiredAmount,
        currentBalance: validation.currentBalance,
        shortfall: validation.shortfall,
      });
    }

    // 2. Create the deck
    const deck = await this.decksService.create(user.sub, createDeckDto);

    // 3. Deduct credits
    await this.creditClient.deductCredits(
      user.sub,
      appId,
      operation,
      `Created deck: ${deck.name}`,
      { deckId: deck.id },
    );

    return {
      success: true,
      deck,
      creditsUsed: validation.requiredAmount,
    };
  }
}
```

---

## Migration Scripts

### Complete Migration SQL

```sql
-- ============================================
-- Mana Core Database Schema
-- Version: 1.0
-- Date: 2025-11-25
-- ============================================

-- Create schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS credits;
CREATE SCHEMA IF NOT EXISTS app_data;
CREATE SCHEMA IF NOT EXISTS webhooks;

-- ============================================
-- AUTH SCHEMA
-- ============================================

-- 1. Users table
CREATE TABLE auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMPTZ,
  name TEXT,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ,
  CONSTRAINT users_email_lowercase CHECK (email = LOWER(email))
);

CREATE INDEX idx_users_email ON auth.users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created_at ON auth.users(created_at);
CREATE INDEX idx_users_deleted_at ON auth.users(deleted_at) WHERE deleted_at IS NOT NULL;

-- 2. Accounts table
CREATE TABLE auth.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(provider, provider_account_id)
);

CREATE INDEX idx_accounts_user_id ON auth.accounts(user_id);
CREATE INDEX idx_accounts_provider ON auth.accounts(provider);
CREATE UNIQUE INDEX idx_accounts_provider_account ON auth.accounts(provider, provider_account_id);

-- 3. Sessions table
CREATE TABLE auth.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  refresh_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_active_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  device_id TEXT,
  device_name TEXT,
  device_type TEXT,
  platform TEXT,
  ip_address INET,
  user_agent TEXT,
  app_id TEXT NOT NULL,
  revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_sessions_user_id ON auth.sessions(user_id);
CREATE INDEX idx_sessions_session_token ON auth.sessions(session_token) WHERE NOT revoked;
CREATE INDEX idx_sessions_refresh_token ON auth.sessions(refresh_token) WHERE NOT revoked;
CREATE INDEX idx_sessions_expires_at ON auth.sessions(expires_at);
CREATE INDEX idx_sessions_app_id ON auth.sessions(app_id);
CREATE INDEX idx_sessions_device_id ON auth.sessions(device_id);

-- 4. Password reset tokens
CREATE TABLE auth.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  used_at TIMESTAMPTZ
);

CREATE INDEX idx_password_reset_tokens_user_id ON auth.password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token ON auth.password_reset_tokens(token) WHERE used_at IS NULL;
CREATE INDEX idx_password_reset_tokens_expires_at ON auth.password_reset_tokens(expires_at);

-- 5. Email verification tokens
CREATE TABLE auth.email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  verified_at TIMESTAMPTZ
);

CREATE INDEX idx_email_verification_tokens_user_id ON auth.email_verification_tokens(user_id);
CREATE INDEX idx_email_verification_tokens_token ON auth.email_verification_tokens(token) WHERE verified_at IS NULL;
CREATE INDEX idx_email_verification_tokens_expires_at ON auth.email_verification_tokens(expires_at);

-- ============================================
-- CREDITS SCHEMA
-- ============================================

-- 6. Credit balances
CREATE TABLE credits.balances (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  max_credit_limit INTEGER NOT NULL DEFAULT 1000,
  free_credits_remaining INTEGER NOT NULL DEFAULT 150,
  daily_free_credits INTEGER NOT NULL DEFAULT 5,
  last_daily_credit_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  total_earned INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  total_purchased INTEGER DEFAULT 0
);

CREATE INDEX idx_balances_balance ON credits.balances(balance);
CREATE INDEX idx_balances_updated_at ON credits.balances(updated_at);

-- 7. Transactions
CREATE TABLE credits.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  operation TEXT NOT NULL,
  amount INTEGER NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  app_id TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  reference_id TEXT,
  related_transaction_id UUID REFERENCES credits.transactions(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CHECK (
    (type = 'usage' AND amount < 0) OR
    (type IN ('purchase', 'refund', 'admin_adjustment', 'daily_bonus', 'signup_bonus') AND amount > 0) OR
    (type = 'admin_adjustment')
  )
);

CREATE INDEX idx_transactions_user_id ON credits.transactions(user_id);
CREATE INDEX idx_transactions_type ON credits.transactions(type);
CREATE INDEX idx_transactions_app_id ON credits.transactions(app_id);
CREATE INDEX idx_transactions_operation ON credits.transactions(operation);
CREATE INDEX idx_transactions_created_at ON credits.transactions(created_at DESC);
CREATE INDEX idx_transactions_reference_id ON credits.transactions(reference_id) WHERE reference_id IS NOT NULL;
CREATE INDEX idx_transactions_metadata ON credits.transactions USING GIN(metadata);

-- 8. Packages
CREATE TABLE credits.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  credits INTEGER NOT NULL CHECK (credits > 0),
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'EUR',
  description TEXT,
  badge TEXT,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_packages_active ON credits.packages(active, sort_order);

-- 9. Operation costs
CREATE TABLE credits.operation_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  cost INTEGER NOT NULL CHECK (cost >= 0),
  display_name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(app_id, operation)
);

CREATE INDEX idx_operation_costs_app_id ON credits.operation_costs(app_id);
CREATE INDEX idx_operation_costs_active ON credits.operation_costs(active);
CREATE UNIQUE INDEX idx_operation_costs_app_operation ON credits.operation_costs(app_id, operation) WHERE active;

-- ============================================
-- APP DATA SCHEMA
-- ============================================

-- 10. User settings
CREATE TABLE app_data.user_settings (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id TEXT NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (user_id, app_id)
);

CREATE INDEX idx_user_settings_app_id ON app_data.user_settings(app_id);
CREATE INDEX idx_user_settings_settings ON app_data.user_settings USING GIN(settings);

-- ============================================
-- WEBHOOKS SCHEMA
-- ============================================

-- 11. Webhook endpoints
CREATE TABLE webhooks.endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{credit.updated, credit.low_balance}',
  active BOOLEAN DEFAULT true,
  max_retries INTEGER DEFAULT 3,
  retry_delay_seconds INTEGER DEFAULT 60,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_webhook_endpoints_app_id ON webhooks.endpoints(app_id);
CREATE INDEX idx_webhook_endpoints_active ON webhooks.endpoints(active);

-- 12. Webhook delivery log
CREATE TABLE webhooks.delivery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID NOT NULL REFERENCES webhooks.endpoints(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL,
  attempt_count INTEGER DEFAULT 0,
  response_status_code INTEGER,
  response_body TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  delivered_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ
);

CREATE INDEX idx_delivery_log_endpoint_id ON webhooks.delivery_log(endpoint_id);
CREATE INDEX idx_delivery_log_status ON webhooks.delivery_log(status);
CREATE INDEX idx_delivery_log_created_at ON webhooks.delivery_log(created_at DESC);
CREATE INDEX idx_delivery_log_next_retry ON webhooks.delivery_log(next_retry_at) WHERE status = 'retrying';

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Update timestamp trigger function (auth)
CREATE OR REPLACE FUNCTION auth.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update timestamp trigger function (credits)
CREATE OR REPLACE FUNCTION credits.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update timestamp trigger function (app_data)
CREATE OR REPLACE FUNCTION app_data.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create balance for new users
CREATE OR REPLACE FUNCTION credits.create_balance_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO credits.balances (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update session last active
CREATE OR REPLACE FUNCTION auth.update_session_last_active()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_active_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auth.update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON auth.accounts
  FOR EACH ROW
  EXECUTE FUNCTION auth.update_updated_at_column();

CREATE TRIGGER update_balances_updated_at
  BEFORE UPDATE ON credits.balances
  FOR EACH ROW
  EXECUTE FUNCTION credits.update_updated_at_column();

CREATE TRIGGER update_packages_updated_at
  BEFORE UPDATE ON credits.packages
  FOR EACH ROW
  EXECUTE FUNCTION credits.update_updated_at_column();

CREATE TRIGGER update_operation_costs_updated_at
  BEFORE UPDATE ON credits.operation_costs
  FOR EACH ROW
  EXECUTE FUNCTION credits.update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON app_data.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION app_data.update_updated_at_column();

CREATE TRIGGER create_balance_on_user_creation
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION credits.create_balance_for_new_user();

CREATE TRIGGER update_sessions_last_active
  BEFORE UPDATE ON auth.sessions
  FOR EACH ROW
  WHEN (OLD.session_token IS DISTINCT FROM NEW.session_token OR OLD.refresh_token IS DISTINCT FROM NEW.refresh_token)
  EXECUTE FUNCTION auth.update_session_last_active();

-- ============================================
-- SEED DATA
-- ============================================

-- Credit packages
INSERT INTO credits.packages (name, credits, price_cents, badge, sort_order) VALUES
  ('Starter Pack', 100, 99, NULL, 1),
  ('Power Pack', 500, 499, 'POPULAR', 2),
  ('Pro Pack', 1000, 899, 'BEST VALUE', 3),
  ('Ultimate Pack', 5000, 3999, NULL, 4);

-- Operation costs for Manadeck
INSERT INTO credits.operation_costs (app_id, operation, cost, display_name, description) VALUES
  ('manadeck', 'DECK_CREATION', 10, 'Create Deck', 'Create a new flashcard deck'),
  ('manadeck', 'CARD_CREATION', 2, 'Add Card', 'Add a single card to a deck'),
  ('manadeck', 'AI_CARD_GENERATION', 5, 'AI Card Generation', 'Generate a card using AI'),
  ('manadeck', 'DECK_EXPORT', 3, 'Export Deck', 'Export deck to various formats');

-- Operation costs for Maerchenzauber
INSERT INTO credits.operation_costs (app_id, operation, cost, display_name, description) VALUES
  ('maerchenzauber', 'STORY_GENERATION', 50, 'Generate Story', 'Generate a new AI story'),
  ('maerchenzauber', 'CHARACTER_CREATION', 20, 'Create Character', 'Create a custom character'),
  ('maerchenzauber', 'IMAGE_GENERATION', 30, 'Generate Image', 'Generate story illustration');

-- Operation costs for Memoro
INSERT INTO credits.operation_costs (app_id, operation, cost, display_name, description) VALUES
  ('memoro', 'TRANSCRIPTION_PER_HOUR', 120, 'Audio Transcription', 'Per hour of audio transcribed'),
  ('memoro', 'HEADLINE_GENERATION', 10, 'Generate Headline', 'AI-generated memo headline'),
  ('memoro', 'MEMORY_CREATION', 10, 'Create Memory', 'Generate memory from memo'),
  ('memoro', 'BLUEPRINT_PROCESSING', 5, 'Process Blueprint', 'Apply AI blueprint to memo');

-- Operation costs for Picture
INSERT INTO credits.operation_costs (app_id, operation, cost, display_name, description) VALUES
  ('picture', 'IMAGE_GENERATION', 25, 'Generate Image', 'AI image generation'),
  ('picture', 'IMAGE_UPSCALE', 15, 'Upscale Image', 'Upscale image quality'),
  ('picture', 'STYLE_TRANSFER', 20, 'Style Transfer', 'Apply style to image');

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON SCHEMA auth IS 'Authentication and user management';
COMMENT ON SCHEMA credits IS 'Credit system and transactions';
COMMENT ON SCHEMA app_data IS 'Application-specific user data';
COMMENT ON SCHEMA webhooks IS 'Webhook system for events';

COMMENT ON TABLE auth.users IS 'Core user identity table compatible with Better Auth';
COMMENT ON TABLE auth.accounts IS 'OAuth and social login provider accounts';
COMMENT ON TABLE auth.sessions IS 'Active user sessions for multi-device support';
COMMENT ON TABLE auth.password_reset_tokens IS 'Temporary tokens for password reset';
COMMENT ON TABLE auth.email_verification_tokens IS 'Tokens for email verification';

COMMENT ON TABLE credits.balances IS 'Current credit balance per user (single source of truth)';
COMMENT ON TABLE credits.transactions IS 'Complete audit trail of all credit operations';
COMMENT ON TABLE credits.packages IS 'Available credit packages for purchase';
COMMENT ON TABLE credits.operation_costs IS 'Credit costs per operation per app';

COMMENT ON TABLE app_data.user_settings IS 'Per-app user preferences and settings';

COMMENT ON TABLE webhooks.endpoints IS 'Registered webhooks for apps';
COMMENT ON TABLE webhooks.delivery_log IS 'Audit trail of webhook deliveries';
```

---

## Summary

This design provides:

1. **Complete Database Schema**: Better Auth compatible, atomic transactions, audit trails
2. **RESTful API**: Authentication, user management, credits, admin endpoints
3. **Authentication Flows**: Email/password, OAuth (Google/Apple), token refresh
4. **Credit Transaction Logic**: Atomic operations, validation, purchases, daily bonuses
5. **Integration Patterns**: Mobile (React Native), Web (SvelteKit), Backend (NestJS)
6. **Migration Script**: Ready-to-execute SQL with all tables, indexes, triggers, and seed data

The system is production-ready and designed for:
- Scalability (indexed queries, efficient transactions)
- Security (RLS policies, JWT validation)
- Auditability (complete transaction history)
- Flexibility (JSONB metadata, app-specific settings)
- Multi-tenancy (app_id tracking throughout)
