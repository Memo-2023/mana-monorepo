// Content types for different card types
export interface TextContent {
	text: string;
	formatting?: {
		bold?: boolean;
		italic?: boolean;
		underline?: boolean;
	};
}

export interface FlashcardContent {
	front: string;
	back: string;
	hint?: string;
}

export interface QuizContent {
	question: string;
	options: string[];
	correct_answer: number;
	explanation?: string;
}

export interface MixedContent {
	blocks: ContentBlock[];
}

export type ContentBlock =
	| { type: 'text'; data: { text: string } }
	| { type: 'image'; data: { url: string; caption?: string } }
	| { type: 'quiz'; data: QuizContent }
	| { type: 'flashcard'; data: FlashcardContent };

export type CardContent = TextContent | FlashcardContent | QuizContent | MixedContent;

export interface Card {
	id: string;
	deck_id: string;
	position: number;
	title?: string;
	content: CardContent;
	card_type: 'text' | 'flashcard' | 'quiz' | 'mixed';
	ai_model?: string;
	ai_prompt?: string;
	version: number;
	is_favorite: boolean;
	created_at: string;
	updated_at: string;
}

export interface CreateCardInput {
	deck_id: string;
	title?: string;
	content: CardContent;
	card_type: 'text' | 'flashcard' | 'quiz' | 'mixed';
	position?: number;
}

export interface UpdateCardInput {
	title?: string;
	content?: CardContent;
	card_type?: 'text' | 'flashcard' | 'quiz' | 'mixed';
	position?: number;
	is_favorite?: boolean;
}
