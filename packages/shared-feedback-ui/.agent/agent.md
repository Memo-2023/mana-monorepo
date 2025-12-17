# Agent: Feedback UI Package

## Module Information

**Package Name:** `@manacore/shared-feedback-ui`
**Version:** 1.0.0
**Type:** Svelte 5 component library
**Purpose:** Provides reusable Svelte 5 components for feedback collection, display, and voting across all web apps

## Identity

I am the Feedback UI Agent, responsible for maintaining a consistent, polished user interface for feedback functionality across the Manacore monorepo. I provide ready-to-use Svelte 5 components using runes syntax, with scoped styling and full internationalization support.

## Expertise

- Svelte 5 runes mode ($state, $props, $effect, $derived)
- Component-driven architecture
- Scoped CSS styling with CSS custom properties
- Form validation and submission handling
- Real-time voting interactions with animations
- Tab-based navigation (my feedback vs. community)
- Loading states and error handling
- German localization with customizable labels
- Accessibility (ARIA labels, semantic HTML)

## Code Structure

```
src/
├── index.ts              # Main entry point, exports all components
├── FeedbackPage.svelte   # Full-page feedback UI with tabs
├── FeedbackForm.svelte   # Feedback submission form
├── FeedbackList.svelte   # List container for feedback items
├── FeedbackCard.svelte   # Individual feedback item display
├── VoteButton.svelte     # Upvote button with counter
└── StatusBadge.svelte    # Status indicator badge
```

### Components

#### FeedbackPage.svelte (Container)
**Purpose:** Complete feedback page with form, tabs, and lists

**Props:**
- `feedbackService`: Pre-configured service instance (required)
- `appName`: App name for page title (required)
- `currentUserId`: For highlighting user's own feedback
- `pageTitle`, `pageSubtitle`: Customizable headings
- `myFeedbackLabel`, `communityLabel`: Tab labels
- `myFeedbackEmptyMessage`, `communityEmptyMessage`: Empty state text

**Features:**
- Two tabs: "Community" and "My Feedback"
- Collapsible feedback form
- Auto-loads data on mount via `$effect`
- Success message toast
- Loading spinner
- Vote handling with optimistic updates

#### FeedbackForm.svelte
**Purpose:** Form for submitting new feedback

**Props:**
- `onSubmit`: Callback with `CreateFeedbackInput`
- `onCancel`: Optional cancel callback
- `isSubmitting`: Loading state
- `feedbackLabel`, `submitLabel`, `cancelLabel`: Custom labels
- `feedbackPlaceholder`: Textarea placeholder

**Features:**
- Textarea with character counter (max 2000)
- Minimum length validation (10 characters)
- Error display
- Disabled state during submission
- Auto-reset on success

#### FeedbackList.svelte
**Purpose:** Renders list of feedback items

**Props:**
- `items`: Array of Feedback objects
- `currentUserId`: For owner highlighting
- `onVote`: Vote toggle callback
- `votingDisabled`: Disable voting (e.g., on "My Feedback" tab)
- `emptyMessage`: No items text

**Features:**
- Empty state with icon
- Maps to FeedbackCard components
- Passes through vote handler
- Highlights user's own feedback

#### FeedbackCard.svelte
**Purpose:** Individual feedback item display

**Props:**
- `feedback`: Feedback object
- `onVote`: Vote callback
- `showStatus`: Show/hide status badge
- `isOwner`: Highlight as user's feedback
- `votingDisabled`: Disable vote button

**Features:**
- Vote button with count
- Title and text display
- Status badge
- Admin response section
- Owner badge
- Formatted date (German locale)
- Hover effect with shadow

#### VoteButton.svelte
**Purpose:** Upvote button with counter and animation

**Props:**
- `count`: Vote count
- `hasVoted`: Current vote state
- `onToggle`: Click handler
- `disabled`: Disabled state

**Features:**
- Upward arrow icon
- Vote count display
- Active/inactive states
- Click animation (scale effect)
- Color changes on vote
- ARIA labels for accessibility

#### StatusBadge.svelte
**Purpose:** Status indicator with color coding

**Props:**
- `status`: FeedbackStatus value
- `size`: 'sm' | 'md' | 'lg'

**Features:**
- Color-coded badges
- Icon support (requires icon implementation)
- German labels from `FEEDBACK_STATUS_CONFIG`
- Responsive sizing

## Key Patterns

### Svelte 5 Runes
```svelte
<script lang="ts">
  // Props with type safety
  let { feedbackService, appName }: Props = $props();

  // Reactive state
  let activeTab = $state<'my' | 'community'>('community');
  let myFeedback = $state<Feedback[]>([]);

  // Effects for side effects
  $effect(() => {
    loadFeedback();
  });
</script>
```

### Component Composition
```svelte
<FeedbackPage {feedbackService} appName="Chat">
  └── <FeedbackForm onSubmit={handleSubmit} />
  └── <FeedbackList items={...}>
      └── <FeedbackCard feedback={...}>
          ├── <VoteButton />
          └── <StatusBadge />
```

### Styling Strategy
- BEM naming convention: `.component__element--modifier`
- CSS custom properties for theming: `hsl(var(--color-primary))`
- Scoped styles per component
- No external CSS frameworks
- Consistent spacing scale (rem units)
- Mobile-first responsive design

### Error Handling
```svelte
try {
  await action();
} catch (error) {
  console.error('[ComponentName] Error:', error);
  // Don't throw, gracefully degrade
}
```

### Event Handling
- Use `onclick={handler}` not `on:click` (Svelte 5)
- Async handlers with loading states
- Optimistic UI updates
- Error recovery without full page reload

## Integration Points

### Dependencies
- `@manacore/shared-feedback-types` - Type definitions
- `@manacore/shared-feedback-service` - Service client
- `svelte` ^5.0.0 (peer dependency)

### Consumed By
- Web apps (SvelteKit) - Import and use directly
- Any Svelte 5 application in monorepo

### CSS Custom Properties (Theme Integration)
Components expect these CSS variables:
```css
--color-surface
--color-foreground
--color-background
--color-border
--color-muted
--color-muted-foreground
--color-primary
--color-primary-foreground
--color-success
--color-error
--color-input
```

### Service Integration
```typescript
import { feedbackService } from '$lib/services/feedback';
import { FeedbackPage } from '@manacore/shared-feedback-ui';

<FeedbackPage
  {feedbackService}
  appName="My App"
  currentUserId={$authStore.userId}
/>
```

## How to Use

### Installing in a Web App
```bash
# Already available in monorepo workspace
# Just import and use
```

### Full Page Implementation
```svelte
<script lang="ts">
  import { FeedbackPage } from '@manacore/shared-feedback-ui';
  import { feedbackService } from '$lib/services/feedback';
  import { authStore } from '$lib/stores/auth.svelte';
</script>

<FeedbackPage
  {feedbackService}
  appName="Chat App"
  currentUserId={authStore.userId}
  pageTitle="Feedback & Vorschläge"
  pageSubtitle="Hilf uns, die App zu verbessern"
/>
```

### Individual Component Usage
```svelte
<script lang="ts">
  import { FeedbackForm } from '@manacore/shared-feedback-ui';

  async function handleSubmit(input) {
    await feedbackService.createFeedback(input);
  }
</script>

<FeedbackForm
  onSubmit={handleSubmit}
  feedbackPlaceholder="Was können wir verbessern?"
/>
```

### Custom Styling
```svelte
<div class="custom-container">
  <FeedbackPage {feedbackService} appName="App" />
</div>

<style>
  .custom-container {
    /* Override CSS custom properties */
    --color-primary: 210 100% 50%;
    --color-surface: 0 0% 100%;
  }
</style>
```

### Standalone Components
```svelte
<script lang="ts">
  import { FeedbackCard, VoteButton } from '@manacore/shared-feedback-ui';

  let feedback = $state<Feedback>({...});

  function handleVote(id: string, voted: boolean) {
    // Custom vote logic
  }
</script>

<FeedbackCard
  {feedback}
  onVote={handleVote}
  isOwner={feedback.userId === currentUserId}
/>
```

### Customizing Labels (i18n)
```svelte
<FeedbackPage
  {feedbackService}
  appName="App"
  pageTitle="Feedback & Suggestions"
  pageSubtitle="Help us improve"
  myFeedbackLabel="My Feedback"
  communityLabel="Community"
  myFeedbackEmptyMessage="You haven't submitted any feedback yet"
  communityEmptyMessage="No community feedback yet"
/>
```

### Form-Only Integration
```svelte
<script lang="ts">
  import { FeedbackForm } from '@manacore/shared-feedback-ui';

  let showForm = $state(false);

  async function handleSubmit(input) {
    await feedbackService.createFeedback(input);
    showForm = false;
  }
</script>

{#if showForm}
  <FeedbackForm
    onSubmit={handleSubmit}
    onCancel={() => showForm = false}
  />
{/if}
```

## Best Practices

### Component Usage
- Use `FeedbackPage` for full-featured implementation
- Use individual components for custom layouts
- Always pass `feedbackService` instance, never create inside component
- Provide `currentUserId` for proper owner highlighting

### State Management
- Components are stateless where possible
- Parent manages data, passes via props
- Components emit events via callbacks
- No internal service calls in child components (except FeedbackPage)

### Error Handling
- Catch errors in async handlers
- Log to console with component name prefix
- Show user-friendly error messages
- Don't crash on API failures

### Performance
- Use `$effect` for data loading
- Avoid unnecessary re-renders
- Debounce user input if needed
- Optimize list rendering for large datasets

### Accessibility
- Use semantic HTML (button, form, etc.)
- Provide ARIA labels on interactive elements
- Ensure keyboard navigation works
- Maintain focus management

### Styling
- Don't override component internals
- Use CSS custom properties for theming
- Maintain BEM naming convention
- Keep styles scoped to component

### Testing
- Test components in isolation
- Mock `feedbackService` in tests
- Test loading/error/success states
- Verify event emission

## Common Gotchas

### Svelte 5 Syntax
- Use `$state`, not `let` with `$:` reactive declarations
- Use `$props()`, not `export let`
- Use `onclick={handler}`, not `on:click={handler}`
- Use `$effect`, not `onMount` for side effects

### Service Integration
- Create service ONCE at app level, pass down
- Don't create service per component instance
- Service must be configured before component mounts
- Authentication errors handled by service, not component

### CSS Custom Properties
- Components require theme variables to be defined
- Default fallback values provided in HSL format
- Can override at any parent level
- Use HSL format: `hsl(var(--color-primary))`

### Vote State Management
- `userHasVoted` is per-request, updated from server
- Optimistic updates happen in parent (FeedbackPage)
- VoteButton is presentational, doesn't manage state
- Vote count updated after server confirmation

### Form Validation
- Minimum 10 characters enforced
- Maximum 2000 characters enforced
- Client-side validation only, backend must validate
- Form resets on successful submission

### Tab State
- Tab state managed in FeedbackPage
- Switching tabs doesn't reload data
- Data loaded once on mount
- Manual refresh needed for updates

### Date Formatting
- Uses German locale by default
- Format: DD.MM.YYYY
- Can be customized by overriding `formatDate` function
- Dates are ISO strings from API

### Empty States
- Customizable empty messages per tab
- Icon SVG embedded in component
- Center-aligned with padding
- Shows when `items.length === 0`
