import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useAppTheme, ThemeMode } from './ThemeProvider';
import { themes, ThemeNames } from '~/utils/theme/colors';
import { tw } from '~/utils/theme/theme';

/**
 * ThemeSelector Komponente
 * Ermöglicht das Umschalten zwischen verschiedenen Themes und Modi
 */
export function ThemeSelector() {
	const { themeName, mode, setTheme, setMode, isDark } = useAppTheme();

	// Theme-Optionen
	const themeOptions: { name: ThemeNames; label: string }[] = [
		{ name: 'blue', label: 'Blau' },
		{ name: 'green', label: 'Grün' },
		{ name: 'purple', label: 'Violett' },
	];

	// Modus-Optionen
	const modeOptions: { value: ThemeMode; label: string }[] = [
		{ value: 'light', label: 'Hell' },
		{ value: 'dark', label: 'Dunkel' },
		{ value: 'system', label: 'System' },
	];

	// Styles basierend auf dem aktuellen Theme
	const containerStyle = StyleSheet.create({
		container: {
			width: '100%',
			backgroundColor: isDark ? '#1f2937' : '#ffffff',
			borderRadius: 8,
			padding: 16,
			borderWidth: 1,
			borderColor: isDark ? '#374151' : '#e5e7eb',
			shadowColor: '#000',
			shadowOffset: { width: 0, height: 1 },
			shadowOpacity: 0.2,
			shadowRadius: 1.41,
			elevation: 2,
		},
	});

	const titleStyle: TextStyle = {
		color: isDark ? '#f9fafb' : '#1f2937',
		fontWeight: 'bold',
		fontSize: 18,
		marginBottom: 16,
	};

	const sectionTitleStyle: TextStyle = {
		color: isDark ? '#d1d5db' : '#4b5563',
		fontWeight: '500',
		marginBottom: 8,
	};

	return (
		<View style={containerStyle.container}>
			<Text style={titleStyle}>Theme-Einstellungen</Text>

			{/* Theme-Auswahl */}
			<View style={{ marginBottom: 16 }}>
				<Text style={sectionTitleStyle}>Farbschema</Text>
				<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
					{themeOptions.map((option) => {
						const theme = themes[option.name];
						const isSelected = themeName === option.name;
						const primaryColor = isDark ? theme.primary[400] : theme.primary[600];
						const buttonStyle: ViewStyle = {
							backgroundColor: isSelected ? primaryColor : isDark ? '#374151' : '#F3F4F6',
							borderWidth: 2,
							borderColor: isSelected ? primaryColor : 'transparent',
							borderRadius: 8,
							padding: 8,
							minWidth: 80,
							alignItems: 'center' as const,
						};
						const textStyle = {
							color: isSelected ? (isDark ? '#FFFFFF' : '#FFFFFF') : isDark ? '#D1D5DB' : '#374151',
							fontWeight: isSelected ? ('bold' as const) : ('normal' as const),
						};

						return (
							<TouchableOpacity
								key={option.name}
								style={buttonStyle}
								onPress={() => setTheme(option.name)}
							>
								<Text style={textStyle}>{option.label}</Text>
							</TouchableOpacity>
						);
					})}
				</View>
			</View>

			{/* Modus-Auswahl */}
			<View>
				<Text style={sectionTitleStyle}>Modus</Text>
				<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
					{modeOptions.map((option) => {
						const isSelected = mode === option.value;
						const buttonStyle = {
							backgroundColor: isSelected
								? isDark
									? '#6B7280'
									: '#E5E7EB'
								: isDark
									? '#374151'
									: '#F3F4F6',
							borderWidth: 2,
							borderColor: isSelected ? (isDark ? '#9CA3AF' : '#9CA3AF') : 'transparent',
							borderRadius: 8,
							padding: 8,
							minWidth: 80,
							alignItems: 'center' as const,
						};
						const textStyle = {
							color: isDark ? '#D1D5DB' : '#374151',
							fontWeight: isSelected ? ('bold' as const) : ('normal' as const),
						};

						return (
							<TouchableOpacity
								key={option.value}
								style={buttonStyle}
								onPress={() => setMode(option.value)}
							>
								<Text style={textStyle}>{option.label}</Text>
							</TouchableOpacity>
						);
					})}
				</View>
			</View>
		</View>
	);
}
