import React, { useState, useRef, memo } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Pressable,
	ScrollView,
	Platform,
	Modal,
	TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '~/utils/theme/theme';

export type FilterType = 'text' | 'context' | 'prompt' | null;

interface DocumentTypeFilterDropdownProps {
	selectedType: FilterType;
	onTypeChange: (type: FilterType) => void;
	disabled?: boolean;
}

interface TypeOption {
	value: FilterType;
	label: string;
	icon: string;
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

		const iconBgColor = item.value
			? isDark
				? `${item.color.dark}30`
				: `${item.color.light}20`
			: isDark
				? '#374151'
				: '#e5e7eb';

		const iconColor = item.value
			? isDark
				? item.color.dark
				: item.color.light
			: isDark
				? '#d1d5db'
				: '#4b5563';

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
						<Ionicons
							name={item.icon as any}
							size={18}
							color={iconColor}
							style={{ marginRight: 8 }}
						/>
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
		value: null,
		label: 'Alle',
		icon: 'apps-outline',
		color: {
			light: '#4b5563',
			dark: '#9ca3af',
		},
	},
	{
		value: 'text',
		label: 'Text',
		icon: 'document-text-outline',
		color: {
			light: '#ef4444', // Rot
			dark: '#f87171',
		},
	},
	{
		value: 'context',
		label: 'Kontext',
		icon: 'information-circle-outline',
		color: {
			light: '#16a34a', // Grün
			dark: '#4ade80',
		},
	},
	{
		value: 'prompt',
		label: 'Prompt',
		icon: 'chatbubble-outline',
		color: {
			light: '#d97706', // Orange
			dark: '#fbbf24',
		},
	},
];

export const DocumentTypeFilterDropdown: React.FC<DocumentTypeFilterDropdownProps> = ({
	selectedType,
	onTypeChange,
	disabled = false,
}) => {
	const { isDark } = useTheme();
	const [dropdownVisible, setDropdownVisible] = useState(false);
	const [isHovered, setIsHovered] = useState(false);
	const [isPressed, setIsPressed] = useState(false);
	const buttonRef = useRef<View>(null);
	const [buttonPosition, setButtonPosition] = useState({ top: 0, right: 0, width: 0 });

	// Aktueller Typ
	const currentTypeOption =
		typeOptions.find((option) => option.value === selectedType) || typeOptions[0];

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

	const iconBgColor = currentTypeOption.value
		? isDark
			? `${currentTypeOption.color.dark}30`
			: `${currentTypeOption.color.light}20`
		: isDark
			? '#374151'
			: '#e5e7eb';

	const iconColor = currentTypeOption.value
		? isDark
			? currentTypeOption.color.dark
			: currentTypeOption.color.light
		: isDark
			? '#d1d5db'
			: '#4b5563';

	const textColor = isDark ? '#f9fafb' : '#111827';
	const chevronColor = isDark ? '#9ca3af' : '#6b7280';

	// Handler für Typ-Auswahl
	const handleTypeSelect = (type: FilterType) => {
		onTypeChange(type);
		setDropdownVisible(false);
	};

	// Toggle-Funktion für Dropdown
	const toggleDropdown = () => {
		if (disabled) return;
		setDropdownVisible(!dropdownVisible);
	};

	return (
		<View style={styles.container} ref={buttonRef}>
			{/* Button, der den aktuellen Typ anzeigt */}
			<Pressable
				onPress={() => {
					// Messen der Button-Position vor dem Öffnen des Dropdowns
					if (buttonRef.current && Platform.OS === 'web') {
						// @ts-ignore - getBoundingClientRect ist auf Web verfügbar
						const rect = buttonRef.current.getBoundingClientRect();
						setButtonPosition({
							top: rect.bottom,
							right: window.innerWidth - rect.right,
							width: rect.width,
						});
					}
					toggleDropdown();
				}}
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
				<Ionicons name={currentTypeOption.icon as any} size={18} color={iconColor} />
				<Text style={[styles.typeLabel, { color: textColor, marginLeft: 8 }]}>
					{currentTypeOption.label}
				</Text>
				<Ionicons
					name={dropdownVisible ? 'chevron-up' : 'chevron-down'}
					size={16}
					color={chevronColor}
					style={styles.dropdownIcon}
				/>
			</Pressable>

			{/* Dropdown für die Typauswahl als Modal */}
			{dropdownVisible && (
				<Modal
					transparent={true}
					visible={dropdownVisible}
					onRequestClose={() => setDropdownVisible(false)}
					animationType="fade"
				>
					<TouchableOpacity
						style={{
							flex: 1,
							backgroundColor: 'transparent',
						}}
						activeOpacity={1}
						onPress={() => setDropdownVisible(false)}
					>
						<View
							style={{
								position: 'absolute',
								top: buttonPosition.top + 5, // Leichter Abstand unter dem Button
								right: buttonPosition.right,
								width: Math.max(buttonPosition.width, 140), // Mindestens so breit wie der Button
								borderRadius: 8,
								backgroundColor: isDark ? '#1f2937' : '#ffffff',
								borderWidth: 1,
								borderColor: isDark ? '#374151' : '#e5e7eb',
								shadowColor: '#000',
								shadowOffset: { width: 0, height: 2 },
								shadowOpacity: 0.15,
								shadowRadius: 3,
								elevation: 5,
							}}
						>
							<TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
								<ScrollView style={styles.typeList} showsVerticalScrollIndicator={false}>
									{typeOptions.map((item) => (
										<TypeItem
											key={item.value || 'all'}
											item={item}
											onSelect={() => handleTypeSelect(item.value)}
											isSelected={selectedType === item.value}
											isDark={isDark}
										/>
									))}
								</ScrollView>
							</TouchableOpacity>
						</View>
					</TouchableOpacity>
				</Modal>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		position: 'relative',
		zIndex: 10, // Höherer Z-Index, damit das Dropdown über anderen Elementen angezeigt wird
	},
	typeButton: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 6,
		paddingHorizontal: 12,
		paddingVertical: 6,
		height: 36,
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
