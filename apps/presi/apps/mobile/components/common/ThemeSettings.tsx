import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { useTheme, type ColorMode, type ContrastLevel } from '../ThemeProvider';

const COLOR_MODES: { label: string; value: ColorMode }[] = [
	{ label: 'System', value: 'system' },
	{ label: 'Hell', value: 'light' },
	{ label: 'Dunkel', value: 'dark' },
];

const CONTRAST_LABELS: Record<ContrastLevel, string> = {
	1: 'Sehr niedrig',
	2: 'Niedrig',
	3: 'Standard',
	4: 'Hoch',
	5: 'Sehr hoch',
};

export const ThemeSettings = () => {
	const { theme, colorMode, setColorMode, contrastLevel, setContrastLevel } = useTheme();

	return (
		<View style={styles.container}>
			{/* Helligkeits-Einstellungen */}
			<View style={[styles.section, { backgroundColor: theme.colors.backgroundPrimary }]}>
				<Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Helligkeit:</Text>
				<View style={styles.colorModeList}>
					{COLOR_MODES.map((mode) => (
						<TouchableOpacity
							key={mode.value}
							style={[
								styles.colorModeOption,
								{
									backgroundColor:
										mode.value === colorMode
											? `${theme.colors.primary}1A`
											: theme.colors.backgroundSecondary,
									borderColor: mode.value === colorMode ? theme.colors.primary : 'transparent',
									borderWidth: mode.value === colorMode ? 2 : 0,
								},
							]}
							onPress={() => setColorMode(mode.value)}
						>
							<Text style={[styles.colorModeText, { color: theme.colors.textPrimary }]}>
								{mode.label}
							</Text>
						</TouchableOpacity>
					))}
				</View>
			</View>

			{/* Kontrast-Einstellungen */}
			<View style={[styles.section, { backgroundColor: theme.colors.backgroundPrimary }]}>
				<Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Kontrast:</Text>
				<View style={styles.contrastContainer}>
					<View style={styles.contrastSlider}>
						{([1, 2, 3, 4, 5] as ContrastLevel[]).map((level) => (
							<Pressable
								key={level}
								style={[
									styles.contrastOption,
									{
										backgroundColor:
											level === contrastLevel
												? theme.colors.primary
												: theme.colors.backgroundSecondary,
									},
								]}
								onPress={() => setContrastLevel(level)}
							/>
						))}
					</View>
					<Text style={[styles.contrastLabel, { color: theme.colors.textPrimary }]}>
						{CONTRAST_LABELS[contrastLevel]}
					</Text>
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		width: '100%',
		gap: 16,
	},
	section: {
		padding: 16,
		borderRadius: 12,
		gap: 12,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: '600',
	},
	colorModeList: {
		flexDirection: 'row',
		gap: 8,
	},
	colorModeOption: {
		flex: 1,
		padding: 12,
		borderRadius: 8,
		alignItems: 'center',
	},
	colorModeText: {
		fontSize: 14,
		fontWeight: '500',
	},
	contrastContainer: {
		gap: 12,
	},
	contrastSlider: {
		flexDirection: 'row',
		gap: 8,
		alignItems: 'center',
	},
	contrastOption: {
		flex: 1,
		height: 4,
		borderRadius: 2,
	},
	contrastLabel: {
		fontSize: 14,
		textAlign: 'center',
	},
});
