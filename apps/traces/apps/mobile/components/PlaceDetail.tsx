import { FontAwesome } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import React, { useState } from 'react';
import {
	StyleSheet,
	View,
	Text,
	TextInput,
	TouchableOpacity,
	ScrollView,
	Alert,
} from 'react-native';

import { ThemeWrapper } from './ThemeWrapper';
import { Place, formatDuration } from '../utils/locationHelper';
import { useTheme } from '../utils/themeContext';

interface PlaceDetailProps {
	place: Place;
	onSave: (updatedPlace: Place) => void;
	onDelete: (placeId: string) => void;
}

export const PlaceDetail: React.FC<PlaceDetailProps> = ({ place, onSave, onDelete }) => {
	const { isDarkMode, colors } = useTheme();
	const [name, setName] = useState(place.name);
	const [customAddress, setCustomAddress] = useState(place.customAddress || '');
	const [radius, setRadius] = useState(place.radius || 100);

	const formatDate = (timestamp: number) => {
		const date = new Date(timestamp);
		return date.toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	};

	const formatTime = (timestamp: number) => {
		const date = new Date(timestamp);
		return date.toLocaleTimeString('de-DE', {
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const handleSave = () => {
		// Name darf nicht leer sein
		if (!name.trim()) {
			Alert.alert('Fehler', 'Bitte einen Namen für diesen Ort eingeben.');
			return;
		}

		const updatedPlace: Place = {
			...place,
			name,
			customAddress: customAddress.trim() || undefined,
			radius,
		};

		onSave(updatedPlace);
	};

	const handleDelete = () => {
		Alert.alert('Ort löschen', `Möchtest du "${place.name}" wirklich löschen?`, [
			{
				text: 'Abbrechen',
				style: 'cancel',
			},
			{
				text: 'Löschen',
				style: 'destructive',
				onPress: () => onDelete(place.id),
			},
		]);
	};

	// Hilfsfunktion zur Formatierung der Koordinaten
	const formatCoordinate = (coord: number) => coord.toFixed(6);

	// Ermittle primäre Adresse, wenn keine benutzerdefinierte vorhanden ist
	const getPrimaryAddress = (): string => {
		if (place.addresses.size === 0) {
			return 'Keine Adressinformationen';
		}
		return Array.from(place.addresses)[0];
	};

	return (
		<ThemeWrapper>
			<ScrollView
				style={[styles.container, isDarkMode && { backgroundColor: '#121212' }]}
				contentContainerStyle={styles.contentContainer}
			>
				{/* Header-Bereich mit Name und Besuchen */}
				<View style={styles.header}>
					<View style={styles.inputContainer}>
						<Text style={[styles.label, isDarkMode && { color: '#CCCCCC' }]}>Ortsname</Text>
						<TextInput
							style={[
								styles.input,
								isDarkMode && {
									backgroundColor: '#2C2C2C',
									color: '#FFFFFF',
									borderColor: '#444444',
								},
							]}
							value={name}
							onChangeText={setName}
							placeholder="Name des Ortes"
							placeholderTextColor={isDarkMode ? '#777777' : '#999999'}
						/>
					</View>

					<View style={styles.statsContainer}>
						<View style={styles.statItem}>
							<Text style={[styles.statValue, isDarkMode && { color: '#FFFFFF' }]}>
								{place.visitCount}
							</Text>
							<Text style={[styles.statLabel, isDarkMode && { color: '#AAAAAA' }]}>Besuche</Text>
						</View>

						<View style={styles.statItem}>
							<Text style={[styles.statValue, isDarkMode && { color: '#FFFFFF' }]}>
								{formatDuration(place.totalDuration)}
							</Text>
							<Text style={[styles.statLabel, isDarkMode && { color: '#AAAAAA' }]}>Gesamtzeit</Text>
						</View>
					</View>
				</View>

				{/* Adresse-Bereich */}
				<View style={styles.section}>
					<Text style={[styles.sectionTitle, isDarkMode && { color: '#CCCCCC' }]}>Adresse</Text>

					<TextInput
						style={[
							styles.input,
							isDarkMode && {
								backgroundColor: '#2C2C2C',
								color: '#FFFFFF',
								borderColor: '#444444',
							},
						]}
						value={customAddress}
						onChangeText={setCustomAddress}
						placeholder={getPrimaryAddress()}
						placeholderTextColor={isDarkMode ? '#777777' : '#999999'}
						multiline
					/>

					{place.addresses.size > 0 && !customAddress && (
						<Text style={[styles.hintText, isDarkMode && { color: '#888888' }]}>
							Überschreibe die automatisch erkannte Adresse oder lasse das Feld leer, um die
							erkannte Adresse zu verwenden.
						</Text>
					)}
				</View>

				{/* Radius-Bereich */}
				<View style={styles.section}>
					<Text style={[styles.sectionTitle, isDarkMode && { color: '#CCCCCC' }]}>
						Erkennungsradius
					</Text>

					<Slider
						style={styles.slider}
						minimumValue={50}
						maximumValue={500}
						step={10}
						value={radius}
						onValueChange={setRadius}
						minimumTrackTintColor={colors.primary}
						maximumTrackTintColor={isDarkMode ? '#444444' : '#D1D1D1'}
						thumbTintColor={colors.primary}
					/>

					<Text
						style={[
							styles.radiusText,
							{ color: colors.primary },
							isDarkMode && { color: '#AAAAAA' },
						]}
					>
						{radius} Meter
					</Text>

					<Text style={[styles.hintText, isDarkMode && { color: '#888888' }]}>
						Standorte innerhalb dieses Radius werden als Besuche an diesem Ort gezählt.
					</Text>
				</View>

				{/* Details-Bereich */}
				<View style={styles.section}>
					<Text style={[styles.sectionTitle, isDarkMode && { color: '#CCCCCC' }]}>Ortdetails</Text>

					<View style={styles.detailsGrid}>
						<View style={styles.detailItem}>
							<Text style={[styles.detailLabel, isDarkMode && { color: '#888888' }]}>
								Breitengrad
							</Text>
							<Text style={[styles.detailValue, isDarkMode && { color: '#FFFFFF' }]}>
								{formatCoordinate(place.latitude)}°
							</Text>
						</View>

						<View style={styles.detailItem}>
							<Text style={[styles.detailLabel, isDarkMode && { color: '#888888' }]}>
								Längengrad
							</Text>
							<Text style={[styles.detailValue, isDarkMode && { color: '#FFFFFF' }]}>
								{formatCoordinate(place.longitude)}°
							</Text>
						</View>

						<View style={styles.detailItem}>
							<Text style={[styles.detailLabel, isDarkMode && { color: '#888888' }]}>
								Erster Besuch
							</Text>
							<Text style={[styles.detailValue, isDarkMode && { color: '#FFFFFF' }]}>
								{formatDate(place.firstVisit)}
							</Text>
						</View>

						<View style={styles.detailItem}>
							<Text style={[styles.detailLabel, isDarkMode && { color: '#888888' }]}>
								Letzter Besuch
							</Text>
							<Text style={[styles.detailValue, isDarkMode && { color: '#FFFFFF' }]}>
								{formatDate(place.lastVisit)}
							</Text>
						</View>

						{place.accuracy !== undefined && (
							<View style={styles.detailItem}>
								<Text style={[styles.detailLabel, isDarkMode && { color: '#888888' }]}>
									Durchschn. Genauigkeit
								</Text>
								<Text style={[styles.detailValue, isDarkMode && { color: '#FFFFFF' }]}>
									~{place.accuracy.toFixed(1)}m
								</Text>
							</View>
						)}

						{place.altitude !== undefined && (
							<View style={styles.detailItem}>
								<Text style={[styles.detailLabel, isDarkMode && { color: '#888888' }]}>
									Durchschn. Höhe
								</Text>
								<Text style={[styles.detailValue, isDarkMode && { color: '#FFFFFF' }]}>
									~{place.altitude.toFixed(1)}m
								</Text>
							</View>
						)}
					</View>
				</View>

				{/* Action-Buttons */}
				<View style={styles.actionsContainer}>
					<TouchableOpacity
						style={[styles.button, styles.saveButton, { backgroundColor: colors.primary }]}
						onPress={handleSave}
					>
						<FontAwesome name="check" size={16} color="#FFF" style={styles.buttonIcon} />
						<Text style={styles.buttonText}>Speichern</Text>
					</TouchableOpacity>

					<TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDelete}>
						<FontAwesome name="trash" size={16} color="#FFF" style={styles.buttonIcon} />
						<Text style={styles.buttonText}>Löschen</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</ThemeWrapper>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	contentContainer: {
		padding: 16,
		paddingBottom: 32,
	},
	header: {
		marginBottom: 24,
	},
	inputContainer: {
		marginBottom: 16,
	},
	label: {
		fontSize: 14,
		marginBottom: 6,
		color: '#666',
	},
	input: {
		borderWidth: 1,
		borderColor: '#E0E0E0',
		borderRadius: 8,
		padding: 12,
		fontSize: 16,
		backgroundColor: '#FFFFFF',
	},
	statsContainer: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginTop: 8,
		backgroundColor: '#F5F5F5',
		borderRadius: 8,
		padding: 12,
	},
	statItem: {
		alignItems: 'center',
	},
	statValue: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#333',
	},
	statLabel: {
		fontSize: 14,
		color: '#666',
		marginTop: 4,
	},
	section: {
		marginBottom: 24,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		marginBottom: 12,
		color: '#333',
	},
	slider: {
		height: 40,
		marginBottom: 8,
	},
	radiusText: {
		textAlign: 'center',
		fontSize: 16,
		fontWeight: 'bold',
		// color set dynamically via colors.primary
		marginBottom: 8,
	},
	hintText: {
		fontSize: 12,
		color: '#999',
		marginTop: 8,
		fontStyle: 'italic',
	},
	detailsGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginHorizontal: -8,
	},
	detailItem: {
		width: '50%',
		paddingHorizontal: 8,
		marginBottom: 16,
	},
	detailLabel: {
		fontSize: 12,
		color: '#999',
		marginBottom: 4,
	},
	detailValue: {
		fontSize: 16,
		color: '#333',
	},
	actionsContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 16,
	},
	button: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 8,
		flex: 1,
		marginHorizontal: 6,
	},
	saveButton: {
		// backgroundColor set dynamically via colors.primary
	},
	deleteButton: {
		backgroundColor: '#F44336',
	},
	buttonIcon: {
		marginRight: 8,
	},
	buttonText: {
		color: '#FFFFFF',
		fontWeight: 'bold',
		fontSize: 16,
	},
});
