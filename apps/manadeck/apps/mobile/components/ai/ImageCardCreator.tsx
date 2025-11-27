import React, { useState } from 'react';
import { View, Image, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { Text } from '../ui/Text';
import * as ImagePicker from 'expo-image-picker';
import { Icon } from '../ui/Icon';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAIStore } from '../../store/aiStore';
import { GeneratedCard } from '../../utils/supabaseAIService';

interface ImageCardCreatorProps {
	onCardsGenerated?: (cards: GeneratedCard[]) => void;
}

export const ImageCardCreator: React.FC<ImageCardCreatorProps> = ({ onCardsGenerated }) => {
	const { generateCardsFromImage, isGenerating } = useAIStore();
	const [imageUri, setImageUri] = useState<string | null>(null);
	const [context, setContext] = useState('');
	const [error, setError] = useState<string | null>(null);

	const pickImage = async (source: 'camera' | 'library') => {
		try {
			let result;

			if (source === 'camera') {
				const { status } = await ImagePicker.requestCameraPermissionsAsync();
				if (status !== 'granted') {
					setError('Kamerazugriff verweigert');
					return;
				}

				result = await ImagePicker.launchCameraAsync({
					mediaTypes: ImagePicker.MediaTypeOptions.Images,
					allowsEditing: true,
					quality: 0.8,
					base64: false,
				});
			} else {
				const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
				if (status !== 'granted') {
					setError('Galerie-Zugriff verweigert');
					return;
				}

				result = await ImagePicker.launchImageLibraryAsync({
					mediaTypes: ImagePicker.MediaTypeOptions.Images,
					allowsEditing: true,
					quality: 0.8,
					base64: false,
				});
			}

			if (!result.canceled && result.assets[0]) {
				setImageUri(result.assets[0].uri);
				setError(null);
			}
		} catch (error) {
			console.error('Error picking image:', error);
			setError('Fehler beim Auswählen des Bildes');
		}
	};

	const handleGenerateCards = async () => {
		if (!imageUri) return;

		try {
			setError(null);
			const cards = await generateCardsFromImage(imageUri, context);

			if (onCardsGenerated) {
				onCardsGenerated(cards);
			}

			// Reset after successful generation
			setImageUri(null);
			setContext('');
		} catch (error: any) {
			setError(error.message || 'Fehler beim Generieren der Karten');
		}
	};

	const removeImage = () => {
		setImageUri(null);
		setContext('');
		setError(null);
	};

	return (
		<Card padding="lg" variant="elevated">
			{!imageUri ? (
				<>
					<Text variant="h4" className="mb-4 text-center font-semibold text-gray-900">
						Bild auswählen
					</Text>

					<View className="flex-row space-x-3">
						<Pressable
							onPress={() => pickImage('camera')}
							className="flex-1 items-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6"
							style={({ pressed }) => pressed && { opacity: 0.7 }}
						>
							<Icon name="camera" size={32} color="#6B7280" library="Ionicons" />
							<Text variant="caption" className="mt-2 text-gray-600">
								Foto aufnehmen
							</Text>
						</Pressable>

						<Pressable
							onPress={() => pickImage('library')}
							className="flex-1 items-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6"
							style={({ pressed }) => pressed && { opacity: 0.7 }}
						>
							<Icon name="images" size={32} color="#6B7280" library="Ionicons" />
							<Text variant="caption" className="mt-2 text-gray-600">
								Aus Galerie
							</Text>
						</Pressable>
					</View>

					<Text variant="small" className="mt-4 text-center text-gray-500">
						Fotografiere Lehrbücher, Notizen, Whiteboards oder Diagramme
					</Text>
				</>
			) : (
				<>
					{/* Image Preview */}
					<View className="relative mb-4">
						<Image
							source={{ uri: imageUri }}
							className="h-64 w-full rounded-lg"
							resizeMode="cover"
						/>

						<Pressable
							onPress={removeImage}
							className="absolute right-2 top-2 rounded-full bg-red-500 p-2"
							style={({ pressed }) => pressed && { opacity: 0.7 }}
						>
							<Icon name="close" size={20} color="white" library="Ionicons" />
						</Pressable>
					</View>

					{/* Context Input */}
					<View className="mb-4">
						<Text variant="caption" className="mb-2 font-medium text-gray-700">
							Kontext (optional)
						</Text>
						<TextInput
							value={context}
							onChangeText={setContext}
							placeholder="Z.B. 'Mathematik Kapitel 3' oder 'Biologie Zellaufbau'"
							className="rounded-lg border border-gray-200 bg-white p-3 text-gray-900"
						/>
					</View>

					{/* Generate Button */}
					<Button
						onPress={handleGenerateCards}
						variant="primary"
						fullWidth
						disabled={isGenerating}
						leftIcon={
							isGenerating ? (
								<ActivityIndicator size="small" color="white" />
							) : (
								<Icon name="sparkles" size={20} color="white" library="Ionicons" />
							)
						}
					>
						{isGenerating ? 'Analysiere Bild...' : 'Karten aus Bild generieren'}
					</Button>
				</>
			)}

			{/* Error Display */}
			{error && (
				<View className="mt-4 rounded-lg bg-red-50 p-3">
					<Text variant="caption" className="text-red-600">
						{error}
					</Text>
				</View>
			)}

			{/* Info Box */}
			{imageUri && !isGenerating && (
				<View className="mt-4 rounded-lg bg-blue-50 p-3">
					<View className="flex-row items-start">
						<Icon name="information-circle" size={20} color="#3B82F6" library="Ionicons" />
						<Text variant="small" className="ml-2 flex-1 text-blue-700">
							Die KI erkennt Text, Diagramme und Konzepte im Bild und erstellt daraus passende
							Lernkarten.
						</Text>
					</View>
				</View>
			)}
		</Card>
	);
};
