/**
 * Companion Chat types.
 */

export interface LocalConversation {
	id: string;
	title: string;
	createdAt: string;
	updatedAt: string;
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
