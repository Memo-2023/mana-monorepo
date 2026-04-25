/**
 * Presi module types for the unified app.
 */

import type { BaseRecord } from '@mana/local-store';
import type { VisibilityLevel } from '@mana/shared-privacy';

export interface LocalDeck extends BaseRecord {
	title: string;
	description?: string | null;
	themeId?: string | null;
	visibility?: VisibilityLevel;
	visibilityChangedAt?: string;
	visibilityChangedBy?: string;
	activeRehearsalBlockId?: string | null;
}

export interface LocalSlide extends BaseRecord {
	deckId: string;
	order: number;
	content: SlideContent;
}

export interface SlideContent {
	type: 'title' | 'content' | 'image' | 'split';
	title?: string;
	subtitle?: string;
	body?: string;
	imageUrl?: string;
	bulletPoints?: string[];
}

// ─── Shared Types (inline to avoid @presi/shared dependency) ───

export interface Deck {
	id: string;
	title: string;
	description?: string;
	themeId?: string;
	visibility: VisibilityLevel;
	createdAt: string;
	updatedAt: string;
}

export interface Slide {
	id: string;
	deckId: string;
	order: number;
	content: SlideContent;
	createdAt: string;
}

// ─── DTOs ─────────────────────────────────────────────────

export interface CreateDeckDto {
	title: string;
	description?: string;
	themeId?: string;
}

export interface UpdateDeckDto {
	title?: string;
	description?: string;
	themeId?: string;
}

export interface CreateSlideDto {
	content: SlideContent;
	order?: number;
}

export interface UpdateSlideDto {
	content?: SlideContent;
	order?: number;
}
