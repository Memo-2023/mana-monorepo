# Google Sign-In with Supabase in Memoro App

This guide explains how to set up and use Google Sign-In with Supabase in the Memoro app.

## Prerequisites

1. A Google Cloud project
2. A Supabase project
3. Access to the Memoro app codebase

## Setup Steps

### 1. Configure Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "OAuth consent screen"
4. Set up the consent screen with the required information
5. Add the following scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
6. Navigate to "APIs & Services" > "Credentials"
7. Create OAuth client IDs for each platform:
   - Web application
   - iOS
   - Android

#### For iOS:
- Provide your app's Bundle ID
- Add App Store ID and Team ID if the app is already published

#### For Android:
- Provide the package name
- Generate the SHA-1 certificate fingerprint using:
  ```
  keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
  ```
- For production, generate the SHA-1 using your release keystore

### 2. Configure Supabase

1. Go to the [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to "Authentication" > "Providers"
4. Enable Google provider
5. Add the Client IDs from Google Cloud Console
   - Web Client ID
   - iOS Client ID
   - Android Client ID
6. Save the changes

### 3. Update Environment Variables

Add the following variables to your `.env` file:

```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id
```

### 4. iOS Configuration

Update your `Info.plist` file to include:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleTypeRole</key>
    <string>Editor</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <!-- Replace with your reversed client ID -->
      <string>com.googleusercontent.apps.YOUR_CLIENT_ID</string>
    </array>
  </dict>
</array>
```

### 5. Android Configuration

Ensure your `AndroidManifest.xml` includes:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<meta-data
  android:name="com.google.android.gms.version"
  android:value="@integer/google_play_services_version" />
```

## Usage

The Google Sign-In button is now available on the login and registration screens. When users click this button:

1. They will be prompted to select a Google account
2. After selecting an account and granting permissions, they will be authenticated
3. The app will receive their profile information and create or authenticate their account
4. They will be redirected to the home screen

## Troubleshooting

### Common Issues:

1. **"No Google ID token found"**: Ensure the Google Sign-In configuration is correct and the required scopes are enabled.

2. **"Invalid client ID"**: Double-check that the client IDs in your `.env` file match those in the Google Cloud Console.

3. **"Sign-in was canceled"**: The user canceled the sign-in process. No action needed.

4. **"Play Services not available"**: The user's device doesn't have Google Play Services installed or updated. Prompt them to update Google Play Services.

5. **"Error in authentication flow"**: Check the Supabase dashboard logs for more details on the error.

For more information, refer to:
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [React Native Google Sign-In Documentation](https://github.com/react-native-google-signin/google-signin)
