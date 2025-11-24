/**
 * Subscription plan and package types
 */

/**
 * Billing cycle options
 */
export type BillingCycle = 'monthly' | 'yearly';

/**
 * Subscription plan category
 */
export type PlanCategory = 'individual' | 'team' | 'enterprise';

/**
 * Base subscription plan interface
 */
export interface SubscriptionPlan {
  /** Unique identifier */
  id: string;
  /** Display name (localized) */
  name: string;
  /** English name */
  nameEn?: string;
  /** German name */
  nameDe?: string;
  /** Italian name */
  nameIt?: string;
  /** Price in local currency */
  price: number;
  /** Formatted price string (e.g., "5,99€") */
  priceString?: string;
  /** Currency code (e.g., "EUR") */
  currencyCode?: string;
  /** Price breakdown text */
  priceBreakdown?: string;
  /** Monthly equivalent for yearly plans */
  monthlyEquivalent?: number;
  /** Mana amount per month */
  monthlyMana: number;
  /** Initial mana grant on signup */
  initialMana?: number;
  /** Daily mana regeneration */
  dailyMana?: number;
  /** Maximum mana capacity */
  maxMana?: number;
  /** Whether user can gift mana */
  canGiftMana: boolean;
  /** Mark as popular/recommended */
  popular?: boolean;
  /** Billing frequency */
  billingCycle: BillingCycle;
  /** Team subscription flag */
  isTeamSubscription?: boolean;
  /** Enterprise subscription flag */
  isEnterpriseSubscription?: boolean;
  /** Plan features list */
  features?: string[];
}

/**
 * One-time mana package interface
 */
export interface ManaPackage {
  /** Unique identifier */
  id: string;
  /** Display name (localized) */
  name: string;
  /** English name */
  nameEn?: string;
  /** German name */
  nameDe?: string;
  /** Italian name */
  nameIt?: string;
  /** Mana amount */
  manaAmount: number;
  /** Price in local currency */
  price: number;
  /** Formatted price string */
  priceString?: string;
  /** Currency code */
  currencyCode?: string;
  /** Team package flag */
  isTeamPackage?: boolean;
  /** Enterprise package flag */
  isEnterprisePackage?: boolean;
  /** Mark as popular */
  popular?: boolean;
}

/**
 * Product mapping for RevenueCat
 */
export interface ProductMapping {
  /** Internal subscription ID */
  subscriptionId: string;
  /** App Store/Play Store product ID */
  productId: string;
  /** Billing cycle */
  billingCycle: BillingCycle;
  /** Category */
  category: PlanCategory;
}

/**
 * Package mapping for RevenueCat
 */
export interface PackageMapping {
  /** Internal package ID */
  packageId: string;
  /** App Store/Play Store product ID */
  productId: string;
  /** Category */
  category: PlanCategory;
}

/**
 * Free tier configuration
 */
export interface FreeTierConfig {
  /** Initial mana for free users */
  initialMana: number;
  /** Daily mana regeneration */
  dailyMana: number;
  /** Maximum mana capacity */
  maxMana: number;
}

/**
 * Default free tier configuration
 */
export const DEFAULT_FREE_TIER: FreeTierConfig = {
  initialMana: 150,
  dailyMana: 5,
  maxMana: 150,
};
