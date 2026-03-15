import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import {
	View,
	Text,
	Modal,
	TouchableOpacity,
	ScrollView,
	StyleSheet,
	ActivityIndicator,
	Image,
	Alert,
} from 'react-native';

import {
	scanPhotosForGPS,
	importMultiplePhotos,
	PhotoWithGPS,
	ScanResult,
} from '../utils/photoImportService';
import { getLocationHistory, LocationData } from '../utils/locationService';
import { useTheme } from '../utils/themeContext';

interface PhotoImportModalProps {
	visible: boolean;
	onClose: () => void;
	onImportComplete: (count: number) => void;
}

export const PhotoImportModal: React.FC<PhotoImportModalProps> = ({
	visible,
	onClose,
	onImportComplete,
}) => {
	const { isDarkMode, colors } = useTheme();
	const [isScanning, setIsScanning] = useState(false);
	const [isImporting, setIsImporting] = useState(false);
	const [scanResult, setScanResult] = useState<ScanResult | null>(null);
	const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
	const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

	const handleScan = async () => {
		setIsScanning(true);
		try {
			const result = await scanPhotosForGPS({ limit: 100 });
			setScanResult(result);

			// Alle Fotos mit GPS standardmäßig auswählen
			const allIds = new Set(result.photos.map((p) => p.id));
			setSelectedPhotos(allIds);
		} catch (error) {
			Alert.alert('Fehler', 'Konnte Fotos nicht scannen');
		} finally {
			setIsScanning(false);
		}
	};

	const handleImport = async () => {
		if (!scanResult || selectedPhotos.size === 0) return;

		setIsImporting(true);
		try {
			// Lade bestehende Locations für Duplikat-Check
			const existingLocations = await getLocationHistory();

			// Filtere ausgewählte Fotos
			const photosToImport = scanResult.photos.filter((p) => selectedPhotos.has(p.id));

			// Importiere Fotos
			const importedLocations = await importMultiplePhotos(
				photosToImport,
				existingLocations,
				(current, total) => {
					setImportProgress({ current, total });
				}
			);

			// Speichere in AsyncStorage
			if (importedLocations.length > 0) {
				const LOCATION_HISTORY_KEY = 'location_history';
				const updatedHistory = [...existingLocations, ...importedLocations];
				await AsyncStorage.setItem(LOCATION_HISTORY_KEY, JSON.stringify(updatedHistory));
			}

			// Erfolg
			Alert.alert(
				'Import erfolgreich',
				`${importedLocations.length} Foto-Locations importiert\n${photosToImport.length - importedLocations.length} Duplikate übersprungen`,
				[
					{
						text: 'OK',
						onPress: () => {
							onImportComplete(importedLocations.length);
							onClose();
						},
					},
				]
			);
		} catch (error) {
			Alert.alert('Fehler', 'Import fehlgeschlagen');
		} finally {
			setIsImporting(false);
			setImportProgress({ current: 0, total: 0 });
		}
	};

	const togglePhoto = (photoId: string) => {
		const newSelection = new Set(selectedPhotos);
		if (newSelection.has(photoId)) {
			newSelection.delete(photoId);
		} else {
			newSelection.add(photoId);
		}
		setSelectedPhotos(newSelection);
	};

	const selectAll = () => {
		if (!scanResult) return;
		const allIds = new Set(scanResult.photos.map((p) => p.id));
		setSelectedPhotos(allIds);
	};

	const deselectAll = () => {
		setSelectedPhotos(new Set());
	};

	const formatDate = (timestamp: number) => {
		return new Date(timestamp).toLocaleString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	return (
		<Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
			<View style={[styles.container, isDarkMode && { backgroundColor: '#121212' }]}>
				{/* Header */}
				<View style={[styles.header, isDarkMode && { borderBottomColor: '#333' }]}>
					<TouchableOpacity onPress={onClose} style={styles.closeButton}>
						<FontAwesome name="times" size={24} color={isDarkMode ? '#FFF' : '#000'} />
					</TouchableOpacity>
					<Text style={[styles.title, isDarkMode && { color: '#FFF' }]}>📸 Fotos importieren</Text>
					<View style={{ width: 40 }} />
				</View>

				{/* Content */}
				<ScrollView style={styles.content}>
					{!scanResult ? (
						/* Scan starten */
						<View style={styles.startView}>
							<FontAwesome name="camera" size={64} color={isDarkMode ? '#666' : '#CCC'} />
							<Text style={[styles.startText, isDarkMode && { color: '#AAA' }]}>
								Scanne deine Fotos nach GPS-Daten
							</Text>
							<Text style={[styles.startSubtext, isDarkMode && { color: '#666' }]}>
								Die letzten 100 Fotos werden durchsucht
							</Text>

							<TouchableOpacity
								style={[
									styles.scanButton,
									{ backgroundColor: colors.primary },
									isScanning && styles.scanButtonDisabled,
								]}
								onPress={handleScan}
								disabled={isScanning}
							>
								{isScanning ? (
									<ActivityIndicator color="white" />
								) : (
									<>
										<FontAwesome name="search" size={18} color="white" />
										<Text style={styles.scanButtonText}>Fotos scannen</Text>
									</>
								)}
							</TouchableOpacity>
						</View>
					) : (
						/* Ergebnisse */
						<>
							{/* Statistik */}
							<View style={[styles.statsContainer, isDarkMode && { backgroundColor: '#1E1E1E' }]}>
								<View style={styles.statItem}>
									<Text style={[styles.statValue, isDarkMode && { color: '#FFF' }]}>
										{scanResult.totalPhotos}
									</Text>
									<Text style={[styles.statLabel, isDarkMode && { color: '#AAA' }]}>
										Fotos gescannt
									</Text>
								</View>
								<View style={styles.statItem}>
									<Text style={[styles.statValue, { color: colors.primary }]}>
										{scanResult.photosWithGPS}
									</Text>
									<Text style={[styles.statLabel, isDarkMode && { color: '#AAA' }]}>Mit GPS ✓</Text>
								</View>
								<View style={styles.statItem}>
									<Text style={[styles.statValue, { color: '#FF9800' }]}>
										{scanResult.photosWithoutGPS}
									</Text>
									<Text style={[styles.statLabel, isDarkMode && { color: '#AAA' }]}>Ohne GPS</Text>
								</View>
							</View>

							{/* Auswahl-Buttons */}
							{scanResult.photosWithGPS > 0 && (
								<View style={styles.selectionButtons}>
									<TouchableOpacity onPress={selectAll} style={styles.selectionButton}>
										<Text
											style={[styles.selectionButtonText, isDarkMode && { color: colors.primary }]}
										>
											Alle auswählen
										</Text>
									</TouchableOpacity>
									<TouchableOpacity onPress={deselectAll} style={styles.selectionButton}>
										<Text style={[styles.selectionButtonText, isDarkMode && { color: '#F44336' }]}>
											Alle abwählen
										</Text>
									</TouchableOpacity>
								</View>
							)}

							{/* Foto-Liste */}
							{scanResult.photos.map((photo) => {
								const isSelected = selectedPhotos.has(photo.id);
								return (
									<TouchableOpacity
										key={photo.id}
										style={[
											styles.photoItem,
											isSelected && styles.photoItemSelected,
											isDarkMode && {
												backgroundColor: isSelected ? '#1a3a1a' : '#1E1E1E',
												borderColor: isSelected ? colors.primary : '#333',
											},
										]}
										onPress={() => togglePhoto(photo.id)}
									>
										<Image source={{ uri: photo.uri }} style={styles.photoThumbnail} />
										<View style={styles.photoInfo}>
											<Text
												style={[styles.photoFilename, isDarkMode && { color: '#FFF' }]}
												numberOfLines={1}
											>
												{photo.filename}
											</Text>
											<Text style={[styles.photoDate, isDarkMode && { color: '#AAA' }]}>
												📅 {formatDate(photo.creationTime)}
											</Text>
											<Text style={[styles.photoLocation, isDarkMode && { color: '#AAA' }]}>
												📍 {photo.location?.latitude?.toFixed(4) || '0.0000'},{' '}
												{photo.location?.longitude?.toFixed(4) || '0.0000'}
											</Text>
										</View>
										{isSelected && (
											<FontAwesome name="check-circle" size={24} color={colors.primary} />
										)}
									</TouchableOpacity>
								);
							})}

							{scanResult.photos.length === 0 && (
								<View style={styles.emptyState}>
									<FontAwesome name="frown-o" size={48} color={isDarkMode ? '#666' : '#CCC'} />
									<Text style={[styles.emptyText, isDarkMode && { color: '#AAA' }]}>
										Keine Fotos mit GPS-Daten gefunden
									</Text>
								</View>
							)}
						</>
					)}
				</ScrollView>

				{/* Footer */}
				{scanResult && scanResult.photosWithGPS > 0 && (
					<View
						style={[
							styles.footer,
							isDarkMode && { backgroundColor: '#1E1E1E', borderTopColor: '#333' },
						]}
					>
						{isImporting && (
							<Text style={[styles.progressText, isDarkMode && { color: '#AAA' }]}>
								Importiere {importProgress.current} / {importProgress.total}...
							</Text>
						)}
						<TouchableOpacity
							style={[
								styles.importButton,
								{ backgroundColor: colors.primary },
								(selectedPhotos.size === 0 || isImporting) && styles.importButtonDisabled,
							]}
							onPress={handleImport}
							disabled={selectedPhotos.size === 0 || isImporting}
						>
							{isImporting ? (
								<ActivityIndicator color="white" />
							) : (
								<>
									<FontAwesome name="download" size={18} color="white" />
									<Text style={styles.importButtonText}>
										{selectedPhotos.size} Foto{selectedPhotos.size !== 1 ? 's' : ''} importieren
									</Text>
								</>
							)}
						</TouchableOpacity>
					</View>
				)}
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFF',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#E0E0E0',
	},
	closeButton: {
		padding: 8,
	},
	title: {
		fontSize: 18,
		fontWeight: 'bold',
	},
	content: {
		flex: 1,
	},
	startView: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 80,
		paddingHorizontal: 32,
	},
	startText: {
		fontSize: 18,
		fontWeight: '600',
		marginTop: 24,
		textAlign: 'center',
	},
	startSubtext: {
		fontSize: 14,
		marginTop: 8,
		textAlign: 'center',
		color: '#666',
	},
	scanButton: {
		flexDirection: 'row',
		alignItems: 'center',
		// backgroundColor set dynamically via colors.primary
		paddingVertical: 16,
		paddingHorizontal: 32,
		borderRadius: 12,
		marginTop: 32,
		minWidth: 200,
		justifyContent: 'center',
	},
	scanButtonDisabled: {
		opacity: 0.6,
	},
	scanButtonText: {
		color: 'white',
		fontSize: 16,
		fontWeight: 'bold',
		marginLeft: 8,
	},
	statsContainer: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		padding: 20,
		backgroundColor: '#F5F5F5',
		margin: 16,
		borderRadius: 12,
	},
	statItem: {
		alignItems: 'center',
	},
	statValue: {
		fontSize: 28,
		fontWeight: 'bold',
	},
	statLabel: {
		fontSize: 12,
		color: '#666',
		marginTop: 4,
	},
	selectionButtons: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		paddingHorizontal: 16,
		paddingBottom: 16,
	},
	selectionButton: {
		padding: 8,
	},
	selectionButtonText: {
		fontSize: 14,
		fontWeight: '600',
		// color set dynamically via colors.primary
	},
	photoItem: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 12,
		marginHorizontal: 16,
		marginBottom: 8,
		borderRadius: 8,
		borderWidth: 2,
		borderColor: '#E0E0E0',
		backgroundColor: 'white',
	},
	photoItemSelected: {
		// borderColor set dynamically via colors.primary
		backgroundColor: '#E8F5E9',
	},
	photoThumbnail: {
		width: 60,
		height: 60,
		borderRadius: 6,
		marginRight: 12,
	},
	photoInfo: {
		flex: 1,
	},
	photoFilename: {
		fontSize: 14,
		fontWeight: '600',
		marginBottom: 4,
	},
	photoDate: {
		fontSize: 12,
		color: '#666',
		marginBottom: 2,
	},
	photoLocation: {
		fontSize: 11,
		color: '#666',
	},
	emptyState: {
		alignItems: 'center',
		paddingVertical: 60,
	},
	emptyText: {
		fontSize: 16,
		color: '#AAA',
		marginTop: 16,
	},
	footer: {
		padding: 16,
		borderTopWidth: 1,
		borderTopColor: '#E0E0E0',
		backgroundColor: 'white',
	},
	progressText: {
		textAlign: 'center',
		marginBottom: 8,
		fontSize: 12,
		color: '#666',
	},
	importButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		// backgroundColor set dynamically via colors.primary
		paddingVertical: 16,
		borderRadius: 12,
	},
	importButtonDisabled: {
		opacity: 0.5,
	},
	importButtonText: {
		color: 'white',
		fontSize: 16,
		fontWeight: 'bold',
		marginLeft: 8,
	},
});
