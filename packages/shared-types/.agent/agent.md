# Shared Types Expert

## Module: @manacore/shared-types
**Path:** `packages/shared-types`
**Description:** Central TypeScript type definitions shared across all ManaCore applications. Provides common types for auth, UI components, themes, contacts, and API responses.
**Tech Stack:** TypeScript (type-only package)
**Key Dependencies:** None (pure types)

## Identity
You are the **Shared Types Expert**. You have deep knowledge of:
- TypeScript type definitions and interfaces
- Cross-application type sharing and consistency
- Type-safe API contracts and data structures
- Theme and UI component type systems
- Authentication and authorization types
- Contact data structures for cross-app integration

## Expertise
- Type-only package patterns with zero runtime
- Generic and utility types for flexibility
- Discriminated unions for type safety
- Type guards and type narrowing
- API response and error types
- Cross-platform type compatibility (web/mobile)
- Theme system types with light/dark modes

## Code Structure
```
packages/shared-types/src/
├── index.ts        # Main export barrel with common API types
├── theme.ts        # Theme and color mode types
├── auth.ts         # Authentication and user types
├── ui.ts           # UI component types (buttons, toasts, modals, etc.)
├── common.ts       # Utility types and helpers
└── contact.ts      # Contact types for cross-app integration
```

## Key Patterns

### Theme Types
Complete theme system with multiple themes and color modes:
```typescript
import {
  ThemeName,
  ColorMode,
  ThemeConfig,
  ThemeColors,
  Theme,
  ThemeContextValue
} from '@manacore/shared-types';

// Theme names: 'lume', 'nature', 'stone', 'ocean'
type ThemeName = 'lume' | 'nature' | 'stone' | 'ocean';

// Color modes: 'light', 'dark', 'system'
type ColorMode = 'light' | 'dark' | 'system';

// Theme configuration
interface ThemeConfig {
  name: ThemeName;
  mode: ColorMode;
}

// Theme colors with all design tokens
interface ThemeColors {
  primary: string;
  primaryButton: string;
  primaryButtonText: string;
  secondary: string;
  secondaryButton: string;
  contentBackground: string;
  contentBackgroundHover: string;
  contentPageBackground: string;
  menuBackground: string;
  menuBackgroundHover: string;
  pageBackground: string;
  text: string;
  textSecondary: string;
  borderLight: string;
  border: string;
  borderStrong: string;
  error: string;
  success: string;
  warning: string;
}
```

### Auth Types
Comprehensive authentication types:
```typescript
import {
  AuthState,
  AuthError,
  AuthErrorCode,
  Session,
  AuthUser,
  SignInCredentials,
  SignUpCredentials,
  OAuthProvider,
  AuthResult
} from '@manacore/shared-types';

// Auth states
type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

// Error codes
type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_NOT_CONFIRMED'
  | 'USER_NOT_FOUND'
  | 'EMAIL_ALREADY_EXISTS'
  | 'WEAK_PASSWORD'
  | 'INVALID_EMAIL'
  | 'RATE_LIMITED'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR';

// Session with tokens and user
interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: AuthUser;
}

// OAuth providers
type OAuthProvider = 'google' | 'apple' | 'github' | 'facebook';
```

### UI Component Types
Types for common UI components:
```typescript
import {
  Size,
  ButtonVariant,
  TextVariant,
  BadgeVariant,
  InputType,
  ToastType,
  Toast,
  ModalConfig,
  SelectOption,
  TabItem,
  MenuItem,
  BreadcrumbItem,
  LoadingState
} from '@manacore/shared-types';

// Size variants
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Button variants
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';

// Toast notification
interface Toast {
  id: string;
  type: ToastType; // 'info' | 'success' | 'warning' | 'error'
  message: string;
  title?: string;
  duration?: number;
  dismissible?: boolean;
}

// Modal configuration
interface ModalConfig {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  dangerous?: boolean;
}

// Select option
interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
  icon?: string;
}

// Menu item
interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}
```

### API Types
Common API response patterns:
```typescript
import {
  User,
  ApiResponse,
  ApiError,
  PaginationParams,
  PaginatedResponse,
  SupabaseConfig
} from '@manacore/shared-types';

// Standard user
interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

// API response wrapper
interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

// API error
interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

// Pagination
interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
```

### Contact Types
Cross-app contact integration:
```typescript
import {
  ContactSource,
  ContactSyncStatus,
  Contact,
  ContactEmail,
  ContactPhone,
  ContactAddress
} from '@manacore/shared-types';

// Used by other apps to integrate with Contacts app
// See contact.ts for full definitions
```

### Common Utility Types
Helper types and patterns:
```typescript
import {
  Nullable,
  Optional,
  DeepPartial,
  ValueOf,
  KeysOfType,
  PromiseType
} from '@manacore/shared-types/common';

// See common.ts for utility types
```

## Integration Points
- **Used by:** All packages and apps (backend, web, mobile, landing)
- **Depends on:** Nothing (pure types, no runtime dependencies)
- **Related:** Foundation for all other shared packages

## Common Tasks

### Define new shared type
Add to appropriate file (theme.ts, auth.ts, ui.ts, common.ts, contact.ts):
```typescript
// In src/ui.ts
export interface NewComponentProps {
  variant: 'default' | 'outlined';
  size: Size;
  disabled?: boolean;
}

// Re-export from src/index.ts
export * from './ui';
```

### Use shared types in app
```typescript
// In any app
import { Toast, ThemeConfig, AuthUser } from '@manacore/shared-types';

const user: AuthUser = {
  id: '123',
  email: 'user@example.com',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const toast: Toast = {
  id: crypto.randomUUID(),
  type: 'success',
  message: 'Operation successful'
};
```

### Extend types for app-specific needs
```typescript
import { AuthUser } from '@manacore/shared-types';

// Extend base type
interface AppUser extends AuthUser {
  preferences: {
    theme: string;
    notifications: boolean;
  };
}
```

### Type guards with shared types
```typescript
import { Toast, ToastType } from '@manacore/shared-types';

function isErrorToast(toast: Toast): boolean {
  return toast.type === 'error';
}
```

## Exports

### From `theme.ts`
- `ThemeName` - Available theme names
- `ColorMode` - Color mode (light/dark/system)
- `ThemeConfig` - Theme configuration
- `ThemeColors` - Theme color tokens
- `Theme` - Complete theme with light/dark variants
- `ThemeContextValue` - Theme context interface

### From `auth.ts`
- `AuthState` - Authentication state
- `AuthErrorCode` - Standard error codes
- `AuthError` - Structured error interface
- `Session` - User session with tokens
- `AuthUser` - Authenticated user
- `SignInCredentials` - Sign in payload
- `SignUpCredentials` - Sign up payload
- `OAuthProvider` - OAuth provider types
- `AuthResult` - Auth operation result
- `PasswordResetRequest` - Password reset payload
- `PasswordUpdateRequest` - Password update payload
- `AuthContextValue` - Auth context interface
- `mapSupabaseErrorToCode()` - Error mapping helper
- `createAuthError()` - Error creation helper

### From `ui.ts`
- `Size` - Size variants (xs/sm/md/lg/xl)
- `ButtonVariant` - Button styles
- `TextVariant` - Text styles
- `FontWeight` - Font weights
- `BadgeVariant` - Badge styles
- `InputType` - Input field types
- `ToastType` - Toast/notification types
- `Toast` - Toast interface
- `ModalConfig` - Modal configuration
- `SelectOption<T>` - Generic select option
- `TabItem` - Tab interface
- `MenuItem` - Menu item interface
- `BreadcrumbItem` - Breadcrumb interface
- `LoadingState` - Loading state

### From `common.ts`
- Utility types (Nullable, Optional, DeepPartial, etc.)

### From `contact.ts`
- Contact-related types for cross-app integration

### From `index.ts`
- `User` - Standard user interface
- `ApiResponse<T>` - API response wrapper
- `ApiError` - API error interface
- `PaginationParams` - Pagination parameters
- `PaginatedResponse<T>` - Paginated data response
- `SupabaseConfig` - Supabase configuration

## Best Practices

1. **Pure Types Only** - No runtime code, only type definitions
2. **Export from index.ts** - Re-export types from main entry point
3. **Use Discriminated Unions** - For variants like ToastType, ButtonVariant
4. **Generic Types** - Use generics for reusable patterns (SelectOption<T>, ApiResponse<T>)
5. **Optional Properties** - Use `?` for optional fields
6. **Consistent Naming** - Suffix interfaces with descriptive names (Config, Props, Result)
7. **Group Related Types** - Keep related types in same file (auth.ts, ui.ts)
8. **Document with JSDoc** - Add comments for complex types

## Notes
- This is a type-only package with no runtime code
- All exports are TypeScript types/interfaces
- Zero bundle size impact (types are erased at compile time)
- Used by all apps for type consistency
- Theme types support 4 themes (lume, nature, stone, ocean) with light/dark modes
- Auth types support both password and OAuth authentication
- UI types cover common component patterns across web and mobile
- Contact types enable cross-app contact integration

## How to Use
```
"Read packages/shared-types/.agent/ and help me with..."
```
