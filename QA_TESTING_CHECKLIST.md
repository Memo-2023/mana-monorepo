# QA Testing Checklist: Authentication & Credit System

**Quick Reference for QA Engineers**
**Version:** 1.0
**Last Updated:** 2025-11-25

---

## Pre-Testing Setup

### Environment Verification
- [ ] Development environment configured
- [ ] Test user accounts created (test+user1@manacore.com, test+user2@manacore.com)
- [ ] Mock payment gateway configured (no real charges)
- [ ] Database seeded with test data
- [ ] Browser DevTools / React Native Debugger ready

### Test Data
```javascript
Test Users:
- test+user1@manacore.com (password: Test123!@#, credits: 1000)
- test+user2@manacore.com (password: Test123!@#, credits: 0)
- test+b2b@manacore.com (password: Test123!@#, B2B account)

Credit Packages:
- Small: 100 credits for €4.99
- Medium: 500 credits for €19.99
- Large: 1000 credits for €34.99
```

---

## Authentication Testing Checklist

### Registration Flow
- [ ] **New User Registration (Email/Password)**
  - Valid email and strong password → Account created
  - Weak password → Error message with requirements
  - Duplicate email → "Email already in use" error
  - Invalid email format → Validation error
  - Network timeout → Retry mechanism works

- [ ] **Google Sign-In**
  - First-time user → Account created with Google profile
  - Returning user → Logged into existing account
  - Invalid token → Error message
  - Email conflict → Account linking

- [ ] **Apple Sign-In**
  - First-time user → Account created
  - Private relay email → Handled correctly
  - Returning user → Logged in successfully

### Login Flow
- [ ] **Successful Login**
  - Valid credentials → Logged in, tokens stored
  - User redirected to home screen
  - Credit balance visible

- [ ] **Failed Login**
  - Invalid password → "Invalid credentials" error
  - Non-existent email → "Invalid credentials" error
  - Email not verified → "Email not verified" error

- [ ] **Session Persistence**
  - Close app completely
  - Reopen app → User still logged in
  - No re-login required

### Logout Flow
- [ ] **Standard Logout**
  - Click logout button
  - Tokens cleared from storage
  - User redirected to login screen
  - Old tokens no longer work (401 error on API calls)

- [ ] **Logout with Network Failure**
  - Disable network
  - Click logout
  - Local tokens still cleared
  - User marked as logged out in UI

### Token Refresh
- [ ] **Automatic Token Refresh**
  - Wait for token to expire (or manually expire)
  - Make API call
  - Verify automatic refresh triggered
  - API call succeeds after refresh
  - No user interaction required

- [ ] **Concurrent Refresh Prevention**
  - Trigger 5 API calls simultaneously with expired token
  - Verify only 1 refresh request sent
  - All 5 API calls succeed after refresh

- [ ] **Refresh Token Expired**
  - Manually expire refresh token
  - Attempt to refresh
  - User logged out with "Session expired" message

### Multi-Device Login
- [ ] **Login on Multiple Devices**
  - Login on iOS device
  - Login on Android device (same user)
  - Login on web browser (same user)
  - All devices have valid sessions
  - Token refresh on one device doesn't affect others

### Password Reset
- [ ] **Request Password Reset**
  - Enter email, click "Forgot Password"
  - Reset email received within 5 minutes
  - Click link in email
  - Reset password successfully
  - Login with new password

- [ ] **Rate Limiting**
  - Request password reset 3 times rapidly
  - 4th request blocked with "Too many attempts" message

---

## Credit System Testing Checklist

### Credit Purchase
- [ ] **Successful Purchase (Mock)**
  - Select 100 credit package
  - Initiate checkout
  - Complete mock payment
  - Verify balance increased by 100
  - Transaction visible in history

- [ ] **Failed Payment**
  - Initiate purchase
  - Simulate declined card
  - Verify no credits added
  - User notified of failure
  - Retry option available

- [ ] **Duplicate Webhook (Idempotency)**
  - Complete successful purchase
  - Replay same webhook
  - Verify credits not double-added
  - Balance remains correct

### Credit Balance
- [ ] **Balance Check**
  - Call `/auth/credits` endpoint
  - Verify balance matches database
  - Response time < 500ms

- [ ] **Cross-App Visibility**
  - Login to Memoro app
  - Check credit balance
  - Login to Maerchenzauber app (same user)
  - Verify same balance displayed
  - Real-time sync (< 1 second)

- [ ] **Negative Balance Prevention**
  - User has 5 credits
  - Attempt operation requiring 10 credits
  - Operation blocked with "Insufficient credits" error
  - Balance unchanged

### Credit Consumption
- [ ] **Standard Deduction**
  - User has 100 credits
  - Perform operation costing 10 credits (e.g., create story)
  - Verify validation before operation
  - Operation completes successfully
  - Credits deducted (balance = 90)
  - Transaction logged

- [ ] **Failed Operation (No Charge)**
  - User has 100 credits
  - Validation passes
  - Operation fails (simulate AI service error)
  - Verify NO credits deducted
  - Balance still 100
  - User can retry

- [ ] **Concurrent Deduction**
  - User has 100 credits
  - Trigger 3 operations simultaneously (30 credits each)
  - All 3 operations complete successfully
  - Total deducted: 90 credits
  - Final balance: 10 credits
  - No over-deduction or under-deduction

- [ ] **Insufficient Balance During Concurrent Operations**
  - User has 10 credits
  - Trigger 2 operations simultaneously (8 credits each)
  - First operation succeeds (balance → 2)
  - Second operation fails with "Insufficient credits"
  - User refunded if pre-charged

### Credit Refund
- [ ] **Failed Operation Refund**
  - Credits deducted for operation
  - Operation fails after deduction
  - Refund process triggered
  - Credits restored to balance
  - Transaction marked "refunded"

### Transaction History
- [ ] **View Transaction History**
  - Navigate to transaction history page
  - All transactions displayed chronologically
  - Each entry shows: Date, Operation, Amount, Balance
  - Pagination works for large histories

---

## Integration Testing Checklist

### Mobile Apps
- [ ] **iOS App (Memoro)**
  - Register account
  - Tokens stored in iOS Keychain (SecureStore)
  - Close and reopen app → Session persists
  - Make API call → Authentication succeeds
  - Background token refresh works

- [ ] **Android App (Memoro)**
  - Register account
  - Tokens stored in Android Keystore (SecureStore)
  - Close and reopen app → Session persists
  - Make API call → Authentication succeeds
  - Background token refresh works

### Web Apps
- [ ] **SvelteKit Web (Memoro)**
  - Register account
  - Tokens stored in localStorage
  - Refresh browser page → Session persists
  - Protected routes accessible
  - Token refresh works

- [ ] **Cross-Browser Testing**
  - Test in Chrome, Safari, Firefox, Edge
  - All browsers work identically
  - Token refresh consistent across browsers

### Cross-App Integration
- [ ] **Memoro to Maerchenzauber**
  - Login to Memoro
  - Open Maerchenzauber (same device)
  - Verify authentication state
  - Check credit balance synchronized

- [ ] **Multi-App Credit Consumption**
  - User has 100 credits
  - Consume 30 credits in Memoro
  - Check balance in Maerchenzauber → 70 credits
  - Consume 20 credits in Maerchenzauber
  - Check balance in both apps → 50 credits

### Payment Gateway (RevenueCat)
- [ ] **iOS Purchase Flow**
  - Login to iOS app
  - Navigate to subscription page
  - Purchase 100 credits
  - Complete Apple Pay transaction
  - Verify webhook received
  - Credits added to account

- [ ] **Android Purchase Flow**
  - Login to Android app
  - Purchase credits
  - Complete Google Play transaction
  - Verify webhook and credit update

- [ ] **Web Purchase Flow**
  - Login to web app
  - Purchase credits via Stripe
  - Complete payment
  - Verify webhook and credit update

---

## Security Testing Checklist

### Authentication Security
- [ ] **SQL Injection Prevention**
  - Test login with payloads: `admin'--`, `' OR '1'='1`, `'; DROP TABLE users;--`
  - All attempts rejected with 400/401
  - No database queries executed

- [ ] **JWT Token Manipulation**
  - Obtain valid token
  - Modify claims (user ID, role, credits)
  - Submit modified token
  - Request rejected with 401

- [ ] **Token Expiration Enforcement**
  - Obtain valid token
  - Wait for expiration
  - Use expired token → 401 error
  - Automatic refresh triggered

- [ ] **Brute Force Protection**
  - Attempt login with wrong password 5 times
  - 6th attempt blocked with 429 status
  - Lockout duration: 15 minutes

- [ ] **Password Storage**
  - Access database directly
  - Verify password hashed (bcrypt/Argon2)
  - No plaintext passwords

### Credit Security
- [ ] **Balance Tampering**
  - Attempt to modify balance via API manipulation
  - Modify client-side storage
  - All attempts rejected
  - Balance unchanged

- [ ] **Unauthorized Deduction**
  - User A attempts to deduct credits from User B
  - Forge JWT with different user ID
  - All attempts fail with 401/403

- [ ] **Replay Attack**
  - Capture valid webhook
  - Replay webhook multiple times
  - Only first processed
  - No double-crediting

### Rate Limiting
- [ ] **API Rate Limiting**
  - Make 100 API requests in 1 minute
  - Verify rate limit enforced (429 after limit)
  - Retry-After header provided

---

## Performance Testing Checklist

### Load Testing
- [ ] **Concurrent User Logins**
  - Simulate 1000 users logging in concurrently
  - 95% of requests complete in < 2 seconds
  - Success rate > 99%
  - No server crashes

- [ ] **Token Refresh Under Load**
  - 500 users with expired tokens make API calls
  - All refreshes succeed
  - Avg response time < 1 second
  - No request timeouts

- [ ] **Credit Balance Checks at Scale**
  - 2000 users checking balance simultaneously
  - Query time < 50ms
  - Database connection pool stable

### Stress Testing
- [ ] **Credit Deduction Stress**
  - 100 users each perform 50 operations (5000 total)
  - All operations complete successfully
  - No over-deductions or under-deductions
  - Final balances reconcile

---

## Acceptance Criteria Validation

### Authentication System
- [ ] User can register in < 3 seconds
- [ ] User can login in < 2 seconds
- [ ] Token refresh is automatic
- [ ] User stays logged in for 30 days
- [ ] Password reset email arrives within 5 minutes
- [ ] Multi-device login works (up to 5 devices)
- [ ] 99.9% uptime

### Credit System
- [ ] Balance updates within 1 second of purchase
- [ ] Deduction only after operation succeeds
- [ ] Failed operations never charge
- [ ] Balance visible across apps in < 1 second
- [ ] Transaction history available for 24 months
- [ ] No race conditions allow negative balance
- [ ] Refunds processed within 1 hour

### Integration
- [ ] Mobile apps support iOS 14+ and Android 10+
- [ ] Web works on Chrome, Safari, Firefox, Edge
- [ ] RevenueCat purchase completes in < 30 seconds
- [ ] API response time < 500ms (95%)
- [ ] Cross-app auth works seamlessly

### Security
- [ ] No plaintext passwords
- [ ] JWT secured with RS256
- [ ] Rate limiting prevents brute force
- [ ] SQL injection blocked 100%
- [ ] 0 critical/high XSS vulnerabilities
- [ ] Penetration test: No critical issues

### Performance
- [ ] 1000 concurrent users supported
- [ ] 99th percentile response < 3 seconds
- [ ] Token refresh < 2 seconds
- [ ] Credit balance check < 100ms
- [ ] Scalable to 10M users

---

## Bug Reporting

### When to File a Bug
- Any test case fails
- Security vulnerability discovered
- Performance below targets
- Unexpected behavior
- Inconsistent cross-platform behavior

### Bug Report Template
```markdown
**Title:** [Brief description]
**Severity:** Critical / High / Medium / Low
**Environment:** Dev / Staging / Production
**Device/Browser:** [Details]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]

**Expected:** [What should happen]
**Actual:** [What actually happens]

**Screenshots/Logs:** [Attach evidence]
**Related Test Case:** TC-XXX-XXX-XXX
```

### Severity Guidelines
- **Critical:** System crash, data loss, security breach, payment failure
- **High:** Feature broken, workaround difficult, affects many users
- **Medium:** Feature partially broken, workaround available
- **Low:** Minor issue, cosmetic, affects few users

---

## Post-Testing

### Test Summary Report
- [ ] Total test cases executed
- [ ] Pass/Fail/Blocked count
- [ ] Critical bugs found
- [ ] Performance metrics captured
- [ ] Security issues identified
- [ ] Recommendations for release

### Sign-Off Criteria
- [ ] All P0 test cases passed
- [ ] 0 critical bugs open
- [ ] < 3 high priority bugs open
- [ ] Performance targets met
- [ ] Security scan clean
- [ ] Stakeholder approval

---

## Quick Links

- **Full Test Strategy:** `/TESTING_STRATEGY_AUTH_CREDITS.md`
- **Executive Summary:** `/TESTING_STRATEGY_EXECUTIVE_SUMMARY.md`
- **Developer Auth Testing Guide:** `maerchenzauber/apps/mobile/AUTH_TESTING_GUIDE.md`
- **Credit System Documentation:** `manadeck/CREDIT_SYSTEM.md`
- **Shared Auth Package:** `packages/shared-auth/README.md`

---

**Happy Testing!**

*For questions or issues, contact the QA lead or refer to the full testing strategy document.*
