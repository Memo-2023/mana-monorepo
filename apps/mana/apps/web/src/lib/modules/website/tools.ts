/**
 * Website tools — AI-accessible operations over the block-tree CMS.
 *
 * Mirrors the `website` entries in @mana/shared-ai's AI_TOOL_CATALOG.
 * Policy (auto vs propose) is derived there; this file just provides
 * the execute functions.
 *
 * Propose (user-approval required):
 *   - create_website              — brand-new site + default home page
 *   - apply_website_template      — new site from a starter template
 *   - create_website_page         — add a page to a site
 *   - add_website_block           — insert a block on a page
 *   - update_website_block        — patch block props
 *   - publish_website             — push current draft to /s/{slug}
 *
 * Auto (reads):
 *   - list_websites
 *   - list_website_pages
 *   - list_website_blocks
 */

import type { ModuleTool } from '$lib/data/tools/types';
import { deriveUpdatedAt } from '$lib/data/sync';
import {
	sitesStore,
	InvalidSlugError,
	DuplicateSlugError,
	UnknownTemplateError,
} from './stores/sites.svelte';
import { pagesStore, InvalidPathError, DuplicatePathError } from './stores/pages.svelte';
import { blocksStore, InvalidBlockPropsError } from './stores/blocks.svelte';
import { websitesTable, websitePagesTable, websiteBlocksTable } from './collections';
import type { LocalWebsite, LocalWebsitePage, LocalWebsiteBlock } from './types';

function stringOrEmpty(v: unknown): string {
	return typeof v === 'string' ? v : '';
}

export const websiteTools: ModuleTool[] = [
	// ─── Propose: write operations ─────────────────────────

	{
		name: 'create_website',
		module: 'website',
		description: 'Erstellt eine neue Website mit Startseite. Gibt siteId und homePageId zurueck.',
		parameters: [
			{ name: 'name', type: 'string', description: 'Anzeigename', required: true },
			{ name: 'slug', type: 'string', description: 'URL-Slug', required: true },
		],
		async execute(params) {
			const name = stringOrEmpty(params.name).trim();
			const slug = stringOrEmpty(params.slug).trim().toLowerCase();
			if (!name) return { success: false, message: 'name darf nicht leer sein' };
			if (!slug) return { success: false, message: 'slug darf nicht leer sein' };

			try {
				const { site, homePageId } = await sitesStore.createSite({ name, slug });
				return {
					success: true,
					data: { siteId: site.id, homePageId, publicUrl: `/s/${site.slug}` },
					message: `Website "${site.name}" angelegt (/s/${site.slug})`,
				};
			} catch (err) {
				if (err instanceof InvalidSlugError || err instanceof DuplicateSlugError) {
					return { success: false, message: err.message };
				}
				throw err;
			}
		},
	},

	{
		name: 'apply_website_template',
		module: 'website',
		description:
			'Erstellt eine neue Website aus einem Template (portfolio, personal-linktree, event, blank).',
		parameters: [
			{
				name: 'templateId',
				type: 'string',
				description: 'Template-Kennung',
				required: true,
				enum: ['portfolio', 'personal-linktree', 'event', 'blank'],
			},
			{ name: 'name', type: 'string', description: 'Website-Name', required: true },
			{ name: 'slug', type: 'string', description: 'URL-Slug', required: true },
		],
		async execute(params) {
			const templateId = stringOrEmpty(params.templateId);
			const name = stringOrEmpty(params.name).trim();
			const slug = stringOrEmpty(params.slug).trim().toLowerCase();
			if (!name || !slug) {
				return { success: false, message: 'name und slug sind pflicht' };
			}
			try {
				const { siteId, homePageId } = await sitesStore.applyTemplate(templateId, { name, slug });
				return {
					success: true,
					data: { siteId, homePageId, templateId },
					message: `Template "${templateId}" angewendet — Website "${name}" (/s/${slug}) bereit`,
				};
			} catch (err) {
				if (
					err instanceof InvalidSlugError ||
					err instanceof DuplicateSlugError ||
					err instanceof UnknownTemplateError
				) {
					return { success: false, message: err.message };
				}
				throw err;
			}
		},
	},

	{
		name: 'create_website_page',
		module: 'website',
		description: 'Fuegt einer bestehenden Website eine neue Seite hinzu.',
		parameters: [
			{ name: 'siteId', type: 'string', description: 'ID der Website', required: true },
			{ name: 'path', type: 'string', description: 'URL-Pfad (z.B. /ueber-uns)', required: true },
			{ name: 'title', type: 'string', description: 'Seitentitel', required: true },
		],
		async execute(params) {
			const siteId = stringOrEmpty(params.siteId);
			const path = stringOrEmpty(params.path).trim().toLowerCase();
			const title = stringOrEmpty(params.title).trim();
			if (!siteId || !path || !title) {
				return { success: false, message: 'siteId, path und title sind pflicht' };
			}
			try {
				const page = await pagesStore.createPage({ siteId, path, title });
				return {
					success: true,
					data: { pageId: page.id, siteId, path: page.path },
					message: `Seite "${title}" unter ${path} angelegt`,
				};
			} catch (err) {
				if (err instanceof InvalidPathError || err instanceof DuplicatePathError) {
					return { success: false, message: err.message };
				}
				throw err;
			}
		},
	},

	{
		name: 'add_website_block',
		module: 'website',
		description:
			'Fuegt einer Seite einen neuen Block hinzu. Props sind typ-spezifisch; ohne props werden die Defaults des Block-Typs verwendet.',
		parameters: [
			{ name: 'pageId', type: 'string', description: 'ID der Seite', required: true },
			{ name: 'type', type: 'string', description: 'Block-Typ', required: true },
			{ name: 'props', type: 'object', description: 'Block-Props (JSON)', required: false },
			{
				name: 'parentBlockId',
				type: 'string',
				description: 'ID des Parent-Containers',
				required: false,
			},
			{ name: 'slotKey', type: 'string', description: 'Slot im Container', required: false },
		],
		async execute(params) {
			const pageId = stringOrEmpty(params.pageId);
			const type = stringOrEmpty(params.type);
			if (!pageId || !type) {
				return { success: false, message: 'pageId und type sind pflicht' };
			}
			const props = (params.props as Record<string, unknown> | undefined) ?? undefined;
			const parentBlockId = (params.parentBlockId as string | undefined) ?? null;
			const slotKey = (params.slotKey as string | undefined) ?? null;

			try {
				const block = await blocksStore.addBlock({ pageId, type, props, parentBlockId, slotKey });
				return {
					success: true,
					data: { blockId: block.id, pageId, type: block.type },
					message: `Block "${type}" hinzugefuegt`,
				};
			} catch (err) {
				if (err instanceof InvalidBlockPropsError) {
					return { success: false, message: `Invalid props fuer "${type}": ${err.message}` };
				}
				throw err;
			}
		},
	},

	{
		name: 'update_website_block',
		module: 'website',
		description:
			'Aktualisiert die props eines Blocks. patch ersetzt nur genannte Felder — der Rest bleibt.',
		parameters: [
			{ name: 'blockId', type: 'string', description: 'ID des Blocks', required: true },
			{ name: 'patch', type: 'object', description: 'Felder-Patch (JSON)', required: true },
		],
		async execute(params) {
			const blockId = stringOrEmpty(params.blockId);
			const patch = params.patch as Record<string, unknown> | undefined;
			if (!blockId || !patch || typeof patch !== 'object') {
				return { success: false, message: 'blockId und patch (Objekt) sind pflicht' };
			}
			try {
				await blocksStore.updateBlockProps(blockId, patch);
				return {
					success: true,
					data: { blockId, fields: Object.keys(patch) },
					message: `Block ${blockId} aktualisiert`,
				};
			} catch (err) {
				if (err instanceof InvalidBlockPropsError) {
					return { success: false, message: `Validierung fehlgeschlagen: ${err.message}` };
				}
				throw err;
			}
		},
	},

	{
		name: 'publish_website',
		module: 'website',
		description:
			'Veroeffentlicht die aktuelle Draft-Version. Besucher sehen die neuen Inhalte unter /s/{slug} binnen Sekunden.',
		parameters: [{ name: 'siteId', type: 'string', description: 'ID der Website', required: true }],
		async execute(params) {
			const siteId = stringOrEmpty(params.siteId);
			if (!siteId) return { success: false, message: 'siteId erforderlich' };

			try {
				const result = await sitesStore.publishSite(siteId);
				return {
					success: true,
					data: result,
					message: `Veroeffentlicht — ${result.publicUrl}`,
				};
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				return { success: false, message: `Publish fehlgeschlagen: ${msg}` };
			}
		},
	},

	// ─── Auto: read operations ─────────────────────────────

	{
		name: 'list_websites',
		module: 'website',
		description: 'Listet alle Websites im aktiven Space (id, slug, name, ob veroeffentlicht).',
		parameters: [],
		async execute() {
			const locals = await websitesTable.toArray();
			const visible = locals.filter((s) => !s.deletedAt);
			const rows = visible.map((s) => ({
				id: s.id,
				slug: s.slug,
				name: s.name,
				published: Boolean(s.publishedVersion),
				updatedAt: deriveUpdatedAt(s),
			}));
			return {
				success: true,
				data: { sites: rows },
				message: `${rows.length} Website(s) gelistet`,
			};
		},
	},

	{
		name: 'list_website_pages',
		module: 'website',
		description: 'Listet die Seiten einer Website (id, path, title, order).',
		parameters: [{ name: 'siteId', type: 'string', description: 'ID der Website', required: true }],
		async execute(params) {
			const siteId = stringOrEmpty(params.siteId);
			if (!siteId) return { success: false, message: 'siteId erforderlich' };

			const locals = await websitePagesTable.where('siteId').equals(siteId).toArray();
			const visible = locals
				.filter((p: LocalWebsitePage) => !p.deletedAt)
				.sort((a, b) => a.order - b.order);
			return {
				success: true,
				data: {
					pages: visible.map((p) => ({
						id: p.id,
						path: p.path,
						title: p.title,
						order: p.order,
					})),
				},
				message: `${visible.length} Seite(n)`,
			};
		},
	},

	{
		name: 'list_website_blocks',
		module: 'website',
		description:
			'Listet die Bloecke einer Seite (id, type, parentBlockId, slotKey, order, props-Snapshot).',
		parameters: [{ name: 'pageId', type: 'string', description: 'ID der Seite', required: true }],
		async execute(params) {
			const pageId = stringOrEmpty(params.pageId);
			if (!pageId) return { success: false, message: 'pageId erforderlich' };

			const locals = (await websiteBlocksTable
				.where('pageId')
				.equals(pageId)
				.toArray()) as LocalWebsiteBlock[];
			const visible = locals.filter((b) => !b.deletedAt).sort((a, b) => a.order - b.order);
			return {
				success: true,
				data: {
					blocks: visible.map((b) => ({
						id: b.id,
						type: b.type,
						parentBlockId: b.parentBlockId,
						slotKey: b.slotKey,
						order: b.order,
						props: b.props,
					})),
				},
				message: `${visible.length} Block/Bloecke`,
			};
		},
	},
];

// Silence unused-var: keep LocalWebsite imported so type augmentation elsewhere
// can reach it if needed later.
export type { LocalWebsite };
