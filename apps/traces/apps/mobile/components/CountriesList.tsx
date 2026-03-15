import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity } from 'react-native';

import { formatDuration } from '../utils/locationHelper';
import { CountryVisit } from '../utils/placeService';
import { useTheme } from '../utils/themeContext';

interface CountriesListProps {
	countries: CountryVisit[];
	onCountryPress?: (country: CountryVisit) => void;
	isDarkMode?: boolean;
}

export const CountriesList: React.FC<CountriesListProps> = ({
	countries,
	onCountryPress,
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

	const getCountryFlag = (countryCode?: string): string => {
		if (!countryCode || countryCode.length !== 2) return '🌍';

		// Convert country code to flag emoji
		const codePoints = countryCode
			.toUpperCase()
			.split('')
			.map((char) => 127397 + char.charCodeAt(0));
		return String.fromCodePoint(...codePoints);
	};

	const renderItem = ({ item, index }: { item: CountryVisit; index: number }) => {
		const formattedDuration = formatDuration(item.totalDuration);
		const flag = getCountryFlag(item.countryCode);

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
				onPress={() => onCountryPress && onCountryPress(item)}
			>
				<View style={[styles.flagContainer, isDarkMode && { backgroundColor: '#333333' }]}>
					<Text style={styles.flagEmoji}>{flag}</Text>
				</View>

				<View style={styles.contentContainer}>
					<View style={styles.headerRow}>
						<Text style={[styles.countryName, isDarkMode && { color: '#FFFFFF' }]}>
							{item.country}
						</Text>
						<View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
							<Text style={styles.countText}>{item.visitCount}x</Text>
						</View>
					</View>

					<Text style={[styles.citiesCount, isDarkMode && { color: '#AAAAAA' }]}>
						{item.cities.size} {item.cities.size === 1 ? 'Stadt' : 'Städte'} besucht
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
			data={countries}
			renderItem={renderItem}
			keyExtractor={(item, index) => `country-${item.country}-${index}`}
			contentContainerStyle={[styles.listContent, isDarkMode && { backgroundColor: '#121212' }]}
			ListEmptyComponent={
				<View style={styles.emptyContainer}>
					<Text style={styles.emptyFlag}>🌍</Text>
					<Text style={[styles.emptyText, isDarkMode && { color: '#AAAAAA' }]}>
						Keine Länder gefunden
					</Text>
					<Text style={[styles.emptySubtext, isDarkMode && { color: '#777777' }]}>
						Besuche verschiedene Länder, um sie hier anzuzeigen
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
	flagContainer: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: '#f0f0f0',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
	},
	flagEmoji: {
		fontSize: 24,
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
	countryName: {
		fontSize: 18,
		fontWeight: 'bold',
		flex: 1,
		marginRight: 8,
	},
	citiesCount: {
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
	emptyFlag: {
		fontSize: 48,
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
