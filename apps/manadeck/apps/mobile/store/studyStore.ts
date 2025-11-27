import { create } from 'zustand';
import { Card } from './cardStore';
import { apiClient } from '../services/apiClient';
import { authService } from '../services/authService';
import { calculateSM2, difficultyToQuality, isCardDue } from '../utils/spacedRepetition';
import { useAuthStore } from './authStore';

export interface StudySession {
  id: string;
  deck_id: string;
  user_id: string;
  started_at: string;
  ended_at?: string;
  total_cards: number;
  completed_cards: number;
  correct_answers: number;
  mode: 'all' | 'new' | 'review' | 'favorites' | 'random';
}

export interface CardProgress {
  id?: string;
  user_id: string;
  card_id: string;
  deck_id: string;
  ease_factor: number;
  interval: number;
  repetitions: number;
  next_review_date: string;
  last_reviewed_at?: string;
  total_reviews: number;
  correct_reviews: number;
  incorrect_reviews: number;
  status: 'new' | 'learning' | 'review' | 'relearning';
}

export interface SessionCardProgress {
  card_id: string;
  session_id: string;
  answered_at: string;
  is_correct: boolean;
  time_spent: number;
  difficulty?: 'easy' | 'medium' | 'hard' | 'again';
}

// Map backend camelCase to frontend snake_case
function mapProgressFromApi(apiProgress: any): CardProgress {
  return {
    id: apiProgress.id,
    user_id: apiProgress.userId,
    card_id: apiProgress.cardId,
    deck_id: apiProgress.deckId || '',
    ease_factor: apiProgress.easeFactor,
    interval: apiProgress.interval,
    repetitions: apiProgress.repetitions,
    next_review_date: apiProgress.nextReview,
    last_reviewed_at: apiProgress.lastReviewed,
    total_reviews: apiProgress.repetitions || 0,
    correct_reviews: 0, // Not tracked in new schema
    incorrect_reviews: 0, // Not tracked in new schema
    status: apiProgress.status || 'new',
  };
}

function mapSessionFromApi(apiSession: any): StudySession {
  return {
    id: apiSession.id,
    deck_id: apiSession.deckId,
    user_id: apiSession.userId,
    started_at: apiSession.startedAt,
    ended_at: apiSession.endedAt,
    total_cards: apiSession.totalCards,
    completed_cards: apiSession.completedCards,
    correct_answers: apiSession.correctCards,
    mode: 'all', // Mode not tracked in new schema
  };
}

interface StudyState {
  // Current session
  currentSession: StudySession | null;
  sessionCards: Card[];
  currentCardIndex: number;
  cardProgressMap: Map<string, CardProgress>;
  sessionProgress: SessionCardProgress[];

  // UI state
  isFlipped: boolean;
  selectedAnswer: number | null;
  showFeedback: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  startSession: (deckId: string, mode: StudySession['mode']) => Promise<void>;
  endSession: () => Promise<void>;
  nextCard: () => void;
  previousCard: () => void;

  // Card interactions
  flipCard: () => void;
  selectAnswer: (answerIndex: number) => void;
  submitAnswer: (
    isCorrect: boolean,
    difficulty?: 'easy' | 'medium' | 'hard' | 'again'
  ) => Promise<void>;

  // Progress management
  fetchCardProgress: (deckId: string) => Promise<void>;
  updateCardProgress: (cardId: string, quality: number) => Promise<void>;

  // Utility
  resetState: () => void;
  clearError: () => void;
}

export const useStudyStore = create<StudyState>((set, get) => ({
  // Initial state
  currentSession: null,
  sessionCards: [],
  currentCardIndex: 0,
  cardProgressMap: new Map(),
  sessionProgress: [],
  isFlipped: false,
  selectedAnswer: null,
  showFeedback: false,
  isLoading: false,
  error: null,

  fetchCardProgress: async (deckId: string) => {
    try {
      const response = await apiClient.getCardProgressByDeck(deckId);

      if (response.error) {
        if (response.error.includes('Session expired')) {
          await authService.clearAuthStorage();
          useAuthStore.setState({ user: null });
          throw new Error('Session expired. Please sign in again.');
        }
        throw new Error(response.error);
      }

      const progressMap = new Map<string, CardProgress>();
      response.data?.progress?.forEach((progress: any) => {
        const mapped = mapProgressFromApi(progress);
        progressMap.set(mapped.card_id, mapped);
      });

      set({ cardProgressMap: progressMap });
    } catch (error) {
      console.error('Error fetching card progress:', error);
    }
  },

  startSession: async (deckId: string, mode: StudySession['mode'] = 'all') => {
    try {
      set({ isLoading: true, error: null });

      // Get current user ID from token
      const appToken = await authService.getAppToken();
      const user = appToken ? authService.getUserFromToken(appToken) : null;

      if (!user) throw new Error('Not authenticated');

      // Fetch card progress first
      await get().fetchCardProgress(deckId);

      // Get cards from cardStore
      const { useCardStore } = await import('./cardStore');
      const cardStore = useCardStore.getState();
      await cardStore.fetchCards(deckId);

      let cards = [...cardStore.cards];
      const progressMap = get().cardProgressMap;

      // Filter cards based on mode
      switch (mode) {
        case 'new':
          // Only cards that haven't been studied yet
          cards = cards.filter((card) => {
            const progress = progressMap.get(card.id);
            return !progress || progress.status === 'new';
          });
          break;

        case 'review':
          // Only cards due for review
          cards = cards.filter((card) => {
            const progress = progressMap.get(card.id);
            return progress && progress.status !== 'new' && isCardDue(progress.next_review_date);
          });
          // Sort by most overdue first
          cards.sort((a, b) => {
            const progressA = progressMap.get(a.id);
            const progressB = progressMap.get(b.id);
            if (!progressA || !progressB) return 0;
            return (
              new Date(progressA.next_review_date).getTime() -
              new Date(progressB.next_review_date).getTime()
            );
          });
          break;

        case 'favorites':
          cards = cards.filter((card) => card.is_favorite);
          break;

        case 'random':
          cards = cards.sort(() => Math.random() - 0.5);
          break;

        default:
          // 'all' mode - keep cards in order
          break;
      }

      if (cards.length === 0) {
        throw new Error('Keine Karten zum Lernen gefunden');
      }

      // Create session via API
      const response = await apiClient.createStudySession({
        deckId,
        totalCards: cards.length,
        completedCards: 0,
        correctCards: 0,
      });

      if (response.error) {
        if (response.error.includes('Session expired')) {
          await authService.clearAuthStorage();
          throw new Error('Session expired. Please sign in again.');
        }
        throw new Error(response.error);
      }

      const session = mapSessionFromApi(response.data?.session);

      set({
        currentSession: session,
        sessionCards: cards,
        currentCardIndex: 0,
        sessionProgress: [],
        isFlipped: false,
        selectedAnswer: null,
        showFeedback: false,
      });
    } catch (error: any) {
      set({ error: error.message || 'Fehler beim Starten der Lernsession' });
      console.error('Error starting study session:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  updateCardProgress: async (cardId: string, quality: number) => {
    try {
      const appToken = await authService.getAppToken();
      const user = appToken ? authService.getUserFromToken(appToken) : null;
      if (!user) return;

      const progressMap = get().cardProgressMap;
      const existingProgress = progressMap.get(cardId);
      const currentCard = get().sessionCards.find((c) => c.id === cardId);
      if (!currentCard) return;

      let newProgress: Partial<CardProgress>;

      if (!existingProgress) {
        // First time studying this card
        const sm2Result = calculateSM2(quality, 0, 0, 2.5);

        newProgress = {
          user_id: user.id,
          card_id: cardId,
          deck_id: currentCard.deck_id,
          ease_factor: sm2Result.easeFactor,
          interval: sm2Result.interval,
          repetitions: sm2Result.repetitions,
          next_review_date: sm2Result.nextReviewDate.toISOString(),
          last_reviewed_at: new Date().toISOString(),
          total_reviews: 1,
          correct_reviews: quality >= 3 ? 1 : 0,
          incorrect_reviews: quality < 3 ? 1 : 0,
          status: sm2Result.interval < 10 ? 'learning' : 'review',
        };
      } else {
        // Update existing progress
        const sm2Result = calculateSM2(
          quality,
          existingProgress.repetitions,
          existingProgress.interval,
          existingProgress.ease_factor
        );

        let newStatus = existingProgress.status;
        if (quality < 3 && existingProgress.status === 'review') {
          newStatus = 'relearning';
        } else if (
          sm2Result.interval >= 10 &&
          (existingProgress.status === 'learning' || existingProgress.status === 'new')
        ) {
          newStatus = 'review';
        }

        newProgress = {
          ...existingProgress,
          ease_factor: sm2Result.easeFactor,
          interval: sm2Result.interval,
          repetitions: sm2Result.repetitions,
          next_review_date: sm2Result.nextReviewDate.toISOString(),
          last_reviewed_at: new Date().toISOString(),
          total_reviews: existingProgress.total_reviews + 1,
          correct_reviews: existingProgress.correct_reviews + (quality >= 3 ? 1 : 0),
          incorrect_reviews: existingProgress.incorrect_reviews + (quality < 3 ? 1 : 0),
          status: newStatus,
        };
      }

      // Update via API (uses upsert)
      const response = await apiClient.upsertCardProgress({
        cardId,
        easeFactor: newProgress.ease_factor,
        interval: newProgress.interval,
        repetitions: newProgress.repetitions,
        lastReviewed: newProgress.last_reviewed_at,
        nextReview: newProgress.next_review_date,
        status: newProgress.status === 'relearning' ? 'learning' : newProgress.status,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Update local state
      progressMap.set(cardId, newProgress as CardProgress);
      set({ cardProgressMap: new Map(progressMap) });
    } catch (error) {
      console.error('Error updating card progress:', error);
    }
  },

  endSession: async () => {
    const { currentSession, sessionProgress } = get();
    if (!currentSession) return;

    try {
      set({ isLoading: true });

      // Calculate session statistics
      const correctAnswers = sessionProgress.filter((p) => p.is_correct).length;

      // Update session via API
      const response = await apiClient.updateStudySession(currentSession.id, {
        endedAt: new Date().toISOString(),
        completedCards: sessionProgress.length,
        correctCards: correctAnswers,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Keep the session data for the summary screen
      set({
        currentSession: {
          ...currentSession,
          ended_at: new Date().toISOString(),
          completed_cards: sessionProgress.length,
          correct_answers: correctAnswers,
        },
      });
    } catch (error: any) {
      set({ error: error.message || 'Fehler beim Beenden der Lernsession' });
    } finally {
      set({ isLoading: false });
    }
  },

  nextCard: () => {
    const { currentCardIndex, sessionCards } = get();
    if (currentCardIndex < sessionCards.length - 1) {
      set({
        currentCardIndex: currentCardIndex + 1,
        isFlipped: false,
        selectedAnswer: null,
        showFeedback: false,
      });
    }
  },

  previousCard: () => {
    const { currentCardIndex } = get();
    if (currentCardIndex > 0) {
      set({
        currentCardIndex: currentCardIndex - 1,
        isFlipped: false,
        selectedAnswer: null,
        showFeedback: false,
      });
    }
  },

  flipCard: () => {
    set({ isFlipped: !get().isFlipped });
  },

  selectAnswer: (answerIndex: number) => {
    const { showFeedback } = get();
    if (!showFeedback) {
      set({ selectedAnswer: answerIndex });
    }
  },

  submitAnswer: async (isCorrect: boolean, difficulty?: 'easy' | 'medium' | 'hard' | 'again') => {
    const { currentSession, sessionCards, currentCardIndex, sessionProgress } = get();
    if (!currentSession || !sessionCards[currentCardIndex]) return;

    const card = sessionCards[currentCardIndex];

    // Create session progress entry
    const progress: SessionCardProgress = {
      card_id: card.id,
      session_id: currentSession.id,
      answered_at: new Date().toISOString(),
      is_correct: isCorrect,
      time_spent: 0, // TODO: Implement time tracking
      difficulty,
    };

    // Update card progress with spaced repetition
    if (difficulty) {
      const quality = difficultyToQuality(difficulty);
      await get().updateCardProgress(card.id, quality);
    } else if (card.card_type === 'quiz') {
      // For quiz cards, use binary correct/incorrect
      const quality = isCorrect ? 4 : 1;
      await get().updateCardProgress(card.id, quality);
    }

    set({
      sessionProgress: [...sessionProgress, progress],
      showFeedback: true,
    });

    // Auto-advance after feedback for certain card types
    if (card.card_type === 'flashcard') {
      setTimeout(() => {
        const state = get();
        if (state.currentCardIndex < state.sessionCards.length - 1) {
          state.nextCard();
        }
      }, 1500);
    }
  },

  resetState: () => {
    set({
      currentSession: null,
      sessionCards: [],
      currentCardIndex: 0,
      cardProgressMap: new Map(),
      sessionProgress: [],
      isFlipped: false,
      selectedAnswer: null,
      showFeedback: false,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));
