import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';

import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
	useCardStore,
	Card,
	TextContent,
	FlashcardContent,
	QuizContent,
} from '../../../store/cardStore';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card as UICard } from '../../../components/ui/Card';
import { CardTypeSelector } from '../../../components/card/CardTypeSelector';
import { CardView } from '../../../components/card/CardView';
import { useThemeColors } from '~/utils/themeUtils';
import { spacing } from '~/utils/spacing';

export default function EditCardScreen() {
	const colors = useThemeColors();
	const { id } = useLocalSearchParams<{ id: string }>();
	const { fetchCard, updateCard, deleteCard, currentCard, isLoading } = useCardStore();

	// Form state
	const [cardType, setCardType] = useState<'text' | 'flashcard' | 'quiz' | 'mixed'>('text');
	const [title, setTitle] = useState('');
	const [step, setStep] = useState<'content' | 'preview'>('content');

	// Content state for different card types
	const [textContent, setTextContent] = useState('');
	const [flashcardFront, setFlashcardFront] = useState('');
	const [flashcardBack, setFlashcardBack] = useState('');
	const [flashcardHint, setFlashcardHint] = useState('');
	const [quizQuestion, setQuizQuestion] = useState('');
	const [quizOptions, setQuizOptions] = useState(['', '']);
	const [quizCorrectAnswer, setQuizCorrectAnswer] = useState(0);
	const [quizExplanation, setQuizExplanation] = useState('');

	const [errors, setErrors] = useState<Record<string, string>>({});
	const [isUpdating, setIsUpdating] = useState(false);

	useEffect(() => {
		if (id) {
			fetchCard(id);
		}
	}, [id]);

	// Populate form when card is loaded
	useEffect(() => {
		if (currentCard) {
			setCardType(currentCard.card_type);
			setTitle(currentCard.title || '');

			switch (currentCard.card_type) {
				case 'text':
					const textContent = currentCard.content as TextContent;
					setTextContent(textContent.text);
					break;
				case 'flashcard':
					const flashcardContent = currentCard.content as FlashcardContent;
					setFlashcardFront(flashcardContent.front);
					setFlashcardBack(flashcardContent.back);
					setFlashcardHint(flashcardContent.hint || '');
					break;
				case 'quiz':
					const quizContent = currentCard.content as QuizContent;
					setQuizQuestion(quizContent.question);
					setQuizOptions(quizContent.options);
					setQuizCorrectAnswer(quizContent.correct_answer);
					setQuizExplanation(quizContent.explanation || '');
					break;
			}
		}
	}, [currentCard]);

	const validateContent = () => {
		const newErrors: Record<string, string> = {};

		switch (cardType) {
			case 'text':
				if (!textContent.trim()) {
					newErrors.textContent = 'Text ist erforderlich';
				}
				break;
			case 'flashcard':
				if (!flashcardFront.trim()) {
					newErrors.flashcardFront = 'Vorderseite ist erforderlich';
				}
				if (!flashcardBack.trim()) {
					newErrors.flashcardBack = 'Rückseite ist erforderlich';
				}
				break;
			case 'quiz':
				if (!quizQuestion.trim()) {
					newErrors.quizQuestion = 'Frage ist erforderlich';
				}
				if (quizOptions.filter((opt) => opt.trim()).length < 2) {
					newErrors.quizOptions = 'Mindestens 2 Antwortoptionen erforderlich';
				}
				break;
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const getCardContent = () => {
		switch (cardType) {
			case 'text':
				return { text: textContent } as TextContent;
			case 'flashcard':
				return {
					front: flashcardFront,
					back: flashcardBack,
					hint: flashcardHint || undefined,
				} as FlashcardContent;
			case 'quiz':
				return {
					question: quizQuestion,
					options: quizOptions.filter((opt) => opt.trim()),
					correct_answer: quizCorrectAnswer,
					explanation: quizExplanation || undefined,
				} as QuizContent;
			default:
				return { text: '' } as TextContent;
		}
	};

	const getPreviewCard = (): Card => {
		if (!currentCard) {
			return {
				id: 'preview',
				deck_id: '',
				position: 1,
				title: title || undefined,
				content: getCardContent(),
				card_type: cardType,
				version: 1,
				is_favorite: false,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};
		}

		return {
			...currentCard,
			title: title || undefined,
			content: getCardContent(),
			card_type: cardType,
		};
	};

	const handleNext = () => {
		if (step === 'content') {
			if (validateContent()) {
				setStep('preview');
			}
		}
	};

	const handleUpdate = async () => {
		if (!validateContent() || !currentCard) return;

		try {
			setIsUpdating(true);

			await updateCard(currentCard.id, {
				title: title || undefined,
				content: getCardContent(),
				card_type: cardType,
			});

			router.back();
		} catch (error: any) {
			Alert.alert('Fehler', error.message || 'Karte konnte nicht aktualisiert werden');
		} finally {
			setIsUpdating(false);
		}
	};

	const handleDelete = () => {
		if (!currentCard) return;

		Alert.alert(
			'Karte löschen',
			'Möchtest du diese Karte wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
			[
				{ text: 'Abbrechen', style: 'cancel' },
				{
					text: 'Löschen',
					style: 'destructive',
					onPress: async () => {
						try {
							await deleteCard(currentCard.id);
							router.back();
						} catch (error: any) {
							Alert.alert('Fehler', error.message || 'Karte konnte nicht gelöscht werden');
						}
					},
				},
			]
		);
	};

	const addQuizOption = () => {
		if (quizOptions.length < 6) {
			setQuizOptions([...quizOptions, '']);
		}
	};

	const removeQuizOption = (index: number) => {
		if (quizOptions.length > 2) {
			const newOptions = quizOptions.filter((_, i) => i !== index);
			setQuizOptions(newOptions);
			if (quizCorrectAnswer >= newOptions.length) {
				setQuizCorrectAnswer(newOptions.length - 1);
			}
		}
	};

	const updateQuizOption = (index: number, value: string) => {
		const newOptions = [...quizOptions];
		newOptions[index] = value;
		setQuizOptions(newOptions);
	};

	const renderContentStep = () => (
		<UICard padding="lg" variant="elevated">
			<View
				style={{
					marginBottom: spacing.content.title,
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'space-between',
				}}
			>
				<Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground }}>
					Karte bearbeiten
				</Text>
				<CardTypeSelector
					selectedType={cardType}
					onTypeChange={setCardType}
					compact
					showDescriptions={false}
				/>
			</View>

			<Input
				label="Titel (optional)"
				placeholder="z.B. Wichtige Formel"
				value={title}
				onChangeText={setTitle}
				leftIcon="text-outline"
				containerClassName="mb-4"
			/>

			{cardType === 'text' && (
				<Input
					label="Text"
					placeholder="Gib deinen Karteninhalt ein..."
					value={textContent}
					onChangeText={setTextContent}
					error={errors.textContent}
					leftIcon="document-text-outline"
					multiline
					numberOfLines={6}
					textAlignVertical="top"
				/>
			)}

			{cardType === 'flashcard' && (
				<>
					<Input
						label="Vorderseite (Frage)"
						placeholder="z.B. Was ist die Hauptstadt von Deutschland?"
						value={flashcardFront}
						onChangeText={setFlashcardFront}
						error={errors.flashcardFront}
						leftIcon="help-circle-outline"
						multiline
						numberOfLines={3}
						textAlignVertical="top"
						containerClassName="mb-4"
					/>
					<Input
						label="Rückseite (Antwort)"
						placeholder="z.B. Berlin"
						value={flashcardBack}
						onChangeText={setFlashcardBack}
						error={errors.flashcardBack}
						leftIcon="checkmark-circle-outline"
						multiline
						numberOfLines={3}
						textAlignVertical="top"
						containerClassName="mb-4"
					/>
					<Input
						label="Hinweis (optional)"
						placeholder="z.B. Es ist auch das größte Bundesland"
						value={flashcardHint}
						onChangeText={setFlashcardHint}
						leftIcon="bulb-outline"
						multiline
						numberOfLines={2}
						textAlignVertical="top"
					/>
				</>
			)}

			{cardType === 'quiz' && (
				<>
					<Input
						label="Frage"
						placeholder="z.B. Welche ist die richtige Antwort?"
						value={quizQuestion}
						onChangeText={setQuizQuestion}
						error={errors.quizQuestion}
						leftIcon="help-circle-outline"
						multiline
						numberOfLines={3}
						textAlignVertical="top"
						containerClassName="mb-4"
					/>

					<Text
						style={{
							marginBottom: spacing.sm,
							fontSize: 14,
							fontWeight: '500',
							color: colors.foreground,
						}}
					>
						Antwortoptionen{' '}
						{errors.quizOptions && <Text style={{ color: '#EF4444' }}>- {errors.quizOptions}</Text>}
					</Text>

					{quizOptions.map((option, index) => (
						<View
							key={index}
							style={{ marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center' }}
						>
							<View style={{ marginRight: 8, flex: 1 }}>
								<Input
									placeholder={`Option ${index + 1}`}
									value={option}
									onChangeText={(value) => updateQuizOption(index, value)}
									leftIcon={
										quizCorrectAnswer === index ? 'checkmark-circle' : 'radio-button-off-outline'
									}
									onLeftIconPress={() => setQuizCorrectAnswer(index)}
									containerClassName="mb-0"
								/>
							</View>
							{quizOptions.length > 2 && (
								<Button onPress={() => removeQuizOption(index)} variant="ghost" size="sm">
									<Ionicons name="trash-outline" size={20} color="#EF4444" />
								</Button>
							)}
						</View>
					))}

					{quizOptions.length < 6 && (
						<Button
							onPress={addQuizOption}
							variant="outline"
							size="sm"
							leftIcon={<Ionicons name="add" size={16} color="#374151" />}
							className="mb-4"
						>
							Option hinzufügen
						</Button>
					)}

					<Input
						label="Erklärung (optional)"
						placeholder="Warum ist diese Antwort richtig?"
						value={quizExplanation}
						onChangeText={setQuizExplanation}
						leftIcon="information-circle-outline"
						multiline
						numberOfLines={3}
						textAlignVertical="top"
					/>
				</>
			)}
		</UICard>
	);

	const renderPreviewStep = () => (
		<UICard padding="lg" variant="elevated">
			<Text
				style={{
					marginBottom: spacing.content.title,
					fontSize: 18,
					fontWeight: '600',
					color: colors.foreground,
				}}
			>
				Vorschau
			</Text>
			<CardView card={getPreviewCard()} mode="preview" />
		</UICard>
	);

	if (isLoading || !currentCard) {
		return (
			<View
				style={{
					flex: 1,
					alignItems: 'center',
					justifyContent: 'center',
					backgroundColor: colors.background,
				}}
			>
				<Text style={{ color: colors.mutedForeground }}>Karte wird geladen...</Text>
			</View>
		);
	}

	return (
		<>
			<Stack.Screen
				options={{
					headerShown: true,
					title: step === 'content' ? 'Karte bearbeiten' : 'Vorschau',
					headerStyle: { backgroundColor: colors.surface },
					headerTintColor: colors.foreground,
					headerLeft: () => (
						<Ionicons
							name="close"
							size={24}
							color={colors.foreground}
							onPress={() => router.back()}
							style={{ marginLeft: 10 }}
						/>
					),
					headerRight: () => (
						<Ionicons
							name="trash-outline"
							size={24}
							color="#EF4444"
							onPress={handleDelete}
							style={{ marginRight: 10 }}
						/>
					),
				}}
			/>
			<View style={{ flex: 1, backgroundColor: colors.background }}>
				<KeyboardAvoidingView
					behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
					style={{ flex: 1 }}
				>
					{/* Progress Indicator */}
					<View
						style={{
							borderBottomWidth: 1,
							borderBottomColor: colors.border,
							backgroundColor: colors.surfaceElevated,
							paddingHorizontal: 16,
							paddingVertical: 12,
						}}
					>
						<View style={{ flexDirection: 'row', alignItems: 'center' }}>
							<View
								style={{
									marginRight: 8,
									height: 32,
									width: 32,
									alignItems: 'center',
									justifyContent: 'center',
									borderRadius: 16,
									backgroundColor: step === 'content' ? colors.primary : '#10B981',
								}}
							>
								<Text style={{ fontSize: 14, fontWeight: 'bold', color: '#FFFFFF' }}>1</Text>
							</View>
							<View
								style={{
									marginHorizontal: 8,
									height: 4,
									flex: 1,
									backgroundColor: step === 'preview' ? '#10B981' : colors.border,
								}}
							/>
							<View
								style={{
									height: 32,
									width: 32,
									alignItems: 'center',
									justifyContent: 'center',
									borderRadius: 16,
									backgroundColor: step === 'preview' ? colors.primary : colors.border,
								}}
							>
								<Text
									style={{
										fontSize: 14,
										fontWeight: 'bold',
										color: step === 'preview' ? '#FFFFFF' : colors.mutedForeground,
									}}
								>
									2
								</Text>
							</View>
						</View>
					</View>

					<ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
						<View
							style={{
								paddingHorizontal: spacing.container.horizontal,
								paddingVertical: spacing.container.vertical,
							}}
						>
							{step === 'content' && renderContentStep()}
							{step === 'preview' && renderPreviewStep()}

							{/* Navigation Buttons */}
							<View style={{ marginTop: 24, gap: 12 }}>
								{step === 'content' && (
									<Button onPress={handleNext} fullWidth size="lg">
										Vorschau
									</Button>
								)}

								{step === 'preview' && (
									<View style={{ gap: spacing.content.small }}>
										<Button
											onPress={() => setStep('content')}
											variant="outline"
											fullWidth
											size="lg"
										>
											Bearbeiten
										</Button>
										<Button
											onPress={handleUpdate}
											loading={isUpdating}
											variant="primary"
											fullWidth
											size="lg"
										>
											Speichern
										</Button>
									</View>
								)}
							</View>
						</View>
					</ScrollView>
				</KeyboardAvoidingView>
			</View>
		</>
	);
}
