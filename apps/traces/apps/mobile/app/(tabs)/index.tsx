import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Stack, useRouter, Link } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Alert, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeaderButton } from '~/components/HeaderButton';
import { LocationMap } from '~/components/LocationMap';
import { SettingsButton } from '~/components/SettingsButton';
import { ThemeWrapper } from '~/components/ThemeWrapper';
import { TrackingControls, TRACKING_INTERVALS } from '~/components/TrackingControls';
import { stopBackgroundLocationTask } from '~/utils/backgroundLocationTask';
import {
	DEFAULT_INTERVAL_KEY,
	getDefaultInterval,
	LocationData,
	requestLocationPermissions,
	getCurrentLocation,
	startLocationTracking,
	getLocationHistory,
} from '~/utils/locationService';
import { useTheme } from '~/utils/themeContext';

export default function Home() {
	const router = useRouter();
	const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
	const [locationHistory, setLocationHistory] = useState<LocationData[]>([]);
	const [isTracking, setIsTracking] = useState(false);
	const [selectedInterval, setSelectedInterval] = useState(TRACKING_INTERVALS[0].value);
	const locationSubscription = useRef<Location.LocationSubscription | null>(null);

	// Sofortige Berechtigungsanfrage beim Laden
	useEffect(() => {
		const requestPermissions = async () => {
			try {
				// Zuerst direkt die Vordergrund-Berechtigung anfordern
				const foreground = await Location.requestForegroundPermissionsAsync();

				if (foreground.status === 'granted') {
					// Wenn Vordergrund genehmigt, dann Hintergrund anfragen
					await Location.requestBackgroundPermissionsAsync();
				}
			} catch (error) {
				console.error('Error requesting initial permissions:', error);
			}
		};

		requestPermissions();
	}, []);

	// Load location history on mount
	useEffect(() => {
		loadLocationHistory();
		loadDefaultInterval();

		// Get initial location
		getCurrentLocation().then((location) => {
			if (location) {
				setCurrentLocation(location);
			}
		});

		return () => {
			// Clean up subscription when component unmounts
			if (locationSubscription.current) {
				locationSubscription.current.remove();
			}

			// Stoppe auch die Hintergrund-Standortverfolgung beim Beenden
			stopBackgroundLocationTask().catch((err) =>
				console.error('Fehler beim Stoppen der Hintergrund-Standortverfolgung:', err)
			);
		};
	}, []); // Nur beim Mount ausführen

	// Separater useEffect für History-Updates während Tracking
	useEffect(() => {
		if (!isTracking) return;

		// Intervall zum regelmäßigen Aktualisieren der Standorthistorie
		const historyUpdateInterval = setInterval(() => {
			loadLocationHistory();
		}, 3000); // Alle 3 Sekunden aktualisieren wenn Tracking aktiv (für bessere UI-Updates)

		return () => {
			clearInterval(historyUpdateInterval);
		};
	}, [isTracking]);

	const loadLocationHistory = async () => {
		const history = await getLocationHistory();
		setLocationHistory(history);
	};

	// Lade den Standard-Intervall
	const loadDefaultInterval = async () => {
		try {
			const interval = await getDefaultInterval();
			if (interval !== null) {
				setSelectedInterval(interval);
			}
		} catch (error) {
			console.error('Fehler beim Laden des Standard-Intervalls:', error);
		}
	};

	const handleStartTracking = async (interval: number = TRACKING_INTERVALS[0].value) => {
		const hasPermission = await requestLocationPermissions();
		if (!hasPermission) {
			Alert.alert(
				'Standort-Berechtigung benötigt',
				'Diese App benötigt Zugriff auf deinen Standort, um deine Bewegungen zu verfolgen.',
				[{ text: 'OK' }]
			);
			return;
		}

		setSelectedInterval(interval);

		// Bestimme die Distanz basierend auf dem Intervall
		let distanceInterval = 10; // Standard: 10 Meter

		if (interval >= 3 * 60 * 60 * 1000) {
			// 3 Stunden oder mehr
			distanceInterval = 100;
		} else if (interval >= 60 * 60 * 1000) {
			// 1 Stunde oder mehr
			distanceInterval = 50;
		}

		const subscription = await startLocationTracking(
			(location) => {
				setCurrentLocation(location);
				// Sofortige Aktualisierung der History bei neuen Standorten
				setTimeout(() => loadLocationHistory(), 500); // Kurze Verzögerung damit Speichervorgang abgeschlossen ist
			},
			interval, // Intervall aus der Auswahl
			distanceInterval // Distanz basierend auf dem Intervall
		);

		if (subscription) {
			locationSubscription.current = subscription;
			setIsTracking(true);
			// Sofortiges Update der History nach Tracking-Start
			setTimeout(() => loadLocationHistory(), 1000);
		}
	};

	const handleStopTracking = async () => {
		if (locationSubscription.current) {
			locationSubscription.current.remove();
			locationSubscription.current = null;
		}

		// Stoppe auch die Hintergrund-Standortverfolgung
		await stopBackgroundLocationTask();

		setIsTracking(false);
	};

	const { isDarkMode } = useTheme();
	const insets = useSafeAreaInsets();

	return (
		<ThemeWrapper>
			<Stack.Screen
				options={{
					title: 'Tracking',
					headerTransparent: false,
					headerBlurEffect: undefined,
					headerStyle: {
						backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
					},
					headerShadowVisible: false,
					headerTintColor: isDarkMode ? '#FFFFFF' : '#000000',
					headerRight: () => (
						<Link href="/modal" asChild>
							<HeaderButton />
						</Link>
					),
					headerLeft: () => (
						<View style={{ paddingLeft: 16 }}>
							<SettingsButton />
						</View>
					),
				}}
			/>
			<View
				style={[
					styles.container,
					isDarkMode && { backgroundColor: '#121212' },
					{
						paddingBottom: Math.max(insets.bottom, 16),
						paddingHorizontal: 16,
						paddingTop: Math.max(insets.top, 16),
					},
				]}
			>
				<View
					style={[
						styles.mapContainer,
						isDarkMode && { borderColor: '#333333' },
						{ overflow: 'hidden' },
					]}
				>
					<LocationMap
						currentLocation={currentLocation}
						locationHistory={locationHistory}
						isTracking={isTracking}
						isDarkMode={isDarkMode}
						locationCount={locationHistory.length}
					/>
				</View>
				<View style={{ marginBottom: insets.bottom + 32 }}>
					<TrackingControls
						isTracking={isTracking}
						onStartTracking={handleStartTracking}
						onStopTracking={handleStopTracking}
						locationCount={locationHistory.length}
						selectedInterval={selectedInterval}
						isDarkMode={isDarkMode}
					/>
				</View>
			</View>
		</ThemeWrapper>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	mapContainer: {
		flex: 1,
		borderRadius: 8,
		overflow: 'hidden',
		borderWidth: 1,
		borderColor: '#e0e0e0',
		marginBottom: 16,
	},
});
