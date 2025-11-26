# Sentry SDK 54 Compatibility Workaround

## Issue
Sentry React Native SDK (v6.20.0 and even v7.1.0) is incompatible with Expo SDK 54's Metro bundler (metro@0.83).

The error occurs during EAS builds:
```
TypeError: countLines is not a function
    at createDebugIdModule (@sentry/react-native/src/js/tools/sentryMetroSerializer.ts:182:22)
```

## Temporary Fix Applied
1. **metro.config.js**: Disabled Sentry's Metro configuration
   - Commented out `getSentryExpoConfig`
   - Using `getDefaultConfig` from expo/metro-config instead

2. **app.json**: Removed Sentry plugin temporarily
   - Commented out the `@sentry/react-native/expo` plugin configuration

## Impact
- Sentry error tracking still works in the app
- Source maps and debug symbols won't be uploaded to Sentry
- Stack traces in Sentry may be less detailed

## To Revert When Fixed
1. Uncomment Sentry imports in `metro.config.js`
2. Re-add Sentry plugin configuration to `app.json`
3. Monitor GitHub issue: https://github.com/getsentry/sentry-react-native/issues/5180

## Expected Fix
Sentry team is aware and working on SDK 54 compatibility. Expected in v7.2.0 or later.

Date: 2025-09-23