import { emitDomainEvent } from '$lib/data/events';
import { websitesTable, websitePagesTable } from '../collections';
import type { LocalWebsitePage, PageSeo } from '../types';

export interface CreatePageInput {
	siteId: string;
	path: string;
	title: string;
	seo?: PageSeo;
}

export class InvalidPathError extends Error {
	constructor(path: string) {
		super(
			`"${path}" is not a valid page path — must start with "/" and contain only lowercase alphanumerics, hyphens, and additional segments.`
		);
		this.name = 'InvalidPathError';
	}
}

export class DuplicatePathError extends Error {
	constructor(path: string) {
		super(`A page with path "${path}" already exists on this site.`);
		this.name = 'DuplicatePathError';
	}
}

const PATH_REGEX = /^\/(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\/[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*)?$/;

export function isValidPath(path: string): boolean {
	return PATH_REGEX.test(path);
}

function touchSite(siteId: string): Promise<void> {
	const now = new Date().toISOString();
	return websitesTable
		.update(siteId, { draftUpdatedAt: now, updatedAt: now })
		.then(() => undefined);
}

export const pagesStore = {
	async createPage(input: CreatePageInput) {
		if (!isValidPath(input.path)) {
			throw new InvalidPathError(input.path);
		}

		const siblings = await websitePagesTable.where('siteId').equals(input.siteId).toArray();
		const livePaths = siblings.filter((p) => !p.deletedAt);
		if (livePaths.some((p) => p.path === input.path)) {
			throw new DuplicatePathError(input.path);
		}

		const maxOrder = livePaths.reduce((m, p) => Math.max(m, p.order), 0);
		const now = new Date().toISOString();
		const id = crypto.randomUUID();

		const newPage: LocalWebsitePage = {
			id,
			siteId: input.siteId,
			path: input.path,
			title: input.title,
			seo: input.seo ?? {},
			order: maxOrder + 1024,
			createdAt: now,
			updatedAt: now,
		};

		await websitePagesTable.add(newPage);
		await touchSite(input.siteId);

		emitDomainEvent('WebsitePageCreated', 'website', 'websitePages', id, {
			pageId: id,
			siteId: input.siteId,
			path: input.path,
		});

		return newPage;
	},

	async updatePage(id: string, patch: Partial<Pick<LocalWebsitePage, 'path' | 'title' | 'seo'>>) {
		if (patch.path !== undefined && !isValidPath(patch.path)) {
			throw new InvalidPathError(patch.path);
		}

		const now = new Date().toISOString();
		const existing = await websitePagesTable.get(id);
		if (!existing) throw new Error(`Page ${id} not found`);

		await websitePagesTable.update(id, {
			...patch,
			updatedAt: now,
		});
		await touchSite(existing.siteId);

		emitDomainEvent('WebsitePageUpdated', 'website', 'websitePages', id, {
			pageId: id,
			siteId: existing.siteId,
			fields: Object.keys(patch),
		});
	},

	async deletePage(id: string) {
		const existing = await websitePagesTable.get(id);
		if (!existing) return;

		const now = new Date().toISOString();
		await websitePagesTable.update(id, {
			deletedAt: now,
			updatedAt: now,
		});
		await touchSite(existing.siteId);

		emitDomainEvent('WebsitePageDeleted', 'website', 'websitePages', id, {
			pageId: id,
			siteId: existing.siteId,
		});
	},

	/**
	 * Move a page to a new position by recomputing its `order` field.
	 * `beforeOrder` and `afterOrder` are the orders of the pages that
	 * should sit immediately before and after the moved page — pass
	 * `null` on either side if the page becomes first or last.
	 */
	async reorderPage(id: string, beforeOrder: number | null, afterOrder: number | null) {
		let newOrder: number;
		if (beforeOrder === null && afterOrder === null) {
			newOrder = 1024;
		} else if (beforeOrder === null) {
			// moving to first
			newOrder = (afterOrder as number) / 2;
		} else if (afterOrder === null) {
			// moving to last
			newOrder = beforeOrder + 1024;
		} else {
			newOrder = (beforeOrder + afterOrder) / 2;
		}

		const now = new Date().toISOString();
		const existing = await websitePagesTable.get(id);
		if (!existing) return;

		await websitePagesTable.update(id, {
			order: newOrder,
			updatedAt: now,
		});
		await touchSite(existing.siteId);
	},
};
