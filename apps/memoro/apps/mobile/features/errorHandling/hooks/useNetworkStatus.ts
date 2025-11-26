import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
  isOffline: boolean;
}

/**
 * React hook for monitoring network connectivity status
 * Uses @react-native-community/netinfo for accurate detection
 */
export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true, // Start with optimistic assumption
    isInternetReachable: null,
    type: 'unknown',
    isOffline: false,
  });

  const updateNetworkStatus = useCallback((state: NetInfoState) => {
    const isOffline = state.isConnected === false || state.isInternetReachable === false;
    
    setNetworkStatus({
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      type: state.type || 'unknown',
      isOffline,
    });
  }, []);

  useEffect(() => {
    // Get initial network state
    NetInfo.fetch().then(updateNetworkStatus);

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(updateNetworkStatus);

    return () => {
      unsubscribe();
    };
  }, [updateNetworkStatus]);

  /**
   * Manually refresh network status
   */
  const refresh = useCallback(async () => {
    const state = await NetInfo.fetch();
    updateNetworkStatus(state);
    return state;
  }, [updateNetworkStatus]);

  return {
    ...networkStatus,
    refresh,
  };
}