// Network error detection utilities
export {
  analyzeNetworkError,
  analyzeNetworkErrorSync,
  isDeviceConnected,
  type NetworkErrorInfo
} from './utils/networkErrorUtils';

// Network status hook
export { useNetworkStatus, type NetworkStatus } from './hooks/useNetworkStatus';