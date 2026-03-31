# Memoro Service - Branding Configuration

**Updated**: 2025-11-05

---

## Hardcoded Memoro Branding

The Memoro service has **hardcoded branding** that is automatically applied to all signup confirmation emails. This ensures consistent branding across all Memoro signups without needing environment variables.

### Branding Details

**Location**: `src/auth-proxy/auth-proxy.service.ts:113-123`

```typescript
const memoroBranding: BrandingConfig = {
  appName: 'Memoro',
  logoUrl: 'memoro-logo.png',
  primaryColor: '#F8D62B',
  secondaryColor: '#f5c500',
  websiteUrl: 'https://memoro.ai',
  taglineDe: 'Sprechen statt Tippen',
  taglineEn: 'Speak Instead of Type',
  copyright: '© 2025 Memoro · Made with 💛 in Germany'
};
```

### Logo

**File**: `memoro-logo.png`
**Storage URL**: https://smenuelzskphnphaaetp.supabase.co/storage/v1/object/public/satellites-logos/memoro-logo.png

**Note**: PNG format is required for email compatibility. Gmail and most email clients block SVG images for security reasons.

The logo is stored in Supabase Storage and referenced by filename only. Mana Core automatically builds the full URL.

### Redirect URL

**URL**: https://app.manacore.ai/welcome?appName=memoro

After email confirmation, users are redirected to the centralized welcome page with Memoro-specific branding (blue theme, voice recording features).

---

## How It Works

1. **Every signup** automatically includes Memoro branding
2. **No configuration needed** - branding is built into the code
3. **Can be overridden** - If needed, pass `metadata.branding` in signup payload
4. **Merges with custom** - If partial branding provided, merges with defaults

### Merging Behavior

```typescript
// Standard signup - uses all Memoro defaults
POST /auth/signup
{ email, password, deviceInfo }
→ Email has full Memoro branding

// Partial override - merges with defaults
POST /auth/signup
{
  email, password, deviceInfo,
  metadata: { branding: { logoUrl: 'special-logo.svg' } }
}
→ Email has special logo, but keeps Memoro colors, taglines, etc.

// Full override - replaces all branding
POST /auth/signup
{
  email, password, deviceInfo,
  metadata: { branding: { /* complete custom branding */ } }
}
→ Email uses completely custom branding
```

---

## Why Hardcoded?

✅ **Consistency** - All Memoro signups look the same
✅ **Simplicity** - No environment variables to manage
✅ **Reliability** - Can't accidentally break branding with config errors
✅ **Version Control** - Branding changes are tracked in git

---

## To Change Branding

If you need to update Memoro branding:

1. **Edit the file**: `src/auth-proxy/auth-proxy.service.ts`
2. **Update the values**: Lines 113-123
3. **Rebuild and deploy**: `npm run build && deploy`

**Example**:
```typescript
// Update copyright year
copyright: '© 2026 Memoro · Made with 💛 in Germany'

// Update colors
primaryColor: '#FF5733',
secondaryColor: '#C70039',
```

---

## Testing

To test branding locally:

```bash
# Start services
cd mana-core-middleware && npm run start:dev  # Port 3003
cd memoro-service && npm run start:dev        # Port 3001

# Test signup
curl -X POST 'http://localhost:3001/auth/signup' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "deviceInfo": {
      "deviceId": "test-1",
      "deviceName": "Test",
      "deviceType": "web"
    }
  }'

# Check confirmation email for Memoro branding
```

See `LOCAL_SIGNUP_TEST_GUIDE.md` for detailed testing instructions.

---

## Related Files

- **Branding Interface**: `src/auth-proxy/interfaces/branding.interface.ts`
- **Auth Service**: `src/auth-proxy/auth-proxy.service.ts`
- **Auth Controller**: `src/auth-proxy/auth-proxy.controller.ts`
- **Documentation**: `SIGNUP_BRANDING.md`
- **Test Guide**: `../LOCAL_SIGNUP_TEST_GUIDE.md`
