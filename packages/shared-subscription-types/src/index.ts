/**
 * Shared subscription types for Manacore monorepo
 *
 * This package contains TypeScript types for subscription plans,
 * mana packages, usage tracking, and RevenueCat integration.
 */

// Plan types
export {
  type BillingCycle,
  type PlanCategory,
  type SubscriptionPlan,
  type ManaPackage,
  type ProductMapping,
  type PackageMapping,
  type FreeTierConfig,
  DEFAULT_FREE_TIER,
} from './plans';

// Usage types
export {
  type UsageData,
  type UsageHistoryEntry,
  type CostItem,
  type ManaBalance,
  type CreditTransaction,
  type OperationPricing,
} from './usage';

// RevenueCat types
export {
  type RevenueCatSubscriptionPlan,
  type RevenueCatManaPackage,
  type SubscriptionServiceData,
  type PurchaseResult,
  type CustomerSubscriptionStatus,
  type RestorePurchasesResult,
  type RevenueCatOffering,
} from './revenueCat';
