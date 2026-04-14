/**
 * Kontext module types — Singleton markdown document.
 */

import type { BaseRecord } from '@mana/local-store';

export const KONTEXT_SINGLETON_ID = 'singleton' as const;

export interface LocalKontextDoc extends BaseRecord {
	id: typeof KONTEXT_SINGLETON_ID;
	content: string;
}

export interface KontextDoc {
	id: string;
	content: string;
	createdAt: string;
	updatedAt: string;
}
