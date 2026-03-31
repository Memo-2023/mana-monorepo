import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';

interface ColorPickerProps {
	colors: string[];
	selectedColor: string;
	onSelectColor: (color: string) => void;
	isDark: boolean;
}

/**
 * Farbauswahl-Komponente für die Tag-Erstellung
 */
const ColorPicker = ({ colors, selectedColor, onSelectColor, isDark }: ColorPickerProps) => {
	// Border-Farbe basierend auf dem Theme
	const selectedBorderColor = isDark ? '#FFFFFF' : '#000000';
	return (
		<View style={styles.colorPickerContainer}>
			<View style={styles.colorRow}>
				{colors.slice(0, 5).map((color) => (
					<TouchableOpacity
						key={color}
						activeOpacity={0.7}
						onPress={() => onSelectColor(color)}
						style={[styles.colorButton, selectedColor === color && styles.colorButtonSelected]}
					>
						<View
							style={[
								styles.colorCircle,
								{ backgroundColor: color },
								selectedColor === color && {
									...styles.colorCircleSelected,
									borderColor: selectedBorderColor,
								},
							]}
						/>
					</TouchableOpacity>
				))}
			</View>
			<View style={styles.colorRow}>
				{colors.slice(5, 10).map((color) => (
					<TouchableOpacity
						key={color}
						activeOpacity={0.7}
						onPress={() => onSelectColor(color)}
						style={[styles.colorButton, selectedColor === color && styles.colorButtonSelected]}
					>
						<View
							style={[
								styles.colorCircle,
								{ backgroundColor: color },
								selectedColor === color && {
									...styles.colorCircleSelected,
									borderColor: selectedBorderColor,
								},
							]}
						/>
					</TouchableOpacity>
				))}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	colorPickerContainer: {
		paddingHorizontal: 8,
		paddingVertical: 4,
		width: '100%',
	},
	colorRow: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		alignItems: 'center',
		width: '100%',
		marginVertical: 2,
	},
	colorButton: {
		width: 40,
		height: 40,
		justifyContent: 'center',
		alignItems: 'center',
	},
	colorButtonSelected: {
		transform: [{ scale: 1.1 }],
	},
	colorCircleSelected: {
		borderWidth: 3,
	},
	colorCircle: {
		width: '75%',
		height: '75%',
		borderRadius: 999,
		borderWidth: 1,
		borderColor: 'rgba(0, 0, 0, 0.1)',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.15,
		shadowRadius: 1,
		elevation: 1,
	},
});

export default ColorPicker;
