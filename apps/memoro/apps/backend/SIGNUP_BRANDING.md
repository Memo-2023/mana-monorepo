# Memoro Service - Signup Branding Support

**Updated**: 2025-11-05

---

## Overview

The signup endpoint automatically applies **Memoro branding** to all confirmation emails. The branding is hardcoded in the service and includes:

- **App Name**: Memoro
- **Logo**: memoro-logo.png
- **Primary Color**: #F8D62B (Yellow)
- **Secondary Color**: #f5c500 (Golden Yellow)
- **Tagline DE**: "Sprechen statt Tippen"
- **Tagline EN**: "Speak Instead of Type"
- **Website**: https://memoro.ai
- **Redirect URL**: https://app.manacore.ai/welcome?appName=memoro
- **Copyright**: "© 2025 Memoro · Made with 💛 in Germany"

You can optionally override specific branding fields per signup if needed.

## Simple Usage

### Standard Signup (Automatic Memoro Branding)

```bash
POST /auth/signup
{
  "email": "user@memoro.ai",
  "password": "SecurePass123!",
  "deviceInfo": {
    "deviceId": "web-123",
    "deviceName": "Chrome",
    "deviceType": "web"
  }
}
```

**Result**: Email automatically uses Memoro branding (yellow colors, Memoro logo, German/English taglines).

---

### Custom Branding (Optional)

```bash
POST /auth/signup
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "deviceInfo": {
    "deviceId": "web-123",
    "deviceName": "Chrome",
    "deviceType": "web"
  },
  "metadata": {
    "branding": {
      "logoUrl": "custom-logo.svg",
      "primaryColor": "#FF5733"
    }
  }
}
```

**Result**: Email uses custom logo and color, other fields use Memoro defaults.

---

### Full Custom Branding

```bash
POST /auth/signup
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "deviceInfo": {...},
  "metadata": {
    "branding": {
      "appName": "Custom App",
      "logoUrl": "custom-logo.svg",
      "primaryColor": "#2C3E50",
      "secondaryColor": "#34495E",
      "websiteUrl": "https://custom-app.com",
      "taglineDe": "Ihre Lösung",
      "taglineEn": "Your Solution",
      "copyright": "© 2025 Custom App"
    }
  }
}
```

---

## Branding Fields

All fields are **optional**:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `appName` | string | App display name | `"My App"` |
| `logoUrl` | string | Logo filename (from Supabase Storage) | `"app-logo.png"` |
| `primaryColor` | string | Primary color (hex) | `"#F8D62B"` |
| `secondaryColor` | string | Secondary color (hex) | `"#f5c500"` |
| `websiteUrl` | string | Website URL | `"https://app.com"` |
| `taglineDe` | string | German tagline | `"Sprechen statt Tippen"` |
| `taglineEn` | string | English tagline | `"Speak Instead of Type"` |
| `copyright` | string | Footer text | `"© 2025 My App"` |

---

## TypeScript Types

```typescript
import { BrandingConfig } from './auth-proxy/interfaces/branding.interface';

// Example
const branding: BrandingConfig = {
  logoUrl: 'custom-logo.svg',
  primaryColor: '#FF5733'
};

await authProxy.signup({
  email: 'user@example.com',
  password: 'pass123',
  deviceInfo: {...},
  metadata: { branding }
});
```

---

## How It Works

1. **No metadata** → Mana Core uses default branding for your app
2. **With metadata.branding** → Mana Core merges your branding with defaults
3. **Any missing fields** → Filled in by Mana Core defaults

---

## That's It!

- ✅ Backward compatible - existing signups work unchanged
- ✅ Simple - just add `metadata.branding` when you want custom branding
- ✅ Flexible - override any or all branding fields
- ✅ No new endpoints - just use `POST /auth/signup`
