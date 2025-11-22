import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

/**
 * Get device information for analytics
 */
export const getDeviceInfo = () => ({
  platform: Platform.OS,
  platform_version: Platform.Version,
  device_type: Device.deviceType,
  device_name: Device.deviceName,
  device_brand: Device.brand,
  device_model: Device.modelName,
  is_device: Device.isDevice,
  app_version: Constants.expoConfig?.version,
  app_build: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode,
  expo_version: Constants.expoVersion,
});

/**
 * Get common event properties
 */
export const getCommonEventProperties = () => ({
  timestamp: new Date().toISOString(),
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  ...getDeviceInfo(),
});

/**
 * Track error with standardized properties
 */
export const trackError = (
  track: (event: string, properties?: any) => void,
  error: Error | unknown,
  context: {
    screen?: string;
    action?: string;
    userId?: string;
    [key: string]: any;
  }
) => {
  const errorData =
    error instanceof Error
      ? {
          error_name: error.name,
          error_message: error.message,
          error_stack: __DEV__ ? error.stack : undefined,
        }
      : {
          error_type: 'unknown',
          error_details: String(error),
        };

  track('error_occurred', {
    ...errorData,
    ...context,
    ...getCommonEventProperties(),
  });
};

/**
 * Track performance metric
 */
export const trackPerformance = (
  track: (event: string, properties?: any) => void,
  metricName: string,
  duration: number,
  metadata?: Record<string, any>
) => {
  track('performance_metric', {
    metric_name: metricName,
    duration_ms: Math.round(duration),
    ...metadata,
    ...getCommonEventProperties(),
  });
};

/**
 * Track user interaction
 */
export const trackInteraction = (
  track: (event: string, properties?: any) => void,
  element: string,
  action: string,
  metadata?: Record<string, any>
) => {
  track('user_interaction', {
    element,
    action,
    ...metadata,
    ...getCommonEventProperties(),
  });
};
