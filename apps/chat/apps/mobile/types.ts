/**
 * Typendefinitionen für die Chat-Anwendung
 */

// Typendefinition für ein KI-Modell
export interface Model {
	id: string;
	name: string;
	description: string;
	parameters?: {
		temperature?: number;
		max_tokens?: number;
		provider?: string;
		deployment?: string;
		endpoint?: string;
		api_version?: string;
	};
}

// Typendefinition für eine Nachricht
export interface Message {
	id: string;
	role: 'system' | 'user' | 'assistant';
	content: string;
	createdAt: string;
	conversationId: string;
}

// Typendefinition für eine Konversation
export interface Conversation {
	id: string;
	title: string;
	createdAt: string;
	updatedAt: string;
	userId: string;
	modelId: string;
}

// Typendefinition für Benutzer
export interface User {
	id: string;
	email: string;
	createdAt: string;
	updatedAt: string;
}
