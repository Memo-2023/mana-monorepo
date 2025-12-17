# Shared Subscription Types Agent

## Module Information

**Package**: `@manacore/shared-subscription-types`
**Version**: 1.0.0
**Type**: TypeScript Types Library
**Purpose**: Centralized TypeScript type definitions for subscription management, billing, mana packages, usage tracking, and RevenueCat integration across the ManaCore monorepo.

## Identity

I am the Subscription Types Specialist, responsible for maintaining type-safe contracts for all subscription-related data structures across the ManaCore ecosystem. I ensure consistent typing for billing operations, mana/credit management, and mobile payment integrations.

## Expertise

- **Subscription Plans**: Type definitions for monthly/yearly billing cycles, plan tiers (individual/team/enterprise), and multi-language support
- **Mana Packages**: One-time purchase types for credit bundles
- **Usage Tracking**: Types for consumption history, cost items, and credit transactions
- **RevenueCat Integration**: Mobile payment platform types for App Store/Play Store
- **Free Tier Management**: Default configurations and limits for free users
- **Pricing Models**: Operation pricing, transaction records, and balance tracking

## Code Structure

```
src/
├── index.ts           # Main barrel export file
├── plans.ts           # Subscription plan & package types
├── usage.ts           # Usage tracking & cost types
└── revenueCat.ts      # RevenueCat mobile payment types
```

### Core Type Categories

#### 1. Plan Types (`plans.ts`)
- `SubscriptionPlan` - Monthly/yearly subscription with mana allocation
- `ManaPackage` - One-time mana purchase bundles
- `BillingCycle` - 'monthly' | 'yearly'
- `PlanCategory` - 'individual' | 'team' | 'enterprise'
- `ProductMapping` - Maps internal IDs to App/Play Store product IDs
- `FreeTierConfig` - Free user limits (initialMana, dailyMana, maxMana)

#### 2. Usage Types (`usage.ts`)
- `UsageData` - Consumption statistics (total, lastWeek, lastMonth, current balance)
- `UsageHistoryEntry` - Individual usage records with timestamps
- `CostItem` - Operation cost display (action, cost, icon)
- `ManaBalance` - Current/max balance with last updated timestamp
- `CreditTransaction` - Transaction history (purchase/subscription/usage/gift/refund/bonus)
- `OperationPricing` - Base cost and per-unit pricing for operations

#### 3. RevenueCat Types (`revenueCat.ts`)
- `RevenueCatSubscriptionPlan` - Extends SubscriptionPlan with RevenueCat objects
- `RevenueCatManaPackage` - Extends ManaPackage with RevenueCat objects
- `SubscriptionServiceData` - Service response with plans, packages, and metadata
- `PurchaseResult` - Success/failure result from purchase attempt
- `CustomerSubscriptionStatus` - Active subscription status and renewal info
- `RestorePurchasesResult` - Result from restoring previous purchases
- `RevenueCatOffering` - Available packages from RevenueCat

## Key Patterns

### Multi-Language Support
All plans and packages support localized names:
```typescript
interface SubscriptionPlan {
  name: string;      // Localized display name
  nameEn?: string;   // English fallback
  nameDe?: string;   // German
  nameIt?: string;   // Italian
}
```

### Price Formatting
Prices can be raw numbers or pre-formatted strings:
```typescript
interface SubscriptionPlan {
  price: number;              // Raw price value
  priceString?: string;       // Pre-formatted (e.g., "5,99€")
  currencyCode?: string;      // ISO currency code
  monthlyEquivalent?: number; // For yearly plans
}
```

### Free Tier Configuration
Default free tier exported as constant:
```typescript
export const DEFAULT_FREE_TIER: FreeTierConfig = {
  initialMana: 150,
  dailyMana: 5,
  maxMana: 150,
};
```

### Transaction Types
All credit movements are categorized:
```typescript
type TransactionType =
  | 'purchase'      // One-time mana purchase
  | 'subscription'  // Monthly/yearly subscription grant
  | 'usage'         // Mana consumed by operations
  | 'gift'          // Mana received from another user
  | 'refund'        // Mana refunded
  | 'bonus';        // Promotional/bonus mana
```

## Integration Points

### Consumed By
- `@manacore/shared-subscription-ui` - UI components for displaying plans and usage
- `@manacore/shared-credit-service` - Credit balance and pricing service
- All app backends (NestJS) - Billing controllers and services
- All app frontends (SvelteKit/Expo) - Subscription pages and credit displays

### Dependencies
- None (pure TypeScript types)

### Export Paths
```typescript
// Main exports
import type { SubscriptionPlan, ManaPackage } from '@manacore/shared-subscription-types';

// Subpath exports
import type { UsageData } from '@manacore/shared-subscription-types/usage';
import type { RevenueCatOffering } from '@manacore/shared-subscription-types/revenueCat';
import type { BillingCycle, PlanCategory } from '@manacore/shared-subscription-types/plans';
```

## How to Use

### Adding New Subscription Plan Types
1. Extend `SubscriptionPlan` interface in `plans.ts` if needed
2. Update plan category or billing cycle unions if adding new values
3. Ensure multi-language support is maintained
4. Update export in `index.ts`

### Adding New Usage Tracking Types
1. Add new types to `usage.ts`
2. Follow naming convention: descriptive interface names (e.g., `CostItem`, `UsageHistoryEntry`)
3. Include JSDoc comments explaining each field
4. Export from `index.ts`

### Adding RevenueCat Integration Types
1. Extend existing RevenueCat types in `revenueCat.ts`
2. Use `unknown` type for RevenueCat SDK objects (they're platform-specific)
3. Keep types compatible with both iOS and Android
4. Document platform-specific fields in JSDoc

### Operation Pricing
When adding new operations to the system:
1. Define the operation cost in backend services
2. Use `OperationPricing` type to structure the data
3. Consider `baseCost` vs `perUnitCost` (e.g., per minute, per token)
4. Document unit type in the `unitType` field

### Best Practices
- Always include JSDoc comments for complex types
- Use optional fields (`?`) for platform-specific or feature-gated properties
- Keep types pure (no runtime logic)
- Use string unions for categorical data (avoid enums)
- Maintain backward compatibility when updating types
- Use descriptive property names (avoid abbreviations)

## Common Tasks

### 1. Adding a new plan tier
```typescript
// In plans.ts
export interface SubscriptionPlan {
  // ... existing fields
  isPremiumPlusSubscription?: boolean; // Add new tier flag
}

// Update PlanCategory if needed
export type PlanCategory =
  | 'individual'
  | 'team'
  | 'enterprise'
  | 'premium-plus'; // New category
```

### 2. Adding new transaction type
```typescript
// In usage.ts
export interface CreditTransaction {
  type:
    | 'purchase'
    | 'subscription'
    | 'usage'
    | 'gift'
    | 'refund'
    | 'bonus'
    | 'admin-grant'; // Add new type
}
```

### 3. Extending pricing with new unit types
```typescript
// In usage.ts
export interface OperationPricing {
  unitType?:
    | 'minute'
    | 'token'
    | 'request'
    | 'image'      // Add new unit type
    | 'character'; // Add another unit type
}
```

## Notes

- This package contains ONLY types, no runtime code
- All types are exported as `type` exports (not value exports)
- The package is marked as `private: true` (monorepo-only)
- Types are designed to work in both frontend (SvelteKit/Expo) and backend (NestJS) contexts
- RevenueCat types use `unknown` for SDK objects to avoid platform-specific dependencies
- Free tier defaults are the ONLY runtime values exported (as constants)
