import React, { useState, useEffect, useMemo } from 'react';
import {
	View,
	StyleSheet,
	Modal,
	TouchableOpacity,
	ScrollView,
	Alert,
	TextInput,
	ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '~/components/ui/Text';
import { Card } from '~/components/ui/Card';
import { Button } from '~/components/Button';
import { useTheme, useThemeClasses, twMerge } from '~/utils/theme';
import { createDocument } from '~/services/supabaseService';

type VariantCreatorProps = {
	visible: boolean;
	onClose: () => void;
	documentContent: string;
	documentTitle?: string;
	documentId?: string;
	spaceId: string;
	onVariantCreated?: (newDocumentId: string) => void;
};

type VariantOption = {
	original: string;
	selected: string;
	allOptions: string[];
	position: {
		start: number;
		end: number;
	};
};

export const VariantCreator: React.FC<VariantCreatorProps> = ({
	visible,
	onClose,
	documentContent = '',
	documentTitle = '',
	documentId = '',
	spaceId,
	onVariantCreated,
}) => {
	const [variantOptions, setVariantOptions] = useState<VariantOption[]>([]);
	const [previewContent, setPreviewContent] = useState(documentContent);
	const [isCreatingVariant, setIsCreatingVariant] = useState(false);
	const [showPreview, setShowPreview] = useState(false);
	const { mode, themeName, colors } = useTheme();
	const themeClasses = useThemeClasses();
	const isDark = mode === 'dark';

	// Varianten aus dem Dokument extrahieren
	useEffect(() => {
		if (visible && documentContent) {
			// Extrahiere Varianten aus dem Markdown-Text
			const extractedVariants = extractVariantsFromMarkdown(documentContent);

			// Initialisiere mit den gefundenen Varianten
			setVariantOptions(extractedVariants);

			setPreviewContent(documentContent);
		}
	}, [visible, documentContent]);

	// Extrahiere Varianten aus dem Markdown-Text
	const extractVariantsFromMarkdown = (text: string): VariantOption[] => {
		const variants: VariantOption[] = [];

		// Suche nach Varianten in eckigen Klammern mit Kommas als Trennzeichen
		// Format: [Option1, Option2, Option3]
		const variantRegex = /\[(.*?)\]/g;
		let match;

		while ((match = variantRegex.exec(text)) !== null) {
			const fullMatch = match[0]; // z.B. "[Heilbronn, München, Hamburg]"
			const optionsString = match[1]; // z.B. "Heilbronn, München, Hamburg"
			const options = optionsString.split(',').map((option) => option.trim());

			if (options.length > 0) {
				variants.push({
					original: fullMatch,
					selected: options[0], // Die erste Option ist standardmäßig ausgewählt
					allOptions: options,
					position: {
						start: match.index,
						end: match.index + fullMatch.length,
					},
				});
			}
		}

		return variants;
	};

	// Aktualisiere die ausgewählte Option für eine Variante
	const updateSelectedOption = (index: number, selected: string) => {
		const updatedOptions = [...variantOptions];
		updatedOptions[index] = {
			...updatedOptions[index],
			selected,
		};
		setVariantOptions(updatedOptions);

		// Aktualisiere die Vorschau
		updatePreview(updatedOptions);
	};

	// Aktualisiere die Vorschau mit den ausgewählten Varianten
	const updatePreview = (options: VariantOption[] = variantOptions) => {
		let updatedContent = documentContent;

		// Sortiere die Varianten nach Position (von hinten nach vorne),
		// damit die Indizes nicht durcheinander kommen, wenn wir Text ersetzen
		const sortedOptions = [...options].sort((a, b) => b.position.start - a.position.start);

		// Ersetze alle Varianten mit der ausgewählten Option
		sortedOptions.forEach(({ original, selected, position }) => {
			updatedContent =
				updatedContent.substring(0, position.start) +
				selected +
				updatedContent.substring(position.end);
		});

		setPreviewContent(updatedContent);
	};

	// Erstelle eine neue Variante des Dokuments
	const createVariant = async () => {
		if (!documentId) {
			Alert.alert(
				'Fehler',
				'Das Dokument muss zuerst gespeichert werden, bevor eine Variante erstellt werden kann.',
				[{ text: 'OK' }]
			);
			return;
		}

		// Prüfe, ob mindestens eine Variante definiert wurde
		if (variantOptions.length === 0) {
			Alert.alert(
				'Hinweis',
				'Keine Varianten im Dokument gefunden. Bitte fügen Sie Varianten im Format [Option1, Option2, Option3] hinzu.',
				[{ text: 'OK' }]
			);
			return;
		}

		setIsCreatingVariant(true);

		try {
			// Erstelle einen neuen Titel basierend auf den Varianten
			let variantTitle = documentTitle || 'Unbenanntes Dokument';
			const variantSummary = variantOptions.map((vo) => vo.selected).join(', ');

			if (variantSummary) {
				variantTitle += ` (Variante: ${variantSummary})`;
			}

			// Erstelle das neue Dokument
			const { data, error } = await createDocument(
				previewContent,
				'text', // Verwende den Typ 'text' für Varianten (früher 'generated')
				spaceId,
				{
					title: variantTitle,
					metadata: {
						variantOf: documentId,
						variants: variantOptions.map((vo) => ({
							original: vo.original,
							selected: vo.selected,
							allOptions: vo.allOptions,
						})),
					},
				}
			);

			if (error) {
				Alert.alert('Fehler', `Fehler beim Erstellen der Variante: ${error}`);
			} else if (data) {
				// Erfolgsmeldung anzeigen
				Alert.alert('Erfolg', 'Neue Dokumentvariante wurde erstellt!', [{ text: 'OK' }]);

				// Callback aufrufen, wenn vorhanden
				if (onVariantCreated) {
					onVariantCreated(data.id);
				}
			}
		} catch (error) {
			console.error('Fehler beim Erstellen der Variante:', error);
			Alert.alert('Fehler', 'Ein unerwarteter Fehler ist aufgetreten.');
		} finally {
			setIsCreatingVariant(false);
			onClose();
		}
	};

	// Füge eine neue Variante zum Dokument hinzu
	const addVariantToDocument = () => {
		Alert.alert(
			'Variante hinzufügen',
			'Fügen Sie eine Variante im Format [Option1, Option2, Option3] direkt im Dokument hinzu und öffnen Sie den Varianten-Editor erneut.',
			[{ text: 'OK' }]
		);
	};

	// Generiere alle möglichen Kombinationen von Varianten
	const generateAllCombinations = () => {
		if (variantOptions.length === 0) {
			Alert.alert('Hinweis', 'Keine Varianten im Dokument gefunden.');
			return;
		}

		Alert.alert(
			'Alle Kombinationen generieren',
			`Dies wird ${calculateTotalCombinations()} Dokumente erstellen. Fortfahren?`,
			[
				{ text: 'Abbrechen', style: 'cancel' },
				{ text: 'Fortfahren', onPress: createAllCombinations },
			]
		);
	};

	// Berechne die Gesamtzahl der möglichen Kombinationen
	const calculateTotalCombinations = (): number => {
		return variantOptions.reduce((total, variant) => total * variant.allOptions.length, 1);
	};

	// Erstelle alle möglichen Kombinationen von Varianten
	const createAllCombinations = async () => {
		setIsCreatingVariant(true);

		try {
			// Implementierung würde hier alle Kombinationen erstellen
			// Dies ist eine vereinfachte Version, die nur eine Meldung anzeigt
			Alert.alert(
				'Information',
				'Diese Funktion wird in einer zukünftigen Version implementiert.',
				[{ text: 'OK' }]
			);
		} catch (error) {
			console.error('Fehler beim Erstellen der Kombinationen:', error);
			Alert.alert('Fehler', 'Ein unerwarteter Fehler ist aufgetreten.');
		} finally {
			setIsCreatingVariant(false);
		}
	};

	return (
		<Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
			<View
				style={[
					styles.modalContainer,
					{ backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)' },
				]}
			>
				<Card
					className={twMerge('p-0 rounded-lg w-full max-w-xl', isDark ? 'bg-gray-800' : 'bg-white')}
					style={styles.modalContent}
				>
					{/* Header */}
					<View
						className={twMerge(
							'flex-row justify-between items-center p-4 border-b',
							isDark ? 'border-gray-700' : 'border-gray-200'
						)}
					>
						<View className="flex-row items-center">
							<Ionicons
								name="git-branch-outline"
								size={24}
								color={isDark ? colors.gray[300] : colors.gray[700]}
							/>
							<Text className="text-xl font-semibold ml-2">Dokumentvariante erstellen</Text>
						</View>
						<TouchableOpacity onPress={onClose}>
							<Ionicons
								name="close-outline"
								size={28}
								color={isDark ? colors.gray[300] : colors.gray[700]}
							/>
						</TouchableOpacity>
					</View>

					{/* Content */}
					<ScrollView className="p-4">
						<Text className="text-base mb-2">
							Erstellen Sie eine Variante dieses Dokuments, indem Sie bestimmte Wörter ersetzen.
						</Text>

						{/* Schlüsselwörter und Ersetzungen */}
						<View className="mb-4">
							<Text className="text-lg font-semibold mb-2">Gefundene Varianten</Text>

							{variantOptions.length === 0 ? (
								<View>
									<Text className="italic mb-4">Keine Varianten gefunden.</Text>
									<Text className="mb-2">
										Fügen Sie Varianten im Format [Option1, Option2, Option3] in Ihrem Dokument
										hinzu.
									</Text>
									<Text className="mb-4">
										Beispiel: "Neckar fließt vorbei, Reben grünen am Hügel, [Heilbronn, München,
										Hamburg] blüht im Licht."
									</Text>
								</View>
							) : (
								variantOptions.map((vo, index) => (
									<View
										key={index}
										className="mb-4 p-3 border rounded-md"
										style={{ borderColor: isDark ? '#4b5563' : '#d1d5db' }}
									>
										<Text className="font-semibold mb-2">
											Variante {index + 1}: {vo.original}
										</Text>

										<Text className="mb-2">Wählen Sie eine Option:</Text>

										{vo.allOptions.map((option, optionIndex) => (
											<TouchableOpacity
												key={optionIndex}
												onPress={() => updateSelectedOption(index, option)}
												className={twMerge(
													'flex-row items-center p-2 rounded-md mb-1',
													vo.selected === option
														? isDark
															? 'bg-indigo-700'
															: 'bg-indigo-100'
														: isDark
															? 'bg-gray-700'
															: 'bg-gray-100'
												)}
											>
												<Ionicons
													name={vo.selected === option ? 'radio-button-on' : 'radio-button-off'}
													size={20}
													color={isDark ? colors.gray[300] : colors.gray[700]}
												/>
												<Text
													className={twMerge(
														'ml-2',
														vo.selected === option
															? isDark
																? 'text-white font-semibold'
																: 'text-indigo-800 font-semibold'
															: ''
													)}
												>
													{option}
												</Text>
											</TouchableOpacity>
										))}
									</View>
								))
							)}

							{/* Button zum Hinzufügen einer neuen Variante */}
							<TouchableOpacity
								onPress={addVariantToDocument}
								className={twMerge(
									'flex-row items-center justify-center p-2 rounded-md mt-2 mb-4',
									isDark ? 'bg-gray-700' : 'bg-gray-200'
								)}
							>
								<Ionicons
									name="add-outline"
									size={20}
									color={isDark ? colors.gray[300] : colors.gray[700]}
								/>
								<Text className="ml-2">Variante zum Dokument hinzufügen</Text>
							</TouchableOpacity>

							{/* Button zum Generieren aller Kombinationen */}
							{variantOptions.length > 1 && (
								<TouchableOpacity
									onPress={generateAllCombinations}
									className={twMerge(
										'flex-row items-center justify-center p-2 rounded-md mb-4',
										isDark ? 'bg-purple-700' : 'bg-purple-100'
									)}
								>
									<Ionicons
										name="git-network-outline"
										size={20}
										color={isDark ? colors.gray[300] : colors.gray[700]}
									/>
									<Text className={twMerge('ml-2', isDark ? 'text-white' : 'text-purple-800')}>
										Alle Kombinationen generieren ({calculateTotalCombinations()})
									</Text>
								</TouchableOpacity>
							)}
						</View>

						{/* Vorschau-Toggle */}
						<TouchableOpacity
							onPress={() => setShowPreview(!showPreview)}
							className={twMerge(
								'flex-row items-center p-2 rounded-md mb-4',
								isDark ? 'bg-gray-700' : 'bg-gray-100'
							)}
						>
							<Ionicons
								name={showPreview ? 'eye-outline' : 'eye-off-outline'}
								size={20}
								color={isDark ? colors.gray[300] : colors.gray[700]}
							/>
							<Text className="ml-2">
								{showPreview ? 'Vorschau ausblenden' : 'Vorschau anzeigen'}
							</Text>
						</TouchableOpacity>

						{/* Vorschau */}
						{showPreview && (
							<View
								className={twMerge(
									'border p-4 rounded-md mb-4',
									isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'
								)}
							>
								<Text className="text-lg font-semibold mb-2">Vorschau</Text>
								<ScrollView style={{ maxHeight: 200 }}>
									<Text>{previewContent}</Text>
								</ScrollView>
							</View>
						)}
					</ScrollView>

					{/* Footer */}
					<View
						className={twMerge(
							'flex-row justify-end items-center p-4 border-t',
							isDark ? 'border-gray-700' : 'border-gray-200'
						)}
					>
						<TouchableOpacity
							onPress={onClose}
							className={twMerge(
								'flex-row items-center justify-center p-2 rounded-md mr-2',
								isDark ? 'bg-gray-700' : 'bg-gray-200'
							)}
						>
							<Text>Abbrechen</Text>
						</TouchableOpacity>

						<TouchableOpacity
							onPress={createVariant}
							disabled={isCreatingVariant}
							className={twMerge(
								'flex-row items-center justify-center p-2 rounded-md',
								isDark ? 'bg-indigo-600' : 'bg-indigo-500',
								isCreatingVariant ? 'opacity-50' : 'opacity-100'
							)}
						>
							{isCreatingVariant ? (
								<ActivityIndicator size="small" color="#ffffff" />
							) : (
								<Text className="text-white">Variante erstellen</Text>
							)}
						</TouchableOpacity>
					</View>
				</Card>
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	modalContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 16,
	},
	modalContent: {
		width: '100%',
		maxWidth: 600,
		maxHeight: '90%',
	},
});
