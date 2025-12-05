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
	checkTokenBalance,
} from '~/services/aiService';
import { estimateTokens } from '~/services/tokenCountingService';
import { useTheme } from '~/utils/theme/theme';
import { supabase } from '~/utils/supabase';
import { eventEmitter, EVENTS } from '~/utils/eventEmitter';
import { getCurrentTokenBalance } from '~/services/tokenTransactionService';
import { createDocument, Document } from '~/services/supabaseService';
import { useRouter } from 'expo-router';
import {
	calculateSpaceWordCount,
	calculateWordCountByDocumentType,
} from '~/services/wordCountService';
import TokenDisplay from '~/components/monetization/TokenDisplay';
import TokenEstimator from '~/components/monetization/TokenEstimator';

// Globaler Stil für das Entfernen des Fokus-Outlines
if (Platform.OS === 'web' && typeof document !== 'undefined') {
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

interface SpacesLLMToolbarProps {
	spaceId: string;
	documents: {
		id: string;
		title: string;
		content: string;
		type: string;
	}[];
	isGenerating: boolean;
	setIsGenerating: (isGenerating: boolean) => void;
	onDocumentCreated: () => void;
	selectionMode: boolean;
	setSelectionMode: (selectionMode: boolean) => void;
	selectedDocuments: {
		id: string;
		title: string;
		content: string;
		type: string;
	}[];
	setSelectedDocuments: (
		selectedDocuments: {
			id: string;
			title: string;
			content: string;
			type: string;
		}[]
	) => void;
}

export const SpacesLLMToolbar: React.FC<SpacesLLMToolbarProps> = ({
	spaceId,
	documents,
	isGenerating,
	setIsGenerating,
	onDocumentCreated,
	selectionMode,
	setSelectionMode,
	selectedDocuments,
	setSelectedDocuments,
}) => {
	const router = useRouter();
	const { isDark } = useTheme();
	const [selectedModel, setSelectedModel] = useState<AIModelOption>(availableModels[0]);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [promptText, setPromptText] = useState('');
	const [isFocused, setIsFocused] = useState(false);
	const [isNarrowScreen, setIsNarrowScreen] = useState(false);
	const [wordCounts, setWordCounts] = useState({
		total: 0,
		text: 0,
		context: 0,
		prompt: 0,
		readingTime: 0,
	});
	const [tokenEstimate, setTokenEstimate] = useState<any>(null);
	const [selectedDocsTokenEstimate, setSelectedDocsTokenEstimate] = useState<any>(null);
	const [allDocsTokenEstimate, setAllDocsTokenEstimate] = useState<any>(null);
	const [showTokenEstimator, setShowTokenEstimator] = useState(false);
	const [tokenBalance, setTokenBalance] = useState<number | null>(null);
	const [loading, setLoading] = useState(true);

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

	// Dropdown schließen, wenn außerhalb geklickt wird
	useEffect(() => {
		if (Platform.OS === 'web' && typeof document !== 'undefined' && isDropdownOpen) {
			const handleClickOutside = (event: MouseEvent) => {
				const target = event.target as HTMLElement;
				if (!target.closest('.model-selector-container')) {
					setIsDropdownOpen(false);
				}
			};

			document.addEventListener('click', handleClickOutside);

			return () => {
				document.removeEventListener('click', handleClickOutside);
			};
		}
	}, [isDropdownOpen]);

	// Funktion zum Zurücksetzen der Auswahl
	const clearSelection = () => {
		setSelectedDocuments([]);
	};

	// Funktion zur Schätzung der Token-Kosten
	const estimateTokenCost = async (useAllDocuments = false, updateUI = true) => {
		if (selectedDocuments.length === 0 && !promptText.trim() && !useAllDocuments) return;

		try {
			console.log('estimateTokenCost aufgerufen mit useAllDocuments =', useAllDocuments);

			// Erstelle den Basis-Prompt ohne referenzierte Dokumente
			const basePrompt =
				promptText.trim() ||
				'Bitte analysiere die folgenden Dokumente und erstelle eine Zusammenfassung:';
			console.log('Basis-Prompt:', basePrompt);

			// Sammle die zu verwendenden Dokumente
			let referencedDocs: { title: string; content: string }[] = [];

			// Wähle die Dokumente aus
			if (useAllDocuments && documents.length > 0) {
				console.log(`Verwende alle Dokumente (${documents.length} insgesamt)`);
				const docsToUse = documents.filter((doc) => doc.type !== 'generated');
				console.log(`Nach Filterung: ${docsToUse.length} Dokumente`);

				if (docsToUse.length > 0) {
					referencedDocs = docsToUse.map((doc) => {
						console.log(
							`Dokument: id=${doc.id}, title="${doc.title}", content length=${doc.content?.length || 0}`
						);
						return {
							title: doc.title,
							content: doc.content || '',
						};
					});
				}
			} else if (selectedDocuments.length > 0) {
				console.log(`Verwende ausgewählte Dokumente (${selectedDocuments.length})`);
				referencedDocs = selectedDocuments.map((doc) => {
					console.log(
						`Ausgewähltes Dokument: id=${doc.id}, title="${doc.title}", content length=${doc.content?.length || 0}`
					);
					return {
						title: doc.title,
						content: doc.content || '',
					};
				});
			}

			console.log(`Insgesamt ${referencedDocs.length} Dokumente für die Token-Schätzung`);

			// Schätze die Token-Kosten mit dem Basis-Prompt und den referenzierten Dokumenten
			console.log('Rufe checkTokenBalance auf mit:', {
				basePromptLength: basePrompt.length,
				model: selectedModel.value,
				referencedDocsCount: referencedDocs.length,
			});

			const { estimate } = await checkTokenBalance(
				basePrompt,
				selectedModel.value,
				4000,
				referencedDocs // Übergebe die referenzierten Dokumente explizit
			);

			console.log('Ergebnis von checkTokenBalance:', estimate);

			// Speichere die Anzahl der referenzierten Dokumente für die Anzeige
			(estimate as any).referencedDocCount = referencedDocs.length;

			// Speichere die Schätzung in der entsprechenden Zustandsvariable
			if (useAllDocuments) {
				setAllDocsTokenEstimate(estimate);
			} else if (selectedDocuments.length > 0) {
				setSelectedDocsTokenEstimate(estimate);
			}

			// Aktualisiere die Hauptschätzung, aber zeige den Schätzer nicht automatisch an
			if (updateUI) {
				setTokenEstimate(estimate);
				// Wir zeigen den Schätzer nicht mehr automatisch an
				// setShowTokenEstimator(true);
			}

			return basePrompt;
		} catch (error) {
			console.error('Error estimating token cost:', error);
			return null;
		}
	};

	const handleGenerateText = async (useAllDocuments = false) => {
		if ((selectedDocuments.length === 0 && !promptText.trim() && !useAllDocuments) || isGenerating)
			return;

		try {
			setIsGenerating(true);

			// Wir führen die Generierung direkt aus, ohne auf die Vorschau zu warten

			// Erstelle den Basis-Prompt ohne referenzierte Dokumente
			const basePrompt =
				promptText.trim() ||
				'Bitte analysiere die folgenden Dokumente und erstelle eine Zusammenfassung:';

			// Sammle die zu verwendenden Dokumente
			let referencedDocs: { title: string; content: string }[] = [];

			// Wähle die Dokumente aus
			if (useAllDocuments && documents.length > 0) {
				const docsToUse = documents.filter((doc) => doc.type !== 'generated');

				if (docsToUse.length > 0) {
					referencedDocs = docsToUse.map((doc) => ({
						title: doc.title,
						content: doc.content || '',
					}));
				}
			} else if (selectedDocuments.length > 0) {
				referencedDocs = selectedDocuments.map((doc) => ({
					title: doc.title,
					content: doc.content || '',
				}));
			}

			// Erstelle den vollständigen Prompt mit den referenzierten Dokumenten
			let fullPrompt = basePrompt;

			if (referencedDocs.length > 0) {
				fullPrompt += '\n\nHier sind die referenzierten Dokumente als Kontext:\n\n';

				referencedDocs.forEach((doc, index) => {
					fullPrompt += `Dokument ${index + 1} (${doc.title}):\n${doc.content}\n\n`;
				});
			}

			// Generiere Text mit dem ausgewählten Modell
			const result = await generateText(
				fullPrompt, // Der vollständige Prompt mit den Dokumenten
				selectedModel.provider,
				{
					model: selectedModel.value,
					maxTokens: 4000,
					temperature: 0.7,
					documentId: spaceId, // Für die Token-Nutzungsverfolgung
				}
			);

			// Extrahiere den generierten Text aus dem Ergebnisobjekt
			const generatedText = result.text;

			// Erstelle ein neues Dokument mit dem generierten Text
			const title = `KI-Analyse (${new Date().toLocaleDateString('de-DE')})`;
			const { data: newDocument } = await createDocument(
				generatedText,
				'text',
				spaceId,
				{
					source: 'ai_analysis',
					documents: selectedDocuments.map((doc) => doc.id),
					tokenUsage: result.tokenInfo, // Speichere die Token-Nutzungsinformationen in den Metadaten
				},
				title
			);

			// Zurücksetzen des Prompt-Texts nach erfolgreicher Generierung
			setPromptText('');
			setSelectedDocuments([]);

			// Benachrichtige die übergeordnete Komponente, dass ein Dokument erstellt wurde
			onDocumentCreated();

			// Navigiere zum neuen Dokument
			if (newDocument) {
				router.push(`/spaces/${spaceId}/documents/${newDocument.id}`);
			}

			// Aktualisiere das Token-Guthaben nach erfolgreichem Call mit einer längeren Verzögerung
			// um sicherzustellen, dass die Datenbank genug Zeit hat, das Guthaben zu aktualisieren
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
		} finally {
			setIsGenerating(false);
		}
	};

	const toggleDropdown = () => {
		setIsDropdownOpen(!isDropdownOpen);
	};

	const documentStats = {
		total: documents.length,
		original: documents.filter((doc) => doc.type === 'original').length,
		generated: documents.filter((doc) => doc.type === 'generated').length,
		context: documents.filter((doc) => doc.type === 'context').length,
		prompt: documents.filter((doc) => doc.type === 'prompt').length,
	};

	useEffect(() => {
		const loadWordCounts = async () => {
			if (spaceId) {
				const counts = await calculateWordCountByDocumentType(spaceId);
				setWordCounts(counts);
			}
		};

		loadWordCounts();
	}, [spaceId, documents]);

	// Effekt zum Aktualisieren der Token-Schätzungen, wenn sich der Prompt oder die ausgewählten Dokumente ändern
	useEffect(() => {
		// Wir verwenden einen Debounce, um nicht zu viele Anfragen zu senden
		const timer = setTimeout(async () => {
			// Wenn keine Dokumente ausgewählt sind, setze die entsprechende Schätzung zurück
			if (selectedDocuments.length === 0) {
				setSelectedDocsTokenEstimate(null);
			} else {
				// Berechne die Schätzung für die ausgewählten Dokumente
				await estimateTokenCost(false, true); // Mit ausgewählten Dokumenten
			}

			// Berechne die Schätzung für alle Dokumente im Space, wenn vorhanden
			if (documents.length > 0) {
				await estimateTokenCost(true, false); // Mit allen Dokumenten, aber ohne UI-Update
			} else {
				setAllDocsTokenEstimate(null);
			}

			// Wenn weder Dokumente ausgewählt sind noch ein Prompt vorhanden ist, setze die Hauptschätzung zurück
			if (selectedDocuments.length === 0 && !promptText.trim()) {
				setTokenEstimate(null);
			}
		}, 500); // 500ms Debounce

		return () => clearTimeout(timer);
	}, [promptText, selectedDocuments, documents]);

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

	const handleButtonClick = () => {
		if (selectionMode) {
			// Wenn im Auswahlmodus, schätze die Token-Kosten mit den ausgewählten Dokumenten
			if (selectedDocuments.length > 0) {
				estimateTokenCost();
			}
			// Beende den Auswahlmodus
			setSelectionMode(false);
		} else {
			// Starte den Auswahlmodus
			setSelectionMode(true);
		}
	};

	const handleAllDocsClick = () => {
		estimateTokenCost(true);
	};

	return (
		<View style={[styles.container, { backgroundColor: isDark ? '#111827' : '#f9fafb' }]}>
			{/* Token-Estimator */}
			{showTokenEstimator && tokenEstimate && (
				<TokenEstimator
					estimate={tokenEstimate}
					estimatedCompletionLength={4000}
					onClose={() => setShowTokenEstimator(false)}
					isLoading={isGenerating}
				/>
			)}

			{/* Token-Anzeige mit geschätzten Kosten und Info-Icon */}
			<View style={styles.metadataContainer}>
				<View style={{ flex: 1 }} />
				<TouchableOpacity
					onPress={() => setShowTokenEstimator(true)}
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						padding: 4, // Größerer Klickbereich
						backgroundColor: 'transparent',
					}}
				>
					<Text
						style={{
							color: isDark ? '#ffffff' : '#000000',
							fontSize: 14,
							fontWeight: '500',
						}}
					>
						{loading ? '---' : tokenBalance?.toLocaleString() || '---'}
					</Text>

					{/* Zeige den geschätzten Tokenverbrauch an, wenn vorhanden */}
					{tokenEstimate?.appTokens && (
						<Text
							style={{
								color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
								fontSize: 12,
								marginLeft: 4,
							}}
						>
							{` → ${Math.max(0, (tokenBalance || 0) - tokenEstimate.appTokens).toLocaleString()}`}
						</Text>
					)}

					{/* Info-Icon */}
					<Text
						style={{
							marginLeft: 4,
							fontSize: 16,
							color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
						}}
					>
						ℹ️
					</Text>
				</TouchableOpacity>
			</View>

			{/* Ausgewählte Dokumente Anzeige */}
			{selectedDocuments.length > 0 && (
				<View
					style={[
						styles.selectedDocsContainer,
						{ backgroundColor: isDark ? '#1f2937' : '#f3f4f6' },
					]}
				>
					<View style={styles.selectedDocsHeader}>
						<Text
							style={{
								color: isDark ? '#d1d5db' : '#4b5563',
								fontSize: 14,
							}}
						>
							{selectedDocuments.length} Dokument{selectedDocuments.length !== 1 ? 'e' : ''}:
						</Text>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							style={styles.selectedDocsScroll}
						>
							{selectedDocuments.map((doc) => (
								<View
									key={doc.id}
									style={[
										styles.selectedDocPill,
										{ backgroundColor: isDark ? '#374151' : '#e5e7eb' },
									]}
								>
									<Text
										style={{
											color: isDark ? '#f9fafb' : '#111827',
											fontSize: 12,
										}}
										numberOfLines={1}
										ellipsizeMode="tail"
									>
										{doc.title}
									</Text>
								</View>
							))}
						</ScrollView>
					</View>
				</View>
			)}

			{/* Prompt Input mit Action Buttons */}
			<View
				style={[styles.promptRow, isNarrowScreen ? styles.promptRowNarrow : styles.promptRowWide]}
			>
				{/* Haupt-Container für Eingabefeld und Modellauswahl */}
				<View style={styles.inputWithModelContainer}>
					{/* Prompt-Eingabefeld (immer sichtbar) */}
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
					</View>

					{/* Model-Auswahl-Icon */}
					<View style={[styles.modelSelectorContainer]} className="model-selector-container">
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
											{selectedModel.value === model.value && (
												<Ionicons
													name="checkmark"
													size={16}
													color={isDark ? '#a5b4fc' : '#4f46e5'}
													style={{ marginLeft: 4 }}
												/>
											)}
										</TouchableOpacity>
									))}
								</ScrollView>
							</View>
						)}
					</View>
				</View>

				{/* Action Buttons Container */}
				<View
					style={[
						styles.actionButtonsContainer,
						isNarrowScreen ? styles.actionButtonsContainerNarrow : {},
					]}
				>
					{/* Generieren Button */}
					<Pressable
						style={({ pressed, hovered }) => [
							styles.actionButton,
							{
								backgroundColor: isGenerating
									? '#6b7280'
									: pressed
										? isDark
											? '#1f2937'
											: '#d1d5db'
										: hovered
											? isDark
												? '#2a3441'
												: '#e2e4e7'
											: isDark
												? '#374151'
												: '#e5e7eb',
							},
							selectedDocuments.length === 0 && !promptText.trim() && { opacity: 0.7 },
						]}
						onPress={() => handleGenerateText(false)}
						disabled={isGenerating || (selectedDocuments.length === 0 && !promptText.trim())}
						onHoverIn={() => Platform.OS === 'web'}
						onHoverOut={() => Platform.OS === 'web'}
					>
						<View style={styles.actionButtonContent}>
							{isGenerating ? (
								<Text style={[styles.actionButtonText, { color: '#ffffff' }]}>Generiere...</Text>
							) : (
								<>
									<View
										style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}
									>
										<Text
											style={[styles.actionButtonText, { color: isDark ? '#f9fafb' : '#111827' }]}
										>
											Generieren
										</Text>
										{selectedDocsTokenEstimate && (
											<Text
												style={[
													styles.tokenCostText,
													{
														color: isDark ? '#d1d5db' : '#4b5563',
														position: 'absolute',
														bottom: -15,
														left: 0,
														right: 0,
														textAlign: 'center',
														fontSize: 12,
													},
												]}
											>
												{`~${Math.round(selectedDocsTokenEstimate.appTokens / 1000)}k Tokens`}
											</Text>
										)}
									</View>
									<Ionicons
										name="sparkles-outline"
										size={18}
										color={isDark ? '#f9fafb' : '#111827'}
										style={{ marginLeft: 8 }}
									/>
								</>
							)}
						</View>
					</Pressable>

					{/* Aus Space Button */}
					<Pressable
						style={({ pressed, hovered }) => [
							styles.actionButton,
							{
								backgroundColor: isGenerating
									? '#6b7280'
									: pressed
										? isDark
											? '#1f2937'
											: '#d1d5db'
										: hovered
											? isDark
												? '#2a3441'
												: '#e2e4e7'
											: isDark
												? '#374151'
												: '#e5e7eb',
							},
						]}
						onPress={() => handleGenerateText(true)}
						disabled={isGenerating || documents.length === 0}
						onHoverIn={() => Platform.OS === 'web'}
						onHoverOut={() => Platform.OS === 'web'}
					>
						<View style={styles.actionButtonContent}>
							<View
								style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}
							>
								<Text style={[styles.actionButtonText, { color: isDark ? '#f9fafb' : '#111827' }]}>
									Aus Space
								</Text>
								{allDocsTokenEstimate && (
									<Text
										style={[
											styles.tokenCostText,
											{
												color: isDark ? '#d1d5db' : '#4b5563',
												position: 'absolute',
												bottom: -15,
												left: 0,
												right: 0,
												textAlign: 'center',
												fontSize: 12,
											},
										]}
									>
										{`~${Math.round(allDocsTokenEstimate.appTokens / 1000)}k Tokens`}
									</Text>
								)}
							</View>
							<Ionicons
								name="folder-open-outline"
								size={18}
								color={isDark ? '#f9fafb' : '#111827'}
								style={{ marginLeft: 8 }}
							/>
						</View>
					</Pressable>

					{/* Alle auswählen Button */}
					<Pressable
						style={({ pressed, hovered }) => [
							styles.actionButton,
							{
								backgroundColor: pressed
									? isDark
										? '#1f2937'
										: '#d1d5db'
									: hovered
										? isDark
											? '#2a3441'
											: '#e2e4e7'
										: isDark
											? '#374151'
											: '#e5e7eb',
							},
						]}
						onPress={() => {
							const filteredDocs = documents.filter((doc) => doc.type !== 'generated');
							if (selectedDocuments.length === filteredDocs.length) {
								// Alle abwählen
								setSelectedDocuments([]);
							} else {
								// Alle auswählen
								setSelectedDocuments(
									filteredDocs.map((doc) => ({
										id: doc.id,
										title: doc.title,
										content: doc.content || '',
										type: doc.type,
									}))
								);
							}
						}}
						disabled={isGenerating}
						onHoverIn={() => Platform.OS === 'web'}
						onHoverOut={() => Platform.OS === 'web'}
					>
						<View style={styles.actionButtonContent}>
							<Text style={[styles.actionButtonText, { color: isDark ? '#f9fafb' : '#111827' }]}>
								Alle
							</Text>
							<Ionicons
								name={
									selectedDocuments.length > 0 &&
									selectedDocuments.length ===
										documents.filter((doc) => doc.type !== 'generated').length
										? 'checkbox'
										: 'checkbox-outline'
								}
								size={18}
								color={isDark ? '#f9fafb' : '#111827'}
								style={{ marginLeft: 8 }}
							/>
						</View>
					</Pressable>
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	tokenCostText: {
		fontSize: 7,
		marginTop: 2,
		opacity: 0.8,
	},
	container: {
		position: 'fixed',
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
	metadataContainer: {
		position: 'absolute',
		bottom: 4, // Positioniere es unten im Toolbar
		right: 16,
		paddingHorizontal: 8,
		paddingVertical: 4,
		flexDirection: 'row',
		justifyContent: 'flex-end',
		alignItems: 'center',
		zIndex: 1000, // Höherer z-Index, um über anderen Elementen zu liegen
		backgroundColor: 'transparent',
		pointerEvents: 'auto', // Stellt sicher, dass Klick-Events funktionieren
	},
	metadataText: {
		fontSize: 8,
		fontWeight: '300',
		opacity: 0.5,
	},
	metadataTextDark: {
		color: '#d1d5db',
	},
	metadataTextLight: {
		color: '#4b5563',
	},
	selectedDocsContainer: {
		padding: 12,
		borderRadius: 8,
		marginBottom: 12,
	},
	selectedDocsHeader: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	selectedDocsScroll: {
		flexDirection: 'row',
		marginLeft: 8,
		flex: 1,
	},
	selectedDocPill: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
		marginRight: 8,
		maxWidth: 150,
	},
	promptRow: {
		maxWidth: 800,
		width: '100%',
		marginHorizontal: 'auto',
		flexDirection: 'column',
		alignItems: 'stretch',
	},
	promptRowWide: {
		// Immer Spalten-Layout verwenden
	},
	promptRowNarrow: {
		// Immer Spalten-Layout verwenden
	},
	promptInputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 12,
		paddingVertical: 0,
		borderRadius: 0,
		flex: 1,
		height: 60,
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
	},
	actionButtonsContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 8,
		width: '100%',
		overflowX: 'auto',
	},
	actionButtonsContainerNarrow: {
		marginTop: 8,
		width: '100%',
		overflowX: 'auto',
	},
	actionButton: {
		height: 50,
		paddingHorizontal: 16,
		borderRadius: 6,
		justifyContent: 'center',
		flexShrink: 0,
		marginRight: 8,
	},
	actionButtonContent: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	actionButtonText: {
		fontSize: 14,
		fontWeight: '500',
	},
	inputWithModelContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
		position: 'relative',
	},
	modelSelectorContainer: {
		position: 'relative',
		zIndex: 10,
		marginLeft: 8,
		height: 40,
		justifyContent: 'center',
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
		zIndex: 20,
	},
	modelListTitle: {
		fontSize: 14,
		fontWeight: 'bold',
		marginBottom: 8,
		paddingHorizontal: 8,
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
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	modelItemText: {
		fontSize: 14,
	},
});
