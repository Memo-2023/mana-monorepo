# Sample Test Cases: Authentication & Credit System

**Detailed Test Case Examples with Data and Expected Results**
**Version:** 1.0
**Date:** 2025-11-25

---

## Authentication Test Cases

### TC-AUTH-REG-001: Email/Password Registration with Valid Credentials

**Priority:** P0 (Critical)
**Component:** Authentication Service
**Feature:** User Registration

**Preconditions:**
- Application running in test environment
- Database accessible
- Email service configured (or mocked)
- Test email: `test+reg001@manacore.com` not already registered

**Test Data:**
```json
{
  "email": "test+reg001@manacore.com",
  "password": "SecureP@ss123",
  "deviceInfo": {
    "deviceId": "test-device-001",
    "deviceName": "iPhone 13 Pro",
    "deviceType": "ios",
    "appVersion": "1.0.0"
  }
}
```

**Test Steps:**
1. Open registration screen
2. Enter email: `test+reg001@manacore.com`
3. Enter password: `SecureP@ss123`
4. Tap "Register" button
5. Wait for response

**Expected Results:**

**API Response (200 OK):**
```json
{
  "appToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "rt_abc123def456...",
  "needsVerification": false
}
```

**appToken Claims (Decoded):**
```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "test+reg001@manacore.com",
  "role": "authenticated",
  "app_id": "memoro",
  "iat": 1701000000,
  "exp": 1701003600
}
```

**Database Validation:**
```sql
SELECT id, email, created_at, credits
FROM user_profiles
WHERE email = 'test+reg001@manacore.com';

-- Expected:
-- id: 550e8400-e29b-41d4-a716-446655440000
-- email: test+reg001@manacore.com
-- created_at: 2025-11-25 10:00:00
-- credits: 150 (default free credits)
```

**Secure Storage Validation (Mobile):**
```typescript
// iOS Keychain / Android Keystore
const appToken = await SecureStore.getItemAsync('@auth/appToken');
const refreshToken = await SecureStore.getItemAsync('@auth/refreshToken');
const userEmail = await SecureStore.getItemAsync('@auth/userEmail');

expect(appToken).toBeTruthy();
expect(refreshToken).toBeTruthy();
expect(userEmail).toBe('test+reg001@manacore.com');
```

**UI Validation:**
- User redirected to home screen
- Credit balance shows "150 Mana"
- User name/email displayed in profile

**Post-Conditions:**
- User account created in database
- User authenticated
- Tokens stored securely
- User can access protected resources

---

### TC-AUTH-LOGIN-002: Failed Login with Invalid Password

**Priority:** P0 (Critical)
**Component:** Authentication Service
**Feature:** User Login

**Preconditions:**
- User exists: `test+login002@manacore.com` with password `CorrectP@ss123`

**Test Data:**
```json
{
  "email": "test+login002@manacore.com",
  "password": "WrongPassword",
  "deviceInfo": {
    "deviceId": "test-device-002",
    "deviceName": "Pixel 6 Pro",
    "deviceType": "android"
  }
}
```

**Test Steps:**
1. Open login screen
2. Enter email: `test+login002@manacore.com`
3. Enter incorrect password: `WrongPassword`
4. Tap "Login" button
5. Wait for response

**Expected Results:**

**API Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "INVALID_CREDENTIALS"
}
```

**UI Validation:**
- Error message displayed: "Invalid email or password"
- Email field retains entered value
- Password field cleared
- No tokens stored
- User remains on login screen

**Database Validation:**
```sql
-- No new session created
SELECT * FROM auth_sessions
WHERE user_email = 'test+login002@manacore.com'
  AND created_at > NOW() - INTERVAL '1 minute';

-- Expected: 0 rows
```

**Security Validation:**
- Password not returned in response
- Generic error message (no hint that email exists)
- Failed attempt logged for brute-force detection

**Post-Conditions:**
- User NOT authenticated
- No tokens in storage
- Failed login attempt recorded

---

### TC-AUTH-REFRESH-001: Automatic Token Refresh on 401

**Priority:** P0 (Critical)
**Component:** Token Manager
**Feature:** Automatic Token Refresh

**Preconditions:**
- User logged in
- appToken expired (or manually expired)
- refreshToken valid

**Test Data:**

**Initial State:**
```typescript
const expiredAppToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."; // exp: 1 hour ago
const validRefreshToken = "rt_valid123..."; // exp: 30 days from now
```

**Test Steps:**
1. User is logged in with expired appToken
2. User initiates API call: `GET /api/memos`
3. TokenManager detects expired token
4. TokenManager automatically calls `/auth/refresh`
5. New tokens received
6. Original API call retried with new token
7. API call succeeds

**Expected Results:**

**Token Refresh API Call:**
```
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "rt_valid123...",
  "deviceInfo": {
    "deviceId": "test-device-003"
  }
}
```

**Token Refresh Response (200 OK):**
```json
{
  "appToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.NEW_TOKEN",
  "refreshToken": "rt_new456..."
}
```

**Token Manager State Transitions:**
```
VALID → EXPIRED → REFRESHING → VALID
```

**Network Calls:**
1. `GET /api/memos` → 401 Unauthorized (expired token)
2. `POST /auth/refresh` → 200 OK (new tokens)
3. `GET /api/memos` → 200 OK (retry with new token)

**Storage Updates:**
```typescript
// Old tokens replaced
await SecureStore.getItemAsync('@auth/appToken');
// Returns: NEW_TOKEN

await SecureStore.getItemAsync('@auth/refreshToken');
// Returns: rt_new456...
```

**UI Validation:**
- No user interaction required
- Loading indicator shown during refresh (< 2 seconds)
- Memos displayed successfully
- No error messages

**Performance:**
- Total time from initial API call to data displayed: < 3 seconds
- Refresh process: < 2 seconds

**Post-Conditions:**
- User remains authenticated
- New tokens stored
- Original API call succeeded
- TokenManager state: VALID

---

## Credit System Test Cases

### TC-CREDIT-PURCHASE-001: Successful Credit Purchase

**Priority:** P0 (Critical)
**Component:** Payment Service, Credit Service
**Feature:** Credit Purchase

**Preconditions:**
- User authenticated: `test+credit001@manacore.com`
- Current balance: 10 credits
- Mock payment gateway configured

**Test Data:**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440001",
  "packageId": "mana_100",
  "credits": 100,
  "price": 4.99,
  "currency": "EUR"
}
```

**Test Steps:**
1. User navigates to subscription page
2. Select "100 Credits - €4.99" package
3. Tap "Purchase" button
4. Complete mock payment (simulated success)
5. Payment gateway sends webhook to backend

**Mock Webhook Payload:**
```json
{
  "event": "purchase",
  "transactionId": "txn_mock_12345",
  "userId": "550e8400-e29b-41d4-a716-446655440001",
  "productId": "mana_100",
  "credits": 100,
  "price": 4.99,
  "currency": "EUR",
  "timestamp": "2025-11-25T10:00:00Z",
  "status": "completed"
}
```

**Expected Results:**

**Webhook Processing:**
1. Backend receives webhook
2. Validates transaction ID (not duplicate)
3. Validates user exists
4. Updates credit balance atomically

**Database Updates:**

**user_profiles table:**
```sql
UPDATE user_profiles
SET credits = credits + 100
WHERE id = '550e8400-e29b-41d4-a716-446655440001';

-- Before: 10 credits
-- After: 110 credits
```

**credit_transactions table:**
```sql
INSERT INTO credit_transactions (
  id,
  user_id,
  transaction_type,
  amount,
  description,
  transaction_id,
  status,
  created_at
) VALUES (
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440001',
  'purchase',
  100,
  'Credit purchase: 100 credits',
  'txn_mock_12345',
  'completed',
  NOW()
);
```

**API Response to Client:**
```json
{
  "success": true,
  "newBalance": 110,
  "transaction": {
    "id": "uuid-transaction",
    "amount": 100,
    "timestamp": "2025-11-25T10:00:00Z"
  }
}
```

**UI Updates:**
- Credit balance updates to "110 Mana" (within 1 second)
- Success notification: "100 credits added successfully!"
- Transaction visible in history

**Post-Conditions:**
- User balance: 110 credits
- Transaction recorded
- User can use new credits

---

### TC-CREDIT-CONSUME-003: Concurrent Credit Deduction

**Priority:** P0 (Critical)
**Component:** Credit Service
**Feature:** Credit Consumption

**Preconditions:**
- User authenticated: `test+credit003@manacore.com`
- Current balance: 100 credits
- 3 concurrent operations ready

**Test Data:**

**User State:**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440003",
  "currentBalance": 100,
  "operations": [
    { "id": "op1", "type": "STORY_CREATE", "cost": 30 },
    { "id": "op2", "type": "STORY_CREATE", "cost": 30 },
    { "id": "op3", "type": "STORY_CREATE", "cost": 30 }
  ]
}
```

**Test Steps:**
1. Trigger 3 story creation operations simultaneously
2. Each operation validates credits BEFORE execution
3. All 3 operations execute concurrently
4. Each operation consumes credits AFTER success
5. Verify final balance

**Expected Results:**

**Validation Phase (Concurrent):**

**Operation 1:**
```
POST /credits/validate
{
  "userId": "550e8400-e29b-41d4-a716-446655440003",
  "operationType": "STORY_CREATE",
  "cost": 30
}

Response: { "hasCredits": true, "availableCredits": 100 }
```

**Operation 2:**
```
POST /credits/validate
{
  "userId": "550e8400-e29b-41d4-a716-446655440003",
  "operationType": "STORY_CREATE",
  "cost": 30
}

Response: { "hasCredits": true, "availableCredits": 100 }
```

**Operation 3:**
```
POST /credits/validate
{
  "userId": "550e8400-e29b-41d4-a716-446655440003",
  "operationType": "STORY_CREATE",
  "cost": 30
}

Response: { "hasCredits": true, "availableCredits": 100 }
```

**Execution Phase:**
- All 3 stories generated successfully

**Consumption Phase (Atomic, Sequential due to DB locks):**

**Database Transaction Log:**
```sql
-- Transaction 1 (Operation 1)
BEGIN;
SELECT credits, updated_at FROM user_profiles WHERE id = '...' FOR UPDATE;
-- credits: 100, updated_at: t1
UPDATE user_profiles SET credits = 70, updated_at = NOW() WHERE id = '...' AND updated_at = t1;
COMMIT;

-- Transaction 2 (Operation 2)
BEGIN;
SELECT credits, updated_at FROM user_profiles WHERE id = '...' FOR UPDATE;
-- credits: 70, updated_at: t2
UPDATE user_profiles SET credits = 40, updated_at = NOW() WHERE id = '...' AND updated_at = t2;
COMMIT;

-- Transaction 3 (Operation 3)
BEGIN;
SELECT credits, updated_at FROM user_profiles WHERE id = '...' FOR UPDATE;
-- credits: 40, updated_at: t3
UPDATE user_profiles SET credits = 10, updated_at = NOW() WHERE id = '...' AND updated_at = t3;
COMMIT;
```

**Final State:**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440003",
  "finalBalance": 10,
  "transactionsCreated": 3,
  "totalDeducted": 90
}
```

**UI Validation:**
- Credit balance updates to "10 Mana"
- All 3 stories visible in user's library
- Transaction history shows 3 separate deductions

**Critical Validations:**
- ✅ No over-deduction (balance not negative)
- ✅ No under-deduction (all 90 credits deducted)
- ✅ Database consistency maintained
- ✅ All operations succeeded

**Post-Conditions:**
- User balance: 10 credits
- 3 transactions recorded
- 3 stories created

---

### TC-CREDIT-CONSUME-004: Insufficient Balance During Concurrent Operations

**Priority:** P0 (Critical)
**Component:** Credit Service
**Feature:** Credit Consumption Edge Case

**Preconditions:**
- User authenticated: `test+credit004@manacore.com`
- Current balance: 10 credits (LOW BALANCE)
- 2 concurrent operations ready

**Test Data:**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440004",
  "currentBalance": 10,
  "operations": [
    { "id": "op1", "type": "STORY_CREATE", "cost": 8 },
    { "id": "op2", "type": "STORY_CREATE", "cost": 8 }
  ]
}
```

**Test Steps:**
1. Trigger 2 story creation operations simultaneously (8 credits each)
2. Both operations validate credits (both should pass with 10 credits available)
3. Both operations execute concurrently
4. First operation consumes 8 credits (balance → 2)
5. Second operation attempts to consume 8 credits (insufficient)
6. Verify error handling

**Expected Results:**

**Validation Phase (Both Pass):**
```
Operation 1: POST /credits/validate → { "hasCredits": true, "availableCredits": 10 }
Operation 2: POST /credits/validate → { "hasCredits": true, "availableCredits": 10 }
```

**Execution Phase:**
- Both stories generated successfully (AI service completes)

**Consumption Phase:**

**Operation 1 (Succeeds):**
```sql
BEGIN;
UPDATE user_profiles SET credits = 2 WHERE id = '...' AND credits >= 8;
-- 1 row affected
INSERT INTO credit_transactions (...) VALUES (...);
COMMIT;
```

**Operation 2 (Fails):**
```sql
BEGIN;
UPDATE user_profiles SET credits = credits - 8 WHERE id = '...' AND credits >= 8;
-- 0 rows affected (balance only 2, not enough)
ROLLBACK;
```

**API Response for Operation 2 (400 Bad Request):**
```json
{
  "error": "insufficient_credits",
  "message": "Insufficient mana. Required: 8, Available: 2",
  "requiredCredits": 8,
  "availableCredits": 2
}
```

**UI Behavior:**
- Operation 1: Success notification, story saved
- Operation 2: Insufficient credits modal shown
  - "You need 8 Mana but only have 2 Mana"
  - "Get More Mana" button
  - Cancel button

**Final State:**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440004",
  "finalBalance": 2,
  "successfulOperations": 1,
  "failedOperations": 1
}
```

**Critical Validations:**
- ✅ First operation succeeded and charged
- ✅ Second operation failed with clear error
- ✅ No negative balance
- ✅ User notified of failure
- ✅ Story from failed operation NOT saved

**Post-Conditions:**
- User balance: 2 credits
- 1 transaction recorded (successful operation)
- 1 story created (successful operation)
- User sees insufficient credits modal

---

## Integration Test Cases

### TC-INT-CROSS-002: Multi-App Credit Consumption

**Priority:** P0 (Critical)
**Component:** Credit Service, Multi-App Integration
**Feature:** Cross-App Credit Synchronization

**Preconditions:**
- User authenticated in both Memoro and Maerchenzauber
- User: `test+integration002@manacore.com`
- Initial balance: 100 credits

**Test Data:**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440005",
  "initialBalance": 100,
  "memoroOperation": {
    "type": "TRANSCRIPTION",
    "cost": 30,
    "duration": 15
  },
  "maerchenzauberOperation": {
    "type": "STORY_CREATE",
    "cost": 20
  }
}
```

**Test Steps:**
1. Open Memoro app
2. Check credit balance → 100 Mana
3. Record 15-minute audio memo
4. Process transcription (costs 30 credits)
5. Wait for balance update
6. **Immediately** switch to Maerchenzauber app
7. Check credit balance in Maerchenzauber
8. Create story (costs 20 credits)
9. Wait for balance update
10. Switch back to Memoro app
11. Check final balance

**Expected Results:**

**Step 1-2 (Memoro - Initial):**
```
UI: "100 Mana" displayed
```

**Step 3-4 (Memoro - Transcription):**
```
API: POST /memoro/transcribe
Response: { "success": true, "creditsUsed": 30 }

Database:
UPDATE user_profiles SET credits = 70 WHERE id = '...';

UI Update (< 1 second): "70 Mana" displayed
```

**Step 6-7 (Maerchenzauber - Balance Check):**
```
API: GET /auth/credits
Response: { "credits": 70, "userId": "..." }

UI: "70 Mana" displayed (synced from Memoro)

Validation: Balance consistent across apps within 1 second
```

**Step 8-9 (Maerchenzauber - Story Creation):**
```
API: POST /story/create
Response: { "success": true, "creditsUsed": 20 }

Database:
UPDATE user_profiles SET credits = 50 WHERE id = '...';

UI Update (< 1 second): "50 Mana" displayed
```

**Step 10-11 (Memoro - Final Balance):**
```
API: GET /auth/credits
Response: { "credits": 50, "userId": "..." }

UI: "50 Mana" displayed (synced from Maerchenzauber)

Validation: Balance consistent across apps
```

**Timeline Validation:**
```
T+0s:   Memoro balance: 100
T+2s:   Transcription complete, Memoro balance: 70
T+3s:   Switch to Maerchenzauber, balance: 70 ✓
T+5s:   Story created, Maerchenzauber balance: 50
T+6s:   Switch to Memoro, balance: 50 ✓
```

**Database Transaction Log:**
```sql
-- Transaction 1 (Memoro)
INSERT INTO credit_transactions (user_id, app_id, type, amount, description)
VALUES ('...', 'memoro', 'consumption', -30, 'Transcription: 15 min audio');

-- Transaction 2 (Maerchenzauber)
INSERT INTO credit_transactions (user_id, app_id, type, amount, description)
VALUES ('...', 'maerchenzauber', 'consumption', -20, 'Story creation');
```

**Critical Validations:**
- ✅ Balance synced across apps within 1 second
- ✅ No lost credits (100 - 30 - 20 = 50)
- ✅ Both operations succeeded
- ✅ Transactions logged with correct app_id

**Post-Conditions:**
- User balance: 50 credits (consistent in both apps)
- 2 transactions recorded
- 1 transcribed memo (Memoro)
- 1 story created (Maerchenzauber)

---

## Performance Test Case

### TC-PERF-LOAD-002: Token Refresh Under Load

**Priority:** P1 (High)
**Component:** Token Manager, Auth Service
**Feature:** Concurrent Token Refresh

**Test Configuration:**
```javascript
{
  virtualUsers: 500,
  duration: '2m',
  scenario: 'all_tokens_expired_simultaneously'
}
```

**Test Data:**
```javascript
// 500 virtual users with expired tokens
const users = Array.from({ length: 500 }, (_, i) => ({
  userId: `load-test-user-${i}`,
  appToken: generateExpiredToken(),
  refreshToken: generateValidToken(),
  deviceId: `device-${i}`
}));
```

**Test Script (k6):**
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 500,
  duration: '2m',
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const refreshToken = __ENV.REFRESH_TOKEN;

  // Simulate API call with expired token
  const apiRes = http.get('https://api.manacore.com/api/memos', {
    headers: { Authorization: `Bearer ${expiredToken}` }
  });

  check(apiRes, {
    'status is 401': (r) => r.status === 401,
  });

  // Automatic refresh triggered
  const refreshRes = http.post('https://api.manacore.com/auth/refresh',
    JSON.stringify({ refreshToken }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(refreshRes, {
    'refresh status is 200': (r) => r.status === 200,
    'new tokens received': (r) => r.json('appToken') !== null,
    'refresh time < 2s': (r) => r.timings.duration < 2000,
  });

  sleep(1);
}
```

**Expected Results:**

**Performance Metrics:**
```
Scenarios: (100.00%) 1 scenario, 500 max VUs, 2m30s max duration
     ✓ refresh status is 200............: 100.00% ✓ 60000  ✗ 0
     ✓ new tokens received...............: 100.00% ✓ 60000  ✗ 0
     ✓ refresh time < 2s.................: 99.95%  ✓ 59970  ✗ 30

     http_req_duration...................: avg=850ms   min=200ms  med=750ms  max=4.2s   p(95)=1.8s  p(99)=2.9s
     http_req_failed.....................: 0.01%   ✓ 6     ✗ 59994
     http_reqs...........................: 60000   500/s
     vus.................................: 500     min=500 max=500
     vus_max.............................: 500     min=500 max=500
```

**Success Criteria:**
- ✅ P95 response time < 2 seconds
- ✅ P99 response time < 5 seconds
- ✅ Error rate < 1%
- ✅ All 500 users successfully refreshed
- ✅ Server CPU < 80%
- ✅ Server memory stable (no leaks)

**Server Resource Monitoring:**
```
CPU Usage: 65% average, 78% peak
Memory Usage: 4.2 GB (stable)
Database Connections: 45/100 (under limit)
Response Time: 850ms average
```

**Post-Conditions:**
- All 500 users have valid tokens
- No service degradation
- No errors or crashes

---

## Security Test Case

### TC-SEC-CREDIT-001: Credit Balance Tampering Attempt

**Priority:** P0 (Critical)
**Component:** Credit Service
**Feature:** Security

**Preconditions:**
- User authenticated: `test+security001@manacore.com`
- Current balance: 10 credits
- Attacker has access to user's device/browser

**Test Data:**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440006",
  "currentBalance": 10,
  "attemptedBalance": 10000
}
```

**Attack Scenarios:**

**Attack 1: Modify JWT Claims**
```javascript
// Attacker obtains JWT token
const token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...";

// Decode token
const payload = {
  "sub": "550e8400-e29b-41d4-a716-446655440006",
  "credits": 10,  // Original
  "role": "authenticated"
};

// Attacker modifies credits
payload.credits = 10000;

// Attacker re-encodes token (without proper signature)
const tamperedToken = encodeJWT(payload, "wrong-secret");

// Attacker sends API request with tampered token
fetch('/api/memos', {
  headers: { Authorization: `Bearer ${tamperedToken}` }
});
```

**Expected Defense:**
```
API Response: 401 Unauthorized
{
  "error": "Invalid token signature"
}

Server Log:
[AUTH] Token signature verification failed for user attempt
[SECURITY] Potential token tampering detected
```

**Attack 2: Modify Local Storage**
```javascript
// Web app - attacker opens browser console
localStorage.setItem('creditBalance', '10000');
location.reload();
```

**Expected Defense:**
```
// On app load
const localBalance = localStorage.getItem('creditBalance'); // "10000"
const serverBalance = await fetchCredits(); // API call: 10

// App uses server-authoritative balance
UI displays: "10 Mana" (server value)
localStorage.setItem('creditBalance', '10'); // Overwritten
```

**Attack 3: Direct API Manipulation**
```javascript
// Attacker crafts malicious API request
fetch('/credits/add', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + validToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userId: "550e8400-e29b-41d4-a716-446655440006",
    amount: 10000
  })
});
```

**Expected Defense:**
```
API Response: 403 Forbidden
{
  "error": "Unauthorized endpoint"
}

Server Log:
[SECURITY] Attempt to access admin-only endpoint: /credits/add
[SECURITY] User: 550e8400-e29b-41d4-a716-446655440006
[SECURITY] IP: 192.168.1.100
```

**Attack 4: SQL Injection**
```javascript
// Attacker tries SQL injection in credit consumption
fetch('/credits/consume', {
  method: 'POST',
  body: JSON.stringify({
    userId: "'; UPDATE user_profiles SET credits = 10000; --",
    amount: 10
  })
});
```

**Expected Defense:**
```
// Parameterized query prevents injection
const query = `
  UPDATE user_profiles
  SET credits = credits - $1
  WHERE id = $2
`;
db.query(query, [amount, userId]);

API Response: 400 Bad Request
{
  "error": "Invalid user ID format"
}
```

**Final Validation:**
```sql
-- Verify balance unchanged
SELECT credits FROM user_profiles
WHERE id = '550e8400-e29b-41d4-a716-446655440006';

-- Expected: 10 (unchanged)
```

**Critical Validations:**
- ✅ JWT signature verification prevents token tampering
- ✅ Server-authoritative balance (client can't override)
- ✅ Admin endpoints protected (role-based access control)
- ✅ SQL injection prevented (parameterized queries)
- ✅ All attacks logged for security monitoring

**Post-Conditions:**
- User balance: 10 credits (unchanged)
- Attack attempts logged
- Security team notified (if threshold exceeded)

---

## Test Data Repository

### Test User Accounts

```yaml
test_users:
  - email: test+reg001@manacore.com
    password: SecureP@ss123
    credits: 0
    purpose: Registration testing

  - email: test+login002@manacore.com
    password: CorrectP@ss123
    credits: 50
    purpose: Login testing

  - email: test+credit001@manacore.com
    password: Test123!@#
    credits: 10
    purpose: Credit purchase testing

  - email: test+credit003@manacore.com
    password: Test123!@#
    credits: 100
    purpose: Concurrent deduction testing

  - email: test+credit004@manacore.com
    password: Test123!@#
    credits: 10
    purpose: Insufficient balance testing

  - email: test+integration002@manacore.com
    password: Test123!@#
    credits: 100
    purpose: Multi-app integration testing

  - email: test+security001@manacore.com
    password: Test123!@#
    credits: 10
    purpose: Security testing

  - email: test+b2b@manacore.com
    password: Test123!@#
    credits: 10000
    b2b: true
    purpose: B2B account testing
```

### Mock Webhook Payloads

```json
{
  "purchase_success": {
    "event": "purchase",
    "transactionId": "txn_mock_12345",
    "userId": "550e8400-e29b-41d4-a716-446655440001",
    "productId": "mana_100",
    "credits": 100,
    "price": 4.99,
    "currency": "EUR",
    "timestamp": "2025-11-25T10:00:00Z",
    "status": "completed"
  },

  "purchase_failed": {
    "event": "purchase_failed",
    "transactionId": "txn_mock_67890",
    "userId": "550e8400-e29b-41d4-a716-446655440001",
    "productId": "mana_100",
    "error": "payment_declined",
    "timestamp": "2025-11-25T10:05:00Z"
  },

  "purchase_duplicate": {
    "event": "purchase",
    "transactionId": "txn_mock_12345",
    "userId": "550e8400-e29b-41d4-a716-446655440001",
    "productId": "mana_100",
    "credits": 100,
    "price": 4.99,
    "currency": "EUR",
    "timestamp": "2025-11-25T10:00:00Z",
    "status": "completed"
  }
}
```

---

**END OF SAMPLE TEST CASES**

*For full test strategy, see `/TESTING_STRATEGY_AUTH_CREDITS.md`*
