/**
 * Subscription type definitions
 */

export interface SubscriptionData {
  id: string;
  name: string;
  description: string;
  priceString: string;
  intro_price_string?: string;
  currency: string;
  yearly?: boolean;
  product_id?: string;
}

export interface PackageData {
  id: string;
  name: string;
  description: string;
  priceString: string;
  currency: string;
  credits: number;
  product_id?: string;
}

export interface FallbackSubscriptionData {
  subscriptions: SubscriptionData[];
  packages: PackageData[];
}

export interface Subscription {
  id: string;
  name: string;
  description: string;
  price: string;
  pricePerMonth?: string;
  savings?: string;
  isYearly?: boolean;
  isCurrent?: boolean;
  productId?: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  description: string;
  credits: number;
  price: string;
  productId?: string;
}

export interface PurchaseState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
}