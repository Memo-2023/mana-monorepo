# Umami Custom Events Documentation

## Overview

This document lists all custom events tracked in the application using Umami Analytics. Events are tracked client-side using the `window.umami.track()` function.

## Event Categories

### 🔗 Link Management Events

#### `link-created`

Fired when a user creates a new shortened link.

**Properties:**

- `short_code` - The generated or custom short code
- `has_password` - Whether the link is password protected (true/false)
- `has_expiry` - Whether the link has an expiration date (true/false)
- `has_click_limit` - Whether the link has a click limit (true/false)
- `is_custom_code` - Whether user provided a custom code (true/false)

**Location:** `/dashboard` - After successful link creation

---

#### `link-edited`

Fired when a user edits an existing link.

**Properties:**

- `short_code` - The link's short code
- `fields_changed` - Which fields were modified

**Location:** Link edit modal/form

---

#### `link-deleted`

Fired when a user deletes a link.

**Properties:**

- `short_code` - The deleted link's short code

**Location:** `/dashboard` - Delete confirmation

---

#### `link-clicked`

Fired when someone clicks on a shortened link from the dashboard.

**Properties:**

- `short_code` - The link's short code
- `username` - The username in the URL path or 'direct'
- `has_password` - Whether the link requires a password (true/false)
- `is_expiring` - Whether the link has an expiration date (true/false)

**Location:** `/dashboard` - Link click tracking

---

#### `link-copied`

Fired when a user copies a link to clipboard.

**Properties:**

- `short_code` - The copied link's short code

**Location:** `/dashboard` - Copy button clicks

---

#### `link-shared`

Fired when a user shares a link.

**Properties:**

- `short_code` - The shared link's short code
- `method` - How it was shared (email, social, etc.)

**Location:** Share buttons/modals

---

### 📊 QR Code Events

#### `link-qr-generated`

Fired when a user generates a QR code for a link.

**Properties:**

- `short_code` - The link's short code

**Location:** `/dashboard` - QR code button click

---

#### `link-qr-downloaded`

Fired when a user downloads a QR code.

**Properties:**

- `short_code` - The link's short code
- `format` - Download format (png, svg, jpeg, webp)
- `color` - QR code color

**Location:** `/dashboard` - QR code download

---

### 👤 User Authentication Events

#### `user-signup`

Fired when a new user successfully registers.

**Properties:**

- `method` - Registration method (email, oauth, etc.)

**Location:** `/register` - After successful registration

---

#### `user-login`

Fired when a user successfully logs in.

**Properties:**

- `method` - Login method (email, oauth, etc.)

**Location:** `/login` - After successful authentication

---

#### `user-logout`

Fired when a user logs out.

**Properties:** None

**Location:** Navigation component - Logout button

---

#### `user-profile-updated`

Fired when a user updates their profile.

**Properties:**

- `fields_updated` - Which profile fields were changed

**Location:** Profile/settings page

---

#### `user-password-reset`

Fired when a user resets their password.

**Properties:** None

**Location:** Password reset flow

---

### 📈 Analytics & Dashboard Events

#### `dashboard-viewed`

Fired when a user views their main dashboard.

**Properties:**

- `total_links` - Number of links the user has
- `total_clicks` - Total clicks across all links

**Location:** `/dashboard` - Page load

---

#### `analytics-viewed`

Fired when a user views analytics for a specific link.

**Properties:**

- `short_code` - The link's short code
- `total_clicks` - Total number of clicks

**Location:** `/dashboard/analytics/[id]` - Page load

---

#### `profile-viewed`

Fired when a user views their profile page.

**Properties:** None

**Location:** `/profile` - Page load

---

### 🔍 Search & Filter Events

#### `search-performed`

Fired when a user searches for links.

**Properties:**

- `query` - Search query
- `results_count` - Number of results

**Location:** Dashboard search bar

---

#### `filter-applied`

Fired when a user applies filters.

**Properties:**

- `filter_type` - Type of filter applied
- `filter_value` - Filter value

**Location:** Dashboard filter controls

---

#### `sort-changed`

Fired when a user changes sort order.

**Properties:**

- `sort_by` - Sort field
- `sort_order` - asc or desc

**Location:** Dashboard sort controls

---

### ⚠️ Error Events

#### `error-occurred`

Fired when an error occurs.

**Properties:**

- `error_type` - Type of error
- `error_message` - Error message
- `error_code` - Error code

**Location:** Throughout the application

---

#### `rate-limited`

Fired when a user hits a rate limit.

**Properties:**

- `action` - What action was rate limited
- `limit` - The limit that was hit

**Location:** API responses

---

## Implementation Details

### Utility Functions

The application provides several helper functions for common tracking scenarios:

```typescript
// Track a link click
trackLinkClick({
	shortCode: 'abc123',
	username: 'john',
	hasPassword: false,
	isExpiring: true
});

// Track link creation
trackLinkCreated({
	shortCode: 'xyz789',
	hasPassword: true,
	hasExpiry: false,
	hasClickLimit: true,
	isCustomCode: false
});

// Track authentication
trackAuth('login', 'email');
trackAuth('signup', 'google');
trackAuth('logout');

// Track errors
trackError({
	type: 'validation',
	message: 'Invalid URL format',
	code: 'INVALID_URL'
});
```

### Best Practices

1. **Consistent Naming**: All event names use lowercase with hyphens
2. **String Values**: All property values are converted to strings (Umami requirement)
3. **Minimal Data**: Only track essential data, avoid PII
4. **Error Handling**: Events fail silently if Umami is not available
5. **Debug Mode**: Events are logged to console in development

## Viewing Events in Umami

1. Log into your Umami dashboard
2. Select your website
3. Navigate to the "Events" tab
4. Click on any event name to see its properties
5. Use date ranges to filter event data

## Adding New Events

To add a new custom event:

1. Add the event name to `EVENTS` constant in `/src/lib/analytics.ts`
2. Use `trackEvent()` function where the event occurs
3. Document the event in this file
4. Test in development with console logging

Example:

```typescript
// In analytics.ts
export const EVENTS = {
	// ... existing events
	NEW_EVENT_NAME: 'new-event-name'
};

// In your component
import { trackEvent, EVENTS } from '$lib/analytics';

trackEvent(EVENTS.NEW_EVENT_NAME, {
	property1: 'value1',
	property2: 'value2'
});
```
