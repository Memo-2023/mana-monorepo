import React, { useState, useEffect, useRef } from 'react';
import {
	View,
	StyleSheet,
	TextInput,
	Pressable,
	ScrollView,
	ActivityIndicator,
	Dimensions,
	Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import Text from '../components/atoms/Text';
import CommonHeader from '../components/molecules/CommonHeader';
import {
	getStorySystemPrompt,
	saveStorySystemPrompt,
	getCharacterSystemPrompt,
	saveCharacterSystemPrompt,
} from '../src/services/promptSettings';
import { generateStory } from '../src/services/genAI';
import { generateCharacter, type GeneratedCharacter } from '../src/services/characterGenAI';
import { fetchWithAuth } from '../src/utils/api';

type Tab = 'story' | 'character';

export default function Prompts() {
	const router = useRouter();
	const { user, isLoading } = useAuth();
	const scrollViewRef = useRef<ScrollView>(null);
	const screenWidth = Dimensions.get('window').width;

	// Tab State
	const [activeTab, setActiveTab] = useState<Tab>('story');

	// Story System Prompt State
	const [storySystemPrompt, setStorySystemPrompt] = useState('');
	const [storyPromptSaveStatus, setStoryPromptSaveStatus] = useState<
		'idle' | 'saving' | 'saved' | 'error'
	>('idle');

	// Character System Prompt State
	const [characterSystemPrompt, setCharacterSystemPrompt] = useState('');
	const [characterPromptSaveStatus, setCharacterPromptSaveStatus] = useState<
		'idle' | 'saving' | 'saved' | 'error'
	>('idle');

	// Story Generation State
	const [isGenerating, setIsGenerating] = useState(false);
	const [storyPrompt, setStoryPrompt] = useState('');
	const [generatedStory, setGeneratedStory] = useState<string | null>(null);
	const [storyFinalPrompt, setStoryFinalPrompt] = useState<string | null>(null);
	const [storyError, setStoryError] = useState<string | null>(null);

	// Character Generation State
	const [characterPrompt, setCharacterPrompt] = useState('');
	const [characterName, setCharacterName] = useState('');
	const [generatedCharacter, setGeneratedCharacter] = useState<GeneratedCharacter | null>(null);
	const [characterFinalPrompt, setCharacterFinalPrompt] = useState<string | null>(null);
	const [characterError, setCharacterError] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		loadSystemPrompts();
	}, []);

	const loadSystemPrompts = async () => {
		try {
			const storyPrompt = await getStorySystemPrompt();
			const characterPrompt = await getCharacterSystemPrompt();
			setStorySystemPrompt(storyPrompt);
			setCharacterSystemPrompt(characterPrompt);
		} catch (error) {
			console.error('Error loading system prompts:', error);
		}
	};

	const handleSaveStorySystemPrompt = async () => {
		setStoryPromptSaveStatus('saving');
		try {
			await saveStorySystemPrompt(storySystemPrompt);
			setStoryPromptSaveStatus('saved');
			setTimeout(() => setStoryPromptSaveStatus('idle'), 2000);
		} catch (error) {
			console.error('Error saving story system prompt:', error);
			setStoryPromptSaveStatus('error');
			setTimeout(() => setStoryPromptSaveStatus('idle'), 3000);
		}
	};

	const handleSaveCharacterSystemPrompt = async () => {
		setCharacterPromptSaveStatus('saving');
		try {
			await saveCharacterSystemPrompt(characterSystemPrompt);
			setCharacterPromptSaveStatus('saved');
			setTimeout(() => setCharacterPromptSaveStatus('idle'), 2000);
		} catch (error) {
			console.error('Error saving character system prompt:', error);
			setCharacterPromptSaveStatus('error');
			setTimeout(() => setCharacterPromptSaveStatus('idle'), 3000);
		}
	};

	const handleGenerateStory = async () => {
		if (!storyPrompt.trim() || isGenerating) return;

		setIsGenerating(true);
		setStoryError(null);
		try {
			const result = await generateStory(storyPrompt);
			setGeneratedStory(result.story);
			setStoryFinalPrompt(result.finalPrompt);
		} catch (error) {
			setStoryError(
				error instanceof Error ? error.message : 'Ein unerwarteter Fehler ist aufgetreten'
			);
			setGeneratedStory(null);
			setStoryFinalPrompt(null);
		} finally {
			setIsGenerating(false);
		}
	};

	const handleGenerateCharacter = async (prompt: string, name: string) => {
		if (!prompt.trim() || isGenerating) return;

		setIsGenerating(true);
		setCharacterError(null);
		try {
			const result = await generateCharacter(prompt, name);
			setGeneratedCharacter(result.character);
			setCharacterFinalPrompt(result.finalPrompt);
		} catch (error) {
			setCharacterError(
				error instanceof Error ? error.message : 'Ein unerwarteter Fehler ist aufgetreten'
			);
			setGeneratedCharacter(null);
			setCharacterFinalPrompt(null);
		} finally {
			setIsGenerating(false);
		}
	};

	const handleSaveCharacter = async (character: GeneratedCharacter) => {
		if (!character) {
			console.error('No character to save');
			return;
		}

		try {
			setIsSaving(true);
			console.log('Starting character save...', { character });

			if (!user) {
				console.error('User not authenticated');
				throw new Error('Nicht authentifiziert');
			}
			console.log('User authenticated:', { userId: user.sub });

			const characterData = {
				...character,
				createdAt: new Date().toISOString(),
				type: 'generated',
				userId: user.sub,
			};

			console.log('Creating character document...', characterData);

			const response = await fetchWithAuth('/character', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(characterData),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();
			console.log('Character saved with ID:', result.data?.id);

			Alert.alert('Erfolg', 'Charakter wurde erfolgreich gespeichert!', [
				{
					text: 'OK',
					onPress: () => {
						// Optional: Navigation zur Charakterübersicht
						// router.push('/characters');
					},
				},
			]);
		} catch (error) {
			console.error('Save failed:', error);
			Alert.alert(
				'Fehler',
				'Beim Speichern ist ein Fehler aufgetreten: ' +
					(error instanceof Error ? error.message : 'Unbekannter Fehler')
			);
		} finally {
			setIsSaving(false);
		}
	};

	const handleTabChange = (tab: Tab) => {
		setActiveTab(tab);
		scrollViewRef.current?.scrollTo({ x: tab === 'story' ? 0 : screenWidth, animated: true });
	};

	// Show nothing while loading
	if (isLoading) {
		return null;
	}

	// Redirect to login if no user
	if (!user) {
		return <Redirect href="/login" />;
	}

	const getButtonStyle = (status: 'idle' | 'saving' | 'saved' | 'error') => {
		switch (status) {
			case 'saving':
				return styles.saveButtonSaving;
			case 'saved':
				return styles.saveButtonSaved;
			case 'error':
				return styles.saveButtonError;
			default:
				return styles.saveButton;
		}
	};

	const getButtonText = (status: 'idle' | 'saving' | 'saved' | 'error') => {
		switch (status) {
			case 'saving':
				return 'Speichere...';
			case 'saved':
				return 'Gespeichert!';
			case 'error':
				return 'Fehler beim Speichern';
			default:
				return 'Speichern';
		}
	};

	return (
		<SafeAreaView style={styles.safeArea} edges={['top']}>
			<CommonHeader
				title="KI Generierung"
				showBackButton={true}
				onBackPress={() => router.back()}
			/>

			<View style={styles.tabBar}>
				<Pressable
					style={[styles.tab, activeTab === 'story' && styles.activeTab]}
					onPress={() => handleTabChange('story')}
				>
					<Text style={[styles.tabText, activeTab === 'story' && styles.activeTabText]}>
						Geschichten
					</Text>
				</Pressable>
				<Pressable
					style={[styles.tab, activeTab === 'character' && styles.activeTab]}
					onPress={() => handleTabChange('character')}
				>
					<Text style={[styles.tabText, activeTab === 'character' && styles.activeTabText]}>
						Charaktere
					</Text>
				</Pressable>
			</View>

			<ScrollView
				ref={scrollViewRef}
				horizontal
				pagingEnabled
				showsHorizontalScrollIndicator={false}
				scrollEventThrottle={16}
				onScroll={(event) => {
					const offsetX = event.nativeEvent.contentOffset.x;
					setActiveTab(offsetX > screenWidth / 2 ? 'character' : 'story');
				}}
			>
				{/* Story Tab */}
				<View style={[styles.tabContent, { width: screenWidth }]}>
					<ScrollView>
						<View style={styles.container}>
							<View style={styles.section}>
								<Text style={styles.sectionTitle}>System Prompt für Geschichten</Text>
								<Text style={styles.description}>
									Dieser Prompt wird verwendet, um den Stil der generierten Geschichten zu
									definieren.
								</Text>
								<TextInput
									style={styles.input}
									value={storySystemPrompt}
									onChangeText={setStorySystemPrompt}
									placeholder="System Prompt eingeben..."
									placeholderTextColor="#666"
									multiline
								/>
								<Pressable
									style={[styles.saveButton, getButtonStyle(storyPromptSaveStatus)]}
									onPress={handleSaveStorySystemPrompt}
									disabled={storyPromptSaveStatus === 'saving'}
								>
									<Text style={styles.saveButtonText}>{getButtonText(storyPromptSaveStatus)}</Text>
								</Pressable>
							</View>

							<View style={styles.section}>
								<Text style={styles.sectionTitle}>Geschichte Generieren</Text>
								<Text style={styles.description}>
									Gib einen Prompt ein, um eine neue Geschichte zu generieren.
								</Text>
								<TextInput
									style={[styles.input, styles.storyInput]}
									value={storyPrompt}
									onChangeText={setStoryPrompt}
									placeholder="Erzähle eine Geschichte über..."
									placeholderTextColor="#666"
									multiline
								/>
								<Pressable
									style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
									onPress={handleGenerateStory}
									disabled={isGenerating || !storyPrompt.trim()}
								>
									{isGenerating ? (
										<View style={styles.loadingContainer}>
											<ActivityIndicator color="#fff" />
											<Text style={[styles.generateButtonText, styles.loadingText]}>
												Generiere Geschichte...
											</Text>
										</View>
									) : (
										<Text style={styles.generateButtonText}>Geschichte generieren</Text>
									)}
								</Pressable>

								{storyError && (
									<View style={styles.errorContainer}>
										<Text style={styles.errorText}>{storyError}</Text>
									</View>
								)}

								{generatedStory && (
									<View style={styles.resultContainer}>
										<View style={styles.promptInfo}>
											<Text style={[styles.promptLabel, styles.topSpacing]}>Finaler Prompt:</Text>
											<Text style={styles.promptText}>{storyFinalPrompt}</Text>

											<Text style={[styles.promptLabel, styles.topSpacing]}>
												Generierte Geschichte:
											</Text>
										</View>
										<Text style={styles.resultText}>{generatedStory}</Text>
									</View>
								)}
							</View>
						</View>
					</ScrollView>
				</View>

				{/* Character Tab */}
				<View style={[styles.tabContent, { width: screenWidth }]}>
					<ScrollView>
						<View style={styles.container}>
							<View style={styles.section}>
								<Text style={styles.sectionTitle}>System Prompt für Charaktere</Text>
								<Text style={styles.description}>
									Dieser Prompt wird verwendet, um den Stil der generierten Charaktere zu
									definieren.
								</Text>
								<TextInput
									style={styles.input}
									value={characterSystemPrompt}
									onChangeText={setCharacterSystemPrompt}
									placeholder="System Prompt eingeben..."
									placeholderTextColor="#666"
									multiline
								/>
								<Pressable
									style={[styles.saveButton, getButtonStyle(characterPromptSaveStatus)]}
									onPress={handleSaveCharacterSystemPrompt}
									disabled={characterPromptSaveStatus === 'saving'}
								>
									<Text style={styles.saveButtonText}>
										{getButtonText(characterPromptSaveStatus)}
									</Text>
								</Pressable>
							</View>

							<View style={styles.section}>
								<Text style={styles.sectionTitle}>Charakter Generieren</Text>
								<Text style={styles.description}>
									Gib einen Prompt ein, um einen neuen Charakter zu generieren.
								</Text>
								<TextInput
									style={[styles.input, styles.nameInput]}
									value={characterName}
									onChangeText={setCharacterName}
									placeholder="Name (optional)"
									placeholderTextColor="#666"
								/>
								<TextInput
									style={[styles.input, styles.storyInput]}
									value={characterPrompt}
									onChangeText={setCharacterPrompt}
									placeholder="Erstelle einen Charakter der..."
									placeholderTextColor="#666"
									multiline
								/>
								<Pressable
									style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
									onPress={() => handleGenerateCharacter(characterPrompt, characterName)}
									disabled={isGenerating || !characterPrompt.trim()}
								>
									{isGenerating ? (
										<View style={styles.loadingContainer}>
											<ActivityIndicator color="#fff" />
											<Text style={[styles.generateButtonText, styles.loadingText]}>
												Generiere Charakter...
											</Text>
										</View>
									) : (
										<Text style={styles.generateButtonText}>Charakter generieren</Text>
									)}
								</Pressable>

								{characterError && (
									<View style={styles.errorContainer}>
										<Text style={styles.errorText}>{characterError}</Text>
									</View>
								)}

								{generatedCharacter && (
									<View style={styles.resultContainer}>
										<View style={styles.promptInfo}>
											<Text style={[styles.promptLabel, styles.topSpacing]}>Finaler Prompt:</Text>
											<Text style={styles.promptText}>{characterFinalPrompt}</Text>

											<Text style={[styles.promptLabel, styles.topSpacing]}>
												Generierter Charakter:
											</Text>
										</View>

										<View style={styles.characterInfo}>
											<Text style={styles.characterName}>{generatedCharacter.name}</Text>

											<Text style={styles.characterLabel}>Kurzbeschreibung:</Text>
											<Text style={styles.characterText}>{generatedCharacter.description}</Text>

											<Text style={[styles.characterLabel, styles.topSpacing]}>
												Charakter & Persönlichkeit:
											</Text>
											<Text style={styles.characterText}>{generatedCharacter.personality}</Text>

											<Text style={[styles.characterLabel, styles.topSpacing]}>
												Motivation & Ziele:
											</Text>
											<Text style={styles.characterText}>{generatedCharacter.motivation}</Text>

											<Text style={[styles.characterLabel, styles.topSpacing]}>
												Geschichte & Hintergrund:
											</Text>
											<Text style={styles.characterText}>{generatedCharacter.background}</Text>

											<Text style={[styles.characterLabel, styles.topSpacing]}>
												Beziehungen & Verbindungen:
											</Text>
											<Text style={styles.characterText}>{generatedCharacter.relationships}</Text>

											<Text style={[styles.characterLabel, styles.topSpacing]}>
												Entwicklung & Potenzial:
											</Text>
											<Text style={styles.characterText}>{generatedCharacter.development}</Text>

											<Text style={[styles.characterLabel, styles.topSpacing]}>
												Erscheinungsbild:
											</Text>
											<Text style={styles.characterText}>{generatedCharacter.appearance}</Text>

											<Text style={[styles.characterLabel, styles.topSpacing]}>Bild-Prompt:</Text>
											<Text style={styles.characterText}>{generatedCharacter.imagePrompt}</Text>
										</View>
										<Pressable
											style={[styles.saveButton, isSaving && styles.saveButtonSaving]}
											onPress={() => handleSaveCharacter(generatedCharacter)}
											disabled={isSaving}
										>
											<Text style={styles.saveButtonText}>
												{isSaving ? 'Wird gespeichert...' : 'Charakter speichern'}
											</Text>
										</Pressable>
									</View>
								)}
							</View>
						</View>
					</ScrollView>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#181818',
	},
	tabBar: {
		flexDirection: 'row',
		backgroundColor: '#222',
		padding: 4,
		marginHorizontal: 16,
		marginTop: 16,
		borderRadius: 8,
	},
	tab: {
		flex: 1,
		paddingVertical: 12,
		alignItems: 'center',
		borderRadius: 6,
	},
	activeTab: {
		backgroundColor: '#2A2A2A',
	},
	tabText: {
		color: '#888',
		fontSize: 16,
		fontWeight: '600',
	},
	activeTabText: {
		color: '#fff',
	},
	tabContent: {
		flex: 1,
	},
	container: {
		flex: 1,
		padding: 16,
	},
	section: {
		marginBottom: 32,
		backgroundColor: '#222',
		borderRadius: 12,
		padding: 16,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#fff',
		marginBottom: 8,
	},
	description: {
		color: '#888',
		fontSize: 14,
		marginBottom: 16,
		lineHeight: 20,
	},
	input: {
		backgroundColor: '#2A2A2A',
		borderRadius: 8,
		padding: 16,
		color: '#fff',
		fontSize: 16,
		minHeight: 200,
		textAlignVertical: 'top',
		marginBottom: 16,
	},
	storyInput: {
		minHeight: 100,
	},
	nameInput: {
		minHeight: 50,
	},
	saveButton: {
		backgroundColor: '#4CAF50',
		padding: 15,
		borderRadius: 8,
		marginTop: 20,
		marginBottom: 30,
		alignItems: 'center',
		justifyContent: 'center',
	},
	saveButtonSaving: {
		backgroundColor: '#666',
	},
	saveButtonSaved: {
		backgroundColor: '#28A745',
	},
	saveButtonError: {
		backgroundColor: '#DC3545',
	},
	saveButtonText: {
		color: '#FFFFFF',
		fontSize: 16,
		fontWeight: 'bold',
	},
	generateButton: {
		backgroundColor: '#007AFF',
		borderRadius: 8,
		padding: 16,
		alignItems: 'center',
	},
	generateButtonDisabled: {
		opacity: 0.5,
	},
	generateButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: 'bold',
	},
	loadingContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	loadingText: {
		marginLeft: 8,
	},
	errorContainer: {
		backgroundColor: '#FF3B30',
		padding: 16,
		borderRadius: 8,
		marginTop: 16,
	},
	errorText: {
		color: '#fff',
		fontSize: 14,
	},
	resultContainer: {
		marginTop: 16,
		backgroundColor: '#2A2A2A',
		borderRadius: 8,
		padding: 16,
	},
	promptInfo: {
		marginBottom: 16,
	},
	promptLabel: {
		color: '#888',
		fontSize: 14,
		fontWeight: 'bold',
		marginBottom: 4,
	},
	promptText: {
		color: '#fff',
		fontSize: 14,
		lineHeight: 20,
	},
	resultText: {
		color: '#fff',
		fontSize: 16,
		lineHeight: 24,
	},
	topSpacing: {
		marginTop: 16,
	},
	characterInfo: {
		backgroundColor: '#222',
		borderRadius: 8,
		padding: 16,
	},
	characterName: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#fff',
		marginBottom: 16,
	},
	characterLabel: {
		color: '#888',
		fontSize: 14,
		fontWeight: 'bold',
		marginBottom: 4,
	},
	characterText: {
		color: '#fff',
		fontSize: 14,
		lineHeight: 20,
	},
});
