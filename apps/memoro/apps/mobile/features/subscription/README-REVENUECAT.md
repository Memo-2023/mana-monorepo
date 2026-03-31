# RevenueCat Integration Documentation

This document explains how RevenueCat is integrated with the authentication system in the Memoro app.

## Overview

RevenueCat is used for managing in-app purchases and subscriptions in the Memoro app. To ensure purchases are correctly associated with user accounts, we need to properly identify users with RevenueCat throughout the authentication lifecycle.

## Integration Points

The integration between our authentication system and RevenueCat happens at several key points:

### 1. Initialization

RevenueCat is initialized early in the app lifecycle in `_layout.tsx`:

```typescript
// Initialize RevenueCat for in-app purchases
await initializeRevenueCat();
```

During initialization, RevenueCat is configured with `appUserID: null`, which causes it to generate an anonymous ID. This is later replaced with the actual user ID after authentication.

### 2. User Authentication

When a user successfully authenticates (via sign-in, sign-up, or social login), we identify them with RevenueCat using their UUID:

```typescript
// Identify user with RevenueCat
await identifyRevenueCatUser(userData.id);
```

This happens in the following authentication flows:
- Email/password sign-in
- Email/password sign-up
- Google sign-in
- Any other authentication method

### 3. Token Refresh

When the authentication token is refreshed (which happens automatically when a token expires), we re-identify the user with RevenueCat:

```typescript
// Re-identify user with RevenueCat after token refresh
const userData = await authService.getUserFromToken();
if (userData) {
  await identifyRevenueCatUser(userData.id);
}
```

This ensures that the RevenueCat user ID is maintained even after token refreshes.

### 4. User Logout

When a user logs out, we reset the RevenueCat user to anonymous:

```typescript
// Reset RevenueCat user to anonymous
await resetRevenueCatUser();
```

## Implementation Details

### RevenueCat User Identification

The `identifyUser` function in `subscriptionService.ts` is used to identify the user with RevenueCat:

```typescript
export const identifyUser = async (userId: string): Promise<void> => {
  try {
    await Purchases.logIn(userId);
    console.debug('User identified with RevenueCat:', userId);
  } catch (error) {
    console.debug('Error identifying user with RevenueCat:', error);
    throw error;
  }
};
```

### RevenueCat User Reset

The `resetUser` function in `subscriptionService.ts` is used to reset the RevenueCat user to anonymous:

```typescript
export const resetUser = async (): Promise<void> => {
  try {
    await Purchases.logOut();
    console.debug('User reset with RevenueCat');
  } catch (error) {
    console.debug('Error resetting user with RevenueCat:', error);
    throw error;
  }
};
```

## Common Issues and Solutions

### Anonymous User IDs in Webhooks

**Problem**: RevenueCat webhooks receive anonymous IDs (e.g., `$RCAnonymousID:7fb9b0b044054e8ab0eee3457a30b565`) instead of proper UUIDs, causing errors like:

```
Error fetching user profile for user $RCAnonymousID:7fb9b0b044054e8ab0eee3457a30b565: invalid input syntax for type uuid
```

**Solution**: Ensure that users are properly identified with RevenueCat after authentication, as implemented in this integration.

### Purchase History After Login

**Problem**: Users may not see their purchase history after logging in.

**Solution**: Make sure to call `identifyUser` with the user's UUID after authentication. This will associate any purchases made with the anonymous ID with the user's account.

## Testing

To test the RevenueCat integration:

1. Log out of the app
2. Log back in
3. Make a purchase
4. Verify that the purchase is associated with the user's account
5. Log out and log back in
6. Verify that the purchase history is still visible

## References

- [RevenueCat Documentation](https://docs.revenuecat.com/)
- [RevenueCat User Identification](https://docs.revenuecat.com/docs/user-ids)
