/**
 * Wishes module types for the unified app.
 */

import type { BaseRecord } from '@mana/local-store';

export interface LocalWish extends BaseRecord {
	title: string;
	description?: string | null;
	listId?: string | null;
	priority: 'low' | 'medium' | 'high';
	targetPrice?: number | null;
	currency?: string | null;
	productUrls: string[];
	imageUrl?: string | null;
	category?: string | null;
	status: 'active' | 'fulfilled' | 'archived';
	tags: string[];
	notes: Array<{ id: string; content: string; createdAt: string }>;
	order: number;
}

export interface LocalWishList extends BaseRecord {
	name: string;
	description?: string | null;
	icon?: string | null;
	color?: string | null;
	isArchived: boolean;
	order: number;
}

export interface LocalPriceCheck extends BaseRecord {
	wishId: string;
	url: string;
	price: number;
	currency: string;
	available: boolean;
	checkedAt: string;
}

// ─── Public Types (post-decryption, used in UI) ───────────

export interface Wish {
	id: string;
	title: string;
	description?: string | null;
	listId?: string | null;
	priority: 'low' | 'medium' | 'high';
	targetPrice?: number | null;
	currency?: string | null;
	productUrls: string[];
	imageUrl?: string | null;
	category?: string | null;
	status: 'active' | 'fulfilled' | 'archived';
	tags: string[];
	notes: Array<{ id: string; content: string; createdAt: string }>;
	order: number;
	createdAt: string;
	updatedAt: string;
}

export interface WishList {
	id: string;
	name: string;
	description?: string | null;
	icon?: string | null;
	color?: string | null;
	isArchived: boolean;
	order: number;
	createdAt: string;
	updatedAt: string;
}

export interface PriceCheck {
	id: string;
	wishId: string;
	url: string;
	price: number;
	currency: string;
	available: boolean;
	checkedAt: string;
	createdAt: string;
}

export type WishStatus = Wish['status'];
export type WishPriority = Wish['priority'];
