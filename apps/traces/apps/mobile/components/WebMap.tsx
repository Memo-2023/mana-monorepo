import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';

import { LocationData } from '../utils/locationService';
import { useTheme } from '../utils/themeContext';

interface WebMapProps {
	currentLocation: LocationData | null;
	locationHistory: LocationData[];
	isTracking: boolean;
	isDarkMode?: boolean;
}

export const WebMap: React.FC<WebMapProps> = ({
	currentLocation,
	locationHistory,
	isTracking,
	isDarkMode = false,
}) => {
	const { colors } = useTheme();
	return (
		<View style={styles.container}>
			<View style={[styles.mapPlaceholder, isDarkMode && { backgroundColor: '#1A1A1A' }]}>
				<FontAwesome name="map" size={64} color={isDarkMode ? '#444' : '#ccc'} />
				<Text style={[styles.title, isDarkMode && { color: '#FFFFFF' }]}>Kartenansicht</Text>
				<Text style={[styles.subtitle, isDarkMode && { color: '#AAAAAA' }]}>
					Die Kartenansicht ist im Web-Browser nicht verfügbar.
				</Text>
				<Text style={[styles.description, isDarkMode && { color: '#888888' }]}>
					Bitte verwende die Expo Go App auf einem Mobilgerät, um die vollständige Funktionalität zu
					nutzen.
				</Text>

				{isTracking && (
					<View
						style={[
							styles.trackingStatus,
							isDarkMode && { backgroundColor: 'rgba(76, 175, 80, 0.15)' },
						]}
					>
						<Text style={[styles.trackingText, { color: colors.primary }]}>Tracking aktiv</Text>
						<View style={[styles.trackingDot, { backgroundColor: colors.primary }]} />
					</View>
				)}

				{currentLocation && (
					<View
						style={[
							styles.locationInfo,
							isDarkMode && {
								backgroundColor: '#333333',
								shadowColor: '#000000',
								shadowOpacity: 0.3,
							},
						]}
					>
						<Text style={[styles.locationTitle, isDarkMode && { color: '#FFFFFF' }]}>
							Aktueller Standort:
						</Text>
						<Text style={[styles.locationText, isDarkMode && { color: '#CCCCCC' }]}>
							Breitengrad: {currentLocation.latitude.toFixed(6)}°
						</Text>
						<Text style={[styles.locationText, isDarkMode && { color: '#CCCCCC' }]}>
							Längengrad: {currentLocation.longitude.toFixed(6)}°
						</Text>
						{locationHistory.length > 0 && (
							<Text style={[styles.historyText, isDarkMode && { color: '#AAAAAA' }]}>
								{locationHistory.length} Standorte aufgezeichnet
							</Text>
						)}
					</View>
				)}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		overflow: 'hidden',
		borderRadius: 8,
	},
	mapPlaceholder: {
		width: Dimensions.get('window').width,
		height: '100%',
		backgroundColor: '#f5f5f5',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginTop: 16,
		textAlign: 'center',
	},
	subtitle: {
		fontSize: 16,
		color: '#666',
		marginTop: 8,
		textAlign: 'center',
	},
	description: {
		fontSize: 14,
		color: '#888',
		marginTop: 16,
		textAlign: 'center',
		maxWidth: 300,
	},
	trackingStatus: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 24,
		backgroundColor: 'rgba(76, 175, 80, 0.1)',
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 20,
	},
	trackingText: {
		fontSize: 14,
		fontWeight: 'bold',
		// color set dynamically via colors.primary
		marginRight: 8,
	},
	trackingDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		// backgroundColor set dynamically via colors.primary
	},
	locationInfo: {
		marginTop: 24,
		backgroundColor: 'white',
		padding: 16,
		borderRadius: 8,
		width: '100%',
		maxWidth: 300,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	locationTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		marginBottom: 8,
	},
	locationText: {
		fontSize: 14,
		color: '#444',
		marginBottom: 4,
	},
	historyText: {
		fontSize: 14,
		color: '#666',
		marginTop: 8,
		fontStyle: 'italic',
	},
});
