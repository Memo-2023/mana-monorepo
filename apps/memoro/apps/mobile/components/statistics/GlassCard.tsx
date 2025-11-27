import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '~/features/theme/ThemeProvider';

interface GlassCardProps {
	children: React.ReactNode;
	style?: ViewStyle;
	width?: number | string;
}

/**
 * Glass morphism card component with blur effect and transparency
 */
const GlassCard: React.FC<GlassCardProps> = ({ children, style, width = '100%' }) => {
	const { isDark } = useTheme();

	// Glass effect colors
	const glassBackground = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.7)';

	const borderColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.3)';

	const gradientColors = isDark
		? ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']
		: ['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.6)'];

	return (
		<View style={[styles.container, { width }, style]}>
			<LinearGradient
				colors={gradientColors}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={styles.gradient}
			>
				<View
					style={[
						styles.innerContainer,
						{
							backgroundColor: glassBackground,
							borderColor: borderColor,
						},
					]}
				>
					{children}
				</View>
			</LinearGradient>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		borderRadius: 24,
		overflow: 'hidden',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.15,
		shadowRadius: 20,
		elevation: 8,
	},
	gradient: {
		flex: 1,
		borderRadius: 24,
	},
	innerContainer: {
		flex: 1,
		borderRadius: 24,
		borderWidth: 1,
		padding: 24,
	},
});

export default GlassCard;
