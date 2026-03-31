# Auth Proxy Grace Period Implementation Notes

## Overview

The auth-proxy module in memoro-service acts as a pass-through to mana-core-middleware. With the new grace period implementation, the proxy doesn't need significant changes but should be aware of the new behavior.

## Current Implementation Status

The auth proxy already:
- ✅ Validates device info is present for refresh requests
- ✅ Forwards all requests to mana-core-middleware
- ✅ Preserves error responses from the backend
- ✅ Logs requests for debugging

## Grace Period Behavior

When a refresh request is made:

1. **Normal Case**: New tokens are returned
2. **Grace Period Case**: If the same old token is used within 5 minutes:
   - Backend returns the previously generated new token
   - Response includes `gracePeriodUsed: true` flag
   - This is NOT an error - it's a successful response

## No Changes Required

The auth proxy doesn't need modifications because:
- It already forwards all responses transparently
- Error handling is done by the backend
- Retry logic should be implemented in the frontend

## Logging Recommendations

Consider adding logs for grace period usage:

```typescript
async refresh(payload: any) {
  const response = await this.proxyPost('/auth/refresh', payload);
  
  // Optional: Log grace period usage for monitoring
  if (response.gracePeriodUsed) {
    console.log('[AuthProxy] Refresh used grace period for device:', payload.deviceInfo?.deviceId);
  }
  
  return response;
}
```

## Monitoring

Track these metrics to understand grace period effectiveness:
- How often grace period is used
- Which devices/users trigger grace period most
- Correlation with network conditions

## Frontend Integration

The frontend calling memoro-service should:
1. Always save the returned refresh token
2. Implement retry logic with exponential backoff
3. Handle both success and error responses appropriately
4. Not treat grace period usage as an error