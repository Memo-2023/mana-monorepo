/**
 * SM-2 Spaced Repetition Algorithm Implementation
 * Based on the SuperMemo 2 algorithm
 * https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 */

export interface SM2Result {
  interval: number; // Days until next review
  repetitions: number; // Number of consecutive correct responses
  easeFactor: number; // Difficulty factor (min 1.3)
  nextReviewDate: Date;
}

export interface ReviewQuality {
  quality: 0 | 1 | 2 | 3 | 4 | 5; // 0-2: incorrect, 3-5: correct
}

/**
 * Calculate next review using SM-2 algorithm
 *
 * @param quality - Quality of recall (0-5)
 *   5 - perfect response
 *   4 - correct response after hesitation
 *   3 - correct response recalled with serious difficulty
 *   2 - incorrect response; where the correct one seemed easy to recall
 *   1 - incorrect response; the correct one remembered
 *   0 - complete blackout
 * @param repetitions - Number of consecutive correct responses
 * @param previousInterval - Previous interval in days
 * @param previousEaseFactor - Previous ease factor (min 1.3)
 */
export function calculateSM2(
  quality: number,
  repetitions: number,
  previousInterval: number,
  previousEaseFactor: number
): SM2Result {
  let interval = previousInterval;
  let easeFactor = previousEaseFactor;
  let reps = repetitions;

  // Ensure quality is within bounds
  quality = Math.max(0, Math.min(5, quality));

  // Calculate new ease factor
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  // Ease factor should not be less than 1.3
  easeFactor = Math.max(1.3, easeFactor);

  if (quality < 3) {
    // Incorrect response - reset
    reps = 0;
    interval = 1; // Review again tomorrow
  } else {
    // Correct response
    if (reps === 0) {
      // First correct response
      interval = 1;
    } else if (reps === 1) {
      // Second correct response
      interval = 6;
    } else {
      // Subsequent correct responses
      interval = Math.round(interval * easeFactor);
    }
    reps += 1;
  }

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);
  nextReviewDate.setHours(4, 0, 0, 0); // Set to 4 AM for next day reviews

  return {
    interval,
    repetitions: reps,
    easeFactor,
    nextReviewDate,
  };
}

/**
 * Convert difficulty rating to SM-2 quality score
 */
export function difficultyToQuality(difficulty: 'easy' | 'medium' | 'hard' | 'again'): number {
  switch (difficulty) {
    case 'easy':
      return 5; // Perfect recall
    case 'medium':
      return 4; // Good recall with hesitation
    case 'hard':
      return 3; // Difficult but correct
    case 'again':
      return 1; // Incorrect, need to review again
    default:
      return 3;
  }
}

/**
 * Calculate review statistics
 */
export function calculateReviewStats(
  totalReviews: number,
  correctReviews: number,
  easeFactor: number
): {
  accuracy: number;
  difficulty: 'easy' | 'medium' | 'hard';
  masteryLevel: number;
} {
  const accuracy = totalReviews > 0 ? (correctReviews / totalReviews) * 100 : 0;

  // Determine difficulty based on ease factor
  let difficulty: 'easy' | 'medium' | 'hard';
  if (easeFactor >= 2.5) {
    difficulty = 'easy';
  } else if (easeFactor >= 2.0) {
    difficulty = 'medium';
  } else {
    difficulty = 'hard';
  }

  // Calculate mastery level (0-100)
  // Based on accuracy and ease factor
  const masteryLevel = Math.min(
    100,
    Math.round(accuracy * 0.6 + ((easeFactor - 1.3) / (2.8 - 1.3)) * 40)
  );

  return {
    accuracy,
    difficulty,
    masteryLevel,
  };
}

/**
 * Determine if a card is due for review
 */
export function isCardDue(nextReviewDate: Date | string): boolean {
  const reviewDate = typeof nextReviewDate === 'string' ? new Date(nextReviewDate) : nextReviewDate;

  const now = new Date();
  now.setHours(23, 59, 59, 999); // End of today

  return reviewDate <= now;
}

/**
 * Get cards organized by review status
 */
export interface ReviewQueue {
  new: string[]; // Card IDs that are new
  learning: string[]; // Cards being learned (interval < 10 days)
  review: string[]; // Cards due for review
  total: number;
}

export function organizeReviewQueue(
  cards: {
    id: string;
    status: 'new' | 'learning' | 'review' | 'relearning';
    next_review_date: string;
    interval: number;
  }[]
): ReviewQueue {
  const queue: ReviewQueue = {
    new: [],
    learning: [],
    review: [],
    total: 0,
  };

  const now = new Date();

  cards.forEach((card) => {
    if (card.status === 'new') {
      queue.new.push(card.id);
    } else if (card.interval < 10 || card.status === 'learning' || card.status === 'relearning') {
      if (isCardDue(card.next_review_date)) {
        queue.learning.push(card.id);
      }
    } else if (isCardDue(card.next_review_date)) {
      queue.review.push(card.id);
    }
  });

  queue.total = queue.new.length + queue.learning.length + queue.review.length;

  return queue;
}

/**
 * Format interval for display
 */
export function formatInterval(days: number): string {
  if (days === 0) {
    return 'Heute';
  } else if (days === 1) {
    return 'Morgen';
  } else if (days < 7) {
    return `In ${days} Tagen`;
  } else if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? 'In 1 Woche' : `In ${weeks} Wochen`;
  } else if (days < 365) {
    const months = Math.floor(days / 30);
    return months === 1 ? 'In 1 Monat' : `In ${months} Monaten`;
  } else {
    const years = Math.floor(days / 365);
    return years === 1 ? 'In 1 Jahr' : `In ${years} Jahren`;
  }
}
