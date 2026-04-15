#!/usr/bin/env node

/**
 * Audit Theme Tokens
 *
 * The Mana theme system standardizes on `--color-*` CSS custom properties
 * (defined in `packages/shared-tailwind/src/themes.css`). Earlier, components
 * ported from shadcn drifted into bare names (`--muted`, `--primary`, …) and
 * `--theme-*` prefixes, neither of which exist in the theme. Those
 * references silently fell back to nothing (or to literal fallbacks) and
 * stopped tracking the active theme variant.
 *
 * This audit greps Svelte/CSS/TS source files for those legacy patterns
 * and fails if any remain. Run in CI and lint-staged so the drift can't
 * sneak back in.
 *
 * Usage:
 *   node scripts/audit-theme-tokens.mjs
 */

import { readdirSync, statSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

const SCAN_ROOTS = ['apps', 'packages'];
const SCAN_EXTS = new Set(['.svelte', '.css', '.ts', '.tsx']);
const SKIP_DIRS = new Set([
	'node_modules',
	'dist',
	'build',
	'.svelte-kit',
	'.next',
	'.turbo',
	'.vercel',
	'.vite',
]);

// Shadcn-convention names that should be `--color-*` in this repo.
const SHADCN_TOKENS = [
	'muted',
	'muted-foreground',
	'primary',
	'primary-foreground',
	'secondary',
	'secondary-foreground',
	'accent',
	'accent-foreground',
	'foreground',
	'background',
	'border',
	'border-strong',
	'card',
	'card-foreground',
	'popover',
	'popover-foreground',
	'destructive',
	'destructive-foreground',
	'input',
	'ring',
	'surface',
	'surface-hover',
	'surface-elevated',
	'error',
	'success',
	'warning',
];

// Per-element inline custom properties and unrelated local vars that happen
// to collide on a word. Keeping this list narrow — add entries with care.
const ALLOWED_LOCAL_NAMES = new Set([
	'primary-color', // shared-auth-ui inline prop carrier
	'app-color',
	'btn-color',
	'tag-color',
	'content-bg',
	'ring-color',
]);

// Files we know carry module-literal brand accents (see themes.css §4 —
// brand/domain semantics stay as literals, not theme tokens).
const ALLOWED_FILES = new Set([
	'apps/mana/apps/web/src/lib/modules/news-research/ListView.svelte',
	'apps/mana/apps/web/src/routes/(app)/news-research/+page.svelte',
	// Agent template colors are set per-element via style="--accent: ..."
	'apps/mana/apps/web/src/routes/(app)/agents/templates/+page.svelte',
]);

const bareTokenRe = new RegExp(`var\\(--(${SHADCN_TOKENS.join('|')})\\s*[,)]`, 'g');
const themePrefixRe = /var\(--theme-[a-z-]+\s*[,)]/g;

function* walk(dir) {
	let entries;
	try {
		entries = readdirSync(dir);
	} catch {
		return;
	}
	for (const name of entries) {
		if (SKIP_DIRS.has(name)) continue;
		const full = join(dir, name);
		let st;
		try {
			st = statSync(full);
		} catch {
			continue;
		}
		if (st.isDirectory()) {
			yield* walk(full);
		} else if (SCAN_EXTS.has(name.slice(name.lastIndexOf('.')))) {
			yield full;
		}
	}
}

function* findViolations(filePath) {
	const rel = filePath.slice(ROOT.length + 1);
	if (ALLOWED_FILES.has(rel)) return;

	let content;
	try {
		content = readFileSync(filePath, 'utf8');
	} catch {
		return;
	}

	const lines = content.split('\n');

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		// Skip var(--color-*) — those are correct. We also skip the
		// redefinition block inside @theme in themes.css itself.
		for (const m of line.matchAll(bareTokenRe)) {
			const match = m[0];
			// Ignore if this is actually var(--color-X) with a shared suffix
			// (regex doesn't match because of the leading `--color-`, but be
			// doubly safe in case of future edits).
			if (match.startsWith('var(--color-')) continue;
			yield { line: i + 1, col: m.index + 1, text: line.trim(), kind: 'shadcn' };
		}

		for (const m of line.matchAll(themePrefixRe)) {
			yield { line: i + 1, col: m.index + 1, text: line.trim(), kind: 'theme-prefix' };
		}
	}
}

let totalFiles = 0;
let violationCount = 0;
const byFile = new Map();

for (const sub of SCAN_ROOTS) {
	for (const file of walk(join(ROOT, sub))) {
		totalFiles++;
		const hits = [...findViolations(file)];
		if (hits.length === 0) continue;

		// Second-level filter: ALLOWED_LOCAL_NAMES (collision guard).
		const filtered = hits.filter((h) => {
			if (h.kind !== 'shadcn') return true;
			const nameMatch = h.text.match(/var\(--([a-z-]+)/);
			if (!nameMatch) return true;
			return !ALLOWED_LOCAL_NAMES.has(nameMatch[1]);
		});
		if (filtered.length === 0) continue;

		byFile.set(file.slice(ROOT.length + 1), filtered);
		violationCount += filtered.length;
	}
}

if (violationCount === 0) {
	console.log(
		`${GREEN}✓${RESET} Theme tokens clean — scanned ${totalFiles} files, no bare ${BOLD}--muted${RESET}/${BOLD}--primary${RESET}/${BOLD}--theme-*${RESET} references.`
	);
	process.exit(0);
}

console.log(
	`${RED}✗${RESET} Found ${BOLD}${violationCount}${RESET} theme-token violation${violationCount === 1 ? '' : 's'} across ${byFile.size} file${byFile.size === 1 ? '' : 's'}:\n`
);

for (const [file, hits] of byFile) {
	console.log(`${BOLD}${file}${RESET}`);
	for (const h of hits) {
		const tag =
			h.kind === 'theme-prefix' ? `${YELLOW}theme-prefix${RESET}` : `${YELLOW}shadcn${RESET}`;
		console.log(`  ${DIM}${h.line}:${h.col}${RESET}  [${tag}]  ${h.text}`);
	}
	console.log();
}

console.log(
	`${DIM}Fix: replace bare tokens with --color-* equivalents. Example:${RESET}
  ${RED}-${RESET} background: hsl(var(--muted));
  ${GREEN}+${RESET} background: hsl(var(--color-muted));

${DIM}Or for shadcn-style inline fallbacks:${RESET}
  ${RED}-${RESET} color: var(--foreground, #111);
  ${GREEN}+${RESET} color: hsl(var(--color-foreground));

${DIM}See packages/shared-tailwind/src/themes.css for the full token list.${RESET}
`
);

process.exit(1);
