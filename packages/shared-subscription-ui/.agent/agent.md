# Shared Subscription UI Agent

## Module Information

**Package**: `@manacore/shared-subscription-ui`
**Version**: 1.0.0
**Type**: Svelte 5 Component Library
**Purpose**: Reusable Svelte 5 UI components for displaying subscription plans, mana packages, usage statistics, and billing controls across SvelteKit apps in the ManaCore monorepo.

## Identity

I am the Subscription UI Specialist, providing beautiful, accessible, and consistent subscription interface components built with Svelte 5 runes. I handle plan displays, billing toggles, usage cards, and subscription buttons for all SvelteKit applications.

## Expertise

- **Svelte 5 Runes**: Modern reactive state with `$state`, `$derived`, `$effect`
- **Subscription Cards**: Tiered plan displays with visual hierarchy
- **Package Cards**: One-time mana purchase UI components
- **Usage Visualization**: Credit consumption and balance displays
- **Billing Controls**: Monthly/yearly toggle with discount badges
- **Responsive Design**: Mobile-first layouts with CSS Grid
- **Dark Mode**: Full dark mode support via CSS variables
- **i18n Ready**: Internationalization support via props
- **Glassmorphism**: Modern backdrop-filter UI styling

## Code Structure

```
src/
├── index.ts                      # Barrel exports
├── pages/
│   └── SubscriptionPage.svelte   # Full subscription page layout
├── components/ (root level)
│   ├── SubscriptionCard.svelte   # Individual plan card
│   ├── PackageCard.svelte        # One-time package card
│   ├── BillingToggle.svelte      # Monthly/yearly switcher
│   ├── UsageCard.svelte          # Credit usage display
│   ├── CostCard.svelte           # Operation cost breakdown
│   ├── SubscriptionButton.svelte # CTA button component
│   └── ManaIcon.svelte           # Mana gem icon
└── data/
    ├── subscriptionData.json     # Default plan data
    ├── appCosts.json             # Default cost data
    └── defaultUsageData.json     # Default usage data
```

## Key Components

### 1. SubscriptionCard.svelte
Displays individual subscription plan with tier styling.

**Props**:
```typescript
interface Props {
  plan: SubscriptionPlan;           // Plan data
  onSelect: (planId: string) => void; // Selection callback
  isCurrentPlan?: boolean;          // Highlight as active
  isLegacy?: boolean;               // Show legacy badge
  // i18n labels (all optional with defaults)
  currentPlanLabel?: string;
  legacyPlanLabel?: string;
  popularLabel?: string;
  perMonthLabel?: string;
  perYearLabel?: string;
  monthlyEquivalentLabel?: string;
  buyLabel?: string;
}
```

**Features**:
- Tier-specific background colors and icon sizes (free/small/medium/large/giant)
- Three-column grid layout (icon, mana amount, price)
- Popular badge for recommended plans
- Current plan badge with disabled CTA
- Hover animations with transform and shadow
- Glassmorphism background with backdrop-filter
- Yearly plan shows monthly equivalent price

### 2. PackageCard.svelte
Displays one-time mana purchase packages.

**Props**:
```typescript
interface Props {
  package: ManaPackage;
  onSelect: (packageId: string) => void;
  // i18n labels
  buyLabel?: string;
  perLabel?: string;
}
```

**Features**:
- Similar styling to SubscriptionCard
- Displays mana amount and total price
- Popular badge support
- Responsive grid layout
- Team/enterprise package variants

### 3. BillingToggle.svelte
Toggle between monthly and yearly billing cycles.

**Props**:
```typescript
interface Props {
  billingCycle: BillingCycle;
  onChange: (cycle: BillingCycle) => void;
  yearlyDiscount?: string;      // e.g., "33%"
  monthlyLabel?: string;
  yearlyLabel?: string;
}
```

**Features**:
- Segmented control design
- Active state with glassmorphism
- Discount badge on yearly option
- Smooth transitions
- Dark mode support

### 4. UsageCard.svelte
Displays user's mana usage statistics.

**Props**:
```typescript
interface Props {
  usageData: UsageData;
  // i18n labels
  titleLabel?: string;
  totalLabel?: string;
  lastWeekLabel?: string;
  lastMonthLabel?: string;
  currentBalanceLabel?: string;
}
```

**Features**:
- Total, weekly, monthly consumption stats
- Current balance with progress bar
- Responsive stat grid
- Icon support for each metric

### 5. CostCard.svelte
Shows operation costs breakdown.

**Props**:
```typescript
interface Props {
  costs: CostItem[];
  // i18n labels
  titleLabel?: string;
  actionLabel?: string;
  costLabel?: string;
}
```

**Features**:
- Table layout with operation names and costs
- Icon display for each operation
- Supports dynamic cost lists
- Translation key support for i18n

### 6. SubscriptionButton.svelte
Primary CTA button for subscriptions.

**Props**:
```typescript
interface Props {
  label: string;
  onclick: () => void;
  iconName?: string;        // Ionicon name
  variant?: 'primary' | 'secondary' | 'accent';
  disabled?: boolean;
}
```

**Features**:
- Three visual variants
- Icon support (requires Ionicons)
- Disabled state styling
- Hover and active states
- Accessible button semantics

### 7. ManaIcon.svelte
Reusable mana gem icon component.

**Props**:
```typescript
interface Props {
  size?: number;     // Icon size in pixels
  color?: string;    // Fill color
}
```

**Features**:
- SVG-based gem icon
- Customizable size and color
- Used in subscription and package cards

### 8. SubscriptionPage.svelte (Full Page)
Complete subscription management page layout.

**Features**:
- Combines all components into cohesive layout
- Handles billing cycle toggling
- Plan filtering by billing cycle
- Responsive grid for cards
- Includes usage and cost sections

## Key Patterns

### Svelte 5 Runes Usage
All components use modern Svelte 5 runes syntax:

```svelte
<script lang="ts">
  // Props with destructuring
  let { plan, onSelect, isCurrentPlan = false }: Props = $props();

  // Reactive state
  let isHovered = $state(false);

  // Derived values
  const tierStyles = $derived(getTierStyles());

  // Effects (if needed)
  $effect(() => {
    console.log('Plan changed:', plan.id);
  });
</script>
```

### Glassmorphism Styling
Consistent glass effect across all cards:

```css
.card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

:global(.dark) .card {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
}
```

### CSS Variable Integration
Uses Tailwind/shadcn-style CSS variables:

```css
color: hsl(var(--foreground));
color: hsl(var(--muted-foreground));
background: hsl(var(--primary, 221 83% 53%));
```

### Responsive Design
Mobile-first with breakpoint at 640px:

```css
@media (min-width: 640px) {
  .card__title {
    font-size: 1.5rem; /* Larger on desktop */
  }
}
```

### Tier-Based Styling
Dynamic styles based on plan ID:

```typescript
function getTierStyles() {
  const id = plan.id.toLowerCase();
  if (id.includes('free')) return { bg: '#F5F5F5', icon: '#9E9E9E', bgSize: '30%' };
  if (id.includes('small')) return { bg: '#E3F2FD', icon: '#2196F3', bgSize: '45%' };
  if (id.includes('medium')) return { bg: '#BBDEFB', icon: '#1976D2', bgSize: '60%' };
  if (id.includes('large')) return { bg: '#90CAF9', icon: '#1565C0', bgSize: '75%' };
  if (id.includes('giant')) return { bg: '#64B5F6', icon: '#0D47A1', bgSize: '90%' };
  return { bg: '#E1F5FE', icon: '#0288D1', bgSize: '50%' };
}
```

## Integration Points

### Dependencies
- `@manacore/shared-subscription-types` - Type imports
- `svelte` (peer dependency) - Must be Svelte 5.0.0+

### Consumed By
- All SvelteKit web apps (chat, picture, zitare, contacts, etc.)
- Any app needing subscription UI

### Data Sources
- Default data exported from `src/data/` for demos/testing
- Apps should provide real data from API calls
- Supports both static and dynamic data

### i18n Integration
All labels are props with English defaults:

```svelte
<SubscriptionCard
  {plan}
  onSelect={handleSelect}
  currentPlanLabel={$t('subscription.currentPlan')}
  buyLabel={$t('subscription.buy')}
/>
```

## How to Use

### 1. Installation in SvelteKit App
Already installed via workspace dependencies. Import components:

```typescript
import {
  SubscriptionCard,
  PackageCard,
  BillingToggle,
  UsageCard,
  CostCard,
  SubscriptionButton,
  type SubscriptionPlan,
  type ManaPackage
} from '@manacore/shared-subscription-ui';
```

### 2. Basic Subscription Page
```svelte
<script lang="ts">
  import { SubscriptionCard, BillingToggle } from '@manacore/shared-subscription-ui';
  import type { BillingCycle, SubscriptionPlan } from '@manacore/shared-subscription-types';

  let plans = $state<SubscriptionPlan[]>([/* fetch from API */]);
  let billingCycle = $state<BillingCycle>('monthly');

  const filteredPlans = $derived(
    plans.filter(p => p.billingCycle === billingCycle)
  );

  function handlePlanSelect(planId: string) {
    // Navigate to checkout or open payment modal
  }
</script>

<BillingToggle
  {billingCycle}
  onChange={(cycle) => billingCycle = cycle}
/>

<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
  {#each filteredPlans as plan}
    <SubscriptionCard
      {plan}
      onSelect={handlePlanSelect}
      isCurrentPlan={plan.id === currentPlanId}
    />
  {/each}
</div>
```

### 3. Usage Display
```svelte
<script lang="ts">
  import { UsageCard } from '@manacore/shared-subscription-ui';
  import type { UsageData } from '@manacore/shared-subscription-types';

  let usage = $state<UsageData>({
    total: 1250,
    lastWeek: 120,
    lastMonth: 480,
    currentMana: 75,
    maxMana: 150
  });
</script>

<UsageCard
  usageData={usage}
  titleLabel="Your Usage"
  currentBalanceLabel="Current Balance"
/>
```

### 4. Operation Costs Display
```svelte
<script lang="ts">
  import { CostCard } from '@manacore/shared-subscription-ui';
  import type { CostItem } from '@manacore/shared-subscription-types';

  const costs: CostItem[] = [
    { action: 'Story Creation', cost: 10, icon: 'book-outline' },
    { action: 'Character Generation', cost: 20, icon: 'person-add-outline' },
    { action: 'Image Generation', cost: 15, icon: 'image-outline' }
  ];
</script>

<CostCard {costs} titleLabel="Operation Costs" />
```

### 5. Custom Button Usage
```svelte
<script lang="ts">
  import { SubscriptionButton } from '@manacore/shared-subscription-ui';
</script>

<SubscriptionButton
  label="Upgrade Now"
  onclick={() => console.log('Upgrade clicked')}
  iconName="arrow-forward-outline"
  variant="accent"
/>
```

## Best Practices

### Component Composition
- Use `SubscriptionCard` for individual plans
- Wrap multiple cards in CSS Grid for responsive layout
- Combine with `BillingToggle` for cycle switching
- Use `SubscriptionPage` for complete out-of-box solution

### Styling Customization
- Components use scoped styles (no style pollution)
- Override via CSS variables in parent app
- Add wrapper classes for layout control
- Use `class` prop for additional styling (if added)

### Data Management
- Fetch real plan data from backend
- Use default data exports for development/testing
- Keep plan data reactive with `$state` or stores
- Handle loading and error states in parent components

### Accessibility
- All buttons have proper ARIA labels
- Color contrast meets WCAG AA standards
- Focus states are visible
- Semantic HTML structure

### Performance
- Components are lightweight (minimal dependencies)
- CSS uses hardware-accelerated properties (transform, opacity)
- No heavy JavaScript calculations in render path
- Tier styles are derived once and cached

## Common Tasks

### 1. Adding New i18n Label
```svelte
<!-- In component -->
<script lang="ts">
  interface Props {
    // ... existing props
    newLabel?: string;
  }

  let { newLabel = 'Default Text' }: Props = $props();
</script>

<p>{newLabel}</p>
```

### 2. Creating Custom Tier Styling
```typescript
// Add new tier detection in getTierStyles()
function getTierStyles() {
  const id = plan.id.toLowerCase();
  // ... existing tiers
  if (id.includes('premium-plus')) {
    return { bg: '#FFD700', icon: '#FFA500', bgSize: '95%' };
  }
  return { bg: '#E1F5FE', icon: '#0288D1', bgSize: '50%' };
}
```

### 3. Adding Icon Support
Components use Ionicons. Ensure parent app includes:
```html
<!-- In app.html -->
<script type="module" src="https://unpkg.com/ionicons@latest/dist/ionicons/ionicons.esm.js"></script>
<script nomodule src="https://unpkg.com/ionicons@latest/dist/ionicons/ionicons.js"></script>
```

### 4. Extending Card Components
To add new fields to cards:
1. Update `SubscriptionPlan` or `ManaPackage` types in `shared-subscription-types`
2. Add props to component interface
3. Update template to display new data
4. Update styles if needed
5. Export new version

## Notes

- **Svelte 5 Only**: These components require Svelte 5.0.0+ (runes mode)
- **No Legacy Syntax**: Do not use `$:` reactive statements, use `$derived` instead
- **CSS Variables**: Assumes parent app defines `--foreground`, `--muted-foreground`, `--primary` variables
- **Ionicons Dependency**: Icons require Ionicons to be loaded in parent app
- **Data Files**: JSON files in `src/data/` are for examples only, not production use
- **Type Re-exports**: Components re-export types from `shared-subscription-types` for convenience
- **Private Package**: Marked as `private: true`, only for monorepo internal use
- **SSR Compatible**: All components work with SvelteKit SSR
- **No Client-Only Code**: No `browser` checks needed, fully isomorphic
