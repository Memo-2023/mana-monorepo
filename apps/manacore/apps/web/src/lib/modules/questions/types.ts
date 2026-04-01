/**
 * Questions module types for the unified app.
 */

import type { BaseRecord } from '@manacore/local-store';

export interface LocalCollection extends BaseRecord {
	name: string;
	description?: string | null;
	color: string;
	icon: string;
	isDefault: boolean;
	sortOrder: number;
}

export interface LocalQuestion extends BaseRecord {
	collectionId?: string | null;
	title: string;
	description?: string | null;
	status: 'open' | 'researching' | 'answered' | 'archived';
	priority: 'low' | 'normal' | 'high' | 'urgent';
	tags: string[];
	researchDepth: 'quick' | 'standard' | 'deep';
}

export interface LocalAnswer extends BaseRecord {
	questionId: string;
	researchResultId?: string | null;
	content: string;
	citations: Array<{ sourceId: string; text: string }>;
	rating?: number | null;
	isAccepted: boolean;
}

export type QuestionStatus = LocalQuestion['status'];
export type QuestionPriority = LocalQuestion['priority'];
export type ResearchDepth = LocalQuestion['researchDepth'];

export interface CreateQuestionDto {
	title: string;
	description?: string;
	collectionId?: string;
	tags?: string[];
	priority?: QuestionPriority;
	researchDepth?: ResearchDepth;
}

export interface UpdateQuestionDto {
	title?: string;
	description?: string;
	collectionId?: string;
	tags?: string[];
	priority?: QuestionPriority;
	status?: QuestionStatus;
	researchDepth?: ResearchDepth;
}

export interface CreateCollectionDto {
	name: string;
	description?: string;
	color?: string;
	icon?: string;
	isDefault?: boolean;
}

export interface UpdateCollectionDto {
	name?: string;
	description?: string;
	color?: string;
	icon?: string;
	isDefault?: boolean;
	sortOrder?: number;
}
