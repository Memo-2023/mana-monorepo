# PostHog Analytics Setup

This document describes how to set up PostHog Analytics for the Picture web application.

## Overview

PostHog is a powerful product analytics platform that provides:
- 📊 **Product Analytics**: Track user behavior and product usage
- 🎯 **Feature Flags**: Roll out features gradually and A/B test
- 📹 **Session Recordings**: Watch how users interact with your app
- 🔥 **Heatmaps**: Visualize where users click and scroll
- 👥 **User Profiles**: Understand individual user journeys

## Architecture

### Web App (SvelteKit)
- **Location**: `apps/web/src/lib/analytics/posthog.ts`
- **Framework**: SvelteKit
- **SDK**: posthog-js
- **Integration**: Initialized in root layout with automatic user identification

## Configuration

PostHog is configured using environment variables:

```bash
PUBLIC_POSTHOG_KEY=phc_your_posthog_project_api_key
PUBLIC_POSTHOG_HOST=https://us.i.posthog.com  # or https://eu.i.posthog.com for EU
```

### Environment Variables

Create or update `apps/web/.env`:

```bash
PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxx
PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

> **Note**: The `PUBLIC_` prefix is required in SvelteKit to expose variables to the client.

## Features

### 🔐 Privacy-First Configuration
- ✅ **Identified Users Only**: `person_profiles: 'identified_only'` - only tracks logged-in users
- ✅ **localStorage Persistence**: Uses localStorage instead of cookies
- ✅ **No Autocapture**: Manual event tracking for better control
- ✅ **Session Recording Disabled**: Can be enabled if needed

### 🚀 Automatic Features
- ✅ **Pageview Tracking**: Automatically tracks page navigation
- ✅ **Page Leave Tracking**: Tracks when users leave pages
- ✅ **User Identification**: Automatically identifies users on login/logout
- ✅ **User Properties**: Tracks email and account creation date

### 📊 Current Implementation

#### User Identification
Users are automatically identified on login with:
- User ID (from Supabase)
- Email address
- Account creation timestamp

```typescript
// Automatically done on login
analytics.identify(user.id, {
  email: user.email,
  created_at: user.created_at
});
```

#### Session Management
- **Login**: User is identified in PostHog
- **Logout**: PostHog session is reset
- **Auth State Changes**: PostHog identity is updated automatically

## Setup Steps

### 1. Create PostHog Account

You have two options:

#### Option A: PostHog Cloud (Recommended)
1. Sign up at [posthog.com](https://posthog.com)
2. Create a new project
3. Select your region (US or EU)
4. Copy your Project API Key (starts with `phc_`)

#### Option B: Self-Hosted PostHog
1. Follow the [PostHog deployment guide](https://posthog.com/docs/self-host)
2. Deploy to your preferred platform
3. Create a project
4. Note your instance URL and API key

### 2. Configure Environment Variables

#### Development
1. Copy `.env.example` to `.env` in `apps/web`:
   ```bash
   cd apps/web
   cp .env.example .env
   ```

2. Add your PostHog credentials:
   ```bash
   PUBLIC_POSTHOG_KEY=phc_your_actual_api_key
   PUBLIC_POSTHOG_HOST=https://us.i.posthog.com  # or eu.i.posthog.com
   ```

#### Production
Add environment variables to your deployment platform:

**Vercel:**
```bash
vercel env add PUBLIC_POSTHOG_KEY
vercel env add PUBLIC_POSTHOG_HOST
```

**Netlify:**
- Go to Site settings → Environment variables
- Add `PUBLIC_POSTHOG_KEY` and `PUBLIC_POSTHOG_HOST`

**Other platforms:**
- Follow your platform's documentation for environment variables
- Ensure variables are prefixed with `PUBLIC_`

### 3. Verify Integration

1. Start the development server:
   ```bash
   cd apps/web
   pnpm dev
   ```

2. Open browser DevTools → Console
3. Look for "PostHog loaded" message (in dev mode)
4. Navigate between pages
5. Log in with a test account
6. Check PostHog dashboard for events

## Usage

### Tracking Custom Events

The analytics helper provides easy-to-use methods:

```typescript
import { analytics } from '$lib/analytics/posthog';

// Track a custom event
analytics.track('button_clicked', {
  button_name: 'sign_up',
  page: '/pricing'
});

// Track image generation
analytics.track('image_generated', {
  model: 'flux-dev',
  prompt_length: 150,
  aspect_ratio: '16:9'
});

// Track feature usage
analytics.track('feature_used', {
  feature: 'batch_generation',
  count: 5
});
```

### User Properties

Set additional user properties:

```typescript
import { analytics } from '$lib/analytics/posthog';

analytics.setUserProperties({
  plan: 'pro',
  images_generated: 42,
  favorite_model: 'flux-dev'
});
```

### Feature Flags

Use feature flags for gradual rollouts and A/B testing:

```typescript
import { analytics } from '$lib/analytics/posthog';

// Check if a feature is enabled
const showNewUI = analytics.isFeatureEnabled('new_ui_redesign');

// Get feature flag value (for multivariate flags)
const buttonColor = analytics.getFeatureFlag('button_color_test');
```

### Page View Tracking

Page views are tracked automatically. For manual tracking:

```typescript
import { analytics } from '$lib/analytics/posthog';

// Track a specific page view
analytics.pageView('/custom-page');
```

## Example Use Cases

### Track Image Generation

```typescript
// In your image generation component
import { analytics } from '$lib/analytics/posthog';

async function generateImage(prompt: string, settings: Settings) {
  // Track the generation attempt
  analytics.track('image_generation_started', {
    model: settings.model,
    prompt_length: prompt.length,
    aspect_ratio: settings.aspectRatio,
    num_images: settings.numImages
  });

  try {
    const result = await generateImageAPI(prompt, settings);

    // Track success
    analytics.track('image_generation_completed', {
      model: settings.model,
      generation_time_ms: result.duration
    });

    return result;
  } catch (error) {
    // Track errors
    analytics.track('image_generation_failed', {
      model: settings.model,
      error: error.message
    });
    throw error;
  }
}
```

### Track User Engagement

```typescript
// Track when users interact with images
analytics.track('image_liked', {
  image_id: image.id,
  model: image.model
});

analytics.track('image_shared', {
  image_id: image.id,
  platform: 'twitter'
});

analytics.track('image_downloaded', {
  image_id: image.id,
  format: 'png'
});
```

### Track Feature Discovery

```typescript
// Track when users discover features
analytics.track('feature_discovered', {
  feature: 'batch_generation',
  source: 'tooltip'
});

analytics.track('tutorial_completed', {
  tutorial: 'first_generation'
});
```

## PostHog Dashboard

### Key Metrics to Track

1. **User Engagement**
   - Daily/Weekly/Monthly Active Users
   - Session duration
   - Pages per session

2. **Feature Usage**
   - Image generation count
   - Most used models
   - Popular aspect ratios
   - Batch generation usage

3. **User Journey**
   - Signup → First generation time
   - Feature adoption rate
   - Retention cohorts

4. **Errors & Issues**
   - Generation failures
   - Error rates by model
   - API timeout frequency

### Creating Insights

1. **Funnel Analysis**
   ```
   Sign Up → First Generation → Image Download → Share
   ```

2. **Retention**
   ```
   Track users who return after first generation
   ```

3. **Trends**
   ```
   Image generations over time
   Model popularity trends
   ```

## Feature Flags Setup

### Create a Feature Flag

1. Go to PostHog → Feature Flags
2. Click "New feature flag"
3. Set flag key (e.g., `new_ui_redesign`)
4. Configure rollout percentage
5. Save and deploy

### Use in Code

```svelte
<script lang="ts">
  import { analytics } from '$lib/analytics/posthog';
  import { onMount } from 'svelte';

  let showNewUI = false;

  onMount(() => {
    showNewUI = analytics.isFeatureEnabled('new_ui_redesign');
  });
</script>

{#if showNewUI}
  <NewUIComponent />
{:else}
  <OldUIComponent />
{/if}
```

## Session Recordings (Optional)

Session recordings are **disabled by default** for privacy. To enable:

1. Update `apps/web/src/lib/analytics/posthog.ts`:
   ```typescript
   disable_session_recording: false, // Enable recordings
   ```

2. Configure in PostHog dashboard:
   - Set recording sample rate
   - Configure privacy settings
   - Set up retention period

3. Add privacy notice to your app

## Privacy & Compliance

### GDPR Compliance
- ✅ Only tracks identified (logged-in) users
- ✅ Users can opt-out via PostHog settings
- ✅ Data retention policies can be configured
- ✅ Personal data can be deleted on request

### User Opt-Out

To allow users to opt-out:

```typescript
import posthog from '$lib/analytics/posthog';

// Opt user out
posthog.opt_out_capturing();

// Opt user back in
posthog.opt_in_capturing();
```

### Data Deletion

To delete user data (on account deletion):

```typescript
import { analytics } from '$lib/analytics/posthog';

// Reset all user data
analytics.reset();
```

## Troubleshooting

### PostHog Not Loading
- ✅ Verify `PUBLIC_POSTHOG_KEY` is set correctly
- ✅ Check `PUBLIC_POSTHOG_HOST` matches your region
- ✅ Ensure environment variables have `PUBLIC_` prefix
- ✅ Restart dev server after adding env vars

### No Events in Dashboard
- ✅ Verify API key matches PostHog project
- ✅ Check browser console for errors
- ✅ Ensure user is logged in (only tracks identified users)
- ✅ Check ad blocker isn't blocking requests

### Feature Flags Not Working
- ✅ Wait a few minutes after creating flag
- ✅ Verify flag key matches code
- ✅ Check user is identified
- ✅ Ensure flag is enabled in PostHog

### Development vs Production
- **Development**: All events are tracked, console logging enabled
- **Production**: Production mode, no console logs
- **Testing**: Use a separate PostHog project for testing

## Advanced Configuration

### Custom Initialization

To customize PostHog initialization, edit `apps/web/src/lib/analytics/posthog.ts`:

```typescript
posthog.init(PUBLIC_POSTHOG_KEY, {
  api_host: PUBLIC_POSTHOG_HOST,

  // Capture settings
  capture_pageview: true,
  capture_pageleave: true,

  // Session settings
  session_recording: {
    recordCrossOriginIframes: false,
    maskAllInputs: true,
    maskTextSelector: '.sensitive'
  },

  // Privacy settings
  respect_dnt: true,
  opt_out_capturing_by_default: false,

  // Performance
  persistence: 'localStorage',
  autocapture: false,

  // Advanced features
  enable_recording_console_log: true,
  disable_compression: false
});
```

### Proxy Setup (Avoid Ad Blockers)

For production, proxy PostHog through your domain:

1. Set up a reverse proxy (e.g., Cloudflare Worker)
2. Update `PUBLIC_POSTHOG_HOST` to your proxy URL
3. Configure CORS headers

Example Cloudflare Worker:
```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  url.hostname = 'us.i.posthog.com'

  return fetch(url, {
    method: request.method,
    headers: request.headers,
    body: request.body
  })
}
```

## Resources

- [PostHog Documentation](https://posthog.com/docs)
- [PostHog JavaScript SDK](https://posthog.com/docs/libraries/js)
- [Feature Flags Guide](https://posthog.com/docs/feature-flags)
- [Session Recordings](https://posthog.com/docs/session-replay)
- [Privacy Controls](https://posthog.com/docs/privacy)

## Support

For issues specific to:
- **PostHog Platform**: [PostHog Support](https://posthog.com/support)
- **Integration Code**: Create an issue in this repository
- **Privacy/Compliance**: Consult with your legal team
