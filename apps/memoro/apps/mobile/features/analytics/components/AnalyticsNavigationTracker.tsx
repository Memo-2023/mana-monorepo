import { useEffect } from 'react';
import { usePathname } from 'expo-router';
import { useAnalytics } from '../hooks/useAnalytics';

export const AnalyticsNavigationTracker = () => {
  const pathname = usePathname();
  const { screen } = useAnalytics();

  useEffect(() => {
    if (pathname) {
      // Convert path to screen name: /memo/123 -> memo_detail
      const segments = pathname.split('/').filter(Boolean);
      let screenName = 'home';

      if (segments.length > 0) {
        // Handle dynamic routes
        if (segments[0] === 'memo' && segments[1]) {
          screenName = 'memo_detail';
        } else if (segments[0] === 'space' && segments[1]) {
          screenName = 'space_detail';
        } else {
          // Convert path to screen name
          screenName = segments.join('_');
        }
      }

      screen(screenName, {
        path: pathname,
        timestamp: new Date().toISOString(),
      });
    }
  }, [pathname, screen]);

  return null;
};
