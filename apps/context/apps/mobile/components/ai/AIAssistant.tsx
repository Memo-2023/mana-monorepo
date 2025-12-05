import React, { useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '~/components/ui/Text';
import { Card } from '~/components/ui/Card';
import { Button } from '~/components/Button';
import { PromptEditor } from './PromptEditor';
import { availableModels } from '~/services/aiService';
import { useTheme, useThemeClasses, twMerge } from '~/utils/theme';
import { createDocumentVersion } from '~/services/supabaseService';

type AIAssistantProps = {
	visible: boolean;
	onClose: () => void;
	onInsertText: (text: string) => void;
	documentContent?: string;
	documentTitle?: string;
	documentId?: string;
	onVersionCreated?: (newDocumentId: string) => void;
};

// Vordefinierte Prompts für verschiedene Aufgaben
const predefinedPrompts = [
	{
		title: 'Text fortsetzen',
		prompt: 'Setze den folgenden Text fort, behalte dabei den Stil und Ton bei:\n\n',
		icon: 'create-outline',
		type: 'continuation',
	},
	{
		title: 'Zusammenfassen',
		prompt: 'Fasse den folgenden Text prägnant zusammen:\n\n',
		icon: 'list-outline',
		type: 'summary',
	},
	{
		title: 'Umformulieren',
		prompt: 'Formuliere den folgenden Text um, behalte dabei den Inhalt bei:\n\n',
		icon: 'sync-outline',
		type: 'rewrite',
	},
	{
		title: 'Ideen generieren',
		prompt: 'Generiere Ideen zum folgenden Thema:\n\n',
		icon: 'bulb-outline',
		type: 'ideas',
	},
];

export const AIAssistant: React.FC<AIAssistantProps> = ({
	visible,
	onClose,
	onInsertText,
	documentContent = '',
	documentTitle = '',
	documentId = '',
	onVersionCreated,
}) => {
	const [showPromptEditor, setShowPromptEditor] = useState(false);
	const [selectedPrompt, setSelectedPrompt] = useState('');
	const [selectedPromptType, setSelectedPromptType] = useState<
		'summary' | 'continuation' | 'rewrite' | 'ideas'
	>('summary');
	const [generatedText, setGeneratedText] = useState('');
	const [showOptionsModal, setShowOptionsModal] = useState(false);
	const [isCreatingVersion, setIsCreatingVersion] = useState(false);
	const { mode, themeName, colors } = useTheme();
	const themeClasses = useThemeClasses();
	const isDark = mode === 'dark';

	const handleSelectPrompt = (
		promptTemplate: string,
		promptType: 'summary' | 'continuation' | 'rewrite' | 'ideas'
	) => {
		// Füge den aktuellen Dokumenteninhalt zum Prompt hinzu, wenn vorhanden
		let fullPrompt = promptTemplate;

		if (
			documentContent &&
			(promptTemplate.includes('folgenden Text') || promptTemplate.includes('Thema'))
		) {
			// Wenn es um Textfortsetzung, Zusammenfassung oder Umformulierung geht,
			// füge den aktuellen Dokumenteninhalt hinzu
			fullPrompt += documentContent;
		} else if (documentTitle) {
			// Ansonsten füge nur den Titel als Thema hinzu
			fullPrompt += documentTitle;
		}

		setSelectedPrompt(fullPrompt);
		setSelectedPromptType(promptType);
		setShowPromptEditor(true);
	};

	const handleGeneratedText = (
		text: string,
		model: string,
		insertionMode:
			| 'insert_at_cursor'
			| 'create_new_document'
			| 'replace_document'
			| 'insert_at_beginning'
			| 'insert_at_end'
	) => {
		// Text speichern und dann entsprechend verarbeiten
		setGeneratedText(text);

		switch (insertionMode) {
			case 'create_new_document':
				// Neue Version des Dokuments erstellen
				handleCreateNewVersion(model, text);
				break;
			case 'replace_document':
				// Dokument ersetzen (gesamten Inhalt ersetzen)
				handleReplaceDocument(text);
				break;
			case 'insert_at_beginning':
				// Am Anfang des Dokuments einfügen
				handleInsertAtBeginning(text);
				break;
			case 'insert_at_end':
				// Am Ende des Dokuments einfügen
				handleInsertAtEnd(text);
				break;
			case 'insert_at_cursor':
			default:
				// An der Cursor-Position einfügen (Standard)
				handleInsertIntoCurrentDocument(text);
				break;
		}

		setShowPromptEditor(false);
	};

	// Text an der Cursor-Position einfügen (Standard)
	const handleInsertIntoCurrentDocument = (text: string = generatedText) => {
		onInsertText(text);
		onClose();
	};

	// Text am Anfang des Dokuments einfügen
	const handleInsertAtBeginning = (text: string = generatedText) => {
		// Wir fügen einen speziellen Marker hinzu, der in der DocumentScreen-Komponente
		// erkannt wird, um den Text am Anfang einzufügen
		onInsertText(`__INSERT_AT_BEGINNING__${text}`);
		onClose();
	};

	// Text am Ende des Dokuments einfügen
	const handleInsertAtEnd = (text: string = generatedText) => {
		// Wir fügen einen speziellen Marker hinzu, der in der DocumentScreen-Komponente
		// erkannt wird, um den Text am Ende einzufügen
		onInsertText(`__INSERT_AT_END__${text}`);
		onClose();
	};

	// Dokument ersetzen (gesamten Inhalt ersetzen)
	const handleReplaceDocument = (text: string = generatedText) => {
		// Wir fügen einen speziellen Marker hinzu, der in der DocumentScreen-Komponente
		// erkannt wird, um den gesamten Inhalt zu ersetzen
		onInsertText(`__REPLACE_DOCUMENT__${text}`);
		onClose();
	};

	const handleCreateNewVersion = async (
		model: string = availableModels[0]?.value || 'gpt-4.1',
		text: string = generatedText
	) => {
		if (!documentId) {
			Alert.alert(
				'Fehler',
				'Das Dokument muss zuerst gespeichert werden, bevor eine neue Version erstellt werden kann.',
				[{ text: 'OK', onPress: () => setShowOptionsModal(false) }]
			);
			return;
		}

		setIsCreatingVersion(true);

		try {
			// Verwende das übergebene Modell oder das erste verfügbare als Fallback

			console.log('Erstelle neue Version mit Text:', text);

			const { data, error } = await createDocumentVersion(
				documentId,
				text, // Verwende den direkt übergebenen Text
				selectedPromptType,
				model,
				selectedPrompt
			);

			if (error) {
				Alert.alert('Fehler', `Fehler beim Erstellen der neuen Version: ${error}`);
			} else if (data) {
				// Erfolgsmeldung anzeigen
				Alert.alert('Erfolg', 'Neue Dokumentversion wurde erstellt!', [{ text: 'OK' }]);

				// Callback aufrufen, wenn vorhanden
				if (onVersionCreated) {
					onVersionCreated(data.id);
				}
			}
		} catch (error) {
			console.error('Fehler beim Erstellen der neuen Version:', error);
			Alert.alert('Fehler', 'Ein unerwarteter Fehler ist aufgetreten.');
		} finally {
			setIsCreatingVersion(false);
			setShowOptionsModal(false);
			onClose();
		}
	};

	return (
		<Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
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
							shadowColor: isDark ? colors.gray[900] : colors.gray[400],
						},
						showPromptEditor ? styles.modalContentLarge : {},
					]}
				>
					{!showPromptEditor ? (
						<>
							<View
								style={[
									styles.header,
									{
										borderBottomColor: isDark ? colors.gray[700] : colors.gray[200],
										borderBottomWidth: 1,
										paddingBottom: 12,
									},
								]}
							>
								<Text
									variant="h2"
									style={[
										styles.title,
										{ color: isDark ? colors.gray[100] : colors.gray[900], fontWeight: '600' },
									]}
								>
									KI-Assistent
								</Text>
								<TouchableOpacity
									onPress={onClose}
									style={[
										styles.closeButton,
										{
											backgroundColor: isDark ? colors.gray[700] : colors.gray[200],
											borderRadius: 20,
										},
									]}
								>
									<Ionicons
										name="close"
										size={20}
										color={isDark ? colors.gray[100] : colors.gray[900]}
									/>
								</TouchableOpacity>
							</View>

							<Text
								style={[
									styles.subtitle,
									{ color: isDark ? colors.gray[300] : colors.gray[700], marginTop: 8 },
								]}
							>
								Was möchtest du tun?
							</Text>

							<ScrollView style={styles.promptList}>
								{predefinedPrompts.map((item, index) => (
									<TouchableOpacity
										key={index}
										style={[
											styles.promptItem,
											{
												backgroundColor: isDark ? colors.gray[700] : colors.gray[100],
												borderColor: isDark ? colors.gray[600] : colors.gray[300],
											},
										]}
										onPress={() =>
											handleSelectPrompt(
												item.prompt,
												item.type as 'summary' | 'continuation' | 'rewrite' | 'ideas'
											)
										}
									>
										<Ionicons
											name={item.icon as any}
											size={24}
											color={isDark ? colors.accent[400] : colors.accent[600]}
											style={styles.promptIcon}
										/>
										<View style={styles.promptTextContainer}>
											<Text
												style={[
													styles.promptTitle,
													{ color: isDark ? colors.gray[100] : colors.gray[900] },
												]}
											>
												{item.title}
											</Text>
											<Text
												style={[
													styles.promptDescription,
													{ color: isDark ? colors.gray[400] : colors.gray[600] },
												]}
											>
												{item.prompt.split('\n\n')[0]}
											</Text>
										</View>
										<Ionicons
											name="chevron-forward"
											size={20}
											color={isDark ? colors.gray[400] : colors.gray[500]}
										/>
									</TouchableOpacity>
								))}
							</ScrollView>

							<TouchableOpacity
								onPress={() => {
									setSelectedPrompt('');
									setShowPromptEditor(true);
								}}
								style={[
									styles.customPromptButton,
									{ backgroundColor: isDark ? colors.primary[600] : colors.primary[500] },
								]}
							>
								<View style={styles.buttonContent}>
									<Ionicons
										name="create-outline"
										size={18}
										color="#ffffff"
										style={styles.buttonIcon}
									/>
									<Text style={styles.buttonText}>Eigenen Prompt eingeben</Text>
								</View>
							</TouchableOpacity>
						</>
					) : (
						<PromptEditor
							modelOptions={availableModels}
							onGeneratedText={handleGeneratedText}
							onClose={() => setShowPromptEditor(false)}
							initialPrompt={selectedPrompt}
							documentId={documentId}
						/>
					)}
				</View>
			</View>

			{/* Das Options-Modal wird nicht mehr benötigt, da die Auswahl direkt im PromptEditor erfolgt */}
		</Modal>
	);
};

const styles = StyleSheet.create({
	modalContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContent: {
		width: '90%',
		maxWidth: 500,
		maxHeight: '80%',
		borderRadius: 12,
		padding: 20,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 5,
		borderWidth: 1,
	},
	modalContentLarge: {
		width: '95%',
		maxWidth: 800,
		maxHeight: '90%',
	},
	optionsModalContent: {
		width: '90%',
		maxWidth: 400,
		borderRadius: 12,
		padding: 20,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 5,
		borderWidth: 1,
	},
	optionsContainer: {
		marginTop: 8,
	},
	optionButton: {
		paddingVertical: 12,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 16,
	},
	title: {
		flex: 1,
		fontSize: 20,
	},
	closeButton: {
		padding: 6,
		alignItems: 'center',
		justifyContent: 'center',
		width: 32,
		height: 32,
	},
	subtitle: {
		fontSize: 16,
		marginBottom: 16,
		fontWeight: '500',
	},
	promptList: {
		marginBottom: 20,
	},
	promptItem: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 16,
		borderRadius: 8,
		marginBottom: 10,
		borderWidth: 1,
	},
	promptIcon: {
		marginRight: 16,
	},
	promptTextContainer: {
		flex: 1,
	},
	promptTitle: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 4,
	},
	promptDescription: {
		fontSize: 14,
	},
	customPromptButton: {
		marginTop: 8,
		paddingVertical: 12,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
	},
	buttonContent: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	buttonIcon: {
		marginRight: 8,
	},
	buttonText: {
		color: '#ffffff',
		fontWeight: '600',
		fontSize: 16,
	},
});
