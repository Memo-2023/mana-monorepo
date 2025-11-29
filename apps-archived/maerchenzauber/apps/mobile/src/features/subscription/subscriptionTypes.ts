/**
 * TypeScript type definitions for RevenueCat subscriptions and packages
 */

// Subscription plan from RevenueCat
export interface RevenueCatSubscriptionPlan {
	id: string; // Internal ID (e.g., 'small_monthly')
	name: string; // Display name (e.g., 'Kleiner Mana Stream')
	nameEn?: string; // English name
	price: number; // Price in local currency
	priceString: string; // Formatted price string (e.g., '5,99€')
	currencyCode: string; // Currency code (e.g., 'EUR')
	mana: number; // Mana amount per month
	billingCycle: 'monthly' | 'yearly'; // Billing frequency
	popular?: boolean; // Mark as popular/recommended
	revenueCatPackage?: any; // RevenueCat package object
	revenueCatProduct?: any; // RevenueCat product object
	productId: string; // App Store/Play Store product ID
}

// One-time mana package from RevenueCat
export interface RevenueCatManaPackage {
	id: string; // Internal ID (e.g., 'small')
	name: string; // Display name (e.g., 'Kleiner Mana Trank')
	nameEn?: string; // English name
	manaAmount: number; // Mana amount
	price: number; // Price in local currency
	priceString: string; // Formatted price string
	currencyCode: string; // Currency code
	popular?: boolean; // Mark as popular
	revenueCatProduct?: any; // RevenueCat product object
	productId: string; // App Store/Play Store product ID
}

// Complete subscription service data response
export interface SubscriptionServiceData {
	subscriptions: RevenueCatSubscriptionPlan[]; // All subscription plans
	packages: RevenueCatManaPackage[]; // All one-time packages
	isFromRevenueCat: boolean; // Whether data is from RevenueCat or fallback
	lastUpdated: Date; // Last update timestamp
}

// Purchase result
export interface PurchaseResult {
	success: boolean;
	customerInfo?: any;
	error?: string;
}

// Customer subscription status
export interface CustomerSubscriptionStatus {
	hasActiveSubscription: boolean;
	currentPlanId?: string;
	expirationDate?: Date;
	isInGracePeriod?: boolean;
	willRenew?: boolean;
}
