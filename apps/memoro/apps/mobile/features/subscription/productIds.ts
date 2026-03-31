import { Platform } from 'react-native';

/**
 * Product IDs for in-app purchases and subscriptions
 * Based on RevenueCat dashboard configuration
 */
export const PRODUCT_IDS = {
	// Subscription products
	subscriptions: {
		// Monthly subscriptions - iOS
		'mini.monthly': 'Mini_1m_v1',
		'plus.monthly': 'Mana_Stream_Small_v1', // Mapped to Mana Stream Small
		'pro.monthly': 'Mana_Stream_Medium_v1', // Mapped to Mana Stream Medium
		'xl.monthly': 'Mana_Stream_Large_v1', // Mapped to Mana Stream Large
		'giant.monthly': 'Mana_Stream_Giant_v1', // Mana Stream Giant monthly

		// Yearly subscriptions - iOS
		'mini.yearly': 'Mini_1y_v1',
		'plus.yearly': 'Mana_Stream_Small_Yearly_v1', // Mapped to Mana Stream Small Yearly
		'pro.yearly': 'Mana_Stream_Medium_Yearly_v1', // Mapped to Mana Stream Medium Yearly
		'xl.yearly': 'Mana_Stream_Large_Yearly_v1', // Mapped to Mana Stream Large Yearly

		// Mana Stream yearly subscriptions (from RevenueCat dashboard)
		'stream.small.yearly': 'Mana_Stream_Small_Yearly_v1',
		'stream.medium.yearly': 'Mana_Stream_Medium_Yearly_v1',
		'stream.large.yearly': 'Mana_Stream_Large_Yearly_v1',
		'stream.giant.yearly': 'Mana_Stream_Giant_Yearly_v1',

		// Android subscription products
		// Note: Android requires the full identifier with base plan suffix for subscriptions
		'stream.small.monthly.android': 'mana_stream_small_v1:monthly',
		'stream.small.yearly.android': 'mana_stream_small_v1:yearly',
		'stream.medium.monthly.android': 'mana_stream_medium_v1:monthly',
		'stream.medium.yearly.android': 'mana_stream_medium_v1:yearly',
		'stream.large.monthly.android': 'mana_stream_large_v1:monthly',
		'stream.large.yearly.android': 'mana_stream_large_v1:yearly',
		'stream.giant.monthly.android': 'mana_stream_giant_v1:monthly',
		'stream.giant.yearly.android': 'mana_stream_giant_v1:yearly',
	},

	// Consumable products (Mana packages)
	packages: {
		small: 'Mana_Potion_Small_v1',
		medium: 'Mana_Potion_Medium_v1',
		large: 'Mana_Potion_Large_v1',
		xlarge: 'Mana_Potion_Giant_v2',

		// Android package products (new naming from RevenueCat)
		'small.android': 'mana_potion_small_memoro_v1',
		'medium.android': 'mana_potion_medium_memoro_v1',
		'large.android': 'mana_potion_large_memoro_v1',
		'xlarge.android': 'mana_potion_giant_memoro_v1',
	},
};

/**
 * Maps subscription IDs from your app to product IDs (platform-aware)
 */
const isAndroid = Platform.OS === 'android';

export const subscriptionIdToProductId = {
	// Monthly subscriptions
	Mana_Stream_Small_v1: isAndroid
		? PRODUCT_IDS.subscriptions['stream.small.monthly.android']
		: PRODUCT_IDS.subscriptions['plus.monthly'],
	Mana_Stream_Medium_v1: isAndroid
		? PRODUCT_IDS.subscriptions['stream.medium.monthly.android']
		: PRODUCT_IDS.subscriptions['pro.monthly'],
	Mana_Stream_Large_v1: isAndroid
		? PRODUCT_IDS.subscriptions['stream.large.monthly.android']
		: PRODUCT_IDS.subscriptions['xl.monthly'],
	Mana_Stream_Giant_v1: isAndroid
		? PRODUCT_IDS.subscriptions['stream.giant.monthly.android']
		: PRODUCT_IDS.subscriptions['giant.monthly'],

	// Yearly subscriptions
	Mana_Stream_Small_Yearly_v1: isAndroid
		? PRODUCT_IDS.subscriptions['stream.small.yearly.android']
		: PRODUCT_IDS.subscriptions['plus.yearly'],
	Mana_Stream_Medium_Yearly_v1: isAndroid
		? PRODUCT_IDS.subscriptions['stream.medium.yearly.android']
		: PRODUCT_IDS.subscriptions['pro.yearly'],
	Mana_Stream_Large_Yearly_v1: isAndroid
		? PRODUCT_IDS.subscriptions['stream.large.yearly.android']
		: PRODUCT_IDS.subscriptions['xl.yearly'],
	Mana_Stream_Giant_Yearly_v1: isAndroid
		? PRODUCT_IDS.subscriptions['stream.giant.yearly.android']
		: PRODUCT_IDS.subscriptions['stream.giant.yearly'],

	// Legacy mappings for backward compatibility
	Mini: PRODUCT_IDS.subscriptions['mini.monthly'],
	Plus: PRODUCT_IDS.subscriptions['plus.monthly'],
	Pro: PRODUCT_IDS.subscriptions['pro.monthly'],
	XL: PRODUCT_IDS.subscriptions['xl.monthly'],
	'Mini-yearly': PRODUCT_IDS.subscriptions['mini.yearly'],
	'Plus-yearly': PRODUCT_IDS.subscriptions['plus.yearly'],
	'Pro-yearly': PRODUCT_IDS.subscriptions['pro.yearly'],
	'XL-yearly': PRODUCT_IDS.subscriptions['xl.yearly'],
};

/**
 * Maps package IDs from your app to product IDs (platform-aware)
 */
export const packageIdToProductId = {
	Mana_Potion_Small_v1: isAndroid
		? PRODUCT_IDS.packages['small.android']
		: PRODUCT_IDS.packages.small,
	Mana_Potion_Medium_v1: isAndroid
		? PRODUCT_IDS.packages['medium.android']
		: PRODUCT_IDS.packages.medium,
	Mana_Potion_Large_v1: isAndroid
		? PRODUCT_IDS.packages['large.android']
		: PRODUCT_IDS.packages.large,
	Mana_Potion_Giant_v2: isAndroid
		? PRODUCT_IDS.packages['xlarge.android']
		: PRODUCT_IDS.packages.xlarge,

	// Legacy mappings for backward compatibility
	small: isAndroid ? PRODUCT_IDS.packages['small.android'] : PRODUCT_IDS.packages.small,
	medium: isAndroid ? PRODUCT_IDS.packages['medium.android'] : PRODUCT_IDS.packages.medium,
	large: isAndroid ? PRODUCT_IDS.packages['large.android'] : PRODUCT_IDS.packages.large,
	xlarge: isAndroid ? PRODUCT_IDS.packages['xlarge.android'] : PRODUCT_IDS.packages.xlarge,
};

/**
 * Get all product IDs as a flat array
 */
export const getAllProductIds = (): string[] => {
	return [...Object.values(PRODUCT_IDS.subscriptions), ...Object.values(PRODUCT_IDS.packages)];
};
