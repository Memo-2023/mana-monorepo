import { authService } from '~/features/auth/services/authService';

/**
 * RevenueCat Manager - handles conditional initialization based on B2B settings
 *
 * NOTE: We do NOT import react-native-purchases at the top level to avoid
 * loading it for B2B users who have RevenueCat disabled. This prevents
 * module loading errors for users who don't need the SDK.
 */
class RevenueCatManager {
  private isInitialized = false;
  private isDisabled = false;
  private initializationPromise: Promise<void> | null = null;

  /**
   * Check if RevenueCat is disabled for the current user and conditionally initialize
   */
  async conditionalInitialize(): Promise<void> {
    // Skip if already initialized or disabled
    if (this.isInitialized || this.isDisabled) {
      console.debug('RevenueCat already initialized or disabled, skipping');
      return;
    }

    // Return existing promise if initialization is already in progress
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._performInitialization();
    
    try {
      await this.initializationPromise;
    } finally {
      // Clear the promise after completion to allow reset/re-initialization if needed
      this.initializationPromise = null;
    }
  }

  private async _performInitialization(): Promise<void> {
    try {
      // Check if user is B2B from settings endpoint
      const isB2B = await authService.isB2BUser();

      if (isB2B) {
        this.isDisabled = true;
        const userSettings = await authService.getUserSettings();
        console.log('RevenueCat disabled for B2B user:', {
          is_b2b: userSettings.is_b2b,
          subscription_plan_id: userSettings.subscription_plan_id
        });
        return;
      }

      // Initialize RevenueCat normally if not disabled
      if (!this.isInitialized && !this.isDisabled) {
        console.debug('Initializing RevenueCat SDK...');
        const { initializeRevenueCat } = await import('./subscriptionService');
        await initializeRevenueCat();
        this.isInitialized = true;
        console.log('RevenueCat initialized successfully for regular user');
      }
    } catch (error) {
      console.error('Error in RevenueCat conditional initialization:', error);
      // Don't throw - allow app to continue without RevenueCat
    }
  }

  /**
   * Check if RevenueCat is available (initialized and not disabled)
   */
  isAvailable(): boolean {
    return this.isInitialized && !this.isDisabled;
  }

  /**
   * Check if RevenueCat is disabled due to B2B settings
   */
  isB2BDisabled(): boolean {
    return this.isDisabled;
  }

  /**
   * Identify user with RevenueCat (only if not disabled)
   */
  async identifyUser(userId: string): Promise<void> {
    if (this.isDisabled) {
      console.debug('RevenueCat disabled - skipping user identification');
      return;
    }

    if (!this.isInitialized) {
      console.warn('RevenueCat not initialized - cannot identify user');
      return;
    }

    try {
      const { identifyUser } = await import('./subscriptionService');
      await identifyUser(userId);
      console.debug('RevenueCat user identified:', userId);
    } catch (error) {
      console.error('Error identifying RevenueCat user:', error);
    }
  }

  /**
   * Reset user to anonymous (only if not disabled)
   */
  async resetUser(): Promise<void> {
    if (this.isDisabled) {
      console.debug('RevenueCat disabled - skipping user reset');
      return;
    }

    if (!this.isInitialized) {
      console.debug('RevenueCat not initialized - nothing to reset');
      return;
    }

    try {
      const { resetUser } = await import('./subscriptionService');
      await resetUser();
      console.debug('RevenueCat user reset to anonymous');
    } catch (error) {
      console.error('Error resetting RevenueCat user:', error);
    }
  }

  /**
   * Get current subscription data (returns fallback data if disabled)
   */
  async getSubscriptionData(): Promise<any> {
    if (this.isDisabled) {
      console.debug('RevenueCat disabled - returning B2B subscription data');
      // Return B2B-specific subscription data or fallback
      return {
        isB2BUser: true,
        hasActiveSubscription: true,
        plan: 'B2B Enterprise',
        features: ['unlimited_transcription', 'priority_support', 'advanced_analytics']
      };
    }

    if (!this.isInitialized) {
      console.debug('RevenueCat not initialized - returning fallback data');
      // Return fallback subscription data
      const { getSubscriptionData } = await import('./subscriptionService');
      return getSubscriptionData();
    }

    try {
      const { getSubscriptionData } = await import('./subscriptionService');
      return getSubscriptionData();
    } catch (error) {
      console.error('Error getting subscription data:', error);
      const { getSubscriptionData } = await import('./subscriptionService');
      return getSubscriptionData();
    }
  }

  /**
   * Reset the manager state (for testing or re-initialization)
   */
  reset(): void {
    this.isInitialized = false;
    this.isDisabled = false;
    this.initializationPromise = null;
  }
}

// Export singleton instance
export const revenueCatManager = new RevenueCatManager();

// Export helper functions for easy access
export const isRevenueCatAvailable = () => revenueCatManager.isAvailable();
export const isRevenueCatB2BDisabled = () => revenueCatManager.isB2BDisabled();
export const initializeRevenueCatConditionally = () => revenueCatManager.conditionalInitialize();
export const identifyRevenueCatUser = (userId: string) => revenueCatManager.identifyUser(userId);
export const resetRevenueCatUser = () => revenueCatManager.resetUser();