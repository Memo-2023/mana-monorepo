# Refresh Token Grace Period Implementation

## Overview

As of 2025-01-10, the backend implements a 5-minute grace period for refresh tokens to handle race conditions and network issues gracefully. This document explains how the frontend handles this feature.

## How It Works

1. **Normal Flow**: When refreshing a token, the old token is marked as "rotated" and remains valid for 5 minutes
2. **Grace Period**: If the same old token is used again within 5 minutes, the backend returns the previously generated new token
3. **No Duplicates**: This prevents creating multiple tokens for the same device

## Frontend Implementation

### TokenManager Updates

The `tokenManager.ts` already handles most scenarios correctly:

```typescript
// Handles both refresh_in_progress and rotation_in_progress errors
if (result.error === 'refresh_in_progress' || result.error === 'rotation_in_progress') {
  console.debug('TokenManager: Token rotation in progress, waiting...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  // Retry after waiting
}
```

### Non-Retryable Errors

The following errors indicate permanent failures and should not be retried:
- `invalid_token` - Token doesn't exist
- `token_expired` - Token or grace period expired  
- `invalid_token_state` - Token in unexpected state
- `token_collision` - Very rare UUID collision

### What the Frontend Does

1. **Always saves the returned token** - Whether it's new or from grace period
2. **Retries with exponential backoff** - For network and temporary errors
3. **Handles rotation_in_progress** - Waits and retries when another request is rotating the token
4. **Respects permanent errors** - Doesn't retry when token is truly invalid

## Testing the Grace Period

To test the grace period implementation:

1. **Simulate Network Interruption**:
   - Start a refresh request
   - Kill the app before it completes
   - Restart and try to refresh again
   - Should succeed using grace period

2. **Test Concurrent Refreshes**:
   - Make multiple refresh calls simultaneously
   - All should succeed without creating duplicate tokens

3. **Test Grace Period Expiry**:
   - Use an old token
   - Wait 6+ minutes
   - Try to use it again
   - Should fail with "Token has been rotated and grace period has expired"

## No Additional Changes Required

The current frontend implementation is already compatible with the grace period feature because:
- It properly retries on temporary errors
- It saves whatever token is returned
- It handles the new `rotation_in_progress` error
- It respects permanent failure errors

The grace period is transparent to the frontend - it just makes the system more resilient to network issues and race conditions.