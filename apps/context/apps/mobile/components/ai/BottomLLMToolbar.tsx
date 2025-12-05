import React, { useState, useEffect } from 'react';
import {
	View,
	TouchableOpacity,
	StyleSheet,
	Platform,
	TextInput,
	ScrollView,
	Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '~/components/ui/Text';
import {
	availableModels,
	AIModelOption,
	generateText,
	AIProvider,
	checkTokenBalance,
} from '~/services/aiService';
import { useTheme } from '~/utils/theme/theme';
import { getDocumentById } from '~/services/supabaseService';
import { supabase } from '~/utils/supabase';
import { eventEmitter, EVENTS } from '~/utils/eventEmitter';
import { getCurrentTokenBalance } from '~/services/tokenTransactionService';
import TokenDisplay from '~/components/monetization/TokenDisplay';
import TokenEstimator from '~/components/monetization/TokenEstimator';

// Globaler Stil für das Entfernen des Fokus-Outlines
if (typeof document !== 'undefined') {
	const style = document.createElement('style');
	style.textContent = `
    .ai-input-no-focus {
      outline: none !important;
      box-shadow: none !important;
      border-color: transparent !important;
    }
    .ai-input-no-focus:focus {
      outline: none !important;
      box-shadow: none !important;
      border-color: transparent !important;
    }
  `;
	document.head.appendChild(style);
}
import { AIActionButton } from './AIActionButton';

interface BottomLLMToolbarProps {
	onGenerateText: (generatedText: string, mode: 'append' | 'replace') => void;
	documentContent: string;
	isGenerating: boolean;
	setIsGenerating: (isGenerating: boolean) => void;
	documentId?: string; // Optional document ID für Token-Tracking
}

export const BottomLLMToolbar: React.FC<BottomLLMToolbarProps> = ({
	onGenerateText,
	documentContent,
	isGenerating,
	setIsGenerating,
	documentId,
}) => {
	const { isDark } = useTheme();
	const [selectedModel, setSelectedModel] = useState<AIModelOption>(availableModels[0]);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [promptText, setPromptText] = useState('');
	const [isFocused, setIsFocused] = useState(false);
	const [tokenEstimate, setTokenEstimate] = useState<any>(null);
	const [showTokenEstimator, setShowTokenEstimator] = useState(false);
	const [tokenBalance, setTokenBalance] = useState<number | null>(null);
	const [loading, setLoading] = useState(true);

	// Funktion zum Extrahieren von Mentions aus dem Text
	const extractMentions = (text: string) => {
		// Regex für das Format [Dokumenttitel](dokumentId)
		const mentionRegex = /\[(.*?)\]\((.*?)\)/g;
		const mentions: { title: string; id: string }[] = [];

		let match;
		while ((match = mentionRegex.exec(text)) !== null) {
			// Stellen Sie sicher, dass die ID ein gültiges UUID-Format hat (zur Vermeidung von falschen Treffern)
			if (match[2].match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
				mentions.push({
					title: match[1],
					id: match[2],
				});
			}
		}

		return mentions;
	};

	// Funktion zum Abrufen des Inhalts eines erwähnten Dokuments
	const fetchMentionedDocumentContent = async (documentId: string) => {
		try {
			const document = await getDocumentById(documentId);

			if (!document) {
				return `[Dokument mit ID ${documentId} nicht gefunden]`;
			}

			if (!document.content) {
				return `[Dokument "${document.title}" hat keinen Inhalt]`;
			}

			return document.content;
		} catch (error) {
			return `[Fehler beim Abrufen des Dokuments mit ID ${documentId}]`;
		}
	};

	// Funktion zum Ersetzen aller Mentions im Text mit dem tatsächlichen Dokumentinhalt
	const replaceMentionsWithContent = async (text: string) => {
		const mentions = extractMentions(text);
		let processedText = text;

		// Wenn keine Mentions gefunden wurden, gib den Originaltext zurück
		if (mentions.length === 0) {
			return processedText;
		}

		// Ersetze jede Mention durch den Dokumentinhalt
		for (const mention of mentions) {
			// Abrufen des Dokumentinhalts
			const documentContent = await fetchMentionedDocumentContent(mention.id);

			// Erstelle ein Muster, das genau der Mention im Text entspricht
			const mentionText = `[${mention.title}](${mention.id})`;

			// Ersetze die Mention durch den tatsächlichen Inhalt ohne Formatierungsmarker
			const newContent = `\n\n${documentContent}\n\n`;
			processedText = processedText.replace(mentionText, newContent);
		}

		return processedText;
	};

	// Funktion zur Ersetzung von Mentions im Text
	const processMentionsInText = async (text: string) => {
		return await replaceMentionsWithContent(text);
	};

	const handleGenerateText = async (mode: 'append' | 'replace') => {
		if ((!documentContent.trim() && !promptText.trim()) || isGenerating) return;

		try {
			setIsGenerating(true);

			// Verarbeite Mentions im Prompt-Text für das KI-Modell
			let processedPromptText = promptText;
			if (promptText.trim()) {
				processedPromptText = await processMentionsInText(promptText);
			}

			// Für das KI-Modell verarbeiten wir auch Mentions im Dokumentinhalt
			let processedDocumentContent = documentContent;
			if (documentContent.trim()) {
				processedDocumentContent = await processMentionsInText(documentContent);
			}

			// Erstelle den vollständigen Prompt für das KI-Modell
			let fullPrompt = '';

			if (processedPromptText.trim()) {
				// Wenn ein benutzerdefinierter Prompt eingegeben wurde
				fullPrompt = processedPromptText;

				// Füge den verarbeiteten Dokumentinhalt als Kontext hinzu, wenn vorhanden
				if (processedDocumentContent.trim()) {
					if (mode === 'append') {
						fullPrompt += `\n\nHier der vorhandene Text, bitte setze ihn fort:\n${processedDocumentContent}`;
					} else {
						fullPrompt += `\n\nHier der vorhandene Text, bitte formuliere ihn neu:\n${processedDocumentContent}`;
					}
				}
			} else {
				// Wenn kein benutzerdefinierter Prompt, verwende den verarbeiteten Dokumentinhalt direkt
				if (mode === 'append') {
					fullPrompt = `${processedDocumentContent}\n\nBitte setze diesen Text fort.`;
				} else {
					fullPrompt = `${processedDocumentContent}\n\nBitte formuliere diesen Text neu.`;
				}
			}

			// Use the selected model to generate text with increased max tokens for complete responses
			let result = await generateText(fullPrompt, selectedModel.provider, {
				model: selectedModel.value,
				maxTokens: 2000,
				temperature: 0.7,
				documentId: documentId, // Für die Token-Nutzungsverfolgung
			});

			// Extrahiere den generierten Text aus dem Ergebnisobjekt
			let generatedText = result.text;

			// Füge eine Linie über die Antwort ein
			generatedText = `\n---\n${generatedText}`;

			// Pass the generated text back to the parent component with the mode
			// Wichtig: Wir geben den generierten Text direkt weiter, ohne die Mentions im Dokument zu ersetzen
			onGenerateText(generatedText, mode);

			// Zurücksetzen des Prompt-Texts nach erfolgreicher Generierung
			setPromptText('');

			// Aktualisiere das Token-Guthaben nach erfolgreichem Call mit einer Verzögerung
			setTimeout(async () => {
				console.log('Aktualisiere Token-Guthaben nach erfolgreichem Call...');

				// Direkte Aktualisierung des Token-Guthabens ohne Caching
				try {
					// Hole den aktuellen Benutzer
					const { data: sessionData } = await supabase.auth.getSession();
					const userId = sessionData?.session?.user?.id;

					if (!userId) {
						throw new Error('Nicht angemeldet');
					}

					// Hole das aktuelle Token-Guthaben direkt aus der Datenbank mit Cache-Busting
					const { data: userData } = await supabase
						.from('users')
						.select('token_balance')
						.eq('id', userId)
						.single();

					if (userData) {
						console.log('Neues Token-Guthaben:', userData.token_balance);
						// Aktualisiere den Zustand mit dem neuen Guthaben
						setTokenBalance(userData.token_balance);

						// Löse ein Event aus, um alle TokenDisplay-Komponenten zu benachrichtigen
						console.log('Löse TOKEN_BALANCE_UPDATED-Event aus');
						eventEmitter.emit(EVENTS.TOKEN_BALANCE_UPDATED);
					}
				} catch (error) {
					console.error('Fehler beim direkten Aktualisieren des Token-Guthabens:', error);
					// Fallback zur normalen Aktualisierung
					await updateTokenBalance();
				}
			}, 2000); // 2 Sekunden Verzögerung für mehr Zeit
		} catch (error) {
			console.error('Error generating text:', error);
			// You could add error handling here, such as displaying a toast message
		} finally {
			setIsGenerating(false);
		}
	};

	// Toggle the dropdown
	const toggleDropdown = () => {
		setIsDropdownOpen(!isDropdownOpen);
	};

	// Funktion zum Schätzen der Token-Kosten
	const estimateTokenCost = async () => {
		if (!promptText.trim() && !documentContent.trim()) return;

		try {
			// Erstelle den Basis-Prompt
			const basePrompt =
				promptText.trim() || 'Bitte setze diesen Text fort oder formuliere ihn neu:';

			// Erstelle den vollständigen Prompt mit dem Dokumentinhalt
			let fullPrompt = basePrompt;

			// Für die Tokenschätzung erstellen wir den vollständigen Prompt so, wie er an das Modell gesendet wird
			if (documentContent.trim()) {
				// Für 'append' oder 'replace' würde der Prompt unterschiedlich sein, aber für die Schätzung
				// verwenden wir die 'append'-Variante als Beispiel
				fullPrompt += `\n\nHier der vorhandene Text, bitte setze ihn fort:\n${documentContent}`;
			}

			console.log('Schätze Token-Kosten für vollständigen Prompt mit Länge:', fullPrompt.length);

			// Schätze die Token-Kosten für den vollständigen Prompt (inkl. Dokumentinhalt)
			const { estimate } = await checkTokenBalance(
				fullPrompt,
				selectedModel.value,
				2000 // Standard auf 2000 Tokens
			);

			console.log('Token-Schätzung:', estimate);

			// Speichere die Schätzung
			setTokenEstimate(estimate);

			return estimate;
		} catch (error) {
			console.error('Error estimating token cost:', error);
			return null;
		}
	};

	// Funktion zum Aktualisieren des Token-Guthabens
	const updateTokenBalance = async () => {
		try {
			setLoading(true);

			// Hole den aktuellen Benutzer
			const { data: sessionData } = await supabase.auth.getSession();
			const userId = sessionData?.session?.user?.id;

			if (!userId) {
				throw new Error('Nicht angemeldet');
			}

			// Hole das aktuelle Token-Guthaben
			const balance = await getCurrentTokenBalance(userId);
			setTokenBalance(balance);

			// Löse ein Event aus, um alle TokenDisplay-Komponenten zu benachrichtigen
			console.log('updateTokenBalance: Löse TOKEN_BALANCE_UPDATED-Event aus');
			eventEmitter.emit(EVENTS.TOKEN_BALANCE_UPDATED);
		} catch (error) {
			console.error('Fehler beim Laden des Token-Guthabens:', error);
		} finally {
			setLoading(false);
		}
	};

	// Effekt zum Laden des Token-Guthabens beim Start
	useEffect(() => {
		updateTokenBalance();
	}, []);

	// Effekt zum Aktualisieren der Token-Schätzung, wenn sich der Prompt oder der Dokumentinhalt ändert
	useEffect(() => {
		// Wir verwenden einen Debounce, um nicht zu viele Anfragen zu senden
		const timer = setTimeout(async () => {
			if (promptText.trim() || documentContent.trim()) {
				await estimateTokenCost();
			} else {
				setTokenEstimate(null);
			}
		}, 500); // 500ms Debounce

		return () => clearTimeout(timer);
	}, [promptText, documentContent, selectedModel]);

	// Bestimme, ob wir auf einem schmalen Bildschirm sind
	const [isNarrowScreen, setIsNarrowScreen] = useState(false);

	// Effekt zur Erkennung der Bildschirmbreite
	useEffect(() => {
		if (Platform.OS === 'web' && typeof window !== 'undefined') {
			const handleResize = () => {
				setIsNarrowScreen(window.innerWidth < 768);
			};

			// Initial setzen
			handleResize();

			// Event-Listener für Größenänderungen
			window.addEventListener('resize', handleResize);

			return () => {
				window.removeEventListener('resize', handleResize);
			};
		} else {
			// Für mobile Plattformen setzen wir einen Standardwert
			setIsNarrowScreen(true);
		}
	}, []);

	return (
		<View style={[styles.container, { backgroundColor: isDark ? '#111827' : '#f9fafb' }]}>
			{/* Token-Estimator */}
			{showTokenEstimator && tokenEstimate && (
				<TokenEstimator
					estimate={tokenEstimate}
					estimatedCompletionLength={2000}
					onClose={() => setShowTokenEstimator(false)}
					isLoading={isGenerating}
				/>
			)}

			{/* Token-Anzeige entfernt von hier - wird im Prompt-Input angezeigt */}
			{/* Prompt Input mit Action Buttons */}
			<View
				style={[styles.promptRow, isNarrowScreen ? styles.promptRowNarrow : styles.promptRowWide]}
			>
				{/* Prompt-Eingabefeld */}
				<View
					style={[
						styles.promptInputContainer,
						{ backgroundColor: isDark ? '#374151' : '#f3f4f6' },
						isFocused && styles.promptInputContainerFocused,
						isNarrowScreen && { height: 48 },
					]}
				>
					<TextInput
						value={promptText}
						onChangeText={setPromptText}
						placeholder="Gib deinen Prompt ein..."
						placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
						style={[styles.promptInput, { color: isDark ? '#f9fafb' : '#111827' }]}
						multiline
						numberOfLines={1}
						onFocus={() => setIsFocused(true)}
						onBlur={() => setIsFocused(false)}
						selectionColor={isDark ? '#6366f1' : '#4f46e5'}
						cursorColor={isDark ? '#6366f1' : '#4f46e5'}
						className="ai-input-no-focus"
					/>

					{/* Token-Counter im Prompt-Input rechts */}
					<TouchableOpacity
						onPress={() => setShowTokenEstimator(true)}
						style={styles.tokenCounterContainer}
					>
						<View style={styles.tokenCounterContent}>
							<Text
								style={{
									fontSize: 12,
									fontWeight: '500',
									color: isDark ? '#f9fafb' : '#111827',
									textAlign: 'right',
								}}
							>
								{loading ? '---' : tokenBalance?.toLocaleString() || '---'}
							</Text>
							{tokenEstimate?.appTokens && (
								<Text
									style={{
										fontSize: 12,
										marginTop: 2,
										color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
										textAlign: 'right',
									}}
								>
									→ {Math.max(0, (tokenBalance || 0) - tokenEstimate.appTokens).toLocaleString()}
								</Text>
							)}
						</View>
					</TouchableOpacity>
				</View>

				{/* Action Buttons Container */}
				<View
					style={[
						styles.actionButtonsContainer,
						isNarrowScreen ? styles.actionButtonsContainerNarrow : {},
					]}
				>
					{/* Weiter Button */}
					<Pressable
						style={({ pressed }) => [
							styles.actionButton,
							{
								backgroundColor: isGenerating
									? '#6b7280'
									: pressed
										? isDark
											? '#1f2937'
											: '#d1d5db'
										: isDark
											? '#374151'
											: '#e5e7eb',
								opacity: pressed ? 0.8 : 1,
							},
							!documentContent.trim() && !promptText.trim() && { opacity: 0.7 },
							isNarrowScreen && { flex: 1 },
						]}
						onPress={() => handleGenerateText('append')}
						disabled={isGenerating || (!documentContent.trim() && !promptText.trim())}
					>
						<View style={styles.actionButtonContent}>
							{isGenerating ? (
								<Text style={[styles.actionButtonText, { color: '#ffffff' }]}>Generiere...</Text>
							) : (
								<>
									<Text
										style={[styles.actionButtonText, { color: isDark ? '#f9fafb' : '#111827' }]}
									>
										Weiter
									</Text>
									<Ionicons
										name="arrow-forward-outline"
										size={18}
										color={isDark ? '#f9fafb' : '#111827'}
										style={{ marginLeft: 8 }}
									/>
								</>
							)}
						</View>
					</Pressable>

					{/* Ersetzen Button */}
					<Pressable
						style={({ pressed }) => [
							styles.actionButton,
							{
								backgroundColor: isGenerating
									? '#6b7280'
									: pressed
										? isDark
											? '#1f2937'
											: '#d1d5db'
										: isDark
											? '#374151'
											: '#e5e7eb',
								opacity: pressed ? 0.8 : 1,
							},
							!documentContent.trim() && !promptText.trim() && { opacity: 0.7 },
							isNarrowScreen ? { marginLeft: 8 } : { marginLeft: 12 },
						]}
						onPress={() => handleGenerateText('replace')}
						disabled={isGenerating || (!documentContent.trim() && !promptText.trim())}
					>
						<View style={styles.actionButtonContent}>
							{isGenerating ? (
								<Text style={[styles.actionButtonText, { color: '#ffffff' }]}>Generiere...</Text>
							) : (
								<>
									<Text
										style={[styles.actionButtonText, { color: isDark ? '#f9fafb' : '#111827' }]}
									>
										Ersetzen
									</Text>
									<Ionicons
										name="arrow-up-outline"
										size={18}
										color={isDark ? '#f9fafb' : '#111827'}
										style={{ marginLeft: 8, transform: [{ rotate: '45deg' }] }}
									/>
								</>
							)}
						</View>
					</Pressable>

					{/* Model-Auswahl-Icon */}
					<View style={styles.modelSelectorContainer}>
						<TouchableOpacity style={styles.modelSelectorButton} onPress={toggleDropdown}>
							<Ionicons name="ellipsis-vertical" size={20} color={isDark ? '#f9fafb' : '#111827'} />
						</TouchableOpacity>

						{/* Horizontale Modellauswahl */}
						{isDropdownOpen && (
							<View style={[styles.modelList, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}>
								<ScrollView
									horizontal
									showsHorizontalScrollIndicator={false}
									contentContainerStyle={styles.modelListContent}
								>
									{availableModels.map((model) => (
										<TouchableOpacity
											key={model.value}
											style={[
												styles.modelItem,
												selectedModel.value === model.value && {
													backgroundColor: isDark ? '#4b5563' : '#e5e7eb',
													borderColor: isDark ? '#6366f1' : '#4f46e5',
												},
											]}
											onPress={() => {
												setSelectedModel(model);
												setIsDropdownOpen(false);
											}}
										>
											<Text
												style={[
													styles.modelItemText,
													{ color: isDark ? '#f9fafb' : '#111827' },
													selectedModel.value === model.value && {
														color: isDark ? '#a5b4fc' : '#4f46e5',
														fontWeight: '600',
													},
												]}
											>
												{model.label}
											</Text>
										</TouchableOpacity>
									))}
								</ScrollView>
							</View>
						)}
					</View>
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		borderTopWidth: 1,
		borderTopColor: 'rgba(255, 255, 255, 0.12)',
		paddingVertical: 12,
		paddingHorizontal: 16,
		zIndex: 100,
		// Add shadow
		shadowColor: '#000',
		shadowOffset: { width: 0, height: -2 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 5,
	},
	fullWidthButton: {
		alignSelf: 'stretch',
		flex: 1,
		width: 'auto',
	},

	promptRow: {
		maxWidth: 800,
		width: '100%',
		marginHorizontal: 'auto',
	},
	promptRowWide: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	promptRowNarrow: {
		flexDirection: 'column',
		alignItems: 'stretch',
	},
	modelSelectorContainer: {
		position: 'relative',
		zIndex: 10,
		marginLeft: 8,
	},
	modelSelectorButton: {
		alignItems: 'center',
		justifyContent: 'center',
		width: 32,
		height: 40,
		borderRadius: 6,
		backgroundColor: 'transparent',
	},

	modelList: {
		position: 'absolute',
		top: 0,
		right: 40,
		minWidth: 250,
		maxWidth: 400,
		borderRadius: 6,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 5,
		paddingVertical: 8,
		paddingHorizontal: 4,
	},
	modelListContent: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 4,
	},
	modelItem: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		marginHorizontal: 4,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: 'transparent',
	},
	modelItemText: {
		fontSize: 14,
	},
	metadataContainer: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingTop: 8,
		paddingBottom: 4,
	},
	tokenCounterContainer: {
		position: 'absolute',
		right: 10,
		top: 0,
		bottom: 0,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 8,
	},
	tokenCounterContent: {
		alignItems: 'flex-end',
		justifyContent: 'center',
	},
	tokenCounterText: {
		fontSize: 10,
		fontWeight: '500',
	},
	tokenCounterEstimate: {
		fontSize: 8,
		marginTop: 2,
	},
	promptInputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 12,
		paddingVertical: 0,
		borderRadius: 0,
		flex: 1,
		height: 60,
		marginRight: 12,
		borderWidth: 1,
		borderColor: 'transparent',
	},
	promptInputContainerFocused: {
		borderColor: 'rgba(255, 255, 255, 0.4)',
		borderWidth: 1,
	},
	promptInput: {
		flex: 1,
		fontSize: 14,
		paddingHorizontal: 8,
		paddingVertical: 6,
		textAlignVertical: 'center',
		minHeight: 40,
		maxHeight: 100,
	},
	actionButtonsContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		alignItems: 'center',
	},
	actionButtonsContainerNarrow: {
		marginTop: 8,
		width: '100%',
		justifyContent: 'flex-start',
	},
	actionButton: {
		height: 48,
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 0,
		paddingHorizontal: 16,
		alignSelf: 'flex-start',
	},
	actionButtonContent: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	actionButtonText: {
		fontWeight: '500',
		fontSize: 14,
	},
});
