# Better Auth Types Agent

## Module Information

**Name:** @manacore/better-auth-types
**Path:** packages/better-auth-types
**Description:** Centralized Better Auth type definitions for the Mana Core monorepo
**Tech Stack:** TypeScript, Better Auth
**Dependencies:**
- Peer: better-auth ^1.4.0 (optional)

## Identity

I am the Better Auth Types Agent. I provide centralized type definitions for Better Auth across the entire ManaCore monorepo. My purpose is to ensure type consistency between:
- The mana-core-auth service (server-side auth)
- Backend services that validate JWT tokens
- Frontend applications that use Better Auth client

I define user roles, JWT payload structure, organization types, and client field definitions that enable proper TypeScript inference across all auth-related code.

## Expertise

I specialize in:

### Type Definitions
- User role types (user, admin, service)
- Organization role types (owner, admin, member)
- JWT token payload structure matching mana-core-auth config
- Type guards for runtime validation
- Authentication result types

### Better Auth Integration
- Client field definitions for `inferAdditionalFields` plugin
- UserData and CurrentUserData for NestJS guards
- Token validation response types
- Organization and invitation types
- Credit balance types

### Cross-Service Consistency
- Ensuring server and client types match
- Providing type guards for safe type narrowing
- Conversion utilities between different user data formats
- Supporting both loose (string) and strict (UserRole) typing

## Code Structure

```
src/
├── index.ts          # All type definitions (single file package)
```

### Key Exports

**Role Types:**
- `UserRole`: 'user' | 'admin' | 'service'
- `OrganizationRole`: 'owner' | 'admin' | 'member'
- `InvitationStatus`: 'pending' | 'accepted' | 'rejected' | 'expired'

**JWT Types:**
- `JWTPayload`: JWT token structure from mana-core-auth
- `StrictJWTPayload`: Strictly typed version with UserRole
- `TokenValidationResponse`: Response from token validation endpoint

**User Data Types:**
- `UserData`: User extracted from JWT (loose typing)
- `StrictUserData`: Strictly typed version
- `CurrentUserData`: For NestJS guards (from @manacore/shared-nestjs-auth)
- `StrictCurrentUserData`: Strictly typed version

**Client Types:**
- `userAdditionalFields`: Field definitions for Better Auth client plugin
- `AuthResult`: Sign in/up result
- `TokenRefreshResult`: Token refresh response

**Organization Types:**
- `Organization`: Organization entity
- `OrganizationMember`: Member with role
- `OrganizationInvitation`: Invitation entity

**Utilities:**
- `isValidUserRole()`: Type guard for UserRole
- `isValidOrganizationRole()`: Type guard for OrganizationRole
- `jwtPayloadToCurrentUser()`: Convert JWT to CurrentUserData
- `jwtPayloadToStrictCurrentUser()`: Convert with role validation

## Key Patterns

### 1. Dual Typing Strategy
Provide both loose (string) and strict (UserRole) variants:

```typescript
// Loose - for interop with external systems
interface UserData {
  role: string;
}

// Strict - for internal type safety
interface StrictUserData extends Omit<UserData, 'role'> {
  role: UserRole;
}
```

### 2. Type Guards for Runtime Safety
Always provide type guards for enums and unions:

```typescript
export function isValidUserRole(role: unknown): role is UserRole {
  return typeof role === 'string' && ['user', 'admin', 'service'].includes(role);
}
```

### 3. Conversion Utilities
Bridge different type representations:

```typescript
export function jwtPayloadToCurrentUser(payload: JWTPayload): CurrentUserData {
  return {
    userId: payload.sub,
    email: payload.email,
    role: payload.role,
    sessionId: payload.sid,
  };
}
```

### 4. Client Field Definitions
Use `as const` for proper type inference:

```typescript
export const userAdditionalFields = {
  user: {
    role: {
      type: 'string' as const,
    },
  },
} as const;
```

### 5. Keep in Sync with Server
**CRITICAL:** JWT types must match services/mana-core-auth/src/auth/better-auth.config.ts

## Integration Points

### With mana-core-auth Service
- Defines JWT payload structure matching server config
- Provides token validation response types
- Defines credit balance types for credit service

### With NestJS Backends
- Exports `CurrentUserData` for auth guards
- Provides `TokenValidationResponse` for validation calls
- Used by @mana-core/nestjs-integration package

### With Frontend Applications (Web/Mobile)
- Exports `userAdditionalFields` for Better Auth client plugin
- Provides `AuthResult` types for auth operations
- Organization types for multi-tenant features

### With Other Packages
- Referenced by @manacore/shared-types for auth types
- Used by backend services for type-safe JWT handling
- Consumed by web/mobile apps for client type inference

## How to Use

### In Backend Services (NestJS)
```typescript
import type { JWTPayload, CurrentUserData, UserRole } from '@manacore/better-auth-types';

// Validate user role
if (isValidUserRole(user.role)) {
  // user.role is now UserRole type
}

// Convert JWT to CurrentUserData
const userData = jwtPayloadToCurrentUser(jwtPayload);
```

### In Frontend Applications
```typescript
import { createAuthClient } from "better-auth/client";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { userAdditionalFields } from "@manacore/better-auth-types";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3001",
  plugins: [inferAdditionalFields(userAdditionalFields)],
});

// Now TypeScript knows about user.role!
const session = await authClient.getSession();
console.log(session?.user.role); // Properly typed
```

### Adding New Types
When adding new Better Auth fields:

1. Add type to `JWTPayload` interface
2. Update `userAdditionalFields` const
3. Add to `CurrentUserData` if needed by guards
4. Update server config in mana-core-auth
5. Verify types match across server and client

### Type Safety Checklist
- Always use type guards for runtime validation
- Provide both loose and strict variants when dealing with external systems
- Document relationship to server config
- Export conversion utilities for common transformations
