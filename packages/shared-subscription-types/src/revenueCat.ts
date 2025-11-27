/**
 * RevenueCat integration types
 */

import type { SubscriptionPlan, ManaPackage } from './plans';

/**
 * RevenueCat-enhanced subscription plan
 */
export interface RevenueCatSubscriptionPlan extends SubscriptionPlan {
	/** RevenueCat package object */
	revenueCatPackage?: unknown;
	/** RevenueCat product object */
	revenueCatProduct?: unknown;
	/** App Store/Play Store product ID */
	productId: string;
}

/**
 * RevenueCat-enhanced mana package
 */
export interface RevenueCatManaPackage extends ManaPackage {
	/** RevenueCat package object */
	revenueCatPackage?: unknown;
	/** RevenueCat product object */
	revenueCatProduct?: unknown;
	/** App Store/Play Store product ID */
	productId: string;
}

/**
 * Subscription service data response
 */
export interface SubscriptionServiceData {
	/** All available subscription plans */
	subscriptions: RevenueCatSubscriptionPlan[];
	/** All available one-time packages */
	packages: RevenueCatManaPackage[];
	/** Whether data is from RevenueCat or fallback */
	isFromRevenueCat: boolean;
	/** Last update timestamp */
	lastUpdated: Date;
}

/**
 * Purchase result
 */
export interface PurchaseResult {
	/** Whether purchase was successful */
	success: boolean;
	/** Customer info from RevenueCat */
	customerInfo?: unknown;
	/** Error message if failed */
	error?: string;
}

/**
 * Customer subscription status
 */
export interface CustomerSubscriptionStatus {
	/** Whether user has active subscription */
	hasActiveSubscription: boolean;
	/** Current plan ID */
	currentPlanId?: string;
	/** Subscription expiration date */
	expirationDate?: Date;
	/** Whether in grace period */
	isInGracePeriod?: boolean;
	/** Whether subscription will renew */
	willRenew?: boolean;
}

/**
 * Restore purchases result
 */
export interface RestorePurchasesResult {
	/** Whether restore was successful */
	success: boolean;
	/** Restored subscription plan ID */
	restoredPlanId?: string;
	/** Error message if failed */
	error?: string;
}

/**
 * Offering from RevenueCat
 */
export interface RevenueCatOffering {
	/** Offering identifier */
	identifier: string;
	/** Available packages in this offering */
	availablePackages: RevenueCatSubscriptionPlan[];
	/** Lifetime package (if available) */
	lifetime?: RevenueCatManaPackage;
	/** Annual package */
	annual?: RevenueCatSubscriptionPlan;
	/** Monthly package */
	monthly?: RevenueCatSubscriptionPlan;
}
