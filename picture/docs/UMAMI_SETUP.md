# Umami Analytics Setup

This document describes how to set up Umami Analytics for the Picture platform.

## Overview

Umami Analytics has been integrated into both the landing page and web app to provide privacy-friendly analytics tracking.

## Architecture

### Landing Page (Astro)
- **Location**: `apps/landing/src/layouts/Layout.astro`
- **Framework**: Astro
- **Integration**: Script tag in `<head>` section

### Web App (SvelteKit)
- **Location**: `apps/web/src/routes/+layout.svelte`
- **Framework**: SvelteKit
- **Integration**: Script tag in `<svelte:head>` section

## Configuration

Both apps use environment variables for Umami configuration:

```bash
PUBLIC_UMAMI_URL=https://your-umami-instance.com
PUBLIC_UMAMI_WEBSITE_ID=your-website-id
```

### Setting up Environment Variables

#### For Landing Page
Create or update `apps/landing/.env`:

```bash
PUBLIC_UMAMI_URL=https://analytics.yourdomain.com
PUBLIC_UMAMI_WEBSITE_ID=your-landing-website-id
```

#### For Web App
Create or update `apps/web/.env`:

```bash
PUBLIC_UMAMI_URL=https://analytics.yourdomain.com
PUBLIC_UMAMI_WEBSITE_ID=your-webapp-website-id
```

> **Note**: You can use the same Umami instance for both apps, but you should create separate website IDs in Umami to track them independently.

## Features

### Privacy-First Tracking
- ✅ **Do Not Track**: Respects browser DNT settings via `data-do-not-track="true"`
- ✅ **No Cookies**: Umami doesn't use cookies by default
- ✅ **GDPR Compliant**: No personal data collection
- ✅ **Conditional Loading**: Only loads when environment variables are set

### Automatic Tracking
The integration automatically tracks:
- Page views
- Referrers
- Browser/device information (anonymized)
- Geographic location (country level only)

## Setup Steps

### 1. Set Up Umami Instance

You have two options:

#### Option A: Use Umami Cloud
1. Sign up at [umami.is](https://umami.is)
2. Create a new website for your landing page
3. Create another website for your web app
4. Copy the website IDs

#### Option B: Self-Host Umami
1. Follow the [Umami self-hosting guide](https://umami.is/docs/install)
2. Deploy Umami to your preferred platform
3. Create websites for both apps
4. Note your instance URL

### 2. Configure Environment Variables

#### Development
1. Copy `.env.example` to `.env` in both `apps/landing` and `apps/web`
2. Add your Umami credentials:
   ```bash
   PUBLIC_UMAMI_URL=https://your-umami-instance.com
   PUBLIC_UMAMI_WEBSITE_ID=your-website-id
   ```

#### Production
Add the environment variables to your deployment platform:

**Vercel/Netlify:**
- Go to Project Settings → Environment Variables
- Add `PUBLIC_UMAMI_URL` and `PUBLIC_UMAMI_WEBSITE_ID`

**Other platforms:**
- Follow your platform's documentation for setting environment variables
- Ensure variables are prefixed with `PUBLIC_` to be exposed to the client

### 3. Verify Integration

1. Start your development servers:
   ```bash
   # Landing page
   cd apps/landing
   pnpm dev

   # Web app
   cd apps/web
   pnpm dev
   ```

2. Open browser DevTools → Network tab
3. Look for requests to your Umami instance
4. Check your Umami dashboard for live visitors

## Testing

To verify Umami is working:

1. **Check Script Loading**:
   - Open DevTools → Network
   - Filter by "script.js"
   - Verify the Umami script loads successfully

2. **Check Tracking**:
   - Navigate to different pages
   - Open DevTools → Network
   - Look for POST requests to `/api/send`

3. **Check Dashboard**:
   - Log in to your Umami instance
   - Navigate to Realtime → Current visitors
   - Verify your session appears

## Troubleshooting

### Script Not Loading
- ✅ Verify environment variables are set correctly
- ✅ Ensure `PUBLIC_` prefix is used
- ✅ Check that Umami instance is accessible
- ✅ Restart dev server after adding env vars

### No Data in Dashboard
- ✅ Verify website ID matches the one in Umami
- ✅ Check browser console for errors
- ✅ Ensure ad blocker is disabled
- ✅ Verify network requests are successful

### Development vs Production
- In development: Tracking works but may be blocked by ad blockers
- In production: Use a custom domain for Umami to avoid ad blockers (e.g., `analytics.yourdomain.com`)

## Advanced Configuration

### Custom Events
To track custom events, use the Umami JavaScript API:

```typescript
// Track a custom event
if (window.umami) {
  window.umami.track('button_click', {
    button_name: 'sign_up'
  });
}
```

### Domain Filtering
To only track specific domains, add `data-domains` attribute:

```html
<script
  defer
  src="..."
  data-website-id="..."
  data-domains="yourdomain.com,www.yourdomain.com"
></script>
```

### Disable Automatic Tracking
To disable automatic page view tracking:

```html
<script
  defer
  src="..."
  data-website-id="..."
  data-auto-track="false"
></script>
```

Then manually track page views:

```typescript
if (window.umami) {
  window.umami.track(props => ({
    ...props,
    url: '/custom-page'
  }));
}
```

## Security Considerations

- ✅ All tracking is done client-side
- ✅ No sensitive data is collected
- ✅ Website ID is public (not a security concern)
- ✅ Only analytics data is sent to Umami instance
- ✅ No third-party cookies or trackers

## Resources

- [Umami Documentation](https://umami.is/docs)
- [Umami Cloud](https://cloud.umami.is)
- [Umami GitHub](https://github.com/umami-software/umami)
- [Privacy Policy Template](https://umami.is/docs/privacy)

## Support

For issues specific to:
- **Umami**: [Umami Discord](https://discord.gg/4dz4zcXYrQ)
- **Integration**: Create an issue in this repository
