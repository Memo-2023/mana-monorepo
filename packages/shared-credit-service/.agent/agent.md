# Shared Credit Service Agent

## Module Information

**Package**: `@manacore/shared-credit-service`
**Version**: 0.0.1
**Type**: TypeScript Service Library
**Purpose**: Framework-agnostic credit/mana management service providing balance fetching, operation pricing, credit checks, and consumption notifications for all ManaCore apps (SvelteKit, Expo, NestJS).

## Identity

I am the Credit Service Specialist, providing a unified API for managing mana/credit balances across the ManaCore ecosystem. I handle pricing lookups, balance checks, consumption tracking, and real-time credit updates with caching and fallback mechanisms.

## Expertise

- **Credit Balance Management**: Fetch and cache user credit balances
- **Operation Pricing**: Dynamic pricing with backend sync and fallback
- **Credit Checks**: Pre-operation balance validation
- **Consumption Notifications**: Event-driven credit update system
- **Caching Strategy**: 30-minute pricing cache with configurable duration
- **Fallback Mechanisms**: Graceful degradation when backend unavailable
- **Framework Agnostic**: Works with SvelteKit, Expo, and Node.js
- **Type-Safe API**: Full TypeScript support with Result types
- **Auth Integration**: Token-based authentication with configurable getter

## Code Structure

```
src/
├── index.ts                 # Barrel exports with usage examples
├── types.ts                 # TypeScript interfaces and constants
└── createCreditService.ts   # Factory function implementation
```

## Core API

### Factory Function: `createCreditService(config)`

Creates a credit service instance with the following methods:

```typescript
const creditService = createCreditService({
  apiUrl: 'https://api.example.com',
  balanceEndpoint: '/auth/credits',      // Optional, default shown
  pricingEndpoint: '/credits/pricing',   // Optional, default shown
  cacheDuration: 30 * 60 * 1000,         // Optional, 30 min default
  fallbackPricing: { /* custom costs */ }, // Optional
  getAuthToken: async () => token        // Required
});
```

### Service Methods

#### Initialization
- `initialize()` - Preload pricing on app startup

#### Balance Operations
- `getBalance()` - Fetch current user credit balance
- `checkBalance(requiredCredits, operation?)` - Check if user has enough credits
- `checkOperationBalance(operation)` - Check balance for specific operation

#### Pricing Operations
- `getPricing()` - Fetch all operation costs (cached)
- `getOperationCost(operation)` - Get cost for operation (async, with cache)
- `getOperationCostSync(operation)` - Get cost synchronously (cache-only)
- `calculateCost(operation, quantity)` - Calculate cost for multiple units
- `calculateCostSync(operation, quantity)` - Calculate cost synchronously

#### Notifications
- `onCreditUpdate(callback)` - Subscribe to credit consumption events
- `triggerCreditUpdate(creditsConsumed, operation?)` - Manually trigger update

#### Utilities
- `formatCredits(amount, locale?)` - Format credit amount for display
- `clearCache()` - Clear pricing cache (for testing/refresh)

## Key Types

### Configuration
```typescript
interface CreditServiceConfig {
  apiUrl: string;                             // Backend API base URL
  balanceEndpoint?: string;                   // Default: '/auth/credits'
  pricingEndpoint?: string;                   // Default: '/credits/pricing'
  cacheDuration?: number;                     // Default: 30 minutes (ms)
  fallbackPricing?: Record<string, number>;   // Custom fallback costs
  getAuthToken: () => Promise<string | null>; // Auth token provider
}
```

### Responses
```typescript
interface CreditBalance {
  credits: number;            // Current balance
  maxCreditLimit: number;     // Max capacity
  userId: string;
  currency?: string;          // Default: 'mana'
  lastUpdated?: string;
}

interface CreditCheckResponse {
  hasEnoughCredits: boolean;
  currentCredits: number;
  requiredCredits: number;
  deficit?: number;           // Amount short (if insufficient)
  creditType?: 'user' | 'space';
  context?: Record<string, unknown>;
}

interface PricingResponse {
  operationCosts: Record<string, number>;
  transcriptionPerHour?: number;
  lastUpdated: string;
}
```

### Standard Operations
```typescript
type StandardOperationType =
  // Memoro operations
  | 'TRANSCRIPTION_PER_HOUR'
  | 'HEADLINE_GENERATION'
  | 'MEMORY_CREATION'
  | 'BLUEPRINT_PROCESSING'
  | 'QUESTION_MEMO'
  | 'NEW_MEMORY'
  | 'MEMO_COMBINE'
  | 'MEMO_SHARING'
  | 'SPACE_OPERATION'
  // Maerchenzauber operations
  | 'CHARACTER_CREATION'
  | 'CHARACTER_GENERATION_FROM_IMAGE'
  | 'CHARACTER_IMPORT'
  | 'STORY_CREATION'
  | 'STORY_CONTINUATION'
  // ManaDeck operations
  | 'DECK_CREATION'
  | 'CARD_GENERATION'
  | 'AI_REVIEW'
  // Generic operations
  | 'AI_PROCESSING'
  | 'EXPORT'
  | 'IMPORT'
  | string; // Custom operations allowed
```

## Key Patterns

### 1. Service Initialization
Initialize on app startup to preload pricing:

```typescript
// In app initialization (e.g., +layout.svelte, App.tsx, main.ts)
import { creditService } from '$lib/services/creditService';

onMount(async () => {
  await creditService.initialize();
});
```

### 2. Balance Checking Before Operations
Always check balance before costly operations:

```typescript
async function createStory(data: StoryData) {
  // Check balance
  const check = await creditService.checkOperationBalance('STORY_CREATION');

  if (!check.hasEnoughCredits) {
    showInsufficientCreditsModal({
      required: check.requiredCredits,
      current: check.currentCredits,
      deficit: check.deficit
    });
    return;
  }

  // Proceed with operation
  const result = await api.createStory(data);

  // Notify service of consumption
  if (result.success) {
    creditService.triggerCreditUpdate(check.requiredCredits, 'STORY_CREATION');
  }
}
```

### 3. Real-Time Credit Updates
Subscribe to credit changes to update UI:

```typescript
// In Svelte store (creditStore.svelte.ts)
let balance = $state<number>(0);
let isLoading = $state(true);

// Initial load
creditService.getBalance().then(data => {
  if (data) balance = data.credits;
  isLoading = false;
});

// Listen for updates
creditService.onCreditUpdate((consumed) => {
  balance -= consumed;
});

export const credits = {
  get current() { return balance; },
  get isLoading() { return isLoading; }
};
```

### 4. Pricing Display
Show operation costs in UI:

```typescript
async function loadCosts() {
  const costs = await Promise.all([
    creditService.getOperationCost('STORY_CREATION'),
    creditService.getOperationCost('CHARACTER_CREATION'),
    creditService.getOperationCost('STORY_CONTINUATION')
  ]);

  return [
    { action: 'Create Story', cost: costs[0], icon: 'book' },
    { action: 'Create Character', cost: costs[1], icon: 'person' },
    { action: 'Continue Story', cost: costs[2], icon: 'add' }
  ];
}
```

### 5. Fallback Pricing
Provide app-specific fallback pricing:

```typescript
const creditService = createCreditService({
  apiUrl: env.API_URL,
  getAuthToken: () => auth.getToken(),
  fallbackPricing: {
    STORY_CREATION: 10,
    CHARACTER_CREATION: 20,
    STORY_CONTINUATION: 5,
    // Merges with DEFAULT_OPERATION_PRICING
  }
});
```

### 6. Caching Strategy
The service implements a 30-minute cache for pricing:

```typescript
// First call: fetches from backend
const pricing1 = await creditService.getPricing(); // HTTP request

// Within 30 minutes: returns cached data
const pricing2 = await creditService.getPricing(); // Cached

// Force refresh
creditService.clearCache();
const pricing3 = await creditService.getPricing(); // HTTP request
```

## Integration Points

### Dependencies
- `@manacore/shared-subscription-types` - Type imports for pricing and usage types

### Consumed By
- All SvelteKit web apps - Client-side credit management
- All Expo mobile apps - React Native credit tracking
- NestJS backends - Server-side credit validation (less common)

### Backend Integration
Expects backend endpoints:

**GET `/auth/credits`** (or configured `balanceEndpoint`)
```typescript
// Request
Authorization: Bearer <token>

// Response
{
  credits: number;
  maxCreditLimit: number;
  userId: string;
}
// OR wrapped:
{
  data: {
    credits: number;
    maxCreditLimit: number;
    userId: string;
  }
}
```

**GET `/credits/pricing`** (or configured `pricingEndpoint`)
```typescript
// Response
{
  operationCosts: {
    STORY_CREATION: 10,
    CHARACTER_CREATION: 20,
    // ... all operation costs
  },
  transcriptionPerHour?: 120,
  lastUpdated: "2025-12-16T12:00:00Z"
}
```

## How to Use

### 1. Setup in SvelteKit App

**Create service instance** (`src/lib/services/creditService.ts`):
```typescript
import { createCreditService } from '@manacore/shared-credit-service';
import { auth } from '$lib/stores/auth';
import { env } from '$env/dynamic/public';

export const creditService = createCreditService({
  apiUrl: env.PUBLIC_API_URL,
  getAuthToken: () => auth.getToken(),
  fallbackPricing: {
    // App-specific overrides
  }
});
```

**Initialize on app load** (`src/routes/+layout.svelte`):
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { creditService } from '$lib/services/creditService';

  onMount(() => {
    creditService.initialize();
  });
</script>
```

**Create reactive store** (`src/lib/stores/creditStore.svelte.ts`):
```typescript
import { creditService } from '$lib/services/creditService';

let balance = $state<number>(0);
let maxLimit = $state<number>(0);
let isLoading = $state(true);

async function loadBalance() {
  const data = await creditService.getBalance();
  if (data) {
    balance = data.credits;
    maxLimit = data.maxCreditLimit;
  }
  isLoading = false;
}

// Listen for updates
creditService.onCreditUpdate((consumed) => {
  balance -= consumed;
});

export const credits = {
  get current() { return balance; },
  get max() { return maxLimit; },
  get isLoading() { return isLoading; },
  load: loadBalance,
  refresh: loadBalance
};
```

### 2. Setup in Expo App

**Create service instance** (`src/services/creditService.ts`):
```typescript
import { createCreditService } from '@manacore/shared-credit-service';
import { getAuthToken } from '@/stores/authStore';
import Constants from 'expo-constants';

export const creditService = createCreditService({
  apiUrl: Constants.expoConfig?.extra?.apiUrl || '',
  getAuthToken: async () => await getAuthToken()
});
```

**Initialize in App.tsx**:
```typescript
import { useEffect } from 'react';
import { creditService } from '@/services/creditService';

export default function App() {
  useEffect(() => {
    creditService.initialize();
  }, []);

  return <NavigationContainer>...</NavigationContainer>;
}
```

**Create React hook** (`src/hooks/useCredits.ts`):
```typescript
import { useState, useEffect } from 'react';
import { creditService } from '@/services/creditService';

export function useCredits() {
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load initial balance
    creditService.getBalance().then(data => {
      if (data) setBalance(data.credits);
      setIsLoading(false);
    });

    // Subscribe to updates
    const unsubscribe = creditService.onCreditUpdate((consumed) => {
      setBalance(prev => prev - consumed);
    });

    return unsubscribe;
  }, []);

  return { balance, isLoading };
}
```

### 3. Pre-Operation Balance Check

**In SvelteKit**:
```typescript
async function handleCreateStory() {
  const check = await creditService.checkOperationBalance('STORY_CREATION');

  if (!check.hasEnoughCredits) {
    alert(`Insufficient credits. Need ${check.deficit} more mana.`);
    return;
  }

  // Proceed with API call
  const response = await fetch('/api/stories', {
    method: 'POST',
    body: JSON.stringify(storyData)
  });

  if (response.ok) {
    creditService.triggerCreditUpdate(check.requiredCredits, 'STORY_CREATION');
  }
}
```

**In Expo**:
```typescript
async function handleCreateCharacter() {
  const check = await creditService.checkOperationBalance('CHARACTER_CREATION');

  if (!check.hasEnoughCredits) {
    Alert.alert(
      'Insufficient Credits',
      `You need ${check.deficit} more mana to create a character.`
    );
    return;
  }

  // Proceed with API call
  const result = await api.createCharacter(characterData);

  if (result.success) {
    creditService.triggerCreditUpdate(check.requiredCredits, 'CHARACTER_CREATION');
  }
}
```

### 4. Displaying Operation Costs

```svelte
<script lang="ts">
  import { creditService } from '$lib/services/creditService';
  import { CostCard } from '@manacore/shared-subscription-ui';

  let costs = $state<CostItem[]>([]);

  async function loadCosts() {
    const [story, character, continuation] = await Promise.all([
      creditService.getOperationCost('STORY_CREATION'),
      creditService.getOperationCost('CHARACTER_CREATION'),
      creditService.getOperationCost('STORY_CONTINUATION')
    ]);

    costs = [
      { action: 'Create Story', cost: story, icon: 'book-outline' },
      { action: 'Create Character', cost: character, icon: 'person-add-outline' },
      { action: 'Continue Story', cost: continuation, icon: 'add-circle-outline' }
    ];
  }

  onMount(loadCosts);
</script>

<CostCard {costs} />
```

## Best Practices

### 1. Always Initialize on App Start
Preload pricing to avoid delays on first operation:
```typescript
creditService.initialize(); // Call in +layout.svelte or App.tsx
```

### 2. Use Sync Methods for UI Display
When showing costs in UI (non-blocking):
```typescript
const cost = creditService.getOperationCostSync('STORY_CREATION');
```

### 3. Use Async Methods for Validation
When validating before operations (needs fresh data):
```typescript
const check = await creditService.checkOperationBalance('STORY_CREATION');
```

### 4. Handle Missing Tokens Gracefully
```typescript
const creditService = createCreditService({
  apiUrl: env.API_URL,
  getAuthToken: async () => {
    try {
      return await auth.getToken();
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null; // Service handles null gracefully
    }
  }
});
```

### 5. Unsubscribe from Updates
Always clean up subscriptions:
```typescript
// Svelte
onDestroy(() => {
  if (unsubscribe) unsubscribe();
});

// React
useEffect(() => {
  const unsubscribe = creditService.onCreditUpdate(...);
  return unsubscribe;
}, []);
```

### 6. Provide App-Specific Fallbacks
Override defaults for app-specific operations:
```typescript
fallbackPricing: {
  ...DEFAULT_OPERATION_PRICING, // Include defaults
  CUSTOM_APP_OPERATION: 15       // Add custom
}
```

### 7. Cache Management
Clear cache when switching users or after purchases:
```typescript
// After successful purchase
creditService.clearCache();
await creditService.initialize();
```

## Common Tasks

### 1. Adding New Operation Type
```typescript
// In types.ts
export type StandardOperationType =
  | 'EXISTING_OPERATION'
  // ... other operations
  | 'NEW_CUSTOM_OPERATION'  // Add here
  | string;

// Update DEFAULT_OPERATION_PRICING
export const DEFAULT_OPERATION_PRICING: Record<string, number> = {
  // ... existing
  NEW_CUSTOM_OPERATION: 25,
};
```

### 2. Custom Error Handling
```typescript
async function safeCheckBalance(operation: string) {
  try {
    return await creditService.checkOperationBalance(operation);
  } catch (error) {
    console.error('Balance check failed:', error);
    // Return safe default
    return {
      hasEnoughCredits: false,
      currentCredits: 0,
      requiredCredits: 0,
      deficit: 0
    };
  }
}
```

### 3. Multi-Operation Cost Calculation
```typescript
async function calculateTotalCost(operations: string[], quantities: number[]) {
  const costs = await Promise.all(
    operations.map((op, i) => creditService.calculateCost(op, quantities[i]))
  );
  return costs.reduce((sum, cost) => sum + cost, 0);
}
```

### 4. Conditional Pricing
```typescript
// In component
const cost = $derived.by(async () => {
  if (isComplexOperation) {
    return await creditService.getOperationCost('COMPLEX_OP');
  }
  return await creditService.getOperationCost('SIMPLE_OP');
});
```

## Notes

- **Framework Agnostic**: Works in browser (SvelteKit, Expo) and Node.js (NestJS)
- **No Global State**: Each instance is independent, create one per app
- **Singleton Pattern**: Create one instance and export it, reuse across app
- **Offline Support**: Falls back to cached/default pricing when offline
- **Type Safety**: Full TypeScript support with proper error types
- **Extensible**: Easy to add custom operations and pricing
- **Event-Driven**: Notification system allows decoupled UI updates
- **Performance**: 30-minute cache reduces API calls
- **Error Handling**: Graceful degradation on API failures
- **Auth Flexibility**: Supports any auth system via `getAuthToken` callback
- **Response Normalization**: Handles both wrapped and direct API responses
- **Currency Agnostic**: Defaults to 'mana' but supports custom currencies
- **Logging**: Console logs for initialization and errors (development friendly)
