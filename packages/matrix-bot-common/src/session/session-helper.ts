import { SessionService } from '@manacore/bot-services';

/**
 * Typed session helper for bot-specific session data
 *
 * Provides type-safe access to session data stored in SessionService.
 *
 * @example
 * ```typescript
 * interface ChatSessionData {
 *   currentConversationId: string;
 *   selectedModelId: string;
 *   conversationList: string[];
 * }
 *
 * const session = new SessionHelper<ChatSessionData>(sessionService, matrixUserId);
 * session.set('currentConversationId', 'abc123');
 * const convId = session.get('currentConversationId'); // string | null
 * ```
 */
export class SessionHelper<T extends Record<string, unknown>> {
	constructor(
		private readonly sessionService: SessionService,
		private readonly userId: string
	) {}

	/**
	 * Set a session value
	 */
	set<K extends keyof T>(key: K, value: T[K]): void {
		this.sessionService.setSessionData(this.userId, key as string, value);
	}

	/**
	 * Get a session value
	 */
	get<K extends keyof T>(key: K): T[K] | null {
		return this.sessionService.getSessionData<T[K]>(this.userId, key as string);
	}

	/**
	 * Delete a session value
	 */
	delete<K extends keyof T>(key: K): void {
		this.sessionService.setSessionData(this.userId, key as string, null);
	}

	/**
	 * Check if a session value exists
	 */
	has<K extends keyof T>(key: K): boolean {
		return this.get(key) !== null;
	}

	/**
	 * Get the underlying user ID
	 */
	getUserId(): string {
		return this.userId;
	}

	/**
	 * Check if user is logged in
	 */
	isLoggedIn(): boolean {
		return this.sessionService.isLoggedIn(this.userId);
	}

	/**
	 * Get JWT token for API calls
	 */
	getToken(): string | null {
		return this.sessionService.getToken(this.userId);
	}
}

/**
 * Factory function to create session helper
 */
export function createSessionHelper<T extends Record<string, unknown>>(
	sessionService: SessionService,
	userId: string
): SessionHelper<T> {
	return new SessionHelper<T>(sessionService, userId);
}
