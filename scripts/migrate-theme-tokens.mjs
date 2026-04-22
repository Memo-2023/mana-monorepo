#!/usr/bin/env node
/**
 * One-shot migration: replace raw Tailwind neutral-palette + white-alpha
 * utilities with theme tokens across the unified Mana web app.
 *
 * This is a surgical codemod, not a general-purpose tool. The mappings
 * encode a specific design decision: `bg-gray-800` = `bg-card`, etc.
 * Re-running is a no-op once the codebase is clean.
 *
 * Usage:
 *   node scripts/migrate-theme-tokens.mjs [--dry-run]
 *
 * The mappings are ordered by specificity — longer patterns first so
 * `bg-gray-700/50` is tried before `bg-gray-700`.
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');

const SCAN_GLOBS = [
	'apps/mana/apps/web/src/lib/modules/**/*.svelte',
	'apps/mana/apps/web/src/routes/(app)/**/*.svelte',
];

/**
 * Files where `bg-white/N`, `text-white/N`, etc. are brand-literal overlays
 * on vivid gradient backgrounds, not theme-intent. These stay untouched
 * and are allowlisted in the validator via scoped <style> migration.
 */
const EXCLUDE_PATHS = new Set([
	'apps/mana/apps/web/src/lib/modules/moodlit/components/mood/MoodFullscreen.svelte',
	'apps/mana/apps/web/src/lib/modules/moodlit/components/mood/MoodCard.svelte',
	'apps/mana/apps/web/src/lib/modules/moodlit/components/mood/CreateMoodDialog.svelte',
]);

/**
 * Each entry: [regex, replacement]. Regex MUST use `\b` or class-boundary
 * anchors so we don't accidentally rewrite inside longer identifiers.
 * The boundary pattern `(?<=^|[\s:"'\`])` ensures the match starts at a
 * class boundary (space, colon for variant prefixes, quote char).
 */
const B = String.raw`(?<=^|[\s:"'\`])`; // class-boundary lookbehind

const MAPPINGS = [
	// ─── Backgrounds: surfaces ────────────────────────────────────
	// Dark modals/cards use gray-800/900 as surface.
	[new RegExp(`${B}bg-gray-900\\b`, 'g'), 'bg-card'],
	[new RegExp(`${B}bg-gray-800\\b`, 'g'), 'bg-card'],
	[new RegExp(`${B}bg-neutral-900\\b`, 'g'), 'bg-card'],
	[new RegExp(`${B}bg-neutral-800\\b`, 'g'), 'bg-card'],
	[new RegExp(`${B}bg-slate-900\\b`, 'g'), 'bg-card'],
	[new RegExp(`${B}bg-slate-800\\b`, 'g'), 'bg-card'],
	[new RegExp(`${B}bg-zinc-900\\b`, 'g'), 'bg-card'],
	[new RegExp(`${B}bg-zinc-800\\b`, 'g'), 'bg-card'],
	[new RegExp(`${B}bg-stone-900\\b`, 'g'), 'bg-card'],
	[new RegExp(`${B}bg-stone-800\\b`, 'g'), 'bg-card'],

	// Mid-grays are muted surfaces. Preserve opacity suffix.
	[new RegExp(`${B}bg-gray-(?:700|600)\\/(\\d+)\\b`, 'g'), 'bg-muted/$1'],
	[new RegExp(`${B}bg-gray-(?:700|600)\\b`, 'g'), 'bg-muted'],
	[new RegExp(`${B}bg-neutral-(?:700|600)\\/(\\d+)\\b`, 'g'), 'bg-muted/$1'],
	[new RegExp(`${B}bg-neutral-(?:700|600)\\b`, 'g'), 'bg-muted'],
	[new RegExp(`${B}bg-slate-(?:700|600)\\/(\\d+)\\b`, 'g'), 'bg-muted/$1'],
	[new RegExp(`${B}bg-slate-(?:700|600)\\b`, 'g'), 'bg-muted'],
	[new RegExp(`${B}bg-zinc-(?:700|600)\\/(\\d+)\\b`, 'g'), 'bg-muted/$1'],
	[new RegExp(`${B}bg-zinc-(?:700|600)\\b`, 'g'), 'bg-muted'],
	[new RegExp(`${B}bg-stone-(?:700|600)\\/(\\d+)\\b`, 'g'), 'bg-muted/$1'],
	[new RegExp(`${B}bg-stone-(?:700|600)\\b`, 'g'), 'bg-muted'],

	// Light grays 100-500 — same bucket (rarely used in dark-first design).
	[
		new RegExp(`${B}bg-(?:gray|slate|zinc|neutral|stone)-(?:500|400|300|200|100|50)\\b`, 'g'),
		'bg-muted',
	],

	// ─── Borders ─────────────────────────────────────────────────
	[
		new RegExp(`${B}border-(?:gray|slate|zinc|neutral|stone)-(?:700|800|900)\\/(\\d+)\\b`, 'g'),
		'border-border/$1',
	],
	[
		new RegExp(`${B}border-(?:gray|slate|zinc|neutral|stone)-(?:700|800|900)\\b`, 'g'),
		'border-border',
	],
	[new RegExp(`${B}border-(?:gray|slate|zinc|neutral|stone)-(?:600)\\b`, 'g'), 'border-border'],
	[
		new RegExp(`${B}border-(?:gray|slate|zinc|neutral|stone)-(?:500|400|300|200|100)\\b`, 'g'),
		'border-border-strong',
	],

	// ─── Text ─────────────────────────────────────────────────────
	// Dark text on light bg (gray-900/800) = foreground.
	[new RegExp(`${B}text-(?:gray|slate|zinc|neutral|stone)-(?:900|800)\\b`, 'g'), 'text-foreground'],
	// text-gray-200/100 on dark bg = foreground
	[new RegExp(`${B}text-(?:gray|slate|zinc|neutral|stone)-(?:200|100)\\b`, 'g'), 'text-foreground'],
	// text-gray-300 = foreground/90 (slightly muted primary text)
	[new RegExp(`${B}text-(?:gray|slate|zinc|neutral|stone)-300\\b`, 'g'), 'text-foreground/90'],
	// text-gray-400/500/600/700 = muted-foreground (labels, captions)
	[
		new RegExp(`${B}text-(?:gray|slate|zinc|neutral|stone)-(?:400|500|700)\\b`, 'g'),
		'text-muted-foreground',
	],
	[
		new RegExp(`${B}text-(?:gray|slate|zinc|neutral|stone)-600\\b`, 'g'),
		'text-muted-foreground/70',
	],

	// ─── Placeholders ────────────────────────────────────────────
	[
		new RegExp(`${B}placeholder-(?:gray|slate|zinc|neutral|stone)-(?:400|500|600)\\b`, 'g'),
		'placeholder:text-muted-foreground/60',
	],
	[
		new RegExp(`${B}placeholder:text-(?:gray|slate|zinc|neutral|stone)-(?:400|500|600)\\b`, 'g'),
		'placeholder:text-muted-foreground/60',
	],

	// ─── Hover/Focus variants ────────────────────────────────────
	// Handled uniformly because the boundary lookbehind already matches
	// after `hover:`, `focus:`, `active:`, `group-hover:`, etc.

	// ─── White-alpha utilities ───────────────────────────────────
	// Preserve opacity modifier as given.
	[new RegExp(`${B}bg-white\\/(\\d+)\\b`, 'g'), 'bg-muted/$1'],
	[new RegExp(`${B}border-white\\/(\\d+)\\b`, 'g'), 'border-border/$1'],
	// Text: /70+ = foreground, /30-60 = muted-foreground
	[new RegExp(`${B}text-white\\/(?:90|80|70)\\b`, 'g'), 'text-foreground'],
	[new RegExp(`${B}text-white\\/(?:60|50|40)\\b`, 'g'), 'text-muted-foreground'],
	[new RegExp(`${B}text-white\\/(?:30|20|10)\\b`, 'g'), 'text-muted-foreground/70'],
];

function listFiles() {
	const args = SCAN_GLOBS.map((g) => `"${g}"`).join(' ');
	const out = execSync(`git ls-files ${args}`, {
		cwd: REPO_ROOT,
		encoding: 'utf8',
	});
	return out
		.split('\n')
		.map((p) => p.trim())
		.filter(Boolean);
}

function migrate() {
	const paths = listFiles();
	let changedFiles = 0;
	let totalSubs = 0;

	for (const rel of paths) {
		if (EXCLUDE_PATHS.has(rel)) continue;
		const abs = join(REPO_ROOT, rel);
		let src = readFileSync(abs, 'utf8');
		let fileSubs = 0;

		for (const [pattern, replacement] of MAPPINGS) {
			const before = src;
			src = src.replace(pattern, replacement);
			if (src !== before) {
				// Count replacements this rule made.
				const matches = before.match(pattern);
				fileSubs += matches ? matches.length : 0;
			}
		}

		if (fileSubs > 0) {
			changedFiles++;
			totalSubs += fileSubs;
			if (!DRY_RUN) writeFileSync(abs, src, 'utf8');
			console.log(`  ${fileSubs.toString().padStart(4)} subs  ${rel}`);
		}
	}

	const verb = DRY_RUN ? 'Would migrate' : 'Migrated';
	console.log(`\n${verb} ${totalSubs} token(s) across ${changedFiles} file(s).`);
	if (DRY_RUN) console.log('Run without --dry-run to apply.');
}

migrate();
