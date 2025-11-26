/**
 * Types for RevenueCat integration and subscription management
 */
import { PurchasesPackage, PurchasesStoreProduct } from 'react-native-purchases';

/**
 * Enhanced subscription plan from RevenueCat offerings
 */
export interface RevenueCatSubscriptionPlan {
  id: string;
  name: string;
  nameEn: string;
  nameIt: string;
  price: number;
  priceString: string;
  currencyCode: string;
  initialMana: number;
  dailyMana: number;
  maxMana: number;
  canGiftMana: boolean;
  popular: boolean;
  billingCycle: 'monthly' | 'yearly';
  isTeamSubscription?: boolean;
  isEnterpriseSubscription?: boolean;
  features?: string[];
  monthlyEquivalent?: number;
  priceBreakdown?: string;
  // RevenueCat specific
  revenueCatPackage?: PurchasesPackage;
  revenueCatProduct?: PurchasesStoreProduct;
  productId: string;
}

/**
 * Enhanced mana package from RevenueCat offerings
 */
export interface RevenueCatManaPackage {
  id: string;
  name: string;
  nameEn: string;
  nameIt: string;
  manaAmount: number;
  price: number;
  priceString: string;
  currencyCode: string;
  isTeamPackage?: boolean;
  isEnterprisePackage?: boolean;
  popular: boolean;
  // RevenueCat specific
  revenueCatPackage?: PurchasesPackage;
  revenueCatProduct?: PurchasesStoreProduct;
  productId: string;
}

/**
 * Service response for subscription data
 */
export interface SubscriptionServiceData {
  subscriptions: RevenueCatSubscriptionPlan[];
  packages: RevenueCatManaPackage[];
  isFromRevenueCat: boolean;
  lastUpdated: Date;
}

/**
 * Fallback subscription plan (from JSON)
 */
export interface FallbackSubscriptionPlan {
  id: string;
  name: string;
  nameEn: string;
  nameIt: string;
  price: number;
  priceUnit: string;
  initialMana: number;
  dailyMana: number;
  maxMana: number;
  canGiftMana: boolean;
  popular: boolean;
  billingCycle: 'monthly' | 'yearly';
  isTeamSubscription?: boolean;
  isEnterpriseSubscription?: boolean;
  features?: string[];
  monthlyEquivalent?: number;
  priceBreakdown?: string;
}

/**
 * Fallback mana package (from JSON)
 */
export interface FallbackManaPackage {
  id: string;
  name: string;
  nameEn: string;
  nameIt: string;
  manaAmount: number;
  price: number;
  isTeamPackage?: boolean;
  isEnterprisePackage?: boolean;
  popular: boolean;
}

/**
 * Product mapping configuration
 */
export interface ProductMapping {
  subscriptionId: string;
  productId: string;
  billingCycle: 'monthly' | 'yearly';
  category: 'individual' | 'team' | 'enterprise';
}

/**
 * Package mapping configuration
 */
export interface PackageMapping {
  packageId: string;
  productId: string;
  category: 'individual' | 'team' | 'enterprise';
}