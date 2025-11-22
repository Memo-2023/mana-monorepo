/**
 * React hook for PostHog analytics
 *
 * Provides easy access to analytics tracking in React components
 */

import { useEffect, useRef } from 'react';
import { analytics, AnalyticsEvent } from '../src/services/analytics';

/**
 * Hook for tracking analytics events
 */
export function useAnalytics() {
  return {
    track: analytics.track.bind(analytics),
    identify: analytics.identify.bind(analytics),
    reset: analytics.reset.bind(analytics),
    setUserProperties: analytics.setUserProperties.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    isEnabled: analytics.isEnabled.bind(analytics),
  };
}

/**
 * Hook for automatically tracking screen views
 *
 * Usage:
 * ```tsx
 * export default function MyScreen() {
 *   useScreenTracking('MyScreen', { someParam: 'value' });
 *   // ... rest of component
 * }
 * ```
 */
export function useScreenTracking(
  screenName: string,
  params?: Record<string, any>
) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!hasTracked.current) {
      analytics.trackScreenView(screenName, params);
      hasTracked.current = true;
    }
  }, [screenName, params]);
}

/**
 * Hook for tracking component mount/unmount lifecycle
 *
 * Usage:
 * ```tsx
 * useLifecycleTracking('MyComponent', {
 *   onMount: { someData: 'value' },
 *   onUnmount: { duration: true }
 * });
 * ```
 */
export function useLifecycleTracking(
  componentName: string,
  options?: {
    onMount?: Record<string, any>;
    onUnmount?: { duration?: boolean };
  }
) {
  const mountTime = useRef<number>(Date.now());

  useEffect(() => {
    // Track component mount
    if (options?.onMount) {
      analytics.track('feature_discovered', {
        feature: componentName,
        source: 'component_mount',
        ...options.onMount,
      } as any);
    }

    // Track component unmount
    return () => {
      if (options?.onUnmount) {
        const properties: Record<string, any> = {
          component: componentName,
        };

        if (options.onUnmount.duration) {
          properties.duration = Date.now() - mountTime.current;
        }

        console.log('[Analytics] Component unmounted:', componentName, properties);
      }
    };
  }, [componentName, options]);
}

/**
 * Hook for tracking performance metrics
 *
 * Usage:
 * ```tsx
 * const { startTimer, endTimer } = usePerformanceTracking();
 *
 * const handleAction = async () => {
 *   startTimer('action_name');
 *   await doSomething();
 *   endTimer('action_name', { success: true });
 * };
 * ```
 */
export function usePerformanceTracking() {
  const timers = useRef<Map<string, number>>(new Map());

  const startTimer = (timerName: string) => {
    timers.current.set(timerName, Date.now());
  };

  const endTimer = (timerName: string, properties?: Record<string, any>) => {
    const startTime = timers.current.get(timerName);
    if (startTime) {
      const duration = Date.now() - startTime;
      console.log(`[Analytics] Performance: ${timerName} took ${duration}ms`, properties);
      timers.current.delete(timerName);

      // You can track this as a custom event if needed
      if (properties) {
        analytics.track('api_request' as any, {
          endpoint: timerName,
          method: 'unknown',
          duration,
          statusCode: 200,
          success: true,
          ...properties,
        } as any);
      }

      return duration;
    }
    return 0;
  };

  const getTimer = (timerName: string): number | null => {
    const startTime = timers.current.get(timerName);
    return startTime ? Date.now() - startTime : null;
  };

  return { startTimer, endTimer, getTimer };
}

/**
 * Hook for tracking errors with automatic context
 *
 * Usage:
 * ```tsx
 * const { trackError } = useErrorTracking('MyScreen');
 *
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   trackError(error, { action: 'riskyOperation' });
 * }
 * ```
 */
export function useErrorTracking(screenName: string) {
  const trackError = (
    error: Error | string,
    context?: {
      action?: string;
      metadata?: Record<string, any>;
    }
  ) => {
    analytics.trackError(error, {
      ...context,
      screen: screenName,
    });
  };

  return { trackError };
}

/**
 * Hook for tracking form interactions
 *
 * Usage:
 * ```tsx
 * const { trackFieldChange, trackFormSubmit, trackFormError } = useFormTracking('LoginForm');
 * ```
 */
export function useFormTracking(formName: string) {
  const trackFieldChange = (fieldName: string, value?: any) => {
    console.log(`[Analytics] Form field changed: ${formName}.${fieldName}`, value);
    // Track field interaction without PII
  };

  const trackFormSubmit = (properties?: Record<string, any>) => {
    analytics.track('feature_discovered' as any, {
      feature: `${formName}_submitted`,
      source: 'form',
      ...properties,
    } as any);
  };

  const trackFormError = (error: string, fieldName?: string) => {
    analytics.trackError(error, {
      action: 'form_submit',
      metadata: {
        form: formName,
        field: fieldName,
      },
    });
  };

  return { trackFieldChange, trackFormSubmit, trackFormError };
}

export default useAnalytics;
