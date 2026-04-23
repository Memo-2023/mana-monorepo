/**
 * Starter-template shapes. Every template lists pages + blocks in a
 * tree-friendly form (blocks carry a `localId`; children reference
 * parents by `parentLocalId`). The apply-step generates fresh UUIDs and
 * rewrites the parent references.
 */

export interface SiteTemplateBlock {
	/** Template-local id so child blocks can reference a parent without a UUID yet. */
	localId: string;
	parentLocalId?: string;
	slotKey?: string;
	type: string;
	props: Record<string, unknown>;
}

export interface SiteTemplatePage {
	path: string;
	title: string;
	order: number;
	blocks: SiteTemplateBlock[];
}

export interface SiteTemplate {
	id: string;
	name: string;
	description: string;
	tag: 'privat' | 'event' | 'geschäft' | 'leer';
	pages: SiteTemplatePage[];
}
