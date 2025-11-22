# RevenueCat Integration Setup Guide

This guide explains how RevenueCat has been integrated into the Storyteller mobile app.

## Overview

RevenueCat is now integrated to handle:
- Monthly and yearly subscription plans
- One-time mana package purchases (consumables)
- Purchase restoration across devices
- Cross-platform support (iOS/Android)

## Files Created

### Feature Directory: `src/features/subscription/`

1. **productIds.ts** - Product ID mappings
   - Maps internal IDs to App Store/Play Store product IDs
   - Your existing product IDs from App Store Connect:
     - Subscriptions: `mana_stream_small_maerchenzauber_monthly_v1`, etc.
     - Packages: `mana_potion_small_maerchenzauber_v1`, etc.

2. **subscriptionTypes.ts** - TypeScript type definitions
   - `RevenueCatSubscriptionPlan` - Subscription plan interface
   - `RevenueCatManaPackage` - One-time package interface
   - `SubscriptionServiceData` - Complete subscription data response

3. **subscriptionData.json** - Fallback pricing data
   - Used when RevenueCat is unavailable
   - Contains 8 subscription plans (4 tiers × 2 billing cycles)
   - Contains 4 mana packages

4. **subscriptionService.ts** - Core RevenueCat SDK wrapper
   - `initializeRevenueCat()` - Initialize SDK
   - `identifyUser(userId)` - Link user to purchases
   - `resetUser()` - Reset to anonymous
   - `getSubscriptionData()` - Fetch available products
   - `purchaseSubscription(id, cycle)` - Purchase subscription
   - `purchaseManaPackage(id)` - Purchase one-time package
   - `restorePurchases()` - Restore previous purchases

5. **revenueCatManager.ts** - Manager pattern implementation
   - Singleton pattern for easy access
   - Handles initialization state
   - Provides helper functions for common operations

### Updated Files

1. **app/subscription.tsx** - Updated subscription screen
   - Loads products from RevenueCat
   - Billing cycle toggle (monthly/yearly)
   - Real purchase flow with error handling
   - Restore purchases button
   - Loading states and user feedback

2. **package.json** - Added dependency
   - `react-native-purchases@^8.11.2`

## Next Steps

### 1. Add Environment Variables

Add to `mobile/.env.local` or `mobile/.env`:

```bash
# RevenueCat API Keys
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_YOUR_IOS_KEY_HERE
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_YOUR_ANDROID_KEY_HERE
```

Get your API keys from:
1. Go to https://app.revenuecat.com
2. Navigate to your project
3. Go to "API Keys" section
4. Copy the iOS and Android API keys

### 2. Update app.json

Add the environment variables to Expo configuration in `mobile/app.json`:

```json
{
  "expo": {
    "extra": {
      "EXPO_PUBLIC_REVENUECAT_IOS_KEY": "${EXPO_PUBLIC_REVENUECAT_IOS_KEY}",
      "EXPO_PUBLIC_REVENUECAT_ANDROID_KEY": "${EXPO_PUBLIC_REVENUECAT_ANDROID_KEY}"
    }
  }
}
```

### 3. Initialize RevenueCat in App

Update your root layout file (e.g., `app/_layout.tsx`) to initialize RevenueCat:

```typescript
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  initializeRevenueCat,
  identifyRevenueCatUser,
  resetRevenueCatUser
} from '@/features/subscription/revenueCatManager';

export default function RootLayout() {
  const { user } = useAuth();

  useEffect(() => {
    // Initialize RevenueCat on app start
    async function init() {
      await initializeRevenueCat();

      // Identify user if logged in
      if (user?.id) {
        await identifyRevenueCatUser(user.id);
      }
    }
    init();
  }, []);

  // Handle user login/logout
  useEffect(() => {
    async function handleAuthChange() {
      if (user?.id) {
        await identifyRevenueCatUser(user.id);
      } else {
        await resetRevenueCatUser();
      }
    }
    handleAuthChange();
  }, [user]);

  // ... rest of your layout
}
```

### 4. Configure RevenueCat Dashboard

1. **Create Project at RevenueCat**
   - Go to https://app.revenuecat.com
   - Create a new project named "Märchenzauber" or "Storyteller"

2. **Add iOS App**
   - Go to Project Settings → Apps
   - Add iOS app
   - Enter your Bundle ID (e.g., `com.memoro.maerchenzauber`)
   - Upload App Store Connect API Key or shared secret

3. **Add Android App** (when ready)
   - Add Android app
   - Enter your Package Name
   - Upload Google Play Service Account JSON

4. **Create Offerings**
   - Go to Offerings section
   - Create an offering (e.g., "default")
   - Add packages and link to your App Store products

5. **Link Products**
   - In the Offerings screen, click "Add Package"
   - For subscriptions: Link each monthly/yearly product
   - For consumables: Link each mana potion product
   - Make sure product IDs match exactly what's in `productIds.ts`

### 5. App Store Connect Configuration

Your products are already created! Make sure they have:

**Subscriptions:**
- ✅ Kleiner Mana Stream (Monthly/Yearly)
- ✅ Mittlerer Mana Stream (Monthly/Yearly)
- ✅ Großer Mana Stream (Monthly/Yearly)
- ✅ Riesiger Mana Stream (Monthly/Yearly)

**Consumables:**
- ✅ Kleiner Mana Trank
- ✅ Mittlerer Mana Trank
- ✅ Großer Mana Trank
- ✅ Riesiger Mana Trank

**Important:** Add metadata (descriptions, screenshots) to remove "Missing Metadata" status.

### 6. Testing

#### Sandbox Testing (iOS)

1. **Create Sandbox Tester Account**
   - App Store Connect → Users and Access → Sandbox Testers
   - Create a new sandbox tester account

2. **Sign in on Device**
   - Settings → App Store → Sandbox Account
   - Sign in with sandbox tester credentials

3. **Test Purchases**
   - Run app in development mode
   - Navigate to subscription screen
   - Try purchasing a subscription or package
   - Check logs for `[RevenueCat]` messages

4. **Verify in RevenueCat Dashboard**
   - Go to RevenueCat → Customers
   - Look for your test user
   - Verify purchase appears in their history

#### Production Testing

1. **TestFlight Build**
   - Create production build with EAS: `eas build --platform ios --profile production`
   - Upload to TestFlight
   - Invite test users

2. **Test Real Purchases**
   - Use real Apple ID (non-sandbox)
   - Test subscription purchase
   - Test package purchase
   - Test restore purchases
   - Cancel and verify cancellation flow

### 7. Backend Integration (Optional)

If you want to sync purchases with your backend:

1. **Set up RevenueCat Webhook**
   - RevenueCat Dashboard → Integrations → Webhooks
   - Add your backend URL (e.g., `https://your-backend.com/webhooks/revenuecat`)

2. **Handle Webhook Events**
   - Create endpoint to receive webhook events
   - Parse event types: `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`, etc.
   - Update user's mana balance in your database
   - See `mana-core-middleware` for webhook handler examples

## Product ID Reference

### Subscriptions (Monthly)
- Small: `mana_stream_small_maerchenzauber_monthly_v1`
- Medium: `mana_stream_medium_maerchenzauber_monthly_v1`
- Large: `mana_stream_large_maerchenzauber_monthly_v1`
- Giant: `mana_stream_giant_maerchenzauber_monthly_v1`

### Subscriptions (Yearly)
- Small: `mana_stream_small_maerchenzauber_yearly_v1`
- Medium: `mana_stream_medium_maerchenzauber_yearly_v1`
- Large: `mana_stream_large_maerchenzauber_yearly_v1`
- Giant: `mana_stream_giant_maerchenzauber_yearly_v1`

### Consumables (Mana Potions)
- Small: `mana_potion_small_maerchenzauber_v1`
- Medium: `mana_potion_medium_maerchenzauber_v1`
- Large: `mana_potion_large_maerchenzauber_v1`
- Giant: `mana_potion_giant_maerchenzauber_v1`

## Troubleshooting

### Products Not Loading

**Problem:** Subscription screen shows "Lade Abonnements..." indefinitely

**Solutions:**
1. Check RevenueCat API keys in `.env.local`
2. Verify offerings are configured in RevenueCat dashboard
3. Check console logs for `[RevenueCat]` error messages
4. Verify product IDs match between App Store Connect and `productIds.ts`

### Purchase Fails

**Problem:** "Der Kauf konnte nicht abgeschlossen werden"

**Solutions:**
1. Verify sandbox tester is signed in (for development)
2. Check RevenueCat dashboard for error events
3. Ensure products are approved in App Store Connect
4. Check console logs for detailed error messages

### User Not Identified

**Problem:** Purchases not associated with user account

**Solutions:**
1. Verify `identifyRevenueCatUser()` is called after login
2. Check that user ID is being passed correctly
3. Look for "User identified" log messages
4. Verify RevenueCat customer appears in dashboard

## Development Workflow

```bash
# 1. Start the app
cd mobile
npm run dev

# 2. Press 'i' for iOS simulator or 'a' for Android

# 3. Navigate to subscription screen
# Tap "Mana" button in header

# 4. Watch console logs
# Look for [RevenueCat] log messages

# 5. Test purchase flow
# Try both subscriptions and packages

# 6. Check RevenueCat dashboard
# Verify customer and purchase events appear
```

## Additional Resources

- [RevenueCat Documentation](https://docs.revenuecat.com/)
- [React Native SDK Guide](https://docs.revenuecat.com/docs/reactnative)
- [Testing Purchases](https://docs.revenuecat.com/docs/test-and-launch)
- [Webhook Integration](https://docs.revenuecat.com/docs/webhooks)

## Questions?

If you encounter any issues:
1. Check console logs for `[RevenueCat]` messages
2. Review RevenueCat dashboard for error events
3. Verify all configuration steps are completed
4. Refer to memoro_app implementation for reference
