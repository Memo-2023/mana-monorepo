import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Icon } from '~/components/ui/Icon';
import {
  useCardStore,
  Card,
  TextContent,
  FlashcardContent,
  QuizContent,
} from '../../store/cardStore';
import { useDeckStore } from '../../store/deckStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card as UICard } from '../../components/ui/Card';
import { CardTypeSelector } from '../../components/card/CardTypeSelector';
import { CardView } from '../../components/card/CardView';
import { SmartCardCreator } from '../../components/ai/SmartCardCreator';
import { useAIStore } from '../../store/aiStore';
import { useThemeColors } from '~/utils/themeUtils';
import { spacing } from '~/utils/spacing';

export default function CreateCardScreen() {
  const colors = useThemeColors();
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const { createCard, isLoading } = useCardStore();
  const { currentDeck, fetchDeck } = useDeckStore();

  // Form state
  const [cardType, setCardType] = useState<'text' | 'flashcard' | 'quiz' | 'mixed'>('text');
  const [title, setTitle] = useState('');
  const [step, setStep] = useState<'type' | 'content' | 'preview'>('type');
  const [creationMode, setCreationMode] = useState<'manual' | 'ai'>('manual');

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
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (deckId && !currentDeck) {
      fetchDeck(deckId);
    }
  }, [deckId]);

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

  const getPreviewCard = (): Card => ({
    id: 'preview',
    deck_id: deckId || '',
    position: 1,
    title: title || undefined,
    content: getCardContent(),
    card_type: cardType,
    version: 1,
    is_favorite: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const handleNext = () => {
    if (step === 'type') {
      setStep('content');
    } else if (step === 'content') {
      if (validateContent()) {
        setStep('preview');
      }
    }
  };

  const handleCreate = async (createAnother = false) => {
    if (!validateContent() || !deckId) return;

    try {
      setIsCreating(true);

      await createCard(deckId, {
        title: title || undefined,
        content: getCardContent(),
        card_type: cardType,
      });

      if (createAnother) {
        // Reset form for next card
        setTitle('');
        setTextContent('');
        setFlashcardFront('');
        setFlashcardBack('');
        setFlashcardHint('');
        setQuizQuestion('');
        setQuizOptions(['', '']);
        setQuizCorrectAnswer(0);
        setQuizExplanation('');
        setStep('content');
        setErrors({});
      } else {
        // Go back to deck
        router.back();
      }
    } catch (error: any) {
      Alert.alert('Fehler', error.message || 'Karte konnte nicht erstellt werden');
    } finally {
      setIsCreating(false);
    }
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

  const renderTypeStep = () => (
    <>
      {/* Creation Mode Selector */}
      <UICard padding="lg" variant="elevated" className="mb-4">
        <Text style={{ marginBottom: spacing.content.title, fontSize: 18, fontWeight: '600', color: colors.foreground }}>
          Wie möchtest du Karten erstellen?
        </Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable
            onPress={() => setCreationMode('manual')}
            style={({ pressed }) => [
              {
                flex: 1,
                borderRadius: 8,
                borderWidth: 2,
                borderColor: creationMode === 'manual' ? colors.primary : colors.border,
                backgroundColor: creationMode === 'manual' ? colors.surfaceElevated : colors.surface,
                padding: 16,
                opacity: pressed ? 0.7 : 1,
              },
            ]}>
            <View style={{ alignItems: 'center' }}>
              <Icon
                name="create-outline"
                size={32}
                color={creationMode === 'manual' ? colors.primary : colors.mutedForeground}
                library="Ionicons"
              />
              <Text
                style={{
                  marginTop: 8,
                  fontWeight: '500',
                  color: creationMode === 'manual' ? colors.primary : colors.foreground,
                }}>
                Manuell
              </Text>
              <Text style={{ marginTop: 4, textAlign: 'center', fontSize: 12, color: colors.mutedForeground }}>
                Karten selbst erstellen
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => setCreationMode('ai')}
            style={({ pressed }) => [
              {
                flex: 1,
                borderRadius: 8,
                borderWidth: 2,
                borderColor: creationMode === 'ai' ? colors.primary : colors.border,
                backgroundColor: creationMode === 'ai' ? colors.surfaceElevated : colors.surface,
                padding: 16,
                opacity: pressed ? 0.7 : 1,
              },
            ]}>
            <View style={{ alignItems: 'center' }}>
              <Icon
                name="sparkles"
                size={32}
                color={creationMode === 'ai' ? colors.primary : colors.mutedForeground}
                library="Ionicons"
              />
              <Text
                style={{
                  marginTop: 8,
                  fontWeight: '500',
                  color: creationMode === 'ai' ? colors.primary : colors.foreground,
                }}>
                KI-Assistent
              </Text>
              <Text style={{ marginTop: 4, textAlign: 'center', fontSize: 12, color: colors.mutedForeground }}>Mit KI generieren</Text>
            </View>
          </Pressable>
        </View>
      </UICard>

      {creationMode === 'manual' && (
        <UICard padding="lg" variant="elevated">
          <Text style={{ marginBottom: spacing.content.title, fontSize: 18, fontWeight: '600', color: colors.foreground }}>
            Welchen Kartentyp möchtest du erstellen?
          </Text>
          <CardTypeSelector selectedType={cardType} onTypeChange={setCardType} layout="grid" />
        </UICard>
      )}
    </>
  );

  const renderContentStep = () => (
    <UICard padding="lg" variant="elevated">
      <Text style={{ marginBottom: 16, fontSize: 18, fontWeight: '600', color: colors.foreground }}>Karten-Inhalt erstellen</Text>

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

          <Text style={{ marginBottom: spacing.sm, fontSize: 14, fontWeight: '500', color: colors.foreground }}>
            Antwortoptionen
            {errors.quizOptions && <Text style={{ color: '#EF4444' }}> - {errors.quizOptions}</Text>}
          </Text>

          {quizOptions.map((option, index) => (
            <View key={index} style={{ marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center' }}>
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
                  <Icon name="trash-outline" size={20} color="#EF4444" library="Ionicons" />
                </Button>
              )}
            </View>
          ))}

          {quizOptions.length < 6 && (
            <Button
              onPress={addQuizOption}
              variant="outline"
              size="sm"
              leftIcon={<Icon name="add" library="Ionicons" size={16} color="#374151" />}
              className="mb-4">
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
      <Text style={{ marginBottom: 16, fontSize: 18, fontWeight: '600', color: colors.foreground }}>Vorschau</Text>
      <CardView card={getPreviewCard()} mode="preview" />
    </UICard>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title:
            step === 'type'
              ? 'Kartentyp wählen'
              : step === 'content'
                ? 'Inhalt erstellen'
                : 'Vorschau',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.foreground,
          headerLeft: () => (
            <Icon
              name="close"
              size={24}
              color={colors.foreground}
              onPress={() => router.back()}
              style={{ marginLeft: 10 }}
              library="Ionicons"
            />
          ),
        }}
      />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}>
          {/* Progress Indicator */}
          <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surfaceElevated, paddingHorizontal: 16, paddingVertical: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  marginRight: 8,
                  height: 32,
                  width: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 16,
                  backgroundColor: step === 'type' ? colors.primary : '#10B981',
                }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#FFFFFF' }}>1</Text>
              </View>
              <View
                style={{
                  marginHorizontal: 8,
                  height: 4,
                  flex: 1,
                  backgroundColor: step === 'content' || step === 'preview' ? '#10B981' : colors.border,
                }}
              />
              <View
                style={{
                  marginRight: 8,
                  height: 32,
                  width: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 16,
                  backgroundColor: step === 'content' ? colors.primary : step === 'preview' ? '#10B981' : colors.border,
                }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: step === 'content' || step === 'preview' ? '#FFFFFF' : colors.mutedForeground,
                  }}>
                  2
                </Text>
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
                }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: step === 'preview' ? '#FFFFFF' : colors.mutedForeground,
                  }}>
                  3
                </Text>
              </View>
            </View>
          </View>

          <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
            <View style={{ paddingHorizontal: spacing.container.horizontal, paddingVertical: spacing.container.vertical }}>
              {step === 'type' && renderTypeStep()}
              {step === 'content' && creationMode === 'manual' && renderContentStep()}
              {step === 'content' && creationMode === 'ai' && (
                <SmartCardCreator deckId={deckId || ''} onCardsCreated={() => router.back()} />
              )}
              {step === 'preview' && renderPreviewStep()}

              {/* Navigation Buttons */}
              <View style={{ marginTop: 24, gap: 12 }}>
                {step === 'type' && (
                  <Button onPress={handleNext} fullWidth size="lg">
                    {creationMode === 'ai' ? 'KI-Assistent starten' : 'Weiter'}
                  </Button>
                )}

                {step === 'content' && creationMode === 'manual' && (
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Button onPress={() => setStep('type')} variant="outline" fullWidth size="lg">
                        Zurück
                      </Button>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button onPress={handleNext} fullWidth size="lg">
                        Vorschau
                      </Button>
                    </View>
                  </View>
                )}

                {step === 'preview' && (
                  <View style={{ gap: spacing.content.small }}>
                    <Button
                      onPress={() => setStep('content')}
                      variant="outline"
                      fullWidth
                      size="lg">
                      Bearbeiten
                    </Button>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Button
                          onPress={() => handleCreate(false)}
                          loading={isCreating}
                          variant="primary"
                          fullWidth
                          size="lg">
                          Erstellen
                        </Button>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Button
                          onPress={() => handleCreate(true)}
                          loading={isCreating}
                          variant="secondary"
                          fullWidth
                          size="lg">
                          Erstellen & Neue
                        </Button>
                      </View>
                    </View>
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
