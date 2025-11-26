import NetInfo from '@react-native-community/netinfo';

/**
 * Utility functions for detecting and handling network errors
 */

interface NetworkErrorInfo {
  isNetworkError: boolean;
  errorType: 'offline' | 'timeout' | 'connection' | 'server' | 'unknown';
  userMessage: string;
  technicalMessage: string;
}

/**
 * Checks if the device has internet connectivity using NetInfo
 */
export async function isDeviceConnected(): Promise<boolean> {
  try {
    const netInfo = await NetInfo.fetch();
    // During network transitions, isInternetReachable can be null
    // Only consider device online if both connected AND internet is explicitly reachable
    // If isInternetReachable is null (unknown), consider it offline to prevent premature API calls
    return netInfo.isConnected === true && netInfo.isInternetReachable === true;
  } catch (error) {
    console.debug('Error checking network connectivity:', error);
    // Fallback to true to avoid blocking app functionality
    return true;
  }
}

/**
 * Checks if the device has a stable internet connection
 * Useful for critical operations like token refresh
 */
export async function hasStableConnection(): Promise<boolean> {
  try {
    // First check basic connectivity
    const isConnected = await isDeviceConnected();
    if (!isConnected) return false;

    // For critical operations, double-check after a short delay
    // This helps ensure the connection is stable, not just transitioning
    await new Promise((resolve) => setTimeout(resolve, 500));

    const netInfo = await NetInfo.fetch();
    // Require explicit true values for stable connection
    return (
      netInfo.isConnected === true &&
      netInfo.isInternetReachable === true &&
      netInfo.details !== null
    );
  } catch (error) {
    console.debug('Error checking stable connectivity:', error);
    return false;
  }
}

/**
 * Synchronous version for immediate error analysis (pattern matching only)
 */
export function analyzeNetworkErrorSync(error: unknown): NetworkErrorInfo {
  return analyzeErrorPatterns(error);
}

/**
 * Async version with NetInfo connectivity check for enhanced detection
 */
export async function analyzeNetworkError(error: unknown): Promise<NetworkErrorInfo> {
  // First, check actual device connectivity using NetInfo
  const isConnected = await isDeviceConnected();
  if (!isConnected) {
    return {
      isNetworkError: true,
      errorType: 'offline',
      userMessage: 'No internet connection detected. Please check your connection and try again.',
      technicalMessage: 'NetInfo: Device is offline',
    };
  }

  // Fall back to pattern matching
  return analyzeErrorPatterns(error);
}

/**
 * Internal function to analyze error patterns
 */
function analyzeErrorPatterns(error: unknown): NetworkErrorInfo {
  const errorMessage = (error as any)?.message?.toLowerCase() || '';
  const errorName = (error as any)?.name?.toLowerCase() || '';

  // Offline/No internet connection errors
  if (
    errorMessage.includes('not connected to the internet') ||
    errorMessage.includes('no internet connection') ||
    errorMessage.includes('offline') ||
    errorMessage.includes('internet connection appears to be offline') ||
    errorMessage.includes('the internet connection appears to be offline')
  ) {
    return {
      isNetworkError: true,
      errorType: 'offline',
      userMessage: 'No internet connection detected. Please check your connection and try again.',
      technicalMessage: (error as any).message || 'Device appears to be offline',
    };
  }

  // Network connection errors
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('network request failed') ||
    errorMessage.includes('network error') ||
    errorName.includes('networkerror') ||
    errorMessage.includes('failed to fetch') ||
    errorMessage.includes('request failed') ||
    errorMessage.includes('unable to connect')
  ) {
    return {
      isNetworkError: true,
      errorType: 'connection',
      userMessage: 'Unable to connect to server. Please check your internet connection and try again.',
      technicalMessage: (error as any).message || 'Network connection failed',
    };
  }

  // Timeout errors
  if (
    errorMessage.includes('timeout') ||
    errorMessage.includes('timed out') ||
    errorName.includes('timeout')
  ) {
    return {
      isNetworkError: true,
      errorType: 'timeout',
      userMessage: 'Request timed out. Please check your connection and try again.',
      technicalMessage: (error as any).message || 'Request timeout',
    };
  }

  // Connection refused/reset errors
  if (
    errorMessage.includes('connection refused') ||
    errorMessage.includes('connection reset') ||
    errorMessage.includes('econnrefused') ||
    errorMessage.includes('econnreset')
  ) {
    return {
      isNetworkError: true,
      errorType: 'connection',
      userMessage: 'Unable to reach server. Please check your internet connection.',
      technicalMessage: (error as any).message || 'Connection refused',
    };
  }

  // Check for HTTP status-based network errors if it's a fetch response
  if ((error as any)?.status || (error instanceof Error && 'status' in error)) {
    const status = (error as any).status;

    // Server errors that could be network-related
    if (status >= 500) {
      return {
        isNetworkError: true,
        errorType: 'server',
        userMessage: 'Server is temporarily unavailable. Please try again in a moment.',
        technicalMessage: `Server error: ${status}`,
      };
    }

    // Gateway timeout, bad gateway, service unavailable
    if (status === 502 || status === 503 || status === 504) {
      return {
        isNetworkError: true,
        errorType: 'server',
        userMessage: 'Service is temporarily unavailable. Please try again in a moment.',
        technicalMessage: `Gateway error: ${status}`,
      };
    }
  }

  // DNS resolution errors
  if (
    errorMessage.includes('dns') ||
    errorMessage.includes('getaddrinfo') ||
    errorMessage.includes('enotfound')
  ) {
    return {
      isNetworkError: true,
      errorType: 'connection',
      userMessage: 'Unable to reach server. Please check your internet connection.',
      technicalMessage: (error as any).message || 'DNS resolution failed',
    };
  }

  // Not a recognized network error
  return {
    isNetworkError: false,
    errorType: 'unknown',
    userMessage: 'An unexpected error occurred. Please try again.',
    technicalMessage: (error as any).message || 'Unknown error',
  };
}
