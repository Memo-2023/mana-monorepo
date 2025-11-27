import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Conditional import based on environment
let Purchases: any;
let LOG_LEVEL: any;

// Check if we're in Expo Go or development build
const isExpoGo = Constants.appOwnership === 'expo';

if (!isExpoGo) {
  try {
    // Try to import the real RevenueCat SDK
    const RevenueCatSDK = require('react-native-purchases');
    Purchases = RevenueCatSDK.default;
    LOG_LEVEL = RevenueCatSDK.LOG_LEVEL;
    console.log('[RevenueCat] Using real SDK implementation');
  } catch (error) {
    console.log('[RevenueCat] SDK not available, falling back to mock');
  }
} else {
  console.log('[RevenueCat] Running in Expo Go, using mock implementation');
}

// RevenueCat API Keys - WICHTIG: In Produktion durch Umgebungsvariablen ersetzen
const API_KEYS = {
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || 'appl_XXXXXXXXXXXXXXXXXXXXX',
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || 'goog_XXXXXXXXXXXXXXXXXXXXX',
};

// Product IDs - müssen mit App Store/Google Play übereinstimmen
export const PRODUCT_IDS = {
  monthly: 'zitare_premium_monthly',
  yearly: 'zitare_premium_yearly',
  lifetime: 'zitare_premium_lifetime',
};

// Entitlement IDs
export const ENTITLEMENT_ID = 'premium';

class RevenueCatService {
  private isConfigured = false;
  private mockService: any = null;

  constructor() {
    // Always use mock service for now
    try {
      this.mockService = require('./RevenueCat.mock').default;
    } catch (error) {
      console.error('Failed to load mock service:', error);
    }
  }

  async configure(userId?: string) {
    if (this.isConfigured) return;

    // Use mock in Expo Go or when SDK is not available
    if (!Purchases || isExpoGo) {
      if (this.mockService) {
        await this.mockService.configure(userId);
        this.isConfigured = true;
        return;
      }
    }

    try {
      // Configure RevenueCat
      const apiKey = Platform.OS === 'ios' ? API_KEYS.ios : API_KEYS.android;
      
      // Check if API key is configured
      if (apiKey.includes('XXXX')) {
        console.warn('[RevenueCat] API keys not configured. Using mock service.');
        if (this.mockService) {
          await this.mockService.configure(userId);
          this.isConfigured = true;
        }
        return;
      }

      await Purchases.configure({ apiKey, appUserID: userId });

      // Enable debug logs in development
      if (__DEV__ && LOG_LEVEL) {
        await Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
      }

      this.isConfigured = true;
      console.log('[RevenueCat] Configured successfully with real SDK');
    } catch (error) {
      console.error('[RevenueCat] Error configuring:', error);
      // Fall back to mock service
      if (this.mockService) {
        await this.mockService.configure(userId);
        this.isConfigured = true;
      }
    }
  }

  async getOfferings(): Promise<any | null> {
    if (!Purchases || isExpoGo) {
      if (this.mockService) {
        return await this.mockService.getOfferings();
      }
      return null;
    }

    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (error) {
      console.error('[RevenueCat] Error fetching offerings:', error);
      // Fall back to mock service
      if (this.mockService) {
        return await this.mockService.getOfferings();
      }
      return null;
    }
  }

  async purchasePackage(packageToPurchase: any): Promise<boolean> {
    if (!Purchases || isExpoGo) {
      if (this.mockService) {
        return await this.mockService.purchasePackage(packageToPurchase);
      }
      return false;
    }

    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      return this.isPremium(customerInfo);
    } catch (error: any) {
      if (!error.userCancelled) {
        console.error('[RevenueCat] Error purchasing package:', error);
      }
      return false;
    }
  }

  async purchaseProduct(productId: string): Promise<boolean> {
    if (!Purchases || isExpoGo) {
      if (this.mockService) {
        return await this.mockService.purchaseProduct(productId);
      }
      return false;
    }

    try {
      const { customerInfo } = await Purchases.purchaseProduct(productId);
      return this.isPremium(customerInfo);
    } catch (error: any) {
      if (!error.userCancelled) {
        console.error('[RevenueCat] Error purchasing product:', error);
      }
      return false;
    }
  }

  async restorePurchases(): Promise<boolean> {
    if (!Purchases || isExpoGo) {
      if (this.mockService) {
        return await this.mockService.restorePurchases();
      }
      return false;
    }

    try {
      const customerInfo = await Purchases.restorePurchases();
      return this.isPremium(customerInfo);
    } catch (error) {
      console.error('[RevenueCat] Error restoring purchases:', error);
      return false;
    }
  }

  async getCustomerInfo(): Promise<any | null> {
    if (!Purchases || isExpoGo) {
      if (this.mockService) {
        return await this.mockService.getCustomerInfo();
      }
      return null;
    }

    try {
      return await Purchases.getCustomerInfo();
    } catch (error) {
      console.error('[RevenueCat] Error getting customer info:', error);
      return null;
    }
  }

  isPremium(customerInfo: any): boolean {
    if (this.mockService && customerInfo) {
      return this.mockService.isPremium(customerInfo);
    }
    return customerInfo?.entitlements?.active?.[ENTITLEMENT_ID] !== undefined;
  }

  async checkPremiumStatus(): Promise<boolean> {
    if (!Purchases || isExpoGo) {
      if (this.mockService) {
        return await this.mockService.checkPremiumStatus();
      }
      return false;
    }
    
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
}

export default new RevenueCatService();