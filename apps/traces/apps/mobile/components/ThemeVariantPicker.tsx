import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

import { ThemeVariant } from '~/utils/themeContext';

interface ThemeVariantPickerProps {
	selectedVariant: ThemeVariant;
	onChange: (variant: ThemeVariant) => void;
	isDarkMode?: boolean;
}

const THEME_OPTIONS = [
	{
		variant: 'classic' as ThemeVariant,
		name: 'Classic',
		description: 'Natürlich & Grün',
		icon: 'leaf' as keyof typeof FontAwesome.glyphMap,
		primaryColor: '#4CAF50',
	},
	{
		variant: 'ocean' as ThemeVariant,
		name: 'Ocean',
		description: 'Navigation & Blau',
		icon: 'ship' as keyof typeof FontAwesome.glyphMap,
		primaryColor: '#2196F3',
	},
	{
		variant: 'sunset' as ThemeVariant,
		name: 'Sunset',
		description: 'Abenteuer & Energie',
		icon: 'sun-o' as keyof typeof FontAwesome.glyphMap,
		primaryColor: '#FF6B6B',
	},
];

export const ThemeVariantPicker: React.FC<ThemeVariantPickerProps> = ({
	selectedVariant,
	onChange,
	isDarkMode = false,
}) => {
	return (
		<View style={styles.container}>
			{THEME_OPTIONS.map((option) => {
				const isSelected = selectedVariant === option.variant;

				return (
					<TouchableOpacity
						key={option.variant}
						style={[
							styles.themeCard,
							isDarkMode && styles.themeCardDark,
							isSelected && styles.themeCardSelected,
							isSelected && { borderColor: option.primaryColor },
						]}
						onPress={() => onChange(option.variant)}
					>
						<View
							style={[
								styles.iconContainer,
								{ backgroundColor: option.primaryColor + '20' }, // 20 = 12% opacity
							]}
						>
							<FontAwesome name={option.icon} size={28} color={option.primaryColor} />
						</View>

						<View style={styles.textContainer}>
							<Text style={[styles.themeName, isDarkMode && styles.themeNameDark]}>
								{option.name}
							</Text>
							<Text style={[styles.themeDescription, isDarkMode && styles.themeDescriptionDark]}>
								{option.description}
							</Text>
						</View>

						{isSelected && (
							<View style={[styles.checkmark, { backgroundColor: option.primaryColor }]}>
								<FontAwesome name="check" size={14} color="#FFFFFF" />
							</View>
						)}
					</TouchableOpacity>
				);
			})}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		gap: 12,
	},
	themeCard: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FFFFFF',
		borderRadius: 12,
		padding: 16,
		borderWidth: 2,
		borderColor: 'transparent',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	themeCardDark: {
		backgroundColor: '#2A2A2A',
	},
	themeCardSelected: {
		borderWidth: 2,
		shadowOpacity: 0.2,
		shadowRadius: 4,
		elevation: 4,
	},
	iconContainer: {
		width: 56,
		height: 56,
		borderRadius: 28,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 16,
	},
	textContainer: {
		flex: 1,
	},
	themeName: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#333',
		marginBottom: 4,
	},
	themeNameDark: {
		color: '#E0E0E0',
	},
	themeDescription: {
		fontSize: 14,
		color: '#666',
	},
	themeDescriptionDark: {
		color: '#A0A0A0',
	},
	checkmark: {
		width: 24,
		height: 24,
		borderRadius: 12,
		justifyContent: 'center',
		alignItems: 'center',
	},
});
