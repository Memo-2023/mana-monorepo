#!/usr/bin/env node
/**
 * Validate that every Drizzle table declaration uses `pgSchema('x').table(...)`
 * instead of raw `pgTable(...)`.
 *
 * Why: `mana_platform` is one shared Postgres database for every service.
 * Without schema namespacing, a `users` table in one service collides with
 * `users` in another. The rule is in `.claude/guidelines/database.md` but
 * was enforced only by convention until now — a new service could slip
 * a raw `pgTable()` past review and pollute the default `public` schema.
 *
 * Rule: no call-site of `pgTable(` may appear in TypeScript under
 * `services/`, `apps/api/`, or `packages/`. Imports of the symbol are
 * ignored (they can still be useful for types), only actual calls are
 * violations.
 *
 * Exception list: none. `mana-sync` is Go; it has no .ts schema files
 * to begin with. Projection tables on top of `mana_sync` (e.g.
 * `mana-ai`'s mission_snapshots) use `pgSchema('mana_ai').table(...)`
 * to stay out of the core sync namespace.
 *
 * Zero deps — plain Node ESM. Uses `git ls-files` so node_modules and
 * build output are auto-excluded.
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

/** Directories we scan for schema files. */
const SCAN_GLOBS = ['services/**/*.ts', 'apps/api/**/*.ts', 'packages/**/*.ts'];

/** Paths we never flag. `node_modules` and `dist` are already filtered by
 *  `git ls-files`; this is for in-tree exceptions. */
const ALLOWLIST_PATHS = [
	// `dist/` directories that slipped into git. Defensive — shouldn't exist.
	/\/dist\//,
];

function listTsFiles() {
	const out = execSync(`git ls-files ${SCAN_GLOBS.map((g) => `"${g}"`).join(' ')}`, {
		cwd: REPO_ROOT,
		encoding: 'utf8',
	});
	return out
		.split('\n')
		.map((p) => p.trim())
		.filter(Boolean)
		.filter((p) => !ALLOWLIST_PATHS.some((re) => re.test(p)));
}

/**
 * Strip // line comments and /* block comments *\/ so a doc-comment
 * mentioning `pgTable()` doesn't trigger a false positive.
 */
function stripComments(source) {
	return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

function validate() {
	const files = listTsFiles();
	const violations = [];
	let scanned = 0;

	for (const rel of files) {
		scanned++;
		const abs = join(REPO_ROOT, rel);
		let source;
		try {
			source = readFileSync(abs, 'utf8');
		} catch {
			continue; // deleted between ls-files and read
		}
		const stripped = stripComments(source);
		// Find each line that calls `pgTable(`. Import lines look like
		// `import { pgTable } from ...` — they never have `pgTable(` so
		// they're auto-excluded by this regex.
		const lines = stripped.split('\n');
		for (let i = 0; i < lines.length; i++) {
			if (/\bpgTable\s*\(/.test(lines[i])) {
				violations.push(
					`${rel}:${i + 1}: raw \`pgTable(\` call — use \`pgSchema('<name>').table(...)\` instead. ` +
						`See .claude/guidelines/database.md §"Schema Isolation".`
				);
			}
		}
	}

	if (violations.length > 0) {
		console.error(`\n✗ pgSchema isolation check FAILED (${violations.length} violation(s)):\n`);
		for (const v of violations) console.error(`  • ${v}`);
		console.error(
			`\nEvery Drizzle table in this monorepo must live under its own Postgres schema. ` +
				`A raw \`pgTable()\` call drops the table into the default \`public\` schema and ` +
				`risks colliding with other services sharing \`mana_platform\`.\n`
		);
		process.exit(1);
	}

	console.log(
		`✓ No raw pgTable() calls: scanned ${scanned} TypeScript files under services/, apps/api/, packages/.`
	);
}

validate();
