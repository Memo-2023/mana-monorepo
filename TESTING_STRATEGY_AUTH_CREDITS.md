# Comprehensive Testing Strategy: Authentication & Mana Credit System

**Project:** Manacore Monorepo - Central Auth & Credit System
**Version:** 1.0
**Date:** 2025-11-25
**Status:** DRAFT

---

## Executive Summary

This document provides a comprehensive testing strategy for the central authentication and mana credit system used across all Manacore applications (Memoro, Maerchenzauber, Manadeck, Picture, Chat). The strategy covers functional testing, security testing, integration testing, performance testing, and acceptance criteria.

### Critical Business Paths
1. **User Registration → Authentication → Service Access**
2. **Credit Purchase → Balance Update → Credit Consumption → Balance Deduction**
3. **Multi-App Credit Visibility & Usage**
4. **Token Refresh & Session Management**

---

## 1. Authentication Testing

### 1.1 Registration Flow Tests

#### TC-AUTH-REG-001: Email/Password Registration
**Priority:** P0 (Critical)
**Description:** User creates account with email and password

**Test Steps:**
1. Submit valid email and password (8+ chars, complexity requirements)
2. Verify account created in database
3. Check email verification sent (if applicable)
4. Verify tokens generated (manaToken, appToken, refreshToken)
5. Confirm tokens stored securely

**Expected Results:**
- User record created with UUID
- Three tokens generated and returned
- Tokens stored in secure storage (SecureStore on mobile, localStorage on web)
- Email verification sent if configured
- User can access protected routes

**Edge Cases:**
- Email already exists → 409 error with appropriate message
- Invalid email format → 400 error
- Weak password → 400 error with requirements
- Network timeout during registration → Retry mechanism
- Duplicate concurrent registrations → Second request fails

**Test Data:**
```javascript
{
  valid: { email: "test+valid@example.com", password: "SecureP@ss123" },
  duplicate: { email: "existing@example.com", password: "AnyP@ss123" },
  invalid_email: { email: "not-an-email", password: "SecureP@ss123" },
  weak_password: { email: "test@example.com", password: "123" }
}
```

#### TC-AUTH-REG-002: Google Sign-In Registration
**Priority:** P0 (Critical)

**Test Steps:**
1. Initiate Google OAuth flow
2. User authorizes in Google
3. Receive idToken from Google
4. Submit idToken to `/auth/google-signin`
5. Verify account created or linked
6. Check tokens generated

**Expected Results:**
- New user: Account created with Google profile data
- Existing user: Linked to existing account
- Email extracted from Google profile
- Standard token set issued

**Edge Cases:**
- Invalid idToken → 401 error
- Google service unavailable → Graceful error message
- Email conflict with existing email/password account → Link accounts

#### TC-AUTH-REG-003: Apple Sign-In Registration
**Priority:** P1 (High)

**Test Steps:**
1. Initiate Apple Sign In flow
2. User authorizes in Apple
3. Receive identityToken from Apple
4. Submit identityToken to `/auth/apple-signin`
5. Verify account created
6. Check tokens generated

**Expected Results:**
- Account created with Apple ID
- Email may be private relay email
- Tokens issued correctly
- User can access services

**Edge Cases:**
- Private email relay handling
- First-time vs returning user
- Revoked Apple credentials

### 1.2 Login Flow Tests

#### TC-AUTH-LOGIN-001: Successful Email/Password Login
**Priority:** P0 (Critical)

**Test Steps:**
1. Submit valid credentials to `/auth/signin`
2. Verify response contains all three tokens
3. Check tokens stored in secure storage
4. Verify user data extracted from appToken
5. Confirm access to protected resources

**Expected Results:**
- 200 status code
- Tokens returned: `{ appToken, refreshToken }`
- manaToken embedded in appToken claims
- User email stored locally
- AuthContext updated with user state

**Validation Points:**
- Token structure: JWT format validation
- Token claims: `sub` (user ID), `role`, `app_id`, `exp`, `iat`
- Token expiration: appToken ~1 hour, refreshToken ~30 days
- Storage success: All tokens persisted

#### TC-AUTH-LOGIN-002: Invalid Credentials
**Priority:** P0 (Critical)

**Test Steps:**
1. Submit incorrect password
2. Submit non-existent email
3. Verify appropriate error messages
4. Check no tokens issued
5. Ensure secure storage remains empty

**Expected Results:**
- 401 Unauthorized status
- Error: `INVALID_CREDENTIALS`
- No tokens in response
- No data written to storage
- User remains unauthenticated

#### TC-AUTH-LOGIN-003: Email Not Verified
**Priority:** P1 (High)

**Test Steps:**
1. Create account without verifying email
2. Attempt login
3. Verify error response

**Expected Results:**
- 403 Forbidden status
- Error: `EMAIL_NOT_VERIFIED`
- Prompt to check email for verification link
- No tokens issued

#### TC-AUTH-LOGIN-004: Firebase User Password Reset Required
**Priority:** P1 (High)

**Test Steps:**
1. Login as Firebase-migrated user
2. Verify password reset error
3. Check reset flow initiated

**Expected Results:**
- 401 status with specific error code
- Error: `FIREBASE_USER_PASSWORD_RESET_REQUIRED`
- User directed to password reset flow
- Password reset email sent

### 1.3 Logout Flow Tests

#### TC-AUTH-LOGOUT-001: Standard Logout
**Priority:** P0 (Critical)

**Test Steps:**
1. Authenticate user
2. Call `/auth/logout` with refreshToken
3. Verify tokens cleared from storage
4. Check server-side session invalidated
5. Attempt to use old tokens

**Expected Results:**
- All tokens removed from secure storage
- Server-side refresh token invalidated
- Subsequent API calls with old tokens fail with 401
- User redirected to login screen
- AuthContext reset to unauthenticated state

#### TC-AUTH-LOGOUT-002: Logout with Network Failure
**Priority:** P2 (Medium)

**Test Steps:**
1. Authenticate user
2. Disable network
3. Call logout
4. Verify local cleanup happens

**Expected Results:**
- Local tokens cleared even if server unreachable
- User marked as logged out in UI
- Server-side cleanup attempted with retry
- Graceful error handling

### 1.4 Token Refresh Tests

#### TC-AUTH-REFRESH-001: Automatic Token Refresh on Expiry
**Priority:** P0 (Critical)

**Test Steps:**
1. Login with valid credentials
2. Wait for appToken to expire (or manually expire)
3. Make API call that triggers 401
4. Verify automatic refresh initiated
5. Check new tokens issued
6. Confirm original API call succeeds

**Expected Results:**
- TokenManager detects expiry
- Refresh endpoint called with refreshToken
- New appToken and refreshToken returned
- Tokens updated in storage
- Original API request retried and succeeds
- No user interaction required

**Performance Criteria:**
- Refresh completes in < 2 seconds
- User experiences no disruption
- UI shows loading state during refresh

#### TC-AUTH-REFRESH-002: Concurrent Refresh Prevention
**Priority:** P0 (Critical)

**Test Steps:**
1. Trigger multiple API calls simultaneously with expired token
2. Verify only ONE refresh request sent
3. Check all requests queued during refresh
4. Confirm all succeed after refresh completes

**Expected Results:**
- Single refresh promise shared
- Request queue manages pending calls
- All queued requests processed with new token
- No duplicate refresh attempts
- Queue timeout: 30 seconds max

**Test Implementation:**
```typescript
// Simulate 5 concurrent API calls with expired token
const requests = Array(5).fill(null).map(() =>
  fetch('/api/protected-resource')
);
await Promise.all(requests);
// Verify only 1 refresh API call made
```

#### TC-AUTH-REFRESH-003: Refresh Token Expiration
**Priority:** P0 (Critical)

**Test Steps:**
1. Manually expire refreshToken
2. Attempt to refresh
3. Verify error handling
4. Check user logged out

**Expected Results:**
- Refresh fails with 401
- Error: "Session expired. Please sign in again."
- All tokens cleared
- User redirected to login
- Clear error message displayed

#### TC-AUTH-REFRESH-004: Device ID Change Detection
**Priority:** P1 (High)

**Test Steps:**
1. Login on device A
2. Copy tokens to device B (different device ID)
3. Attempt token refresh on device B
4. Verify security check fails

**Expected Results:**
- Refresh denied
- Error: "Device ID has changed. Please sign in again."
- Tokens invalidated
- User must re-authenticate

### 1.5 Session Management Tests

#### TC-AUTH-SESSION-001: Multi-Device Login
**Priority:** P1 (High)

**Test Steps:**
1. Login on device A (iOS)
2. Login same user on device B (Android)
3. Login same user on device C (Web)
4. Verify all devices have valid sessions
5. Test concurrent API calls from all devices

**Expected Results:**
- All devices independently authenticated
- Each device has unique refreshToken
- All devices share same user ID
- Concurrent usage works correctly
- Token refresh on one device doesn't affect others

#### TC-AUTH-SESSION-002: Multi-App Session Sharing
**Priority:** P0 (Critical)

**Test Steps:**
1. Login to Memoro app
2. Navigate to Maerchenzauber app
3. Verify SSO (single sign-on) behavior
4. Check credits visible across apps

**Expected Results:**
- User authenticated in both apps
- No duplicate login required (if SSO configured)
- Credit balance synchronized
- App-specific JWT claims present (`app_id`)

#### TC-AUTH-SESSION-003: Session Persistence
**Priority:** P1 (High)

**Test Steps:**
1. Login to app
2. Close app completely
3. Reopen app after 1 hour
4. Verify user still authenticated
5. Check token validity

**Expected Results:**
- User remains logged in
- Tokens loaded from secure storage
- If appToken expired, automatic refresh occurs
- Seamless user experience

### 1.6 Password Management Tests

#### TC-AUTH-PWD-001: Password Reset Request
**Priority:** P1 (High)

**Test Steps:**
1. Submit forgot password request with email
2. Check email sent
3. Verify reset link format and expiration
4. Click link and reset password
5. Login with new password

**Expected Results:**
- Reset email sent to valid addresses
- Link expires after 24 hours
- Old password no longer works
- New password immediately usable

#### TC-AUTH-PWD-002: Rate Limiting on Password Reset
**Priority:** P2 (Medium)

**Test Steps:**
1. Request password reset
2. Immediately request again
3. Repeat 5 times
4. Verify rate limiting applied

**Expected Results:**
- First request succeeds
- Subsequent requests blocked
- Error: "Too many attempts. Please wait before trying again."
- Rate limit: Max 3 requests per 15 minutes

---

## 2. Credit System Testing

### 2.1 Credit Purchase Flow Tests

#### TC-CREDIT-PURCHASE-001: Successful Credit Purchase (Mock Payment)
**Priority:** P0 (Critical)

**Test Steps:**
1. User selects credit package (e.g., 100 credits for €4.99)
2. Initiate checkout with mock payment gateway
3. Simulate successful payment webhook
4. Verify credit balance updated
5. Check transaction recorded

**Expected Results:**
- Payment gateway returns success
- Webhook processed by backend
- Credit balance increased by purchased amount
- Transaction record created with:
  - Transaction ID
  - User ID
  - Amount (credits)
  - Timestamp
  - Status: "completed"
  - Payment method

**Validation Points:**
- Balance update is atomic (no partial updates)
- Duplicate webhook handling (idempotency)
- Transaction logged for audit

**Test Data:**
```javascript
{
  packages: [
    { credits: 100, price: 4.99, productId: "mana_100" },
    { credits: 500, price: 19.99, productId: "mana_500" },
    { credits: 1000, price: 34.99, productId: "mana_1000" }
  ]
}
```

#### TC-CREDIT-PURCHASE-002: Failed Payment
**Priority:** P0 (Critical)

**Test Steps:**
1. Initiate credit purchase
2. Simulate payment failure (declined card)
3. Verify no credits added
4. Check appropriate error message

**Expected Results:**
- Credit balance unchanged
- No transaction record created (or marked "failed")
- User notified of payment failure
- Retry option presented

#### TC-CREDIT-PURCHASE-003: Duplicate Payment Webhook
**Priority:** P0 (Critical)

**Test Steps:**
1. Complete successful purchase
2. Replay same webhook notification
3. Verify idempotent handling

**Expected Results:**
- First webhook: Credits added
- Duplicate webhook: Ignored (detected by transaction ID)
- Balance not double-credited
- Log warning about duplicate webhook

**Implementation:**
```typescript
// Idempotency check
const existingTx = await db.getTransaction(webhookData.transactionId);
if (existingTx) {
  console.log('Duplicate webhook ignored');
  return { status: 'already_processed' };
}
```

#### TC-CREDIT-PURCHASE-004: Webhook Timeout/Retry
**Priority:** P1 (High)

**Test Steps:**
1. Simulate slow/failed webhook delivery
2. Payment gateway retries webhook
3. Verify eventual consistency

**Expected Results:**
- Webhook processed on retry
- Credits eventually added
- User sees updated balance
- No duplicate credits

### 2.2 Credit Balance Tests

#### TC-CREDIT-BALANCE-001: Balance Check Endpoint
**Priority:** P0 (Critical)

**Test Steps:**
1. Authenticate user
2. Call `/auth/credits` endpoint
3. Verify response format
4. Check balance accuracy

**Expected Results:**
- 200 status code
- Response: `{ credits: number, max_credit_limit: number, id: string }`
- Balance matches database
- Request completes in < 500ms

#### TC-CREDIT-BALANCE-002: Balance Consistency Across Apps
**Priority:** P0 (Critical)

**Test Steps:**
1. Login to Memoro app
2. Check credit balance
3. Login to Maerchenzauber app (same user)
4. Check credit balance
5. Verify balances identical

**Expected Results:**
- Same balance in both apps
- Real-time updates propagated
- No sync delays

#### TC-CREDIT-BALANCE-003: Negative Balance Prevention
**Priority:** P0 (Critical)

**Test Steps:**
1. User has 5 credits remaining
2. Attempt operation requiring 10 credits
3. Verify operation blocked
4. Check balance unchanged

**Expected Results:**
- 400 Bad Request
- Error: `insufficient_credits`
- Response includes: `{ requiredCredits: 10, availableCredits: 5 }`
- Balance remains at 5
- No operation performed

### 2.3 Credit Consumption Tests

#### TC-CREDIT-CONSUME-001: Standard Credit Deduction
**Priority:** P0 (Critical)

**Test Steps:**
1. User has 100 credits
2. Perform operation costing 10 credits (e.g., create story)
3. Verify validation before operation
4. Perform operation
5. Deduct credits after success
6. Check final balance

**Expected Results:**
- Pre-operation validation: `hasCredits: true`
- Operation completes successfully
- Credits deducted: 10
- Final balance: 90
- Transaction logged

**Implementation Pattern:**
```typescript
// 1. VALIDATE before operation
const validation = await creditClient.validateCredits(userId, 'STORY_CREATE', 10);
if (!validation.hasCredits) {
  throw insufficientCreditsError;
}

// 2. PERFORM operation
const story = await createStory(data);

// 3. CONSUME after success
await creditClient.consumeCredits(userId, 'STORY_CREATE', 10,
  `Created story: ${story.id}`, { storyId: story.id }
);
```

#### TC-CREDIT-CONSUME-002: Operation Failure (No Charge)
**Priority:** P0 (Critical)

**Test Steps:**
1. User has 100 credits
2. Validate credits (passes)
3. Operation fails (e.g., AI service error)
4. Verify NO credits deducted
5. Check balance unchanged

**Expected Results:**
- Validation: `hasCredits: true`
- Operation fails with error
- Credits NOT consumed
- Balance remains at 100
- User can retry

**Critical Rule:** NEVER charge credits for failed operations

#### TC-CREDIT-CONSUME-003: Concurrent Credit Deduction
**Priority:** P0 (Critical)

**Test Steps:**
1. User has 100 credits
2. Trigger 3 operations simultaneously (30 credits each)
3. Verify only 3 operations succeed
4. Check final balance correct

**Expected Results:**
- All 3 operations validate successfully
- All 3 operations complete
- Total deducted: 90 credits
- Final balance: 10 credits
- No race condition causing over-deduction or under-deduction

**Database Implementation:**
```sql
-- Atomic credit deduction with optimistic locking
UPDATE user_profiles
SET credits = credits - ${amount},
    updated_at = NOW()
WHERE id = ${userId}
  AND credits >= ${amount}
  AND updated_at = ${previousUpdatedAt}
RETURNING credits;
```

#### TC-CREDIT-CONSUME-004: Credit Deduction with Insufficient Balance (Edge Case)
**Priority:** P0 (Critical)

**Test Steps:**
1. User has 10 credits
2. Two concurrent operations (8 credits each)
3. Both validate simultaneously
4. First operation consumes 8 credits
5. Second operation attempts consumption
6. Verify second operation fails

**Expected Results:**
- Both validate successfully (balance check passes)
- First operation: Succeeds, balance → 2
- Second operation: Fails (insufficient balance)
- User refunded for second operation (if pre-charged)
- Clear error message

**Race Condition Mitigation:**
- Use database transactions
- Lock rows during deduction
- Validate again at consumption time

### 2.4 Credit Refund & Adjustment Tests

#### TC-CREDIT-REFUND-001: Failed Operation Refund
**Priority:** P1 (High)

**Test Steps:**
1. User purchases credits
2. Credits deducted for operation
3. Operation fails after deduction
4. Trigger refund process
5. Verify credits restored

**Expected Results:**
- Refund transaction created
- Credits added back to balance
- Original transaction marked "refunded"
- User notified of refund

#### TC-CREDIT-REFUND-002: Manual Credit Adjustment (Admin)
**Priority:** P2 (Medium)

**Test Steps:**
1. Admin logs in
2. Navigates to user credit management
3. Adds/removes credits manually
4. Provides reason
5. Verify balance updated

**Expected Results:**
- Balance adjusted by specified amount
- Adjustment logged with admin ID and reason
- User sees updated balance immediately

### 2.5 Credit Transaction History Tests

#### TC-CREDIT-HISTORY-001: View Transaction History
**Priority:** P2 (Medium)

**Test Steps:**
1. User performs multiple credit operations
2. Navigate to transaction history
3. Verify all transactions listed
4. Check pagination

**Expected Results:**
- All transactions displayed chronologically
- Each entry shows: Date, Operation, Amount, Balance
- Pagination for large histories
- Filter/search options

---

## 3. Security Testing

### 3.1 Authentication Security Tests

#### TC-SEC-AUTH-001: SQL Injection Prevention
**Priority:** P0 (Critical)

**Test Steps:**
1. Attempt login with SQL injection payloads:
   - `admin'--`
   - `' OR '1'='1`
   - `'; DROP TABLE users;--`
2. Verify all rejected

**Expected Results:**
- All attempts fail with 400/401
- No database queries executed with injected SQL
- Input sanitized/parameterized

#### TC-SEC-AUTH-002: JWT Token Manipulation
**Priority:** P0 (Critical)

**Test Steps:**
1. Obtain valid JWT token
2. Modify claims (e.g., change user ID)
3. Re-sign with wrong secret
4. Submit modified token
5. Verify rejection

**Expected Results:**
- Signature validation fails
- 401 Unauthorized
- Request denied
- Original user unaffected

#### TC-SEC-AUTH-003: Token Expiration Enforcement
**Priority:** P0 (Critical)

**Test Steps:**
1. Obtain valid token
2. Wait for expiration time
3. Use expired token
4. Verify rejection

**Expected Results:**
- 401 Unauthorized
- Error: "Token expired"
- Automatic refresh triggered (if refreshToken valid)

#### TC-SEC-AUTH-004: Brute Force Protection
**Priority:** P1 (High)

**Test Steps:**
1. Attempt login with wrong password 5 times
2. Verify account locked or rate limited
3. Check cooldown period

**Expected Results:**
- After 5 failed attempts: Account temporarily locked
- Lockout duration: 15 minutes
- User notified via email (optional)
- Subsequent attempts rejected with 429 status

**Implementation:**
```typescript
// Rate limiting configuration
{
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: "Too many login attempts. Please try again later."
}
```

#### TC-SEC-AUTH-005: Password Storage Security
**Priority:** P0 (Critical)

**Test Steps:**
1. Create account with password
2. Access database directly
3. Verify password hashed
4. Check hash algorithm

**Expected Results:**
- Password NOT stored in plaintext
- Bcrypt/Argon2 hashing used
- Salt included in hash
- Hash format: `$2a$10$...` (bcrypt) or similar

### 3.2 Credit System Security Tests

#### TC-SEC-CREDIT-001: Credit Balance Tampering
**Priority:** P0 (Critical)

**Test Steps:**
1. Attempt to modify credit balance via API manipulation
2. Send crafted requests with inflated balance
3. Directly modify client-side storage
4. Verify all attempts fail

**Expected Results:**
- Server-side validation rejects all tampering
- Balance only modifiable via authorized endpoints
- JWT claims for credits are read-only
- Client-side changes overwritten by server

#### TC-SEC-CREDIT-002: Unauthorized Credit Deduction
**Priority:** P0 (Critical)

**Test Steps:**
1. User A attempts to deduct credits from User B
2. Forge JWT with different user ID
3. Attempt API calls with manipulated token

**Expected Results:**
- All attempts fail with 401/403
- User B's credits unchanged
- Audit log records suspicious activity

#### TC-SEC-CREDIT-003: Replay Attack Prevention
**Priority:** P1 (High)

**Test Steps:**
1. Capture valid credit purchase webhook
2. Replay webhook multiple times
3. Verify duplicate detection

**Expected Results:**
- Only first webhook processed
- Duplicates detected by transaction ID
- No double-crediting

### 3.3 Rate Limiting Tests

#### TC-SEC-RATE-001: API Rate Limiting
**Priority:** P1 (High)

**Test Steps:**
1. Make 100 API requests in 1 minute
2. Verify rate limit enforced
3. Check error response

**Expected Results:**
- Rate limit: 100 requests/minute per user
- After limit: 429 Too Many Requests
- Retry-After header provided
- Limit resets after window

**Rate Limit Configuration:**
```typescript
{
  '/auth/signin': { max: 10, window: '1m' },
  '/auth/refresh': { max: 20, window: '1m' },
  '/api/*': { max: 100, window: '1m' }
}
```

#### TC-SEC-RATE-002: Credit Operation Rate Limiting
**Priority:** P2 (Medium)

**Test Steps:**
1. Perform 50 credit-consuming operations rapidly
2. Verify rate limiting or throttling
3. Check if legitimate operations still work

**Expected Results:**
- Suspicious rapid operations flagged
- Possible CAPTCHA or verification required
- Normal user activity not impacted

---

## 4. Integration Testing

### 4.1 Mobile App Integration Tests

#### TC-INT-MOBILE-001: iOS App Authentication Flow
**Priority:** P0 (Critical)

**Test Steps:**
1. Install iOS app (Memoro)
2. Register new account
3. Verify token storage in SecureStore
4. Close and reopen app
5. Check session persistence
6. Make API call requiring authentication

**Expected Results:**
- Registration succeeds
- Tokens stored in iOS Keychain via SecureStore
- App reopens with user still authenticated
- API calls succeed with valid token

**Platform-Specific Checks:**
- SecureStore API usage
- Background token refresh handling
- App backgrounding behavior

#### TC-INT-MOBILE-002: Android App Authentication Flow
**Priority:** P0 (Critical)

**Test Steps:**
1. Install Android app (Memoro)
2. Register new account
3. Verify token storage in SecureStore
4. Close and reopen app
5. Check session persistence

**Expected Results:**
- Similar to iOS
- Tokens stored in Android Keystore via SecureStore
- Handle Android-specific lifecycle events

#### TC-INT-MOBILE-003: React Native Token Refresh
**Priority:** P0 (Critical)

**Test Steps:**
1. Login on mobile app
2. Wait for token expiry
3. Make API call
4. Verify automatic refresh
5. Check UI remains responsive

**Expected Results:**
- Refresh handled by TokenManager
- UI shows loading indicator
- API call succeeds after refresh
- User unaware of background process

### 4.2 Web App Integration Tests

#### TC-INT-WEB-001: SvelteKit Authentication (Memoro Web)
**Priority:** P0 (Critical)

**Test Steps:**
1. Open web app in browser
2. Register account
3. Verify tokens in localStorage
4. Refresh browser page
5. Check session restored

**Expected Results:**
- Tokens stored in localStorage
- Page refresh maintains authentication
- SSR (server-side rendering) respects auth state
- Protected routes accessible

#### TC-INT-WEB-002: Cross-Browser Compatibility
**Priority:** P1 (High)

**Test Steps:**
1. Test authentication in Chrome, Safari, Firefox, Edge
2. Verify consistent behavior
3. Check localStorage access
4. Test token refresh

**Expected Results:**
- All browsers work identically
- No storage access issues
- Token refresh works across all browsers

### 4.3 Cross-App Integration Tests

#### TC-INT-CROSS-001: Memoro to Maerchenzauber Auth
**Priority:** P0 (Critical)

**Test Steps:**
1. Login to Memoro app
2. Open Maerchenzauber app (same device/browser)
3. Verify authentication state
4. Check credit balance visibility

**Expected Results:**
- User authenticated in both apps (if SSO enabled)
- OR: Separate login required but same user account recognized
- Credit balance synchronized
- app_id claim in JWT differentiates apps

#### TC-INT-CROSS-002: Multi-App Credit Consumption
**Priority:** P0 (Critical)

**Test Steps:**
1. User has 100 credits
2. Consume 30 credits in Memoro (AI transcription)
3. Immediately check balance in Maerchenzauber
4. Consume 20 credits in Maerchenzauber (story generation)
5. Check final balance in both apps

**Expected Results:**
- Memoro: Balance updates to 70 credits
- Maerchenzauber: Shows 70 credits
- Second operation: Balance updates to 50
- Both apps show final balance: 50 credits
- Real-time sync (< 1 second delay)

### 4.4 Payment Gateway Integration Tests

#### TC-INT-PAYMENT-001: RevenueCat Purchase Flow (iOS)
**Priority:** P0 (Critical)

**Test Steps:**
1. Login to Memoro iOS app
2. Navigate to subscription page
3. Purchase 100 credits
4. Complete Apple Pay transaction
5. Verify webhook received
6. Check credit balance updated

**Expected Results:**
- RevenueCat processes purchase
- Webhook sent to backend
- Credits added to user account
- User sees updated balance
- Receipt validated

**RevenueCat Specifics:**
- User identified with UUID
- StoreKit 2 integration on iOS
- Purchase restoration works across devices

#### TC-INT-PAYMENT-002: RevenueCat Purchase Flow (Android)
**Priority:** P0 (Critical)

**Test Steps:**
1. Login to Memoro Android app
2. Purchase credits
3. Complete Google Play transaction
4. Verify webhook and credit update

**Expected Results:**
- Similar to iOS
- Google Play Billing integration
- Webhook processing

#### TC-INT-PAYMENT-003: RevenueCat Purchase Flow (Web)
**Priority:** P1 (High)

**Test Steps:**
1. Login to Memoro web app
2. Purchase credits (Stripe or other web payment)
3. Complete payment
4. Verify webhook and credit update

**Expected Results:**
- Payment processed via Stripe
- Webhook processed
- Credits updated

### 4.5 Backend Service Integration Tests

#### TC-INT-BACKEND-001: NestJS Backend Auth Flow (Maerchenzauber)
**Priority:** P0 (Critical)

**Test Steps:**
1. Mobile app sends login request
2. Backend validates with middleware
3. Backend returns tokens
4. Backend validates subsequent API calls with JWT

**Expected Results:**
- Backend acts as auth proxy
- Supabase RLS policies enforced
- JWT claims validated on every request
- Invalid tokens rejected with 401

#### TC-INT-BACKEND-002: Credit Deduction in Backend Pipeline
**Priority:** P0 (Critical)

**Test Steps:**
1. User requests story creation (Maerchenzauber backend)
2. Backend validates credits via Mana Core
3. Story generated
4. Backend consumes credits
5. Check transaction logged

**Expected Results:**
- Credit validation before operation
- Operation executes only if credits available
- Credits deducted after success
- Rollback if operation fails

**Code Reference:**
```typescript
// See: maerchenzauber/apps/backend/src/pipeline/character/steps/deduct-credits.step.ts
```

---

## 5. Performance Testing

### 5.1 Load Testing

#### TC-PERF-LOAD-001: Concurrent User Logins
**Priority:** P1 (High)

**Test Configuration:**
- Virtual Users: 1000
- Ramp-up: 10 seconds
- Duration: 5 minutes

**Test Steps:**
1. Simulate 1000 users logging in concurrently
2. Measure response times
3. Check success rate
4. Monitor server resources

**Expected Results:**
- 95% of requests complete in < 2 seconds
- 99% of requests complete in < 5 seconds
- Success rate: > 99%
- No server crashes or timeouts
- CPU usage < 80%
- Memory usage stable

**Performance Metrics:**
```
Concurrent Users: 1000
Avg Response Time: < 500ms
P95 Response Time: < 2s
P99 Response Time: < 5s
Error Rate: < 1%
```

#### TC-PERF-LOAD-002: Token Refresh Under Load
**Priority:** P1 (High)

**Test Configuration:**
- Virtual Users: 500
- Simultaneous expired tokens: 500
- Duration: 2 minutes

**Test Steps:**
1. 500 users with expired tokens make API calls
2. Measure refresh endpoint performance
3. Check queue handling
4. Verify no duplicate refreshes

**Expected Results:**
- Refresh endpoint handles 500 concurrent requests
- Token manager queue processes efficiently
- Avg response time: < 1 second
- No request timeouts
- All users successfully refreshed

#### TC-PERF-LOAD-003: Credit Balance Checks at Scale
**Priority:** P1 (High)

**Test Configuration:**
- Virtual Users: 2000
- Requests/second: 100
- Duration: 10 minutes

**Test Steps:**
1. 2000 users checking credit balance simultaneously
2. Measure database query performance
3. Check caching effectiveness

**Expected Results:**
- Query time: < 50ms
- Database connection pool stable
- Caching reduces database load
- No connection exhaustion

### 5.2 Stress Testing

#### TC-PERF-STRESS-001: Credit Deduction Stress Test
**Priority:** P1 (High)

**Test Configuration:**
- Virtual Users: 100
- Operations per user: 50
- Total operations: 5000

**Test Steps:**
1. 100 users each perform 50 credit-consuming operations
2. Measure transaction throughput
3. Check for race conditions or double-deductions
4. Verify all balances correct

**Expected Results:**
- All 5000 operations complete successfully
- No over-deductions or under-deductions
- Database transactions maintain consistency
- Final balances reconcile with transaction logs

#### TC-PERF-STRESS-002: Payment Webhook Storm
**Priority:** P2 (Medium)

**Test Configuration:**
- Concurrent webhooks: 1000
- Duplicate percentage: 20%

**Test Steps:**
1. Send 1000 webhook notifications rapidly
2. Include 200 duplicate webhooks
3. Measure processing time
4. Verify idempotency

**Expected Results:**
- All unique webhooks processed
- Duplicates detected and ignored
- No double-crediting
- Processing time: < 5 seconds for all
- Database remains consistent

### 5.3 Scalability Testing

#### TC-PERF-SCALE-001: Database Scaling - Credit Transactions
**Priority:** P2 (Medium)

**Test Scenario:**
- Simulate 1 million credit transactions over 24 hours
- Monitor database growth
- Check query performance degradation

**Expected Results:**
- Database handles high transaction volume
- Indexes maintain query performance
- No significant slowdown over time
- Automated cleanup/archiving if needed

---

## 6. Acceptance Criteria

### 6.1 Authentication System Acceptance

**AC-AUTH-001:** User can register with email/password in < 3 seconds
**AC-AUTH-002:** User can login with email/password in < 2 seconds
**AC-AUTH-003:** Token refresh happens automatically without user interaction
**AC-AUTH-004:** User remains logged in for 30 days (refreshToken lifetime)
**AC-AUTH-005:** Password reset email arrives within 5 minutes
**AC-AUTH-006:** Multi-device login works for up to 5 devices simultaneously
**AC-AUTH-007:** 99.9% uptime for authentication services

### 6.2 Credit System Acceptance

**AC-CREDIT-001:** Credit balance updates within 1 second of purchase
**AC-CREDIT-002:** Credit deduction happens only after operation succeeds
**AC-CREDIT-003:** Failed operations never charge credits
**AC-CREDIT-004:** Credit balance visible across all apps within 1 second
**AC-CREDIT-005:** Transaction history available for 24 months
**AC-CREDIT-006:** No race conditions allow negative balance
**AC-CREDIT-007:** Refunds processed within 1 hour (automated)

### 6.3 Integration Acceptance

**AC-INT-001:** Mobile apps support iOS 14+ and Android 10+
**AC-INT-002:** Web apps work on Chrome, Safari, Firefox, Edge (latest 2 versions)
**AC-INT-003:** RevenueCat purchase flow completes in < 30 seconds
**AC-INT-004:** Backend API response time < 500ms for 95% of requests
**AC-INT-005:** Cross-app authentication works seamlessly

### 6.4 Security Acceptance

**AC-SEC-001:** No plaintext passwords stored anywhere
**AC-SEC-002:** JWT tokens secured with RS256 algorithm
**AC-SEC-003:** Rate limiting prevents brute force attacks
**AC-SEC-004:** SQL injection attempts blocked 100%
**AC-SEC-005:** XSS vulnerabilities: 0 critical, 0 high
**AC-SEC-006:** Penetration test: No critical vulnerabilities

### 6.5 Performance Acceptance

**AC-PERF-001:** System handles 1000 concurrent users without degradation
**AC-PERF-002:** 99th percentile response time < 3 seconds
**AC-PERF-003:** Token refresh completes in < 2 seconds
**AC-PERF-004:** Credit balance check < 100ms
**AC-PERF-005:** Database can scale to 10 million users

---

## 7. Regression Testing

### 7.1 Regression Test Suite

**RT-001:** Core Authentication Flows
- Run after every auth system change
- Includes: Login, registration, logout, refresh

**RT-002:** Credit Balance & Consumption
- Run after every credit system change
- Includes: Purchase, deduction, balance check

**RT-003:** Multi-App Integration
- Run after any app deployment
- Includes: Cross-app auth, credit sync

**RT-004:** Security Regression
- Run monthly or after security patches
- Includes: All security test cases

### 7.2 Automated Regression Schedule

```yaml
Daily:
  - Smoke tests (critical paths)
  - Core auth flows
  - Credit balance checks

Weekly:
  - Full regression suite
  - Integration tests
  - Performance smoke tests

Monthly:
  - Full security audit
  - Load testing
  - Penetration testing

After Each Deployment:
  - Smoke tests (5 minutes)
  - Core regression (30 minutes)
  - Integration verification (15 minutes)
```

---

## 8. Test Environments

### 8.1 Environment Configuration

#### Development Environment
- **Purpose:** Developer testing
- **Database:** Supabase dev project
- **Middleware:** Local middleware instance
- **Payment:** Mock payment gateway (no real charges)
- **Data:** Test user accounts, synthetic credit data

#### Staging Environment
- **Purpose:** Pre-production testing, QA validation
- **Database:** Supabase staging project (copy of production schema)
- **Middleware:** Staging middleware instance
- **Payment:** RevenueCat sandbox mode
- **Data:** Anonymized production data sample

#### Production Environment
- **Purpose:** Live user traffic
- **Database:** Supabase production project
- **Middleware:** Production middleware cluster
- **Payment:** RevenueCat production mode (real charges)
- **Data:** Live user data (protected by RLS)

### 8.2 Test Data Management

**Test Users:**
```javascript
{
  testUser1: { email: "test+user1@manacore.com", password: "Test123!@#", credits: 1000 },
  testUser2: { email: "test+user2@manacore.com", password: "Test123!@#", credits: 0 },
  testUserB2B: { email: "test+b2b@manacore.com", password: "Test123!@#", b2b: true }
}
```

**Test Credit Packages:**
```javascript
{
  small: { credits: 100, price: 4.99 },
  medium: { credits: 500, price: 19.99 },
  large: { credits: 1000, price: 34.99 }
}
```

---

## 9. Test Automation Strategy

### 9.1 Unit Tests

**Coverage Target:** 80% minimum

**Framework:** Jest

**Test Files:**
- `packages/shared-auth/src/**/*.test.ts`
- `packages/shared-credit-service/src/**/*.test.ts`

**Example:**
```typescript
describe('AuthService', () => {
  it('should sign in with valid credentials', async () => {
    const result = await authService.signIn('test@example.com', 'password');
    expect(result.success).toBe(true);
  });
});
```

### 9.2 Integration Tests

**Coverage Target:** Critical paths 100%

**Framework:** Jest + Supertest (for API tests)

**Test Files:**
- `maerchenzauber/apps/backend/test/*.test.ts`
- `memoro/apps/mobile/features/auth/__tests__/*.test.ts`

**Example:**
```typescript
describe('Credit Purchase Flow', () => {
  it('should add credits after successful payment', async () => {
    const response = await request(app)
      .post('/webhooks/revenuecat')
      .send(mockWebhookPayload);

    expect(response.status).toBe(200);
    const balance = await getCredits(userId);
    expect(balance).toBe(previousBalance + 100);
  });
});
```

### 9.3 E2E Tests

**Coverage Target:** User journeys 100%

**Framework:** Detox (mobile), Playwright (web)

**Test Files:**
- `memoro/apps/mobile/e2e/*.e2e.ts`
- `memoro/apps/web/tests/*.spec.ts`

**Example:**
```typescript
describe('User Registration Journey', () => {
  it('should register, login, and access protected content', async () => {
    await element(by.id('register-button')).tap();
    await element(by.id('email-input')).typeText('new@example.com');
    await element(by.id('password-input')).typeText('SecureP@ss123');
    await element(by.id('submit-button')).tap();

    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(5000);
    expect(element(by.id('credit-balance'))).toBeVisible();
  });
});
```

### 9.4 Performance Tests

**Framework:** k6

**Test Files:**
- `tests/performance/auth-load.js`
- `tests/performance/credit-stress.js`

**Example:**
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 1000 },
    { duration: '2m', target: 0 },
  ],
};

export default function () {
  const res = http.post('https://api.manacore.com/auth/signin', {
    email: 'test@example.com',
    password: 'password',
  });

  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
```

### 9.5 CI/CD Integration

**Pipeline Stages:**
1. **Pre-commit:** Lint, unit tests (local)
2. **Pull Request:** Unit tests, integration tests, security scan
3. **Staging Deploy:** Full regression suite, performance smoke tests
4. **Production Deploy:** Smoke tests, monitoring alert setup

**GitHub Actions Example:**
```yaml
name: Test & Deploy

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: pnpm install
      - run: pnpm run test:unit
      - run: pnpm run test:integration
      - run: pnpm run test:e2e

  performance:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - run: k6 run tests/performance/auth-load.js
```

---

## 10. Compliance & Audit

### 10.1 Payment Compliance Testing

**PCI DSS Requirements:**
- TC-COMP-PCI-001: No credit card data stored locally
- TC-COMP-PCI-002: Payment processed via certified gateway (RevenueCat)
- TC-COMP-PCI-003: Secure transmission (HTTPS only)

### 10.2 GDPR Compliance Testing

**Data Privacy:**
- TC-COMP-GDPR-001: User can delete account and all data
- TC-COMP-GDPR-002: User can export all personal data
- TC-COMP-GDPR-003: Consent for data processing obtained

### 10.3 Audit Logging

**Requirements:**
- All credit transactions logged with timestamp, user, amount, operation
- All authentication events logged (login, logout, refresh)
- Logs retained for 12 months minimum
- Logs tamper-proof and auditable

**Test Cases:**
- TC-AUDIT-001: Verify credit transaction log completeness
- TC-AUDIT-002: Verify auth event log accuracy
- TC-AUDIT-003: Test log export functionality

---

## 11. Risk Mitigation

### 11.1 High-Risk Scenarios

**Risk:** Credit double-deduction due to race condition
**Mitigation:** Database transactions, optimistic locking
**Test:** TC-CREDIT-CONSUME-003

**Risk:** Token hijacking/replay attacks
**Mitigation:** Short token lifetime, HTTPS only, refresh rotation
**Test:** TC-SEC-AUTH-002, TC-SEC-CREDIT-003

**Risk:** Payment webhook failure (credits not added)
**Mitigation:** Webhook retry mechanism, idempotency keys, manual reconciliation
**Test:** TC-CREDIT-PURCHASE-004

**Risk:** Concurrent login causing session conflicts
**Mitigation:** Independent refresh tokens per device
**Test:** TC-AUTH-SESSION-001

### 11.2 Disaster Recovery Testing

**Scenario:** Database failure during credit purchase
**Test:** Verify rollback mechanism, no lost credits
**Recovery Time Objective (RTO):** < 1 hour
**Recovery Point Objective (RPO):** < 5 minutes

**Scenario:** Middleware authentication service down
**Test:** Graceful degradation, cached credentials, retry logic
**RTO:** < 15 minutes (failover to backup)

---

## 12. Test Execution Schedule

### 12.1 Sprint Testing

**Week 1-2 (Development):**
- Unit tests written alongside features
- Developer-run integration tests
- Daily: Smoke tests

**Week 3 (QA Testing):**
- Full manual test execution
- Automated regression suite
- Performance baseline tests
- Security scan

**Week 4 (Pre-Release):**
- Staging environment validation
- User acceptance testing (UAT)
- Load testing
- Final security check

### 12.2 Release Testing

**Pre-Deployment:**
- Run full regression suite
- Performance smoke test
- Security scan
- Backup verification

**Post-Deployment:**
- Smoke tests (5 minutes)
- Monitoring validation (15 minutes)
- Canary deployment testing (1 hour)

---

## 13. Tools & Resources

### 13.1 Testing Tools

**Unit & Integration:**
- Jest (JavaScript testing framework)
- Supertest (HTTP API testing)
- React Native Testing Library

**E2E:**
- Detox (React Native E2E)
- Playwright (Web E2E)
- Appium (mobile alternative)

**Performance:**
- k6 (load testing)
- Lighthouse (web performance)
- New Relic (production monitoring)

**Security:**
- OWASP ZAP (security scanner)
- Snyk (dependency vulnerability scanning)
- SonarQube (code quality & security)

### 13.2 Test Management

**Test Case Repository:** GitHub Wiki or Notion
**Bug Tracking:** GitHub Issues with labels (bug, critical, security)
**Test Execution:** Manual execution logged in test management tool
**CI/CD:** GitHub Actions

### 13.3 Documentation

**For Developers:**
- `maerchenzauber/apps/mobile/AUTH_TESTING_GUIDE.md`
- `packages/shared-auth/README.md`
- `manadeck/CREDIT_SYSTEM.md`

**For QA:**
- This document (TESTING_STRATEGY_AUTH_CREDITS.md)
- Test case templates in `tests/templates/`

---

## 14. Appendix

### A. Test Case Template

```markdown
#### TC-[CATEGORY]-[MODULE]-[ID]: [Test Name]
**Priority:** P0/P1/P2
**Description:** [Brief description]

**Preconditions:**
- [Setup required]

**Test Steps:**
1. [Step 1]
2. [Step 2]
...

**Expected Results:**
- [Expected outcome 1]
- [Expected outcome 2]

**Test Data:**
[Data needed for test]

**Post-Conditions:**
- [Cleanup steps]
```

### B. Bug Report Template

```markdown
**Title:** [Brief description]
**Severity:** Critical / High / Medium / Low
**Environment:** Dev / Staging / Production
**Device/Browser:** [Details]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Screenshots/Logs:**
[Attach evidence]

**Related Test Case:** TC-XXX-XXX-XXX
```

### C. Glossary

**appToken:** Supabase-compatible JWT token for API access
**refreshToken:** Long-lived token for obtaining new appToken
**manaToken:** Authentication token from Mana Core middleware
**RLS:** Row Level Security (Supabase database security)
**JWT:** JSON Web Token
**SecureStore:** Expo secure storage API (Keychain on iOS, Keystore on Android)
**TokenManager:** Service managing token lifecycle and refresh
**RevenueCat:** Third-party subscription and payment management platform
**B2B:** Business-to-Business (enterprise accounts)

---

## Document Control

**Version History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-25 | TESTER Agent | Initial comprehensive test strategy |

**Review & Approval:**

- [ ] Technical Lead Review
- [ ] QA Lead Review
- [ ] Security Team Review
- [ ] Product Owner Approval

**Next Review Date:** 2025-12-25

---

**END OF DOCUMENT**
