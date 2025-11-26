# Social Authentication Setup Guide for Märchenzauber

This guide will walk you through setting up Google Sign-In and Apple Sign-In for the Märchenzauber app.

## App Information Summary

**Collected Information:**
- **App Name**: Märchen Zauber (Märchenzauber)
- **iOS Bundle ID**: `com.memoro.maerchenzauber`
- **Android Package Name**: `com.memoro.maerchenzauber`
- **Android SHA-1 (Debug)**: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`

---

## Part 1: Google Cloud Console Setup

### Step 1: Create or Select Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Sign in with your Google account
3. Click the project dropdown at the top
4. Either:
   - **Create new project**: Click "New Project", name it "Märchenzauber" (or similar)
   - **Select existing project**: Choose your existing project

### Step 2: Enable Google Sign-In API

1. In your Google Cloud project, go to **APIs & Services → Library**
2. Search for "Google Sign-In API" or "Google+ API"
3. Click **Enable**

### Step 3: Create OAuth Consent Screen

1. Go to **APIs & Services → OAuth consent screen**
2. Select **External** user type (unless you have Google Workspace)
3. Click **Create**
4. Fill in required fields:
   - **App name**: Märchenzauber
   - **User support email**: Your email
   - **Developer contact email**: Your email
5. Click **Save and Continue**
6. **Scopes**: Click **Add or Remove Scopes**, add:
   - `email`
   - `profile`
   - `openid`
7. Click **Save and Continue**
8. **Test users** (optional during development): Add your test email addresses
9. Click **Save and Continue**, then **Back to Dashboard**

### Step 4: Create Android OAuth Client

1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth 2.0 Client ID**
3. Select **Android** as application type
4. Fill in:
   - **Name**: Märchenzauber Android
   - **Package name**: `com.memoro.maerchenzauber`
   - **SHA-1 certificate fingerprint**: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
5. Click **Create**
6. **Note**: You don't need to download anything for Android
111768794939-91fgpc7bf0bu1ss50nonscmmp4k1dvbb.apps.googleusercontent.com
### Step 5: Create iOS OAuth Client

1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth 2.0 Client ID**
3. Select **iOS** as application type
4. Fill in:
   - **Name**: Märchenzauber iOS
   - **Bundle ID**: `com.memoro.maerchenzauber`
5. Click **Create**
6. **SAVE THIS**: Copy the **iOS Client ID** (format: `XXXXX.apps.googleusercontent.com`)
   - Example: `111768794939-dtmimmtn6op11a39bo1v4o7et4h913dd.apps.googleusercontent.com`

### Step 6: Create Web OAuth Client (Required for Android)

**Important**: Android Google Sign-In requires a Web Client ID to work properly.

1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth 2.0 Client ID**
3. Select **Web application** as application type
4. Fill in:
   - **Name**: Märchenzauber Web (for Android)
   - **Authorized redirect URIs**: Leave empty (not needed for mobile)
5. Click **Create**
6. **SAVE THIS**: Copy the **Web Client ID** (format: `XXXXX.apps.googleusercontent.com`)
   - Example: `1111768794939-uu9b50hlh1mmsd1v8pdm4s58o04lqh22.apps.googleusercontent.com`

### Step 7: Google Services Files (OPTIONAL - Not Required!)

**You can SKIP this step!**

The `google-services.json` and `GoogleService-Info.plist` files are only needed if you want to use Firebase services (like Firebase Analytics, Cloud Messaging, etc.).

**For Google Sign-In authentication only, you DON'T need these files.** You already have everything you need from Steps 4-6 (OAuth credentials).

<details>
<summary>Only if you want Firebase services (click to expand)</summary>

**For Android:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new Firebase project or link existing Google Cloud project
3. Add Android app:
   - Package name: `com.memoro.maerchenzauber`
   - App nickname: Märchenzauber
   - SHA-1: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
4. Download `google-services.json`
5. Place in `android/app/google-services.json`

**For iOS:**
1. In Firebase Console, add iOS app:
   - Bundle ID: `com.memoro.maerchenzauber`
   - App nickname: Märchenzauber
2. Download `GoogleService-Info.plist`
3. Place in mobile root or `ios/` directory

</details>

---

## Part 2: Apple Sign-In Setup

### Step 1: Enable Sign in with Apple in Apple Developer Portal

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Sign in with your Apple ID
3. Navigate to **Certificates, Identifiers & Profiles**
4. Click **Identifiers** in the sidebar
5. Find and select your App ID: `com.memoro.maerchenzauber`
6. In the **Capabilities** section, find **Sign in with Apple**
7. Check the **Sign in with Apple** checkbox
8. Click **Save**

### Step 2: Configure in Xcode (Optional but Recommended)

1. Open your iOS project:
   ```bash
   cd /Users/wuesteon/memoro_new/mana-2025/storyteller-project/mobile
   open ios/maerchenzauber.xcworkspace  # or .xcodeproj if no workspace
   ```
2. Select your project target in the left sidebar
3. Go to **Signing & Capabilities** tab
4. Click **+ Capability** button
5. Add **Sign in with Apple**
6. Ensure proper signing team is selected

---

## Part 3: Project Configuration

### Step 1: Update app.json

Add Google Sign-In and Apple Sign-In configuration to your `app.json`:

```json
{
  "expo": {
    "name": "Märchen Zauber",
    "slug": "maerchen-zauber",
    "version": "1.1.0",
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.memoro.maerchenzauber",
      "buildNumber": "31",
      "jsEngine": "jsc",
      "config": {
        "googleSignIn": {
          "reservedClientId": "111768794939-dtmimmtn6op11a39bo1v4o7et4h913dd.apps.googleusercontent.com"
        }
      },
      "usesAppleSignIn": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.memoro.maerchenzauber",
      "versionCode": 31,
      "jsEngine": "jsc"
    },
    "plugins": [
      "expo-router",
      "expo-localization",
      "expo-secure-store",
      "@react-native-google-signin/google-signin",
      "expo-apple-authentication"
    ]
  }
}
```

**Note**: No `googleServicesFile` needed! The OAuth client IDs are all you need for Google Sign-In.

### Step 2: Create Environment Variables

Create or update `.env.local` in your mobile directory:

```bash
# Google OAuth Configuration
EXPO_PUBLIC_GOOGLE_CLIENT_ID=1111768794939-uu9b50hlh1mmsd1v8pdm4s58o04lqh22.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=111768794939-dtmimmtn6op11a39bo1v4o7et4h913dd.apps.googleusercontent.com

# Middleware Configuration (if using manadeck middleware)
EXPO_PUBLIC_MEMORO_MIDDLEWARE_URL=https://manadeck-backend-pduya7fsoq-ey.a.run.app
EXPO_PUBLIC_MIDDLEWARE_APP_ID=YOUR_APP_ID_FROM_MIDDLEWARE

# Existing configuration
EXPO_PUBLIC_STORYTELLER_BACKEND_URL=https://storyteller-backend-pduya7fsoq-ey.a.run.app
EXPO_PUBLIC_API_URL=https://storyteller-backend-pduya7fsoq-ey.a.run.app
```

**Note**: Your OAuth Client IDs are already filled in! You just need to get `YOUR_APP_ID_FROM_MIDDLEWARE` from your middleware admin.

### Step 3: Install Required Dependencies

```bash
cd /Users/wuesteon/memoro_new/mana-2025/storyteller-project/mobile

# Install Google Sign-In
npm install @react-native-google-signin/google-signin@^14.0.1

# Install Apple Authentication
npm install expo-apple-authentication@~8.0.7

# Install additional dependencies if needed
npm install base64-js
npm install @react-native-async-storage/async-storage
```

---

## Part 4: Code Implementation

### Step 1: Copy Auth Files from memoro_app

You need to copy the following files from the memoro_app to your storyteller app:

**Core Services:**
```bash
# Create directories
mkdir -p src/features/auth/services
mkdir -p src/features/auth/components
mkdir -p src/features/auth/contexts
mkdir -p src/features/auth/utils
mkdir -p src/features/auth/types

# Copy from memoro_app (adjust paths as needed)
cp /path/to/memoro_app/features/auth/services/authService.ts src/features/auth/services/
cp /path/to/memoro_app/features/auth/services/tokenManager.ts src/features/auth/services/
cp /path/to/memoro_app/features/auth/components/GoogleSignInButton.tsx src/features/auth/components/
cp /path/to/memoro_app/features/auth/components/AppleSignInButton.tsx src/features/auth/components/
cp /path/to/memoro_app/features/auth/contexts/AuthContext.tsx src/features/auth/contexts/
cp /path/to/memoro_app/features/auth/utils/* src/features/auth/utils/
cp /path/to/memoro_app/features/auth/types/auth.types.ts src/features/auth/types/
```

**Or follow the integration guide to create these files manually:**
See `/Users/wuesteon/memoro_new/mana-2025/SOCIAL_AUTH_INTEGRATION_GUIDE.md` for complete code examples.

### Step 2: Update Your Auth Screen

Add the social sign-in buttons to your existing auth screen:

```typescript
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { AppleSignInButton } from '../components/AppleSignInButton';

export function AuthScreen() {
  return (
    <View>
      {/* Your existing auth UI */}

      <View style={{ gap: 12, marginTop: 20 }}>
        <GoogleSignInButton />
        <AppleSignInButton />
      </View>
    </View>
  );
}
```

---

## Part 5: Testing

### Test on iOS

1. Build and run:
   ```bash
   cd /Users/wuesteon/memoro_new/mana-2025/storyteller-project/mobile
   npm run ios
   ```

2. Test Google Sign-In:
   - Tap "Sign in with Google"
   - Should show Google account picker
   - Select account
   - Should authenticate and navigate to home

3. Test Apple Sign-In:
   - Tap "Sign in with Apple"
   - Should show Face ID/Touch ID prompt
   - Authenticate
   - Should navigate to home

### Test on Android

1. Build and run:
   ```bash
   npm run android
   ```

2. Test Google Sign-In:
   - Tap "Sign in with Google"
   - Should show Google account picker
   - Select account
   - Should authenticate and navigate to home

3. Apple Sign-In won't show on Android (iOS only)

---

## Part 6: Production Setup

### For Production Release

**Android Production SHA-1:**

When you're ready to publish to Google Play, you need your production SHA-1:

```bash
# For EAS builds
eas credentials -p android

# Or if using your own keystore
keytool -list -v -keystore /path/to/release.keystore -alias YOUR_KEY_ALIAS
```

Add the production SHA-1 to your Android OAuth client in Google Cloud Console.

**iOS Production:**

The same iOS Client ID works for both development and production.

---

## Checklist

Use this checklist to track your progress:

### Google Cloud Console
- [ ] Created/selected Google Cloud project
- [ ] Enabled Google Sign-In API
- [ ] Created OAuth consent screen
- [ ] Created Android OAuth client with SHA-1
- [ ] Created iOS OAuth client
- [ ] Created Web OAuth client
- [ ] ~~Downloaded google-services files~~ (Not needed for Google Sign-In only!)

### Apple Developer Portal
- [ ] Enabled Sign in with Apple capability for app ID
- [ ] Configured in Xcode (optional)

### Project Configuration
- [ ] Updated `app.json` with Google Sign-In config (iOS client ID)
- [ ] Updated `app.json` with Apple Sign-In config
- [ ] Added plugins to `app.json`
- [ ] Created `.env.local` with OAuth credentials
- [ ] Installed npm dependencies

### Code Implementation
- [ ] Copied/created auth service files
- [ ] Added GoogleSignInButton component
- [ ] Added AppleSignInButton component
- [ ] Updated auth screen with social buttons
- [ ] Set up AuthContext
- [ ] Set up fetch interceptor

### Testing
- [ ] Tested Google Sign-In on iOS
- [ ] Tested Google Sign-In on Android
- [ ] Tested Apple Sign-In on iOS
- [ ] Verified token storage
- [ ] Verified navigation after auth

---

## Troubleshooting

### "DEVELOPER_ERROR" on Android

**Problem**: Google Sign-In fails with DEVELOPER_ERROR

**Solutions**:
1. Verify SHA-1 fingerprint is correct in Google Cloud Console
2. Make sure you're using the **Web Client ID** in `EXPO_PUBLIC_GOOGLE_CLIENT_ID`
3. Ensure `google-services.json` is in `android/app/`
4. Rebuild the app completely:
   ```bash
   cd android && ./gradlew clean && cd ..
   npx expo prebuild --clean
   npx expo run:android
   ```

### Google Sign-In button not showing

**Solutions**:
1. Check that `@react-native-google-signin/google-signin` is installed
2. Verify plugin is in `app.json`
3. Run `npx expo prebuild --clean` to regenerate native code

### Apple Sign-In button not showing on iOS

**Solutions**:
1. Verify `expo-apple-authentication` is installed
2. Check that `usesAppleSignIn: true` is in `app.json` under `ios`
3. Ensure plugin is listed: `"expo-apple-authentication"`
4. Run `npx expo prebuild --clean`

### Network errors / 401 errors

**Solutions**:
1. Verify middleware URL is correct in `.env.local`
2. Check app ID from middleware
3. Test middleware health: `curl https://your-middleware-url/health`

---

## Quick Reference

### Your Credentials (Fill these in as you get them)

```
Web OAuth Client ID: ________________________________.apps.googleusercontent.com
iOS OAuth Client ID: ________________________________.apps.googleusercontent.com
Android SHA-1: 5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
Middleware App ID: ________________________________
```

### Important File Locations

```
Google Services (Android): android/app/google-services.json
Google Services (iOS): GoogleService-Info.plist (mobile root or ios/)
Environment Config: .env.local
App Config: app.json
Auth Components: src/features/auth/components/
Auth Services: src/features/auth/services/
```

---

## Next Steps

After completing this setup:

1. Test thoroughly on both iOS and Android
2. Set up production keystores and get production SHA-1
3. Update Google Cloud Console with production SHA-1
4. Test on TestFlight (iOS) and Internal Testing (Android)
5. Submit to App Store and Google Play

For detailed code implementation, see:
- `/Users/wuesteon/memoro_new/mana-2025/SOCIAL_AUTH_INTEGRATION_GUIDE.md`
- `/Users/wuesteon/memoro_new/mana-2025/memoro_app/features/auth/` for reference implementation

---

## Support

If you encounter issues:
1. Check this troubleshooting section
2. Review the main integration guide
3. Check memoro_app implementation for reference
4. Review Google/Apple documentation
5. Check middleware logs for auth errors
