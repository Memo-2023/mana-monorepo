import { FontAwesome } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Dimensions, TouchableOpacity, Text, Platform } from 'react-native';

import { WebMap } from './WebMap';
import { LocationData } from '../utils/locationService';
import { useTheme } from '../utils/themeContext';

// Nur auf nativen Plattformen importieren, nicht im Web
let MapView: any, Marker: any, Polyline: any;
if (Platform.OS !== 'web') {
	const Maps = require('react-native-maps');
	MapView = Maps.default;
	Marker = Maps.Marker;
	Polyline = Maps.Polyline;
}

interface LocationMapProps {
	currentLocation: LocationData | null;
	locationHistory: LocationData[];
	onCenterMap?: () => void;
	isTracking: boolean;
	isDarkMode?: boolean;
	locationCount?: number;
}

export const LocationMap: React.FC<LocationMapProps> = ({
	currentLocation,
	locationHistory,
	onCenterMap,
	isTracking,
	isDarkMode = false,
	locationCount = 0,
}) => {
	const { colors } = useTheme();
	const mapRef = useRef<any>(null);
	const [mapRegion, setMapRegion] = useState({
		latitude: 37.78825, // Default location (will be overridden)
		longitude: -122.4324,
		latitudeDelta: 0.0922,
		longitudeDelta: 0.0421,
	});

	// Update map region when current location changes
	useEffect(() => {
		if (currentLocation) {
			const newRegion = {
				latitude: currentLocation.latitude,
				longitude: currentLocation.longitude,
				latitudeDelta: 0.0122,
				longitudeDelta: 0.0061,
			};
			setMapRegion(newRegion);

			// Only auto-center map when tracking is active
			if (isTracking) {
				mapRef.current?.animateToRegion(newRegion, 1000);
			}
		}
	}, [currentLocation, isTracking]);

	// Wenn wir im Web sind, zeige die Web-Version der Karte
	if (Platform.OS === 'web') {
		return (
			<WebMap
				currentLocation={currentLocation}
				locationHistory={locationHistory}
				isTracking={isTracking}
				isDarkMode={isDarkMode}
			/>
		);
	}

	// Center map on current location
	const centerMap = () => {
		if (currentLocation && mapRef.current) {
			mapRef.current.animateToRegion(
				{
					latitude: currentLocation.latitude,
					longitude: currentLocation.longitude,
					latitudeDelta: 0.0122,
					longitudeDelta: 0.0061,
				},
				1000
			);
			if (onCenterMap) onCenterMap();
		}
	};

	return (
		<View style={styles.container}>
			<MapView
				ref={mapRef}
				style={styles.map}
				initialRegion={mapRegion}
				showsUserLocation
				showsMyLocationButton={false}
				showsCompass
				rotateEnabled
				scrollEnabled
				zoomEnabled
				userInterfaceStyle={isDarkMode ? 'dark' : 'light'}
			>
				{/* Current location marker */}
				{currentLocation && (
					<Marker
						coordinate={{
							latitude: currentLocation.latitude,
							longitude: currentLocation.longitude,
						}}
						title="Current Location"
					/>
				)}

				{/* Path polyline */}
				{locationHistory.length > 1 && (
					<Polyline
						coordinates={locationHistory.map((loc) => ({
							latitude: loc.latitude,
							longitude: loc.longitude,
						}))}
						strokeColor={colors.primary}
						strokeWidth={3}
					/>
				)}
			</MapView>

			{/* Location count badge */}
			<View
				style={[
					styles.locationCountBadge,
					isDarkMode && {
						backgroundColor: 'rgba(40, 40, 40, 0.9)',
						shadowColor: '#000000',
						shadowOpacity: 0.5,
					},
				]}
			>
				<FontAwesome
					name="map-marker"
					size={16}
					color={colors.primary}
					style={{ marginRight: 6 }}
				/>
				<Text style={[styles.locationCountText, isDarkMode && { color: '#FFFFFF' }]}>
					{locationCount}
				</Text>
			</View>

			{/* Center map button */}
			<TouchableOpacity
				style={[
					styles.centerButton,
					isDarkMode && {
						backgroundColor: '#333333',
						shadowColor: '#000000',
						shadowOpacity: 0.5,
					},
				]}
				onPress={centerMap}
			>
				<FontAwesome name="location-arrow" size={24} color={isDarkMode ? 'white' : 'black'} />
			</TouchableOpacity>

			{/* Tracking indicator */}
			{isTracking && (
				<View
					style={[
						styles.trackingIndicator,
						isDarkMode && {
							backgroundColor: 'rgba(40, 40, 40, 0.8)',
							shadowColor: '#000000',
							shadowOpacity: 0.5,
						},
					]}
				>
					<Text style={[styles.trackingText, isDarkMode && { color: '#FFFFFF' }]}>Tracking</Text>
					<View style={styles.trackingDot} />
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		overflow: 'hidden',
		borderRadius: 8,
	},
	map: {
		width: '100%',
		height: '100%',
	},
	locationCountBadge: {
		position: 'absolute',
		bottom: 16,
		left: 16,
		backgroundColor: 'rgba(255, 255, 255, 0.9)',
		borderRadius: 20,
		paddingHorizontal: 12,
		paddingVertical: 8,
		flexDirection: 'row',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
	locationCountText: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#000',
	},
	centerButton: {
		position: 'absolute',
		bottom: 16,
		right: 16,
		backgroundColor: 'white',
		borderRadius: 30,
		width: 50,
		height: 50,
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
	trackingIndicator: {
		position: 'absolute',
		top: 16,
		right: 16,
		backgroundColor: 'rgba(255, 255, 255, 0.8)',
		borderRadius: 20,
		paddingHorizontal: 12,
		paddingVertical: 6,
		flexDirection: 'row',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.2,
		shadowRadius: 1.41,
		elevation: 2,
	},
	trackingText: {
		fontSize: 14,
		fontWeight: 'bold',
		marginRight: 6,
	},
	trackingDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: '#FF0000',
	},
});
