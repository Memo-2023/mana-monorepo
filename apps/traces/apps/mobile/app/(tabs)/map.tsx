import { FontAwesome } from '@expo/vector-icons';
import { Stack, Link } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Pressable, ScrollView, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SettingsButton } from '~/components/SettingsButton';
import { ThemeWrapper } from '~/components/ThemeWrapper';
import { LocationData, getLocationHistory } from '~/utils/locationService';
import { useTheme } from '~/utils/themeContext';

export type TimeFilter = 'today' | 'week' | 'month' | 'year' | 'all';

interface TimeFilterOption {
	id: TimeFilter;
	label: string;
	icon: React.ComponentProps<typeof FontAwesome>['name'];
}

const TIME_FILTERS: TimeFilterOption[] = [
	{ id: 'today', label: 'Heute', icon: 'calendar-o' },
	{ id: 'week', label: 'Woche', icon: 'calendar' },
	{ id: 'month', label: 'Monat', icon: 'calendar' },
	{ id: 'year', label: 'Jahr', icon: 'calendar' },
	{ id: 'all', label: 'Alle', icon: 'globe' },
];

export default function MapOverviewScreen() {
	const { isDarkMode, colors } = useTheme();
	const insets = useSafeAreaInsets();
	const [locationHistory, setLocationHistory] = useState<LocationData[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedTimeFilter, setSelectedTimeFilter] = useState<TimeFilter>('all');
	const [showRoute, setShowRoute] = useState(true);
	const [showHeatmap, setShowHeatmap] = useState(false);

	useEffect(() => {
		loadLocationHistory();

		// Auto-Update alle 30 Sekunden
		const interval = setInterval(loadLocationHistory, 30000);
		return () => clearInterval(interval);
	}, []);

	const loadLocationHistory = async () => {
		setLoading(true);
		try {
			const history = await getLocationHistory();
			setLocationHistory(history);
		} catch (error) {
			console.error('Fehler beim Laden des Standortverlaufs:', error);
		} finally {
			setLoading(false);
		}
	};

	// Filter locations based on selected time range
	const getFilteredLocations = (): LocationData[] => {
		if (selectedTimeFilter === 'all') return locationHistory;

		const now = Date.now();
		let cutoffTime = 0;

		switch (selectedTimeFilter) {
			case 'today':
				const today = new Date();
				today.setHours(0, 0, 0, 0);
				cutoffTime = today.getTime();
				break;
			case 'week':
				cutoffTime = now - 7 * 24 * 60 * 60 * 1000;
				break;
			case 'month':
				cutoffTime = now - 30 * 24 * 60 * 60 * 1000;
				break;
			case 'year':
				cutoffTime = now - 365 * 24 * 60 * 60 * 1000;
				break;
		}

		return locationHistory.filter((loc) => {
			const timestamp = loc.timestamps?.recordedMs || loc.timestamp || 0;
			return timestamp >= cutoffTime;
		});
	};

	// Cluster nearby locations for heatmap view
	const clusterLocations = (
		locations: LocationData[],
		radiusKm: number = 0.1
	): Array<{
		latitude: number;
		longitude: number;
		count: number;
		locations: LocationData[];
	}> => {
		const clusters: Array<{
			latitude: number;
			longitude: number;
			count: number;
			locations: LocationData[];
		}> = [];

		locations.forEach((loc) => {
			const existingCluster = clusters.find((cluster) => {
				const distance = calculateDistance(
					loc.latitude,
					loc.longitude,
					cluster.latitude,
					cluster.longitude
				);
				return distance <= radiusKm;
			});

			if (existingCluster) {
				existingCluster.count++;
				existingCluster.locations.push(loc);
				const totalLat = existingCluster.locations.reduce((sum, l) => sum + l.latitude, 0);
				const totalLng = existingCluster.locations.reduce((sum, l) => sum + l.longitude, 0);
				existingCluster.latitude = totalLat / existingCluster.locations.length;
				existingCluster.longitude = totalLng / existingCluster.locations.length;
			} else {
				clusters.push({
					latitude: loc.latitude,
					longitude: loc.longitude,
					count: 1,
					locations: [loc],
				});
			}
		});

		return clusters;
	};

	// Calculate distance between two coordinates (Haversine formula)
	const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
		const R = 6371; // Earth's radius in km
		const dLat = ((lat2 - lat1) * Math.PI) / 180;
		const dLon = ((lon2 - lon1) * Math.PI) / 180;
		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos((lat1 * Math.PI) / 180) *
				Math.cos((lat2 * Math.PI) / 180) *
				Math.sin(dLon / 2) *
				Math.sin(dLon / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return R * c;
	};

	// Get color intensity based on cluster count
	const getHeatmapColor = (count: number, maxCount: number): string => {
		const intensity = Math.min(count / maxCount, 1);
		if (intensity < 0.3) return '#4CAF50'; // Green
		if (intensity < 0.6) return '#FF9800'; // Orange
		return '#F44336'; // Red
	};

	const filteredLocations = getFilteredLocations();
	const locationClusters = clusterLocations(filteredLocations);
	const maxClusterCount = Math.max(...locationClusters.map((c) => c.count), 1);

	// Berechne die Region, die alle Standorte umfasst
	const getRegionForLocations = () => {
		const locations = filteredLocations.length > 0 ? filteredLocations : locationHistory;

		if (locations.length === 0) {
			// Standard-Region (Apple Campus)
			return {
				latitude: 37.33233141,
				longitude: -122.0312186,
				latitudeDelta: 0.01,
				longitudeDelta: 0.01,
			};
		}

		if (locations.length === 1) {
			// Einzelner Standort
			const location = locations[0];
			return {
				latitude: location.latitude,
				longitude: location.longitude,
				latitudeDelta: 0.01,
				longitudeDelta: 0.01,
			};
		}

		// Mehrere Standorte - berechne Bounding Box
		const lats = locations.map((loc) => loc.latitude);
		const lngs = locations.map((loc) => loc.longitude);

		const minLat = Math.min(...lats);
		const maxLat = Math.max(...lats);
		const minLng = Math.min(...lngs);
		const maxLng = Math.max(...lngs);

		const centerLat = (minLat + maxLat) / 2;
		const centerLng = (minLng + maxLng) / 2;

		// Füge etwas Padding hinzu
		const latDelta = (maxLat - minLat) * 1.2 || 0.01;
		const lngDelta = (maxLng - minLng) * 1.2 || 0.01;

		return {
			latitude: centerLat,
			longitude: centerLng,
			latitudeDelta: Math.max(latDelta, 0.01),
			longitudeDelta: Math.max(lngDelta, 0.01),
		};
	};

	// Erstelle Koordinaten für die Polyline (chronologischer Pfad)
	const getPolylineCoordinates = () => {
		return filteredLocations
			.sort((a, b) => {
				const aTime = a.timestamps?.recordedMs || a.timestamp || 0;
				const bTime = b.timestamps?.recordedMs || b.timestamp || 0;
				return aTime - bTime;
			})
			.map((location) => ({
				latitude: location.latitude,
				longitude: location.longitude,
			}));
	};

	return (
		<ThemeWrapper>
			<Stack.Screen
				options={{
					title: 'Karte',
					headerTransparent: false,
					headerBlurEffect: undefined,
					headerStyle: {
						backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
					},
					headerShadowVisible: false,
					headerTintColor: isDarkMode ? '#FFFFFF' : '#000000',
					headerLeft: () => (
						<View style={{ paddingLeft: 16 }}>
							<SettingsButton />
						</View>
					),
				}}
			/>
			<View style={styles.container}>
				<MapView
					style={styles.map}
					region={getRegionForLocations()}
					mapType={isDarkMode ? 'mutedStandard' : 'standard'}
					showsUserLocation
					showsMyLocationButton={false}
					showsCompass
					showsScale
					userInterfaceStyle={isDarkMode ? 'dark' : 'light'}
					customMapStyle={isDarkMode ? darkMapStyle : undefined}
				>
					{/* Polyline für den Bewegungspfad */}
					{showRoute && filteredLocations.length > 1 && (
						<Polyline
							coordinates={getPolylineCoordinates()}
							strokeColor={colors.primary}
							strokeWidth={3}
						/>
					)}

					{/* Marker - Heatmap oder normale Ansicht */}
					{showHeatmap
						? // Heatmap: Cluster anzeigen
							locationClusters.map((cluster, index) => (
								<Marker
									key={`cluster-${index}`}
									coordinate={{
										latitude: cluster.latitude,
										longitude: cluster.longitude,
									}}
									pinColor={getHeatmapColor(cluster.count, maxClusterCount)}
								>
									<View
										style={[
											styles.clusterMarker,
											{
												backgroundColor: getHeatmapColor(cluster.count, maxClusterCount),
												width: 30 + cluster.count * 3,
												height: 30 + cluster.count * 3,
												borderRadius: (30 + cluster.count * 3) / 2,
											},
										]}
									>
										<Text style={styles.clusterText}>{cluster.count}</Text>
									</View>
								</Marker>
							))
						: // Normale Ansicht: Einzelne Marker
							filteredLocations.map((location, index) => (
								<Marker
									key={`location-${location.timestamp}-${index}`}
									coordinate={{
										latitude: location.latitude,
										longitude: location.longitude,
									}}
									title={`Standort ${index + 1}`}
									description={new Date(
										location.timestamps?.recordedMs || location.timestamp || 0
									).toLocaleString('de-DE')}
									pinColor={colors.primary}
									opacity={0.6}
								/>
							))}
				</MapView>

				{/* Time Filter */}
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					style={styles.filterScrollView}
					contentContainerStyle={styles.filterContainer}
				>
					{TIME_FILTERS.map((filter) => (
						<TouchableOpacity
							key={filter.id}
							style={[
								styles.filterButton,
								selectedTimeFilter === filter.id && {
									backgroundColor: colors.primary,
								},
								isDarkMode &&
									selectedTimeFilter !== filter.id && {
										backgroundColor: '#333',
									},
							]}
							onPress={() => setSelectedTimeFilter(filter.id)}
						>
							<FontAwesome
								name={filter.icon}
								size={16}
								color={selectedTimeFilter === filter.id ? 'white' : isDarkMode ? '#AAA' : '#666'}
								style={{ marginRight: 8 }}
							/>
							<Text
								style={[
									styles.filterText,
									selectedTimeFilter === filter.id && { color: 'white', fontWeight: 'bold' },
									isDarkMode && selectedTimeFilter !== filter.id && { color: '#AAA' },
								]}
							>
								{filter.label}
							</Text>
						</TouchableOpacity>
					))}
				</ScrollView>

				{/* View Mode Controls */}
				<View style={styles.viewControls}>
					{/* Route Toggle */}
					<TouchableOpacity
						style={[
							styles.controlButton,
							isDarkMode && {
								backgroundColor: '#333',
							},
						]}
						onPress={() => setShowRoute(!showRoute)}
					>
						<FontAwesome
							name={showRoute ? 'eye' : 'eye-slash'}
							size={22}
							color={showRoute ? colors.primary : '#999'}
						/>
					</TouchableOpacity>

					{/* Heatmap Toggle */}
					<TouchableOpacity
						style={[
							styles.controlButton,
							showHeatmap && { backgroundColor: colors.primary },
							isDarkMode &&
								!showHeatmap && {
									backgroundColor: '#333',
								},
						]}
						onPress={() => setShowHeatmap(!showHeatmap)}
					>
						<FontAwesome name="fire" size={22} color={showHeatmap ? 'white' : '#999'} />
					</TouchableOpacity>
				</View>

				{/* Location Count Badge */}
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
						{filteredLocations.length}
					</Text>
				</View>
			</View>
		</ThemeWrapper>
	);
}

// Dark Mode Map Style (minimalistisch)
const darkMapStyle = [
	{
		elementType: 'geometry',
		stylers: [
			{
				color: '#1d2c4d',
			},
		],
	},
	{
		elementType: 'labels.text.fill',
		stylers: [
			{
				color: '#8ec3b9',
			},
		],
	},
	{
		elementType: 'labels.text.stroke',
		stylers: [
			{
				color: '#1a3646',
			},
		],
	},
	{
		featureType: 'administrative.country',
		elementType: 'geometry.stroke',
		stylers: [
			{
				color: '#4b6878',
			},
		],
	},
	{
		featureType: 'administrative.land_parcel',
		elementType: 'labels.text.fill',
		stylers: [
			{
				color: '#64779f',
			},
		],
	},
	{
		featureType: 'administrative.province',
		elementType: 'geometry.stroke',
		stylers: [
			{
				color: '#4b6878',
			},
		],
	},
	{
		featureType: 'landscape.man_made',
		elementType: 'geometry.stroke',
		stylers: [
			{
				color: '#334e87',
			},
		],
	},
	{
		featureType: 'landscape.natural',
		elementType: 'geometry',
		stylers: [
			{
				color: '#023e58',
			},
		],
	},
	{
		featureType: 'poi',
		elementType: 'geometry',
		stylers: [
			{
				color: '#283d6a',
			},
		],
	},
	{
		featureType: 'poi',
		elementType: 'labels.text.fill',
		stylers: [
			{
				color: '#6f9ba5',
			},
		],
	},
	{
		featureType: 'poi',
		elementType: 'labels.text.stroke',
		stylers: [
			{
				color: '#1d2c4d',
			},
		],
	},
	{
		featureType: 'poi.park',
		elementType: 'geometry.fill',
		stylers: [
			{
				color: '#023e58',
			},
		],
	},
	{
		featureType: 'poi.park',
		elementType: 'labels.text.fill',
		stylers: [
			{
				color: '#3C7680',
			},
		],
	},
	{
		featureType: 'road',
		elementType: 'geometry',
		stylers: [
			{
				color: '#304a7d',
			},
		],
	},
	{
		featureType: 'road',
		elementType: 'labels.text.fill',
		stylers: [
			{
				color: '#98a5be',
			},
		],
	},
	{
		featureType: 'road',
		elementType: 'labels.text.stroke',
		stylers: [
			{
				color: '#1d2c4d',
			},
		],
	},
	{
		featureType: 'road.highway',
		elementType: 'geometry',
		stylers: [
			{
				color: '#2c6675',
			},
		],
	},
	{
		featureType: 'road.highway',
		elementType: 'geometry.stroke',
		stylers: [
			{
				color: '#255763',
			},
		],
	},
	{
		featureType: 'road.highway',
		elementType: 'labels.text.fill',
		stylers: [
			{
				color: '#b0d5ce',
			},
		],
	},
	{
		featureType: 'road.highway',
		elementType: 'labels.text.stroke',
		stylers: [
			{
				color: '#023e58',
			},
		],
	},
	{
		featureType: 'transit',
		elementType: 'labels.text.fill',
		stylers: [
			{
				color: '#98a5be',
			},
		],
	},
	{
		featureType: 'transit',
		elementType: 'labels.text.stroke',
		stylers: [
			{
				color: '#1d2c4d',
			},
		],
	},
	{
		featureType: 'transit.line',
		elementType: 'geometry.fill',
		stylers: [
			{
				color: '#283d6a',
			},
		],
	},
	{
		featureType: 'transit.station',
		elementType: 'geometry',
		stylers: [
			{
				color: '#3a4762',
			},
		],
	},
	{
		featureType: 'water',
		elementType: 'geometry',
		stylers: [
			{
				color: '#0e1626',
			},
		],
	},
	{
		featureType: 'water',
		elementType: 'labels.text.fill',
		stylers: [
			{
				color: '#4e6d70',
			},
		],
	},
];

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	map: {
		flex: 1,
	},
	filterScrollView: {
		position: 'absolute',
		bottom: 100,
		left: 0,
		right: 0,
		maxHeight: 60,
	},
	filterContainer: {
		paddingHorizontal: 12,
		gap: 10,
	},
	filterButton: {
		backgroundColor: 'rgba(255, 255, 255, 0.9)',
		borderRadius: 24,
		paddingHorizontal: 18,
		paddingVertical: 12,
		flexDirection: 'row',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.2,
		shadowRadius: 2,
		elevation: 3,
	},
	filterText: {
		fontSize: 15,
		color: '#666',
		fontWeight: '600',
	},
	viewControls: {
		position: 'absolute',
		bottom: 170,
		right: 16,
		flexDirection: 'column',
		gap: 10,
	},
	controlButton: {
		backgroundColor: 'rgba(255, 255, 255, 0.9)',
		borderRadius: 28,
		width: 56,
		height: 56,
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 3,
		elevation: 4,
	},
	clusterMarker: {
		justifyContent: 'center',
		alignItems: 'center',
		opacity: 0.8,
		borderWidth: 2,
		borderColor: 'white',
	},
	clusterText: {
		color: 'white',
		fontWeight: 'bold',
		fontSize: 14,
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
});
