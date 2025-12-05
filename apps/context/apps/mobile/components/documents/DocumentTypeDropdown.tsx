import React, { useState, useRef, memo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '~/utils/theme/theme';

export type DocumentType = 'text' | 'context' | 'prompt';

interface DocumentTypeDropdownProps {
	currentType: DocumentType;
	onTypeChange: (type: DocumentType) => void;
	disabled?: boolean;
	openUpwards?: boolean;
	style?: any;
}

interface TypeOption {
	value: DocumentType;
	label: string;
	icon: string;
	description: string;
	color: {
		light: string;
		dark: string;
	};
}

// TypeItem als separate Komponente
const TypeItem = memo(
	({
		item,
		onSelect,
		isSelected,
		isDark,
	}: {
		item: TypeOption;
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

		const iconBgColor = isDark ? `${item.color.dark}30` : `${item.color.light}20`;
		const iconColor = isDark ? item.color.dark : item.color.light;
		const textColor = isDark ? '#f9fafb' : '#111827';

		return (
			<Pressable
				style={[styles.typeItem, { backgroundColor: bgColor }]}
				onPress={onSelect}
				onHoverIn={() => Platform.OS === 'web' && setIsHovered(true)}
				onHoverOut={() => Platform.OS === 'web' && setIsHovered(false)}
				onPressIn={() => setIsPressed(true)}
				onPressOut={() => setIsPressed(false)}
			>
				<View style={styles.typeItemContent}>
					<View style={styles.typeItemHeader}>
						<View style={[styles.typeIcon, { backgroundColor: iconBgColor }]}>
							<Ionicons name={item.icon as any} size={18} color={iconColor} />
						</View>
						<Text style={[styles.typeLabel, { color: textColor }]}>{item.label}</Text>
					</View>
				</View>
			</Pressable>
		);
	}
);

// Statische Dokumenttypen - keine Neuberechnung notwendig
const typeOptions: TypeOption[] = [
	{
		value: 'text',
		label: 'Text',
		icon: 'document-text-outline',
		description: 'Importierte oder manuell erstellte Texte',
		color: {
			light: '#ef4444', // Rot
			dark: '#f87171',
		},
	},
	{
		value: 'context',
		label: 'Kontext',
		icon: 'information-circle-outline',
		description: 'Texte, die als Kontext für KI-Anfragen dienen',
		color: {
			light: '#16a34a', // Grün
			dark: '#4ade80',
		},
	},
	{
		value: 'prompt',
		label: 'Prompt',
		icon: 'chatbubble-outline',
		description: 'Prompts für KI-Modelle',
		color: {
			light: '#d97706', // Orange
			dark: '#fbbf24',
		},
	},
];

export const DocumentTypeDropdown: React.FC<DocumentTypeDropdownProps> = ({
	currentType,
	onTypeChange,
	disabled = false,
	openUpwards = false,
	style,
}) => {
	const { isDark } = useTheme();
	const [dropdownVisible, setDropdownVisible] = useState(false);
	const [isHovered, setIsHovered] = useState(false);
	const [isPressed, setIsPressed] = useState(false);
	const buttonRef = useRef<View>(null);

	// Aktueller Typ
	const currentTypeOption =
		typeOptions.find((option) => option.value === currentType) || typeOptions[0];

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

	const iconBgColor = isDark
		? `${currentTypeOption.color.dark}30`
		: `${currentTypeOption.color.light}20`;
	const iconColor = isDark ? currentTypeOption.color.dark : currentTypeOption.color.light;
	const textColor = isDark ? '#f9fafb' : '#111827';
	const chevronColor = isDark ? '#9ca3af' : '#6b7280';

	// Handler für Typ-Auswahl
	const handleTypeSelect = (type: DocumentType) => {
		onTypeChange(type);
		setDropdownVisible(false);
	};

	// Toggle-Funktion für Dropdown
	const toggleDropdown = () => {
		if (disabled) return;
		setDropdownVisible(!dropdownVisible);
	};

	return (
		<View style={[styles.container, style]} ref={buttonRef}>
			{/* Button, der den aktuellen Typ anzeigt */}
			<Pressable
				onPress={toggleDropdown}
				disabled={disabled}
				style={[
					styles.typeButton,
					{ backgroundColor: buttonBgColor },
					disabled && { opacity: 0.6 },
				]}
				onHoverIn={() => setIsHovered(true)}
				onHoverOut={() => setIsHovered(false)}
				onPressIn={() => setIsPressed(true)}
				onPressOut={() => setIsPressed(false)}
			>
				<View style={[styles.typeIcon, { backgroundColor: iconBgColor }]}>
					<Ionicons name={currentTypeOption.icon as any} size={18} color={iconColor} />
				</View>
				<Text style={[styles.typeLabel, { color: textColor }]}>{currentTypeOption.label}</Text>
				<Ionicons
					name={dropdownVisible ? 'chevron-up' : 'chevron-down'}
					size={16}
					color={chevronColor}
					style={styles.dropdownIcon}
				/>
			</Pressable>

			{/* Dropdown für die Typauswahl */}
			{dropdownVisible && (
				<View
					style={[
						styles.dropdownContent,
						{
							backgroundColor: isDark ? '#1f2937' : '#ffffff',
							position: 'absolute',
							...(openUpwards ? { bottom: 40, left: 0 } : { top: 40, left: 0 }),
							width: 140, // Feste Breite
							zIndex: 5, // Moderater Z-Index
						},
					]}
				>
					<ScrollView style={styles.typeList} showsVerticalScrollIndicator={false}>
						{typeOptions.map((item) => (
							<TypeItem
								key={item.value}
								item={item}
								onSelect={() => handleTypeSelect(item.value)}
								isSelected={currentType === item.value}
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
	typeButton: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 6,
		paddingHorizontal: 12,
		paddingVertical: 6,
		height: 36,
	},
	typeIcon: {
		width: 28,
		height: 28,
		borderRadius: 14,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 8,
	},
	typeLabel: {
		fontSize: 14,
		fontWeight: '500',
	},
	dropdownIcon: {
		marginLeft: 8,
	},
	dropdownContent: {
		borderRadius: 8,
		overflow: 'hidden',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.15,
		shadowRadius: 2,
		elevation: 3, // Niedriger Elevation-Wert
	},
	typeList: {
		maxHeight: 200,
	},
	typeItem: {
		padding: 8,
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(255, 255, 255, 0.12)', // white/12
	},
	typeItemContent: {
		flexDirection: 'column',
	},
	typeItemHeader: {
		flexDirection: 'row',
		alignItems: 'center',
	},
});
