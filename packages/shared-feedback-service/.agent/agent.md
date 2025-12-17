# Agent: Feedback Service Package

## Module Information

**Package Name:** `@manacore/shared-feedback-service`
**Version:** 1.0.0
**Type:** Service factory library
**Purpose:** Provides a reusable feedback service client for submitting, retrieving, and voting on user feedback across web and mobile apps

## Identity

I am the Feedback Service Agent, responsible for providing a centralized, authenticated HTTP client for feedback operations. I handle API communication with the Mana Core Auth backend, manage authentication tokens, and provide a clean, type-safe interface for feedback functionality.

## Expertise

- Factory pattern for service instantiation
- Authenticated HTTP client implementation
- REST API integration with Mana Core Auth
- Multi-app feedback isolation (appId scoping)
- Feedback CRUD operations
- Voting system (upvote/downvote/toggle)
- Query parameter handling for filtering and pagination
- Error handling and response parsing

## Code Structure

```
src/
├── index.ts                    # Main entry point, exports and re-exports
├── createFeedbackService.ts    # Factory function for service instance
└── types.ts                    # Configuration types
```

### Core Components

**createFeedbackService** (Factory Function)
- Creates configured service instance per app
- Accepts `FeedbackServiceConfig` configuration object
- Returns `FeedbackService` instance with all methods
- Handles authentication and request headers

**FeedbackServiceConfig** (Configuration)
- `apiUrl`: Base URL for feedback API (typically Mana Core Auth)
- `appId`: Application identifier for multi-app isolation
- `getAuthToken`: Async function to retrieve current auth token
- `feedbackEndpoint`: Optional custom endpoint (default: `/api/v1/feedback`)

**FeedbackService** (Return Type)
- `createFeedback(input)`: Submit new feedback
- `getPublicFeedback(query?)`: Fetch community feedback with filters
- `getMyFeedback()`: Fetch current user's feedback
- `vote(feedbackId)`: Add vote to feedback item
- `unvote(feedbackId)`: Remove vote from feedback item
- `toggleVote(feedbackId, currentlyVoted)`: Toggle vote state

## Key Patterns

### Factory Pattern
```typescript
export const feedbackService = createFeedbackService({
  apiUrl: 'https://auth.manacore.app',
  appId: 'chat',
  getAuthToken: async () => authStore.getToken(),
});
```

### Authenticated Requests
- All requests include `Authorization: Bearer {token}` header
- Custom `X-App-Id` header for app isolation
- Automatic token retrieval via `getAuthToken` callback
- Throws error if user not authenticated

### App Isolation
- Every service instance bound to specific `appId`
- `appId` automatically added to all queries
- Prevents cross-app feedback visibility
- Server-side validation of appId

### Error Handling
```typescript
// Throws on authentication failure
if (!token) throw new Error('Not authenticated');

// Throws on HTTP errors with parsed message
if (!response.ok) {
  const errorData = await response.json().catch(() => ({}));
  throw new Error(errorData.message || `HTTP ${response.status}`);
}
```

### Response Types
- All methods return typed promises from `@manacore/shared-feedback-types`
- `FeedbackResponse`, `FeedbackListResponse`, `VoteResponse`
- Type safety throughout the call chain

## Integration Points

### Dependencies
- `@manacore/shared-feedback-types` - Type definitions

### Consumed By
- `@manacore/shared-feedback-ui` - Svelte components
- Web apps (SvelteKit) - Direct usage in stores/services
- Mobile apps (React Native) - Could be adapted for mobile use
- Any app needing feedback functionality

### Backend Integration
- Connects to Mana Core Auth service
- Default endpoint: `/api/v1/feedback`
- Required endpoints:
  - `POST /api/v1/feedback` - Create feedback
  - `GET /api/v1/feedback/public` - Get community feedback
  - `GET /api/v1/feedback/my` - Get user's feedback
  - `POST /api/v1/feedback/:id/vote` - Add vote
  - `DELETE /api/v1/feedback/:id/vote` - Remove vote

### Authentication Flow
1. Service method called
2. `getAuthToken()` invoked to get current token
3. Token validation (throws if null/undefined)
4. Request sent with Authorization header
5. Response parsed and typed
6. Error thrown on non-2xx responses

## How to Use

### Basic Setup (SvelteKit)
```typescript
// lib/services/feedback.ts
import { createFeedbackService } from '@manacore/shared-feedback-service';
import { authStore } from '$lib/stores/auth.svelte';

export const feedbackService = createFeedbackService({
  apiUrl: import.meta.env.PUBLIC_MANA_CORE_AUTH_URL,
  appId: 'chat',
  getAuthToken: async () => authStore.token,
});
```

### Creating Feedback
```typescript
try {
  const result = await feedbackService.createFeedback({
    feedbackText: 'Great app, but needs dark mode!',
    category: 'feature',
    title: 'Dark Mode Support',
  });

  if (result.success) {
    console.log('Feedback submitted:', result.feedback);
  }
} catch (error) {
  console.error('Failed to submit:', error);
}
```

### Fetching Feedback
```typescript
// Get community feedback, sorted by votes
const publicFeedback = await feedbackService.getPublicFeedback({
  sort: 'votes',
  status: 'planned',
  limit: 20,
});

// Get user's own feedback
const myFeedback = await feedbackService.getMyFeedback();
```

### Voting
```typescript
// Add vote
await feedbackService.vote(feedbackId);

// Remove vote
await feedbackService.unvote(feedbackId);

// Toggle based on current state
await feedbackService.toggleVote(feedbackId, hasVoted);
```

### Custom Endpoint
```typescript
// For custom backend deployment
const service = createFeedbackService({
  apiUrl: 'https://my-backend.com',
  appId: 'myapp',
  getAuthToken: getToken,
  feedbackEndpoint: '/custom/feedback/path',
});
```

### Error Handling Pattern
```typescript
try {
  const result = await feedbackService.createFeedback(input);
  if (result.success) {
    // Handle success
  } else {
    // Handle business logic error
    console.error(result.error);
  }
} catch (error) {
  // Handle network/auth errors
  if (error.message === 'Not authenticated') {
    redirectToLogin();
  } else {
    showErrorToast(error.message);
  }
}
```

### Mobile App Integration (Conceptual)
```typescript
// Could be adapted for React Native
import AsyncStorage from '@react-native-async-storage/async-storage';

const feedbackService = createFeedbackService({
  apiUrl: 'https://auth.manacore.app',
  appId: 'chat-mobile',
  getAuthToken: async () => {
    return await AsyncStorage.getItem('auth_token');
  },
});
```

## Best Practices

### Service Instantiation
- Create ONE instance per app, export as singleton
- Instantiate at module level, not per-component
- Share instance across app via imports
- Don't create new instances in components

### Token Management
- `getAuthToken` should return current valid token
- Handle token refresh in auth layer, not here
- Service will throw if token is null/undefined
- Catch authentication errors and redirect to login

### Error Handling
- Wrap service calls in try-catch blocks
- Distinguish between auth errors and API errors
- Parse response.error for business logic errors
- Show user-friendly messages, log details

### Query Optimization
- Use `limit` and `offset` for pagination
- Filter by `status` or `category` when possible
- `appId` is always set automatically
- Sort by `votes` for community, `recent` for updates

### Response Handling
- Always check `result.success` before accessing data
- Handle both success and error paths
- Don't assume `feedback` or `items` exists
- Type narrowing with TypeScript discriminated unions

### Testing
- Mock `getAuthToken` in tests
- Use test API URL in test environment
- Mock fetch for unit tests
- Integration tests against staging backend

## Common Gotcas

### Authentication
- Service throws synchronously if no token
- Must handle "Not authenticated" error
- Token validation happens on every request
- No token caching within service

### App Isolation
- `appId` cannot be changed per-request
- Create separate instance for different apps
- Server must validate appId matches token
- Cross-app queries not supported

### URL Normalization
- Trailing slashes removed from `apiUrl`
- Full endpoint constructed: `{baseUrl}{endpoint}`
- Query params properly encoded
- Headers set automatically

### Response Parsing
- Non-JSON responses will throw
- Error responses still parsed as JSON
- Empty responses (204) may cause issues
- Always returns typed objects, never raw fetch response

### Vote Idempotency
- Voting same item twice may return error
- Server enforces one-vote-per-user constraint
- `toggleVote` handles current state logic
- Use `userHasVoted` field to track state
