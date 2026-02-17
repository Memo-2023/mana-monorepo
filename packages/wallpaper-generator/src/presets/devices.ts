/**
 * Device Presets
 *
 * Standard device screen dimensions for wallpaper generation.
 * Dimensions are in portrait orientation (height > width).
 */

import type { DevicePreset, DeviceCategory } from '../types.js';

// =============================================================================
// PHONE PRESETS
// =============================================================================

export const PHONE_PRESETS: DevicePreset[] = [
	// Apple iPhones
	{
		id: 'iphone-15-pro-max',
		name: 'iPhone 15 Pro Max',
		category: 'phone',
		width: 1290,
		height: 2796,
		pixelRatio: 3,
	},
	{
		id: 'iphone-15-pro',
		name: 'iPhone 15 Pro',
		category: 'phone',
		width: 1179,
		height: 2556,
		pixelRatio: 3,
	},
	{
		id: 'iphone-15',
		name: 'iPhone 15',
		category: 'phone',
		width: 1179,
		height: 2556,
		pixelRatio: 3,
	},
	{
		id: 'iphone-14',
		name: 'iPhone 14',
		category: 'phone',
		width: 1170,
		height: 2532,
		pixelRatio: 3,
	},
	{
		id: 'iphone-se',
		name: 'iPhone SE',
		category: 'phone',
		width: 750,
		height: 1334,
		pixelRatio: 2,
	},

	// Google Pixels
	{
		id: 'pixel-8-pro',
		name: 'Pixel 8 Pro',
		category: 'phone',
		width: 1344,
		height: 2992,
		pixelRatio: 3,
	},
	{
		id: 'pixel-8',
		name: 'Pixel 8',
		category: 'phone',
		width: 1080,
		height: 2400,
		pixelRatio: 2.625,
	},
	{
		id: 'pixel-7a',
		name: 'Pixel 7a',
		category: 'phone',
		width: 1080,
		height: 2400,
		pixelRatio: 2.5,
	},

	// Samsung Galaxy
	{
		id: 'samsung-s24-ultra',
		name: 'Samsung S24 Ultra',
		category: 'phone',
		width: 1440,
		height: 3120,
		pixelRatio: 3.75,
	},
	{
		id: 'samsung-s24',
		name: 'Samsung S24',
		category: 'phone',
		width: 1080,
		height: 2340,
		pixelRatio: 2.625,
	},
	{
		id: 'samsung-a54',
		name: 'Samsung A54',
		category: 'phone',
		width: 1080,
		height: 2340,
		pixelRatio: 2.625,
	},

	// Generic Android
	{
		id: 'android-fhd',
		name: 'Android FHD+',
		category: 'phone',
		width: 1080,
		height: 2400,
		pixelRatio: 2.5,
	},
	{
		id: 'android-hd',
		name: 'Android HD+',
		category: 'phone',
		width: 720,
		height: 1600,
		pixelRatio: 2,
	},
];

// =============================================================================
// TABLET PRESETS
// =============================================================================

export const TABLET_PRESETS: DevicePreset[] = [
	// Apple iPads
	{
		id: 'ipad-pro-12.9',
		name: 'iPad Pro 12.9"',
		category: 'tablet',
		width: 2048,
		height: 2732,
		pixelRatio: 2,
	},
	{
		id: 'ipad-pro-11',
		name: 'iPad Pro 11"',
		category: 'tablet',
		width: 1668,
		height: 2388,
		pixelRatio: 2,
	},
	{
		id: 'ipad-air',
		name: 'iPad Air',
		category: 'tablet',
		width: 1640,
		height: 2360,
		pixelRatio: 2,
	},
	{
		id: 'ipad-mini',
		name: 'iPad mini',
		category: 'tablet',
		width: 1488,
		height: 2266,
		pixelRatio: 2,
	},
	{
		id: 'ipad-10th',
		name: 'iPad 10th Gen',
		category: 'tablet',
		width: 1640,
		height: 2360,
		pixelRatio: 2,
	},

	// Android Tablets
	{
		id: 'samsung-tab-s9-ultra',
		name: 'Samsung Tab S9 Ultra',
		category: 'tablet',
		width: 1848,
		height: 2960,
		pixelRatio: 2,
	},
	{
		id: 'samsung-tab-s9',
		name: 'Samsung Tab S9',
		category: 'tablet',
		width: 1600,
		height: 2560,
		pixelRatio: 2,
	},
	{
		id: 'android-tablet-generic',
		name: 'Android Tablet',
		category: 'tablet',
		width: 1600,
		height: 2560,
		pixelRatio: 2,
	},
];

// =============================================================================
// DESKTOP PRESETS
// =============================================================================

export const DESKTOP_PRESETS: DevicePreset[] = [
	// Standard Resolutions
	{
		id: 'desktop-4k',
		name: '4K UHD',
		category: 'desktop',
		width: 3840,
		height: 2160,
		pixelRatio: 1,
	},
	{
		id: 'desktop-2k',
		name: '2K QHD',
		category: 'desktop',
		width: 2560,
		height: 1440,
		pixelRatio: 1,
	},
	{
		id: 'desktop-fhd',
		name: 'Full HD',
		category: 'desktop',
		width: 1920,
		height: 1080,
		pixelRatio: 1,
	},

	// Apple MacBooks
	{
		id: 'macbook-pro-16',
		name: 'MacBook Pro 16"',
		category: 'desktop',
		width: 3456,
		height: 2234,
		pixelRatio: 2,
	},
	{
		id: 'macbook-pro-14',
		name: 'MacBook Pro 14"',
		category: 'desktop',
		width: 3024,
		height: 1964,
		pixelRatio: 2,
	},
	{
		id: 'macbook-air-15',
		name: 'MacBook Air 15"',
		category: 'desktop',
		width: 2880,
		height: 1864,
		pixelRatio: 2,
	},
	{
		id: 'macbook-air-13',
		name: 'MacBook Air 13"',
		category: 'desktop',
		width: 2560,
		height: 1664,
		pixelRatio: 2,
	},

	// Ultrawide
	{
		id: 'ultrawide-34',
		name: 'Ultrawide 34"',
		category: 'desktop',
		width: 3440,
		height: 1440,
		pixelRatio: 1,
	},
	{
		id: 'ultrawide-49',
		name: 'Super Ultrawide 49"',
		category: 'desktop',
		width: 5120,
		height: 1440,
		pixelRatio: 1,
	},
];

// =============================================================================
// ALL PRESETS
// =============================================================================

/** All device presets combined */
export const ALL_DEVICE_PRESETS: DevicePreset[] = [
	...PHONE_PRESETS,
	...TABLET_PRESETS,
	...DESKTOP_PRESETS,
];

/** Map of preset ID to preset for quick lookup */
export const DEVICE_PRESET_MAP: Map<string, DevicePreset> = new Map(
	ALL_DEVICE_PRESETS.map((preset) => [preset.id, preset])
);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get device preset by ID
 */
export function getDevicePreset(id: string): DevicePreset | undefined {
	return DEVICE_PRESET_MAP.get(id);
}

/**
 * Get all presets for a category
 */
export function getPresetsByCategory(category: DeviceCategory): DevicePreset[] {
	return ALL_DEVICE_PRESETS.filter((preset) => preset.category === category);
}

/**
 * Get recommended presets (most common devices)
 */
export function getRecommendedPresets(): DevicePreset[] {
	const recommended = [
		'iphone-15-pro-max',
		'iphone-15',
		'samsung-s24-ultra',
		'pixel-8-pro',
		'ipad-pro-12.9',
		'macbook-pro-16',
		'desktop-4k',
	];
	return recommended
		.map((id) => DEVICE_PRESET_MAP.get(id))
		.filter((preset): preset is DevicePreset => preset !== undefined);
}
