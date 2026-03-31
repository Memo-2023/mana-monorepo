import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import { router } from 'expo-router';
import Text from '~/components/atoms/Text';
import Pill from '~/components/atoms/Pill';
import Icon from '~/components/atoms/Icon';
import colors from '~/tailwind.config.js';

interface FilterItem {
	id: string;
	label: string;
	color?: string;
	iconName?: string;
	isPinned?: boolean;
}

interface PillFilterProps {
	items: FilterItem[];
	selectedIds: string[];
	onSelectItem: (id: string) => void;
	isLoading?: boolean;
	error?: string | null;
	iconName?: string;
	iconNavigateTo?: string;
	showAllOption?: boolean;
	allOptionLabel?: string;
	iconType?: 'hashtag' | 'plus' | 'text';
	/**
	 * If true, enables long press context menu for pills
	 */
	enableContextMenu?: boolean;
	/**
	 * Called when the pin option is selected from the context menu
	 */
	onTogglePin?: (id: string) => void;
	/**
	 * Called when the edit option is selected from the context menu
	 */
	onEdit?: (id: string) => void;
	/**
	 * Called when the delete option is selected from the context menu
	 */
	onDelete?: (id: string) => void;
	/**
	 * Label for the edit action in context menu (default: "Bearbeiten")
	 */
	editLabel?: string;
	/**
	 * Bottom inset for safe area (e.g., for iOS devices with home indicator)
	 */
	bottomInset?: number;
}

/**
 * PillFilter-Komponente
 *
 * Eine horizontal scrollbare Liste von Pill-Elementen, die für verschiedene Filtertypen verwendet werden kann.
 * Unterstützt Tags, Blueprints und andere Filtertypen mit konsistentem UI.
 */
const PillFilter: React.FC<PillFilterProps> = ({
	items,
	selectedIds,
	onSelectItem,
	isLoading = false,
	error = null,
	iconName,
	iconNavigateTo,
	showAllOption = true,
	allOptionLabel = 'Alle',
	iconType = 'hashtag',
	enableContextMenu = false,
	onTogglePin,
	onEdit,
	onDelete,
	editLabel,
	bottomInset = 0,
}) => {
	const { isDark, themeVariant, tw } = useTheme();

	// Direkter Zugriff auf die Farben aus der Tailwind-Konfiguration
	const menuBackgroundColor = useMemo(() => {
		const themeColors = colors.theme?.extend?.colors as Record<string, any>;
		return isDark
			? themeColors?.dark?.[themeVariant]?.menuBackground || '#252525'
			: themeColors?.[themeVariant]?.menuBackground || '#FFFFFF';
	}, [isDark, themeVariant]);

	const borderColor = useMemo(() => {
		const themeColors = colors.theme?.extend?.colors as Record<string, any>;
		return isDark
			? themeColors?.dark?.[themeVariant]?.border || '#424242'
			: themeColors?.[themeVariant]?.border || '#e6e6e6';
	}, [isDark, themeVariant]);

	const themeColor = useMemo(() => {
		const themeColors = colors.theme?.extend?.colors as Record<string, any>;
		return isDark
			? themeColors?.dark?.[themeVariant]?.primary || '#f8d62b'
			: themeColors?.[themeVariant]?.primary || '#f8d62b';
	}, [isDark, themeVariant]);

	const handleIconPress = () => {
		if (iconNavigateTo) {
			router.push(iconNavigateTo as any);
		}
	};

	if (isLoading) {
		return (
			<PillFilterSkeleton
				isDark={isDark}
				themeVariant={themeVariant}
				menuBackgroundColor={menuBackgroundColor}
			/>
		);
	}

	if (error) {
		return (
			<View style={styles.errorContainer}>
				<Text style={{ color: isDark ? '#FFFFFF' : '#000000', fontSize: 12 }}>{error}</Text>
			</View>
		);
	}

	// Removed debug log for items

	if (items.length === 0 && !showAllOption) {
		// Removed debug log for empty items
		return null; // Don't show anything if there are no items and no "all" option
	}

	return (
		<View
			style={[
				styles.container,
				{
					backgroundColor: 'transparent',
				},
			]}
		>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset }]}
			>
				{iconName && (
					<Pressable onPress={handleIconPress} style={styles.iconButton}>
						<Icon name={iconName} size={24} color={isDark ? '#FFFFFF' : '#000000'} />
					</Pressable>
				)}

				{showAllOption && (
					<Pill
						label={allOptionLabel}
						isSelected={selectedIds.length === 0}
						onPress={() => onSelectItem('all')}
						style={styles.pill}
						size="large"
					/>
				)}

				{items.length > 0 &&
					items.map((item) => {
						return (
							<Pill
								key={item.id}
								label={item.label}
								iconName={item.iconName}
								isSelected={selectedIds.includes(item.id)}
								onPress={() => onSelectItem(item.id)}
								style={styles.pill}
								size="large"
								{...(selectedIds.includes(item.id) && item.color ? { color: item.color } : {})}
								enableContextMenu={enableContextMenu}
								isPinned={item.isPinned}
								onTogglePin={onTogglePin ? () => onTogglePin(item.id) : undefined}
								onEdit={onEdit ? () => onEdit(item.id) : undefined}
								onDelete={onDelete ? () => onDelete(item.id) : undefined}
								editLabel={editLabel}
							/>
						);
					})}
			</ScrollView>
		</View>
	);
};

/**
 * PillFilterSkeleton-Komponente
 *
 * Zeigt einen einfachen Skeleton-Loader für die PillFilter-Komponente an.
 * Zeigt nur den Hintergrund ohne Platzhalter für Buttons oder Icons.
 */
const PillFilterSkeleton: React.FC<{
	isDark: boolean;
	themeVariant: string;
	menuBackgroundColor: string;
}> = ({ isDark, themeVariant, menuBackgroundColor }) => {
	const themeColors = colors.theme?.extend?.colors as Record<string, any>;
	const borderColor = isDark
		? themeColors?.dark?.[themeVariant]?.border || '#424242'
		: themeColors?.[themeVariant]?.border || '#e6e6e6';

	return (
		<View
			style={[
				styles.container,
				{
					backgroundColor: 'transparent',
					minHeight: 50, // Minimale Höhe für den Container
				},
			]}
		/>
	);
};

const styles = StyleSheet.create({
	container: {
		width: '100%',
		paddingVertical: 10,
	},
	iconButton: {
		padding: 8,
		borderRadius: 20,
		marginRight: 8,
		marginLeft: 16,
	},
	scrollContent: {
		paddingRight: 16,
		paddingLeft: 16,
	},
	pill: {
		marginHorizontal: 4,
	},

	loadingContainer: {
		height: 50,
		alignItems: 'center',
		justifyContent: 'center',
	},
	errorContainer: {
		height: 50,
		alignItems: 'center',
		justifyContent: 'center',
	},
});

export default PillFilter;
