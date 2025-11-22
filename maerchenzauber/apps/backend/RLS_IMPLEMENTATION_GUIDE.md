# RLS Implementation Guide for Maerchenzauber Storyteller

## Overview

This document describes the Row Level Security (RLS) implementation for the Maerchenzauber Storyteller project, based on proven patterns from the Memoro project. The implementation provides secure, user-based access control for both database tables and storage buckets.

## Implemented Changes

### 1. Core Authentication Functions

We've created four essential authentication helper functions:

#### `current_user_id()`
- **Purpose**: Extracts user identity from JWT claims
- **Returns**: User ID as text
- **Usage**: Primary function for identifying the current user in RLS policies

#### `auth_is_admin()`
- **Purpose**: Checks if the current user has admin privileges
- **Returns**: Boolean (true if admin, false otherwise)
- **Usage**: Used in policies that require admin access (creators, errors tables)

#### `current_user_uuid()`
- **Purpose**: Returns the current user's ID as UUID
- **Returns**: UUID
- **Usage**: Compatibility function when UUID type is needed

#### `user_owns_resource(resource_user_id text)`
- **Purpose**: Helper function to check resource ownership
- **Returns**: Boolean
- **Usage**: Simplifies ownership checks in policies

### 2. Table RLS Policies

#### Characters Table
- **View**: Users can only see their own characters
- **Insert**: Users can only create characters with their user_id
- **Update**: Users can only update their own characters
- **Delete**: Users can only delete their own characters
- **Service Role**: Full access for backend operations

#### Stories Table
- **View**: Users can only see their own stories
- **Insert**: Users can only create stories with their user_id
- **Update**: Users can only update their own stories
- **Delete**: Users can only delete their own stories
- **Service Role**: Full access for backend operations

#### Creators Table
- **View**: All authenticated users can view creators
- **Insert/Update/Delete**: Only admins can modify creators
- **Service Role**: Full access for backend operations

#### Errors Table
- **View**: Only admins can view errors
- **Insert**: Authenticated users can insert their own errors (for logging)
- **Update/Delete**: Only admins can modify errors
- **Service Role**: Full access for backend operations

### 3. Storage RLS Policies

#### storyteller-images bucket (public)
- **Structure**: `{user_id}/stories/{story_id}/` or `{user_id}/characters/{character_id}/`
- **View**: Anyone can view images (public bucket)
- **Upload/Update/Delete**: Users can only manage files in their own folder (first folder must match their user_id)
- **Admin Access**: Admins can view and delete any file

#### user-uploads bucket (private)
- **Structure**: `{user_id}/{filename}`
- **View/Upload/Update/Delete**: Users can only access their own folder
- **Admin Access**: Admins can view and delete any file

### 4. Migration Files Created

1. **auth-functions.sql**: Core authentication functions
2. **update-rls-policies.sql**: Updated RLS policies using new functions
3. **storage-rls-policies.sql**: Storage bucket policies
4. **cleanup-duplicate-policies.sql**: Removed duplicate policies
5. **test-rls-policies.sql**: Comprehensive test queries

## Usage in Application Code

### TypeScript/JavaScript Example

```typescript
// File upload with proper path structure
const uploadFile = async (file: File, userId: string, storyId: string) => {
  const filePath = `${userId}/stories/${storyId}/${Date.now()}_${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('storyteller-images')
    .upload(filePath, file);
    
  if (error) throw error;
  return data;
};

// Fetching user's own data (RLS automatically filters)
const getUserCharacters = async () => {
  const { data, error } = await supabase
    .from('characters')
    .select('*');
    
  // Only returns characters where user_id matches current user
  return data;
};
```

### Admin Operations

```typescript
// Check if user is admin
const checkAdminStatus = async () => {
  const { data, error } = await supabase
    .rpc('auth_is_admin');
    
  return data; // true or false
};

// Admin creating a creator (requires admin role)
const createCreator = async (creatorData: CreatorInput) => {
  const { data, error } = await supabase
    .from('creators')
    .insert(creatorData);
    
  // Will fail if user is not admin
  return data;
};
```

## Security Best Practices

1. **Always use auth functions**: Use `current_user_id()` instead of direct JWT manipulation
2. **Test policies thoroughly**: Use the test-rls-policies.sql file to verify access
3. **Service role key protection**: Never expose service role key in client code
4. **Consistent user identification**: Always store user_id as text for compatibility
5. **Storage path structure**: Follow the defined folder structure for storage

## Troubleshooting

### Common Issues

1. **Access Denied Errors**
   - Verify user is authenticated
   - Check if user_id matches the resource owner
   - Ensure RLS is enabled on the table

2. **Admin Functions Not Working**
   - Verify user has admin flag in users table
   - Check JWT claims include proper app_access data
   - Ensure auth_is_admin() function is working correctly

3. **Storage Upload Failures**
   - Verify file path follows the required structure
   - Check bucket exists and RLS is enabled
   - Ensure user is authenticated

### Debug Queries

```sql
-- Check current user
SELECT current_user_id(), auth_is_admin();

-- View active policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Test specific access
SET request.jwt.claim.sub = 'test-user-id';
SELECT * FROM characters;
```

## Maintenance

### Adding New Tables

When adding new tables with RLS:

1. Enable RLS: `ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;`
2. Create policies using auth functions
3. Add service role policy
4. Test all CRUD operations
5. Document the policies

### Updating Policies

1. Always drop old policy before creating new one
2. Use migrations for version control
3. Test changes thoroughly
4. Update documentation

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Guide](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- Original Memoro RLS Implementation Guide