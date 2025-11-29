/**
 * TimeOfDayBackground Component
 * Renders an animated gradient background based on time of day
 * Reusable for any screen that needs dynamic time-based theming
 */

import React from 'react';
import { StyleSheet, View, Image as RNImage } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TimeOfDayTheme } from '../../src/constants/timeOfDayThemes';
import TimeOfDayParticles from './TimeOfDayParticles';

interface TimeOfDayBackgroundProps {
	theme: TimeOfDayTheme;
	showParticles?: boolean;
	showPattern?: boolean;
	particleIntensity?: 'low' | 'medium' | 'high';
	children?: React.ReactNode;
}

export default function TimeOfDayBackground({
	theme,
	showParticles = true,
	showPattern = true,
	particleIntensity = 'medium',
	children,
}: TimeOfDayBackgroundProps) {
	return (
		<View style={styles.container}>
			{/* Gradient Background */}
			<LinearGradient
				colors={theme.gradientColors}
				style={styles.gradient}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
			/>

			{/* Optional Pattern Overlay */}
			{showPattern && (
				<View style={styles.patternContainer}>
					<RNImage
						source={require('../../assets/images/backgroundpattern-01.png')}
						style={styles.pattern}
						resizeMode="cover"
					/>
				</View>
			)}

			{/* Optional Animated Particles */}
			{showParticles && <TimeOfDayParticles theme={theme} intensity={particleIntensity} />}

			{/* Content */}
			{children}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		width: '100%',
		height: '100%',
	},
	gradient: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		// Removed width/height - absolute positioning with all edges defined
		// is more reliable and prevents CoreGraphics crashes during navigation
	},
	patternContainer: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		width: '100%',
		height: '100%',
		overflow: 'hidden',
	},
	pattern: {
		width: '100%',
		height: '100%',
		opacity: 0.01, // Very subtle
	},
});
