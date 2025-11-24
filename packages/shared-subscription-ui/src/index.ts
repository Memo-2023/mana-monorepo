/**
 * Shared subscription UI components for Manacore monorepo
 *
 * This package contains Svelte 5 components for displaying
 * subscription plans, mana packages, and usage information.
 */

// Pages
export { default as SubscriptionPage } from './pages/SubscriptionPage.svelte';

// Components
export { default as SubscriptionCard } from './SubscriptionCard.svelte';
export { default as PackageCard } from './PackageCard.svelte';
export { default as BillingToggle } from './BillingToggle.svelte';
export { default as UsageCard } from './UsageCard.svelte';
export { default as CostCard } from './CostCard.svelte';
export { default as SubscriptionButton } from './SubscriptionButton.svelte';
export { default as ManaIcon } from './ManaIcon.svelte';

// Default data exports
export { default as defaultSubscriptionData } from './data/subscriptionData.json';
export { default as defaultAppCosts } from './data/appCosts.json';
export { default as defaultUsageData } from './data/defaultUsageData.json';

// Re-export types for convenience
export type {
	SubscriptionPlan,
	ManaPackage,
	BillingCycle,
	UsageData,
	CostItem,
} from '@manacore/shared-subscription-types';
