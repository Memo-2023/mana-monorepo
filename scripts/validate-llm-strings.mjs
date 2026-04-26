#!/usr/bin/env node

/**
 * Validate that no consumer code hardcodes provider/model strings.
 *
 * After M5 of `docs/plans/llm-fallback-aliases.md`, every backend caller
 * should request models via the `mana/<class>` aliases (resolved server-
 * side by mana-llm). Bare `provider/model` strings (`ollama/gemma3:4b`,
 * `groq/llama-3.3-70b-versatile`, …) are a sign someone bypassed the
 * registry — that path skips fallback, the health-cache, and the alias-
 * resolution metrics.
 *
 * The two legitimate places to keep concrete model strings are:
 *
 *   - `services/mana-llm/aliases.yaml` — the registry itself
 *   - `services/mana-llm/**` — provider adapters, tests, fixtures
 *
 * Anything else fails the check. Add the file to ALLOWED_PATHS below
 * with a comment if you have a justified reason.
 *
 * Usage:
 *   node scripts/validate-llm-strings.mjs
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import { dirname, join, relative, sep } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

const SCAN_ROOTS = ['apps', 'services', 'packages'];
const SCAN_EXTS = new Set(['.ts', '.tsx', '.mts', '.cts']);
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

/**
 * Paths (POSIX-form, relative to repo root) that are allowed to contain
 * concrete provider/model strings. Use slashes — the matcher normalises
 * Windows separators.
 */
const ALLOWED_PATHS = [
	// The registry itself.
	'services/mana-llm/aliases.yaml',

	// mana-llm internals: provider adapters, router, config, tests.
	'services/mana-llm/',

	// Picture module routes route between IMAGE generators (gpt-image,
	// gemini-3-pro-image-preview, …) — those are not LLM chat models
	// and don't go through mana-llm's chat-completions endpoint.
	'apps/api/src/modules/picture/routes.ts',

	// generate-who-dossiers is an admin script with an explicit
	// `--model <name>` flag; the operator deliberately picks a strong
	// model for one-shot dossier authoring. Aliasing wouldn't help.
	'apps/api/scripts/generate-who-dossiers.ts',

	// Chat / who modules INSPECT user-supplied model strings to gate
	// behaviour (prefix checks like `model.startsWith('ollama/')`); they
	// don't pick a model themselves.
	'apps/api/src/modules/chat/routes.ts',
	'apps/api/src/modules/who/routes.ts',

	// Picture-Workbench client-side path (browser): the user picks a
	// concrete image model from a dropdown.
	'apps/mana/apps/web/src/lib/modules/picture/',

	// llm-test playground in the web app — explicit model picker.
	'apps/mana/apps/web/src/routes/(app)/llm-test/',

	// Validators / scripts can reference example strings in their own
	// docstrings.
	'scripts/',

	// SSOT alias-constant file.
	'packages/shared-ai/src/llm-aliases.ts',
];

/**
 * Concrete provider strings the validator hunts for. The pattern is a
 * literal `<provider>/...` token in source; matched by a regex that
 * requires a quote / backtick before the slash so we don't fire on
 * import paths like `from '../ollama/foo'`.
 */
const PROVIDERS = ['ollama', 'groq', 'openrouter', 'together'];
// `google/` is intentionally not in PROVIDERS — Google is the namespace
// for both Gemini text models AND Nano-Banana image models. Matching it
// would yield too many false positives in image code paths.

const PROVIDER_RE = new RegExp(`(?<=['"\`])(?:${PROVIDERS.join('|')})/[a-zA-Z0-9_:.\\-]+`, 'g');

function walk(dir, hits = []) {
	let entries;
	try {
		entries = readdirSync(dir);
	} catch {
		return hits;
	}
	for (const name of entries) {
		if (SKIP_DIRS.has(name)) continue;
		const path = join(dir, name);
		let st;
		try {
			st = statSync(path);
		} catch {
			continue;
		}
		if (st.isDirectory()) walk(path, hits);
		else if (st.isFile()) {
			const dot = name.lastIndexOf('.');
			if (dot < 0) continue;
			const ext = name.slice(dot);
			if (SCAN_EXTS.has(ext)) hits.push(path);
		}
	}
	return hits;
}

function isAllowed(relPath) {
	const norm = relPath.split(sep).join('/');
	return ALLOWED_PATHS.some((p) => (p.endsWith('/') ? norm.startsWith(p) : norm === p));
}

const violations = [];
let scanned = 0;

for (const subdir of SCAN_ROOTS) {
	const root = join(ROOT, subdir);
	for (const file of walk(root)) {
		scanned += 1;
		const rel = relative(ROOT, file);
		if (isAllowed(rel)) continue;
		const src = readFileSync(file, 'utf8');
		PROVIDER_RE.lastIndex = 0;
		let m;
		while ((m = PROVIDER_RE.exec(src)) !== null) {
			// Compute 1-based line number of the match.
			const lineNo = src.slice(0, m.index).split('\n').length;
			violations.push({ file: rel, line: lineNo, match: m[0] });
		}
	}
}

if (violations.length === 0) {
	console.log(
		`${GREEN}✓${RESET} LLM strings clean — scanned ${BOLD}${scanned}${RESET} files, ` +
			`no hardcoded provider/model strings found outside the SSOT.`
	);
	process.exit(0);
}

console.log();
console.log(`${RED}${BOLD}✗ Hardcoded provider/model strings found.${RESET}`);
console.log();
console.log(
	`${DIM}These should use ${BOLD}MANA_LLM.<class>${RESET}${DIM} aliases instead. ` +
		`The aliases resolve via ${BOLD}services/mana-llm/aliases.yaml${RESET}${DIM} ` +
		`with health-aware fallback.${RESET}`
);
console.log(
	`${DIM}If a site genuinely needs a concrete model, add the file path to ` +
		`${BOLD}ALLOWED_PATHS${RESET}${DIM} in ` +
		`${BOLD}scripts/validate-llm-strings.mjs${RESET}${DIM} with a comment.${RESET}`
);
console.log();

const grouped = new Map();
for (const v of violations) {
	if (!grouped.has(v.file)) grouped.set(v.file, []);
	grouped.get(v.file).push(v);
}
for (const [file, list] of grouped) {
	console.log(`${YELLOW}${file}${RESET}`);
	for (const v of list) {
		console.log(`  ${DIM}:${v.line}${RESET}  ${v.match}`);
	}
}
console.log();
console.log(
	`${RED}Total: ${violations.length} violation(s) across ${grouped.size} file(s).${RESET}`
);
process.exit(1);
