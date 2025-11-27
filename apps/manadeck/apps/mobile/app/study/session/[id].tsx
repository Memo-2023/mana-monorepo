import React, { useEffect, useState } from 'react';
import { View, Pressable, Alert } from 'react-native';
import { Text } from '../../../components/ui/Text';

import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Icon } from '../../../components/ui/Icon';
import { useStudyStore } from '../../../store/studyStore';
import { useDeckStore } from '../../../store/deckStore';
import { CardView } from '../../../components/card/CardView';
import { Button } from '../../../components/ui/Button';
import { Card as UICard } from '../../../components/ui/Card';
import { QuizContent } from '../../../store/cardStore';
import { useThemeColors } from '../../../utils/themeUtils';

export default function StudySessionScreen() {
  const { id: deckId } = useLocalSearchParams<{ id: string }>();
  const {
    currentSession,
    sessionCards,
    currentCardIndex,
    isFlipped,
    selectedAnswer,
    showFeedback,
    startSession,
    endSession,
    nextCard,
    flipCard,
    selectAnswer,
    submitAnswer,
    isLoading,
  } = useStudyStore();
  const { fetchDeck, currentDeck } = useDeckStore();
  const colors = useThemeColors();

  const [sessionStarted, setSessionStarted] = useState(false);

  useEffect(() => {
    if (deckId && !sessionStarted) {
      // Fetch deck info
      fetchDeck(deckId);
      // Start study session
      startSession(deckId, 'all');
      setSessionStarted(true);
    }
  }, [deckId]);

  const handleEndSession = () => {
    Alert.alert('Session beenden', 'Möchtest du die Lernsession wirklich beenden?', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Beenden',
        style: 'destructive',
        onPress: async () => {
          await endSession();
          router.push(`/study/summary/${deckId}`);
        },
      },
    ]);
  };

  const handleQuizSubmit = () => {
    if (selectedAnswer === null) return;

    const currentCard = sessionCards[currentCardIndex];
    const quizContent = currentCard.content as QuizContent;
    const isCorrect = selectedAnswer === quizContent.correct_answer;

    submitAnswer(isCorrect);
  };

  const handleFlashcardRate = (difficulty: 'easy' | 'medium' | 'hard' | 'again') => {
    // For flashcards, we consider medium and easy as correct, hard and again as incorrect
    const isCorrect = difficulty !== 'hard' && difficulty !== 'again';
    submitAnswer(isCorrect, difficulty);
  };

  const handleTextCardNext = () => {
    // Text cards are always "correct" as they're just for reading
    submitAnswer(true);
    if (currentCardIndex < sessionCards.length - 1) {
      nextCard();
    } else {
      router.push(`/study/summary/${deckId}`);
    }
  };

  if (isLoading || !currentSession || sessionCards.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <Text style={{ color: colors.mutedForeground }}>Lernsession wird vorbereitet...</Text>
      </View>
    );
  }

  const currentCard = sessionCards[currentCardIndex];
  const progress = ((currentCardIndex + 1) / sessionCards.length) * 100;
  const isLastCard = currentCardIndex === sessionCards.length - 1;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: currentDeck?.title || 'Lernsession',
          headerLeft: () => (
            <Pressable
              onPress={handleEndSession}
              style={({ pressed }) => pressed && { opacity: 0.7 }}>
              <Icon
                name="close"
                size={24}
                color={colors.foreground}
                style={{ marginLeft: 10 }}
                library="Ionicons"
              />
            </Pressable>
          ),
          headerRight: () => (
            <View style={{ marginRight: 16, flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontWeight: '500', color: colors.foreground }}>
                {currentCardIndex + 1}/{sessionCards.length}
              </Text>
            </View>
          ),
        }}
      />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Progress Bar */}
        <View style={{ height: 8, backgroundColor: colors.muted }}>
          <View style={{ height: '100%', backgroundColor: colors.primary, width: `${progress}%` }} />
        </View>

        {/* Stats Bar */}
        <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center' }}>
              <Text variant="h4" style={{ fontWeight: 'bold', color: colors.foreground }}>
                {currentSession.completed_cards}
              </Text>
              <Text variant="small" style={{ color: colors.mutedForeground }}>
                Beantwortet
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text variant="h4" style={{ fontWeight: 'bold', color: colors.primary }}>
                {currentSession.correct_answers}
              </Text>
              <Text variant="small" style={{ color: colors.mutedForeground }}>
                Richtig
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text variant="h4" style={{ fontWeight: 'bold', color: colors.foreground }}>
                {Math.round(
                  currentSession.completed_cards > 0
                    ? (currentSession.correct_answers / currentSession.completed_cards) * 100
                    : 0
                )}
                %
              </Text>
              <Text variant="small" style={{ color: colors.mutedForeground }}>
                Quote
              </Text>
            </View>
          </View>
        </View>

        {/* Card Display - Fixed position */}
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          {/* Card Container - always same aspect ratio (3:4) portrait */}
          <View style={{ width: '100%', aspectRatio: 3/4, marginTop: 24 }}>
            {currentCard.card_type === 'flashcard' ? (
              <Pressable onPress={flipCard} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1, height: '100%', width: '100%' })}>
                <CardView card={currentCard} mode="study" isFlipped={isFlipped} onFlip={flipCard} />
              </Pressable>
            ) : currentCard.card_type === 'quiz' ? (
              <CardView
                card={currentCard}
                mode="study"
                selectedAnswer={selectedAnswer}
                showFeedback={showFeedback}
                onAnswerSelect={selectAnswer}
              />
            ) : (
              <CardView card={currentCard} mode="study" />
            )}
          </View>

          {/* Spacer to push buttons to bottom */}
          <View style={{ flex: 1 }} />

          {/* Action Buttons - Fixed at bottom */}
          <View style={{ paddingBottom: spacing.container.bottom }}>
            {currentCard.card_type === 'flashcard' && (
              <>
                {!isFlipped ? (
                  <Button
                    onPress={flipCard}
                    variant="primary"
                    fullWidth
                    size="lg"
                    leftIcon={
                      <Icon name="refresh-outline" size={24} color="white" library="Ionicons" />
                    }>
                    Antwort zeigen
                  </Button>
                ) : !showFeedback ? (
                  <View>
                    <Text variant="caption" style={{ marginBottom: spacing.content.small, textAlign: 'center', color: colors.mutedForeground }}>
                      Wie gut konntest du dich erinnern?
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Button
                          onPress={() => handleFlashcardRate('again')}
                          variant="danger"
                          fullWidth
                          size="sm">
                          <View style={{ alignItems: 'center' }}>
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: 'white' }}>Nochmal</Text>
                            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>&lt; 1 min</Text>
                          </View>
                        </Button>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Button
                          onPress={() => handleFlashcardRate('hard')}
                          variant="outline"
                          fullWidth
                          size="sm">
                          <View style={{ alignItems: 'center' }}>
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.foreground }}>Schwer</Text>
                            <Text style={{ fontSize: 12, color: colors.mutedForeground }}>~6 min</Text>
                          </View>
                        </Button>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Button
                          onPress={() => handleFlashcardRate('medium')}
                          variant="secondary"
                          fullWidth
                          size="sm">
                          <View style={{ alignItems: 'center' }}>
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.foreground }}>Gut</Text>
                            <Text style={{ fontSize: 12, color: colors.mutedForeground }}>~10 min</Text>
                          </View>
                        </Button>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Button
                          onPress={() => handleFlashcardRate('easy')}
                          variant="primary"
                          fullWidth
                          size="sm">
                          <View style={{ alignItems: 'center' }}>
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: 'white' }}>Leicht</Text>
                            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>~4 Tage</Text>
                          </View>
                        </Button>
                      </View>
                    </View>
                  </View>
                ) : (
                  <Button
                    onPress={isLastCard ? () => router.push(`/study/summary/${deckId}`) : nextCard}
                    variant="primary"
                    fullWidth
                    size="lg">
                    {isLastCard ? 'Session beenden' : 'Nächste Karte'}
                  </Button>
                )}
              </>
            )}

            {currentCard.card_type === 'quiz' && (
              <>
                {!showFeedback ? (
                  <Button
                    onPress={handleQuizSubmit}
                    variant="primary"
                    fullWidth
                    size="lg"
                    disabled={selectedAnswer === null}>
                    Antwort überprüfen
                  </Button>
                ) : (
                  <Button
                    onPress={isLastCard ? () => router.push(`/study/summary/${deckId}`) : nextCard}
                    variant="primary"
                    fullWidth
                    size="lg">
                    {isLastCard ? 'Session beenden' : 'Nächste Karte'}
                  </Button>
                )}
              </>
            )}

            {currentCard.card_type === 'text' && (
              <Button onPress={handleTextCardNext} variant="primary" fullWidth size="lg">
                {isLastCard ? 'Session beenden' : 'Verstanden, weiter'}
              </Button>
            )}
          </View>

          {/* Skip Button */}
          {!showFeedback && !isLastCard && (
            <View style={{ marginTop: spacing.content.small }}>
              <Button
                onPress={nextCard}
                variant="ghost"
                fullWidth
                size="md">
                Überspringen →
              </Button>
            </View>
          )}
        </View>
      </View>
    </>
  );
}
