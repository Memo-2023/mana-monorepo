# Code Style Guidelines

## Formatting

### Prettier Configuration

All projects use the root `.prettierrc.json`:

```json
{
  "useTabs": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "plugins": ["prettier-plugin-svelte", "prettier-plugin-astro"]
}
```

### Key Rules
- **Tabs** for indentation (not spaces)
- **Single quotes** for strings
- **Trailing commas** in ES5-compatible positions
- **100 character** line width
- **Semicolons** required

## Naming Conventions

### Files & Directories

| Type | Convention | Example |
|------|------------|---------|
| **Components** | PascalCase | `MessageBubble.svelte`, `ChatInput.tsx` |
| **Services** | kebab-case | `auth.service.ts`, `user-credits.service.ts` |
| **Schemas** | kebab-case | `users.schema.ts`, `batch-generations.schema.ts` |
| **Utilities** | kebab-case | `format-date.ts`, `string-utils.ts` |
| **Types/Interfaces** | kebab-case | `user.types.ts`, `api-response.ts` |
| **Constants** | kebab-case | `error-codes.ts`, `config.ts` |
| **Test files** | `.spec.ts` suffix | `auth.service.spec.ts` |

### Code Identifiers

| Type | Convention | Example |
|------|------------|---------|
| **Classes** | PascalCase | `UserService`, `AuthController` |
| **Interfaces** | PascalCase | `UserData`, `CreateEventDto` |
| **Type aliases** | PascalCase | `Result<T>`, `ErrorCode` |
| **Functions** | camelCase | `findById`, `createUser` |
| **Variables** | camelCase | `userId`, `isLoading` |
| **Constants** | SCREAMING_SNAKE_CASE | `MAX_FILE_SIZE`, `DEFAULT_TIMEOUT` |
| **Enums** | PascalCase (type), SCREAMING_SNAKE_CASE (values) | `ErrorCode.NOT_FOUND` |
| **Private fields** | camelCase (no underscore prefix) | `private db: Database` |

### Database Naming

| Type | Convention | Example |
|------|------------|---------|
| **Tables** | snake_case, plural | `users`, `user_sessions` |
| **Columns** | snake_case | `user_id`, `created_at` |
| **Foreign keys** | `{entity}_id` | `user_id`, `folder_id` |
| **Booleans** | `is_` or `has_` prefix | `is_deleted`, `has_password` |
| **Timestamps** | `_at` suffix | `created_at`, `deleted_at` |
| **Indexes** | `idx_` prefix | `idx_user_id`, `idx_created_at` |

## TypeScript

### Strict Mode

All projects use strict TypeScript:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### Type Annotations

```typescript
// GOOD - Explicit return types for public APIs
async function findById(id: string): Promise<Result<User>> {
  // ...
}

// GOOD - Interface for complex objects
interface CreateUserDto {
  email: string;
  name: string;
  password: string;
}

// BAD - Avoid `any`
function process(data: any) { } // Never do this

// GOOD - Use `unknown` when type is truly unknown
function process(data: unknown) {
  if (isUser(data)) {
    // Now TypeScript knows it's a User
  }
}
```

### Imports

```typescript
// Order: external → internal → relative
import { Injectable } from '@nestjs/common';           // 1. External
import { Result, ErrorCode } from '@manacore/shared-errors'; // 2. Internal packages
import { UserService } from '../services/user.service';      // 3. Relative

// Use named exports (not default)
export { UserService };           // GOOD
export default UserService;       // AVOID

// Use type-only imports for types
import type { User } from './user.types';
```

## ESLint Rules

### Critical Rules (Errors)

```javascript
{
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/explicit-function-return-type": "error",  // For public APIs
  "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
  "no-console": ["error", { "allow": ["warn", "error"] }],
}
```

### Recommended Rules (Warnings)

```javascript
{
  "@typescript-eslint/no-floating-promises": "warn",
  "@typescript-eslint/await-thenable": "warn",
  "prefer-const": "warn",
}
```

## Comments

### When to Comment

```typescript
// GOOD - Explain WHY, not WHAT
// We use optimistic locking here because concurrent credit operations
// could otherwise result in race conditions and incorrect balances
const [updated] = await this.db
  .update(balances)
  .set({ amount: newAmount, version: sql`version + 1` })
  .where(and(eq(balances.userId, userId), eq(balances.version, currentVersion)))
  .returning();

// BAD - Explaining obvious code
// Loop through users
for (const user of users) { }

// BAD - Outdated comment
// Returns the user's email  <-- but function now returns full user object
function getUser() { }
```

### JSDoc for Public APIs

```typescript
/**
 * Consumes credits from a user's balance.
 *
 * @param userId - The user's unique identifier
 * @param amount - Number of credits to consume
 * @param reason - Human-readable reason for the charge
 * @returns Result with the updated balance or an error
 *
 * @example
 * const result = await creditsService.consume(userId, 10, 'AI generation');
 * if (!result.ok) {
 *   logger.error('Credit consumption failed', result.error);
 * }
 */
async consume(userId: string, amount: number, reason: string): Promise<Result<Balance>> {
  // ...
}
```

## Code Organization

### File Size

- **Maximum**: ~300 lines per file
- **Ideal**: 100-200 lines
- Split large files into focused modules

### Function Size

- **Maximum**: ~50 lines per function
- **Ideal**: 10-25 lines
- Extract complex logic into helper functions

### Module Structure (NestJS)

```
feature/
├── feature.controller.ts     # HTTP layer
├── feature.service.ts        # Business logic
├── feature.module.ts         # DI configuration
├── feature.spec.ts           # Tests
└── dto/
    ├── create-feature.dto.ts
    └── update-feature.dto.ts
```

### Component Structure (Svelte/React)

```
components/
├── feature/
│   ├── FeatureList.svelte    # Container component
│   ├── FeatureItem.svelte    # Presentational component
│   └── feature.types.ts      # Shared types
└── ui/
    ├── Button.svelte         # Reusable UI
    └── Input.svelte
```

## Anti-Patterns to Avoid

### 1. Magic Numbers/Strings

```typescript
// BAD
if (user.role === 'admin') { }
if (credits < 10) { }

// GOOD
const ROLES = { ADMIN: 'admin', USER: 'user' } as const;
const MIN_CREDITS_FOR_OPERATION = 10;

if (user.role === ROLES.ADMIN) { }
if (credits < MIN_CREDITS_FOR_OPERATION) { }
```

### 2. Nested Callbacks

```typescript
// BAD
getUser(id, (user) => {
  getCredits(user.id, (credits) => {
    updateBalance(credits, (result) => {
      // ...
    });
  });
});

// GOOD
const user = await getUser(id);
const credits = await getCredits(user.id);
const result = await updateBalance(credits);
```

### 3. Mutating Parameters

```typescript
// BAD
function processUser(user: User): void {
  user.name = user.name.trim();  // Mutates input
}

// GOOD
function processUser(user: User): User {
  return { ...user, name: user.name.trim() };  // Returns new object
}
```

### 4. Boolean Trap

```typescript
// BAD - What does `true` mean?
createUser(email, password, true, false);

// GOOD - Use options object
createUser({
  email,
  password,
  sendWelcomeEmail: true,
  requireEmailVerification: false,
});
```

## Formatting Commands

```bash
# Format all files
pnpm format

# Check formatting without changes
pnpm format:check

# Format specific project
pnpm --filter @chat/backend format
```
