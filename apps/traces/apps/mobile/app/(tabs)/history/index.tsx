import { FontAwesome } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';

import { ConsolidatedLocationList } from '~/components/ConsolidatedLocationList';
import { LocationHistoryList } from '~/components/LocationHistoryList';
import { SegmentedControl, SegmentedControlOption } from '~/components/SegmentedControl';
import { ThemeWrapper } from '~/components/ThemeWrapper';
import { ConsolidatedLocation, consolidateLocationsByProximity } from '~/utils/locationHelper';
import { LocationData, getLocationHistory } from '~/utils/locationService';
import { useTheme } from '~/utils/themeContext';

export default function HistoryScreen() {
	const [locationHistory, setLocationHistory] = useState<LocationData[]>([]);
	const [consolidatedLocations, setConsolidatedLocations] = useState<ConsolidatedLocation[]>([]);
	const [showConsolidated, setShowConsolidated] = useState(false);
	const [consolidationRadius, setConsolidationRadius] = useState(100);
	const router = useRouter();

	const segmentedOptions: SegmentedControlOption[] = [
		{ value: 'all', label: 'Alle Standorte', icon: 'list' },
		{
			value: 'consolidated',
			label: 'Zusammengefasst',
			icon: 'compress',
			badge: consolidatedLocations.length,
		},
	];

	useEffect(() => {
		loadLocationHistory();
		const interval = setInterval(loadLocationHistory, 10000);
		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		if (locationHistory.length > 0) {
			const consolidated = consolidateLocationsByProximity(locationHistory, consolidationRadius);
			setConsolidatedLocations(consolidated);
		} else {
			setConsolidatedLocations([]);
		}
	}, [locationHistory, consolidationRadius]);

	const loadLocationHistory = async () => {
		const history = await getLocationHistory();
		setLocationHistory(history);
	};

	const handleLocationPress = (location: LocationData) => {
		router.navigate('/');
	};

	const handleConsolidatedLocationPress = (location: ConsolidatedLocation) => {
		router.navigate('/');
	};

	const { isDarkMode, colors } = useTheme();
	const navigation = useNavigation();

	useEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<Pressable
					onPress={() => router.push('/settings')}
					style={({ pressed }) => ({
						opacity: pressed ? 0.5 : 1,
						paddingHorizontal: 16,
						paddingVertical: 8,
					})}
				>
					<FontAwesome name="gear" size={24} color={isDarkMode ? '#FFFFFF' : colors.primary} />
				</Pressable>
			),
			headerRightContainerStyle: {
				paddingRight: 8,
			},
		});
	}, [isDarkMode, navigation, router]);

	return (
		<ThemeWrapper>
			<View style={styles.container}>
				<View style={styles.listContainer}>
					{showConsolidated ? (
						<ConsolidatedLocationList
							consolidatedLocations={consolidatedLocations}
							onItemPress={handleConsolidatedLocationPress}
							onDelete={loadLocationHistory}
							isDarkMode={isDarkMode}
						/>
					) : (
						<LocationHistoryList
							locationHistory={locationHistory}
							onItemPress={handleLocationPress}
							onDelete={loadLocationHistory}
							isDarkMode={isDarkMode}
						/>
					)}
				</View>

				<SegmentedControl
					options={segmentedOptions}
					activeValue={showConsolidated ? 'consolidated' : 'all'}
					onChange={(value) => setShowConsolidated(value === 'consolidated')}
					isDarkMode={isDarkMode}
				/>
			</View>
		</ThemeWrapper>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	listContainer: {
		flex: 1,
		paddingBottom: 80,
	},
});
