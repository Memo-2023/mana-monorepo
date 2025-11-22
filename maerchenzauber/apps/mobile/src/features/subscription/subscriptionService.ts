import { Platform } from 'react-native';
import Constants from 'expo-constants';
import {
  RevenueCatSubscriptionPlan,
  RevenueCatManaPackage,
  SubscriptionServiceData,
} from './subscriptionTypes';
import {
  getAllProductIds,
  subscriptionIdToProductId,
  packageIdToProductId,
  getSubscriptionProductIds,
  getPackageProductIds,
} from './productIds';
import subscriptionData from './subscriptionData.json';

// RevenueCat API keys from environment variables
const REVENUECAT_API_KEYS = {
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '',
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '',
};

// Track if RevenueCat was successfully initialized
let isRevenueCatInitialized = false;

/**
 * Lazy load RevenueCat module to avoid initialization errors
 */
function getPurchases() {
  const RevenueCatModule = require('react-native-purchases');
  return RevenueCatModule.default;
}

/**
 * Initialize the RevenueCat SDK
 */
export const initializeRevenueCat = async (): Promise<void> => {
  // Check if already initialized
  if (isRevenueCatInitialized) {
    console.log('[RevenueCat] Already initialized, skipping');
    return;
  }

  try {
    const Purchases = getPurchases();
    const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEYS.ios : REVENUECAT_API_KEYS.android;

    // Check if API key is available
    if (!apiKey || apiKey.trim() === '') {
      console.log(`[RevenueCat] API key not configured for ${Platform.OS}, skipping initialization`);
      return;
    }

    // Enable verbose logging in development mode
    if (__DEV__) {
      Purchases.setLogLevel(Purchases.LOG_LEVEL.VERBOSE);
    }

    // Configure RevenueCat
    const configOptions: any = {
      apiKey,
      appUserID: null, // This will use an anonymous ID that RevenueCat generates
      useAmazon: false,
    };

    // Development mode settings
    if (__DEV__) {
      Object.assign(configOptions, {
        usesStoreKit2IfAvailable: true,
        simulatesAskToBuyInSandbox: true,
        dangerousSettings: {
          autoSyncPurchases: true,
        },
      });
    }

    await Purchases.configure(configOptions);

    isRevenueCatInitialized = true;
    console.log('[RevenueCat] SDK initialized successfully');

    // Log available products in development mode
    if (__DEV__) {
      try {
        const offerings = await Purchases.getOfferings();
        console.log('[RevenueCat] Offerings available:', {
          current: offerings.current?.identifier,
          packagesCount: offerings.current?.availablePackages?.length || 0,
        });

        // Try to fetch individual products
        const productIds = getAllProductIds();
        console.log('[RevenueCat] Product IDs to check:', productIds);

        const subscriptionProducts = await Purchases.getProducts(
          getSubscriptionProductIds(),
          Purchases.PURCHASE_TYPE.SUBS
        );
        console.log('[RevenueCat] Subscription products loaded:', subscriptionProducts.length);

        const consumableProducts = await Purchases.getProducts(
          getPackageProductIds(),
          Purchases.PRODUCT_CATEGORY.NON_SUBSCRIPTION
        );
        console.log('[RevenueCat] Consumable products loaded:', consumableProducts.length);
      } catch (error) {
        console.log('[RevenueCat] Error fetching products:', error);
      }
    }
  } catch (error) {
    console.error('[RevenueCat] Error initializing:', error);
    // Don't throw - allow app to continue with fallback data
  }
};

/**
 * Set the user ID for RevenueCat
 * Call this when the user logs in
 */
export const identifyUser = async (userId: string): Promise<void> => {
  if (!isRevenueCatInitialized) {
    console.log('[RevenueCat] Not initialized, skipping user identification');
    return;
  }

  try {
    const Purchases = getPurchases();
    await Purchases.logIn(userId);
    console.log('[RevenueCat] User identified:', userId);
  } catch (error) {
    console.error('[RevenueCat] Error identifying user:', error);
    throw error;
  }
};

/**
 * Reset the user ID for RevenueCat
 * Call this when the user logs out
 */
export const resetUser = async (): Promise<void> => {
  if (!isRevenueCatInitialized) {
    console.log('[RevenueCat] Not initialized, skipping user reset');
    return;
  }

  try {
    const Purchases = getPurchases();
    await Purchases.logOut();
    console.log('[RevenueCat] User reset to anonymous');
  } catch (error) {
    console.error('[RevenueCat] Error resetting user:', error);
    throw error;
  }
};

/**
 * Get all available offerings
 */
export const getOfferings = async (): Promise<any | null> => {
  if (!isRevenueCatInitialized) {
    console.log('[RevenueCat] Not initialized, returning null offerings');
    return null;
  }

  try {
    const Purchases = getPurchases();
    const offerings = await Purchases.getOfferings();

    // Return the current offering or the first available one
    if (offerings.current) {
      return offerings.current;
    } else if (offerings.all && Object.keys(offerings.all).length > 0) {
      const firstOfferingId = Object.keys(offerings.all)[0];
      return offerings.all[firstOfferingId];
    }

    return null;
  } catch (error) {
    console.error('[RevenueCat] Error getting offerings:', error);
    throw error;
  }
};

/**
 * Map RevenueCat package to our subscription plan format
 */
const mapRevenueCatPackageToSubscription = (
  rcPackage: any,
  fallbackData: any
): RevenueCatSubscriptionPlan => {
  const product = rcPackage.product;

  return {
    id: fallbackData.id,
    name: fallbackData.name,
    nameEn: fallbackData.nameEn,
    price: product.price,
    priceString: product.priceString,
    currencyCode: product.currencyCode,
    mana: fallbackData.mana,
    popular: fallbackData.popular,
    billingCycle: fallbackData.billingCycle as 'monthly' | 'yearly',
    revenueCatPackage: rcPackage,
    revenueCatProduct: product,
    productId: product.identifier,
  };
};

/**
 * Map fallback subscription to our format
 */
const mapFallbackToSubscription = (fallbackData: any): RevenueCatSubscriptionPlan => {
  return {
    id: fallbackData.id,
    name: fallbackData.name,
    nameEn: fallbackData.nameEn,
    price: fallbackData.price,
    priceString: `${fallbackData.price.toFixed(2).replace('.', ',')} €`,
    currencyCode: 'EUR',
    mana: fallbackData.mana,
    popular: fallbackData.popular,
    billingCycle: fallbackData.billingCycle as 'monthly' | 'yearly',
    productId:
      subscriptionIdToProductId[fallbackData.id as keyof typeof subscriptionIdToProductId] ||
      fallbackData.id,
  };
};

/**
 * Map fallback package to our format
 */
const mapFallbackToManaPackage = (fallbackData: any): RevenueCatManaPackage => {
  return {
    id: fallbackData.id,
    name: fallbackData.name,
    nameEn: fallbackData.nameEn,
    manaAmount: fallbackData.manaAmount,
    price: fallbackData.price,
    priceString: `${fallbackData.price.toFixed(2).replace('.', ',')} €`,
    currencyCode: 'EUR',
    popular: fallbackData.popular,
    productId:
      packageIdToProductId[fallbackData.id as keyof typeof packageIdToProductId] || fallbackData.id,
  };
};

/**
 * Get subscription data from RevenueCat with fallback to JSON
 */
export const getSubscriptionData = async (): Promise<SubscriptionServiceData> => {
  try {
    const Purchases = getPurchases();

    // Get offerings for subscriptions
    const offerings = await getOfferings();

    // Get consumable products separately
    let consumableProducts: any[] = [];
    try {
      const manaProductIds = getPackageProductIds();
      consumableProducts = await Purchases.getProducts(
        manaProductIds,
        Purchases.PRODUCT_CATEGORY.NON_SUBSCRIPTION
      );
      console.log('[RevenueCat] Loaded consumable products:', consumableProducts.length);
    } catch (error) {
      console.log('[RevenueCat] Failed to load consumable products:', error);
    }

    if (offerings && offerings.availablePackages.length > 0) {
      console.log('[RevenueCat] Using RevenueCat offerings for subscription data');

      const subscriptions: RevenueCatSubscriptionPlan[] = [];
      const packages: RevenueCatManaPackage[] = [];

      // Map RevenueCat packages to our data structure
      for (const rcPackage of offerings.availablePackages) {
        const productId = rcPackage.product.identifier;

        // Find matching subscription from fallback data
        const fallbackSubscription = (subscriptionData as any).subscriptions.find(
          (sub: any) =>
            subscriptionIdToProductId[sub.id as keyof typeof subscriptionIdToProductId] ===
            productId
        );

        if (fallbackSubscription) {
          subscriptions.push(mapRevenueCatPackageToSubscription(rcPackage, fallbackSubscription));
        }
      }

      // Map consumable products to mana packages
      for (const product of consumableProducts) {
        const productId = product.identifier;

        // Find matching package from fallback data
        const fallbackPackage = (subscriptionData as any).packages.find(
          (pkg: any) =>
            packageIdToProductId[pkg.id as keyof typeof packageIdToProductId] === productId
        );

        if (fallbackPackage) {
          const manaPackage: RevenueCatManaPackage = {
            id: fallbackPackage.id,
            name: fallbackPackage.name,
            nameEn: fallbackPackage.nameEn || fallbackPackage.name,
            manaAmount: fallbackPackage.manaAmount,
            price: product.price,
            priceString: product.priceString,
            currencyCode: product.currencyCode,
            popular: fallbackPackage.popular || false,
            revenueCatProduct: product,
            productId: product.identifier,
          };
          packages.push(manaPackage);
        }
      }

      // Add unmapped subscriptions and packages from fallback data
      for (const fallbackSub of (subscriptionData as any).subscriptions) {
        const exists = subscriptions.some((sub) => sub.id === fallbackSub.id);
        if (!exists) {
          subscriptions.push(mapFallbackToSubscription(fallbackSub));
        }
      }

      for (const fallbackPkg of subscriptionData.packages as any[]) {
        const exists = packages.some((pkg) => pkg.id === fallbackPkg.id);
        if (!exists) {
          packages.push(mapFallbackToManaPackage(fallbackPkg));
        }
      }

      return {
        subscriptions,
        packages,
        isFromRevenueCat: true,
        lastUpdated: new Date(),
      };
    }
  } catch (error) {
    console.log('[RevenueCat] Failed to get offerings, using fallback data:', error);
  }

  // Fallback to JSON data
  console.log('[RevenueCat] Using fallback JSON data for subscriptions');

  const subscriptions = (subscriptionData.subscriptions as any[]).map(mapFallbackToSubscription);
  const packages = (subscriptionData.packages as any[]).map(mapFallbackToManaPackage);

  return {
    subscriptions,
    packages,
    isFromRevenueCat: false,
    lastUpdated: new Date(),
  };
};

/**
 * Get customer info
 */
export const getCustomerInfo = async (): Promise<any> => {
  try {
    const Purchases = getPurchases();
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.error('[RevenueCat] Error getting customer info:', error);
    throw error;
  }
};

/**
 * Check if user has active subscription
 */
export const hasActiveSubscription = async (): Promise<boolean> => {
  try {
    const Purchases = getPurchases();
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active.premium !== undefined;
  } catch (error) {
    console.error('[RevenueCat] Error checking subscription status:', error);
    return false;
  }
};

/**
 * Purchase a subscription using RevenueCat package
 */
export const purchaseSubscription = async (
  subscriptionId: string,
  billingCycle: 'monthly' | 'yearly'
): Promise<any> => {
  console.log(`[RevenueCat] Starting purchase for: ${subscriptionId} (${billingCycle}) on ${Platform.OS}`);

  try {
    const Purchases = getPurchases();

    // Get current subscription data to find the RevenueCat package
    const subscriptionData = await getSubscriptionData();
    console.log('[RevenueCat] Got subscription data:', {
      subscriptionsCount: subscriptionData.subscriptions.length,
      isFromRevenueCat: subscriptionData.isFromRevenueCat,
    });

    // Create the full internal ID (e.g., 'small_monthly')
    const fullSubscriptionId = `${subscriptionId}_${billingCycle}`;

    // Find the subscription plan
    const plan = subscriptionData.subscriptions.find(
      (sub) => sub.id === fullSubscriptionId
    );

    if (!plan) {
      console.error(`[RevenueCat] Subscription plan not found: ${fullSubscriptionId}`);
      console.error(
        '[RevenueCat] Available plans:',
        subscriptionData.subscriptions.map((s) => s.id)
      );
      throw new Error(`Subscription plan not found: ${fullSubscriptionId}`);
    }

    console.log('[RevenueCat] Found plan:', {
      id: plan.id,
      productId: plan.productId,
      hasRevenueCatPackage: !!plan.revenueCatPackage,
    });

    // If we have a RevenueCat package, use it directly
    if (plan.revenueCatPackage) {
      console.log(`[RevenueCat] Purchasing via package: ${plan.revenueCatPackage.identifier}`);
      const { customerInfo } = await Purchases.purchasePackage(plan.revenueCatPackage);
      console.log('[RevenueCat] Purchase successful via package');
      return customerInfo;
    }

    // Fallback: purchase product directly
    const productId = plan.productId;
    console.log(`[RevenueCat] Purchasing product directly: ${productId}`);

    const products = await Purchases.getProducts([productId], Purchases.PURCHASE_TYPE.SUBS);

    if (!products || products.length === 0) {
      console.error(`[RevenueCat] Product not found: ${productId}`);
      throw new Error(`Product not found in store: ${productId}`);
    }

    const productToPurchase = products[0];
    const { customerInfo } = await Purchases.purchaseStoreProduct(productToPurchase);
    console.log('[RevenueCat] Purchase successful via direct product');
    return customerInfo;
  } catch (error: any) {
    console.error('[RevenueCat] Purchase error:', error);
    throw error;
  }
};

/**
 * Purchase a mana package using RevenueCat
 */
export const purchaseManaPackage = async (packageId: string): Promise<any> => {
  console.log(`[RevenueCat] Starting mana package purchase: ${packageId}`);

  try {
    const Purchases = getPurchases();

    // Get current subscription data to find the mana package
    const subscriptionData = await getSubscriptionData();

    // Find the mana package
    const manaPackage = subscriptionData.packages.find((pkg) => pkg.id === packageId);

    if (!manaPackage) {
      throw new Error(`Mana package not found: ${packageId}`);
    }

    const productId = manaPackage.productId;
    console.log(`[RevenueCat] Purchasing consumable with product ID: ${productId}`);

    // Get the products
    const products = await Purchases.getProducts(
      [productId],
      Purchases.PRODUCT_CATEGORY.NON_SUBSCRIPTION
    );

    if (!products || products.length === 0) {
      throw new Error(`Product not found: ${productId}`);
    }

    const productToPurchase = products[0];
    console.log(`[RevenueCat] Found product:`, productToPurchase.identifier);

    // Purchase the consumable product
    const { customerInfo } = await Purchases.purchaseStoreProduct(productToPurchase);
    console.log('[RevenueCat] Mana package purchase successful');

    return customerInfo;
  } catch (error) {
    console.error('[RevenueCat] Error purchasing mana package:', error);
    throw error;
  }
};

/**
 * Restore purchases
 */
export const restorePurchases = async (): Promise<any> => {
  try {
    const Purchases = getPurchases();
    console.log('[RevenueCat] Restoring purchases');
    const customerInfo = await Purchases.restorePurchases();
    console.log('[RevenueCat] Purchases restored');
    return customerInfo;
  } catch (error) {
    console.error('[RevenueCat] Error restoring purchases:', error);
    throw error;
  }
};
