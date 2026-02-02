import { type SessionService } from '@manacore/bot-services';

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
 * await session.set('currentConversationId', 'abc123');
 * const convId = await session.get('currentConversationId'); // string | null
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
	async set<K extends keyof T>(key: K, value: T[K]): Promise<void> {
		await this.sessionService.setSessionData(this.userId, key as string, value);
	}

	/**
	 * Get a session value
	 */
	async get<K extends keyof T>(key: K): Promise<T[K] | null> {
		return this.sessionService.getSessionData<T[K]>(this.userId, key as string);
	}

	/**
	 * Delete a session value
	 */
	async delete<K extends keyof T>(key: K): Promise<void> {
		await this.sessionService.setSessionData(this.userId, key as string, null);
	}

	/**
	 * Check if a session value exists
	 */
	async has<K extends keyof T>(key: K): Promise<boolean> {
		return (await this.get(key)) !== null;
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
	async isLoggedIn(): Promise<boolean> {
		return this.sessionService.isLoggedIn(this.userId);
	}

	/**
	 * Get JWT token for API calls
	 */
	async getToken(): Promise<string | null> {
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
