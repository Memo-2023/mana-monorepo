/**
 * Guides module types.
 *
 * Interactive step-by-step guides with sections, steps, and run tracking.
 */

import type { BaseRecord } from '@mana/local-store';

// ─── Guide Categories & Difficulty ────────────────────────

export type GuideCategory = 'getting-started' | 'productivity' | 'advanced' | 'integrations';
export type GuideDifficulty = 'beginner' | 'intermediate' | 'advanced';

export const GUIDE_CATEGORIES: Record<GuideCategory, { label: string; color: string }> = {
	'getting-started': { label: 'Erste Schritte', color: 'bg-emerald-500' },
	productivity: { label: 'Produktivität', color: 'bg-blue-500' },
	advanced: { label: 'Fortgeschritten', color: 'bg-violet-500' },
	integrations: { label: 'Integrationen', color: 'bg-amber-500' },
};

export const DIFFICULTY_LABELS: Record<GuideDifficulty, string> = {
	beginner: 'Einsteiger',
	intermediate: 'Fortgeschritten',
	advanced: 'Profi',
};

// ─── Local Record Types (Dexie) ───────────────────────────

export interface LocalGuide extends BaseRecord {
	title: string;
	description: string;
	category: GuideCategory;
	difficulty: GuideDifficulty;
	estimatedMinutes: number;
	collectionId: string | null;
	isPublished: boolean;
	order: number;
}

export interface LocalSection extends BaseRecord {
	guideId: string;
	title: string;
	content: string | null;
	order: number;
}

export interface LocalStep extends BaseRecord {
	guideId: string;
	sectionId: string | null;
	title: string;
	content: string | null;
	order: number;
}

export interface LocalGuideCollection extends BaseRecord {
	name: string;
	description: string | null;
	color: string;
	icon: string;
	isDefault: boolean;
	sortOrder: number;
}

export interface LocalRun extends BaseRecord {
	guideId: string;
	startedAt: string;
	completedAt: string | null;
	completedStepIds: string[];
}

// ─── Domain Types (UI-facing) ─────────────────────────────

export interface Guide {
	id: string;
	title: string;
	description: string;
	category: GuideCategory;
	difficulty: GuideDifficulty;
	estimatedMinutes: number;
	collectionId: string | null;
	isPublished: boolean;
	order: number;
	createdAt: string;
	updatedAt: string;
}

export interface Section {
	id: string;
	guideId: string;
	title: string;
	content: string | null;
	order: number;
	createdAt: string;
	updatedAt: string;
}

export interface Step {
	id: string;
	guideId: string;
	sectionId: string | null;
	title: string;
	content: string | null;
	order: number;
	createdAt: string;
	updatedAt: string;
}

export interface Run {
	id: string;
	guideId: string;
	startedAt: string;
	completedAt: string | null;
	completedStepIds: string[];
	createdAt: string;
	updatedAt: string;
}

// ─── DTOs ─────────────────────────────────────────────────

export interface CreateGuideDto {
	title: string;
	description?: string;
	category?: GuideCategory;
	difficulty?: GuideDifficulty;
	estimatedMinutes?: number;
	collectionId?: string;
}

export interface UpdateGuideDto {
	title?: string;
	description?: string;
	category?: GuideCategory;
	difficulty?: GuideDifficulty;
	estimatedMinutes?: number;
	collectionId?: string;
	isPublished?: boolean;
}

export interface CreateSectionDto {
	guideId: string;
	title: string;
	content?: string;
}

export interface UpdateSectionDto {
	title?: string;
	content?: string;
}

export interface CreateStepDto {
	guideId: string;
	sectionId?: string;
	title: string;
	content?: string;
}

export interface UpdateStepDto {
	title?: string;
	content?: string;
	sectionId?: string;
}
