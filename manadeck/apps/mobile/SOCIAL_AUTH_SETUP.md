# Social Authentication Setup Guide for Manadeck

This guide explains how to set up Google Sign-In and Apple Sign-In for the Manadeck mobile app.

## Overview

Manadeck uses Mana Core authentication middleware which supports:
- Email/Password authentication
- Google Sign-In (Android & iOS)
- Apple Sign-In (iOS only)

All authentication methods issue JWT tokens that work with your Supabase backend and respect Row-Level Security (RLS) policies.

## Prerequisites

### Required Accounts and Credentials

1. **Google Cloud Console Account**
   - OAuth 2.0 credentials for Android and iOS
   - Web Client ID (for Android)
   - iOS Client ID (for iOS)

2. **Apple Developer Account**
   - Sign in with Apple capability enabled
   - App ID configured with Sign in with Apple

3. **Mana Core Backend**
   - Backend must support `/v1/auth/google-signin` and `/v1/auth/apple-signin` endpoints
   - Backend URL configured in `.env.local`

## Installation

The required dependencies are already installed:
- `@react-native-google-signin/google-signin@^14.0.1`
- `expo-apple-authentication@~8.0.7`
- `base64-js`

## Configuration Steps

### 1. Google Cloud Console Setup

#### Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing project
3. Navigate to **APIs & Services → Credentials**

#### For Android:
1. Click **Create Credentials → OAuth 2.0 Client ID**
2. Select **Android** as application type
3. Fill in:
   - **Package name**: `com.tilljs.manadeck`
   - **SHA-1 certificate fingerprint**: Get from `cd android && ./gradlew signingReport`
4. Click **Create**

#### For iOS:
1. Click **Create Credentials → OAuth 2.0 Client ID**
2. Select **iOS** as application type
3. Fill in:
   - **Bundle ID**: `com.tilljs.manadeck`
4. Click **Create**
5. **Save the iOS Client ID** (format: `XXXXX.apps.googleusercontent.com`)

#### For Web (Required for Android):
1. Click **Create Credentials → OAuth 2.0 Client ID**
2. Select **Web application** as application type
3. Fill in:
   - **Name**: Manadeck Web (for Android)
4. Click **Create**
5. **Save the Web Client ID** (format: `XXXXX.apps.googleusercontent.com`)

### 2. Apple Developer Console Setup

#### Enable Sign in with Apple

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Identifiers** in the sidebar
4. Find and select your App ID: `com.tilljs.manadeck`
5. In the **Capabilities** section, find **Sign in with Apple**
6. Check the **Sign in with Apple** checkbox
7. Click **Save**

#### Configure in Xcode (Optional but Recommended)

1. Open your iOS project:
   ```bash
   cd /Users/tillschneider/Documents/__00__Code/manadeck/apps/mobile
   open ios/manadeck.xcworkspace
   ```
2. Select your project target in the left sidebar
3. Go to **Signing & Capabilities** tab
4. Click **+ Capability** button
5. Add **Sign in with Apple**
6. Ensure proper signing team is selected (Team ID: QP3GLU8PH3)

### 3. Update Environment Variables

Edit `/Users/tillschneider/Documents/__00__Code/manadeck/apps/mobile/.env.local`:

```bash
# Existing Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://vksoodohrbjwyloitvsz.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_2ndX-kBHFpbDlL_ZeeOnfQ_ZlLI8ONk

# Existing Backend API Configuration
EXPO_PUBLIC_API_URL=https://manadeck-backend-pduya7fsoq-ey.a.run.app

# Google OAuth Configuration (ADD THESE)
# Web Client ID (used for Android authentication)
EXPO_PUBLIC_GOOGLE_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
# iOS Client ID (used for iOS authentication)
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=YOUR_IOS_CLIENT_ID.apps.googleusercontent.com
```

**Replace the placeholder values with your actual OAuth Client IDs from Google Cloud Console.**

### 4. Update app.json

The `app.json` has already been configured with:

```json
{
  "expo": {
    "ios": {
      "config": {
        "googleSignIn": {
          "reservedClientId": "com.googleusercontent.apps.PLACEHOLDER_IOS_CLIENT_ID"
        }
      },
      "usesAppleSignIn": true
    },
    "plugins": [
      "expo-router",
      "@react-native-google-signin/google-signin",
      "expo-apple-authentication"
    ]
  }
}
```

**Important**: Replace `PLACEHOLDER_IOS_CLIENT_ID` in `app.json` with your actual iOS Client ID (without the `com.googleusercontent.apps.` prefix).

For example, if your iOS Client ID is `123456789-abc123.apps.googleusercontent.com`, the `reservedClientId` should be:
```json
"reservedClientId": "com.googleusercontent.apps.123456789-abc123"
```

### 5. Rebuild Native Code

After updating `app.json` and environment variables, rebuild the native code:

```bash
cd /Users/tillschneider/Documents/__00__Code/manadeck/apps/mobile

# For iOS
npx expo prebuild --clean
npx expo run:ios

# For Android
npx expo prebuild --clean
npx expo run:android
```

### 6. **IMPORTANT**: Manually Add iOS URL Scheme

**⚠️ Critical Step**: The Expo plugin may not automatically add the Google Sign-In URL scheme to iOS. You must verify and add it manually.

#### Verify and Add URL Scheme to Info.plist

1. Open `ios/manadeck/Info.plist`
2. Find the `CFBundleURLTypes` array
3. Add a new URL scheme entry for Google Sign-In:

```xml
<key>CFBundleURLTypes</key>
<array>
  <!-- Existing URL schemes -->
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>manadeck</string>
      <string>com.tilljs.manadeck</string>
    </array>
  </dict>

  <!-- Add this new entry for Google Sign-In -->
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>com.googleusercontent.apps.111768794939-cgen6eklloo7k8vppcaq01o8r8nd7anb</string>
    </array>
  </dict>
</array>
```

**Replace** `111768794939-cgen6eklloo7k8vppcaq01o8r8nd7anb` with your actual iOS Client ID.

#### Why This is Required

Without this URL scheme, Google Sign-In will fail with:
```
Your app is missing support for the following URL schemes:
com.googleusercontent.apps.XXXXX
```

iOS uses this URL scheme to redirect back to your app after Google authentication.

## Backend Requirements

Your Mana Core backend must support the following endpoints:

### POST `/v1/auth/google-signin`

**⚠️ Important**: The backend expects `deviceInfo` as a **nested object**, not spread at the root level.

Request body:
```json
{
  "token": "GOOGLE_ID_TOKEN",
  "deviceInfo": {
    "deviceId": "device-uuid",
    "deviceName": "iPhone 15 Pro",
    "deviceType": "ios"
  }
}
```

Response:
```json
{
  "appToken": "JWT_TOKEN",
  "refreshToken": "REFRESH_TOKEN"
}
```

### POST `/v1/auth/apple-signin`

**⚠️ Important**: The backend expects `deviceInfo` as a **nested object**, not spread at the root level.

Request body:
```json
{
  "token": "APPLE_IDENTITY_TOKEN",
  "deviceInfo": {
    "deviceId": "device-uuid",
    "deviceName": "iPhone 15 Pro",
    "deviceType": "ios"
  }
}
```

Response:
```json
{
  "appToken": "JWT_TOKEN",
  "refreshToken": "REFRESH_TOKEN"
}
```

**Common Error**: If you send device info spread at root level instead of nested:
```json
// ❌ WRONG - Will fail with "Complete device information is required"
{
  "token": "...",
  "deviceId": "...",
  "deviceName": "...",
  "deviceType": "ios"
}

// ✅ CORRECT - deviceInfo as nested object
{
  "token": "...",
  "deviceInfo": {
    "deviceId": "...",
    "deviceName": "...",
    "deviceType": "ios"
  }
}
```

## Testing

### Test on iOS

1. Build and run:
   ```bash
   cd /Users/tillschneider/Documents/__00__Code/manadeck/apps/mobile
   npx expo run:ios
   ```

2. Test Google Sign-In:
   - Tap "Mit Google anmelden"
   - Should show Google account picker
   - Select account
   - Should authenticate and navigate to home

3. Test Apple Sign-In:
   - Tap "Mit Apple anmelden"
   - Should show Face ID/Touch ID prompt
   - Authenticate
   - Should navigate to home

### Test on Android

1. Build and run:
   ```bash
   npx expo run:android
   ```

2. Test Google Sign-In:
   - Tap "Mit Google anmelden"
   - Should show Google account picker
   - Select account
   - Should authenticate and navigate to home

3. Apple Sign-In won't show on Android (iOS only)

## Project Structure

The social authentication implementation includes:

```
manadeck/apps/mobile/
├── services/
│   └── authService.ts              # Extended with Google/Apple methods
├── store/
│   └── authStore.ts                # Updated with social sign-in actions
├── components/
│   └── auth/
│       ├── GoogleSignInButton.tsx  # Google Sign-In button component
│       └── AppleSignInButton.tsx   # Apple Sign-In button component
├── app/
│   └── (auth)/
│       └── login.tsx               # Updated with social buttons
├── app.json                        # Configured with plugins
└── .env.local                      # OAuth credentials
```

## Troubleshooting

### Google Sign-In Issues

#### "Your app is missing support for the following URL schemes" on iOS
**Cause**: Google Sign-In URL scheme not added to Info.plist

**Solution**:
1. Open `ios/manadeck/Info.plist`
2. Add the Google Sign-In URL scheme to `CFBundleURLTypes`:
   ```xml
   <dict>
     <key>CFBundleURLSchemes</key>
     <array>
       <string>com.googleusercontent.apps.YOUR_IOS_CLIENT_ID</string>
     </array>
   </dict>
   ```
3. Replace `YOUR_IOS_CLIENT_ID` with your actual iOS Client ID
4. Rebuild the app: `npx expo run:ios`

#### "DEVELOPER_ERROR" on Android
**Cause**: SHA-1 fingerprint mismatch or incorrect web client ID

**Solution**:
```bash
# Get your SHA-1
cd android && ./gradlew signingReport

# Add SHA-1 to Google Cloud Console
# Use Web Client ID (not Android Client ID) in EXPO_PUBLIC_GOOGLE_CLIENT_ID
```

#### "Sign-in failed" on iOS
**Cause**: Incorrect iOS Client ID or bundle identifier mismatch

**Solution**:
- Verify `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` matches Google Cloud Console
- Verify bundle identifier in `app.json` matches Google Cloud Console
- Update `reservedClientId` in `app.json` with correct iOS Client ID

#### "Play Services not available"
**Cause**: Google Play Services missing or outdated on Android

**Solution**:
- Update Google Play Services on device
- Test on device with Google Play Store installed
- Use emulator with Google Play

### Apple Sign-In Issues

#### Button doesn't appear
**Cause**: Platform is not iOS

**Solution**: Apple Sign-In only works on iOS 13+

#### "Operation canceled" every time
**Cause**: Sign in with Apple not enabled in developer portal

**Solution**:
- Enable capability in Apple Developer Portal
- Add capability in Xcode
- Ensure `usesAppleSignIn: true` in `app.json`

### Backend Connection Issues

#### "Complete device information is required"
**Cause**: Device info sent incorrectly (spread at root instead of nested object)

**Solution**:
Ensure your authService sends `deviceInfo` as a nested object:
```typescript
// ✅ Correct
body: JSON.stringify({
  token: idToken,
  deviceInfo,  // Nested object
})

// ❌ Wrong
body: JSON.stringify({
  token: idToken,
  ...deviceInfo,  // Spread at root - will fail
})
```

#### "Network error" or timeout
**Cause**: Backend URL incorrect or unreachable

**Solution**:
- Verify `EXPO_PUBLIC_API_URL` is correct
- Test backend health endpoint
- Check network connectivity
- Ensure HTTPS is used (not HTTP)

#### "Invalid token" or "Authentication failed"
**Cause**: Backend endpoints not implemented or configured incorrectly

**Solution**:
- Verify backend supports `/v1/auth/google-signin` and `/v1/auth/apple-signin`
- Check backend logs for detailed error messages
- Ensure backend validates tokens correctly with Google/Apple

## Security Considerations

1. **Never commit credentials**: Keep `.env.local` in `.gitignore`
2. **Use HTTPS only**: Always use HTTPS for backend communication
3. **Validate tokens on backend**: Always validate social tokens on the backend
4. **Device binding**: Tokens are bound to device IDs for security
5. **Secure storage**: Tokens stored using platform-specific secure storage

## Production Setup

### For Production Release

**Android Production SHA-1:**

When ready to publish to Google Play, get your production SHA-1:

```bash
# For EAS builds
eas credentials -p android

# Or if using your own keystore
keytool -list -v -keystore /path/to/release.keystore -alias YOUR_KEY_ALIAS
```

Add the production SHA-1 to your Android OAuth client in Google Cloud Console.

**iOS Production:**

The same iOS Client ID works for both development and production.

## Additional Resources

- [React Native Google Sign-In Documentation](https://github.com/react-native-google-signin/google-signin)
- [Expo Apple Authentication Documentation](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Apple Sign In Guidelines](https://developer.apple.com/sign-in-with-apple/)

## Quick Reference

### Your Credentials (Fill in as you obtain them)

```
Web OAuth Client ID: ________________________________.apps.googleusercontent.com
iOS OAuth Client ID: ________________________________.apps.googleusercontent.com
Android SHA-1 (Debug): ________________________________
Android SHA-1 (Prod): ________________________________
Apple Team ID: QP3GLU8PH3
Bundle ID: com.tilljs.manadeck
Package Name: com.tilljs.manadeck
```

### Important Commands

```bash
# Get Android SHA-1
cd android && ./gradlew signingReport

# Rebuild native code
npx expo prebuild --clean

# Run on iOS
npx expo run:ios

# Run on Android
npx expo run:android

# Build with EAS
eas build --profile development
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review backend logs for detailed error messages
3. Consult Google Cloud Console and Apple Developer Portal documentation
4. Check that all credentials are correctly configured

---

**Integration completed successfully!** Social authentication is now available in the Manadeck mobile app.
