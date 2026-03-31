import React, { useState } from 'react';
import { View, Pressable, StyleSheet, ViewStyle, Platform, ActionSheetIOS } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useTranslation } from 'react-i18next';
import Text from './Text';
import Icon from './Icon';
import WebContextMenu from '~/components/molecules/WebContextMenu';
import colors from '~/tailwind.config.js';

interface PillProps {
	label: string;
	iconName?: string;
	isSelected?: boolean;
	onPress?: () => void;
	color?: string;
	style?: ViewStyle;
	disabled?: boolean;
	maxLength?: number; // Maximale Zeichenanzahl für den Text
	size?: 'small' | 'large'; // Größe der Pill: klein oder groß
	variant?: 'default' | 'underlined'; // Variante der Pill: standard oder unterstrichen
	/**
	 * If true, enables long press context menu
	 */
	enableContextMenu?: boolean;
	/**
	 * Called when the pin option is selected from the context menu
	 */
	onTogglePin?: () => void;
	/**
	 * Called when the edit option is selected from the context menu
	 */
	onEdit?: () => void;
	/**
	 * Called when the delete option is selected from the context menu
	 */
	onDelete?: () => void;
	/**
	 * Whether this tag is pinned (affects the context menu label)
	 */
	isPinned?: boolean;
	/**
	 * Label for the edit action in context menu (default: "Bearbeiten")
	 */
	editLabel?: string;
}

/**
 * Pill component for selectable options
 */
const Pill: React.FC<PillProps> = ({
	label,
	iconName,
	isSelected = false,
	onPress,
	color,
	style,
	disabled = false,
	maxLength = 15, // Standardwert für maximale Zeichenanzahl
	size = 'small', // Standardwert für die Größe
	variant = 'default', // Standardwert für die Variante
	enableContextMenu = false,
	onTogglePin,
	onEdit,
	onDelete,
	isPinned = false,
	editLabel = 'Bearbeiten',
}) => {
	const { isDark, themeVariant, tw, colors: themeColors } = useTheme();
	const { t } = useTranslation();
	const [isHovered, setIsHovered] = useState(false);
	const [webContextMenu, setWebContextMenu] = useState({
		isVisible: false,
		position: { x: 0, y: 0 },
	});

	// Icon-Farbe basierend auf Theme (weiß im Dark Mode, dunkel im Light Mode)
	const iconColor = '#AEAEB2'; // Light gray icon color for both light and dark mode

	/**
	 * Hellt eine Hex-Farbe um einen bestimmten Prozentsatz auf
	 * @param hexColor Die Hex-Farbe (z.B. '#4FC3F7')
	 * @param percent Der Prozentsatz, um den die Farbe aufgehellt werden soll (0-100)
	 * @returns Die aufgehellte Hex-Farbe
	 */
	const lightenColor = (hexColor: string, percent: number): string => {
		// Wenn die Farbe nicht mit # beginnt oder nicht das richtige Format hat, gib sie unverändert zurück
		if (!hexColor || !hexColor.startsWith('#') || ![4, 7].includes(hexColor.length)) {
			return hexColor;
		}

		// Konvertiere die Hex-Farbe in RGB
		let r = parseInt(
			hexColor.length === 4 ? hexColor[1] + hexColor[1] : hexColor.substring(1, 3),
			16
		);
		let g = parseInt(
			hexColor.length === 4 ? hexColor[2] + hexColor[2] : hexColor.substring(3, 5),
			16
		);
		let b = parseInt(
			hexColor.length === 4 ? hexColor[3] + hexColor[3] : hexColor.substring(5, 7),
			16
		);

		// Helle die Farbe um den angegebenen Prozentsatz auf
		r = Math.min(255, Math.round(r * (1 + percent / 100)));
		g = Math.min(255, Math.round(g * (1 + percent / 100)));
		b = Math.min(255, Math.round(b * (1 + percent / 100)));

		// Konvertiere zurück in Hex und gib die aufgehellte Farbe zurück
		return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
	};

	// Determine colors based on theme and props
	const getThemeColor = () => {
		if (color) return color;

		if (themeVariant === 'nature') {
			return '#81C784';
		} else if (themeVariant === 'stone') {
			return '#90A4AE';
		} else if (themeVariant === 'ocean') {
			return '#4FC3F7';
		} else {
			// Lume theme
			return '#f8d62b';
		}
	};

	const themeColor = getThemeColor();

	// Get contentBackground color from theme
	const contentBackgroundColor = isDark
		? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.contentBackground || '#1E1E1E'
		: (colors as any).theme?.extend?.colors?.[themeVariant]?.contentBackground || '#FFFFFF';

	// Get contentBackgroundHover color from theme
	const contentBackgroundHoverColor = isDark
		? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.contentBackgroundHover ||
			'#333333'
		: (colors as any).theme?.extend?.colors?.[themeVariant]?.contentBackgroundHover || '#f5f5f5';

	// Simplified background logic
	const getBackgroundColor = () => {
		if (isSelected) {
			// Active pill: use custom color with transparency or contentBackground
			if (color) {
				return isHovered && Platform.OS === 'web'
					? `${lightenColor(color, 25)}33` // Hover: lighter color with 20% transparency
					: `${color}33`; // Normal: color with 20% transparency
			}
			return isHovered && Platform.OS === 'web'
				? contentBackgroundHoverColor
				: contentBackgroundColor; // Use solid contentBackground for "Alle" pill
		} else {
			// Inactive pill: solid contentBackground
			return isHovered && Platform.OS === 'web'
				? contentBackgroundHoverColor
				: contentBackgroundColor;
		}
	};
	const textColor = isDark ? '#FFFFFF' : '#000000';

	// Simplified border logic
	const tailwindColors = (colors as any).theme?.extend?.colors;

	// Get border hover colors
	const borderHoverColor = isDark
		? tailwindColors?.dark?.[themeVariant]?.borderStrong || '#555555'
		: tailwindColors?.[themeVariant]?.borderStrong || '#cccccc';

	const getBorderColor = () => {
		if (color) {
			// For custom colors, lighten on hover
			return isHovered && Platform.OS === 'web' ? lightenColor(color, 25) : color;
		}

		// Apply hover effect to all pills
		if (isHovered && Platform.OS === 'web') {
			return borderHoverColor;
		}

		if (isDark) {
			return isSelected
				? tailwindColors?.dark?.[themeVariant]?.border || '#424242'
				: tailwindColors?.dark?.[themeVariant]?.borderLight || '#333333';
		}
		return isSelected
			? tailwindColors?.[themeVariant]?.border || '#e6e6e6'
			: tailwindColors?.[themeVariant]?.borderLight || '#f2f2f2';
	};

	const pillBackgroundColor = getBackgroundColor();
	const pillBorderColor = getBorderColor();

	// Bestimme die Styles basierend auf der Größe
	const sizeStyles = size === 'large' ? styles.pillLarge : styles.pillSmall;

	// Bestimme die Styles basierend auf der Variante
	const getVariantStyles = () => {
		if (variant === 'underlined') {
			return {
				backgroundColor: 'transparent',
				borderColor: 'transparent',
				paddingHorizontal: 0,
				paddingVertical: 0,
				minWidth: 0,
			};
		}

		return {
			backgroundColor: pillBackgroundColor,
			borderColor: pillBorderColor,
		};
	};

	// variantStyles now reflect inverted active/default
	const variantStyles = getVariantStyles();

	// Get menu items for Zeego DropdownMenu
	const getMenuItems = () => {
		const items = [];

		if (onTogglePin) {
			items.push({
				key: 'pin',
				title: isPinned ? t('tags.unpin', 'Unpin') : t('tags.pin', 'Pin'),
				systemIcon: 'pin',
				onSelect: onTogglePin,
			});
		}

		if (onEdit) {
			const editText = editLabel === 'Bearbeiten' ? t('common.edit', 'Edit') : editLabel;
			items.push({
				key: 'edit',
				title: editText,
				systemIcon: editLabel === 'Info' ? 'info.circle' : 'pencil',
				onSelect: onEdit,
			});
		}

		if (onDelete) {
			items.push({
				key: 'delete',
				title: t('common.delete', 'Delete'),
				systemIcon: 'trash',
				destructive: true,
				onSelect: onDelete,
			});
		}

		return items;
	};

	// Haptic feedback for long press
	const triggerLongPressHaptic = async () => {
		try {
			await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		} catch (error) {
			console.debug('Haptic feedback error:', error);
		}
	};

	// Handle right-click for web
	const handleWebContextMenu = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setWebContextMenu({
			isVisible: true,
			position: { x: e.clientX, y: e.clientY },
		});
	};

	// Get web context menu items
	const getWebContextMenuItems = () => {
		const items = [];

		if (onTogglePin) {
			items.push({
				title: isPinned ? t('tags.unpin', 'Unpin') : t('tags.pin', 'Pin'),
				icon: 'pin',
				onPress: onTogglePin,
			});
		}

		if (onEdit) {
			const editText = editLabel === 'Bearbeiten' ? t('common.edit', 'Edit') : editLabel;
			items.push({
				title: editText,
				icon: editLabel === 'Info' ? 'information-circle-outline' : 'pencil-outline',
				onPress: onEdit,
			});
		}

		if (onDelete) {
			items.push({
				title: t('common.delete', 'Delete'),
				icon: 'trash-outline',
				destructive: true,
				onPress: onDelete,
			});
		}

		return items;
	};

	// Pill content
	const pillContent = iconName ? (
		<View style={styles.pillRow}>
			<Icon name={iconName} size={size === 'large' ? 16 : 14} color={textColor} />
			<Text
				variant={size === 'large' ? 'body' : 'small'}
				style={[
					styles.label,
					{ marginLeft: 5 },
					variant === 'underlined' && {
						textDecorationLine: 'underline',
						color: color || textColor,
					},
					variant !== 'underlined' && { color: textColor },
				]}
				numberOfLines={1}
				ellipsizeMode="tail"
			>
				{label.length > maxLength ? `${label.substring(0, maxLength)}...` : label}
			</Text>
		</View>
	) : (
		<Text
			variant={size === 'large' ? 'body' : 'small'}
			style={[
				styles.label,
				variant === 'underlined' && {
					textDecorationLine: 'underline',
					color: color || textColor,
				},
				variant !== 'underlined' && { color: textColor },
			]}
			numberOfLines={1}
			ellipsizeMode="tail"
		>
			{label.length > maxLength ? `${label.substring(0, maxLength)}...` : label}
		</Text>
	);

	// Base pressable props
	const pressableProps = {
		style: [
			styles.pill,
			sizeStyles,
			variantStyles,
			{
				opacity: disabled ? 0.6 : 1,
				...(Platform.OS === 'web' &&
					onPress &&
					!disabled && {
						cursor: 'pointer',
					}),
			},
			style,
		],
		onPress,
		disabled,
		onHoverIn: () => Platform.OS === 'web' && setIsHovered(true),
		onHoverOut: () => Platform.OS === 'web' && setIsHovered(false),
	};

	// If context menu is enabled and we're on a native platform, use ActionSheet
	if (enableContextMenu && Platform.OS !== 'web') {
		const menuItems = getMenuItems();
		if (menuItems.length > 0) {
			return (
				<Pressable
					{...pressableProps}
					onLongPress={() => {
						triggerLongPressHaptic();
						// Show action sheet on long press
						if (Platform.OS === 'ios') {
							ActionSheetIOS.showActionSheetWithOptions(
								{
									options: [...menuItems.map((item) => item.title), 'Cancel'],
									destructiveButtonIndex: menuItems.findIndex((item) => item.destructive),
									cancelButtonIndex: menuItems.length,
								},
								(buttonIndex) => {
									if (buttonIndex < menuItems.length) {
										menuItems[buttonIndex].onSelect?.();
									}
								}
							);
						}
					}}
				>
					{pillContent}
				</Pressable>
			);
		}
	}

	// Web rendering with context menu support
	if (Platform.OS === 'web' && enableContextMenu && (onTogglePin || onEdit || onDelete)) {
		return (
			<>
				<div onContextMenu={handleWebContextMenu} style={{ display: 'inline-block' }}>
					<Pressable {...pressableProps}>{pillContent}</Pressable>
				</div>
				<WebContextMenu
					isVisible={webContextMenu.isVisible}
					position={webContextMenu.position}
					items={getWebContextMenuItems()}
					onClose={() => setWebContextMenu({ isVisible: false, position: { x: 0, y: 0 } })}
				/>
			</>
		);
	}

	// Default rendering without context menu
	return <Pressable {...pressableProps}>{pillContent}</Pressable>;
};

const styles = StyleSheet.create({
	pill: {
		borderRadius: 999, // Maximale Rundung für immer runde Pills
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
		position: 'relative',
		alignSelf: 'flex-start', // Wichtig: Beschränkt die Breite auf den Inhalt
	},
	// Kleine Variante für Modal und MemoPreview
	pillSmall: {
		paddingHorizontal: 14,
		paddingVertical: 7, // Increased from 6 to 7 to match add button height
		minWidth: 40,
		maxWidth: 150,
		borderRadius: 999, // Maximale Rundung
	},
	// Große Variante für PillFilter
	pillLarge: {
		paddingHorizontal: 18,
		paddingVertical: 10,
		minWidth: 60,
		maxWidth: 180,
		borderRadius: 999, // Maximale Rundung
	},
	pillRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	label: {
		fontWeight: '500',
		textAlign: 'center',
	},
});

export default Pill;
