/**
 * Template apply + snapshot tests.
 *
 * Verifies that each of the 4 bundled templates:
 *   1. clones into a fresh site with new UUIDs (no template-localId
 *      leaks into Dexie rows)
 *   2. produces the expected page + block counts
 *   3. preserves parentBlockId chains when a template uses containers
 *   4. populates navConfig with template page titles + paths
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('$lib/stores/funnel-tracking', () => ({ trackFirstContent: vi.fn() }));
vi.mock('$lib/triggers/registry', () => ({ fire: vi.fn() }));
vi.mock('$lib/triggers/inline-suggest', () => ({
	checkInlineSuggestion: vi.fn().mockResolvedValue(null),
}));
vi.mock('./embeds', () => ({
	resolveEmbed: vi.fn(async () => ({ items: [], resolvedAt: '2026-04-23T00:00:00.000Z' })),
}));

import { websitesTable, websitePagesTable, websiteBlocksTable } from './collections';
import { sitesStore } from './stores/sites.svelte';
import { SITE_TEMPLATES } from './templates';

describe('sitesStore.applyTemplate — per-template round-trip', () => {
	beforeEach(async () => {
		await websitesTable.clear();
		await websitePagesTable.clear();
		await websiteBlocksTable.clear();
	});

	it.each(SITE_TEMPLATES.map((t) => [t.id] as const))(
		'clones "%s" into a fresh site with new UUIDs',
		async (templateId) => {
			const tpl = SITE_TEMPLATES.find((t) => t.id === templateId)!;
			const expectedBlockCount = tpl.pages.reduce((sum, p) => sum + p.blocks.length, 0);

			const { siteId, homePageId } = await sitesStore.applyTemplate(templateId, {
				slug: `test-${templateId}`,
				name: `Test ${templateId}`,
			});

			// Site row exists with fresh id.
			const site = await websitesTable.get(siteId);
			expect(site).toBeDefined();
			expect(site!.slug).toBe(`test-${templateId}`);
			expect(site!.publishedVersion).toBeNull();

			// Pages: one per template page.
			const pages = await websitePagesTable.where('siteId').equals(siteId).toArray();
			expect(pages.length).toBe(tpl.pages.length);

			// Home page id matches the first page (path '/') when present.
			const home = pages.find((p) => p.path === '/');
			expect(home?.id).toBe(homePageId);

			// Blocks: total across all pages matches template total.
			const pageIds = pages.map((p) => p.id);
			const blocks = await websiteBlocksTable.where('pageId').anyOf(pageIds).toArray();
			expect(blocks.length).toBe(expectedBlockCount);

			// Every block has a real UUID (not a template localId).
			for (const block of blocks) {
				expect(block.id).toMatch(/^[0-9a-f-]{36}$/i);
				// No template 'localId' fields leak into the row.
				expect((block as unknown as { localId?: string }).localId).toBeUndefined();
			}

			// navConfig gets populated from template pages.
			expect(site!.navConfig.items.length).toBe(tpl.pages.length);
			expect(site!.navConfig.items.map((i) => i.pagePath).sort()).toEqual(
				tpl.pages.map((p) => p.path).sort()
			);
		}
	);

	// NOTE: the parentLocalId → parentBlockId remap logic inside
	// applyTemplate is exercised only when a bundled template uses a
	// container. None of the four shipped templates (portfolio,
	// linktree, event, blank) do yet. Once we add smb-corporate
	// (columns-heavy), add a parent-chain assertion to the .each loop
	// above. Until then, the behaviour is covered by the manual smoke
	// test in docs/plans/website-builder-smoketest.md §2 (Columns).

	it('rejects an unknown template id', async () => {
		await expect(
			sitesStore.applyTemplate('does-not-exist', { slug: 'oops', name: 'Oops' })
		).rejects.toThrow(/Unknown template/);
	});

	it('rejects duplicate slugs in the same space', async () => {
		await sitesStore.applyTemplate('blank', { slug: 'dup', name: 'First' });
		await expect(
			sitesStore.applyTemplate('blank', { slug: 'dup', name: 'Second' })
		).rejects.toThrow(/already exists/);
	});

	it('rejects invalid slug format', async () => {
		await expect(
			sitesStore.applyTemplate('blank', { slug: 'HAS UPPERCASE', name: 'Bad' })
		).rejects.toThrow();
		await expect(
			sitesStore.applyTemplate('blank', { slug: 'a', name: 'Too short' })
		).rejects.toThrow();
	});
});
