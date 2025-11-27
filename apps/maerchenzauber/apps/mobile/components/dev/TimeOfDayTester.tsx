/**
 * TimeOfDayTester Component
 * Development helper to test all time-of-day themes
 * Usage: Import and render in any screen during development
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Text from '../atoms/Text';
import TimeOfDayBackground from '../atoms/TimeOfDayBackground';
import { getTimeOfDayTheme } from '../../src/constants/timeOfDayThemes';
import { TimeOfDay } from '../../src/utils/timeOfDay';

export default function TimeOfDayTester() {
	const [selectedTime, setSelectedTime] = useState<TimeOfDay>('morning');
	const theme = getTimeOfDayTheme(selectedTime);

	const times: TimeOfDay[] = ['morning', 'day', 'evening', 'night'];

	return (
		<View style={styles.container}>
			{/* Background Preview */}
			<View style={styles.preview}>
				<TimeOfDayBackground
					theme={theme}
					showParticles={true}
					showPattern={true}
					particleIntensity="medium"
				>
					<View style={styles.previewContent}>
						<Text variant="header" color={theme.textColor} style={styles.previewTitle}>
							{theme.title}
						</Text>
						<Text variant="subheader" color={theme.textColor} style={styles.previewSubtitle}>
							{theme.subtitle}
						</Text>
						<Text variant="body" color={theme.textColor} style={styles.previewEmoji}>
							{theme.emoji}
						</Text>
					</View>
				</TimeOfDayBackground>
			</View>

			{/* Time Selector */}
			<View style={styles.selector}>
				<Text variant="body" color="#FFFFFF" style={styles.selectorTitle}>
					Teste verschiedene Tageszeiten:
				</Text>
				<View style={styles.buttons}>
					{times.map((time) => (
						<TouchableOpacity
							key={time}
							style={[styles.button, selectedTime === time && styles.buttonActive]}
							onPress={() => setSelectedTime(time)}
						>
							<Text
								variant="body"
								color={selectedTime === time ? '#000000' : '#FFFFFF'}
								style={styles.buttonText}
							>
								{time === 'morning' && '🌅 Morgen'}
								{time === 'day' && '☁️ Tag'}
								{time === 'evening' && '🌆 Abend'}
								{time === 'night' && '🌙 Nacht'}
							</Text>
						</TouchableOpacity>
					))}
				</View>

				{/* Theme Info */}
				<ScrollView style={styles.info}>
					<Text variant="caption" color="#CCCCCC" style={styles.infoText}>
						Particle Type: {theme.particleType}
					</Text>
					<Text variant="caption" color="#CCCCCC" style={styles.infoText}>
						Particle Count: {theme.particleCount}
					</Text>
					<Text variant="caption" color="#CCCCCC" style={styles.infoText}>
						Gradient: {theme.gradientColors.join(', ')}
					</Text>
				</ScrollView>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#000000',
	},
	preview: {
		flex: 2,
		width: '100%',
	},
	previewContent: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 24,
	},
	previewTitle: {
		fontSize: 32,
		fontWeight: 'bold',
		textAlign: 'center',
		marginBottom: 16,
		textShadowColor: 'rgba(0, 0, 0, 0.5)',
		textShadowOffset: { width: 0, height: 2 },
		textShadowRadius: 4,
	},
	previewSubtitle: {
		fontSize: 18,
		textAlign: 'center',
		marginBottom: 24,
		textShadowColor: 'rgba(0, 0, 0, 0.3)',
		textShadowOffset: { width: 0, height: 1 },
		textShadowRadius: 2,
	},
	previewEmoji: {
		fontSize: 60,
	},
	selector: {
		flex: 1,
		backgroundColor: '#1A1A1A',
		paddingTop: 20,
		paddingHorizontal: 16,
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
	},
	selectorTitle: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 16,
		textAlign: 'center',
	},
	buttons: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		gap: 8,
		marginBottom: 20,
	},
	button: {
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 20,
		backgroundColor: '#333333',
	},
	buttonActive: {
		backgroundColor: '#FFD700',
	},
	buttonText: {
		fontSize: 14,
		fontWeight: '600',
	},
	info: {
		flex: 1,
	},
	infoText: {
		fontSize: 12,
		marginBottom: 8,
		fontFamily: 'monospace',
	},
});
