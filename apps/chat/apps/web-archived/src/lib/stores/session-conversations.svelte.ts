/**
 * Session Conversations Store - Manages conversations in sessionStorage for guest users
 * This allows users to try the app without signing in.
 * Data is stored in sessionStorage (lost when tab closes).
 */

import type { Conversation, Message } from '@chat/types';

const CONVERSATIONS_KEY = 'chat-session-conversations';
const MESSAGES_KEY = 'chat-session-messages';

// State
let conversations = $state<Conversation[]>([]);
let messages = $state<Record<string, Message[]>>({});

// Generate session ID
function generateSessionId(): string {
	return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Load from sessionStorage
function loadFromStorage(): void {
	if (typeof window === 'undefined') return;

	try {
		const storedConversations = sessionStorage.getItem(CONVERSATIONS_KEY);
		if (storedConversations) {
			conversations = JSON.parse(storedConversations);
		}

		const storedMessages = sessionStorage.getItem(MESSAGES_KEY);
		if (storedMessages) {
			messages = JSON.parse(storedMessages);
		}
	} catch (e) {
		console.error('Failed to load session conversations:', e);
	}
}

// Save to sessionStorage
function saveToStorage(): void {
	if (typeof window === 'undefined') return;

	try {
		sessionStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
		sessionStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
	} catch (e) {
		console.error('Failed to save session conversations:', e);
	}
}

// Initialize on load
if (typeof window !== 'undefined') {
	loadFromStorage();
}

export const sessionConversationsStore = {
	// Getters
	get conversations() {
		return conversations;
	},

	/**
	 * Get messages for a conversation
	 */
	getMessages(conversationId: string): Message[] {
		return messages[conversationId] || [];
	},

	/**
	 * Create a new session conversation
	 */
	createConversation(data: { modelId: string; templateId?: string; title?: string }): Conversation {
		const now = new Date().toISOString();
		const conversation: Conversation = {
			id: generateSessionId(),
			userId: 'guest',
			modelId: data.modelId,
			templateId: data.templateId,
			conversationMode: 'free',
			documentMode: false,
			title: data.title || 'Neue Unterhaltung',
			isArchived: false,
			isPinned: false,
			createdAt: now,
			updatedAt: now,
		};

		conversations = [conversation, ...conversations];
		messages[conversation.id] = [];
		saveToStorage();

		return conversation;
	},

	/**
	 * Add a message to a conversation
	 */
	addMessage(
		conversationId: string,
		data: {
			sender: 'user' | 'assistant' | 'system';
			messageText: string;
		}
	): Message {
		const now = new Date().toISOString();
		const message: Message = {
			id: generateSessionId(),
			conversationId,
			sender: data.sender,
			messageText: data.messageText,
			createdAt: now,
		};

		if (!messages[conversationId]) {
			messages[conversationId] = [];
		}
		messages[conversationId] = [...messages[conversationId], message];

		// Update conversation timestamp
		conversations = conversations.map((c) =>
			c.id === conversationId ? { ...c, updatedAt: now } : c
		);

		saveToStorage();
		return message;
	},

	/**
	 * Update a conversation
	 */
	updateConversation(id: string, updates: Partial<Conversation>): void {
		conversations = conversations.map((c) =>
			c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
		);
		saveToStorage();
	},

	/**
	 * Delete a conversation
	 */
	deleteConversation(id: string): void {
		conversations = conversations.filter((c) => c.id !== id);
		delete messages[id];
		saveToStorage();
	},

	/**
	 * Check if ID is a session conversation
	 */
	isSessionConversation(id: string): boolean {
		return id.startsWith('session_');
	},

	/**
	 * Get all conversations for migration
	 */
	getAllConversations(): { conversations: Conversation[]; messages: Record<string, Message[]> } {
		return {
			conversations: [...conversations],
			messages: { ...messages },
		};
	},

	/**
	 * Clear all session data
	 */
	clear(): void {
		conversations = [];
		messages = {};
		if (typeof window !== 'undefined') {
			sessionStorage.removeItem(CONVERSATIONS_KEY);
			sessionStorage.removeItem(MESSAGES_KEY);
		}
	},

	/**
	 * Get count of session conversations
	 */
	get count(): number {
		return conversations.length;
	},
};
