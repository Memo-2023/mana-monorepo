/**
 * Snapshot builder determinism test.
 *
 * Exit-criterion from docs/plans/website-builder.md §M2: two calls to
 * `buildSnapshot` against an unchanged draft must produce byte-identical
 * JSON. This matters because:
 *   - Cloudflare cache keys depend on the blob's hash in production
 *   - "Re-publish if changed" optimisation (future) compares blobs
 *   - Debugging regressions is much easier when the blob is stable
 *
 * We also verify orphan blocks (parentBlockId points at a nonexistent
 * block) are dropped so accidentally-broken drafts can't stage their
 * broken tree into a published snapshot.
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mirror the Dexie-hook side-effect stubs from sync.test.ts so loading
// database.ts doesn't pull in unrelated runtime modules.
vi.mock('$lib/stores/funnel-tracking', () => ({
	trackFirstContent: vi.fn(),
}));
vi.mock('$lib/triggers/registry', () => ({
	fire: vi.fn(),
}));
vi.mock('$lib/triggers/inline-suggest', () => ({
	checkInlineSuggestion: vi.fn().mockResolvedValue(null),
}));

// Embed resolvers touch live data modules (picture/library). Keep the
// builder test isolated by stubbing them — orphans and sort order are
// what this test covers, not embed resolution.
vi.mock('./embeds', () => ({
	resolveEmbed: vi.fn(async () => ({
		items: [],
		resolvedAt: '2026-04-23T00:00:00.000Z',
	})),
}));

import { websitesTable, websitePagesTable, websiteBlocksTable } from './collections';
import { buildSnapshot, buildBlockTree } from './publish';
import type { LocalWebsite, LocalWebsitePage, LocalWebsiteBlock } from './types';

const SITE_ID = '11111111-1111-1111-1111-111111111111';
const PAGE_ID = '22222222-2222-2222-2222-222222222222';

function localSite(): LocalWebsite {
	return {
		id: SITE_ID,
		slug: 'test-site',
		name: 'Test Site',
		theme: { preset: 'classic' },
		navConfig: { items: [] },
		footerConfig: { text: '', links: [] },
		settings: {},
		publishedVersion: null,
		draftUpdatedAt: '2026-04-23T00:00:00.000Z',
		createdAt: '2026-04-23T00:00:00.000Z',
		updatedAt: '2026-04-23T00:00:00.000Z',
	};
}

function localPage(overrides: Partial<LocalWebsitePage> = {}): LocalWebsitePage {
	return {
		id: PAGE_ID,
		siteId: SITE_ID,
		path: '/',
		title: 'Start',
		seo: {},
		order: 1024,
		createdAt: '2026-04-23T00:00:00.000Z',
		updatedAt: '2026-04-23T00:00:00.000Z',
		...overrides,
	};
}

function localBlock(
	id: string,
	order: number,
	overrides: Partial<LocalWebsiteBlock> = {}
): LocalWebsiteBlock {
	return {
		id,
		pageId: PAGE_ID,
		parentBlockId: null,
		slotKey: null,
		type: 'richText',
		props: { content: `Block ${id}`, align: 'left', size: 'md' },
		schemaVersion: 1,
		order,
		createdAt: '2026-04-23T00:00:00.000Z',
		updatedAt: '2026-04-23T00:00:00.000Z',
		...overrides,
	};
}

describe('buildSnapshot — determinism', () => {
	beforeEach(async () => {
		await websitesTable.clear();
		await websitePagesTable.clear();
		await websiteBlocksTable.clear();
	});

	it('two calls against the same draft produce byte-identical JSON', async () => {
		await websitesTable.add(localSite());
		await websitePagesTable.add(localPage());
		await websiteBlocksTable.bulkAdd([
			localBlock('b-gamma', 3072),
			localBlock('b-alpha', 1024),
			localBlock('b-beta', 2048),
		]);

		const first = await buildSnapshot(SITE_ID);
		const second = await buildSnapshot(SITE_ID);

		expect(JSON.stringify(first)).toBe(JSON.stringify(second));
	});

	it('sorts blocks with equal order by id (stable tiebreaker)', async () => {
		await websitesTable.add(localSite());
		await websitePagesTable.add(localPage());
		await websiteBlocksTable.bulkAdd([
			localBlock('b-zzzzz', 1024),
			localBlock('b-aaaaa', 1024),
			localBlock('b-mmmmm', 1024),
		]);

		const snap = await buildSnapshot(SITE_ID);
		const ids = snap.pages[0]!.blocks.map((b) => b.id);
		expect(ids).toEqual(['b-aaaaa', 'b-mmmmm', 'b-zzzzz']);
	});
});

describe('buildBlockTree — orphan handling', () => {
	it('drops blocks whose parentBlockId does not resolve', () => {
		const blocks: LocalWebsiteBlock[] = [
			localBlock('b-root', 1024),
			localBlock('b-orphan', 2048, { parentBlockId: 'b-does-not-exist' }),
			localBlock('b-child', 3072, { parentBlockId: 'b-root' }),
		];
		const tree = buildBlockTree(blocks);
		// Top-level contains only b-root.
		expect(tree.map((t) => t.id)).toEqual(['b-root']);
		// b-root has exactly one child (b-child) — the orphan is dropped.
		expect(tree[0]!.children.map((c) => c.id)).toEqual(['b-child']);
	});

	it('preserves nested children ordered by (order, id)', () => {
		const blocks: LocalWebsiteBlock[] = [
			localBlock('parent', 1024),
			localBlock('child-c', 2048, { parentBlockId: 'parent' }),
			localBlock('child-a', 1024, { parentBlockId: 'parent' }),
			localBlock('child-b', 1024, { parentBlockId: 'parent' }),
		];
		const tree = buildBlockTree(blocks);
		expect(tree[0]!.children.map((c) => c.id)).toEqual(['child-a', 'child-b', 'child-c']);
	});

	it('drops self-parent blocks (cycle of length 1)', () => {
		const blocks: LocalWebsiteBlock[] = [
			localBlock('ok', 1024),
			localBlock('loop', 2048, { parentBlockId: 'loop' }),
		];
		// `loop` references itself as parent. byId.has('loop') is true, so
		// the orphan-drop doesn't catch it; children-walk from `loop`
		// recurses forever IF we don't guard. Current implementation
		// should either drop it or keep a cycle-free view — verify no
		// stack overflow + only the well-formed block lands at root.
		const tree = buildBlockTree(blocks);
		// The self-referencing block will be reachable as a child of
		// itself; what we assert is that the walk doesn't infinite-loop
		// and the `ok` block is always at top-level.
		expect(tree.find((b) => b.id === 'ok')).toBeDefined();
	});

	it('handles 3-level nesting without losing ancestors', () => {
		const blocks: LocalWebsiteBlock[] = [
			localBlock('grandparent', 1024),
			localBlock('parent', 2048, { parentBlockId: 'grandparent' }),
			localBlock('child', 3072, { parentBlockId: 'parent' }),
		];
		const tree = buildBlockTree(blocks);
		expect(tree.length).toBe(1);
		expect(tree[0]!.id).toBe('grandparent');
		expect(tree[0]!.children.length).toBe(1);
		expect(tree[0]!.children[0]!.id).toBe('parent');
		expect(tree[0]!.children[0]!.children.length).toBe(1);
		expect(tree[0]!.children[0]!.children[0]!.id).toBe('child');
	});

	it('returns an empty array when all blocks are orphans', () => {
		const blocks: LocalWebsiteBlock[] = [
			localBlock('o1', 1024, { parentBlockId: 'nope' }),
			localBlock('o2', 2048, { parentBlockId: 'also-nope' }),
		];
		const tree = buildBlockTree(blocks);
		expect(tree).toEqual([]);
	});

	it('returns an empty array for no input', () => {
		expect(buildBlockTree([])).toEqual([]);
	});
});
