/**
 * Feature flags for Realtime subscription migration
 * Controls the gradual rollout from direct subscriptions to centralized service
 */

// Environment variable control for feature flags
const getEnvFlag = (key: string, defaultValue: boolean = false): boolean => {
  const envValue = process.env[key];
  if (envValue === undefined) return defaultValue;
  return envValue.toLowerCase() === 'true';
};

export const RealtimeConfig = {
  /**
   * Use centralized MemoRealtimeService instead of direct Supabase subscriptions
   * Can be overridden per environment
   */
  USE_CENTRALIZED_REALTIME: getEnvFlag('EXPO_PUBLIC_USE_CENTRALIZED_REALTIME', false),
  
  /**
   * Enable DirectMemoTitle migration to centralized service
   * When false, uses original DirectMemoTitle implementation
   * When true, uses centralized service via useDirectMemoTitle hook
   */
  MIGRATE_DIRECT_MEMO_TITLE: getEnvFlag('EXPO_PUBLIC_MIGRATE_DIRECT_MEMO_TITLE', true),
  
  /**
   * Development and debugging flags
   */
  DEBUG_REALTIME_CONNECTIONS: getEnvFlag('EXPO_PUBLIC_DEBUG_REALTIME_CONNECTIONS', false),
  
  /**
   * Gradual rollout percentages (0-100)
   * Used for A/B testing the migration
   */
  MIGRATION_ROLLOUT_PERCENTAGE: parseInt(process.env.EXPO_PUBLIC_MIGRATION_ROLLOUT_PERCENTAGE || '0', 10),
  
  /**
   * Check if a specific user should use the new implementation
   * Based on rollout percentage (simple hash-based distribution)
   */
  shouldUseCentralizedRealtime: (userId?: string): boolean => {
    // If feature flag is explicitly set, use that
    if (process.env.EXPO_PUBLIC_USE_CENTRALIZED_REALTIME !== undefined) {
      return RealtimeConfig.USE_CENTRALIZED_REALTIME;
    }
    
    // If no userId provided, use default
    if (!userId) {
      return RealtimeConfig.USE_CENTRALIZED_REALTIME;
    }
    
    // Simple hash-based rollout
    const rolloutPercentage = RealtimeConfig.MIGRATION_ROLLOUT_PERCENTAGE;
    if (rolloutPercentage === 0) return false;
    if (rolloutPercentage >= 100) return true;
    
    // Create a simple hash from userId
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert hash to percentage (0-99)
    const userPercentage = Math.abs(hash) % 100;
    
    return userPercentage < rolloutPercentage;
  },

  /**
   * Log configuration for debugging
   */
  logConfig: (): void => {
    if (RealtimeConfig.DEBUG_REALTIME_CONNECTIONS) {
      console.log('RealtimeConfig:', {
        USE_CENTRALIZED_REALTIME: RealtimeConfig.USE_CENTRALIZED_REALTIME,
        MIGRATE_DIRECT_MEMO_TITLE: RealtimeConfig.MIGRATE_DIRECT_MEMO_TITLE,
        MIGRATION_ROLLOUT_PERCENTAGE: RealtimeConfig.MIGRATION_ROLLOUT_PERCENTAGE,
        DEBUG_REALTIME_CONNECTIONS: RealtimeConfig.DEBUG_REALTIME_CONNECTIONS
      });
    }
  }
};

export default RealtimeConfig;