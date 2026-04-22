#!/usr/bin/env node
/**
 * Audit @mana/shared-icons usage to inform the tree-shaking migration.
 *
 * The shared-icons package re-exports phosphor-svelte via a barrel
 * (`export * from 'phosphor-svelte'`). Each phosphor-svelte component
 * inlines ALL SIX weight variants (thin / light / regular / bold /
 * fill / duotone) because the weight is a runtime prop. So importing
 * `<House weight="bold" />` still ships the other five paths.
 *
 * Result: the prod bundle has ~466 KB of icon path data across two
 * chunks (`chunks/*.js` with `<path d="M..." />` bodies).
 *
 * This audit reports:
 *   - Which icons are actually used, sorted by frequency (top N).
 *   - Which weights each icon uses (to gauge how much of the 6x
 *     weight-per-icon cost is actually exercised at runtime).
 *   - Files with the most icon imports (worth splitting first if they
 *     end up in the shared chunk).
 *
 * Usage:
 *   node scripts/audit-icon-usage.mjs
 *   node scripts/audit-icon-usage.mjs --top 30
 */

import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const WEB_SRC = join(REPO_ROOT, 'apps/mana/apps/web/src');

const args = process.argv.slice(2);
const TOP_IDX = args.indexOf('--top');
const TOP_N = TOP_IDX >= 0 ? Number(args[TOP_IDX + 1] || 30) : 30;

const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.svelte-kit']);

function walk(dir, collect) {
	for (const ent of readdirSync(dir, { withFileTypes: true })) {
		if (SKIP_DIRS.has(ent.name)) continue;
		const p = join(dir, ent.name);
		if (ent.isDirectory()) walk(p, collect);
		else if (ent.isFile() && /\.(svelte|ts|tsx|js)$/.test(ent.name)) collect(p);
	}
}

function audit() {
	const files = [];
	walk(WEB_SRC, (p) => files.push(p));

	const iconFrequency = new Map(); // name → count
	const perFile = new Map(); // file → Set<name>
	const weightsUsed = new Map(); // name → Set<weight>

	const importRe = /import\s*\{([^}]+)\}\s*from\s*['"]@mana\/shared-icons['"]/g;
	const weightRe = /<\s*([A-Z]\w+)[^>]*\bweight\s*=\s*["']?(\w+)["']?/g;

	for (const file of files) {
		const src = readFileSync(file, 'utf8');

		let m;
		importRe.lastIndex = 0;
		while ((m = importRe.exec(src)) !== null) {
			const names = m[1]
				.split(',')
				.map((n) => n.trim().split(/\s+as\s+/)[0])
				.filter(Boolean);
			for (const n of names) {
				iconFrequency.set(n, (iconFrequency.get(n) ?? 0) + 1);
				const rel = file.slice(REPO_ROOT.length + 1);
				if (!perFile.has(rel)) perFile.set(rel, new Set());
				perFile.get(rel).add(n);
			}
		}

		weightRe.lastIndex = 0;
		while ((m = weightRe.exec(src)) !== null) {
			const [, name, weight] = m;
			if (!weightsUsed.has(name)) weightsUsed.set(name, new Set());
			weightsUsed.get(name).add(weight);
		}
	}

	const ranked = [...iconFrequency.entries()].sort((a, b) => b[1] - a[1]);

	console.log(`\n── Icon usage audit ───────────────────────────────────\n`);
	console.log(`Distinct icons imported: ${iconFrequency.size}`);
	console.log(`Files importing icons:   ${perFile.size}`);
	console.log(
		`Bundle cost (estimated): ${(iconFrequency.size * 6 * 0.7).toFixed(0)} KB ` +
			`(${iconFrequency.size} icons × 6 weights × ~0.7 KB each path)`
	);
	console.log('');

	console.log(`Top ${Math.min(TOP_N, ranked.length)} icons by import count:\n`);
	for (const [name, count] of ranked.slice(0, TOP_N)) {
		const weights = weightsUsed.get(name);
		const wStr = weights && weights.size > 0 ? `weights: ${[...weights].sort().join(', ')}` : '—';
		console.log(`  ${String(count).padStart(4)}×  ${name.padEnd(28)}  ${wStr}`);
	}
	console.log('');

	// Weight distribution (how many icons use each weight at all)
	const weightCounts = new Map();
	for (const [, weights] of weightsUsed) {
		for (const w of weights) weightCounts.set(w, (weightCounts.get(w) ?? 0) + 1);
	}
	console.log(`Weights actually used across the codebase:\n`);
	for (const [weight, count] of [...weightCounts.entries()].sort((a, b) => b[1] - a[1])) {
		console.log(`  ${weight.padEnd(10)} ${count} icon(s)`);
	}
	const defaultWeight = iconFrequency.size - (weightCounts.get('regular') ?? 0);
	console.log(`  (unset/default) ~${defaultWeight} icon(s) use the default "regular" weight`);
	console.log('');

	const topFiles = [...perFile.entries()].sort((a, b) => b[1].size - a[1].size).slice(0, 10);
	console.log(`Top 10 files by distinct-icon count:\n`);
	for (const [file, icons] of topFiles) {
		console.log(`  ${String(icons.size).padStart(3)} icons  ${file}`);
	}
	console.log('');

	console.log(
		`Migration path to reduce the 466 KB icon chunks:\n\n` +
			`  1. Change @mana/shared-icons/src/index.ts to drop \`export * from\n` +
			`     'phosphor-svelte'\` — require per-icon re-exports of only the\n` +
			`     ${iconFrequency.size} icons actually used.\n\n` +
			`  2. OR migrate callers to import directly from phosphor-svelte's\n` +
			`     per-icon paths: \`import House from 'phosphor-svelte/House'\`.\n\n` +
			`  3. Longest-term: build a custom icon set that only ships the\n` +
			`     weights actually used (most icons only use "regular" or "bold").\n`
	);
}

audit();
