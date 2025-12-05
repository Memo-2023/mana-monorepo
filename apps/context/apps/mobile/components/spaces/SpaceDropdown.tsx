import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '~/utils/theme/theme';
import { Space, getSpaces } from '~/services/supabaseService';

interface SpaceDropdownProps {
	currentSpaceId: string | null;
	onSpaceChange: (spaceId: string) => void;
	disabled?: boolean;
	openUpwards?: boolean;
	style?: any;
}

// SpaceItem als separate Komponente
const SpaceItem = React.memo(
	({
		space,
		onSelect,
		isSelected,
		isDark,
	}: {
		space: Space;
		onSelect: () => void;
		isSelected: boolean;
		isDark: boolean;
	}) => {
		const [isHovered, setIsHovered] = useState(false);
		const [isPressed, setIsPressed] = useState(false);

		// Vorberechnete Farben
		const bgColor = isSelected
			? isDark
				? '#374151'
				: '#f3f4f6'
			: isPressed
				? isDark
					? '#2d3748'
					: '#f9fafb'
				: isHovered
					? isDark
						? '#2d3748'
						: '#f9fafb'
					: isDark
						? '#1f2937'
						: '#ffffff';

		const iconColor = isDark ? '#6366f1' : '#4f46e5';
		const textColor = isDark ? '#f9fafb' : '#111827';

		return (
			<Pressable
				style={[styles.spaceItem, { backgroundColor: bgColor }]}
				onPress={onSelect}
				onHoverIn={() => Platform.OS === 'web' && setIsHovered(true)}
				onHoverOut={() => Platform.OS === 'web' && setIsHovered(false)}
				onPressIn={() => setIsPressed(true)}
				onPressOut={() => setIsPressed(false)}
			>
				<View style={styles.spaceItemContent}>
					<View style={styles.spaceItemHeader}>
						<View
							style={[
								styles.spaceIcon,
								{ backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(79, 70, 229, 0.1)' },
							]}
						>
							<Ionicons name="folder-outline" size={18} color={iconColor} />
						</View>
						<Text style={[styles.spaceLabel, { color: textColor }]}>{space.name}</Text>
					</View>
				</View>
			</Pressable>
		);
	}
);

export const SpaceDropdown: React.FC<SpaceDropdownProps> = ({
	currentSpaceId,
	onSpaceChange,
	disabled = false,
	openUpwards = false,
	style,
}) => {
	const { isDark } = useTheme();
	const [dropdownVisible, setDropdownVisible] = useState(false);
	const [isHovered, setIsHovered] = useState(false);
	const [isPressed, setIsPressed] = useState(false);
	const [spaces, setSpaces] = useState<Space[]>([]);
	const [loading, setLoading] = useState(true);
	const [currentSpace, setCurrentSpace] = useState<Space | null>(null);
	const buttonRef = useRef<View>(null);

	// Lade alle Spaces
	useEffect(() => {
		const loadSpaces = async () => {
			try {
				setLoading(true);
				const spacesData = await getSpaces();
				setSpaces(spacesData);

				// Finde den aktuellen Space
				if (currentSpaceId) {
					const space = spacesData.find((s) => s.id === currentSpaceId);
					if (space) {
						setCurrentSpace(space);
					}
				} else if (spacesData.length > 0) {
					// Wenn kein Space ausgewählt ist, zeige den ersten Space an
					setCurrentSpace(spacesData[0]);
				}
			} catch (err) {
				console.error('Fehler beim Laden der Spaces:', err);
			} finally {
				setLoading(false);
			}
		};

		loadSpaces();
	}, [currentSpaceId]);

	// Vorberechnete Farben und Styles
	const buttonBgColor = disabled
		? isDark
			? '#374151'
			: '#e5e7eb'
		: isPressed
			? isDark
				? '#374151'
				: '#e5e7eb'
			: isHovered
				? isDark
					? '#2d3748'
					: '#f1f2f4'
				: isDark
					? '#1f2937'
					: '#f3f4f6';

	const iconColor = isDark ? '#6366f1' : '#4f46e5';
	const textColor = isDark ? '#f9fafb' : '#111827';
	const chevronColor = isDark ? '#9ca3af' : '#6b7280';

	// Handler für Space-Auswahl
	const handleSpaceSelect = (spaceId: string) => {
		onSpaceChange(spaceId);
		setDropdownVisible(false);
	};

	// Toggle-Funktion für Dropdown
	const toggleDropdown = () => {
		if (disabled) return;
		setDropdownVisible(!dropdownVisible);
	};

	return (
		<View style={[styles.container, style]} ref={buttonRef}>
			{/* Button, der den aktuellen Space anzeigt */}
			<Pressable
				onPress={toggleDropdown}
				disabled={disabled}
				style={[
					styles.spaceButton,
					{ backgroundColor: buttonBgColor },
					disabled && { opacity: 0.6 },
				]}
				onHoverIn={() => Platform.OS === 'web' && setIsHovered(true)}
				onHoverOut={() => Platform.OS === 'web' && setIsHovered(false)}
				onPressIn={() => setIsPressed(true)}
				onPressOut={() => setIsPressed(false)}
			>
				<View
					style={[
						styles.spaceIcon,
						{ backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(79, 70, 229, 0.1)' },
					]}
				>
					<Ionicons name="folder-outline" size={18} color={iconColor} />
				</View>
				<Text style={[styles.spaceLabel, { color: textColor }]}>
					{currentSpace?.name || 'Space wählen'}
				</Text>
				<Ionicons
					name={dropdownVisible ? 'chevron-up' : 'chevron-down'}
					size={16}
					color={chevronColor}
					style={styles.dropdownIcon}
				/>
			</Pressable>

			{/* Dropdown für die Space-Auswahl */}
			{dropdownVisible && (
				<View
					style={[
						styles.dropdownContent,
						{
							backgroundColor: isDark ? '#1f2937' : '#ffffff',
							position: 'absolute',
							...(openUpwards ? { bottom: 40, left: 0 } : { top: 40, left: 0 }),
							width: 180, // Etwas breiter für Space-Namen
							zIndex: 5, // Moderater Z-Index
						},
					]}
				>
					<ScrollView style={styles.spaceList} showsVerticalScrollIndicator={false}>
						{spaces.map((space) => (
							<SpaceItem
								key={space.id}
								space={space}
								onSelect={() => handleSpaceSelect(space.id)}
								isSelected={currentSpaceId === space.id}
								isDark={isDark}
							/>
						))}
					</ScrollView>
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		position: 'relative',
		zIndex: 1, // Niedriger Z-Index
	},
	spaceButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 4,
		borderWidth: 1,
		borderColor: 'transparent',
	},
	spaceIcon: {
		width: 24,
		height: 24,
		borderRadius: 4,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 6,
	},
	spaceLabel: {
		fontSize: 14,
		fontWeight: '500',
		marginRight: 4,
	},
	dropdownIcon: {
		marginLeft: 'auto',
	},
	dropdownContent: {
		borderRadius: 4,
		borderWidth: 1,
		borderColor: 'rgba(0, 0, 0, 0.1)',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 3,
		maxHeight: 200, // Begrenzte Höhe mit Scrolling
	},
	spaceList: {
		padding: 4,
	},
	spaceItem: {
		borderRadius: 4,
		marginVertical: 2,
	},
	spaceItemContent: {
		padding: 8,
	},
	spaceItemHeader: {
		flexDirection: 'row',
		alignItems: 'center',
	},
});
