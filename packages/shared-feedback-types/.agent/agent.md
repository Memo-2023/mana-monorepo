# Agent: Feedback Types Package

## Module Information

**Package Name:** `@manacore/shared-feedback-types`
**Version:** 1.0.0
**Type:** TypeScript types library
**Purpose:** Provides shared TypeScript types and constants for feedback functionality across the Manacore monorepo

## Identity

I am the Feedback Types Agent, responsible for maintaining type definitions and data models for user feedback collection, categorization, status tracking, and voting functionality. I ensure type safety and consistency across all apps that implement feedback features.

## Expertise

- TypeScript type definitions for feedback domain
- Feedback lifecycle states and categorization
- API contract definitions (request/response types)
- Type-safe constants and configuration objects
- Multi-language label mappings (German locale)
- Feedback metadata structures

## Code Structure

```
src/
├── index.ts           # Main entry point, re-exports all types
├── feedback.ts        # Core feedback domain types
└── api.ts            # API request/response contract types
```

### Core Types (`feedback.ts`)

**FeedbackCategory**
- Union type: `'bug' | 'feature' | 'improvement' | 'question' | 'other'`
- Categorizes user feedback submissions
- Used for filtering and organization

**FeedbackStatus**
- Union type: `'submitted' | 'under_review' | 'planned' | 'in_progress' | 'completed' | 'declined'`
- Tracks feedback lifecycle from submission to resolution
- Maps to visual status badges in UI

**Feedback Interface**
- `id`: Unique identifier
- `userId`: Submitter's user ID
- `appId`: Source application identifier
- `title`: Optional short title
- `feedbackText`: Main feedback content
- `category`: FeedbackCategory type
- `status`: FeedbackStatus type
- `isPublic`: Whether visible in community board
- `adminResponse`: Optional admin reply
- `voteCount`: Number of upvotes
- `userHasVoted`: Whether current user has voted
- `deviceInfo`: Optional device/browser metadata
- `createdAt`, `updatedAt`, `publishedAt`, `completedAt`: Timestamps

**FeedbackVote Interface**
- `id`: Vote identifier
- `feedbackId`: Reference to feedback item
- `userId`: User who voted
- `createdAt`: Vote timestamp

**Constants**
- `FEEDBACK_CATEGORY_LABELS`: German labels for each category
- `FEEDBACK_STATUS_CONFIG`: Status display configuration (label, color, icon)

### API Types (`api.ts`)

**CreateFeedbackInput**
- Input for creating new feedback
- Fields: `title?`, `feedbackText`, `category?`, `deviceInfo?`

**FeedbackQueryParams**
- Query parameters for filtering/pagination
- Fields: `appId?`, `status?`, `category?`, `sort?`, `limit?`, `offset?`

**FeedbackResponse**
- Single feedback item response
- Fields: `success`, `feedback?`, `error?`

**FeedbackListResponse**
- Multiple feedback items response
- Fields: `success`, `items`, `total`, `error?`

**VoteResponse**
- Vote action response
- Fields: `success`, `newVoteCount`, `userHasVoted`, `error?`

## Key Patterns

### Export Strategy
```typescript
// Granular exports for tree-shaking
export {
  ".": "./src/index.ts",
  "./feedback": "./src/feedback.ts",
  "./api": "./src/api.ts"
}
```

### Type Safety
- All types are strictly defined with no `any` usage
- Union types for exhaustive categorization
- Optional fields marked with `?` operator
- Record types for configuration objects

### Localization
- German labels in `FEEDBACK_CATEGORY_LABELS`
- German labels in `FEEDBACK_STATUS_CONFIG`
- Color-coded status system for visual feedback

### Metadata Handling
- `deviceInfo` uses `Record<string, unknown>` for flexibility
- ISO 8601 date strings for all timestamps
- Separate timestamps for different lifecycle events

## Integration Points

### Consumed By
- `@manacore/shared-feedback-service` - Uses types for service methods
- `@manacore/shared-feedback-ui` - Uses types in Svelte components
- Backend feedback modules - Uses types for API contracts
- Any app implementing feedback features

### Dependencies
- None (zero dependencies, pure types)

### Type Re-exports
Other packages can import from this package in two ways:
```typescript
// Direct import
import { Feedback, FeedbackStatus } from '@manacore/shared-feedback-types';

// From specific modules
import { Feedback } from '@manacore/shared-feedback-types/feedback';
import { CreateFeedbackInput } from '@manacore/shared-feedback-types/api';
```

## How to Use

### Adding New Types
1. Determine if type belongs to domain (`feedback.ts`) or API (`api.ts`)
2. Add type definition with JSDoc comments
3. Export from module-specific file
4. Re-export from `index.ts` if part of public API
5. Run `pnpm type-check` to validate

### Modifying Existing Types
1. Consider backward compatibility - breaking changes affect all consumers
2. Update type definition
3. Update related constants if applicable (e.g., `FEEDBACK_STATUS_CONFIG`)
4. Search for usages across monorepo before changing
5. Run `pnpm type-check` in root to check all consumers

### Adding New Status/Category
1. Add to union type in `feedback.ts`
2. Add label to `FEEDBACK_CATEGORY_LABELS` or `FEEDBACK_STATUS_CONFIG`
3. Update UI components that render these values
4. Update backend validators

### Best Practices
- Keep types pure and focused on data structure
- Use descriptive JSDoc comments for complex types
- Prefer union types over enums for better type narrowing
- Use `Record<K, V>` for configuration objects
- Maintain German localization consistency
- Keep API types separate from domain types
- Version carefully - breaking changes cascade

### Type Organization
- **Domain types** (`feedback.ts`): Core business logic types
- **API types** (`api.ts`): HTTP request/response contracts
- **Constants**: Defined alongside related types for colocation
- **Re-exports**: Public API exposed through `index.ts`

### Testing Types
```typescript
// Types can be tested via type assertions
import type { Feedback } from '@manacore/shared-feedback-types';

const validFeedback: Feedback = {
  id: '123',
  userId: 'user-1',
  appId: 'chat',
  // ... all required fields
};
```

### Common Gotchas
- Remember `deviceInfo` is optional and can be any structure
- `userHasVoted` is computed per-request, not stored
- Status progression is not enforced at type level
- Date fields are strings (ISO 8601), not Date objects
- German labels may need translation for other locales
