import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { getCustomerInfo } from '~/features/subscription/subscriptionService';

export const useCurrentSubscription = () => {
  const [subscriptionInfo, setSubscriptionInfo] = useState<string>('Free User');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        if (Platform.OS === 'web') {
          setSubscriptionInfo('Web User');
          return;
        }

        const customerInfo = await getCustomerInfo();
        
        // Check for active entitlements
        if (customerInfo?.entitlements?.active) {
          const activeEntitlements = Object.keys(customerInfo.entitlements.active);
          if (activeEntitlements.length > 0) {
            // Get the first active entitlement
            const entitlement = customerInfo.entitlements.active[activeEntitlements[0]];
            const productId = entitlement.productIdentifier;
            
            // Map product IDs to friendly names
            if (productId.includes('pro')) {
              setSubscriptionInfo('Pro');
            } else if (productId.includes('premium')) {
              setSubscriptionInfo('Premium');
            } else if (productId.includes('team')) {
              setSubscriptionInfo('Team');
            } else if (productId.includes('enterprise')) {
              setSubscriptionInfo('Enterprise');
            } else {
              setSubscriptionInfo('Active Subscription');
            }
          } else {
            setSubscriptionInfo('Free User');
          }
        }
      } catch (error) {
        console.log('Error fetching subscription:', error);
        setSubscriptionInfo('Free User');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  return { subscriptionInfo, isLoading };
};