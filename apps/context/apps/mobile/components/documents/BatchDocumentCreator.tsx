import React, { useState, useEffect, useRef } from 'react';
import {
	View,
	StyleSheet,
	Modal,
	TouchableOpacity,
	ScrollView,
	TextInput,
	Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '~/components/ui/Text';
import { ThemedButton } from '~/components/ui/ThemedButton';
import { LoadingScreen } from '~/components/ui/LoadingScreen';
import {
	generateText,
	availableModels,
	AIModelOption,
	getProviderForModel,
} from '~/services/aiService';
import {
	createDocument,
	getDocuments,
	Document,
	getDocumentById,
} from '~/services/supabaseService';
import { useTheme } from '~/utils/theme/theme';
import { useRouter } from 'expo-router';

interface BatchDocumentCreatorProps {
	visible: boolean;
	onClose: () => void;
	spaceId: string;
	onDocumentsCreated?: () => void;
}

export const BatchDocumentCreator: React.FC<BatchDocumentCreatorProps> = ({
	visible,
	onClose,
	spaceId,
	onDocumentsCreated,
}) => {
	const [basePrompt, setBasePrompt] = useState('');
	const [subjects, setSubjects] = useState('');
	const [promptSuffix, setPromptSuffix] = useState('');
	const [selectedModel, setSelectedModel] = useState(availableModels[0]?.value || '');
	const [isGenerating, setIsGenerating] = useState(false);
	const [progress, setProgress] = useState({ current: 0, total: 0 });
	const [error, setError] = useState<string | null>(null);
	const [subjectList, setSubjectList] = useState<string[]>([]);
	const [documents, setDocuments] = useState<Document[]>([]);
	const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
	const [documentFilter, setDocumentFilter] = useState<'all' | 'text' | 'context' | 'prompt'>(
		'context'
	);
	const [promptDocuments, setPromptDocuments] = useState<Document[]>([]);
	const { mode, colors } = useTheme();
	const isDark = mode === 'dark';
	const router = useRouter();

	// Lade die Dokumente aus dem aktuellen Space
	useEffect(() => {
		if (visible && spaceId) {
			const loadDocuments = async () => {
				try {
					const docs = await getDocuments(spaceId);
					setDocuments(docs);
					// Filtere Prompt-Dokumente für die separate Anzeige
					setPromptDocuments(docs.filter((doc) => doc.type === 'prompt'));
				} catch (error) {
					console.error('Fehler beim Laden der Dokumente:', error);
				}
			};

			loadDocuments();
		}
	}, [visible, spaceId]);

	// Funktion zum Aufteilen der Subjekte
	const parseSubjects = (): string[] => {
		return subjects
			.split(',')
			.map((subject) => subject.trim())
			.filter((subject) => subject.length > 0);
	};

	// Funktion zum Generieren und Erstellen der Dokumente
	const handleCreateDocuments = async () => {
		const parsedSubjects = parseSubjects();

		if (!basePrompt.trim()) {
			setError('Bitte geben Sie einen Basis-Prompt ein.');
			return;
		}

		if (parsedSubjects.length === 0) {
			setError('Bitte geben Sie mindestens ein Subjekt ein.');
			return;
		}

		setSubjectList(parsedSubjects);
		setIsGenerating(true);
		setError(null);
		setProgress({ current: 0, total: parsedSubjects.length });

		const createdDocumentIds: string[] = [];

		try {
			for (let i = 0; i < parsedSubjects.length; i++) {
				const subject = parsedSubjects[i];
				setProgress({ current: i + 1, total: parsedSubjects.length });

				// Erstelle den vollständigen Prompt
				let fullPrompt = `${basePrompt} ${subject}${promptSuffix ? ' ' + promptSuffix : ''}`;

				// Füge ausgewählte Dokumente als Kontext hinzu
				if (selectedDocuments.length > 0) {
					let contextContent = '';

					for (const docId of selectedDocuments) {
						const doc = await getDocumentById(docId);
						if (doc && doc.content) {
							contextContent += `\n\n${doc.title}:\n${doc.content}`;
						}
					}

					if (contextContent) {
						fullPrompt += `\n\nHier dazu noch kontext: ${contextContent}`;
					}
				}

				// Bestimme den Provider basierend auf dem ausgewählten Modell
				const provider = getProviderForModel(selectedModel);

				// Generiere Text mit dem ausgewählten KI-Modell
				const result = await generateText(fullPrompt, provider, {
					model: selectedModel,
				});

				// Erstelle das Dokument in der Datenbank
				const { data, error } = await createDocument(
					result.text, // Inhalt ist der generierte Text
					'text' as 'text' | 'context' | 'prompt', // Typ ist "text"
					spaceId, // Space-ID
					{
						title: subject, // Titel des Dokuments ist das Subjekt
						// Metadaten
						prompt: fullPrompt,
						model: selectedModel,
						batchGenerated: true,
						basePrompt,
						promptSuffix,
						subject,
					}
				);

				if (error) {
					console.error(`Fehler beim Erstellen des Dokuments für ${subject}:`, error);
				} else if (data) {
					createdDocumentIds.push(data.id);
				}
			}

			// Erfolg - schließe den Dialog automatisch und zeige dann die Erfolgsmeldung
			onClose();
			if (onDocumentsCreated) {
				onDocumentsCreated();
			}

			// Zeige die Erfolgsmeldung nach einer kurzen Verzögerung, damit die Spaces-Seite aktualisiert werden kann
			setTimeout(() => {
				Alert.alert(
					'Erfolg',
					`${createdDocumentIds.length} Dokumente wurden erfolgreich erstellt.`
				);
			}, 300);
		} catch (err) {
			console.error('Fehler bei der Batch-Erstellung:', err);
			setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
		} finally {
			setIsGenerating(false);
		}
	};

	return (
		<>
			<Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
				<View
					style={[
						styles.modalContainer,
						{ backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)' },
					]}
				>
					<View
						style={[
							styles.modalContent,
							{
								backgroundColor: isDark ? colors.gray[800] : colors.gray[50],
								borderColor: isDark ? colors.gray[700] : colors.gray[200],
							},
						]}
					>
						{/* Header */}
						<View
							style={[
								styles.header,
								{ borderBottomColor: isDark ? colors.gray[700] : colors.gray[200] },
							]}
						>
							<Text style={[styles.title, { color: isDark ? colors.gray[100] : colors.gray[900] }]}>
								Mehrere Dokumente erstellen
							</Text>
							<TouchableOpacity onPress={onClose} disabled={isGenerating}>
								<Ionicons
									name="close-outline"
									size={24}
									color={isDark ? colors.gray[300] : colors.gray[700]}
								/>
							</TouchableOpacity>
						</View>

						<ScrollView style={styles.scrollView}>
							{/* Erklärung */}
							<View style={styles.section}>
								<Text
									style={[
										styles.sectionTitle,
										{ color: isDark ? colors.gray[200] : colors.gray[800] },
									]}
								>
									Wie es funktioniert
								</Text>
								<Text
									style={[
										styles.explanation,
										{ color: isDark ? colors.gray[300] : colors.gray[700] },
									]}
								>
									Geben Sie einen Basis-Prompt ein und fügen Sie dann eine Liste von Subjekten
									hinzu, getrennt durch Kommas. Für jedes Subjekt wird ein eigenes Dokument
									erstellt, wobei der Basis-Prompt mit dem jeweiligen Subjekt kombiniert wird.
								</Text>
							</View>

							{/* Basis-Prompt */}
							<View style={styles.section}>
								<Text
									style={[
										styles.sectionTitle,
										{ color: isDark ? colors.gray[200] : colors.gray[800] },
									]}
								>
									Basis-Prompt
								</Text>
								<TextInput
									style={[
										styles.textInput,
										{
											backgroundColor: isDark ? colors.gray[700] : colors.gray[100],
											color: isDark ? colors.gray[100] : colors.gray[900],
											borderColor: isDark ? colors.gray[600] : colors.gray[300],
										},
									]}
									value={basePrompt}
									onChangeText={setBasePrompt}
									placeholder="Basis-Prompt eingeben..."
									placeholderTextColor={isDark ? colors.gray[400] : colors.gray[500]}
									multiline
									numberOfLines={4}
									editable={!isGenerating}
								/>

								{/* Prompt-Vorschläge für Basis-Prompt */}
								{promptDocuments.length > 0 && (
									<View style={styles.promptSuggestions}>
										<Text
											style={[
												styles.promptSuggestionsTitle,
												{ color: isDark ? colors.gray[300] : colors.gray[700] },
											]}
										>
											Gespeicherte Prompts:
										</Text>
										<ScrollView
											horizontal
											showsHorizontalScrollIndicator={false}
											style={styles.promptsScrollView}
										>
											{promptDocuments.map((prompt) => (
												<TouchableOpacity
													key={`base-${prompt.id}`}
													style={[
														styles.promptSuggestion,
														{
															backgroundColor: isDark
																? 'rgba(217, 119, 6, 0.2)'
																: 'rgba(217, 119, 6, 0.1)',
															borderColor: '#d97706',
														},
													]}
													onPress={() => {
														if (prompt.content) {
															setBasePrompt(prompt.content);
															Alert.alert(
																'Prompt eingefügt',
																'Der Prompt wurde als Basis-Prompt eingefügt.'
															);
														}
													}}
													disabled={isGenerating}
												>
													<Text
														style={[
															styles.promptSuggestionTitle,
															{ color: isDark ? colors.gray[200] : colors.gray[800] },
														]}
														numberOfLines={1}
													>
														{prompt.title}
													</Text>
													<Text
														style={[
															styles.promptSuggestionPreview,
															{ color: isDark ? colors.gray[300] : colors.gray[600] },
														]}
														numberOfLines={2}
													>
														{prompt.content
															? prompt.content.length > 50
																? prompt.content.substring(0, 50) + '...'
																: prompt.content
															: ''}
													</Text>
												</TouchableOpacity>
											))}
										</ScrollView>
									</View>
								)}
							</View>

							{/* Subjekte */}
							<View style={styles.section}>
								<Text
									style={[
										styles.sectionTitle,
										{ color: isDark ? colors.gray[200] : colors.gray[800] },
									]}
								>
									Subjekte (durch Kommas getrennt)
								</Text>
								<TextInput
									style={[
										styles.textInput,
										{
											backgroundColor: isDark ? colors.gray[700] : colors.gray[100],
											color: isDark ? colors.gray[100] : colors.gray[900],
											borderColor: isDark ? colors.gray[600] : colors.gray[300],
										},
									]}
									value={subjects}
									onChangeText={setSubjects}
									placeholder="Subjekte eingeben..."
									placeholderTextColor={isDark ? colors.gray[400] : colors.gray[500]}
									multiline
									numberOfLines={4}
									editable={!isGenerating}
								/>
							</View>

							{/* Prompt-Suffix */}
							<View style={styles.section}>
								<Text
									style={[
										styles.sectionTitle,
										{ color: isDark ? colors.gray[200] : colors.gray[800] },
									]}
								>
									Prompt-Suffix
								</Text>
								<TextInput
									style={[
										styles.textInput,
										{
											backgroundColor: isDark ? colors.gray[700] : colors.gray[100],
											color: isDark ? colors.gray[100] : colors.gray[900],
											borderColor: isDark ? colors.gray[600] : colors.gray[300],
										},
									]}
									placeholder="z.B. und beschreibe auch die wichtigsten Errungenschaften"
									placeholderTextColor={isDark ? colors.gray[400] : colors.gray[500]}
									value={promptSuffix}
									onChangeText={setPromptSuffix}
									multiline
									numberOfLines={2}
									editable={!isGenerating}
								/>
							</View>

							{/* Dokumentauswahl */}
							<View style={styles.section}>
								<Text
									style={[
										styles.sectionTitle,
										{ color: isDark ? colors.gray[200] : colors.gray[800] },
									]}
								>
									Dokumente als Kontext hinzufügen
								</Text>

								{/* Dokumenttyp-Filter */}
								<View style={styles.filterContainer}>
									<Text
										style={[
											styles.filterLabel,
											{ color: isDark ? colors.gray[300] : colors.gray[700] },
										]}
									>
										Filter:
									</Text>
									<ScrollView horizontal showsHorizontalScrollIndicator={false}>
										<View style={styles.filterOptions}>
											{[
												{ value: 'all', label: 'Alle' },
												{ value: 'text', label: 'Text' },
												{ value: 'context', label: 'Kontext' },
												{ value: 'prompt', label: 'Prompt' },
											].map((option) => (
												<TouchableOpacity
													key={option.value}
													style={[
														styles.filterOption,
														{
															backgroundColor:
																documentFilter === option.value
																	? isDark
																		? colors.primary[700]
																		: colors.primary[100]
																	: isDark
																		? colors.gray[700]
																		: colors.gray[100],
															borderColor:
																documentFilter === option.value
																	? isDark
																		? colors.primary[500]
																		: colors.primary[500]
																	: isDark
																		? colors.gray[600]
																		: colors.gray[300],
														},
													]}
													onPress={() => setDocumentFilter(option.value as any)}
													disabled={isGenerating}
												>
													<Text
														style={[
															styles.filterOptionText,
															{
																color:
																	documentFilter === option.value
																		? isDark
																			? colors.primary[100]
																			: colors.primary[800]
																		: isDark
																			? colors.gray[200]
																			: colors.gray[800],
															},
														]}
													>
														{option.label}
													</Text>
												</TouchableOpacity>
											))}
										</View>
									</ScrollView>
								</View>

								{/* Dokumentliste */}
								<View style={styles.documentList}>
									{documents
										.filter((doc) => documentFilter === 'all' || doc.type === documentFilter)
										.map((doc) => (
											<TouchableOpacity
												key={doc.id}
												style={[
													styles.documentItem,
													{
														backgroundColor: selectedDocuments.includes(doc.id)
															? isDark
																? colors.primary[700]
																: colors.primary[100]
															: isDark
																? colors.gray[700]
																: colors.gray[100],
														borderColor: selectedDocuments.includes(doc.id)
															? isDark
																? colors.primary[500]
																: colors.primary[500]
															: isDark
																? colors.gray[600]
																: colors.gray[300],
													},
												]}
												onPress={() => {
													// Normales Verhalten für alle Dokumente (nur Kontext-Dokumente werden angezeigt)
													if (doc.type !== 'prompt') {
														// Normales Verhalten für Kontext-Dokumente
														setSelectedDocuments((prev) =>
															prev.includes(doc.id)
																? prev.filter((id) => id !== doc.id)
																: [...prev, doc.id]
														);
													}
												}}
												disabled={isGenerating}
											>
												<View style={styles.documentItemContent}>
													<Text
														style={[
															styles.documentTitle,
															{
																color: selectedDocuments.includes(doc.id)
																	? isDark
																		? colors.primary[100]
																		: colors.primary[800]
																	: isDark
																		? colors.gray[200]
																		: colors.gray[800],
															},
														]}
													>
														{doc.title}
													</Text>
													<Text
														style={[
															styles.documentType,
															{
																color: selectedDocuments.includes(doc.id)
																	? isDark
																		? colors.primary[200]
																		: colors.primary[700]
																	: isDark
																		? colors.gray[300]
																		: colors.gray[700],
															},
														]}
													>
														{doc.type === 'text'
															? 'Text'
															: doc.type === 'context'
																? 'Kontext'
																: 'Prompt'}
													</Text>
												</View>
												<Ionicons
													name={
														selectedDocuments.includes(doc.id)
															? 'checkmark-circle'
															: 'checkmark-circle-outline'
													}
													size={24}
													color={
														selectedDocuments.includes(doc.id)
															? isDark
																? colors.primary[300]
																: colors.primary[600]
															: isDark
																? colors.gray[400]
																: colors.gray[500]
													}
												/>
											</TouchableOpacity>
										))}
									{documents.filter(
										(doc) => documentFilter === 'all' || doc.type === documentFilter
									).length === 0 && (
										<Text
											style={[
												styles.noDocumentsText,
												{ color: isDark ? colors.gray[400] : colors.gray[500] },
											]}
										>
											Keine Dokumente vom Typ "
											{documentFilter === 'all'
												? 'Alle'
												: documentFilter === 'text'
													? 'Text'
													: documentFilter === 'context'
														? 'Kontext'
														: 'Prompt'}
											" gefunden.
										</Text>
									)}
								</View>
							</View>

							{/* KI-Modell Auswahl */}
							<View style={styles.section}>
								<Text
									style={[
										styles.sectionTitle,
										{ color: isDark ? colors.gray[200] : colors.gray[800] },
									]}
								>
									KI-Modell
								</Text>
								<View style={styles.modelSelector}>
									{availableModels.map((model) => (
										<TouchableOpacity
											key={model.value}
											style={[
												styles.modelOption,
												{
													backgroundColor:
														selectedModel === model.value
															? isDark
																? colors.primary[700]
																: colors.primary[100]
															: isDark
																? colors.gray[700]
																: colors.gray[100],
													borderColor:
														selectedModel === model.value
															? isDark
																? colors.primary[500]
																: colors.primary[500]
															: isDark
																? colors.gray[600]
																: colors.gray[300],
												},
											]}
											onPress={() => setSelectedModel(model.value)}
											disabled={isGenerating}
										>
											<Text
												style={[
													styles.modelOptionText,
													{
														color:
															selectedModel === model.value
																? isDark
																	? colors.primary[100]
																	: colors.primary[800]
																: isDark
																	? colors.gray[200]
																	: colors.gray[800],
													},
												]}
											>
												{model.label}
											</Text>
										</TouchableOpacity>
									))}
								</View>
							</View>

							{/* Fehleranzeige */}
							{error && (
								<View
									style={[
										styles.errorContainer,
										{
											backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
										},
									]}
								>
									<Ionicons name="alert-circle-outline" size={20} color="#ef4444" />
									<Text style={styles.errorText}>{error}</Text>
								</View>
							)}
						</ScrollView>

						{/* Footer mit Buttons */}
						<View
							style={[
								styles.footer,
								{ borderTopColor: isDark ? colors.gray[700] : colors.gray[200] },
							]}
						>
							<ThemedButton
								title="Abbrechen"
								variant="outline"
								onPress={onClose}
								disabled={isGenerating}
								style={{ marginRight: 8 }}
							/>
							<ThemedButton
								title={isGenerating ? 'Wird erstellt...' : 'Dokumente erstellen'}
								variant="primary"
								onPress={handleCreateDocuments}
								disabled={isGenerating || !basePrompt.trim() || parseSubjects().length === 0}
								iconName="document-text-outline"
							/>
						</View>
					</View>
				</View>
			</Modal>

			{/* LoadingScreen für die Batch-Verarbeitung */}
			<LoadingScreen
				visible={isGenerating}
				title="Dokumente werden erstellt"
				message="Die KI generiert Texte basierend auf Ihrem Prompt. Dies kann je nach Anzahl der Subjekte einige Zeit dauern."
				progress={{
					current: progress.current,
					total: progress.total,
					label:
						progress.current > 0
							? `Erstelle Dokument für: ${subjectList[progress.current - 1] || ''}`
							: '',
				}}
				icon={{
					name: 'document-text-outline',
					color: isDark ? colors.primary[400] : colors.primary[500],
				}}
			/>
		</>
	);
};

const styles = StyleSheet.create({
	modalContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	modalContent: {
		width: '100%',
		maxWidth: 600,
		borderRadius: 12,
		borderWidth: 1,
		overflow: 'hidden',
		maxHeight: '90%',
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 16,
		borderBottomWidth: 1,
	},
	title: {
		fontSize: 18,
		fontWeight: '600',
	},
	scrollView: {
		padding: 16,
	},
	section: {
		marginBottom: 20,
	},
	sectionHeaderRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 8,
	},
	explanation: {
		fontSize: 14,
		lineHeight: 20,
		marginBottom: 8,
	},
	textInput: {
		borderWidth: 1,
		borderRadius: 8,
		padding: 12,
		fontSize: 16,
		textAlignVertical: 'top',
	},
	modelSelector: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	modelOption: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 8,
		borderWidth: 1,
		marginRight: 8,
		marginBottom: 8,
	},
	modelOptionText: {
		fontSize: 14,
		fontWeight: '500',
	},
	errorContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 12,
		borderRadius: 8,
		marginBottom: 16,
	},
	errorText: {
		color: '#ef4444',
		marginLeft: 8,
		fontSize: 14,
	},
	filterContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 12,
	},
	filterLabel: {
		fontSize: 14,
		marginRight: 8,
	},
	filterOptions: {
		flexDirection: 'row',
	},
	filterOption: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 6,
		marginRight: 8,
		borderWidth: 1,
	},
	filterOptionText: {
		fontSize: 14,
		fontWeight: '500',
	},
	documentList: {
		marginTop: 8,
		maxHeight: 200,
	},
	promptSuggestions: {
		marginTop: 8,
		marginBottom: 16,
	},
	promptSuggestionsTitle: {
		fontSize: 14,
		fontWeight: '500',
		marginBottom: 8,
	},
	promptsScrollView: {
		flexDirection: 'row',
	},
	promptSuggestion: {
		padding: 8,
		borderRadius: 8,
		borderWidth: 1,
		marginRight: 8,
		width: 200,
	},
	promptSuggestionTitle: {
		fontSize: 14,
		fontWeight: '600',
		marginBottom: 4,
	},
	promptSuggestionPreview: {
		fontSize: 12,
	},
	documentItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 12,
		borderRadius: 6,
		marginBottom: 8,
		borderWidth: 1,
	},
	documentItemContent: {
		flex: 1,
	},
	documentTitle: {
		fontSize: 14,
		fontWeight: '500',
		marginBottom: 4,
	},
	documentType: {
		fontSize: 12,
	},
	noDocumentsText: {
		textAlign: 'center',
		padding: 12,
		fontStyle: 'italic',
	},
	footer: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		padding: 16,
		borderTopWidth: 1,
	},
});
