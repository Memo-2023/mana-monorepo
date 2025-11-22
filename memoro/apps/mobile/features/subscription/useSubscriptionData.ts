import { useState, useEffect } from 'react';
import { getSubscriptionData } from './subscriptionService';
import { SubscriptionServiceData } from './subscriptionTypes';

/**
 * Custom hook for managing subscription data from RevenueCat
 */
export const useSubscriptionData = () => {
  const [data, setData] = useState<SubscriptionServiceData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubscriptionData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const subscriptionData = await getSubscriptionData();
      setData(subscriptionData);
    } catch (err) {
      console.error('Failed to load subscription data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load subscription data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const refresh = () => {
    loadSubscriptionData();
  };

  return {
    data,
    isLoading,
    error,
    refresh,
    isFromRevenueCat: data?.isFromRevenueCat || false
  };
};