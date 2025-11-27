# System Characters

System characters are special read-only characters visible to all users in the Storyteller app. They provide a curated set of characters that users can use to create stories without needing to create their own characters first.

## Overview

System characters differ from regular user characters in several key ways:

- **Shared Visibility**: All users can see and use system characters
- **Read-Only**: Users cannot edit or delete system characters
- **No Sharing**: Share and edit buttons are hidden in the UI
- **Special User ID**: System characters belong to a special system user

## Technical Implementation

### System User ID

System characters use a special UUID to identify them:

```typescript
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';
```

This UUID is used consistently across:

- Database records (`user_id` field)
- Backend validation logic
- Frontend UI conditional rendering

### Database Structure

System characters are stored in the same `characters` table as user characters, with `user_id` set to the system UUID:

```sql
INSERT INTO public.characters (
  id,
  user_id,
  name,
  user_description,
  character_description,
  character_description_prompt,
  image_url,
  is_animal,
  animal_type,
  archived,
  created_at,
  updated_at,
  is_published,
  sharing_preference,
  images_data
) VALUES (
  '11111111-1111-1111-1111-111111111111',  -- Unique character ID
  '00000000-0000-0000-0000-000000000000',  -- System user ID
  'Finia',
  'Eine Mutter weibliche Füchsin...',
  'A wise mother fox with red-golden fur...',
  -- ... other fields
);
```

### Row Level Security (RLS)

The database uses RLS policies to allow all authenticated users to read system characters while protecting them from modification:

**Read Access Policy:**

```sql
CREATE POLICY "Users can view their own characters and system characters"
  ON public.characters
  FOR SELECT
  USING (
    user_id = current_setting('request.jwt.claims', true)::json->>'user_id'
    OR user_id = '00000000-0000-0000-0000-000000000000'
  );
```

**Write Protection:**
System characters are protected from updates and deletes by the existing ownership checks in the UPDATE and DELETE policies.

### Backend Validation

The backend validates access to characters in multiple places. Each validation point checks both ownership and system character status:

**Character Controller** (`backend/src/character/character.controller.ts`):

```typescript
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';
const isSystemCharacter = character.user_id === SYSTEM_USER_ID;
const isOwnCharacter = character.user_id === user.sub;

if (!isSystemCharacter && !isOwnCharacter) {
  return { error: 'Character not found or access denied' };
}
```

This pattern is applied in:

- `getCharacterById()` - GET /character/:id
- `updateCharacter()` - PUT /character/:id
- `deleteCharacter()` - DELETE /character/:id

**Story Creation Service** (`backend/src/story/services/story-creation.service.ts`):

```typescript
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';
const isSystemCharacter = character.user_id === SYSTEM_USER_ID;
const isOwnCharacter = character.user_id === userId;

if (!isSystemCharacter && !isOwnCharacter) {
  throw new Error('Character not found or does not belong to user');
}
```

### Frontend UI

The mobile app detects system characters and hides edit/share functionality:

**Character Detail Screen** (`mobile/app/character/[id].tsx`):

```typescript
// Check if this is a system character (read-only)
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';
const isSystemCharacter = character?.user_id === SYSTEM_USER_ID;

// Hide edit/share buttons for system characters
{!isEditing && !isSystemCharacter && (
  <ScrollView>
    <ShareCharacterButton character={character} />
    <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
      <AntDesign name="edit" />
      <Text>Bearbeiten</Text>
    </TouchableOpacity>
  </ScrollView>
)}
```

## Adding New System Characters

To add a new system character to the platform:

### 1. Prepare Character Assets

Upload the character image to Supabase Storage in the system user's folder:

```
bucket: user-uploads
path: 00000000-0000-0000-0000-000000000000/characters/[filename]
```

Example URL:

```
https://dyywxrmonxoiojsjmymc.supabase.co/storage/v1/object/public/user-uploads/00000000-0000-0000-0000-000000000000/characters/1762453771144-cmngxj-large.webp
```

### 2. Create Database Migration

Create a migration to insert the character record:

```sql
-- Add new system character
INSERT INTO public.characters (
  id,                                      -- Generate new UUID
  user_id,                                 -- Always '00000000-0000-0000-0000-000000000000'
  name,                                    -- Character name
  user_description,                        -- User-facing description (German)
  character_description,                   -- AI prompt description (English)
  character_description_prompt,            -- Enhanced prompt for consistency
  image_url,                               -- Supabase Storage URL
  is_animal,                              -- true/false
  animal_type,                            -- Animal type if applicable
  archived,                               -- false
  created_at,                             -- NOW()
  updated_at,                             -- NOW()
  is_published,                           -- true
  sharing_preference,                     -- 'public'
  images_data                             -- JSON array of image variations
) VALUES (
  gen_random_uuid(),                      -- Or specific UUID
  '00000000-0000-0000-0000-000000000000',
  'Character Name',
  'Deutsche Beschreibung...',
  'English AI description...',
  'Detailed prompt for image generation...',
  'https://...',
  true,
  'animal_type',
  false,
  NOW(),
  NOW(),
  true,
  'public',
  '[{"description": "...", "imageUrl": "..."}]'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  user_description = EXCLUDED.user_description,
  -- ... update other fields as needed
;
```

### 3. Apply Migration

Use Supabase MCP tools to apply the migration to both development and production databases:

```typescript
// Example using MCP tools
await mcp__supabase__apply_migration({
  project_id: 'your-project-id',
  name: 'add_[character_name]_system_character',
  query: 'INSERT INTO ...',
});
```

## Current System Characters

### Finia - The Wise Fox

- **ID**: `11111111-1111-1111-1111-111111111111`
- **Type**: Female Fox (Füchsin)
- **Description**: A wise mother fox with red-golden fur and a caring nature
- **Purpose**: Default character for first-time users to create stories immediately
- **Languages**: German (user_description) and English (character_description)

**Image Location**:

```
https://dyywxrmonxoiojsjmymc.supabase.co/storage/v1/object/public/user-uploads/00000000-0000-0000-0000-000000000000/characters/1762453771144-cmngxj-large.webp
```

## Best Practices

### Character Selection

- Choose characters with broad appeal for diverse story types
- Ensure high-quality, consistent character images
- Provide both German and English descriptions
- Make characters suitable for children's stories

### Naming Conventions

- Use descriptive, memorable names
- Consider cultural appropriateness
- Ensure uniqueness from user-created characters

### Image Requirements

- High resolution (recommended: 1024x1024 or higher)
- Consistent art style across system characters
- Child-appropriate content
- Clear, recognizable character features

### Database Management

- Always use migrations for changes
- Test in development before production
- Include rollback procedures in migrations
- Document character purposes and target audiences

## Troubleshooting

### Character Not Visible to Users

**Check RLS Policies:**

```sql
-- Verify the SELECT policy exists
SELECT * FROM pg_policies
WHERE tablename = 'characters'
  AND policyname LIKE '%system%';
```

**Verify User ID:**

```sql
-- Ensure character has correct system user_id
SELECT id, name, user_id
FROM characters
WHERE user_id = '00000000-0000-0000-0000-000000000000';
```

### Backend Rejecting System Characters

Ensure all character validation logic includes system character checks:

```typescript
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';
const isSystemCharacter = character.user_id === SYSTEM_USER_ID;
const isOwnCharacter = character.user_id === user.sub;

if (!isSystemCharacter && !isOwnCharacter) {
  // Reject access
}
```

Check these files:

- `backend/src/character/character.controller.ts` (GET, PUT, DELETE)
- `backend/src/story/services/story-creation.service.ts` (character validation)

### Edit/Share Buttons Still Showing

Verify frontend detection logic in `mobile/app/character/[id].tsx`:

```typescript
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';
const isSystemCharacter = character?.user_id === SYSTEM_USER_ID;
```

Ensure the character object includes the `user_id` field from the API response.

## Related Files

### Backend

- `backend/src/character/character.controller.ts` - Character CRUD endpoints
- `backend/src/story/services/story-creation.service.ts` - Story creation validation
- `backend/src/core/services/supabase-data.service.ts` - Database operations

### Frontend

- `mobile/app/character/[id].tsx` - Character detail screen
- `mobile/src/utils/dataService.ts` - Character data service (removed hardcoded logic)

### Database

- Migration: `add_finnia_system_character_fixed`
- Migration: `cleanup_conflicting_character_policies`

### Documentation

- `CLAUDE.md` - Main project documentation
- This file - System characters documentation
