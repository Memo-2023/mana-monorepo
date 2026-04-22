#!/usr/bin/env node
/**
 * Audit test-file presence across modules. Which modules have zero
 * test files? Which have comprehensive coverage?
 *
 * This is a file-level heuristic, not a line-coverage metric — running
 * `vitest --coverage` is the real thing, but:
 *   1. 34/653 tests currently fail (2026-04-22; related to in-flight
 *      spaces-foundation work), so coverage thresholds aren't
 *      enforceable yet.
 *   2. File-presence is a faster, more stable signal for "which module
 *      has no automated regression protection at all?" — enough to
 *      prioritise the next session's test-writing effort.
 *
 * Scope: `apps/mana/apps/web/src/lib/modules/*` subdirectories. For each
 * module, count:
 *   - .svelte files (UI surface)
 *   - .ts files (types, queries, stores, etc.)
 *   - .test.ts / .spec.ts files (tests)
 *   - Percentage of source files that have a sibling test
 *
 * Also include top-level packages/shared-* for completeness.
 *
 * Usage:
 *   node scripts/audit-test-coverage.mjs
 *   node scripts/audit-test-coverage.mjs --summary
 */

import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const MODULES_DIR = join(REPO_ROOT, 'apps/mana/apps/web/src/lib/modules');

const SUMMARY = process.argv.includes('--summary');

const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.svelte-kit']);

function walk(dir, collect) {
	for (const ent of readdirSync(dir, { withFileTypes: true })) {
		if (SKIP_DIRS.has(ent.name)) continue;
		const p = join(dir, ent.name);
		if (ent.isDirectory()) walk(p, collect);
		else if (ent.isFile()) collect(p);
	}
}

function classify(files) {
	let svelte = 0;
	let ts = 0;
	let tests = 0;
	for (const f of files) {
		if (f.endsWith('.test.ts') || f.endsWith('.spec.ts') || f.endsWith('.test.svelte')) {
			tests++;
		} else if (f.endsWith('.svelte')) {
			svelte++;
		} else if (f.endsWith('.ts') && !f.endsWith('.d.ts')) {
			ts++;
		}
	}
	return { svelte, ts, tests };
}

function audit() {
	const moduleNames = readdirSync(MODULES_DIR, { withFileTypes: true })
		.filter((e) => e.isDirectory())
		.map((e) => e.name)
		.sort();

	const rows = [];
	for (const mod of moduleNames) {
		const files = [];
		try {
			walk(join(MODULES_DIR, mod), (p) => files.push(p));
		} catch {
			continue;
		}
		const c = classify(files);
		const source = c.svelte + c.ts;
		const coverage = source === 0 ? 0 : c.tests / source;
		rows.push({ module: mod, ...c, source, coverage });
	}

	const withTests = rows.filter((r) => r.tests > 0).length;
	const withoutTests = rows.filter((r) => r.tests === 0).length;
	const totalTests = rows.reduce((s, r) => s + r.tests, 0);
	const totalSource = rows.reduce((s, r) => s + r.source, 0);

	console.log(`\n── Test coverage audit (file-presence) ─────────────────\n`);
	console.log(`Modules:             ${rows.length}`);
	console.log(`  with ≥1 test:      ${withTests}`);
	console.log(`  without any test:  ${withoutTests}`);
	console.log(`Total source files:  ${totalSource} (.svelte + .ts)`);
	console.log(`Total test files:    ${totalTests}`);
	console.log(
		`Overall file ratio:  ${((totalTests / totalSource) * 100).toFixed(1)}% (target: ≥25% for hot modules)`
	);
	console.log('');

	const zeroTests = rows
		.filter((r) => r.tests === 0 && r.source >= 3)
		.sort((a, b) => b.source - a.source);
	if (zeroTests.length > 0) {
		console.log(`Modules with 0 test files and ≥3 source files (top 15):\n`);
		for (const r of zeroTests.slice(0, 15)) {
			console.log(`  ${String(r.source).padStart(3)} src  ${r.module}`);
		}
		console.log('');
	}

	if (SUMMARY) return;

	const withSome = rows.filter((r) => r.tests > 0).sort((a, b) => b.coverage - a.coverage);
	if (withSome.length > 0) {
		console.log(`Modules with ≥1 test (by file ratio):\n`);
		for (const r of withSome) {
			const bar = '█'.repeat(Math.round(r.coverage * 20)).padEnd(20, '·');
			console.log(
				`  ${bar}  ${(r.coverage * 100).toFixed(0).padStart(3)}%  ` +
					`${r.tests}/${r.source} files  ${r.module}`
			);
		}
		console.log('');
	}

	// Report-only; never exit non-zero.
}

audit();
