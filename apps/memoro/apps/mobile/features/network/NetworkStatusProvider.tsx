import React, { createContext, useContext, useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useTranslation } from 'react-i18next';

interface NetworkStatusContextType {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  networkType: string;
  details: NetInfoState | null;
}

const NetworkStatusContext = createContext<NetworkStatusContextType>({
  isConnected: true,
  isInternetReachable: true,
  networkType: 'unknown',
  details: null,
});

export const useNetworkStatus = () => useContext(NetworkStatusContext);

export const NetworkStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [networkState, setNetworkState] = useState<NetInfoState | null>(null);
  const [previousState, setPreviousState] = useState<NetInfoState | null>(null);
  const { isDark } = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    let reconnectionTimeout: ReturnType<typeof setTimeout> | null = null;

    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(state => {
      console.debug('Network state changed:', {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });

      // Detect transition from offline to online
      if (previousState && 
          (!previousState.isConnected || !previousState.isInternetReachable) &&
          state.isConnected && state.isInternetReachable) {
        
        console.log('🌐 Network reconnected: Offline -> Online transition detected');
        
        // Clear any existing timeout
        if (reconnectionTimeout) {
          clearTimeout(reconnectionTimeout);
        }
        
        // Wait for connection to stabilize before triggering reconnection logic
        reconnectionTimeout = setTimeout(async () => {
          console.log('🌐 Network stabilized, triggering reconnection handlers');
          
          // Import tokenManager and TokenState dynamically to avoid circular dependencies
          try {
            const { tokenManager, TokenState } = await import('~/features/auth/services/tokenManager');
            const tokenState = tokenManager.getState();
            console.log('Current token state after reconnection:', tokenState);

            // If token expired while offline, attempt refresh now
            if (tokenState === TokenState.EXPIRED_OFFLINE) {
              console.log('🔄 Token expired offline, attempting refresh after reconnection');
              const refreshed = await tokenManager.retryRefreshIfNeeded();

              if (refreshed) {
                console.log('✅ Token refreshed successfully after reconnection');
              } else {
                console.warn('⚠️ Token refresh failed after reconnection');
              }
            } else {
              console.log('Token state is:', tokenState, '- no refresh needed');
            }
          } catch (error) {
            console.error('Error checking/refreshing token after reconnection:', error);
          }
          
          // Trigger realtime reconnection for memos
          try {
            const { default: memoRealtimeService } = await import('~/features/memos/services/memoRealtimeService');
            const status = memoRealtimeService.getStatus();
            if (status.isInitialized && !status.hasActiveSubscription) {
              console.log('🔄 Reconnecting memo realtime subscriptions');
              await memoRealtimeService.initialize();
            }
          } catch (error) {
            console.error('Error reconnecting memo realtime:', error);
          }

          // Note: Automatic upload retry removed - users must manually retry uploads
          // Manual upload functionality remains available through the UI
          
        }, 2000); // 2 second delay for connection stability
      }
      
      setPreviousState(networkState);
      setNetworkState(state);
    });

    // Get initial state
    NetInfo.fetch().then(state => {
      setNetworkState(state);
    });

    return () => {
      unsubscribe();
      if (reconnectionTimeout) {
        clearTimeout(reconnectionTimeout);
      }
    };
  }, [networkState]);

  const value: NetworkStatusContextType = {
    isConnected: networkState?.isConnected ?? true,
    isInternetReachable: networkState?.isInternetReachable ?? null,
    networkType: networkState?.type ?? 'unknown',
    details: networkState,
  };

  return (
    <NetworkStatusContext.Provider value={value}>
      {children}
      {/* Offline banner */}
      {networkState && !networkState.isConnected && (
        <View style={[styles.offlineBanner, { backgroundColor: isDark ? '#ff6b6b' : '#e74c3c' }]}>
          <Text style={styles.offlineText}>
            {t('common.offline', 'No internet connection')}
          </Text>
        </View>
      )}
    </NetworkStatusContext.Provider>
  );
};

const styles = StyleSheet.create({
  offlineBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 8,
    paddingHorizontal: 16,
    zIndex: 9999,
  },
  offlineText: {
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
});