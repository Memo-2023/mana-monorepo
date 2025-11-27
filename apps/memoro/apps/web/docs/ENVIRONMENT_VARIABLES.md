# Environment Variables Guide

This document describes all environment variables used in the Memoro web application.

## Overview

The web app uses SvelteKit's environment variable system:

- **`PUBLIC_*`** prefix: Client-side accessible (exposed to browser)
- **No prefix**: Server-side only (secure, not exposed to browser)

## Required Variables

### Supabase Configuration

These are required for the app to function:

```bash
PUBLIC_SUPABASE_URL=https://npgifbrwhftlbrbaglmi.supabase.co
PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

- **`PUBLIC_SUPABASE_URL`**: Your Supabase project URL
- **`PUBLIC_SUPABASE_ANON_KEY`**: Supabase anonymous/public key for client-side auth

**Where to find:**

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your Memoro project
3. Go to Settings → API
4. Copy "Project URL" and "anon/public" key

### Middleware Service URLs

Required for transcription and processing:

```bash
PUBLIC_MEMORO_MIDDLEWARE_URL=https://memoro-service-111768794939.europe-west3.run.app
PUBLIC_MANA_MIDDLEWARE_URL=https://mana-core-middleware-111768794939.europe-west3.run.app
PUBLIC_MIDDLEWARE_APP_ID=973da0c1-b479-4dac-a1b0-ed09c72caca8
```

- **`PUBLIC_MEMORO_MIDDLEWARE_URL`**: Memoro transcription service endpoint
- **`PUBLIC_MANA_MIDDLEWARE_URL`**: Mana core middleware service endpoint
- **`PUBLIC_MIDDLEWARE_APP_ID`**: Application identifier for middleware authentication

**Usage:**

- Audio transcription requests
- Memo processing pipeline
- AI-powered insights generation

### Storage Configuration

Required for audio file uploads:

```bash
PUBLIC_STORAGE_BUCKET=user-uploads
```

- **`PUBLIC_STORAGE_BUCKET`**: Supabase Storage bucket name for audio files

**Setup:**

1. Go to Supabase Dashboard → Storage
2. Create bucket named `user-uploads` (or your preferred name)
3. Set appropriate access policies (RLS)

### Google OAuth

Required for Google Sign-In:

```bash
PUBLIC_GOOGLE_CLIENT_ID=624477741877-67or55qpi440mlg1t46e178ta2gmcll9.apps.googleusercontent.com
```

- **`PUBLIC_GOOGLE_CLIENT_ID`**: Google OAuth client ID for web application

**Setup:**
See `docs/OAUTH_SETUP.md` for complete Google OAuth setup instructions.

## Optional Variables

### PostHog Analytics

For user analytics and product insights:

```bash
PUBLIC_POSTHOG_KEY=phc_SdmYfeCIZDgIfj87SNCpId18a5edPqtnmam6f0H4dWJ
PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

- **`PUBLIC_POSTHOG_KEY`**: PostHog project API key
- **`PUBLIC_POSTHOG_HOST`**: PostHog instance URL (EU or US)

**Setup:**

1. Create account at [PostHog](https://posthog.com/)
2. Create new project
3. Copy project API key
4. Choose region: `https://eu.i.posthog.com` (EU) or `https://app.posthog.com` (US)

**Features when enabled:**

- User behavior tracking
- Feature usage analytics
- A/B testing support
- Session recordings
- Funnels and retention analysis

### Sentry Error Tracking

For production error monitoring:

```bash
SENTRY_AUTH_TOKEN=sntrys_...
PUBLIC_SENTRY_DSN=https://YOUR_DSN@sentry.io/PROJECT_ID
```

- **`SENTRY_AUTH_TOKEN`**: Sentry authentication token (server-side, for source maps)
- **`PUBLIC_SENTRY_DSN`**: Sentry DSN for client-side error reporting

**Setup:**

1. Create account at [Sentry](https://sentry.io/)
2. Create new project (select SvelteKit)
3. Copy DSN from project settings
4. Generate auth token: Settings → Developer Settings → Auth Tokens

**Features when enabled:**

- Real-time error tracking
- Stack traces with source maps
- Performance monitoring
- Release tracking
- User feedback

## Environment Files

### `.env` (Development)

Your local development environment variables. This file is **gitignored** and should never be committed.

```bash
# Copy from .env.example
cp .env.example .env

# Edit with your actual values
nano .env
```

### `.env.example` (Template)

Template file with placeholder values. This file **is committed** to Git and serves as documentation.

```bash
# Shows required variables
# Does not contain real secrets
# Safe to commit
```

### `.env.production` (Production)

Production environment variables. Configure these in your hosting platform:

**Vercel:**

1. Go to Project Settings → Environment Variables
2. Add each `PUBLIC_*` variable
3. Add server-only variables (like `SENTRY_AUTH_TOKEN`)

**Netlify:**

1. Go to Site Settings → Build & Deploy → Environment
2. Add each variable
3. Choose deploy contexts (Production/Preview/Branch)

**Other Platforms:**
Follow platform-specific instructions for environment variables.

## Type-Safe Access

Use the `env` helper for type-safe access:

```typescript
import { env } from '$lib/config/env';

// Supabase
const url = env.supabase.url;
const key = env.supabase.anonKey;

// Middleware
const transcriptionUrl = env.middleware.memoroUrl;
const appId = env.middleware.appId;

// Storage
const bucket = env.storage.bucket;

// OAuth
const googleClientId = env.oauth.googleClientId;

// Analytics (optional)
if (env.analytics.posthog.key) {
	// Initialize PostHog
}

// Error tracking (optional)
if (env.sentry.dsn) {
	// Initialize Sentry
}
```

## Feature Flags

Check if optional features are enabled:

```typescript
import { features } from '$lib/config/env';

if (features.hasPosthog) {
	console.log('PostHog analytics enabled');
}

if (features.hasSentry) {
	console.log('Sentry error tracking enabled');
}
```

## Security Best Practices

### DO NOT

❌ Commit `.env` files with real secrets
❌ Hardcode API keys in source code
❌ Share environment variables in public channels
❌ Use production keys in development
❌ Expose server-only variables to client

### DO

✅ Use `.env.example` as template
✅ Keep `.env` in `.gitignore`
✅ Rotate secrets regularly
✅ Use different keys for dev/staging/production
✅ Use `PUBLIC_*` prefix only for truly public data
✅ Store sensitive data server-side only
✅ Use platform environment variable management in production

## Shared Variables with Mobile App

The web app shares these services with the React Native mobile app:

- ✅ **Supabase** - Same database, authentication, storage
- ✅ **Middleware APIs** - Same transcription and processing services
- ✅ **OAuth providers** - Shared Google OAuth project (different client IDs)
- ✅ **Analytics** - Same PostHog project (optional)
- ✅ **Error tracking** - Same Sentry organization (optional)

**Not shared:**

- ❌ **RevenueCat** - Mobile only (in-app purchases)
- ❌ **Native features** - Camera, biometrics, notifications

## Troubleshooting

### Error: "Cannot read properties of undefined"

**Cause:** Environment variable not defined or has typo.

**Solution:**

1. Check `.env` file exists
2. Verify variable name matches (case-sensitive)
3. Restart dev server after changes
4. Check for typos in variable names

### Error: "PUBLIC\_\* is not defined"

**Cause:** Trying to access client-side variable that doesn't exist.

**Solution:**

1. Ensure variable has `PUBLIC_` prefix
2. Add to `.env` file
3. Restart dev server
4. Check TypeScript declarations in `app.d.ts`

### Warning: "Build succeeded but with warnings"

**Cause:** Optional variables (PostHog, Sentry) are undefined.

**Solution:** This is normal if you haven't configured optional services. The app will work without them.

### Production Build Fails

**Cause:** Required environment variables missing in build environment.

**Solution:**

1. Add variables to hosting platform
2. Verify variable names exactly match
3. Ensure `PUBLIC_` prefix for client-side variables
4. Check build logs for specific missing variables

## Migration from Mobile App

If you have the React Native app's `.env`:

```bash
# Mobile app (.env) → Web app (.env) mapping:

EXPO_PUBLIC_SUPABASE_URL → PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY → PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_MEMORO_MIDDLEWARE_URL → PUBLIC_MEMORO_MIDDLEWARE_URL
EXPO_PUBLIC_MANA_MIDDLEWARE_URL → PUBLIC_MANA_MIDDLEWARE_URL
EXPO_PUBLIC_MIDDLEWARE_APP_ID → PUBLIC_MIDDLEWARE_APP_ID
EXPO_PUBLIC_STORAGE_BUCKET → PUBLIC_STORAGE_BUCKET
EXPO_PUBLIC_GOOGLE_CLIENT_ID → PUBLIC_GOOGLE_CLIENT_ID (use web client ID!)
EXPO_PUBLIC_POSTHOG_KEY → PUBLIC_POSTHOG_KEY
EXPO_PUBLIC_POSTHOG_HOST → PUBLIC_POSTHOG_HOST
SENTRY_AUTH_TOKEN → SENTRY_AUTH_TOKEN (same)
```

**Important:** Use the **web** Google OAuth client ID, not the iOS/Android IDs!

## Resources

- [SvelteKit Environment Variables](https://kit.svelte.dev/docs/modules#$env-static-public)
- [Supabase Dashboard](https://app.supabase.com/)
- [PostHog Setup](https://posthog.com/docs)
- [Sentry Setup](https://docs.sentry.io/platforms/javascript/guides/sveltekit/)
- [Google OAuth Setup](docs/OAUTH_SETUP.md)
