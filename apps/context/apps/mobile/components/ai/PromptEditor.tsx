import React, { useState } from 'react';
import {
	View,
	TextInput,
	ActivityIndicator,
	StyleSheet,
	TouchableOpacity,
	ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '~/components/ui/Text';
import { Button } from '~/components/Button';
import { Card } from '~/components/ui/Card';
import { LoadingScreen } from '~/components/ui/LoadingScreen';
import { generateText, AIModelOption, AIProvider, getProviderForModel } from '~/services/aiService';
import { useTheme, useThemeClasses, twMerge } from '~/utils/theme';

// Definiert die verschiedenen Aktionen, die nach der Textgenerierung möglich sind
type TextInsertionMode =
	| 'insert_at_cursor' // An der Cursor-Position einfügen (Standard)
	| 'create_new_document' // Neues Dokument erstellen
	| 'replace_document' // Dokument ersetzen
	| 'insert_at_beginning' // Am Anfang einfügen
	| 'insert_at_end'; // Am Ende einfügen

type PromptEditorProps = {
	onGeneratedText: (text: string, model: string, insertionMode: TextInsertionMode) => void;
	onClose?: () => void;
	modelOptions: AIModelOption[];
	initialPrompt?: string;
	documentId?: string;
};

export const PromptEditor: React.FC<PromptEditorProps> = ({
	onGeneratedText,
	onClose,
	modelOptions,
	initialPrompt = '',
	documentId,
}) => {
	const [prompt, setPrompt] = useState(initialPrompt);
	const [selectedModel, setSelectedModel] = useState(modelOptions[0]?.value || '');
	const [insertionMode, setInsertionMode] = useState<TextInsertionMode>('insert_at_cursor');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { mode, colors } = useTheme();
	const themeClasses = useThemeClasses();
	const isDark = mode === 'dark';

	const handleGenerate = async () => {
		if (!prompt.trim()) return;

		setLoading(true);
		setError(null);

		try {
			// Bestimme den Provider basierend auf dem ausgewählten Modell
			const provider = getProviderForModel(selectedModel);

			const result = await generateText(prompt, provider, {
				model: selectedModel,
				temperature: 0.7,
				maxTokens: 1000,
			});

			if (onGeneratedText) {
				onGeneratedText(result.text, selectedModel, insertionMode);
			}
		} catch (err: any) {
			setError(err.message || 'Fehler bei der Textgenerierung');
		} finally {
			setLoading(false);
		}
	};

	return (
		<View
			style={[
				styles.container,
				{
					backgroundColor: isDark ? colors.gray[800] : colors.gray[50],
					borderColor: isDark ? colors.gray[700] : colors.gray[200],
					flex: 1,
					height: '100%',
				},
			]}
		>
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
					variant="h3"
					style={[
						styles.title,
						{ color: isDark ? colors.gray[100] : colors.gray[900], fontWeight: '600' },
					]}
				>
					KI-Textgenerierung
				</Text>
				{onClose && (
					<TouchableOpacity
						onPress={onClose}
						style={[
							styles.closeButton,
							{ backgroundColor: isDark ? colors.gray[700] : colors.gray[200], borderRadius: 20 },
						]}
					>
						<Ionicons name="close" size={20} color={isDark ? colors.gray[100] : colors.gray[900]} />
					</TouchableOpacity>
				)}
			</View>

			<View style={styles.inputContainer}>
				<Text style={[styles.inputLabel, { color: isDark ? colors.gray[300] : colors.gray[700] }]}>
					Prompt:
				</Text>
				<TextInput
					style={[
						styles.promptInput,
						{
							backgroundColor: isDark ? colors.gray[700] : colors.gray[100],
							color: isDark ? colors.gray[100] : colors.gray[900],
							borderColor: isDark ? colors.gray[600] : colors.gray[300],
						},
					]}
					multiline
					placeholder="Beschreibe, welchen Text die KI generieren soll..."
					placeholderTextColor={isDark ? colors.gray[400] : colors.gray[500]}
					value={prompt}
					onChangeText={setPrompt}
					textAlignVertical="top"
				/>
			</View>

			{/* Modellauswahl */}
			<View style={styles.modelSelector}>
				<Text style={[styles.inputLabel, { color: isDark ? colors.gray[300] : colors.gray[700] }]}>
					Modell auswählen:
				</Text>
				<View style={styles.modelButtons}>
					{modelOptions.map((model) => (
						<TouchableOpacity
							key={model.value}
							style={[
								styles.modelButton,
								{
									backgroundColor: isDark ? colors.gray[700] : colors.gray[100],
									borderColor: isDark ? colors.gray[600] : colors.gray[300],
								},
								selectedModel === model.value
									? {
											backgroundColor: isDark ? colors.primary[600] : colors.primary[500],
											borderColor: isDark ? colors.primary[500] : colors.primary[400],
										}
									: {},
							]}
							onPress={() => setSelectedModel(model.value)}
						>
							<Text
								style={[
									styles.modelButtonText,
									{ color: isDark ? colors.gray[300] : colors.gray[700] },
									selectedModel === model.value ? { color: '#ffffff' } : {},
								]}
							>
								{model.label}
							</Text>
						</TouchableOpacity>
					))}
				</View>
			</View>

			{documentId && (
				<View style={styles.optionsContainer}>
					<Text
						style={[
							styles.inputLabel,
							{ color: isDark ? colors.gray[300] : colors.gray[700], marginBottom: 8 },
						]}
					>
						Nach der Generierung:
					</Text>

					{/* Optionen für die Texteinfügung */}
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						style={styles.optionsScrollView}
					>
						<TouchableOpacity
							style={[
								styles.optionButton,
								insertionMode === 'insert_at_cursor' && {
									backgroundColor: isDark ? colors.primary[700] : colors.primary[100],
									borderColor: isDark ? colors.primary[600] : colors.primary[400],
								},
							]}
							onPress={() => setInsertionMode('insert_at_cursor')}
						>
							<View style={styles.buttonContent}>
								<Ionicons
									name="create-outline"
									size={16}
									color={isDark ? colors.gray[200] : colors.gray[800]}
									style={styles.buttonIcon}
								/>
								<Text
									style={[
										styles.optionButtonText,
										{ color: isDark ? colors.gray[200] : colors.gray[800] },
									]}
								>
									An Cursor einfügen
								</Text>
							</View>
						</TouchableOpacity>

						<TouchableOpacity
							style={[
								styles.optionButton,
								insertionMode === 'insert_at_beginning' && {
									backgroundColor: isDark ? colors.primary[700] : colors.primary[100],
									borderColor: isDark ? colors.primary[600] : colors.primary[400],
								},
							]}
							onPress={() => setInsertionMode('insert_at_beginning')}
						>
							<View style={styles.buttonContent}>
								<Ionicons
									name="arrow-up-outline"
									size={16}
									color={isDark ? colors.gray[200] : colors.gray[800]}
									style={styles.buttonIcon}
								/>
								<Text
									style={[
										styles.optionButtonText,
										{ color: isDark ? colors.gray[200] : colors.gray[800] },
									]}
								>
									Am Anfang einfügen
								</Text>
							</View>
						</TouchableOpacity>

						<TouchableOpacity
							style={[
								styles.optionButton,
								insertionMode === 'insert_at_end' && {
									backgroundColor: isDark ? colors.primary[700] : colors.primary[100],
									borderColor: isDark ? colors.primary[600] : colors.primary[400],
								},
							]}
							onPress={() => setInsertionMode('insert_at_end')}
						>
							<View style={styles.buttonContent}>
								<Ionicons
									name="arrow-down-outline"
									size={16}
									color={isDark ? colors.gray[200] : colors.gray[800]}
									style={styles.buttonIcon}
								/>
								<Text
									style={[
										styles.optionButtonText,
										{ color: isDark ? colors.gray[200] : colors.gray[800] },
									]}
								>
									Am Ende einfügen
								</Text>
							</View>
						</TouchableOpacity>

						<TouchableOpacity
							style={[
								styles.optionButton,
								insertionMode === 'replace_document' && {
									backgroundColor: isDark ? colors.warning[700] : colors.warning[100],
									borderColor: isDark ? colors.warning[600] : colors.warning[400],
								},
							]}
							onPress={() => setInsertionMode('replace_document')}
						>
							<View style={styles.buttonContent}>
								<Ionicons
									name="refresh-outline"
									size={16}
									color={isDark ? colors.gray[200] : colors.gray[800]}
									style={styles.buttonIcon}
								/>
								<Text
									style={[
										styles.optionButtonText,
										{ color: isDark ? colors.gray[200] : colors.gray[800] },
									]}
								>
									Dokument ersetzen
								</Text>
							</View>
						</TouchableOpacity>

						<TouchableOpacity
							style={[
								styles.optionButton,
								insertionMode === 'create_new_document' && {
									backgroundColor: isDark ? colors.accent[700] : colors.accent[100],
									borderColor: isDark ? colors.accent[600] : colors.accent[400],
								},
							]}
							onPress={() => setInsertionMode('create_new_document')}
						>
							<View style={styles.buttonContent}>
								<Ionicons
									name="copy-outline"
									size={16}
									color={isDark ? colors.gray[200] : colors.gray[800]}
									style={styles.buttonIcon}
								/>
								<Text
									style={[
										styles.optionButtonText,
										{ color: isDark ? colors.gray[200] : colors.gray[800] },
									]}
								>
									Neue Version erstellen
								</Text>
							</View>
						</TouchableOpacity>
					</ScrollView>
				</View>
			)}

			<View style={styles.buttonContainer}>
				<TouchableOpacity
					style={[
						styles.generateButton,
						{
							backgroundColor: isDark ? colors.primary[600] : colors.primary[500],
							opacity: loading ? 0.7 : 1,
						},
					]}
					onPress={handleGenerate}
					disabled={loading || !prompt.trim()}
				>
					<View style={styles.buttonContent}>
						{loading ? (
							<ActivityIndicator color="#ffffff" style={styles.buttonIcon} />
						) : (
							<Ionicons name="flash-outline" size={18} color="#ffffff" style={styles.buttonIcon} />
						)}
						<Text style={styles.buttonText}>{loading ? 'Generiere...' : 'Generieren'}</Text>
					</View>
				</TouchableOpacity>
			</View>

			<LoadingScreen
				visible={loading}
				title="KI generiert Text"
				message="Die KI verarbeitet Ihren Prompt und generiert einen Text. Dies kann je nach Länge und Komplexität des Prompts einige Sekunden dauern."
				icon={{
					name: 'flash-outline',
					color: isDark ? colors.primary[400] : colors.primary[500],
				}}
			/>

			{error && (
				<View
					style={[
						styles.errorContainer,
						{
							backgroundColor: isDark ? colors.error[900] : colors.error[100],
							borderLeftWidth: 4,
							borderLeftColor: isDark ? colors.error[700] : colors.error[500],
						},
					]}
				>
					<Ionicons
						name="alert-circle"
						size={20}
						color={isDark ? colors.error[400] : colors.error[600]}
					/>
					<Text style={[styles.error, { color: isDark ? colors.error[400] : colors.error[700] }]}>
						{error}
					</Text>
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		padding: 20,
		flex: 1,
		width: '100%',
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 16,
	},
	title: {
		flex: 1,
		fontSize: 18,
	},
	closeButton: {
		padding: 6,
		alignItems: 'center',
		justifyContent: 'center',
		width: 32,
		height: 32,
	},
	inputContainer: {
		marginBottom: 16,
		flex: 1,
	},
	inputLabel: {
		fontSize: 14,
		fontWeight: '500',
		marginBottom: 6,
	},
	promptInput: {
		borderWidth: 1,
		borderRadius: 8,
		padding: 12,
		minHeight: 250,
		height: '80%',
		fontSize: 16,
		lineHeight: 24,
	},
	modelSelector: {
		marginBottom: 20,
	},
	modelButtons: {
		flexDirection: 'row',
		flexWrap: 'wrap',
	},
	modelButton: {
		paddingVertical: 10,
		paddingHorizontal: 14,
		borderRadius: 8,
		marginRight: 10,
		marginBottom: 10,
		borderWidth: 1,
	},
	modelButtonText: {
		fontWeight: '500',
		fontSize: 14,
	},
	generateButton: {
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
		fontWeight: '500',
		fontSize: 16,
	},
	buttonContainer: {
		marginTop: 16,
	},
	optionsContainer: {
		marginBottom: 16,
	},
	optionsScrollView: {
		flexGrow: 0,
		marginBottom: 8,
	},
	optionButton: {
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 8,
		borderWidth: 1,
		marginRight: 8,
		backgroundColor: 'transparent',
		minWidth: 140,
	},
	optionButtonText: {
		fontWeight: '500',
		fontSize: 14,
	},
	loaderContainer: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 12,
	},
	loaderText: {
		marginTop: 12,
		fontWeight: '500',
		fontSize: 16,
	},
	errorContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 14,
		borderRadius: 8,
		marginTop: 16,
	},
	error: {
		marginLeft: 10,
		flex: 1,
		fontWeight: '500',
	},
});
