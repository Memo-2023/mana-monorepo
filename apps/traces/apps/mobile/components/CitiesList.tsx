import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity } from 'react-native';

import { formatDuration } from '../utils/locationHelper';
import { CityVisit } from '../utils/placeService';
import { useTheme } from '../utils/themeContext';

interface CitiesListProps {
	cities: CityVisit[];
	onCityPress?: (city: CityVisit) => void;
	isDarkMode?: boolean;
}

export const CitiesList: React.FC<CitiesListProps> = ({
	cities,
	onCityPress,
	isDarkMode = false,
}) => {
	const { colors } = useTheme();
	const formatDate = (timestamp: number) => {
		const date = new Date(timestamp);
		return date.toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	};

	const renderItem = ({ item, index }: { item: CityVisit; index: number }) => {
		const formattedDuration = formatDuration(item.totalDuration);

		return (
			<TouchableOpacity
				style={[
					styles.item,
					isDarkMode && {
						backgroundColor: '#1E1E1E',
						shadowColor: '#000000',
						shadowOpacity: 0.3,
					},
				]}
				onPress={() => onCityPress && onCityPress(item)}
			>
				<View style={[styles.indexContainer, isDarkMode && { backgroundColor: '#333333' }]}>
					<FontAwesome name="building" size={18} color={colors.primary} style={styles.iconStyle} />
				</View>

				<View style={styles.contentContainer}>
					<View style={styles.headerRow}>
						<Text style={[styles.cityName, isDarkMode && { color: '#FFFFFF' }]}>{item.city}</Text>
						<View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
							<Text style={styles.countText}>{item.visitCount}x</Text>
						</View>
					</View>

					<Text style={[styles.locationCount, isDarkMode && { color: '#AAAAAA' }]}>
						{item.locations.length} {item.locations.length === 1 ? 'Ort' : 'Orte'} besucht
					</Text>

					<View style={styles.coordinatesRow}>
						<View style={styles.coordinateItem}>
							<Text style={[styles.coordinateLabel, isDarkMode && { color: '#888888' }]}>
								Gesamtdauer
							</Text>
							<Text style={[styles.coordinateValue, isDarkMode && { color: '#FFFFFF' }]}>
								{formattedDuration}
							</Text>
						</View>
						<View style={styles.coordinateItem}>
							<Text style={[styles.coordinateLabel, isDarkMode && { color: '#888888' }]}>
								Letzter Besuch
							</Text>
							<Text style={[styles.coordinateValue, isDarkMode && { color: '#FFFFFF' }]}>
								{formatDate(item.lastVisit)}
							</Text>
						</View>
					</View>
				</View>

				<View style={styles.arrowContainer}>
					<FontAwesome name="chevron-right" size={16} color={isDarkMode ? '#666666' : '#ccc'} />
				</View>
			</TouchableOpacity>
		);
	};

	return (
		<FlatList
			data={cities}
			renderItem={renderItem}
			keyExtractor={(item, index) => `city-${item.city}-${index}`}
			contentContainerStyle={[styles.listContent, isDarkMode && { backgroundColor: '#121212' }]}
			ListEmptyComponent={
				<View style={styles.emptyContainer}>
					<FontAwesome name="building" size={48} color={isDarkMode ? '#444444' : '#ccc'} />
					<Text style={[styles.emptyText, isDarkMode && { color: '#AAAAAA' }]}>
						Keine Städte gefunden
					</Text>
					<Text style={[styles.emptySubtext, isDarkMode && { color: '#777777' }]}>
						Besuche verschiedene Städte, um sie hier anzuzeigen
					</Text>
				</View>
			}
		/>
	);
};

const styles = StyleSheet.create({
	listContent: {
		padding: 16,
		paddingBottom: 32,
	},
	item: {
		flexDirection: 'row',
		backgroundColor: 'white',
		borderRadius: 8,
		marginBottom: 12,
		padding: 12,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	indexContainer: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: '#f0f0f0',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
	},
	iconStyle: {
		textAlign: 'center',
	},
	contentContainer: {
		flex: 1,
	},
	headerRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 4,
	},
	cityName: {
		fontSize: 18,
		fontWeight: 'bold',
		flex: 1,
		marginRight: 8,
	},
	locationCount: {
		fontSize: 14,
		color: '#666',
		marginBottom: 8,
	},
	countBadge: {
		// backgroundColor set dynamically via colors.primary
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 12,
		minWidth: 24,
		alignItems: 'center',
	},
	countText: {
		color: 'white',
		fontSize: 12,
		fontWeight: 'bold',
	},
	coordinatesRow: {
		flexDirection: 'row',
		marginBottom: 8,
	},
	coordinateItem: {
		flex: 1,
		marginRight: 8,
	},
	coordinateLabel: {
		fontSize: 12,
		color: '#999',
		marginBottom: 2,
	},
	coordinateValue: {
		fontSize: 14,
	},
	arrowContainer: {
		justifyContent: 'center',
		paddingLeft: 8,
	},
	emptyContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		padding: 48,
	},
	emptyText: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#666',
		marginTop: 16,
	},
	emptySubtext: {
		fontSize: 14,
		color: '#999',
		textAlign: 'center',
		marginTop: 8,
	},
});
