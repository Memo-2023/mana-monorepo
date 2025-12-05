/**
 * Produkt-IDs für App Store Connect und Google Play Store
 * Diese IDs müssen mit den in den Stores konfigurierten Produkt-IDs übereinstimmen
 */

// iOS (App Store Connect) Produkt-IDs
export const IOS_PRODUCT_IDS = {
	// Abonnements
	MINI_SUB: 'Mini_5E_1m_v1',
	PLUS_SUB: 'Plus_11E_1m_v1',
	PRO_SUB: 'Pro_18E_1m_v1',

	// Einmalkäufe
	SMALL_TOKENS: 'Small_5E_1x_v1',
	MEDIUM_TOKENS: 'Medium_10E_1x_v1',
	LARGE_TOKENS: 'Large_20E_1x_v1',
};

// Android (Google Play Store) Produkt-IDs
export const ANDROID_PRODUCT_IDS = {
	// Abonnements
	MINI_SUB: 'Mini_5E_1m_v1',
	PLUS_SUB: 'Plus_11E_1m_v1',
	PRO_SUB: 'Pro_18E_1m_v1',

	// Einmalkäufe
	SMALL_TOKENS: 'Small_5E_1x_v1',
	MEDIUM_TOKENS: 'Medium_10E_1x_v1',
	LARGE_TOKENS: 'Large_20E_1x_v1',
};

// Mapping von Produkt-IDs zu Entitlements
export const PRODUCT_ID_TO_ENTITLEMENT: Record<string, string> = {
	// Gemeinsame IDs für iOS und Android
	Mini_5E_1m_v1: 'mini_subscription',
	Plus_11E_1m_v1: 'plus_subscription',
	Pro_18E_1m_v1: 'pro_subscription',
	Small_5E_1x_v1: 'small_tokens_package',
	Medium_10E_1x_v1: 'medium_tokens_package',
	Large_20E_1x_v1: 'large_tokens_package',
};

// Hilfsfunktion zum Abrufen des Entitlements für eine Produkt-ID
export function getEntitlementForProductId(productId: string): string | undefined {
	return PRODUCT_ID_TO_ENTITLEMENT[productId];
}
