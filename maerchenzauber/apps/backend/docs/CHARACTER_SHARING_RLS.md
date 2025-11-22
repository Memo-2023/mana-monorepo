# Character Sharing with Service Account

## Overview
Character sharing uses **authenticated requests** where users must be logged in, but the backend uses the **service account** (service role key) to bypass RLS when fetching shared characters.

## Architecture

**Security Model:**
- ✅ User must be authenticated to view shared characters
- ✅ Backend uses service account to bypass RLS
- ✅ No special RLS policies needed
- ✅ All character data remains protected by default RLS

**Benefits:**
- Know who is accessing shared characters (analytics, abuse prevention)
- No public endpoints exposing database directly
- Simpler RLS policy management
- Users must be logged in to import (already required for credits)

## Required RLS Policies

### User-Owned Characters Policy
Standard RLS policy - users can only read their own characters:

```sql
-- Policy name: "Users can read their own characters"
CREATE POLICY "users_read_own_characters"
ON characters
FOR SELECT
USING (auth.uid() = user_id);
```

**Note:** No additional policies needed! The backend service account bypasses RLS entirely.

## Testing

### Test 1: Verify Authenticated Access to Shared Character
```bash
# Test authenticated user accessing a shared character
curl -X GET "http://localhost:3002/character/shared/{characterId}" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"

# Expected: 200 OK with character data (any character ID)
```

### Test 2: Verify Unauthenticated Access is Blocked
```bash
# Test without auth token
curl -X GET "http://localhost:3002/character/shared/{characterId}" \
  -H "Content-Type: application/json"

# Expected: 401 Unauthorized
```

### Test 3: Verify User-Owned Characters Still Work
```bash
# Test authenticated user accessing their own characters
curl -X GET "http://localhost:3002/character" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"

# Expected: 200 OK with list of user's characters
```

## Backend Changes Made

### 1. Added Admin Client to SupabaseProvider
**File**: `backend/src/supabase/supabase.provider.ts`
- Added `getAdminClient()` method
- Uses `MAERCHENZAUBER_SUPABASE_SERVICE_ROLE_KEY`
- Bypasses all RLS policies

### 2. Updated getSharedCharacter
**File**: `backend/src/core/services/supabase-jsonb-auth.service.ts`
- Changed from `getClient()` to `getAdminClient()`
- Uses service account for database access
- User still must be authenticated to call endpoint

### 3. CharacterController
**File**: `backend/src/character/character.controller.ts`
- Kept `@UseGuards(AuthGuard)` - requires authentication
- Added `@CurrentUser()` to track who accesses shared characters

## Mobile App Changes

### 1. Created Deeplink Route
**File**: `mobile/app/share/character/[id].tsx`
- Handles `maerchenzauber://share/character/{id}` deeplinks
- Redirects to character preview page
- Added error handling to prevent crashes

### 2. Improved Error Handling
- Added try/catch blocks
- User-friendly error messages
- Graceful fallback to home screen on errors

## Deployment Steps

1. **Update Backend Code**
   ```bash
   cd backend
   npm run build
   npm run start:prod
   ```

2. **Update RLS Policies in Supabase Dashboard**
   - Go to Supabase Dashboard > Authentication > Policies
   - Add the "public_read_shared_characters" policy
   - Verify existing user policies remain active

3. **Deploy Backend to Cloud Run**
   ```bash
   cd backend
   gcloud builds submit --tag gcr.io/PROJECT_ID/storyteller-backend
   gcloud run deploy storyteller-backend --image gcr.io/PROJECT_ID/storyteller-backend
   ```

4. **Build and Deploy Mobile App**
   ```bash
   cd mobile
   eas build --platform ios --profile production
   eas submit --platform ios
   ```

## Verification Checklist

- [ ] Backend compiles without TypeScript errors
- [ ] Public endpoint is accessible without authentication
- [ ] Authenticated users can still access their own characters
- [ ] RLS policy allows reading shared characters
- [ ] RLS policy blocks reading private characters
- [ ] Deeplink opens app successfully
- [ ] Character preview loads without crashing
- [ ] Error handling works for invalid character IDs
- [ ] Import functionality still requires authentication (10 credits)

## Security Considerations

1. **Authentication Required**
   - User must be logged in to view shared characters
   - Prevents anonymous abuse
   - Tracks who accesses what (analytics)

2. **Service Account Usage**
   - Backend uses service role key to bypass RLS
   - Only exposed through authenticated endpoints
   - No direct database access from frontend

3. **Import Requirements**
   - Still requires authentication
   - Costs 10 credits per import
   - Prevents importing own characters
   - Checks for duplicate imports

4. **RLS Still Protects Data**
   - Users can only modify their own characters
   - Default RLS policies remain unchanged
   - Service account only used for read operations on shared endpoint

## Troubleshooting

### Issue: "Character not found or not available for sharing"
- **Cause**: RLS policy not configured correctly
- **Fix**: Add the `public_read_shared_characters` policy

### Issue: "401 Unauthorized" when accessing shared endpoint
- **Cause**: `@Public()` decorator not applied
- **Fix**: Verify `PublicAuthGuard` is being used and `@Public()` is on endpoint

### Issue: App crashes when opening deeplink
- **Cause**: Missing mobile route file
- **Fix**: Ensure `mobile/app/share/character/[id].tsx` exists

### Issue: "Unmatched Route" error
- **Cause**: Expo Router can't find the route
- **Fix**: Restart Expo dev server with `npx expo start -c`
