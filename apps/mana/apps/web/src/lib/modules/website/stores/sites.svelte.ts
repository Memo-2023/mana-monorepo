import { emitDomainEvent } from '$lib/data/events';
import { authStore } from '$lib/stores/auth.svelte';
import { getActiveSpaceId } from '$lib/data/scope';
import { websitesTable, websitePagesTable, websiteBlocksTable } from '../collections';
import { toWebsite } from '../queries';
import { getTemplate, type SiteTemplate } from '../templates';
import {
	publishSnapshot,
	unpublishSnapshot,
	rollbackSnapshot,
	PublishError,
	type PublishResult,
} from '../publish';
import type { LocalWebsite, LocalWebsitePage, LocalWebsiteBlock, ThemeConfig } from '../types';
import {
	DEFAULT_THEME,
	DEFAULT_NAV,
	DEFAULT_FOOTER,
	DEFAULT_SETTINGS,
	DEFAULT_HOME_PAGE,
	isValidSlug,
} from '../constants';

export interface CreateSiteInput {
	slug: string;
	name: string;
	theme?: ThemeConfig;
}

export class InvalidSlugError extends Error {
	constructor(slug: string) {
		super(
			`"${slug}" is not a valid slug — use 2-40 lowercase alphanumerics or hyphens, avoid reserved names.`
		);
		this.name = 'InvalidSlugError';
	}
}

export class DuplicateSlugError extends Error {
	constructor(slug: string) {
		super(`A site with slug "${slug}" already exists in this space.`);
		this.name = 'DuplicateSlugError';
	}
}

export class UnknownTemplateError extends Error {
	constructor(templateId: string) {
		super(`Unknown template "${templateId}"`);
		this.name = 'UnknownTemplateError';
	}
}

export const sitesStore = {
	/**
	 * Create a new site + a default home page in one transaction. Throws
	 * `InvalidSlugError` on bad slugs and `DuplicateSlugError` when the
	 * slug collides within the active space.
	 */
	async createSite(input: CreateSiteInput) {
		if (!isValidSlug(input.slug)) {
			throw new InvalidSlugError(input.slug);
		}

		// Slug dedupe within the current active space. We query via scope
		// so the check is automatically limited to records the user can
		// see; without scope, users in different spaces could trigger
		// false positives.
		const existing = await websitesTable.where('slug').equals(input.slug).toArray();
		const liveDuplicate = existing.find((s) => !s.deletedAt);
		if (liveDuplicate) {
			throw new DuplicateSlugError(input.slug);
		}

		const now = new Date().toISOString();
		const siteId = crypto.randomUUID();
		const pageId = crypto.randomUUID();

		const newSite: LocalWebsite = {
			id: siteId,
			slug: input.slug,
			name: input.name,
			theme: input.theme ?? DEFAULT_THEME,
			navConfig: DEFAULT_NAV,
			footerConfig: DEFAULT_FOOTER,
			settings: DEFAULT_SETTINGS,
			publishedVersion: null,
			draftUpdatedAt: now,
			createdAt: now,
			updatedAt: now,
		};

		const homePage: LocalWebsitePage = {
			id: pageId,
			siteId,
			path: DEFAULT_HOME_PAGE.path,
			title: DEFAULT_HOME_PAGE.title,
			seo: {},
			order: 1024,
			createdAt: now,
			updatedAt: now,
		};

		await websitesTable.add(newSite);
		await websitePagesTable.add(homePage);

		emitDomainEvent('WebsiteCreated', 'website', 'websites', siteId, {
			siteId,
			slug: input.slug,
			name: input.name,
		});

		return { site: toWebsite(newSite), homePageId: pageId };
	},

	async updateSite(
		id: string,
		patch: Partial<Pick<LocalWebsite, 'name' | 'theme' | 'navConfig' | 'footerConfig' | 'settings'>>
	) {
		const now = new Date().toISOString();
		await websitesTable.update(id, {
			...patch,
			updatedAt: now,
			draftUpdatedAt: now,
		});
		emitDomainEvent('WebsiteUpdated', 'website', 'websites', id, {
			siteId: id,
			fields: Object.keys(patch),
		});
	},

	async deleteSite(id: string) {
		const now = new Date().toISOString();
		await websitesTable.update(id, {
			deletedAt: now,
			updatedAt: now,
		});
		// Best-effort: unpublish so the public URL stops serving. Failures
		// here don't block the soft-delete — the GC job in M7 will clean
		// orphan snapshots.
		try {
			const token = await authStore.getValidToken();
			if (token) await unpublishSnapshot(id, token);
		} catch {
			// swallow — soft-delete succeeded locally
		}
		emitDomainEvent('WebsiteDeleted', 'website', 'websites', id, { siteId: id });
	},

	/**
	 * Publish the current draft to the public `/s/{slug}` URL. Returns
	 * the snapshot id + public URL on success. Updates
	 * `site.publishedVersion` locally so the editor reflects the new
	 * state immediately.
	 */
	async publishSite(id: string): Promise<PublishResult> {
		const token = await authStore.getValidToken();
		if (!token) throw new PublishError('Not signed in', 'NO_TOKEN', 401);

		const result = await publishSnapshot(id, token, getActiveSpaceId());

		const now = new Date().toISOString();
		await websitesTable.update(id, {
			publishedVersion: result.snapshotId,
			updatedAt: now,
		});

		emitDomainEvent('WebsitePublished', 'website', 'websites', id, {
			siteId: id,
			snapshotId: result.snapshotId,
			publishedAt: result.publishedAt,
			publicUrl: result.publicUrl,
		});

		return result;
	},

	/**
	 * Take the site offline. Leaves the local draft untouched.
	 */
	async unpublishSite(id: string): Promise<void> {
		const token = await authStore.getValidToken();
		if (!token) throw new PublishError('Not signed in', 'NO_TOKEN', 401);

		await unpublishSnapshot(id, token);

		const now = new Date().toISOString();
		await websitesTable.update(id, {
			publishedVersion: null,
			updatedAt: now,
		});

		emitDomainEvent('WebsiteUnpublished', 'website', 'websites', id, { siteId: id });
	},

	/**
	 * Clone a starter template into a new site. Template pages + blocks
	 * are inserted with fresh UUIDs; the template's `localId` graph is
	 * rewritten to the new parentBlockId chain so container → child
	 * relationships survive.
	 */
	async applyTemplate(
		templateId: string,
		input: { slug: string; name: string }
	): Promise<{ siteId: string; homePageId: string }> {
		if (!isValidSlug(input.slug)) {
			throw new InvalidSlugError(input.slug);
		}
		const existing = await websitesTable.where('slug').equals(input.slug).toArray();
		if (existing.some((s) => !s.deletedAt)) {
			throw new DuplicateSlugError(input.slug);
		}

		const template: SiteTemplate | undefined = getTemplate(templateId);
		if (!template) throw new UnknownTemplateError(templateId);

		const now = new Date().toISOString();
		const siteId = crypto.randomUUID();

		const newSite: LocalWebsite = {
			id: siteId,
			slug: input.slug,
			name: input.name,
			theme: DEFAULT_THEME,
			navConfig: {
				items: template.pages.map((p) => ({ label: p.title, pagePath: p.path })),
			},
			footerConfig: DEFAULT_FOOTER,
			settings: DEFAULT_SETTINGS,
			publishedVersion: null,
			draftUpdatedAt: now,
			createdAt: now,
			updatedAt: now,
		};

		const pageRows: LocalWebsitePage[] = [];
		const blockRows: LocalWebsiteBlock[] = [];
		let homePageId: string | null = null;

		for (const page of template.pages) {
			const pageId = crypto.randomUUID();
			if (page.path === '/' || !homePageId) homePageId = pageId;
			pageRows.push({
				id: pageId,
				siteId,
				path: page.path,
				title: page.title,
				seo: {},
				order: page.order,
				createdAt: now,
				updatedAt: now,
			});

			// Resolve template-local parent refs → real UUIDs in a second pass.
			const idMap = new Map<string, string>();
			for (const block of page.blocks) {
				idMap.set(block.localId, crypto.randomUUID());
			}

			let order = 1024;
			for (const block of page.blocks) {
				const id = idMap.get(block.localId)!;
				const parentId = block.parentLocalId ? (idMap.get(block.parentLocalId) ?? null) : null;
				blockRows.push({
					id,
					pageId,
					parentBlockId: parentId,
					slotKey: block.slotKey ?? null,
					type: block.type,
					props: block.props,
					schemaVersion: 1,
					order,
					createdAt: now,
					updatedAt: now,
				});
				order += 1024;
			}
		}

		if (!homePageId) {
			// Edge case: a template with zero pages. Shouldn't happen
			// (blank has one page) but guard anyway.
			homePageId = crypto.randomUUID();
			pageRows.push({
				id: homePageId,
				siteId,
				path: '/',
				title: 'Start',
				seo: {},
				order: 1024,
				createdAt: now,
				updatedAt: now,
			});
		}

		await websitesTable.add(newSite);
		if (pageRows.length > 0) await websitePagesTable.bulkAdd(pageRows);
		if (blockRows.length > 0) await websiteBlocksTable.bulkAdd(blockRows);

		emitDomainEvent('WebsiteCreated', 'website', 'websites', siteId, {
			siteId,
			slug: input.slug,
			name: input.name,
			templateId,
		});

		return { siteId, homePageId };
	},

	/**
	 * Roll back to a historical snapshot. The server flips `is_current`;
	 * we also update `publishedVersion` locally to reflect the new live
	 * version.
	 */
	async rollback(siteId: string, snapshotId: string): Promise<void> {
		const token = await authStore.getValidToken();
		if (!token) throw new PublishError('Not signed in', 'NO_TOKEN', 401);

		await rollbackSnapshot(siteId, snapshotId, token);

		const now = new Date().toISOString();
		await websitesTable.update(siteId, {
			publishedVersion: snapshotId,
			updatedAt: now,
		});

		emitDomainEvent('WebsiteRolledBack', 'website', 'websites', siteId, {
			siteId,
			snapshotId,
		});
	},
};
