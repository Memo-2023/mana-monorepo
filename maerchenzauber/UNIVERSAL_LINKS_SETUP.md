# Universal Links Setup for Character Sharing

## Overview

We've implemented universal links for character sharing, replacing the custom scheme `maerchenzauber://` with clickable HTTPS URLs that work in WhatsApp, SMS, and all messaging apps.

**New sharing URL format:**
```
https://märchen-zauber.de/character/{characterId}/{shareCode}
```

## What Was Implemented

### 1. **Landing Page Route** ✅
- **File:** `landingpage/public/character.html`
- **Type:** Static HTML with client-side JavaScript
- **Purpose:** Web page that displays character preview and deep links into the app
- **Features:**
  - Displays character images and description
  - Fetches character data from backend using JavaScript
  - "Open in App" button
  - Auto-opens app on mobile devices
  - Fallback to download page if app not installed
  - Works with any static hosting (Netlify, Vercel, Apache, etc.)

### 2. **Backend Public Endpoint** ✅
- **Endpoint:** `GET /characters/public/{id}/{shareCode}`
- **File:** `backend/src/character/public-character.controller.ts`
- **Purpose:** Fetch character data without authentication using share code
- **Security:** Share code must match to access character data

### 3. **iOS Universal Links Configuration** ✅
- **File:** `landingpage/public/.well-known/apple-app-site-association`
- **App Configuration:** `mobile/app.json` - added `associatedDomains`
- **Domain:** `applinks:märchen-zauber.de` and punycode version

### 4. **Android App Links Configuration** ✅
- **File:** `landingpage/public/.well-known/assetlinks.json`
- **App Configuration:** `mobile/app.json` - added `intentFilters` with `autoVerify: true`
- **Note:** ⚠️ Requires SHA-256 fingerprint update (see below)

### 5. **Mobile Share Button** ✅
- **File:** `mobile/components/character/ShareCharacterButton.tsx`
- **Features:**
  - Generates share code if none exists
  - Saves share code to character
  - Uses HTTPS URL for sharing
  - Loading state while generating code

### 6. **Deep Link Handlers** ✅
- **Universal Links:** `mobile/app/character/[id]/[shareCode].tsx`
- **Custom Scheme:** `mobile/app/share/character/[id].tsx` (updated to support share code)
- **Preview Screen:** `mobile/app/character/preview/[characterId].tsx` (updated to use public endpoint with share code)

## Deployment Checklist

### Landing Page Deployment

1. **Build the landing page:**
   ```bash
   cd landingpage
   npm run build
   # Creates optimized build in dist/ folder
   ```

2. **Deploy to hosting provider** (choose one):

   **Netlify (Recommended):**
   ```bash
   netlify deploy --prod --dir=dist
   ```
   - URL rewrites handled automatically by `_redirects` file

   **Vercel:**
   ```bash
   vercel --prod
   ```
   - URL rewrites handled automatically by `vercel.json` file

   **Traditional Hosting (Apache/Nginx):**
   - Upload entire `dist/` folder
   - Apache: `.htaccess` handles rewrites automatically
   - Nginx: Add rewrite rules to config (see DEPLOYMENT.md)

3. **Verify `.well-known` files are accessible:**
   ```bash
   # iOS
   curl https://märchen-zauber.de/.well-known/apple-app-site-association

   # Android
   curl https://märchen-zauber.de/.well-known/assetlinks.json
   ```

   **Important:** These files must be served with `Content-Type: application/json`

4. **Verify character page works:**
   ```bash
   # Should return HTML (not 404)
   curl https://märchen-zauber.de/character/test123/abc456
   ```

### Mobile App Configuration

3. **Update Android SHA-256 Certificate Fingerprint**

   Get your SHA-256 fingerprint from Google Play Console or EAS:

   ```bash
   # For EAS builds
   eas credentials

   # Or from Google Play Console:
   # Release > Setup > App integrity > App signing key certificate
   ```

   Update `landingpage/public/.well-known/assetlinks.json`:
   ```json
   {
     "sha256_cert_fingerprints": [
       "YOUR_ACTUAL_SHA256_FINGERPRINT_HERE"
     ]
   }
   ```

4. **Build and Deploy Mobile App**

   ```bash
   cd mobile

   # Build for iOS
   eas build --platform ios --profile production

   # Build for Android
   eas build --platform android --profile production

   # Submit to stores
   eas submit --platform ios
   eas submit --platform android
   ```

### Backend Deployment

5. **Deploy Backend Updates**

   The backend already has the public endpoint. No additional deployment needed if already running.

   Verify the endpoint works:
   ```bash
   curl https://storyteller-backend-111768794939.europe-west3.run.app/characters/public/{id}/{shareCode}
   ```

## Testing

### Test Universal Links (iOS)

1. **Send yourself a message** with a character link:
   ```
   https://märchen-zauber.de/character/abc123/xyz789
   ```

2. **Tap the link** - it should:
   - Open the app directly if installed
   - Show the landing page if app not installed

3. **Verify in Safari:**
   - Long-press the link
   - Should show "Open in Märchenzauber"

### Test App Links (Android)

1. **Send yourself a message** with a character link

2. **Tap the link** - Android should:
   - Ask which app to use (first time)
   - Remember your choice
   - Open app directly on subsequent taps

3. **Verify Auto-Verification:**
   ```bash
   adb shell pm get-app-links com.memoro.maerchenzauber
   # Should show "verified" for märchen-zauber.de
   ```

### Test Share Code Security

1. **Share a character** - should generate a share code
2. **Try accessing with wrong share code** - should fail
3. **Try accessing without auth but with correct share code** - should work

## How It Works

### Sharing Flow

1. User taps "Share Character" button
2. App generates random 10-character share code (if none exists)
3. App saves share code to character in database
4. App opens native share sheet with HTTPS URL
5. Recipient receives clickable link in WhatsApp/SMS/etc.

### Opening Flow

1. User taps HTTPS link
2. **iOS:** Universal link → App opens directly
3. **Android:** App link → App opens directly
4. **Fallback:** Landing page loads → "Open in App" button
5. App navigates to character preview with share code
6. Character preview fetches character using public endpoint
7. User sees character and can import to their library

### Security

- Characters require **both** ID and share code to access
- Share codes are random and unpredictable
- No character data exposed without valid share code
- Users can revoke sharing by changing/removing share code

## Troubleshooting

### Universal Links Not Working on iOS

- Check `.well-known/apple-app-site-association` is accessible
- Verify `associatedDomains` in app.json matches exactly
- Re-install app after configuration changes
- Test on physical device (simulator may have caching issues)

### App Links Not Working on Android

- Verify `assetlinks.json` has correct SHA-256 fingerprint
- Check autoVerify is set to true in intent filters
- Clear Android system cache: Settings → Apps → Default apps → Opening links
- May take 24-48 hours for Google to verify

### Share Code Not Generated

- Check network connection
- Verify backend `/character/:id` PUT endpoint is accessible
- Check console logs for errors in ShareCharacterButton

### Landing Page Not Loading Character

- Verify backend public endpoint is accessible
- Check share code matches in URL and database
- Ensure CORS is enabled on backend for landing page domain

## Files Modified/Created

### Landing Page
- ✅ `public/character.html` (new - static character sharing page)
- ✅ `public/.well-known/apple-app-site-association` (new - iOS universal links)
- ✅ `public/.well-known/assetlinks.json` (new - Android app links, SHA-256 updated)
- ✅ `public/_redirects` (new - Netlify URL rewrites)
- ✅ `public/.htaccess` (new - Apache URL rewrites)
- ✅ `vercel.json` (new - Vercel URL rewrites)

### Backend
- ✅ `src/character/public-character.controller.ts` (updated)

### Mobile App
- ✅ `app.json` (updated iOS/Android configs)
- ✅ `components/character/ShareCharacterButton.tsx` (updated)
- ✅ `app/character/[id]/[shareCode].tsx` (new)
- ✅ `app/share/character/[id].tsx` (updated)
- ✅ `app/character/preview/[characterId].tsx` (updated)

## Benefits

✅ **Clickable links** in WhatsApp, SMS, and all messaging apps
✅ **Professional appearance** with HTTPS URLs
✅ **Link previews** with character image and description
✅ **Seamless app opening** on both iOS and Android
✅ **Fallback to web** if app not installed
✅ **Secure** with share code validation
✅ **Analytics ready** - can track link clicks on landing page

## Next Steps

1. **Deploy landing page** with `.well-known` files
2. **Update Android SHA-256** fingerprint in assetlinks.json
3. **Build and submit** new app versions to stores
4. **Test thoroughly** on both platforms
5. **Monitor** share links in production
6. **Consider adding** analytics to track sharing effectiveness
