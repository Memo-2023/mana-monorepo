/**
 * Cards module types for the unified app.
 */

import type { BaseRecord } from '@mana/local-store';

export interface LocalDeck extends BaseRecord {
	name: string;
	description?: string | null;
	color: string;
	cardCount: number;
	lastStudied?: string | null;
	isPublic: boolean;
}

export interface LocalCard extends BaseRecord {
	deckId: string;
	front: string;
	back: string;
	difficulty: number; // 1-5
	nextReview?: string | null;
	reviewCount: number;
	order: number;
}

// ─── View Types (inline to avoid @cards/shared dependency) ──

export interface Deck {
	id: string;
	userId: string;
	title: string;
	description?: string;
	color: string;
	isPublic: boolean;
	tags: string[];
	cardCount: number;
	createdAt: string;
	updatedAt: string;
}

export interface Card {
	id: string;
	deckId: string;
	front: string;
	back: string;
	difficulty: number;
	nextReview?: string;
	reviewCount: number;
	order: number;
	createdAt: string;
	updatedAt: string;
}

export interface CreateDeckInput {
	title: string;
	description?: string;
	isPublic?: boolean;
}

export interface UpdateDeckInput {
	title?: string;
	description?: string;
	isPublic?: boolean;
}

export interface CreateCardInput {
	deckId: string;
	front: string;
	back: string;
}

export interface UpdateCardInput {
	front?: string;
	back?: string;
	difficulty?: number;
	order?: number;
}
