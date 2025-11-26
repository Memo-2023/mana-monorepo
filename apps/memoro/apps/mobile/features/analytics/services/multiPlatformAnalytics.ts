import { Platform } from 'react-native';
import type { AnalyticsService, AnalyticsProperties, UserProperties } from '../types';
import { umamiService } from './umamiService';

class MultiPlatformAnalyticsService implements AnalyticsService {
  private umami = umamiService;

  async initialize() {
    // Only initialize Umami for web
    if (Platform.OS === 'web') {
      await this.umami.initialize();
    }
    // Analytics disabled for mobile (PostHog removed)
  }

  identify(userId: string, properties?: UserProperties) {
    if (Platform.OS === 'web') {
      this.umami.identify(userId, properties);
    }
    // No-op for mobile
  }

  track(event: string, properties?: AnalyticsProperties) {
    if (Platform.OS === 'web') {
      this.umami.track(event, properties);
    }
    // No-op for mobile
  }

  screen(screenName: string, properties?: AnalyticsProperties) {
    if (Platform.OS === 'web') {
      this.umami.screen(screenName, properties);
    }
    // No-op for mobile
  }

  reset() {
    if (Platform.OS === 'web') {
      this.umami.reset();
    }
    // No-op for mobile
  }
}

export const multiPlatformAnalytics = new MultiPlatformAnalyticsService();
