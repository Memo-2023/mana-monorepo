/**
 * Generate a consistent HSL color from a string
 * @param str - Input string (e.g., name)
 * @returns HSL color string
 */
export function stringToColor(str: string): string {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
	}
	const hue = hash % 360;
	return `hsl(${hue}, 70%, 50%)`;
}

/**
 * Get initials from a name
 * @param name - Full name
 * @returns 1-2 character initials
 */
export function getInitials(name: string): string {
	const parts = name.trim().split(' ').filter(Boolean);
	if (parts.length >= 2) {
		return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
	}
	return name.substring(0, 2).toUpperCase();
}

/**
 * D3 Force simulation default parameters
 */
export const SIMULATION_CONFIG = {
	/** Distance between linked nodes */
	linkDistance: 100,
	/** Strength of links (0-1) */
	linkStrength: 0.5,
	/** Charge strength (negative = repulsion) */
	chargeStrength: -300,
	/** Collision radius for nodes */
	collisionRadius: 50,
	/** Initial alpha for simulation */
	initialAlpha: 1,
	/** Alpha for reheating simulation */
	reheatAlpha: 0.3,
	/** Zoom scale extent */
	zoomExtent: [0.1, 4] as [number, number],
} as const;

/**
 * Node size configuration
 */
export const NODE_CONFIG = {
	/** Default node radius */
	radius: 36,
	/** Selected node radius */
	selectedRadius: 40,
	/** Avatar clip radius (slightly smaller than node) */
	avatarRadius: 34,
	/** Selected avatar clip radius */
	selectedAvatarRadius: 38,
	/** Badge offset from center */
	badgeOffset: 25,
	/** Selected badge offset */
	selectedBadgeOffset: 28,
} as const;

/**
 * Label configuration
 */
export const LABEL_CONFIG = {
	/** Font size for name label */
	nameFontSize: 18,
	/** Selected name font size */
	selectedNameFontSize: 20,
	/** Font size for subtitle label */
	subtitleFontSize: 14,
	/** Y offset for name label */
	nameOffset: 58,
	/** Selected name Y offset */
	selectedNameOffset: 62,
	/** Gap between name and subtitle */
	subtitleGap: 22,
	/** Font size for initials */
	initialsFontSize: 18,
	/** Selected initials font size */
	selectedInitialsFontSize: 20,
} as const;
