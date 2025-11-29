# Supabase Authentication Integration

This document explains how to properly integrate with Supabase authentication in the Märchenzauber backend.

## Overview

The implementation uses JWT tokens that are compatible with Supabase's authentication system. This allows:

1. Direct access to Supabase data using Row Level Security (RLS) policies
2. Authentication flow that works with Supabase's built-in mechanisms
3. Proper handling of user context in database operations

## Implementation Components

### 1. AuthService (`src/core/services/auth.service.ts`)

The `AuthService` provides methods to:

- Generate Supabase-compatible JWT tokens
- Create authenticated Supabase clients

```typescript
// Example usage
const authService = new AuthService(configService);

// Generate a token compatible with Supabase
const token = await authService.generateSupabaseCompatibleToken(userId, email);

// Get a client that can be used to make authenticated requests
const supabaseClient = authService.getAuthenticatedClient(token);

// Use the client to make requests
const { data, error } = await supabaseClient.from('your_table').select('*');
```

### 2. JWT Token Format

Supabase JWT tokens must include specific claims:

- `sub` - The user ID
- `email` - The user's email (if available)
- `role` - The user role (usually 'authenticated')
- `app_metadata` - Application metadata
- `iat` - Issued at timestamp
- `exp` - Expiration timestamp

The token must be signed with the same JWT secret as configured in your Supabase project.

## Key Requirements

1. **JWT Secret**: The same secret must be used in Supabase and NestJS
2. **Service Role Key**: For admin operations, use the service role key
3. **Anonymous Key**: For user operations, use the anon key

## Configuration

Ensure the following environment variables are set:

```
MAERCHENZAUBER_SUPABASE_URL=https://your-supabase-project.supabase.co
MAERCHENZAUBER_SUPABASE_ANON_KEY=your-supabase-anon-key
MAERCHENZAUBER_SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
MAERCHENZAUBER_JWT_SECRET=your-supabase-jwt-secret
```

## Testing

A test script is provided at `test/supabase-auth-integration-test.ts` to verify the authentication flow.

Run it with:

```bash
ts-node test/supabase-auth-integration-test.ts
```

## Security Considerations

1. Keep your JWT secret and service role key secure
2. Use short expiration times for tokens
3. Implement proper error handling for authentication failures
4. Always use HTTPS for API communication
5. Implement Row Level Security (RLS) policies in Supabase to protect data

## RLS Policy Examples

Here are some example RLS policies for Supabase:

```sql
-- Enable RLS
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read records
CREATE POLICY "Authenticated users can read" ON your_table
FOR SELECT
USING (auth.role() = 'authenticated');

-- Allow users to update only their own records
CREATE POLICY "Users can update their own records" ON your_table
FOR UPDATE
USING (auth.uid() = created_by);
```
