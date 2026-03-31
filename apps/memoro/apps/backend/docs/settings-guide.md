# Memoro Settings Management Guide

The Memoro service provides comprehensive user settings management through integration with the Mana Core Middleware. This allows users to manage both Memoro-specific settings and general profile information.

## Overview

The settings system provides:
- **Memoro-specific settings** (data usage acceptance, preferences)
- **General profile management** (name, avatar)
- **Centralized storage** via Mana Core's `app_settings` JSONB field
- **JWT-authenticated access** with user isolation

## Architecture

```
Frontend → Memoro Service → Mana Core Middleware → Supabase Database
```

1. **Frontend** calls Memoro service settings endpoints
2. **Memoro Service** forwards requests to Mana Core Middleware
3. **Mana Core** updates the `users.app_settings` JSONB field
4. **Response** flows back through the chain

## API Endpoints

All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

### 1. Get All User Settings

```http
GET /settings
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "settings": {
    "memoro": {
      "dataUsageAcceptance": true
    },
    "other_apps": {
      "theme": "dark"
    }
  }
}
```

### 2. Get Memoro-Specific Settings

```http
GET /settings/memoro
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "settings": {
    "dataUsageAcceptance": true,
    "emailNewsletterOptIn": false,
    "language": "en",
    "defaultSpaceId": "uuid-here"
  }
}
```

### 3. Update Memoro Settings

```http
PATCH /settings/memoro
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "dataUsageAcceptance": true,
  "language": "en",
  "customSetting": "value"
}
```

**Response:**
```json
{
  "success": true,
  "settings": {
    "memoro": {
      "dataUsageAcceptance": true,
      "language": "en",
      "customSetting": "value"
    }
  },
  "message": "Memoro settings updated successfully"
}
```

### 4. Update Data Usage Acceptance (Convenience Endpoint)

```http
PATCH /settings/memoro/data-usage
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "accepted": true
}
```

**Response:**
```json
{
  "success": true,
  "settings": {
    "memoro": {
      "dataUsageAcceptance": true
    }
  },
  "message": "Data usage accepted successfully"
}
```

### 5. Update Email Newsletter Opt-In (Convenience Endpoint)

```http
PATCH /settings/memoro/email-newsletter
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "optIn": true
}
```

**Response:**
```json
{
  "success": true,
  "settings": {
    "memoro": {
      "emailNewsletterOptIn": true
    }
  },
  "message": "Email newsletter opted in successfully"
}
```

### 6. Update User Profile

```http
PATCH /settings/profile
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "avatar_url": "https://example.com/avatar.jpg",
    "app_settings": {
      "memoro": {
        "dataUsageAcceptance": true
      }
    }
  },
  "message": "Profile updated successfully"
}
```

## Testing Guide

### Local Development Setup

1. **Start Services:**
```bash
# Terminal 1 - Mana Core Middleware
cd mana-core-middleware
npm run start:dev  # Port 3000

# Terminal 2 - Memoro Service  
cd memoro-service
npm run start:dev  # Port 3001
```

2. **Get JWT Token:**
```bash
export TOKEN=$(curl -s -X POST "http://localhost:3000/auth/signin?appId=973da0c1-b479-4dac-a1b0-ed09c72caca8" \
  -H "Content-Type: application/json" \
  -d '{"email": "nils.weiser@memoro.ai", "password": "Test123!"}' | jq -r '.accessToken')

echo "Token: $TOKEN"
```

### Test Commands

```bash
# Get all settings
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/settings"

# Get Memoro settings only
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/settings/memoro"

# Accept data usage
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"accepted": true}' \
  "http://localhost:3001/settings/memoro/data-usage"

# Opt into email newsletter
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"optIn": true}' \
  "http://localhost:3001/settings/memoro/email-newsletter"

# Update multiple Memoro settings
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dataUsageAcceptance": false, "emailNewsletterOptIn": true, "language": "de"}' \
  "http://localhost:3001/settings/memoro"

# Update profile
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"firstName": "Nils", "lastName": "Weiser"}' \
  "http://localhost:3001/settings/profile"
```

### Expected Results

**Empty settings (first time):**
```json
{
  "settings": {}
}
```

**After data usage acceptance:**
```json
{
  "settings": {
    "memoro": {
      "dataUsageAcceptance": true
    }
  }
}
```

**After multiple updates:**
```json
{
  "settings": {
    "memoro": {
      "dataUsageAcceptance": false,
      "emailNewsletterOptIn": true,
      "language": "de"
    }
  }
}
```

## Memoro Settings Schema

### Core Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `dataUsageAcceptance` | boolean | `false` | Whether user accepts data usage for AI processing |
| `emailNewsletterOptIn` | boolean | `false` | Whether user opts into email newsletter |
| `language` | string | `"en"` | User's preferred language |
| `defaultSpaceId` | string | `null` | Default space for new recordings |

### Future Settings (Examples)

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `autoTranscribe` | boolean | `true` | Auto-start transcription on upload |
| `notificationPreferences` | object | `{}` | Email/push notification settings |
| `transcriptionSettings` | object | `{}` | Transcription quality, language detection |
| `uiPreferences` | object | `{}` | Theme, layout preferences |

## Error Handling

### Common Errors

**400 Bad Request - Missing fields:**
```json
{
  "message": "At least one setting field is required",
  "error": "Bad Request", 
  "statusCode": 400
}
```

**400 Bad Request - Invalid data type:**
```json
{
  "message": "accepted field must be a boolean",
  "error": "Bad Request",
  "statusCode": 400
}
```

**401 Unauthorized:**
```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

### Service Communication Errors

If Mana Core Middleware is down:
```json
{
  "message": "Failed to update Memoro settings: Failed to connect to Mana Core",
  "error": "Bad Request",
  "statusCode": 400
}
```

## Frontend Integration Examples

### React Hook Example

```typescript
// useSettings.ts
import { useState, useEffect } from 'react';

interface MemoroSettings {
  dataUsageAcceptance?: boolean;
  emailNewsletterOptIn?: boolean;
  language?: string;
  defaultSpaceId?: string;
}

export function useSettings() {
  const [settings, setSettings] = useState<MemoroSettings>({});
  const [loading, setLoading] = useState(false);

  const getSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/settings/memoro', {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await response.json();
      setSettings(data.settings);
    } catch (error) {
      console.error('Failed to get settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDataUsage = async (accepted: boolean) => {
    try {
      const response = await fetch('/settings/memoro/data-usage', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ accepted })
      });
      
      if (response.ok) {
        await getSettings(); // Refresh settings
      }
    } catch (error) {
      console.error('Failed to update data usage:', error);
    }
  };

  const updateEmailNewsletter = async (optIn: boolean) => {
    try {
      const response = await fetch('/settings/memoro/email-newsletter', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ optIn })
      });
      
      if (response.ok) {
        await getSettings(); // Refresh settings
      }
    } catch (error) {
      console.error('Failed to update email newsletter:', error);
    }
  };

  return {
    settings,
    loading,
    getSettings,
    updateDataUsage,
    updateEmailNewsletter
  };
}
```

### Data Usage Consent Component

```typescript
// DataUsageConsent.tsx
import React from 'react';
import { useSettings } from './useSettings';

export function DataUsageConsent() {
  const { settings, updateDataUsage, loading } = useSettings();

  const handleAccept = () => updateDataUsage(true);
  const handleDecline = () => updateDataUsage(false);

  if (settings.dataUsageAcceptance === true) {
    return <div>✅ Data usage accepted</div>;
  }

  return (
    <div className="consent-modal">
      <h2>Data Usage Consent</h2>
      <p>Do you consent to AI processing of your audio data?</p>
      
      <div className="buttons">
        <button 
          onClick={handleAccept}
          disabled={loading}
        >
          Accept
        </button>
        <button 
          onClick={handleDecline}
          disabled={loading}
        >
          Decline
        </button>
      </div>
    </div>
  );
}
```

### Email Newsletter Subscription Component

```typescript
// EmailNewsletterSubscription.tsx
import React from 'react';
import { useSettings } from './useSettings';

export function EmailNewsletterSubscription() {
  const { settings, updateEmailNewsletter, loading } = useSettings();

  const handleOptIn = () => updateEmailNewsletter(true);
  const handleOptOut = () => updateEmailNewsletter(false);

  return (
    <div className="newsletter-subscription">
      <h3>Email Newsletter</h3>
      <p>Stay updated with Memoro features and news</p>
      
      <div className="newsletter-status">
        {settings.emailNewsletterOptIn ? (
          <div>
            <span>✅ Subscribed to newsletter</span>
            <button 
              onClick={handleOptOut}
              disabled={loading}
              className="opt-out-btn"
            >
              Unsubscribe
            </button>
          </div>
        ) : (
          <div>
            <span>📧 Not subscribed</span>
            <button 
              onClick={handleOptIn}
              disabled={loading}
              className="opt-in-btn"
            >
              Subscribe
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

### Combined Settings Component

```typescript
// SettingsPage.tsx
import React from 'react';
import { DataUsageConsent } from './DataUsageConsent';
import { EmailNewsletterSubscription } from './EmailNewsletterSubscription';

export function SettingsPage() {
  return (
    <div className="settings-page">
      <h1>Memoro Settings</h1>
      
      <section className="privacy-settings">
        <h2>Privacy & Data</h2>
        <DataUsageConsent />
      </section>
      
      <section className="communication-settings">
        <h2>Communication</h2>
        <EmailNewsletterSubscription />
      </section>
    </div>
  );
}
```

## Configuration

### Environment Variables

Ensure `MANA_SERVICE_URL` is properly configured:

```env
# memoro-service/.env
MANA_SERVICE_URL=http://localhost:3000  # Local development
# or
MANA_SERVICE_URL=https://mana-core-middleware.run.app  # Production
```

### Service Dependencies

The settings endpoints depend on:
1. **Mana Core Middleware** being accessible
2. **Supabase database** connection
3. **JWT authentication** working properly

## Monitoring

### Health Checks

Monitor settings service health:
```bash
# Check if Memoro service can reach Mana Core
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/settings/memoro"
```

### Logging

Look for these log patterns:
```
[SettingsClientService] Error getting user settings: Failed to connect
[SettingsController] Failed to update Memoro settings: User not found
```

## Future Enhancements

1. **Settings Validation**: JSON schema validation for settings
2. **Settings Migration**: Automatic migration for schema changes  
3. **Settings Sync**: Real-time sync across devices
4. **Settings Backup**: Export/import functionality
5. **Settings Analytics**: Track which settings are most used