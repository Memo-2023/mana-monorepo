/**
 * @mana/subscriptions — Unified subscription package
 *
 * Consolidates shared-subscription-types + shared-subscription-ui.
 */

// === Types ===
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

export {
	type UsageData,
	type UsageHistoryEntry,
	type CostItem,
	type ManaBalance,
	type CreditTransaction,
	type OperationPricing,
} from './usage';

export {
	type RevenueCatSubscriptionPlan,
	type RevenueCatManaPackage,
	type SubscriptionServiceData,
	type PurchaseResult,
	type CustomerSubscriptionStatus,
	type RestorePurchasesResult,
	type RevenueCatOffering,
} from './revenueCat';

// === UI Components ===
export { default as SubscriptionPage } from './pages/SubscriptionPage.svelte';
export { default as SubscriptionCard } from './SubscriptionCard.svelte';
export { default as PackageCard } from './PackageCard.svelte';
export { default as BillingToggle } from './BillingToggle.svelte';
export { default as UsageCard } from './UsageCard.svelte';
export { default as CostCard } from './CostCard.svelte';
export { default as SubscriptionButton } from './SubscriptionButton.svelte';
export { default as ManaIcon } from './ManaIcon.svelte';

// === Default data ===
export { default as defaultSubscriptionData } from './data/subscriptionData.json';
export { default as defaultAppCosts } from './data/appCosts.json';
export { default as defaultUsageData } from './data/defaultUsageData.json';
