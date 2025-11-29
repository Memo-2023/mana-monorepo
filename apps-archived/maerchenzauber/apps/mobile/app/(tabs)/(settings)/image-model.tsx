import React, { useState, useEffect } from 'react';
import {
	View,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	ActivityIndicator,
	Alert,
	Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fetchWithAuth } from '../../../src/utils/api';
import CommonHeader from '../../../components/molecules/CommonHeader';
import Text from '../../../components/atoms/Text';
import MagicalLoadingScreen from '../../../components/molecules/MagicalLoadingScreen';

interface ImageModel {
	id: string;
	name: string;
	description: string;
	estimatedTime: string;
	creditsPerImage: number;
}

interface ModelsResponse {
	models: ImageModel[];
	default: string;
}

interface UserModelResponse {
	model: string;
	modelInfo: ImageModel;
}

export default function ImageModelSettings() {
	const [models, setModels] = useState<ImageModel[]>([]);
	const [selectedModel, setSelectedModel] = useState<string>('');
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	const { width: screenWidth } = Dimensions.get('window');
	const isWideScreen = screenWidth > 1000;

	useEffect(() => {
		loadModels();
	}, []);

	const loadModels = async () => {
		try {
			setLoading(true);

			// Load available models
			const modelsResponse = await fetchWithAuth('/settings/image-models');
			const modelsData: ModelsResponse = await modelsResponse.json();
			setModels(modelsData.models);

			// Load user's current selection
			const userModelResponse = await fetchWithAuth('/settings/user/image-model');
			const userModelData: UserModelResponse = await userModelResponse.json();
			setSelectedModel(userModelData.model);
		} catch (error) {
			console.error('Error loading models:', error);
			Alert.alert('Fehler', 'Modelle konnten nicht geladen werden');
		} finally {
			setLoading(false);
		}
	};

	const handleModelSelect = async (modelId: string) => {
		if (modelId === selectedModel) return;

		try {
			setSaving(true);
			const response = await fetchWithAuth('/settings/user/image-model', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ model: modelId }),
			});

			const result = await response.json();

			if (result.success) {
				setSelectedModel(modelId);
				// Show success feedback without alert
				console.log('Model updated successfully');
			} else {
				Alert.alert('Fehler', result.error || 'Modell konnte nicht gespeichert werden');
			}
		} catch (error) {
			console.error('Error updating model:', error);
			Alert.alert('Fehler', 'Modell konnte nicht gespeichert werden');
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return <MagicalLoadingScreen context="loading" />;
	}

	return (
		<SafeAreaView style={styles.safeArea} edges={['top']}>
			<CommonHeader
				title="Bildgenerierung"
				showBackButton={true}
				onBackPress={() => router.back()}
			/>

			<View style={[styles.container, isWideScreen && styles.containerWide]}>
				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}
				>
					<View style={styles.headerSection}>
						<Text style={styles.sectionTitle}>Wähle dein Bildmodell</Text>
						<Text style={styles.sectionDescription}>
							Verschiedene Modelle bieten unterschiedliche Geschwindigkeiten und Qualitätsstufen
						</Text>
					</View>

					<View style={styles.modelsContainer}>
						{models.map((model) => (
							<TouchableOpacity
								key={model.id}
								style={[styles.modelCard, selectedModel === model.id && styles.selectedCard]}
								onPress={() => handleModelSelect(model.id)}
								disabled={saving}
								activeOpacity={0.7}
							>
								<View style={styles.modelHeader}>
									<View style={styles.modelTitleRow}>
										<Text
											style={[styles.modelName, selectedModel === model.id && styles.selectedText]}
										>
											{model.name}
										</Text>
										{selectedModel === model.id && (
											<View style={styles.checkmarkContainer}>
												<Ionicons name="checkmark-circle" size={24} color="#FFD700" />
											</View>
										)}
									</View>

									{/* Badge based on model type */}
									{model.id === 'flux-schnell' && (
										<View style={[styles.badge, styles.recommendedBadge]}>
											<Ionicons name="star" size={12} color="#181818" />
											<Text style={styles.recommendedText}>Empfohlen</Text>
										</View>
									)}
									{model.id === 'flux-pro' && (
										<View style={[styles.badge, styles.premiumBadge]}>
											<Ionicons name="diamond" size={12} color="#181818" />
											<Text style={styles.premiumText}>Premium</Text>
										</View>
									)}
									{model.id === 'sdxl' && (
										<View style={[styles.badge, styles.standardBadge]}>
											<Text style={styles.standardText}>Standard</Text>
										</View>
									)}
								</View>

								<Text
									style={[
										styles.modelDescription,
										selectedModel === model.id && styles.selectedDescriptionText,
									]}
								>
									{model.description}
								</Text>

								<View style={styles.modelFooter}>
									<View style={styles.modelInfo}>
										<View style={styles.infoItem}>
											<Ionicons name="time-outline" size={16} color="#999999" />
											<Text style={styles.infoText}>{model.estimatedTime}</Text>
										</View>
										<View style={styles.infoItem}>
											<Ionicons name="flash-outline" size={16} color="#999999" />
											<Text style={styles.infoText}>{model.creditsPerImage} Credits</Text>
										</View>
									</View>
								</View>
							</TouchableOpacity>
						))}
					</View>

					<View style={styles.infoBox}>
						<Ionicons name="information-circle-outline" size={20} color="#FFD700" />
						<Text style={styles.infoBoxText}>
							Die Modellauswahl beeinflusst die Geschwindigkeit und Qualität der generierten Bilder.
							Höhere Qualität benötigt mehr Zeit und Credits.
						</Text>
					</View>
				</ScrollView>
			</View>

			{saving && (
				<View style={styles.savingOverlay}>
					<ActivityIndicator size="large" color="#FFD700" />
					<Text style={styles.savingText}>Speichern...</Text>
				</View>
			)}
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#181818',
	},
	container: {
		flex: 1,
		paddingHorizontal: 20,
	},
	containerWide: {
		maxWidth: 600,
		width: '100%',
		alignSelf: 'center',
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		paddingTop: 100,
		paddingBottom: 0,
	},
	headerSection: {
		marginBottom: 24,
	},
	sectionTitle: {
		fontSize: 28,
		fontWeight: '700',
		color: '#FFFFFF',
		marginBottom: 8,
	},
	sectionDescription: {
		fontSize: 16,
		color: '#999999',
		lineHeight: 22,
	},
	modelsContainer: {
		gap: 16,
	},
	modelCard: {
		backgroundColor: '#2C2C2C',
		borderRadius: 16,
		padding: 20,
		borderWidth: 2,
		borderColor: '#3C3C3C',
		position: 'relative',
	},
	selectedCard: {
		borderColor: '#FFD700',
		backgroundColor: '#333333',
	},
	modelHeader: {
		marginBottom: 12,
	},
	modelTitleRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	modelName: {
		fontSize: 20,
		fontWeight: '600',
		color: '#FFFFFF',
		flex: 1,
	},
	selectedText: {
		color: '#FFD700',
	},
	checkmarkContainer: {
		marginLeft: 12,
	},
	badge: {
		position: 'absolute',
		top: 20,
		right: 20,
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 12,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	recommendedBadge: {
		backgroundColor: '#4CAF50',
	},
	recommendedText: {
		color: '#181818',
		fontSize: 11,
		fontWeight: '700',
		textTransform: 'uppercase',
	},
	premiumBadge: {
		backgroundColor: '#FFD700',
	},
	premiumText: {
		color: '#181818',
		fontSize: 11,
		fontWeight: '700',
		textTransform: 'uppercase',
	},
	standardBadge: {
		backgroundColor: '#666666',
	},
	standardText: {
		color: '#FFFFFF',
		fontSize: 11,
		fontWeight: '700',
		textTransform: 'uppercase',
	},
	modelDescription: {
		fontSize: 14,
		color: '#CCCCCC',
		lineHeight: 20,
		marginBottom: 16,
	},
	selectedDescriptionText: {
		color: '#FFFFFF',
	},
	modelFooter: {
		borderTopWidth: 1,
		borderTopColor: '#3C3C3C',
		paddingTop: 12,
	},
	modelInfo: {
		flexDirection: 'row',
		gap: 20,
	},
	infoItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	infoText: {
		fontSize: 13,
		color: '#999999',
	},
	infoBox: {
		flexDirection: 'row',
		backgroundColor: 'rgba(255, 215, 0, 0.1)',
		borderWidth: 1,
		borderColor: 'rgba(255, 215, 0, 0.3)',
		padding: 16,
		borderRadius: 12,
		marginTop: 32,
		gap: 12,
		alignItems: 'flex-start',
	},
	infoBoxText: {
		flex: 1,
		fontSize: 14,
		color: '#FFD700',
		lineHeight: 20,
	},
	savingOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(0, 0, 0, 0.8)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	savingText: {
		color: '#FFD700',
		marginTop: 12,
		fontSize: 16,
		fontWeight: '600',
	},
});
