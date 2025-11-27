/**
 * User type for Storyteller web app
 */
export interface StorytellerUser {
	id: string;
	email: string;
	role: string;
	name?: string;
	avatar_url?: string;
}

/**
 * Credit balance
 */
export interface CreditBalance {
	credits: number;
	maxCreditLimit: number;
	userId: string;
}

/**
 * Auth state
 */
export interface AuthState {
	user: StorytellerUser | null;
	loading: boolean;
	isAuthenticated: boolean;
}
