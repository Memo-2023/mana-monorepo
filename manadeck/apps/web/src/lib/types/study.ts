export type StudyMode = 'all' | 'new' | 'review' | 'favorites' | 'random';

export interface StudySession {
	id: string;
	deck_id: string;
	user_id: string;
	mode: StudyMode;
	total_cards: number;
	completed_cards: number;
	correct_cards: number;
	started_at: string;
	completed_at?: string;
	time_spent_seconds: number;
}

export interface CardProgress {
	id: string;
	user_id: string;
	card_id: string;
	ease_factor: number;
	interval: number;
	repetitions: number;
	last_reviewed?: string;
	next_review?: string;
	status: 'new' | 'learning' | 'review' | 'relearning';
	created_at: string;
	updated_at: string;
}

export interface StudyCardResult {
	cardId: string;
	quality: 0 | 1 | 2 | 3 | 4 | 5; // SM-2 quality rating
	timeSpent: number; // seconds
}

export interface DailyProgress {
	user_id: string;
	date: string;
	cards_studied: number;
	time_spent_minutes: number;
	accuracy_percentage: number;
	decks_studied: string[];
}
