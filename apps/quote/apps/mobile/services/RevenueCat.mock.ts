/**
 * Mock RevenueCat for development/Expo Go
 * This file provides a mock implementation when RevenueCat SDK is not available
 */

import { Platform } from 'react-native';

export interface MockPurchasesPackage {
  identifier: string;
  packageType: string;
  product: {
    price: number;
    priceString: string;
    currencyCode: string;
    title: string;
    description: string;
  };
}

export interface MockCustomerInfo {
  entitlements: {
    active: {
      [key: string]: {
        identifier: string;
        productIdentifier: string;
        expirationDate?: string;
      } | undefined;
    };
  };
}

export interface MockPurchasesOffering {
  identifier: string;
  availablePackages: MockPurchasesPackage[];
}

class MockRevenueCatService {
  private mockPremiumStatus = false;

  async configure(userId?: string) {
    console.log('[RevenueCat Mock] Configure called with userId:', userId);
    return Promise.resolve();
  }

  async getOfferings(): Promise<MockPurchasesOffering | null> {
    console.log('[RevenueCat Mock] Getting offerings');
    
    // Return mock offerings for development
    return {
      identifier: 'default',
      availablePackages: [
        {
          identifier: 'monthly',
          packageType: 'MONTHLY',
          product: {
            price: 2.99,
            priceString: '2,99 €',
            currencyCode: 'EUR',
            title: 'Zitare Premium',
            description: 'Monatliches Abo'
          }
        },
        {
          identifier: 'yearly',
          packageType: 'ANNUAL',
          product: {
            price: 23.99,
            priceString: '23,99 €',
            currencyCode: 'EUR',
            title: 'Zitare Premium Jahresabo',
            description: 'Jährliches Abo - Spare 33%'
          }
        },
        {
          identifier: 'lifetime',
          packageType: 'LIFETIME',
          product: {
            price: 47.99,
            priceString: '47,99 €',
            currencyCode: 'EUR',
            title: 'Zitare Premium Lifetime',
            description: 'Einmalig, für immer'
          }
        }
      ]
    };
  }

  async purchasePackage(packageToPurchase: MockPurchasesPackage): Promise<boolean> {
    console.log('[RevenueCat Mock] Purchasing package:', packageToPurchase.identifier);
    
    // Simulate successful purchase in development
    this.mockPremiumStatus = true;
    return true;
  }

  async purchaseProduct(productId: string): Promise<boolean> {
    console.log('[RevenueCat Mock] Purchasing product:', productId);
    
    // Simulate successful purchase in development
    this.mockPremiumStatus = true;
    return true;
  }

  async restorePurchases(): Promise<boolean> {
    console.log('[RevenueCat Mock] Restoring purchases');
    
    // For development, randomly return true or false
    const hasRestoredPurchases = Math.random() > 0.5;
    this.mockPremiumStatus = hasRestoredPurchases;
    return hasRestoredPurchases;
  }

  async getCustomerInfo(): Promise<MockCustomerInfo | null> {
    console.log('[RevenueCat Mock] Getting customer info');
    
    // Return mock customer info
    if (this.mockPremiumStatus) {
      return {
        entitlements: {
          active: {
            premium: {
              identifier: 'premium',
              productIdentifier: 'zitare_premium_monthly',
              expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            }
          }
        }
      };
    }
    
    return {
      entitlements: {
        active: {}
      }
    };
  }

  isPremium(customerInfo: MockCustomerInfo): boolean {
    return customerInfo.entitlements.active['premium'] !== undefined;
  }

  async checkPremiumStatus(): Promise<boolean> {
    const customerInfo = await this.getCustomerInfo();
    if (!customerInfo) return false;
    return this.isPremium(customerInfo);
  }

  formatPrice(price: number, currency: string): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency,
    }).format(price);
  }

  calculateSavings(monthly: number, yearly: number): string {
    const totalMonthly = monthly * 12;
    const savings = totalMonthly - yearly;
    const percentage = Math.round((savings / totalMonthly) * 100);
    return `${percentage}%`;
  }

  // Development helper to toggle premium status
  toggleMockPremium() {
    this.mockPremiumStatus = !this.mockPremiumStatus;
    console.log('[RevenueCat Mock] Premium status toggled to:', this.mockPremiumStatus);
  }
}

export default new MockRevenueCatService();