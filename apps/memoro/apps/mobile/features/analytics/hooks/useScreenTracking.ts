import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAnalytics } from './useAnalytics';

/**
 * Hook to track screen views when a screen comes into focus
 * Uses React Navigation's focus effect to detect when screen is visible
 *
 * @param screenName - Name of the screen to track
 * @param properties - Additional properties to include with the screen event
 *
 * @example
 * // In your screen component:
 * useScreenTracking('home_screen', { tab: 'home' });
 */
export const useScreenTracking = (screenName: string, properties?: Record<string, any>) => {
  const { screen } = useAnalytics();

  useFocusEffect(
    useCallback(() => {
      // Track screen view when screen comes into focus
      screen(screenName, {
        ...properties,
        focused_at: new Date().toISOString(),
      });
    }, [screenName, screen]) // Remove properties from dependencies to avoid loops
  );
};
