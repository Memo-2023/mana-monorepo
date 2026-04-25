#!/usr/bin/env node
/**
 * Ratcheting validator for hardcoded German user-facing strings in
 * apps/mana/apps/web Svelte components. Looks for German-looking text
 * in attribute values (placeholder, title, aria-label, label, alt) and
 * in text content, and compares per-file counts against a committed
 * baseline.
 *
 * Every file's current count must be ≤ its baseline count. New files
 * (not in baseline) must have 0 violations. The baseline can only
 * shrink — fixing strings is rewarded, adding new ones fails CI.
 *
 * The validator is intentionally coarse: the goal is to stop the 1877-
 * string backlog from growing while it's being whittled down, not to
 * catch every translation miss perfectly.
 *
 * Usage:
 *   node scripts/validate-no-hardcoded-strings.mjs          # check
 *   node scripts/validate-no-hardcoded-strings.mjs --update # rewrite baseline
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const BASELINE_PATH = join(__dirname, 'i18n-hardcoded-baseline.json');
const SCAN_GLOB = 'apps/mana/apps/web/src/**/*.svelte';

const PATTERNS = [
	/placeholder="([^"{}]*[äöüÄÖÜß][^"{}]*)"/g,
	/title="([^"{}]*[äöüÄÖÜß][^"{}]*)"/g,
	/aria-label="([^"{}]*[äöüÄÖÜß][^"{}]*)"/g,
	/label="([^"{}]*[äöüÄÖÜß][^"{}]*)"/g,
	/alt="([^"{}]*[äöüÄÖÜß][^"{}]*)"/g,
	/>([A-ZÄÖÜ][a-zäöüß][a-zäöüßÄÖÜA-Z ,.!?]{2,40})</g,
];

function scan() {
	const files = execSync(`git ls-files '${SCAN_GLOB}'`, { cwd: REPO_ROOT })
		.toString()
		.trim()
		.split('\n')
		.filter(Boolean);

	const counts = {};
	for (const f of files) {
		let src;
		try {
			src = readFileSync(join(REPO_ROOT, f), 'utf8');
		} catch {
			continue;
		}
		let n = 0;
		for (const p of PATTERNS) for (const _ of src.matchAll(p)) n++;
		if (n > 0) counts[f] = n;
	}
	return counts;
}

function loadBaseline() {
	if (!existsSync(BASELINE_PATH)) return {};
	return JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
}

function main() {
	const update = process.argv.includes('--update');
	const current = scan();
	const currentTotal = Object.values(current).reduce((a, b) => a + b, 0);

	if (update) {
		const sorted = Object.fromEntries(
			Object.entries(current).sort(([a], [b]) => a.localeCompare(b))
		);
		writeFileSync(BASELINE_PATH, JSON.stringify(sorted, null, 2) + '\n');
		console.log(
			`✓ Baseline updated: ${currentTotal} violations across ${Object.keys(current).length} files.`
		);
		return;
	}

	const baseline = loadBaseline();
	const baselineTotal = Object.values(baseline).reduce((a, b) => a + b, 0);
	const violations = [];

	for (const [file, n] of Object.entries(current)) {
		const b = baseline[file] ?? 0;
		if (n > b) violations.push({ file, current: n, baseline: b, delta: n - b });
	}

	if (violations.length > 0) {
		console.error(
			`\n✗ Hardcoded-string check FAILED — ${violations.length} file(s) exceed baseline:\n`
		);
		for (const v of violations.slice(0, 20)) {
			console.error(`  ${v.file}: ${v.current} (was ${v.baseline}, +${v.delta})`);
		}
		if (violations.length > 20) console.error(`  … +${violations.length - 20} more`);
		console.error(
			`\nYou added user-facing German strings to .svelte files without\n` +
				`going through \$_('namespace.key'). Move them into locales/ or\n` +
				`translate them inline, then re-run validate:i18n-hardcoded.\n` +
				`If the additions are intentional (e.g. an untranslated dev-only\n` +
				`page), run: pnpm run validate:i18n-hardcoded -- --update\n`
		);
		process.exit(1);
	}

	// Dropped below baseline? Tell the user so they can ratchet.
	const shrunk = Object.keys(baseline).filter((f) => (current[f] ?? 0) < baseline[f]).length;
	const cleaned = Object.keys(baseline).filter((f) => !(f in current)).length;

	console.log(
		`✓ Hardcoded strings: ${currentTotal} violations across ${Object.keys(current).length} files ` +
			`(baseline ${baselineTotal}).` +
			(shrunk || cleaned
				? `\n  ${shrunk} file(s) shrunk, ${cleaned} file(s) fully cleaned — ` +
					`run 'pnpm run validate:i18n-hardcoded -- --update' to ratchet.`
				: '')
	);
}

main();
