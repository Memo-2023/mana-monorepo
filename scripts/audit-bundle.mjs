#!/usr/bin/env node
/**
 * Audit the unified Mana web-app production bundle.
 *
 * Reads `.svelte-kit/output/client/_app/immutable/*` after `pnpm build`
 * and reports size distribution by category + the biggest chunks, with
 * hints about what's likely in each chunk.
 *
 * No extra deps: pure Node ESM walking the disk. Vite + SvelteKit have
 * already done the code-splitting work by the time we read the output;
 * this script just surfaces it.
 *
 * Usage:
 *   pnpm --filter @mana/web build   # prerequisite
 *   node scripts/audit-bundle.mjs
 *   node scripts/audit-bundle.mjs --top 30    # show top N chunks
 *   node scripts/audit-bundle.mjs --summary   # category totals only
 *
 * Bucketing:
 *   - entry    : first JS a browser loads on cold visit (app + start).
 *   - nodes    : per-route layout/page bundles (lazy by route).
 *   - chunks   : shared code-split modules (loaded on demand by import).
 *   - workers  : Web Worker bundles + their assets (incl. WASM).
 *   - assets   : static assets (CSS, fonts, images).
 *
 * Flags: chunks > 200KB that aren't inside `workers/` or `nodes/` are
 * worth inspecting — they're eagerly reachable from the shared runtime
 * and contribute to every cold load's cost (unless behind a dynamic
 * import, which appears as a separate chunk the browser only fetches
 * when triggered).
 */

import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const OUT = join(REPO_ROOT, 'apps/mana/apps/web/.svelte-kit/output/client/_app/immutable');
const SERVER_MANIFEST = join(REPO_ROOT, 'apps/mana/apps/web/.svelte-kit/output/server/manifest.js');

/** Parse `/(app)/invoices/[id]` route → node-index pairs from the server
 *  manifest so we can map bundle filenames back to SvelteKit routes. */
function loadRouteMap() {
	const map = new Map(); // nodeIndex → routeId
	if (!existsSync(SERVER_MANIFEST)) return map;
	const src = readFileSync(SERVER_MANIFEST, 'utf8');
	// Matches the routes block entries like:
	//   id: "/(app)/invoices/[id]",
	//   ...
	//   page: { ..., leaf: 118 }
	const entryRe = /id:\s*"([^"]+)"[\s\S]*?leaf:\s*(\d+)/g;
	let m;
	while ((m = entryRe.exec(src)) !== null) {
		map.set(Number(m[2]), m[1]);
	}
	return map;
}

const args = process.argv.slice(2);
const SUMMARY = args.includes('--summary');
const TOP_IDX = args.indexOf('--top');
const TOP_N = TOP_IDX >= 0 ? Number(args[TOP_IDX + 1] || 15) : 15;

function walk(dir, rel = '') {
	const out = [];
	for (const ent of readdirSync(dir, { withFileTypes: true })) {
		const p = join(dir, ent.name);
		const r = rel ? `${rel}/${ent.name}` : ent.name;
		if (ent.isDirectory()) out.push(...walk(p, r));
		else if (ent.isFile()) {
			const size = statSync(p).size;
			out.push({ abs: p, rel: r, size });
		}
	}
	return out;
}

function classify(rel) {
	if (rel.startsWith('entry/')) return 'entry';
	if (rel.startsWith('nodes/')) return 'nodes';
	if (rel.startsWith('workers/')) return 'workers';
	if (rel.startsWith('assets/')) return 'assets';
	if (rel.startsWith('chunks/')) return 'chunks';
	return 'other';
}

function fmtKB(bytes) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/** Heuristic hint at what a chunk contains, based on a longer read. */
function contentHint(abs) {
	try {
		const buf = readFileSync(abs, 'utf8').slice(0, 2000);
		const pairs = [
			[/@huggingface\/transformers|transformers\.|TransformersJS/, 'transformers.js'],
			[/adjacency.?graphs?|azerty:\{0:\["/i, 'zxcvbn keyboard graphs'],
			[/ich,sie,das,ist,du,nicht|dictionaryRaw|frequencyLists/, 'zxcvbn language dictionary'],
			[/tiptap|ProseMirror|prosemirror/i, 'tiptap / prosemirror'],
			[/pdfLib|PDFDocument|%PDF-/i, 'pdf-lib'],
			[/swissqrbill|swissqr|IBAN|QR-IBAN/i, 'swissqrbill'],
			[/RRule|\bBYSETPOS\b|FREQ=DAILY/, 'rrule'],
			[/suncalc|solarTimes|sunrise/, 'suncalc'],
			[/dexie|_dbSchema|IDBObjectStore/, 'dexie'],
			[/marked|lexer\.Token|parseInline/, 'marked'],
			[/\bpako_inflate\b|\bpako\.deflate\b|\bZLIB\b/, 'pako'],
			[/date-fns|format\w+\(|parseISO/, 'date-fns'],
			[/zod|ZodError|z\.object/, 'zod'],
			[/svelte-dnd-action|dndzone/, 'svelte-dnd-action'],
			[/svelte-i18n|addMessages|register\(/, 'svelte-i18n'],
			[/wasm|WebAssembly/i, 'WASM module'],
			// Phosphor icon sprites — the chunk literally contains `<path d="..."`.
			[/<path d="M[^"]{40,}/, '@mana/shared-icons (SVG paths)'],
			// Vite's dynamic-import dep graph — a large `__vite__mapDeps` is
			// just import-map metadata, not real code.
			[/^const __vite__mapDeps=\(i,m=__vite__mapDeps/, 'Vite __vite__mapDeps graph'],
		];
		for (const [re, label] of pairs) if (re.test(buf)) return label;
	} catch {
		// binary / unreadable
	}
	return '—';
}

function audit() {
	if (!existsSync(OUT)) {
		console.error('✗ No build output found. Run: pnpm --filter @mana/web build');
		process.exit(2);
	}

	const files = walk(OUT);
	const byCategory = new Map();
	let total = 0;
	for (const f of files) {
		const cat = classify(f.rel);
		byCategory.set(cat, (byCategory.get(cat) ?? 0) + f.size);
		total += f.size;
	}

	console.log(`\n── Bundle audit ───────────────────────────────────────\n`);
	console.log(`Total immutable output: ${fmtKB(total)}  (${files.length} files)`);
	console.log('');
	console.log(`By category:`);
	const catOrder = ['entry', 'nodes', 'chunks', 'workers', 'assets', 'other'];
	for (const cat of catOrder) {
		const bytes = byCategory.get(cat) ?? 0;
		if (bytes === 0) continue;
		const pct = ((bytes / total) * 100).toFixed(0).padStart(3);
		console.log(`  ${cat.padEnd(8)} ${fmtKB(bytes).padStart(10)}  ${pct}%`);
	}
	console.log('');

	if (SUMMARY) return;

	const routeMap = loadRouteMap();

	// Top N files by size, excluding assets (static = noise) and workers/assets (WASM).
	const topFiles = files
		.filter((f) => f.rel.endsWith('.js'))
		.sort((a, b) => b.size - a.size)
		.slice(0, TOP_N);
	console.log(`Top ${topFiles.length} JS files by size (category + heuristic hint):\n`);
	for (const f of topFiles) {
		const cat = classify(f.rel);
		let hint = '—';
		if (cat === 'nodes') {
			const nodeIdx = Number(f.rel.match(/nodes\/(\d+)\./)?.[1]);
			const route = routeMap.get(nodeIdx);
			hint = route ? `route ${route}` : 'route bundle';
		} else if (cat !== 'assets') {
			hint = contentHint(f.abs);
		}
		const flag = cat === 'chunks' && f.size > 200 * 1024 ? ' ⚠ eager?' : '';
		console.log(
			`  ${fmtKB(f.size).padStart(9)}  ${cat.padEnd(7)}  ${hint.padEnd(36)}  ${f.rel}${flag}`
		);
	}
	console.log('');

	const topAssets = files
		.filter((f) => !f.rel.endsWith('.js') && !f.rel.endsWith('.css'))
		.sort((a, b) => b.size - a.size)
		.slice(0, 5);
	if (topAssets.length > 0) {
		console.log(`Largest non-JS/CSS assets:\n`);
		for (const f of topAssets) {
			console.log(`  ${fmtKB(f.size).padStart(9)}  ${f.rel}`);
		}
		console.log('');
	}

	console.log(
		`Hint: chunks marked ⚠ are ≥200 KB and in the shared 'chunks/' dir. They may be\n` +
			`reachable from the shared runtime (loaded eagerly on any cold visit) rather than\n` +
			`behind a dynamic import. Inspect the producing module and wrap with await import()\n` +
			`if appropriate. Chunks in nodes/ are route-scoped (lazy by route); workers/ are\n` +
			`Web-Worker-scoped (lazy until the worker is instantiated).\n`
	);
}

audit();
