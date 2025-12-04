import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme, type ThemeVariant } from '../components/ThemeProvider';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const THEME_PATTERNS: Record<ThemeVariant, any> = {
	lume: require('../assets/images/patterns/memo-theme-tile.png'),
	nature: require('../assets/images/patterns/nature-theme-tile.png'),
	stone: require('../assets/images/patterns/stone-theme-tile.png'),
};

const THEME_NAMES: Record<ThemeVariant, string> = {
	lume: 'Lume',
	nature: 'Nature',
	stone: 'Stone',
};

export default function ThemesScreen() {
	const router = useRouter();
	const { theme, themeVariant, setThemeVariant } = useTheme();

	return (
		<View style={[styles.container, { backgroundColor: theme.colors.backgroundPage }]}>
			<View style={[styles.header, { backgroundColor: theme.colors.backgroundPrimary }]}>
				<TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
					<MaterialIcons name="arrow-back" size={24} color={theme.colors.textPrimary} />
				</TouchableOpacity>
				<Text style={[styles.title, { color: theme.colors.textPrimary }]}>Designs</Text>
			</View>

			<ScrollView style={styles.content}>
				<View style={styles.themeGrid}>
					{(Object.keys(THEME_NAMES) as ThemeVariant[]).map((variant) => {
						const isSelected = variant === themeVariant;

						return (
							<TouchableOpacity
								key={variant}
								style={[
									styles.themeCard,
									{
										backgroundColor: theme.colors.backgroundPrimary,
										borderColor: isSelected ? theme.colors.primary : 'transparent',
										borderWidth: isSelected ? 2 : 0,
									},
								]}
								onPress={() => setThemeVariant(variant)}
							>
								{THEME_PATTERNS[variant] && (
									<View style={StyleSheet.absoluteFill}>
										<View style={styles.patternContainer}>
											{[...Array(2)].map((_, i) => (
												<Image
													key={i}
													source={THEME_PATTERNS[variant]}
													style={[styles.patternTile, { opacity: 0.15 }]}
												/>
											))}
										</View>
									</View>
								)}
								<Text style={[styles.themeName, { color: theme.colors.textPrimary }]}>
									{THEME_NAMES[variant]}
								</Text>
							</TouchableOpacity>
						);
					})}
				</View>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 16,
		paddingTop: 60,
	},
	backButton: {
		marginRight: 16,
	},
	title: {
		fontSize: 20,
		fontWeight: '600',
	},
	content: {
		flex: 1,
		padding: 16,
	},
	themeGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 16,
	},
	themeCard: {
		width: '100%',
		aspectRatio: 2,
		borderRadius: 12,
		padding: 16,
		justifyContent: 'flex-end',
		overflow: 'hidden',
	},
	patternContainer: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		flexDirection: 'row',
		alignItems: 'center',
	},
	patternTile: {
		width: '50%',
		height: '100%',
	},
	themeName: {
		fontSize: 18,
		fontWeight: '600',
	},
});
