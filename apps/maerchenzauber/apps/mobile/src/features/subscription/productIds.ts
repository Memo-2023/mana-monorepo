/**
 * Product ID Mappings for RevenueCat
 * Maps internal subscription/package IDs to App Store/Play Store product IDs
 */

// Subscription Product IDs (from App Store Connect)
export const subscriptionIdToProductId = {
	// Small Stream (Kleiner Mana Stream)
	small_monthly: 'mana_stream_small_maerchenzauber_monthly_v1',
	small_yearly: 'mana_stream_small_maerchenzauber_yearly_v1',

	// Medium Stream (Mittlerer Mana Stream)
	medium_monthly: 'mana_stream_medium_maerchenzauber_monthly_v1',
	medium_yearly: 'mana_stream_medium_maerchenzauber_yearly_v1',

	// Large Stream (Großer Mana Stream)
	large_monthly: 'mana_stream_large_maerchenzauber_monthly_v1',
	large_yearly: 'mana_stream_large_maerchenzauber_yearly_v1',

	// Giant Stream (Riesiger Mana Stream)
	giant_monthly: 'mana_stream_giant_maerchenzauber_monthly_v1',
	giant_yearly: 'mana_stream_giant_maerchenzauber_yearly_v1',
} as const;

// One-time Mana Package Product IDs (Consumables from App Store Connect)
export const packageIdToProductId = {
	// Mana Potions (Mana Tränke)
	small: 'mana_potion_small_maerchenzauber_v1',
	medium: 'mana_potion_medium_maerchenzauber_v1',
	large: 'mana_potion_large_maerchenzauber_v1',
	xlarge: 'mana_potion_giant_maerchenzauber_v1',
} as const;

// Helper function to get all product IDs
export const getAllProductIds = (): string[] => [
	...Object.values(subscriptionIdToProductId),
	...Object.values(packageIdToProductId),
];

// Helper function to get subscription product IDs
export const getSubscriptionProductIds = (): string[] => Object.values(subscriptionIdToProductId);

// Helper function to get package product IDs
export const getPackageProductIds = (): string[] => Object.values(packageIdToProductId);

// Type exports for better type safety
export type SubscriptionId = keyof typeof subscriptionIdToProductId;
export type PackageId = keyof typeof packageIdToProductId;
