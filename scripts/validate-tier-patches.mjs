#!/usr/bin/env node
/**
 * Validate that no `LOCAL TIER PATCH` markers leak into the release.
 *
 * Background: tier downgrades during local dev are marked with a comment
 * `// LOCAL TIER PATCH — revert to '<tier>' before release` so devs can
 * temporarily expose alpha/beta modules to themselves on the guest tier.
 * If those markers ship to prod every guest sees premium modules.
 *
 * This script is informational by default — it lists every marker so the
 * release engineer sees them. Set MANA_TIER_PATCH_STRICT=1 to fail the
 * build instead (use this in the release / RC pipeline, NOT in local
 * validate:all where the markers are intentional).
 *
 * Zero deps — runs as plain Node ESM. Uses `git ls-files` so it
 * automatically respects .gitignore.
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

const STRICT = process.env.MANA_TIER_PATCH_STRICT === '1';
const MARKER = 'LOCAL TIER PATCH';

function listTrackedFiles() {
	const out = execSync('git ls-files "*.ts" "*.tsx" "*.js" "*.mjs" "*.svelte" "*.json" "*.md"', {
		cwd: REPO_ROOT,
		encoding: 'utf8',
		maxBuffer: 32 * 1024 * 1024,
	});
	return out
		.split('\n')
		.map((p) => p.trim())
		.filter(Boolean);
}

function scan() {
	const hits = [];
	for (const rel of listTrackedFiles()) {
		const abs = join(REPO_ROOT, rel);
		let body;
		try {
			body = readFileSync(abs, 'utf8');
		} catch {
			continue;
		}
		if (!body.includes(MARKER)) continue;
		const lines = body.split('\n');
		for (let i = 0; i < lines.length; i++) {
			if (lines[i].includes(MARKER)) {
				hits.push({ file: rel, line: i + 1, text: lines[i].trim() });
			}
		}
	}
	return hits;
}

const hits = scan();

if (hits.length === 0) {
	console.log('✓ No LOCAL TIER PATCH markers found.');
	process.exit(0);
}

console.log(`Found ${hits.length} LOCAL TIER PATCH marker(s):\n`);
for (const h of hits) {
	console.log(`  ${h.file}:${h.line}`);
	console.log(`    ${h.text}`);
}

if (STRICT) {
	console.error(
		'\n✗ MANA_TIER_PATCH_STRICT=1 — refusing to ship while LOCAL TIER PATCH markers are present.\n' +
			'  Revert each marker to the documented production tier before tagging the release.'
	);
	process.exit(1);
}

console.log(
	'\n  (informational — not failing. Set MANA_TIER_PATCH_STRICT=1 in release CI to gate.)'
);
