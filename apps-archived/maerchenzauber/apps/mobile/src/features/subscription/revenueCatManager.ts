/**
 * RevenueCat Manager - Handles initialization and user identification
 */

/**
 * RevenueCat Manager class
 */
class RevenueCatManager {
	private isInitialized = false;
	private initializationPromise: Promise<void> | null = null;

	/**
	 * Lazy load RevenueCat module to avoid initialization errors
	 */
	private getPurchases() {
		const RevenueCatModule = require('react-native-purchases');
		return RevenueCatModule.default;
	}

	/**
	 * Initialize RevenueCat
	 */
	async initialize(): Promise<void> {
		// Skip if already initialized
		if (this.isInitialized) {
			console.log('[RevenueCatManager] Already initialized, skipping');
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
			// Clear the promise after completion
			this.initializationPromise = null;
		}
	}

	private async _performInitialization(): Promise<void> {
		try {
			console.log('[RevenueCatManager] Initializing RevenueCat SDK...');
			const { initializeRevenueCat } = await import('./subscriptionService');
			await initializeRevenueCat();
			this.isInitialized = true;
			console.log('[RevenueCatManager] RevenueCat initialized successfully');
		} catch (error) {
			console.error('[RevenueCatManager] Error in initialization:', error);
			// Don't throw - allow app to continue without RevenueCat
		}
	}

	/**
	 * Check if RevenueCat is available (initialized)
	 */
	isAvailable(): boolean {
		return this.isInitialized;
	}

	/**
	 * Identify user with RevenueCat
	 */
	async identifyUser(userId: string): Promise<void> {
		if (!this.isInitialized) {
			console.warn('[RevenueCatManager] Not initialized - cannot identify user');
			return;
		}

		try {
			const { identifyUser } = await import('./subscriptionService');
			await identifyUser(userId);
			console.log('[RevenueCatManager] User identified:', userId);
		} catch (error) {
			console.error('[RevenueCatManager] Error identifying user:', error);
		}
	}

	/**
	 * Reset user to anonymous
	 */
	async resetUser(): Promise<void> {
		if (!this.isInitialized) {
			console.log('[RevenueCatManager] Not initialized - nothing to reset');
			return;
		}

		try {
			const { resetUser } = await import('./subscriptionService');
			await resetUser();
			console.log('[RevenueCatManager] User reset to anonymous');
		} catch (error) {
			console.error('[RevenueCatManager] Error resetting user:', error);
		}
	}

	/**
	 * Get current subscription data
	 */
	async getSubscriptionData(): Promise<any> {
		if (!this.isInitialized) {
			console.log('[RevenueCatManager] Not initialized - returning fallback data');
			const { getSubscriptionData } = await import('./subscriptionService');
			return getSubscriptionData();
		}

		try {
			const { getSubscriptionData } = await import('./subscriptionService');
			return getSubscriptionData();
		} catch (error) {
			console.error('[RevenueCatManager] Error getting subscription data:', error);
			// Return fallback data on error
			const { getSubscriptionData } = await import('./subscriptionService');
			return getSubscriptionData();
		}
	}

	/**
	 * Purchase a subscription
	 */
	async purchaseSubscription(
		subscriptionId: string,
		billingCycle: 'monthly' | 'yearly'
	): Promise<any> {
		if (!this.isInitialized) {
			throw new Error('RevenueCat not initialized');
		}

		try {
			const { purchaseSubscription } = await import('./subscriptionService');
			return await purchaseSubscription(subscriptionId, billingCycle);
		} catch (error) {
			console.error('[RevenueCatManager] Error purchasing subscription:', error);
			throw error;
		}
	}

	/**
	 * Purchase a mana package
	 */
	async purchaseManaPackage(packageId: string): Promise<any> {
		if (!this.isInitialized) {
			throw new Error('RevenueCat not initialized');
		}

		try {
			const { purchaseManaPackage } = await import('./subscriptionService');
			return await purchaseManaPackage(packageId);
		} catch (error) {
			console.error('[RevenueCatManager] Error purchasing mana package:', error);
			throw error;
		}
	}

	/**
	 * Restore purchases
	 */
	async restorePurchases(): Promise<any> {
		if (!this.isInitialized) {
			throw new Error('RevenueCat not initialized');
		}

		try {
			const { restorePurchases } = await import('./subscriptionService');
			return await restorePurchases();
		} catch (error) {
			console.error('[RevenueCatManager] Error restoring purchases:', error);
			throw error;
		}
	}

	/**
	 * Reset the manager state (for testing or re-initialization)
	 */
	reset(): void {
		this.isInitialized = false;
		this.initializationPromise = null;
	}
}

// Export singleton instance
export const revenueCatManager = new RevenueCatManager();

// Export helper functions for easy access
export const isRevenueCatAvailable = () => revenueCatManager.isAvailable();
export const initializeRevenueCat = () => revenueCatManager.initialize();
export const identifyRevenueCatUser = (userId: string) => revenueCatManager.identifyUser(userId);
export const resetRevenueCatUser = () => revenueCatManager.resetUser();
export const getSubscriptionData = () => revenueCatManager.getSubscriptionData();
export const purchaseSubscription = (subscriptionId: string, billingCycle: 'monthly' | 'yearly') =>
	revenueCatManager.purchaseSubscription(subscriptionId, billingCycle);
export const purchaseManaPackage = (packageId: string) =>
	revenueCatManager.purchaseManaPackage(packageId);
export const restorePurchases = () => revenueCatManager.restorePurchases();
