# Analytics Integration Documentation

## Overview

The Memoro app uses a multi-platform analytics system with **PostHog** for mobile (iOS/Android) and **Umami** for web. This document describes all tracked events, implementation details, and best practices.

## Architecture

### Service Layer
- **MultiPlatformAnalyticsService** (`/features/analytics/services/multiPlatformAnalytics.ts`)
  - Routes analytics calls to the appropriate service based on platform
  - PostHog for mobile (iOS/Android)
  - Umami for web

### Key Components
- **AnalyticsProvider** - Initializes analytics on app start
- **AnalyticsNavigationTracker** - Automatic screen tracking via Expo Router
- **useAnalytics** - Hook for tracking events
- **useScreenTracking** - Hook for manual screen tracking
- **useFeatureFlag** - Hook for PostHog feature flags (mobile only)

## Configuration

### PostHog (Mobile) - v3.x
- **API Key**: Set in `EXPO_PUBLIC_POSTHOG_KEY`
- **Host**: `https://eu.i.posthog.com` (EU datacenter)
- **Auto-capture**: Enabled for lifecycle events
- **Debug Mode**: Enabled in development
- **Initialization**: Automatic in constructor (no `initAsync()` needed)
- **Methods**: Synchronous (no `async/await` required)

### Umami (Web)
- **Website ID**: Set in `EXPO_PUBLIC_UMAMI_WEBSITE_ID`
- **Script URL**: `https://umami.manacore.ai/script.js`

## Tracked Events

### 🎙️ Recording Events

#### `recording_started`
Fired when user starts a recording
```typescript
{
  blueprint_id: string,
  space_id: string | null,
  languages: string[],
  language_count: number,
  is_append: boolean,
  theme: 'light' | 'dark'
}
```

#### `recording_stopped`
Fired when recording is stopped (manual or automatic)
```typescript
{
  duration_seconds: number,
  reason: 'manual' | 'auto' | 'error',
  blueprint_id: string | null,
  space_id: string | null,
  has_result: boolean
}
```

#### `recording_failed`
Fired when recording fails
```typescript
{
  error_type: 'insufficient_credits' | 'permission_denied' | 'network_error',
  blueprint_id: string | null,
  space_id: string | null,
  can_ask_again?: boolean  // For permission errors
}
```

#### `recording_permission_retry`
Fired when user retries after permission denial
```typescript
{
  blueprint_id: string | null,
  space_id: string | null
}
```

### 📝 Memo Events

#### `memo_viewed`
Fired when a memo is opened
```typescript
{
  memo_id: string,
  source: 'direct_navigation' | 'list' | 'search',
  is_translated: boolean
}
```

#### `memo_shared`
Fired when user shares a memo
```typescript
{
  memo_id: string,
  has_transcript: boolean,
  has_memories: boolean
}
```

#### `memo_deleted`
Fired when a memo is deleted
```typescript
{
  memo_id: string,
  has_transcript: boolean,
  duration_seconds: number | null
}
```

#### `memo_pinned` / `memo_unpinned`
Fired when pin status changes
```typescript
{
  memo_id: string
}
```

#### `transcript_copied`
Fired when transcript is copied to clipboard
```typescript
{
  memo_id: string,
  transcript_length: number
}
```

### 📋 List & Search Events

#### `memo_list_filtered`
Fired when filters are applied to memo list
```typescript
{
  filter_type: 'tags' | 'space' | 'date',
  tag_count?: number,
  tag_ids?: string[]
}
```

#### `memo_searched`
Fired when user performs a search
```typescript
{
  query_length: number,
  has_results: boolean
}
```

#### `memo_bulk_action`
Fired for bulk operations on multiple memos
```typescript
{
  action: 'delete' | 'add_tag' | 'remove_tag' | 'move_space',
  memo_count: number,
  tag_id?: string,
  space_id?: string
}
```

### 🤖 AI Processing Events

#### `blueprint_selected`
Fired when user selects a blueprint
```typescript
{
  blueprint_id: string | null,
  is_standard: boolean,
  space_id: string | null
}
```

#### `blueprint_applied`
Fired when blueprint processing completes
```typescript
{
  memo_id: string,
  blueprint_id: string,
  mana_cost: number,
  processing_time_ms: number
}
```

#### `question_asked`
Fired when user asks a question about a memo
```typescript
{
  memo_id: string,
  question_length: number,
  mana_cost: 5  // Fixed cost
}
```

#### `memos_combined`
Fired when multiple memos are combined
```typescript
{
  memo_count: number,
  blueprint_id: string,
  has_prompt: boolean,
  mana_cost: number  // 5 per memo
}
```

#### `memo_reprocessed`
Fired when memo is reprocessed with new settings
```typescript
{
  memo_id: string,
  language: string,
  has_blueprint: boolean,
  blueprint_id?: string
}
```

#### `memo_translated`
Fired when memo is translated
```typescript
{
  memo_id: string,
  target_language: string
}
```

### 💳 Subscription & Credits Events

#### `subscription_page`
Screen view for subscription page
```typescript
{
  is_b2b: boolean
}
```

#### `subscription_purchase_attempted`
Fired when user initiates purchase
```typescript
{
  plan_id: string,
  plan_type: 'individual' | 'team' | 'enterprise',
  billing_cycle: 'monthly' | 'yearly',
  credits: number,
  price: number
}
```

#### `subscription_purchased`
Fired on successful purchase
```typescript
{
  plan_id: string,
  plan_type: 'individual' | 'team' | 'enterprise',
  billing_cycle: 'monthly' | 'yearly',
  credits: number,
  price: number
}
```

#### `subscription_restore_attempted` / `subscription_restore_completed`
Fired during purchase restoration flow

### 📱 Screen Tracking

Automatic screen tracking via `AnalyticsNavigationTracker`:
- `recording_screen` - Home/Recording tab
- `memos_list` - Memos tab
- `memo_detail` - Individual memo view
- `subscription_page` - Subscription/credits page
- `settings` - Settings page
- `profile` - User profile

Each screen event includes:
```typescript
{
  path: string,  // URL path
  timestamp: string,
  focused_at?: string  // For manual tracking
}
```

### ⚡ Performance Events

#### `memo_load_time`
Tracks memo loading performance
```typescript
{
  memo_id: string,
  duration_ms: number
}
```

### 🔥 Error Tracking

#### `error_occurred`
Generic error tracking
```typescript
{
  error_name: string,
  error_message: string,
  error_stack?: string,  // Only in dev
  screen?: string,
  action?: string,
  user_id?: string
}
```

## Implementation Examples

### Basic Event Tracking
```typescript
import { useAnalytics } from '~/features/analytics';

function MyComponent() {
  const { track } = useAnalytics();
  
  const handleAction = () => {
    // Note: track() is synchronous in PostHog v3
    track('custom_event', {
      property1: 'value',
      property2: 123
    });
  };
}
```

### Screen Tracking
```typescript
import { useScreenTracking } from '~/features/analytics';

function MyScreen() {
  // Automatic screen tracking
  useScreenTracking('my_screen', {
    tab: 'main',
    source: 'navigation'
  });
}
```

### Error Tracking
```typescript
import { trackError } from '~/features/analytics';

try {
  // Some operation
} catch (error) {
  trackError(track, error, {
    screen: 'memo_detail',
    action: 'load_data',
    memo_id: id
  });
}
```

### Performance Tracking
```typescript
import { trackPerformance } from '~/features/analytics';

const startTime = Date.now();
// ... operation ...
trackPerformance(track, 'operation_name', Date.now() - startTime, {
  additional_context: 'value'
});
```

### Feature Flags (Mobile Only)
```typescript
import { useFeatureFlag } from '~/features/analytics';

function MyComponent() {
  const showNewFeature = useFeatureFlag('new-feature-flag');
  
  if (showNewFeature) {
    return <NewFeature />;
  }
  return <OldFeature />;
}
```

## PostHog Dashboard Setup

### Recommended Dashboards

#### 1. User Journey Funnel
Create a funnel visualization:
1. `recording_started`
2. `recording_stopped`
3. `memo_viewed`
4. `memo_shared`

#### 2. Feature Adoption
Track usage of key features:
- Blueprint usage (non-standard selections)
- AI features (questions, reprocessing, translation)
- Collaboration (space usage, sharing)

#### 3. Error Monitoring
- Group `recording_failed` by `error_type`
- Track `error_occurred` by screen and action
- Monitor permission denial rates

#### 4. Performance Metrics
- `memo_load_time` percentiles (P50, P95, P99)
- Track by device type and network conditions

#### 5. Engagement Metrics
- Daily/Weekly/Monthly Active Users
- Session duration
- Actions per session
- Retention cohorts

### Key Metrics to Monitor

1. **Recording Success Rate**
   - `recording_stopped` / `recording_started`
   - Identify drop-off points

2. **AI Feature Usage**
   - Questions per user
   - Blueprint adoption rate
   - Mana consumption patterns

3. **User Retention**
   - Day 1, 7, 30 retention
   - Feature-specific retention

4. **Error Rate**
   - Errors per user
   - Error types distribution
   - Recovery success rate

## Privacy & Compliance

### Data Collected
- No PII in event properties by default
- User IDs are anonymized
- Device info for debugging
- Usage patterns and feature adoption

### GDPR Compliance
- PostHog hosted in EU (eu.i.posthog.com)
- User consent required before tracking
- Option to opt-out in settings
- Data retention policies applied

## Testing Analytics

### Development Testing
1. Enable debug mode: Events logged to console
2. Use PostHog Live Events view for real-time monitoring
3. Test event in dev settings: `/app/(protected)/settings.tsx`
4. PostHog v3: Methods are synchronous, no need for await

### Production Validation
1. Check PostHog dashboard for event flow
2. Verify event properties are correct
3. Monitor for any tracking errors
4. Validate funnel completion rates

## Troubleshooting

### Events Not Appearing
1. Check API key configuration
2. Verify PostHog instance is created successfully
3. Check network connectivity
4. Look for console errors
5. Ensure `flush()` is called in dev (synchronous)

### PostHog v3 Specific Issues
- **`initAsync is not a function`**: PostHog v3 doesn't have `initAsync()`. Initialization happens in the constructor.
- **Async methods**: All PostHog v3 methods are synchronous. Don't use `await`.
- **TypeScript errors**: Ensure types match synchronous signatures (return `void` not `Promise<void>`)

### Missing Properties
1. Verify property names match schema
2. Check for undefined values
3. Ensure proper async/await usage

### Performance Issues
1. Batch events when possible
2. Use sampling for high-frequency events
3. Optimize property payload size

## Future Enhancements

### Planned Additions
- [ ] Session replay integration
- [ ] Heatmaps for UI interactions
- [ ] Custom user properties
- [ ] Revenue tracking
- [ ] A/B testing framework
- [ ] Crash reporting integration
- [ ] Network performance tracking
- [ ] Battery usage monitoring

### Potential Events
- Audio playback events (play, pause, seek)
- Memory creation/edit events
- Tag management events
- Space collaboration events
- Network status changes
- App background/foreground transitions

## Contact & Support

For analytics questions or to request new events:
- Create an issue in the repository
- Contact the development team
- Check PostHog documentation: https://posthog.com/docs

## Technical Implementation Details

### PostHog v3 React Native SDK

#### Initialization
```typescript
// PostHog v3 - Initialization happens in constructor
this.posthog = new PostHog(apiKey, {
  host: 'https://eu.i.posthog.com',
  debug: __DEV__,
  captureApplicationLifecycleEvents: true,
  captureDeepLinks: true,
  recordScreenViews: true,
  flushInterval: 30,
  flushAt: 20,
  maxQueueSize: 1000,
  disableAutoCapture: false,
  enableLogs: __DEV__,
});
// No initAsync() needed - ready to use immediately
```

#### Method Signatures (Synchronous)
```typescript
// All methods are synchronous in v3
posthog.identify(userId: string, properties?: object): void
posthog.capture(event: string, properties?: object): void
posthog.screen(name: string, properties?: object): void
posthog.reset(): void
posthog.flush(): void
```

#### Common Pitfalls
- ❌ Don't use `await posthog.initAsync()` - doesn't exist
- ❌ Don't use `await posthog.capture()` - synchronous
- ✅ Do use `posthog.flush()` in dev for immediate sending
- ✅ Do handle errors with try-catch around constructor

### Service Architecture

```typescript
// analyticsService.ts
class PostHogAnalyticsService implements AnalyticsService {
  private posthog: any = null;
  private initialized = false;

  async initialize() {
    // Create instance (initialization happens here)
    this.posthog = new PostHog(key, options);
    this.initialized = true;
    
    // Test event with small delay
    setTimeout(() => {
      this.posthog.capture('posthog_initialized', {...});
    }, 100);
  }

  // All methods are synchronous wrappers
  track(event: string, properties?: object): void {
    if (!this.initialized) return;
    this.posthog.capture(event, properties);
    if (__DEV__) this.posthog.flush();
  }
}
```

---

*Last updated: 2025-01-09*
*Version: 1.1.0*
*PostHog SDK: v3.x*