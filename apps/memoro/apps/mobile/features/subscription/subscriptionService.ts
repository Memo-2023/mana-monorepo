import { Platform } from 'react-native';
import { getAllProductIds, subscriptionIdToProductId, packageIdToProductId } from './productIds';
import Constants from 'expo-constants';

/**
 * Lazy-load RevenueCat Purchases SDK
 * This prevents loading the module for B2B users who have RevenueCat disabled
 */
let PurchasesInstance: any = null;
const getPurchases = () => {
  if (!PurchasesInstance) {
    const RevenueCatModule = require('react-native-purchases');
    PurchasesInstance = RevenueCatModule.default;
  }
  return PurchasesInstance;
};
import {
  RevenueCatSubscriptionPlan,
  RevenueCatManaPackage,
  SubscriptionServiceData,
} from './subscriptionTypes';
import subscriptionData from './subscriptionData.json';

// RevenueCat API keys from environment variables
const REVENUECAT_API_KEYS = {
  ios:
    Constants.expoConfig?.extra?.EXPO_PUBLIC_REVENUECAT_IOS_KEY ||
    'appl_CDlFSFvFhsIwmLXWghdRCnoKOzc',
  android: Constants.expoConfig?.extra?.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '',
};

// Track if RevenueCat was successfully initialized
let isRevenueCatInitialized = false;

/**
 * Initialize the RevenueCat SDK
 */
export const initializeRevenueCat = async (): Promise<void> => {
  // Check if already initialized
  if (isRevenueCatInitialized) {
    console.debug('RevenueCat already initialized, skipping');
    return;
  }

  try {
    const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEYS.ios : REVENUECAT_API_KEYS.android;

    // Check if API key is available
    if (!apiKey || apiKey.trim() === '') {
      console.debug(
        `RevenueCat API key not configured for ${Platform.OS}, skipping initialization`
      );
      return;
    }

    // Enable verbose logging in development mode
    if (__DEV__) {
      getPurchases().setLogLevel(getPurchases().LOG_LEVEL.VERBOSE);
    }

    // TypeScript-Konfiguration für RevenueCat
    const configOptions: any = {
      apiKey,
      appUserID: null, // This will use an anonymous ID that RevenueCat generates
      useAmazon: false,
    };

    // Nur im Entwicklungsmodus: StoreKit-Testkonfiguration aktivieren
    if (__DEV__) {
      // Diese Optionen sind in den TypeScript-Definitionen nicht enthalten,
      // aber in der Dokumentation beschrieben
      Object.assign(configOptions, {
        // Aktiviere StoreKit 2, wenn verfügbar
        usesStoreKit2IfAvailable: true,
        // Simuliere "Ask to Buy" im Sandbox-Modus
        simulatesAskToBuyInSandbox: true,
        // Aktiviere detailliertes Debugging
        dangerousSettings: {
          autoSyncPurchases: true,
        },
        // For sandbox testing, we can bypass the Apple In-App Purchase Key requirement
        // This only works in sandbox mode and should not be used in production
        observerMode: true,
      });
    }

    await getPurchases().configure(configOptions);

    isRevenueCatInitialized = true;
    console.debug('RevenueCat SDK initialized successfully');

    // Log available products in development mode
    if (__DEV__) {
      try {
        const offerings = await getPurchases().getOfferings();

        // Versuche, detaillierte Informationen über die Produkte zu erhalten
        console.debug('Checking individual products...');
        try {
          const productIds = getAllProductIds();
          console.debug('Product IDs to check:', productIds);

          // Versuche, die Produkte direkt von RevenueCat zu laden
          // Fetch both subscription and consumable products
          const subscriptionProducts = await getPurchases().getProducts(
            productIds,
            getPurchases().PURCHASE_TYPE.SUBS
          );
          const consumableProducts = await getPurchases().getProducts(
            productIds,
            getPurchases().PRODUCT_CATEGORY.NON_SUBSCRIPTION
          );
          console.debug('Subscription products from RevenueCat:', subscriptionProducts);
          console.debug('Consumable products from RevenueCat:', consumableProducts);
        } catch (productsError) {
          console.debug('Error fetching individual products:', productsError);
        }
      } catch (offeringsError) {
        console.debug('Error fetching offerings:', offeringsError);
        console.debug("This is normal if you haven't configured products in RevenueCat yet.");
      }
    }
  } catch (error) {
    console.debug('Error initializing RevenueCat:', error);
    // Don't throw the error, just log it
    // This allows the app to continue working even if RevenueCat initialization fails
  }
};

/**
 * Set the user ID for RevenueCat
 * Call this when the user logs in
 */
export const identifyUser = async (userId: string): Promise<void> => {
  if (!isRevenueCatInitialized) {
    console.debug('RevenueCat not initialized, skipping user identification');
    return;
  }

  try {
    await getPurchases().logIn(userId);
    console.debug('User identified with RevenueCat:', userId);
  } catch (error) {
    console.debug('Error identifying user with RevenueCat:', error);
    throw error;
  }
};

/**
 * Reset the user ID for RevenueCat
 * Call this when the user logs out
 */
export const resetUser = async (): Promise<void> => {
  if (!isRevenueCatInitialized) {
    console.debug('RevenueCat not initialized, skipping user reset');
    return;
  }

  try {
    await getPurchases().logOut();
    console.debug('User reset with RevenueCat');
  } catch (error) {
    console.debug('Error resetting user with RevenueCat:', error);
    throw error;
  }
};

/**
 * Get all available offerings
 */
export const getOfferings = async (): Promise<any | null> => {
  if (!isRevenueCatInitialized) {
    console.debug('RevenueCat not initialized, returning null offerings');
    return null;
  }

  try {
    const offerings = await getPurchases().getOfferings();

    // Return the current offering or the first available one
    if (offerings.current) {
      return offerings.current;
    } else if (offerings.all && Object.keys(offerings.all).length > 0) {
      // If no current offering is set, use the first available one
      const firstOfferingId = Object.keys(offerings.all)[0];
      return offerings.all[firstOfferingId];
    }

    return null;
  } catch (error) {
    console.debug('Error getting offerings:', error);
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
    nameIt: fallbackData.nameIt,
    price: product.price,
    priceString: product.priceString,
    currencyCode: product.currencyCode,
    initialMana: fallbackData.initialMana,
    dailyMana: fallbackData.dailyMana,
    maxMana: fallbackData.maxMana,
    canGiftMana: fallbackData.canGiftMana,
    popular: fallbackData.popular,
    billingCycle: fallbackData.billingCycle as 'monthly' | 'yearly',
    isTeamSubscription: fallbackData.isTeamSubscription,
    isEnterpriseSubscription: fallbackData.isEnterpriseSubscription,
    features: fallbackData.features,
    monthlyEquivalent: fallbackData.monthlyEquivalent,
    priceBreakdown: fallbackData.priceBreakdown,
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
    nameIt: fallbackData.nameIt,
    price: fallbackData.price,
    priceString: `${fallbackData.price.toFixed(2).replace('.', ',')}€`,
    currencyCode: 'EUR',
    initialMana: fallbackData.initialMana,
    dailyMana: fallbackData.dailyMana,
    maxMana: fallbackData.maxMana,
    canGiftMana: fallbackData.canGiftMana,
    popular: fallbackData.popular,
    billingCycle: fallbackData.billingCycle as 'monthly' | 'yearly',
    isTeamSubscription: fallbackData.isTeamSubscription,
    isEnterpriseSubscription: fallbackData.isEnterpriseSubscription,
    features: fallbackData.features,
    monthlyEquivalent: fallbackData.monthlyEquivalent,
    priceBreakdown: fallbackData.priceBreakdown,
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
    nameIt: fallbackData.nameIt,
    manaAmount: fallbackData.manaAmount,
    price: fallbackData.price,
    priceString: `${fallbackData.price.toFixed(2).replace('.', ',')}€`,
    currencyCode: 'EUR',
    isTeamPackage: fallbackData.isTeamPackage,
    isEnterprisePackage: fallbackData.isEnterprisePackage,
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
    // Get offerings for subscriptions
    const offerings = await getOfferings();

    // Get consumable products separately
    let consumableProducts: any[] = [];
    try {
      const manaProductIds = Object.values(packageIdToProductId);
      consumableProducts = await getPurchases().getProducts(
        manaProductIds,
        getPurchases().PRODUCT_CATEGORY.NON_SUBSCRIPTION
      );
      console.debug('Loaded consumable products:', consumableProducts.length);
    } catch (error) {
      console.debug('Failed to load consumable products:', error);
    }

    if (offerings && offerings.availablePackages.length > 0) {
      console.debug('Using RevenueCat offerings for subscription data');

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
          // Create a pseudo-package for the consumable product
          const manaPackage: RevenueCatManaPackage = {
            id: fallbackPackage.id,
            name: fallbackPackage.name,
            nameEn: fallbackPackage.nameEn || fallbackPackage.name,
            nameIt: fallbackPackage.nameIt || fallbackPackage.name,
            manaAmount: fallbackPackage.manaAmount,
            price: product.price,
            priceString: product.priceString,
            currencyCode: product.currencyCode,
            isTeamPackage: fallbackPackage.isTeamPackage || false,
            isEnterprisePackage: fallbackPackage.isEnterprisePackage || false,
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
    console.debug('Failed to get RevenueCat offerings, using fallback data:', error);
  }

  // Fallback to JSON data
  console.debug('Using fallback JSON data for subscriptions');

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
    return await getPurchases().getCustomerInfo();
  } catch (error) {
    console.debug('Error getting customer info:', error);
    throw error;
  }
};

/**
 * Check if user has active subscription
 */
export const hasActiveSubscription = async (): Promise<boolean> => {
  try {
    const customerInfo = await getPurchases().getCustomerInfo();
    return customerInfo.entitlements.active.premium !== undefined;
  } catch (error) {
    console.debug('Error checking subscription status:', error);
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
  console.log(
    `[RevenueCat] Starting purchase for: ${subscriptionId} (${billingCycle}) on ${Platform.OS}`
  );

  try {
    // Get current subscription data to find the RevenueCat package
    const subscriptionData = await getSubscriptionData();
    console.log('[RevenueCat] Got subscription data:', {
      subscriptionsCount: subscriptionData.subscriptions.length,
      isFromRevenueCat: subscriptionData.isFromRevenueCat,
    });

    // Find the subscription plan
    const plan = subscriptionData.subscriptions.find(
      (sub) => sub.id === subscriptionId && sub.billingCycle === billingCycle
    );

    if (!plan) {
      console.error(
        `[RevenueCat] Subscription plan not found: ${subscriptionId} (${billingCycle})`
      );
      console.error(
        '[RevenueCat] Available plans:',
        subscriptionData.subscriptions.map((s) => `${s.id} (${s.billingCycle})`)
      );
      throw new Error(`Subscription plan not found: ${subscriptionId} (${billingCycle})`);
    }

    console.log('[RevenueCat] Found plan:', {
      id: plan.id,
      productId: plan.productId,
      hasRevenueCatPackage: !!plan.revenueCatPackage,
    });

    // If we have a RevenueCat package, use it directly
    if (plan.revenueCatPackage) {
      console.log(`[RevenueCat] Purchasing via package: ${plan.revenueCatPackage.identifier}`);
      const { customerInfo } = await getPurchases().purchasePackage(plan.revenueCatPackage);
      console.log('[RevenueCat] Purchase successful via package');
      return customerInfo;
    }

    // Fallback: try to find the package by product ID
    const productId = plan.productId;
    console.log(`[RevenueCat] No package found, attempting with product ID: ${productId}`);

    if (!productId) {
      console.error('[RevenueCat] No product ID available for plan:', plan);
      throw new Error(`No product ID available for plan: ${subscriptionId}`);
    }

    // Try to get offerings first
    console.log('[RevenueCat] Fetching offerings...');
    const offerings = await getPurchases().getOfferings();
    console.log('[RevenueCat] Offerings received:', {
      hasCurrent: !!offerings.current,
      packagesCount: offerings.current?.availablePackages?.length || 0,
      allOfferingsCount: Object.keys(offerings.all || {}).length,
    });

    // Check if we have offerings with packages
    if (offerings.current && offerings.current.availablePackages.length > 0) {
      console.log(
        '[RevenueCat] Available packages:',
        offerings.current.availablePackages.map((p: any) => ({
          identifier: p.identifier,
          productId: p.product.identifier,
        }))
      );

      // Find the package with the matching product ID
      let packageToPurchase: any | null = null;

      for (const package_ of offerings.current.availablePackages) {
        if (package_.product.identifier === productId) {
          packageToPurchase = package_;
          break;
        }
      }

      if (packageToPurchase) {
        console.log('[RevenueCat] Found matching package, purchasing...');
        const { customerInfo } = await getPurchases().purchasePackage(packageToPurchase);
        console.log('[RevenueCat] Purchase successful via found package');
        return customerInfo;
      } else {
        console.warn('[RevenueCat] No matching package found for product ID:', productId);
      }
    }

    // No offerings or package not found - purchase product directly
    console.log(`[RevenueCat] Attempting direct product purchase for: ${productId}`);

    // Get subscription products
    console.log('[RevenueCat] Fetching products...');
    const products = await getPurchases().getProducts([productId], getPurchases().PURCHASE_TYPE.SUBS);
    console.log('[RevenueCat] Products fetched:', products?.length || 0);

    if (!products || products.length === 0) {
      console.error(`[RevenueCat] Product not found: ${productId}`);
      console.error('[RevenueCat] Platform:', Platform.OS);
      console.error('[RevenueCat] Expected product ID mapping:', {
        subscriptionId,
        billingCycle,
        mappedProductId: productId,
      });

      // Try alternative product IDs for Android
      if (Platform.OS === 'android') {
        console.log('[RevenueCat] Trying Android-specific product ID format...');
        const androidProductIds = [
          productId.replace(':', '.'), // Try with dot instead of colon
          productId.split(':')[0], // Try base product ID without suffix
          `${productId.split(':')[0]}_${billingCycle}`, // Try with underscore format
        ];

        for (const altProductId of androidProductIds) {
          console.log(`[RevenueCat] Trying alternative product ID: ${altProductId}`);
          const altProducts = await getPurchases().getProducts(
            [altProductId],
            getPurchases().PURCHASE_TYPE.SUBS
          );
          if (altProducts && altProducts.length > 0) {
            console.log('[RevenueCat] Found product with alternative ID!');
            const productToPurchase = altProducts[0];
            const { customerInfo } = await getPurchases().purchaseStoreProduct(productToPurchase);
            console.log('[RevenueCat] Purchase successful with alternative product ID');
            return customerInfo;
          }
        }
      }

      throw new Error(
        `Product not found in store: ${productId}. Please check Play Console configuration.`
      );
    }

    const productToPurchase = products[0];
    console.log(`[RevenueCat] Purchasing product: ${productToPurchase.identifier}`);

    // Purchase the subscription product directly
    const { customerInfo } = await getPurchases().purchaseStoreProduct(productToPurchase);
    console.log('[RevenueCat] Purchase successful via direct product');
    return customerInfo;
  } catch (error: any) {
    console.error('[RevenueCat] Purchase error:', error);
    console.error('[RevenueCat] Error details:', {
      message: error.message,
      code: error.code,
      userCancelled: error.userCancelled,
      platform: Platform.OS,
      subscriptionId,
      billingCycle,
    });
    throw error;
  }
};

/**
 * Purchase a mana package using RevenueCat
 * Mana packages are consumable products, not subscription packages
 */
export const purchaseManaPackage = async (packageId: string): Promise<any> => {
  try {
    // Get current subscription data to find the mana package
    const subscriptionData = await getSubscriptionData();

    // Find the mana package
    const manaPackage = subscriptionData.packages.find((pkg) => pkg.id === packageId);

    if (!manaPackage) {
      throw new Error(`Mana package not found: ${packageId}`);
    }

    const productId = manaPackage.productId;
    console.debug(`Attempting to purchase mana package (consumable) with product ID: ${productId}`);

    // For consumable products, we need to use purchaseStoreProduct instead of purchasePackage
    // First, get the products
    const products = await getPurchases().getProducts(
      [productId],
      getPurchases().PRODUCT_CATEGORY.NON_SUBSCRIPTION
    );

    if (!products || products.length === 0) {
      throw new Error(`Product not found: ${productId}`);
    }

    const productToPurchase = products[0];
    console.debug(`Found product to purchase:`, productToPurchase);

    // Purchase the consumable product
    const { customerInfo } = await getPurchases().purchaseStoreProduct(productToPurchase);
    console.debug('Purchase successful, customer info:', customerInfo);

    return customerInfo;
  } catch (error) {
    console.debug('Error purchasing mana package:', error);
    throw error;
  }
};

/**
 * Restore purchases
 */
export const restorePurchases = async (): Promise<any> => {
  try {
    const customerInfo = await getPurchases().restorePurchases();
    return customerInfo;
  } catch (error) {
    console.debug('Error restoring purchases:', error);
    throw error;
  }
};
