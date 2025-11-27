/**
 * API Types for Märchenzauber Web App
 */

export interface ApiError extends Error {
	error?: string;
	messageDE?: string;
	messageEN?: string;
	retryable?: boolean;
	technicalMessage?: string;
	insufficientCredits?: boolean;
	requiredCredits?: number;
	availableCredits?: number;
}

export interface CreditBalance {
	balance: number;
	maxLimit: number;
}

export interface CreditCheckResponse {
	hasEnough: boolean;
	balance: number;
	required: number;
}

export interface Creator {
	id: string;
	name: string;
	type: 'author' | 'illustrator';
	description?: string;
	style?: string;
	image_url?: string;
}

export interface UserSettings {
	id: string;
	user_id: string;
	preferred_author_id?: string;
	preferred_illustrator_id?: string;
	language: string;
	created_at: string;
	updated_at: string;
}

export interface UserStats {
	storiesCreated: number;
	charactersCreated: number;
	totalWords: number;
	favoriteStories: number;
}
