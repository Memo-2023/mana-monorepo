import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleProp, ViewStyle } from 'react-native';

// Definiere alle verwendeten Icons zentral
export type IconName =
	// Navigation & UI
	| 'chevron-back'
	| 'chevron-forward'
	| 'close'
	| 'search'
	| 'filter'
	| 'settings'
	| 'settings-outline'
	| 'menu'
	| 'apps'
	| 'swap-vertical-outline'
	| 'create'
	| 'create-outline'
	| 'checkmark'
	| 'checkmark-outline'
	| 'list-outline'
	| 'grid-outline'

	// Actions
	| 'heart'
	| 'heart-outline'
	| 'star'
	| 'star-outline'
	| 'share'
	| 'share-outline'
	| 'copy'
	| 'copy-outline'
	| 'trash'
	| 'trash-outline'
	| 'refresh'
	| 'shuffle'
	| 'play-circle'
	| 'notifications'
	| 'add'
	| 'add-outline'
	| 'add-circle'
	| 'add-circle-outline'

	// Content
	| 'book'
	| 'book-outline'
	| 'person'
	| 'person-outline'
	| 'people'
	| 'people-outline'
	| 'text'
	| 'text-outline'
	| 'stats-chart-outline'

	// Weather & Time
	| 'sunny'
	| 'moon'
	| 'time'
	| 'calendar'

	// Status & Info
	| 'checkmark-circle'
	| 'information-circle'
	| 'warning'
	| 'alert-circle'

	// Media & Communication
	| 'phone-portrait'
	| 'globe'
	| 'globe-outline'
	| 'link'
	| 'link-outline'

	// Categories (custom mapping)
	| 'bulb'
	| 'bulb-outline'
	| 'rocket'
	| 'trophy'
	| 'leaf'
	| 'happy'
	| 'happy-outline'
	| 'flask'
	| 'color-palette'
	| 'flash'
	| 'flower'
	| 'shield'
	| 'pricetag';

interface IconProps {
	name: IconName;
	size?: number;
	color?: string;
	style?: StyleProp<ViewStyle>;
	focused?: boolean;
}

// Standard-Farben
const colors = {
	white: '#ffffff',
	black: '#000000',
	gray: {
		400: '#9ca3af',
		500: '#6b7280',
		600: '#4b5563',
	},
	red: '#ef4444',
	yellow: '#fbbf24',
	pink: '#ec4899',
	transparent: {
		white: {
			60: 'rgba(255,255,255,0.6)',
			70: 'rgba(255,255,255,0.7)',
			80: 'rgba(255,255,255,0.8)',
		},
		black: {
			60: 'rgba(0,0,0,0.6)',
		},
	},
};

export const Icon: React.FC<IconProps> = ({
	name,
	size = 24,
	color = colors.white,
	style,
	focused = false,
}) => {
	// Only use focused logic when explicitly provided
	// Otherwise, use the icon name exactly as provided
	let iconName: any = name;

	if (focused !== undefined && focused !== false) {
		// If focused and icon has -outline, remove it
		if (focused && name.includes('-outline')) {
			iconName = name.replace('-outline', '') as any;
		}
	}

	return <Ionicons name={iconName} size={size} color={color} style={style} />;
};

// Helper-Funktion um zu prüfen ob eine Outline-Variante existiert
function hasOutlineVariant(name: string): boolean {
	const outlineVariants = [
		'heart',
		'star',
		'share',
		'copy',
		'trash',
		'book',
		'person',
		'people',
		'settings',
		'text',
		'bulb',
		'happy',
		'globe',
		'link',
	];
	return outlineVariants.includes(name);
}

// Export der Farben für konsistente Verwendung
export { colors as IconColors };

// Spezielle Icon-Sets für Kategorien
export const getCategoryIcon = (category: string): IconName => {
	const categoryIcons: Record<string, IconName> = {
		wisdom: 'bulb',
		love: 'heart',
		motivation: 'rocket',
		success: 'trophy',
		life: 'leaf',
		happiness: 'happy',
		philosophy: 'book',
		science: 'flask',
		creativity: 'color-palette',
		humor: 'happy-outline',
		inspiration: 'star',
		leadership: 'people',
		innovation: 'flash',
		dreams: 'moon',
		courage: 'shield',
		mindfulness: 'flower',
	};
	return categoryIcons[category] || 'pricetag';
};

// Tab-Icon-Helper
export const getTabIcon = (routeName: string, focused: boolean): IconName => {
	const tabIcons: Record<string, IconName> = {
		index: focused ? 'book' : 'book-outline',
		search: focused ? 'search' : 'search',
		authors: focused ? 'people' : 'people-outline',
		favorites: focused ? 'heart' : 'heart-outline',
		settings: focused ? 'settings' : 'settings-outline',
	};
	return tabIcons[routeName] || 'apps';
};

export default Icon;
