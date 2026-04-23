import { emitDomainEvent } from '$lib/data/events';
import { requireBlockSpec, safeValidateBlockProps } from '@mana/website-blocks';
import { websitesTable, websitePagesTable, websiteBlocksTable } from '../collections';
import type { LocalWebsiteBlock } from '../types';

export interface AddBlockInput {
	pageId: string;
	type: string;
	parentBlockId?: string | null;
	slotKey?: string | null;
	/**
	 * Override defaults from the block spec. Must satisfy the block type's
	 * Zod schema — throws `InvalidBlockPropsError` otherwise.
	 */
	props?: unknown;
	/**
	 * Optional explicit order. If omitted, the block is appended to the
	 * end of the page / parent's children.
	 */
	order?: number;
}

export class InvalidBlockPropsError extends Error {
	readonly zodError: unknown;
	constructor(type: string, zodError: unknown) {
		super(`Invalid props for block type "${type}".`);
		this.name = 'InvalidBlockPropsError';
		this.zodError = zodError;
	}
}

async function touchSiteForPage(pageId: string): Promise<void> {
	const page = await websitePagesTable.get(pageId);
	if (!page) return;
	const now = new Date().toISOString();
	await websitesTable.update(page.siteId, { draftUpdatedAt: now, updatedAt: now });
}

async function nextOrder(pageId: string, parentBlockId: string | null): Promise<number> {
	const siblings = await websiteBlocksTable.where('pageId').equals(pageId).toArray();
	const live = siblings.filter((b) => !b.deletedAt && (b.parentBlockId ?? null) === parentBlockId);
	const maxOrder = live.reduce((m, b) => Math.max(m, b.order), 0);
	return maxOrder + 1024;
}

export const blocksStore = {
	/**
	 * Insert a block. Props default to the block type's `defaults` from
	 * the registry; if `input.props` is given, it must validate against
	 * the block's Zod schema.
	 */
	async addBlock(input: AddBlockInput) {
		const spec = requireBlockSpec(input.type);
		const parentId = input.parentBlockId ?? null;
		const slotKey = input.slotKey ?? null;

		const props = input.props ?? spec.defaults;
		const validated = safeValidateBlockProps(input.type, props);
		if (!validated.success) {
			throw new InvalidBlockPropsError(input.type, validated.error);
		}

		const order = input.order ?? (await nextOrder(input.pageId, parentId));
		const now = new Date().toISOString();
		const id = crypto.randomUUID();

		const newBlock: LocalWebsiteBlock = {
			id,
			pageId: input.pageId,
			parentBlockId: parentId,
			slotKey,
			type: input.type,
			props: validated.data,
			schemaVersion: spec.schemaVersion,
			order,
			createdAt: now,
			updatedAt: now,
		};

		await websiteBlocksTable.add(newBlock);
		await touchSiteForPage(input.pageId);

		emitDomainEvent('WebsiteBlockAdded', 'website', 'websiteBlocks', id, {
			blockId: id,
			pageId: input.pageId,
			type: input.type,
		});

		return newBlock;
	},

	/**
	 * Patch a block's props. The resulting props (existing ∪ patch) are
	 * re-validated against the block's schema.
	 */
	async updateBlockProps(id: string, patch: Record<string, unknown>) {
		const existing = await websiteBlocksTable.get(id);
		if (!existing) throw new Error(`Block ${id} not found`);

		const nextProps = { ...(existing.props as Record<string, unknown>), ...patch };
		const validated = safeValidateBlockProps(existing.type, nextProps);
		if (!validated.success) {
			throw new InvalidBlockPropsError(existing.type, validated.error);
		}

		const now = new Date().toISOString();
		await websiteBlocksTable.update(id, {
			props: validated.data,
			updatedAt: now,
		});
		await touchSiteForPage(existing.pageId);

		emitDomainEvent('WebsiteBlockUpdated', 'website', 'websiteBlocks', id, {
			blockId: id,
			pageId: existing.pageId,
			fields: Object.keys(patch),
		});
	},

	async deleteBlock(id: string) {
		const existing = await websiteBlocksTable.get(id);
		if (!existing) return;

		const now = new Date().toISOString();
		await websiteBlocksTable.update(id, {
			deletedAt: now,
			updatedAt: now,
		});
		await touchSiteForPage(existing.pageId);

		emitDomainEvent('WebsiteBlockDeleted', 'website', 'websiteBlocks', id, {
			blockId: id,
			pageId: existing.pageId,
		});
	},

	/**
	 * Move a block to a new position within its current parent. Same
	 * fractional-index logic as pages.
	 */
	async reorderBlock(id: string, beforeOrder: number | null, afterOrder: number | null) {
		let newOrder: number;
		if (beforeOrder === null && afterOrder === null) {
			newOrder = 1024;
		} else if (beforeOrder === null) {
			newOrder = (afterOrder as number) / 2;
		} else if (afterOrder === null) {
			newOrder = beforeOrder + 1024;
		} else {
			newOrder = (beforeOrder + afterOrder) / 2;
		}

		const existing = await websiteBlocksTable.get(id);
		if (!existing) return;

		const now = new Date().toISOString();
		await websiteBlocksTable.update(id, {
			order: newOrder,
			updatedAt: now,
		});
		await touchSiteForPage(existing.pageId);

		emitDomainEvent('WebsiteBlockUpdated', 'website', 'websiteBlocks', id, {
			blockId: id,
			pageId: existing.pageId,
			fields: ['order'],
		});
	},

	/**
	 * Restore a soft-deleted block to the exact snapshot captured before
	 * the delete. Used by undo/redo — writes the record back wholesale so
	 * child blocks (whose parentBlockId points at this id) reattach as if
	 * nothing happened. Emits `WebsiteBlockAdded` because the outcome for
	 * the event log is the same as a fresh insert.
	 */
	async restoreBlock(snapshot: LocalWebsiteBlock) {
		const now = new Date().toISOString();
		const restored: LocalWebsiteBlock = {
			...snapshot,
			deletedAt: undefined,
			updatedAt: now,
		};
		await websiteBlocksTable.put(restored);
		await touchSiteForPage(snapshot.pageId);

		emitDomainEvent('WebsiteBlockAdded', 'website', 'websiteBlocks', snapshot.id, {
			blockId: snapshot.id,
			pageId: snapshot.pageId,
			type: snapshot.type,
		});

		return restored;
	},

	/**
	 * Overwrite a block's props without merging — redo/undo target that
	 * needs to bypass the merge-and-revalidate path of updateBlockProps.
	 * Props are still validated against the block's Zod schema.
	 */
	async setBlockProps(id: string, fullProps: unknown) {
		const existing = await websiteBlocksTable.get(id);
		if (!existing) throw new Error(`Block ${id} not found`);

		const validated = safeValidateBlockProps(existing.type, fullProps);
		if (!validated.success) {
			throw new InvalidBlockPropsError(existing.type, validated.error);
		}

		const now = new Date().toISOString();
		await websiteBlocksTable.update(id, {
			props: validated.data,
			updatedAt: now,
		});
		await touchSiteForPage(existing.pageId);

		emitDomainEvent('WebsiteBlockUpdated', 'website', 'websiteBlocks', id, {
			blockId: id,
			pageId: existing.pageId,
			fields: ['props'],
		});
	},

	/**
	 * Set a block's order to an exact value — used by undo/redo of the
	 * fractional-index reorder path where we need the prior numeric order
	 * back, not an "insert between" operation.
	 */
	async setBlockOrder(id: string, order: number) {
		const existing = await websiteBlocksTable.get(id);
		if (!existing) return;

		const now = new Date().toISOString();
		await websiteBlocksTable.update(id, {
			order,
			updatedAt: now,
		});
		await touchSiteForPage(existing.pageId);

		emitDomainEvent('WebsiteBlockUpdated', 'website', 'websiteBlocks', id, {
			blockId: id,
			pageId: existing.pageId,
			fields: ['order'],
		});
	},

	/**
	 * Swap the block with its previous sibling (same page + parent). No-op
	 * if the block is already first or not found.
	 */
	async moveBlockUp(id: string) {
		const siblings = await orderedSiblings(id);
		if (!siblings) return;
		const { ordered, idx } = siblings;
		if (idx <= 0) return;
		const prev = ordered[idx - 1];
		const prevPrev = idx >= 2 ? ordered[idx - 2] : null;
		await this.reorderBlock(id, prevPrev?.order ?? null, prev.order);
	},

	/**
	 * Swap the block with its next sibling (same page + parent). No-op if
	 * the block is already last or not found.
	 */
	async moveBlockDown(id: string) {
		const siblings = await orderedSiblings(id);
		if (!siblings) return;
		const { ordered, idx } = siblings;
		if (idx < 0 || idx >= ordered.length - 1) return;
		const next = ordered[idx + 1];
		const nextNext = idx + 2 < ordered.length ? ordered[idx + 2] : null;
		await this.reorderBlock(id, next.order, nextNext?.order ?? null);
	},
};

async function orderedSiblings(
	id: string
): Promise<{ ordered: LocalWebsiteBlock[]; idx: number } | null> {
	const block = await websiteBlocksTable.get(id);
	if (!block) return null;
	const parentId = block.parentBlockId ?? null;
	const all = await websiteBlocksTable.where('pageId').equals(block.pageId).toArray();
	const ordered = all
		.filter((b) => !b.deletedAt && (b.parentBlockId ?? null) === parentId)
		.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
	const idx = ordered.findIndex((b) => b.id === id);
	return { ordered, idx };
}
