export interface AnalyticsProperties {
  [key: string]: string | number | boolean | undefined;
}

export interface AnalyticsEvent {
  name: string;
  properties?: AnalyticsProperties;
}

export interface UserProperties {
  userId?: string;
  email?: string;
  plan?: string;
  createdAt?: string;
  language?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface AnalyticsService {
  identify: (userId: string, properties?: UserProperties) => void;
  track: (event: string, properties?: AnalyticsProperties) => void;
  screen: (screenName: string, properties?: AnalyticsProperties) => void;
  reset: () => void;
}
