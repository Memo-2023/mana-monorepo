# Automatic App Rating Feature

## Overview

The automatic app rating feature prompts users to rate the Memoro app in the App Store/Play Store after reaching specific engagement milestones. This system is designed to maximize positive ratings by requesting feedback at optimal moments—right after users have experienced success with the app.

## Architecture

### Components

```
features/rating/
├── components/
│   └── RatingPromptModal.tsx       # Modal UI component
├── hooks/
│   ├── useRating.ts                # Existing: Manual rating trigger
│   └── useRatingPrompt.ts          # New: Automatic prompt logic
├── services/
│   └── ratingService.ts            # Existing: expo-store-review wrapper
├── store/
│   └── ratingStore.ts              # Zustand store with persistence
└── index.ts                         # Public API exports
```

### Key Features

- ✅ **Milestone-based prompts** (5, 15, 50 memos)
- ✅ **Rate limiting** (minimum 30 days between prompts)
- ✅ **User preferences** (never ask again option)
- ✅ **Analytics tracking** (all user interactions)
- ✅ **Persistent state** (survives app restarts)
- ✅ **Multi-language support** (i18n ready)
- ✅ **Theme-aware UI** (dark/light mode)

---

## Implementation Details

### 1. Rating Store (`ratingStore.ts`)

**Purpose**: Centralized state management with automatic persistence.

**State:**
```typescript
interface RatingState {
  hasRatedApp: boolean;           // User completed rating
  hasDeclinedRating: boolean;     // User selected "Maybe Later"
  neverAskAgain: boolean;         // User selected "Don't Ask Again"
  memoCreatedCount: number;       // Total memos created
  lastPromptDate: string | null;  // Last time prompt was shown
  _hasHydrated: boolean;          // Store rehydration status
}
```

**Actions:**
- `incrementMemoCount()` - Called after each memo creation
- `markRated()` - User completed rating
- `markDeclined()` - User deferred rating
- `markNeverAsk()` - User opted out permanently
- `resetForTesting()` - Development helper

**Persistence:**
Uses Zustand's `persist` middleware with AsyncStorage backend. Data is automatically saved on every state change and restored on app launch.

**Storage Key:** `memoro-rating`

---

### 2. Rating Prompt Hook (`useRatingPrompt.ts`)

**Purpose**: Contains eligibility logic and modal trigger management.

**Configuration Constants:**
```typescript
const RATING_MILESTONES = [5, 15, 50];      // Memo counts to trigger
const MIN_DAYS_BETWEEN_PROMPTS = 30;        // Cooldown period
```

**Eligibility Criteria:**

A prompt is shown when ALL conditions are met:
1. ✅ Store has hydrated (data loaded from AsyncStorage)
2. ✅ User hasn't rated yet (`hasRatedApp === false`)
3. ✅ User hasn't opted out (`neverAskAgain === false`)
4. ✅ Current memo count matches a milestone (5, 15, or 50)
5. ✅ At least 30 days since last prompt (or first time)

**API:**
```typescript
const {
  showPromptModal,      // Boolean: Should modal be visible?
  triggerPromptCheck,   // Function: Check eligibility & show modal
  closePrompt,          // Function: Close the modal
  isEligible,           // Boolean: Is user currently eligible?
  currentMemoCount,     // Number: Current memo count
} = useRatingPrompt();
```

---

### 3. Rating Prompt Modal (`RatingPromptModal.tsx`)

**Purpose**: User-facing dialog that requests the rating.

**UI Structure:**
```
┌─────────────────────────────────┐
│   Gefällt dir Memoro? (Title)   │
│                                  │
│   Du hast bereits X Memos        │
│   erstellt! 🎉 (Milestone)      │
│                                  │
│   Es würde uns sehr freuen...   │
│   (Description)                  │
│                                  │
│   [Jetzt bewerten]   (Primary)  │
│   [Vielleicht später] (Second)  │
│   [Nicht mehr fragen] (Text)    │
└─────────────────────────────────┘
```

**Button Actions:**

1. **"Jetzt bewerten" (Rate Now)**
   - Calls `ratingService.requestReview()`
   - Opens native App Store review dialog
   - Marks as rated: `markRated()`
   - Tracks: `rating_accepted`

2. **"Vielleicht später" (Maybe Later)**
   - Defers prompt for 30+ days
   - Marks as declined: `markDeclined()`
   - Tracks: `rating_declined`

3. **"Nicht mehr fragen" (Don't Ask Again)**
   - Permanently suppresses prompts
   - Marks: `markNeverAsk()`
   - Tracks: `rating_never_ask`

**Props:**
```typescript
interface RatingPromptModalProps {
  isVisible: boolean;   // Modal visibility state
  onClose: () => void;  // Close handler
}
```

---

### 4. Integration Points

#### A. Counter Increment (`app/(protected)/(tabs)/index.tsx`)

**Location:** Line 846-848

**Trigger:** When a new memo is detected (different from previous memo ID)

```typescript
if (isNewMemo && !isFirstLoad) {
  // ... animation code ...

  // Increment rating counter for new memos
  incrementMemoCount();
}
```

**Why here?** This ensures we count user-created memos only (not initial loads or updates).

#### B. Global Modal Rendering (`app/(protected)/_layout.tsx`)

**Location:** Line 159

**Rendered alongside other global modals:**
```typescript
{/* Global Rating Prompt Modal */}
<RatingPromptModal
  isVisible={showPromptModal}
  onClose={closePrompt}
/>
```

#### C. Automatic Prompt Check (`app/(protected)/_layout.tsx`)

**Location:** Lines 76-87

**Trigger:** When user navigates to home page

```typescript
useEffect(() => {
  const isHomePage = pathname === '/' || pathname.endsWith('/index');
  if (isHomePage) {
    const timer = setTimeout(() => {
      triggerPromptCheck();
    }, 2000); // 2 second delay after landing on home page

    return () => clearTimeout(timer);
  }
}, [pathname, triggerPromptCheck]);
```

**Why 2 seconds?**
- Gives time for memo creation to complete
- Allows store to hydrate and update
- Prevents immediate popup (better UX)

---

## Analytics Events

All rating interactions are tracked in PostHog:

### Event: `rating_prompt_shown`
```typescript
{
  memo_count: number,        // Current memo count
  milestone: 5 | 15 | 50,   // Which milestone triggered
}
```

### Event: `rating_accepted`
```typescript
{
  memo_count: number,
  source: 'automatic_prompt', // vs 'settings' for manual
}
```

### Event: `rating_declined`
```typescript
{
  memo_count: number,
  action: 'maybe_later',
}
```

### Event: `rating_never_ask`
```typescript
{
  memo_count: number,
  action: 'never_ask',
}
```

**Analytics Configuration:** `features/analytics/events.ts` (Lines 66-72)

---

## Translation Keys

### German (`de.json`)

```json
{
  "rating": {
    "prompt_title": "Gefällt dir Memoro?",
    "prompt_milestone": "Du hast bereits {{count}} Memos erstellt! 🎉",
    "prompt_message": "Es würde uns sehr freuen, wenn du Memoro im App Store bewerten würdest. Deine Unterstützung hilft uns, die App weiter zu verbessern.",
    "rate_now": "Jetzt bewerten",
    "maybe_later": "Vielleicht später",
    "never_ask": "Nicht mehr fragen"
  }
}
```

### English (`en.json`)

```json
{
  "rating": {
    "prompt_title": "Enjoying Memoro?",
    "prompt_milestone": "You've created {{count}} memos already! 🎉",
    "prompt_message": "We would really appreciate it if you could rate Memoro in the App Store. Your support helps us continue improving the app.",
    "rate_now": "Rate Now",
    "maybe_later": "Maybe Later",
    "never_ask": "Don't Ask Again"
  }
}
```

**Note:** The `{{count}}` placeholder is dynamically replaced with the actual memo count.

---

## User Flow

### Happy Path (First Time - 5 Memos)

```
1. User creates 5th memo
   ↓
2. Counter increments to 5
   ↓
3. User navigates to home screen
   ↓
4. After 2s delay, eligibility check runs
   ↓
5. ✅ All conditions met → Modal appears
   ↓
6. User taps "Jetzt bewerten"
   ↓
7. Native App Store review opens
   ↓
8. State: hasRatedApp = true
   ↓
9. ✅ Never shown again (unless reset)
```

### Deferred Path (15 Memos)

```
1. User previously declined at 5 memos
   ↓
2. User creates 15th memo (>30 days later)
   ↓
3. Counter increments to 15
   ↓
4. User navigates to home screen
   ↓
5. After 2s delay, eligibility check runs
   ↓
6. ✅ All conditions met → Modal appears
   ↓
7. User taps "Vielleicht später"
   ↓
8. State: hasDeclinedRating = true
   ↓
9. lastPromptDate = now
   ↓
10. ⏳ Won't show again for 30+ days
```

### Opt-Out Path

```
1. User sees prompt at any milestone
   ↓
2. User taps "Nicht mehr fragen"
   ↓
3. State: neverAskAgain = true
   ↓
4. ❌ Never shown again (permanent)
```

---

## Configuration

### Adjusting Milestones

**File:** `features/rating/hooks/useRatingPrompt.ts` (Line 8)

```typescript
// Change these values to adjust when prompts appear
const RATING_MILESTONES = [5, 15, 50];
```

**Examples:**
- More aggressive: `[3, 10, 30]`
- Less aggressive: `[10, 25, 100]`
- More frequent: `[5, 10, 20, 50, 100]`

### Adjusting Cooldown Period

**File:** `features/rating/hooks/useRatingPrompt.ts` (Line 11)

```typescript
// Days between prompts
const MIN_DAYS_BETWEEN_PROMPTS = 30;
```

**Examples:**
- More frequent: `14` (2 weeks)
- Less frequent: `60` (2 months)
- No cooldown: `0` (not recommended)

---

## Testing

### Manual Testing

1. **Test Counter Increment:**
   ```typescript
   // In React DevTools or console
   import { useRatingStore } from '~/features/rating';

   console.log(useRatingStore.getState().memoCreatedCount);
   ```

2. **Force Prompt Display:**
   ```typescript
   // Set count to milestone
   useRatingStore.getState().incrementMemoCount(); // Repeat 5x

   // Navigate to home screen and wait 2s
   ```

3. **Reset for Testing:**
   ```typescript
   // Reset all rating state
   useRatingStore.getState().resetForTesting();
   ```

### Testing Scenarios

| Scenario | Setup | Expected Result |
|----------|-------|-----------------|
| First milestone | Count = 4 → 5 | Modal appears after 2s on home |
| Already rated | hasRatedApp = true | No modal, ever |
| Opted out | neverAskAgain = true | No modal, ever |
| Too soon | lastPromptDate = yesterday | No modal (needs 30 days) |
| Between milestones | Count = 12 | No modal (not milestone) |
| Second milestone | Count = 14 → 15, 30+ days | Modal appears |

### Developer Tools

**Check Current State:**
```typescript
import { useRatingStore } from '~/features/rating';

const state = useRatingStore.getState();
console.log({
  count: state.memoCreatedCount,
  hasRated: state.hasRatedApp,
  neverAsk: state.neverAskAgain,
  lastPrompt: state.lastPromptDate,
});
```

**Simulate Different Counts:**
```typescript
// Jump to milestone
const store = useRatingStore.getState();
store.memoCreatedCount = 15;
```

**Clear AsyncStorage:**
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

await AsyncStorage.removeItem('memoro-rating');
// Then restart app to trigger fresh state
```

---

## Platform-Specific Behavior

### iOS

Uses `SKStoreReviewController`:
- Native iOS rating dialog
- Can only be triggered 3x per year per app version
- User can disable in iOS Settings → App Store → In-App Ratings & Reviews
- If disabled, nothing happens (silent failure)

**Store URL Fallback:**
```typescript
// In ratingService.ts (Line 49)
const appStoreId = '1234567890'; // TODO: Add actual App Store ID
```

### Android

Uses Google Play In-App Review API:
- Native Material Design dialog
- No rate limiting like iOS
- More reliable display
- Requires Google Play Services

**Store URL Fallback:**
```typescript
// In ratingService.ts (Line 53)
const packageName = 'com.memoro.app'; // Verify this is correct
```

---

## Edge Cases & Considerations

### 1. App Updates
- Counter persists across app updates
- User won't be re-prompted if already rated
- New milestones can be added without resetting user state

### 2. Multiple Devices
- State is local to each device
- User may see prompts on multiple devices
- This is intentional (each device = separate usage pattern)

### 3. Network Independence
- Feature works completely offline
- Only the actual rating submission requires network

### 4. Store Availability
- If `StoreReview.isAvailableAsync()` returns false:
  - Fallback alert with link to store
  - Implemented in existing `useRating.ts` hook

### 5. Time Zone Changes
- Date comparisons use ISO 8601 strings
- Time zone changes won't affect cooldown logic

### 6. First App Launch
- Store hydrates with default values
- Counter starts at 0
- First prompt at 5th memo creation

---

## Performance Considerations

### Memory
- Store state: ~200 bytes in memory
- AsyncStorage: ~200 bytes on disk
- Negligible impact

### CPU
- Eligibility check: O(1) operation
- Runs once every home page navigation
- 2-second debounce prevents excessive checks

### Network
- Zero network calls for eligibility checks
- Only network usage is the actual store review

---

## Future Enhancements

### Potential Improvements

1. **Sentiment Detection**
   - Only prompt after successful transcriptions
   - Skip prompt if recent errors occurred
   - Use AI sentiment analysis on memo content

2. **A/B Testing**
   - Test different milestone values
   - Test different message wording
   - Track conversion rates

3. **Personalization**
   - Different milestones for power users
   - Custom messages based on usage patterns
   - Space-specific prompts

4. **Cross-Platform Sync**
   - Sync rating state across devices
   - Avoid duplicate prompts
   - Requires backend integration

5. **Pre-Prompt Survey**
   - Ask "Are you enjoying Memoro?" first
   - Only show rating if positive response
   - Capture negative feedback separately

---

## Troubleshooting

### Problem: Modal never appears

**Check:**
1. Verify memo count: `useRatingStore.getState().memoCreatedCount`
2. Check if user opted out: `useRatingStore.getState().neverAskAgain`
3. Check if already rated: `useRatingStore.getState().hasRatedApp`
4. Verify store hydrated: `useRatingStore.getState()._hasHydrated`
5. Check last prompt date: `useRatingStore.getState().lastPromptDate`

**Solution:**
```typescript
// Reset and test
useRatingStore.getState().resetForTesting();
// Create 5 memos and navigate to home
```

### Problem: Modal appears too often

**Check:**
- Milestone configuration might be too aggressive
- Cooldown period might be too short

**Solution:**
```typescript
// In useRatingPrompt.ts
const RATING_MILESTONES = [10, 25, 100];  // Less frequent
const MIN_DAYS_BETWEEN_PROMPTS = 60;       // Longer cooldown
```

### Problem: Analytics not tracking

**Check:**
1. Verify analytics enabled: Settings → Analytics
2. Check PostHog integration
3. Look for events in PostHog dashboard

**Debug:**
```typescript
// Add console logging in RatingPromptModal.tsx
console.log('Rating event tracked:', eventName, properties);
```

### Problem: Store persists between sessions

**Expected Behavior:** This is intentional for production.

**For Development:**
```typescript
// Clear on every app launch (development only)
useEffect(() => {
  if (__DEV__) {
    useRatingStore.getState().resetForTesting();
  }
}, []);
```

---

## Related Files

### Core Implementation
- `features/rating/store/ratingStore.ts` - State management
- `features/rating/hooks/useRatingPrompt.ts` - Logic
- `features/rating/components/RatingPromptModal.tsx` - UI
- `features/rating/index.ts` - Public API

### Integration Points
- `app/(protected)/(tabs)/index.tsx` - Counter increment
- `app/(protected)/_layout.tsx` - Global modal & trigger

### Configuration
- `features/analytics/events.ts` - Event definitions
- `features/i18n/translations/de.json` - German text
- `features/i18n/translations/en.json` - English text

### Existing Dependencies
- `features/rating/services/ratingService.ts` - Store review wrapper
- `features/rating/hooks/useRating.ts` - Manual rating trigger
- `components/atoms/BaseModal.tsx` - Modal component
- `components/atoms/Button.tsx` - Button component

---

## Changelog

### Version 1.0.0 (2025-01-30)
- ✨ Initial implementation
- ✅ Milestone-based prompts (5, 15, 50 memos)
- ✅ 30-day cooldown period
- ✅ Persistent state with AsyncStorage
- ✅ Analytics tracking
- ✅ Multi-language support (DE, EN)
- ✅ Theme-aware UI

---

## Maintenance

### Regular Checks
- [ ] Monitor analytics conversion rates monthly
- [ ] Review milestone effectiveness quarterly
- [ ] Update translations as needed
- [ ] Test on new iOS/Android versions

### When to Update
1. **App Store ID changes** (iOS)
   - Update in `ratingService.ts` line 49
2. **Package name changes** (Android)
   - Update in `ratingService.ts` line 53
3. **New languages added**
   - Add translations in `features/i18n/translations/`
4. **Milestone strategy changes**
   - Update in `useRatingPrompt.ts` line 8

---

## Contact

For questions or issues related to this feature:
- Check existing issues in GitHub
- Review analytics in PostHog dashboard
- Contact development team

---

**Last Updated:** 2025-01-30
**Author:** Claude Code
**Version:** 1.0.0
