import { useState, useCallback } from 'react';
import { useRatingStore } from '../store/ratingStore';
import { useAnalytics } from '~/features/analytics';

// Milestones when to show the rating prompt
const RATING_MILESTONES = [5, 15, 50];

// Minimum days between prompts
const MIN_DAYS_BETWEEN_PROMPTS = 30;

/**
 * Calculate days between two dates
 */
function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000; // milliseconds in one day
  return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
}

/**
 * Hook to manage rating prompt eligibility and display
 */
export const useRatingPrompt = () => {
  const { track } = useAnalytics();
  const [showPromptModal, setShowPromptModal] = useState(false);

  const {
    memoCreatedCount,
    hasRatedApp,
    neverAskAgain,
    lastPromptDate,
    _hasHydrated,
  } = useRatingStore();

  /**
   * Check if we should show the rating prompt based on:
   * - Memo count milestones
   * - Previous rating status
   * - Time since last prompt
   */
  const checkShouldPrompt = useCallback((): boolean => {
    // Don't check if store hasn't hydrated yet
    if (!_hasHydrated) {
      return false;
    }

    // Don't show if user already rated
    if (hasRatedApp) {
      return false;
    }

    // Don't show if user selected "never ask again"
    if (neverAskAgain) {
      return false;
    }

    // Check if we hit a milestone
    const hitMilestone = RATING_MILESTONES.includes(memoCreatedCount);
    if (!hitMilestone) {
      return false;
    }

    // Check if enough time has passed since last prompt
    if (lastPromptDate) {
      const daysSinceLastPrompt = daysBetween(new Date(lastPromptDate), new Date());
      if (daysSinceLastPrompt < MIN_DAYS_BETWEEN_PROMPTS) {
        return false;
      }
    }

    return true;
  }, [memoCreatedCount, hasRatedApp, neverAskAgain, lastPromptDate, _hasHydrated]);

  /**
   * Trigger the rating prompt check
   * Call this after significant positive actions (e.g., memo creation)
   */
  const triggerPromptCheck = useCallback(() => {
    const shouldShow = checkShouldPrompt();

    if (shouldShow) {
      setShowPromptModal(true);
      track('rating_prompt_shown', {
        memo_count: memoCreatedCount,
        milestone: RATING_MILESTONES.find((m) => m === memoCreatedCount),
      });
    }
  }, [checkShouldPrompt, memoCreatedCount, track]);

  /**
   * Close the rating prompt modal
   */
  const closePrompt = useCallback(() => {
    setShowPromptModal(false);
  }, []);

  return {
    showPromptModal,
    triggerPromptCheck,
    closePrompt,
    isEligible: checkShouldPrompt(),
    currentMemoCount: memoCreatedCount,
  };
};
