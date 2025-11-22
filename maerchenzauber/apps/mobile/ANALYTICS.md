# PostHog Analytics Documentation

This document explains the comprehensive PostHog analytics implementation in the Storyteller mobile app.

## Table of Contents
- [Setup](#setup)
- [Architecture](#architecture)
- [Event Types](#event-types)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [Debugging](#debugging)

## Setup

### 1. Environment Configuration

Add your PostHog credentials to `mobile/.env`:

```bash
# PostHog Analytics
EXPO_PUBLIC_POSTHOG_API_KEY=your-posthog-api-key
EXPO_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

> **Note:** Replace `your-posthog-api-key` with your actual PostHog project API key from [app.posthog.com](https://app.posthog.com)

### 2. Installation

The required dependencies are already installed:
- `posthog-react-native` - Core PostHog SDK for React Native
- `posthog-js` - PostHog JavaScript SDK
- `expo-file-system`, `expo-application`, `expo-localization` - Required peer dependencies

### 3. Initialization

Analytics are automatically initialized in the app through the `PostHogWebProvider` in `app/_layout.tsx`. No manual initialization is required.

## Architecture

### Core Files

```
mobile/
├── src/
│   ├── services/
│   │   └── analytics.ts          # Core analytics service with type-safe events
│   ├── providers/
│   │   └── PostHogWebProvider.tsx # Provider that initializes analytics
│   └── hooks/
│       ├── usePostHogWeb.ts      # Backward-compatible PostHog hook
│       └── useAnalytics.ts       # New React hooks for analytics
```

### Analytics Service

The `analytics.ts` service provides:
- **Type-safe event tracking** - All events are strongly typed using TypeScript
- **Automatic enrichment** - Events automatically include device info, session data, etc.
- **Error handling** - Graceful degradation if PostHog is not configured
- **User identification** - Link events to specific users
- **Screen tracking** - Automatic screen view tracking

## Event Types

### Authentication Events

```typescript
// Sign in
analytics.track('auth_signin_started', { method: 'email' | 'google' | 'apple' });
analytics.track('auth_signin_completed', { method: 'email', userId: string });
analytics.track('auth_signin_failed', { method: 'email', error: string });

// Sign up
analytics.track('auth_signup_started', { method: 'email' | 'google' | 'apple' });
analytics.track('auth_signup_completed', { method: 'email', userId: string });
analytics.track('auth_signup_failed', { method: 'email', error: string });

// Sign out
analytics.track('auth_signout', { userId: string });
```

### Story Events

```typescript
// Story creation
analytics.track('story_creation_started', {
  characterId: string,
  characterName: string
});

analytics.track('story_prompt_entered', {
  promptLength: number,
  language: string
});

analytics.track('story_generation_completed', {
  storyId: string,
  characterId: string,
  duration: number,
  pageCount: number,
  language: string
});

analytics.track('story_generation_failed', {
  characterId: string,
  error: string,
  duration: number
});

// Story interaction
analytics.track('story_viewed', { storyId: string, title: string });
analytics.track('story_page_changed', {
  storyId: string,
  pageNumber: number,
  totalPages: number
});

analytics.track('story_shared', { storyId: string, method: string });
analytics.track('story_deleted', { storyId: string });
```

### Story Engagement Events

These events track how users interact with and consume stories, providing deep insights into engagement patterns:

```typescript
// Story session tracking
analytics.track('story_session_started', {
  storyId: string,
  title: string,
  pageCount: number
});

analytics.track('story_session_ended', {
  storyId: string,
  duration: number,          // Total time in milliseconds
  pagesViewed: number,       // Number of unique pages viewed
  completed: boolean,        // Whether user reached the end
  furthestPage: number       // Highest page number reached
});

// Page-level engagement
analytics.track('story_page_viewed', {
  storyId: string,
  pageNumber: number,
  totalPages: number,
  isStartScreen: boolean,    // Start screen (page 0)
  isEndScreen: boolean       // End screen (last page)
});

analytics.track('story_page_duration', {
  storyId: string,
  pageNumber: number,
  duration: number,          // Time spent on this page in milliseconds
  isStartScreen: boolean,
  isEndScreen: boolean
});

// Story completion
analytics.track('story_completed', {
  storyId: string,
  totalDuration: number,           // Total time to complete story
  pageCount: number,               // Number of story pages (excluding start/end)
  averagePageDuration: number      // Average time per page
});

// Abandonment tracking
analytics.track('story_abandoned', {
  storyId: string,
  lastPage: number,                // Last page viewed before leaving
  totalPages: number,
  duration: number,                // Time before abandonment
  completionPercentage: number     // How far through the story (0-100)
});

// Story restart
analytics.track('story_restarted', {
  storyId: string,
  fromPage: number                 // Page number when restart was triggered
});

// Button interactions
analytics.track('story_end_button_clicked', {
  storyId: string,
  title: string
});

analytics.track('story_restart_button_clicked', {
  storyId: string,
  fromPage: number                 // Page when restart was clicked
});

analytics.track('story_archive_button_clicked', {
  storyId: string,
  title: string
});

analytics.track('story_archived', {
  storyId: string,
  title: string
});
```

### Character Events

```typescript
// Character creation
analytics.track('character_creation_started', {
  method: 'description' | 'photo'
});

analytics.track('character_description_entered', {
  descriptionLength: number
});

analytics.track('character_photo_selected', {
  source: 'camera' | 'gallery'
});

analytics.track('character_generation_completed', {
  characterId: string,
  name: string,
  method: 'description' | 'photo',
  duration: number
});

analytics.track('character_generation_failed', {
  method: 'description' | 'photo',
  error: string,
  duration: number
});

// Character interaction
analytics.track('character_viewed', {
  characterId: string,
  characterName: string
});

analytics.track('character_shared', { characterId: string, method: string });
analytics.track('character_deleted', { characterId: string });
```

### Credit Events

```typescript
analytics.track('credits_checked', { balance: number });

analytics.track('credits_insufficient', {
  required: number,
  available: number,
  action: string
});

analytics.track('credits_consumed', {
  amount: number,
  action: string,
  balance: number
});

analytics.track('credits_purchase_initiated', { amount: number });
analytics.track('credits_purchase_completed', {
  amount: number,
  paymentMethod: string
});

// Credits screen tracking
analytics.track('credits_screen_viewed', {
  source: string,           // Where user came from (e.g., 'insufficient_modal', 'settings')
  balance: number          // Current credit balance
});

analytics.track('credits_screen_duration', {
  duration: number,        // Time spent on credits screen
  purchaseMade: boolean    // Whether a purchase was completed
});
```

### Screen Navigation

```typescript
analytics.track('screen_viewed', {
  screenName: string,
  params?: Record<string, any>,
  previousScreen?: string
});
```

### Performance & Errors

```typescript
analytics.track('api_request', {
  endpoint: string,
  method: string,
  duration: number,
  statusCode: number,
  success: boolean
});

analytics.track('error_occurred', {
  error: string,
  errorCode?: string,
  screen: string,
  action?: string,
  metadata?: Record<string, any>
});
```

## Usage Examples

### Basic Event Tracking

```typescript
import { analytics } from '../src/services/analytics';

// Track a simple event
analytics.track('feature_discovered', {
  feature: 'story_sharing',
  source: 'button_click'
});
```

### Using React Hooks

```typescript
import { useAnalytics, useScreenTracking, useErrorTracking } from '../hooks/useAnalytics';

function MyComponent() {
  // Automatic screen tracking
  useScreenTracking('MyScreen', { userId: '123' });

  // Error tracking with automatic context
  const { trackError } = useErrorTracking('MyScreen');

  const handleAction = async () => {
    try {
      await riskyOperation();
    } catch (error) {
      trackError(error, {
        action: 'riskyOperation',
        metadata: { attemptCount: 3 }
      });
    }
  };

  return <View>...</View>;
}
```

### Performance Tracking

```typescript
import { usePerformanceTracking } from '../hooks/useAnalytics';

function MyComponent() {
  const { startTimer, endTimer } = usePerformanceTracking();

  const handleLoadData = async () => {
    startTimer('load_data');
    const data = await fetchData();
    endTimer('load_data', { recordCount: data.length });
  };

  return <View>...</View>;
}
```

### Story Engagement Tracking

Track detailed user engagement with stories including time spent, page views, and completion rates:

```typescript
import { useStoryEngagement } from '../hooks/useStoryEngagement';

function StoryViewerScreen({ story }) {
  // Initialize engagement tracking
  const { trackPageView, trackRestart } = useStoryEngagement({
    storyId: story.id,
    title: story.title,
    pageCount: story.pages.length
  });

  // Track when user changes pages
  const handlePageChange = (pageIndex: number) => {
    trackPageView(pageIndex);
    // Automatically tracks:
    // - Page view time
    // - Session duration
    // - Story completion
    // - Abandonment
  };

  // Track when user restarts the story
  const handleRestart = () => {
    trackRestart(currentPage);
  };

  return <StoryViewer onPageChange={handlePageChange} onRestart={handleRestart} />;
}
```

### Credits Screen Tracking

Track when users view the credits/purchase screen and how long they spend there:

```typescript
import { useCreditsScreenTracking } from '../hooks/useStoryEngagement';

function CreditsScreen({ balance }) {
  // Track screen viewing and duration
  const { markPurchaseMade } = useCreditsScreenTracking('insufficient_modal', balance);

  const handlePurchase = async (amount: number) => {
    const result = await purchaseCredits(amount);

    if (result.success) {
      // Mark that a purchase was made for analytics
      markPurchaseMade();
    }
  };

  return <View>...</View>;
  // Duration is automatically tracked on unmount
}
```

### User Identification

```typescript
import { analytics } from '../src/services/analytics';

// Identify user after login
await analytics.identify(user.id, {
  email: user.email,
  name: user.name,
  plan: user.plan,
  signupDate: user.createdAt
});

// Update user properties
await analytics.setUserProperties({
  preferredLanguage: 'de',
  storiesCreated: 5
});

// Reset on logout
await analytics.reset();
```

### Screen View Tracking

```typescript
import { analytics } from '../src/services/analytics';

// Track screen view
analytics.trackScreenView('StoryList', {
  storyCount: stories.length,
  filter: 'recent'
});

// Or use the hook for automatic tracking
import { useScreenTracking } from '../hooks/useAnalytics';

function StoryListScreen() {
  useScreenTracking('StoryList', {
    storyCount: stories.length
  });

  return <View>...</View>;
}
```

### Error Tracking

```typescript
import { analytics } from '../src/services/analytics';

try {
  await createStory(data);
} catch (error) {
  analytics.trackError(error, {
    screen: 'CreateStory',
    action: 'submit_story',
    metadata: {
      characterId: selectedCharacter.id,
      promptLength: prompt.length
    }
  });
}
```

## Best Practices

### 1. Use Type-Safe Events

Always use the strongly-typed events defined in the `AnalyticsEvent` type:

```typescript
// ✅ Good - Type-safe
analytics.track('story_created', {
  storyId: '123',
  characterId: 'abc'
});

// ❌ Bad - No type safety
posthog?.capture('story_created', { id: '123' });
```

### 2. Track User Flows

Track the complete user journey:

```typescript
// Start of flow
analytics.track('story_creation_started', { characterId: '123' });

// User action
analytics.track('story_prompt_entered', { promptLength: 50 });

// End of flow (success)
analytics.track('story_generation_completed', {
  storyId: '456',
  characterId: '123',
  duration: 5000
});

// Or end of flow (failure)
analytics.track('story_generation_failed', {
  characterId: '123',
  error: 'API timeout',
  duration: 30000
});
```

### 3. Include Context

Always include relevant context with events:

```typescript
// ✅ Good - Rich context
analytics.track('story_generation_completed', {
  storyId: story.id,
  characterId: character.id,
  duration: elapsed,
  pageCount: 10,
  language: 'de'
});

// ❌ Bad - Minimal context
analytics.track('story_generation_completed', {
  storyId: story.id
});
```

### 4. Track Performance

Track timing for important operations:

```typescript
const startTime = Date.now();
try {
  const result = await expensiveOperation();
  const duration = Date.now() - startTime;

  analytics.track('operation_completed', {
    duration,
    success: true,
    resultCount: result.length
  });
} catch (error) {
  analytics.track('operation_failed', {
    duration: Date.now() - startTime,
    error: error.message
  });
}
```

### 5. Avoid PII

Never track Personally Identifiable Information (PII) in event properties:

```typescript
// ✅ Good - No PII
analytics.track('profile_updated', {
  fields: ['name', 'avatar'],
  fieldCount: 2
});

// ❌ Bad - Contains PII
analytics.track('profile_updated', {
  email: 'user@example.com',
  name: 'John Doe'
});
```

Use `identify()` for user-level data instead of event properties.

### 6. Handle Errors Gracefully

Analytics should never break your app:

```typescript
// The analytics service already handles errors internally
analytics.track('my_event', { data: 'value' });
// If PostHog is not configured or fails, this won't throw
```

## Debugging

### Check if Analytics is Enabled

```typescript
import { analytics } from '../src/services/analytics';

if (analytics.isEnabled()) {
  console.log('Analytics is enabled');
} else {
  console.log('Analytics is disabled or not configured');
}
```

### View Events in Console

All events are logged to the console in development:

```
[Analytics] Event tracked: story_creation_started {
  characterId: '123',
  characterName: 'Fluffy',
  timestamp: '2025-10-31T...',
  current_screen: 'CreateStory',
  session_duration: 45000
}
```

### Force Flush Events

Events are automatically batched. To force immediate sending:

```typescript
import { analytics } from '../src/services/analytics';

await analytics.flush();
```

### Common Issues

**Analytics not tracking:**
1. Check that `EXPO_PUBLIC_POSTHOG_API_KEY` is set in `.env`
2. Restart Expo with cache clear: `npx expo start -c`
3. Check console for initialization errors

**Events not appearing in PostHog:**
1. Events are batched - wait a few seconds or call `flush()`
2. Check that your PostHog project is active
3. Verify the API key is correct

**TypeScript errors:**
1. Make sure event names match exactly (case-sensitive)
2. Ensure properties match the type definition
3. Update the `AnalyticsEvent` type if adding new events

## Adding New Events

To add a new event type:

1. Add the event definition to `AnalyticsEvent` type in `src/services/analytics.ts`:

```typescript
export type AnalyticsEvent = {
  // ... existing events ...

  // Your new event
  'feature_used': {
    featureName: string;
    context: string;
  };
};
```

2. Track the event:

```typescript
analytics.track('feature_used', {
  featureName: 'dark_mode',
  context: 'settings'
});
```

3. The event is now type-safe and will autocomplete in your IDE!

## PostHog Dashboard

Access your analytics dashboard at [app.posthog.com](https://app.posthog.com)

### Useful Views

- **Live Events**: See events as they happen in real-time
- **Insights**: Create charts and graphs from your events
- **Funnels**: Analyze user flows (e.g., sign up → create character → create story)
- **Cohorts**: Group users by behavior
- **Session Recordings**: Watch user sessions (if enabled)

### Recommended Insights

#### Creation & Generation

1. **Story Creation Funnel**:
   - `story_creation_started` → `story_prompt_entered` → `story_generation_completed`

2. **Character Creation Success Rate**:
   - `character_generation_completed` / `character_creation_started` * 100

3. **Average Story Generation Time**:
   - Average of `duration` property on `story_generation_completed` events

#### Story Engagement

5. **Story Completion Rate**:
   - `story_completed` / `story_session_started` * 100
   - Shows what percentage of users finish stories they start

6. **Average Time Per Story Page**:
   - Average of `duration` property on `story_page_duration` events (excluding start/end screens)
   - Indicates engagement level - too short might mean skipping, too long might mean confusion

7. **Story Abandonment Points**:
   - Chart of `lastPage` property from `story_abandoned` events
   - Identify which pages cause users to leave

8. **Story Engagement Funnel**:
   - `story_session_started` → `story_page_viewed` (page 1) → `story_page_viewed` (page 5) → `story_completed`
   - Shows drop-off at different story stages

9. **Average Pages Viewed Per Session**:
   - Average of `pagesViewed` property on `story_session_ended` events
   - Measures how much content users consume

10. **Story Restart Rate**:
    - Count of `story_restarted` events / count of `story_session_started` events
    - Indicates replayability/engagement

#### User Actions & Behavior

11. **Archive Rate**:
    - `story_archived` / `story_archive_button_clicked` * 100
    - Shows if users follow through with archiving

12. **Restart vs. End Behavior**:
    - Compare `story_restart_button_clicked` vs `story_end_button_clicked`
    - Indicates if stories encourage re-reading or are one-time reads

13. **Action Click Analysis**:
    - Count of each button click type
    - Helps understand which features are most used

#### Monetization

14. **Credit Consumption**:
    - Sum of `amount` property on `credits_consumed` events grouped by `action`

15. **Credits Screen Conversion**:
    - `credits_purchase_completed` / `credits_screen_viewed` * 100
    - Shows effectiveness of purchase flow

16. **Time to Purchase Decision**:
    - Average of `duration` property on `credits_screen_duration` events where `purchaseMade` = true
    - Helps understand purchase friction

## Support

For issues or questions about analytics:
1. Check the console logs for error messages
2. Verify environment configuration
3. Review PostHog documentation: [posthog.com/docs](https://posthog.com/docs)
4. Check this documentation for usage examples
