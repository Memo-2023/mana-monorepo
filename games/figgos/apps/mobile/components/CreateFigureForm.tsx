import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	TextInput,
	Image,
	TouchableOpacity,
	Alert,
	useWindowDimensions,
	Modal,
	ImageBackground,
	Platform,
	ActivityIndicator,
	Switch,
} from 'react-native';
// KeyboardAwareScrollView entfernt - Scrolling wird jetzt in der Parent-Komponente implementiert
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTheme } from '~/utils/ThemeContext';
import { generateFigure } from '~/utils/figureService';
import { useAuth } from '~/utils/AuthContext';
import { router } from 'expo-router';

// FigureData Typ-Definition
interface FigureData {
	name: string;
	characterDescription: string;
	characterImage: string | null;
	artifacts: Array<{
		name?: string; // Neues Feld für den Namen des Artefakts
		description: string;
		image: string | null;
	}>;
}

// Erweiterte FigureData mit Rarität
export type ExtendedFigureData = FigureData & {
	rarity?: string; // Rarität der Figur (z.B. 'common', 'rare', 'legendary')
};

interface ArtifactData {
	name?: string; // Neues Feld für den Namen des Artefakts
	description: string;
	image: string | null;
}

interface SidebarCreateFigureFormProps {
	onSubmit?: (handleSubmit: () => Promise<void>) => void;
}

export const SidebarCreateFigureForm: React.FC<SidebarCreateFigureFormProps> = ({ onSubmit }) => {
	const { theme, isDark } = useTheme();
	const { width, height } = useWindowDimensions();
	const { user } = useAuth();

	// Determine if we're in wide screen mode (tablet/desktop)
	const isWideScreen = width > 768;

	// Calculate half of the screen height for initial scroll distance
	const halfScreenHeight = height / 2;

	// Check if we're running in a web environment
	const isWeb = Platform.OS === 'web';

	// State for tracking which input is focused
	const [focusedInput, setFocusedInput] = useState<
		'character' | 'name' | `artifact-${number}` | null
	>(null);

	// State für den Generierungsprozess
	const [isGenerating, setIsGenerating] = useState(false);

	// State für die Sichtbarkeit der Figur
	const [isPublic, setIsPublic] = useState(true);

	// Initialize form state with empty values - only name is required
	const [formData, setFormData] = useState<ExtendedFigureData>({
		name: '',
		characterDescription: '',
		characterImage: null,
		artifacts: [
			{ description: '', image: null },
			{ description: '', image: null },
			{ description: '', image: null },
		],
	});

	// State for description modals
	const [descriptionModalVisible, setDescriptionModalVisible] = useState(false);
	const [currentDescriptionType, setCurrentDescriptionType] = useState<'character' | 'artifact'>(
		'character'
	);
	const [currentArtifactIndex, setCurrentArtifactIndex] = useState(0);

	// Handle name change
	const handleNameChange = (text: string) => {
		setFormData({
			...formData,
			name: text,
		});
	};

	// Handle character description change
	const handleCharacterDescriptionChange = (text: string) => {
		setFormData({
			...formData,
			characterDescription: text,
		});
	};

	// Handle artifact description change
	const handleArtifactDescriptionChange = (index: number, text: string) => {
		const updatedArtifacts = [...formData.artifacts];
		updatedArtifacts[index] = {
			...updatedArtifacts[index],
			description: text,
		};

		setFormData({
			...formData,
			artifacts: updatedArtifacts,
		});
	};

	// Pick an image from the gallery
	const pickImage = async (type: 'character' | number) => {
		try {
			// Berechtigungen prüfen
			const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
			if (status !== 'granted') {
				Alert.alert(
					'Berechtigung verweigert',
					'Wir benötigen Zugriff auf deine Fotos, um ein Bild auszuwählen.'
				);
				return;
			}

			// Bild auswählen
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: true,
				aspect: [1, 1],
				quality: 0.8,
			});

			if (!result.canceled && result.assets && result.assets.length > 0) {
				const selectedImage = result.assets[0].uri;

				// Update state based on type
				if (type === 'character') {
					setFormData({
						...formData,
						characterImage: selectedImage,
					});
				} else if (typeof type === 'number') {
					const updatedArtifacts = [...formData.artifacts];
					updatedArtifacts[type] = {
						...updatedArtifacts[type],
						image: selectedImage,
					};

					setFormData({
						...formData,
						artifacts: updatedArtifacts,
					});
				}
			}
		} catch (error) {
			console.error('Error picking image:', error);
			Alert.alert('Fehler', 'Es gab ein Problem beim Auswählen des Bildes.');
		}
	};

	// Handle form submission
	const handleSubmit = async () => {
		// Validate form - only name is required
		if (!formData.name.trim()) {
			Alert.alert('Error', 'Please enter a name for your figure.');
			return;
		}

		// All other fields are optional and will be generated by the LLM if missing

		if (!user) {
			Alert.alert('Fehler', 'Du musst eingeloggt sein, um eine Figur zu erstellen.');
			return;
		}

		try {
			setIsGenerating(true);

			// Figur generieren
			const figure = await generateFigure(formData, isPublic);

			// Erfolgsmeldung anzeigen
			Alert.alert('Success!', 'Your action figure has been created!', [
				{
					text: 'Go to My Shelf',
					onPress: () => router.replace('/(tabs)'),
				},
				{
					text: 'OK',
					style: 'cancel',
				},
			]);

			// Formular zurücksetzen
			setFormData({
				name: '',
				characterDescription: '',
				characterImage: null,
				artifacts: [
					{ description: '', image: null },
					{ description: '', image: null },
					{ description: '', image: null },
				],
			});
		} catch (error) {
			console.error('Error creating figure:', error);
			Alert.alert('Error', 'There was a problem creating your figure. Please try again.');
		} finally {
			setIsGenerating(false);
		}
	};

	// Render description modal
	const renderDescriptionModal = () => {
		const isCharacter = currentDescriptionType === 'character';
		const currentDescription = isCharacter
			? formData.characterDescription
			: formData.artifacts[currentArtifactIndex].description;

		return (
			<Modal
				animationType="slide"
				transparent={true}
				visible={descriptionModalVisible}
				onRequestClose={() => setDescriptionModalVisible(false)}
			>
				<View className="flex-1 justify-center items-center bg-black/50 p-5">
					<View
						className="w-[90%] max-w-[500px] rounded-[15px] p-5"
						style={{ backgroundColor: theme.colors.card }}
					>
						<Text className="text-base font-bold mb-4" style={{ color: theme.colors.text }}>
							{isCharacter
								? 'Character Description'
								: `Artifact ${currentArtifactIndex + 1} Description`}
						</Text>

						<TextInput
							className="border rounded-[10px] p-2.5 h-[150px] text-base mb-4"
							style={{
								backgroundColor: theme.colors.input,
								color: theme.colors.text,
								borderColor: theme.colors.border,
								textAlignVertical: 'top',
							}}
							placeholder={
								isCharacter
									? 'Describe your character...'
									: `Describe artifact ${currentArtifactIndex + 1}...`
							}
							placeholderTextColor={isDark ? '#888' : '#aaa'}
							multiline
							numberOfLines={8}
							value={currentDescription}
							onChangeText={(text) => {
								if (isCharacter) {
									handleCharacterDescriptionChange(text);
								} else {
									handleArtifactDescriptionChange(currentArtifactIndex, text);
								}
							}}
						/>

						<View className="flex-row justify-between">
							<TouchableOpacity
								className="rounded-[10px] p-2.5 min-w-[100px] items-center"
								style={{ backgroundColor: theme.colors.border }}
								onPress={() => setDescriptionModalVisible(false)}
							>
								<Text style={{ color: theme.colors.text }}>Cancel</Text>
							</TouchableOpacity>

							<TouchableOpacity
								className="rounded-[10px] p-2.5 min-w-[100px] items-center"
								style={{ backgroundColor: theme.colors.primary }}
								onPress={() => {
									setDescriptionModalVisible(false);
								}}
							>
								<Text className="text-white">Save</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		);
	};

	// Render the form content directly without the outer container
	const renderFormContent = () => {
		return (
			<View
				className="border-0 rounded-[20px] p-5 pt-[30px] mb-[5px] w-full overflow-hidden"
				style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
			>
				{/* Name Input and Image Upload */}
				<View className="w-full flex-row items-center justify-between mb-5">
					<TextInput
						className="border rounded-[15px] p-4 h-[50px] text-2xl font-bold text-left flex-1 mr-2.5"
						style={{
							backgroundColor:
								focusedInput === 'name' ? theme.colors.inputActive : theme.colors.input,
							color: theme.colors.text,
							borderColor: theme.colors.border,
						}}
						placeholder="Name"
						placeholderTextColor={isDark ? '#888' : '#aaa'}
						value={formData.name}
						onFocus={() => setFocusedInput('name')}
						onBlur={() => setFocusedInput(null)}
						onChangeText={handleNameChange}
						autoCapitalize="words"
						autoCorrect={false}
					/>

					{/* Image Upload Button */}
					<TouchableOpacity
						className="w-[60px] h-[50px] border rounded-[15px] justify-center items-center"
						style={{
							backgroundColor: isDark ? '#1a1a1a' : '#f0f0f0',
							borderColor: theme.colors.primary,
							borderWidth: 2,
						}}
						onPress={() => pickImage('character')}
					>
						{formData.characterImage ? (
							<Image
								source={{ uri: formData.characterImage }}
								className="w-full h-full rounded-[14px]"
								resizeMode="cover"
							/>
						) : (
							<>
								<FontAwesome name="image" size={18} color={theme.colors.primary} />
								<Text
									style={{
										color: theme.colors.primary,
										fontSize: 12,
										marginTop: 2,
										fontWeight: 'bold',
									}}
								>
									Image
								</Text>
							</>
						)}
					</TouchableOpacity>
				</View>

				<View className="w-full">
					{/* Eingabefelder */}
					<View className="w-full">
						{/* Character Beschreibung */}
						<View className="mb-2 w-full">
							<View
								className="border rounded-[15px] p-0 h-20 justify-center items-center relative overflow-hidden mb-4"
								style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.input }}
							>
								<TextInput
									className="w-full h-full px-4 py-4 text-base"
									style={{
										backgroundColor:
											focusedInput === 'character' ? theme.colors.inputActive : theme.colors.input,
										color: theme.colors.text,
										borderColor: theme.colors.border,
										textAlignVertical: 'top',
									}}
									autoCapitalize="none"
									autoCorrect={false}
									placeholder="Describe your character..."
									placeholderTextColor={isDark ? '#888' : '#aaa'}
									multiline
									numberOfLines={4}
									value={formData.characterDescription}
									onFocus={() => setFocusedInput('character')}
									onBlur={() => setFocusedInput(null)}
									onChangeText={handleCharacterDescriptionChange}
								/>
							</View>

							{/* Character Bild Upload removed - now next to name */}
						</View>

						{/* Sichtbarkeit - nach oben verschoben - mit negativem Margin für engeren Abstand */}
						<View className="mb-2 w-full -mt-[5px] mb-0">
							<View
								className="flex-row justify-between items-center p-2.5 rounded-[10px] my-0.5"
								style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.input }}
							>
								<Text style={{ color: theme.colors.text }}>Publish Figgo</Text>
								<Switch
									value={isPublic}
									onValueChange={setIsPublic}
									trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
									thumbColor={isPublic ? theme.colors.card : '#f4f3f4'}
								/>
							</View>
						</View>

						{/* Divider über Artefakten */}
						<View
							className="h-[1px] w-auto my-4 -mx-[30px]"
							style={{ backgroundColor: theme.colors.border }}
						/>

						{/* Artefakt Beschreibungen */}
						{[0, 1, 2].map((index) => (
							<View key={`artifact-field-${index}`} className="mb-2.5 w-full">
								<View className="flex-row items-start w-full">
									<View className="w-[50px] mr-[5px] items-center">
										<View className="w-[35px] h-[35px] justify-center items-center">
											<FontAwesome name="cube" size={30} color={theme.colors.text} />
										</View>
									</View>
									<View
										className="border rounded-[15px] p-0 h-20 justify-center items-center relative overflow-hidden mb-4 flex-1"
										style={{
											borderColor: theme.colors.border,
											backgroundColor: theme.colors.input,
										}}
									>
										<TextInput
											className="w-full h-full px-4 py-4 text-base"
											style={{
												backgroundColor:
													focusedInput === `artifact-${index}`
														? theme.colors.inputActive
														: theme.colors.input,
												color: theme.colors.text,
												borderColor: theme.colors.border,
												textAlignVertical: 'top',
											}}
											autoCapitalize="none"
											autoCorrect={false}
											placeholder={`Describe Item ${index + 1}...`}
											placeholderTextColor={isDark ? '#888' : '#aaa'}
											multiline
											numberOfLines={4}
											value={formData.artifacts[index].description}
											onFocus={() => setFocusedInput(`artifact-${index}` as any)}
											onBlur={() => setFocusedInput(null)}
											onChangeText={(text) => handleArtifactDescriptionChange(index, text)}
										/>
									</View>
								</View>
							</View>
						))}

						{/* Divider unter Artefakten */}
						<View
							className="h-[1px] w-auto my-4 -mx-[30px]"
							style={{ backgroundColor: theme.colors.border }}
						/>
					</View>
				</View>
			</View>
		);
	};

	// Expose the handleSubmit function to the parent component
	// Verwende useEffect mit vollständiger Dependency-Liste, um sicherzustellen,
	// dass der Handler aktualisiert wird, wenn sich formData oder isPublic ändert
	React.useEffect(() => {
		if (onSubmit) {
			onSubmit(handleSubmit);
		}
	}, [onSubmit, handleSubmit, formData, isPublic]);

	// Stelle sicher, dass der Handler sofort beim ersten Rendern verfügbar ist
	React.useEffect(() => {
		if (onSubmit) {
			onSubmit(handleSubmit);
		}
	}, []);

	return (
		<View className="flex-1 w-full p-0 m-0">
			{isWeb ? (
				<View
					className="rounded-[20px] overflow-hidden w-full p-1 my-5 self-stretch border-0"
					style={{ backdropFilter: 'blur(25px)' }}
				>
					{renderFormContent()}
				</View>
			) : Platform.OS === 'ios' ? (
				<BlurView
					intensity={90}
					className="rounded-[20px] overflow-hidden w-full p-1 my-5 self-stretch border-0"
				>
					{renderFormContent()}
				</BlurView>
			) : (
				<View
					className="rounded-[20px] overflow-hidden w-full p-1 my-5 self-stretch border-0"
					style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
				>
					{renderFormContent()}
				</View>
			)}
			{/* Description Modal */}
			{renderDescriptionModal()}
		</View>
	);
};

export default SidebarCreateFigureForm;
