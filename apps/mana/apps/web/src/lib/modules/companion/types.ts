/**
 * Companion Chat types.
 */

export interface LocalConversation {
	id: string;
	title: string;
	createdAt: string;
	/** Real data field touched on every new message. Used as the sort key
	 *  in the conversation list so the most recently active chat floats
	 *  to the top. Replaces the older `updatedAt` reliance — F3 of the
	 *  sync-field-meta overhaul moved updatedAt off Local records. */
	lastMessageAt?: string;
	deletedAt?: string;
}

export interface LocalMessage {
	id: string;
	conversationId: string;
	role: 'user' | 'assistant' | 'system' | 'tool_result';
	content: string;
	/** Tool call info (for assistant messages that invoke a tool) */
	toolCall?: {
		name: string;
		params: Record<string, unknown>;
	};
	/** Tool result (for tool_result messages) */
	toolResult?: {
		success: boolean;
		message: string;
		data?: unknown;
	};
	createdAt: string;
}
