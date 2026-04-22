#!/usr/bin/env node
/**
 * One-shot codemod: replace `transition-all` with specific transitions
 * based on what the element actually animates (derived from sibling
 * hover:/focus:/group-hover:/active: classes and the element's layout
 * role).
 *
 * Why: `transition-all` animates *every* property, including custom-
 * property-backed colours. On first paint, some CSS custom properties
 * haven't resolved yet, producing the P5 "white-on-white until first
 * interaction" rendering bug. Specific transitions also perf better
 * (no layout-property interpolation).
 *
 * Strategy: this script parses each `class="..."` attribute that
 * contains `transition-all` and picks one of:
 *
 *   - `transition-opacity`
 *       When the element only changes opacity (icon fade on group-hover).
 *
 *   - `transition-[width]`
 *       Progress bars — the element has `h-full rounded-full` pattern.
 *
 *   - `transition-[transform,colors,box-shadow]`
 *       Scaled buttons / cards (`hover:scale-*` or `active:scale-*`).
 *
 *   - `transition-[border-color,box-shadow]`
 *       Cards with hover:border + hover:shadow (no colour/bg change).
 *
 *   - `transition-colors`
 *       Default for everything else (most card/row hover states).
 *
 * Ambiguous cases stay as `transition-all` — review the remaining list
 * with `rg transition-all` and convert by hand.
 *
 * Usage:
 *   node scripts/migrate-transition-all.mjs [--dry-run]
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');

const SCAN_GLOBS = ['apps/mana/apps/web/src/**/*.svelte'];

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

/** Decide the replacement for a transition-all occurrence based on sibling classes. */
function pickReplacement(classes) {
	const has = (p) => classes.some((c) => p.test(c));

	const hasScale = has(/:scale-/) || has(/^scale-/);
	const hasOpacity = has(/opacity-\d/) || has(/:opacity-\d/);
	const hasHoverBg = has(/(?:hover|focus|active|group-hover):bg-/);
	const hasHoverBorder = has(/(?:hover|focus|active|group-hover):border-/);
	const hasHoverShadow = has(/(?:hover|focus|active|group-hover):shadow-/);
	const hasHoverText = has(/(?:hover|focus|active|group-hover):text-/);
	// Progress bars: `h-full rounded-full` without any interactive variant.
	const isProgressBar =
		classes.includes('h-full') &&
		classes.includes('rounded-full') &&
		!hasScale &&
		!hasHoverBg &&
		!hasHoverBorder;

	if (isProgressBar) return 'transition-[width]';
	if (hasScale) return 'transition-[transform,colors,box-shadow]';
	// Pure opacity fade (icon reveal on hover).
	if (hasOpacity && !hasHoverBg && !hasHoverBorder && !hasHoverText && !hasHoverShadow) {
		return 'transition-opacity';
	}
	// Card with border + shadow dance, no colour change.
	if (hasHoverBorder && hasHoverShadow && !hasHoverBg && !hasHoverText) {
		return 'transition-[border-color,box-shadow]';
	}
	// Any colour-ish interactive change.
	if (hasHoverBg || hasHoverBorder || hasHoverText || hasHoverShadow) {
		return 'transition-colors';
	}
	// No signal — leave as-is so the human can decide.
	return null;
}

/**
 * Walk each class="..." attribute (including class={...} template strings)
 * containing `transition-all` and rewrite it in place. Skips cases where
 * no deterministic replacement is found.
 */
function migrateSource(src) {
	let changes = 0;
	let unresolved = 0;

	// Match `class="..."` and `class={"..."}` constructs. Keep simple —
	// we'll bail out if the value looks too complex to tokenise.
	const classAttrRe = /class\s*=\s*(["'`])([\s\S]*?)\1/g;

	const out = src.replace(classAttrRe, (full, quote, value) => {
		if (!value.includes('transition-all')) return full;

		// Tokenise on whitespace — good enough for Svelte class attributes
		// that embed `{expr}` fragments; those stay opaque and we just
		// skip them as a single token, which is fine because we only read
		// known static classes.
		const classes = value
			.split(/\s+/)
			.map((t) => t.trim())
			.filter(Boolean);

		if (!classes.some((c) => c === 'transition-all')) {
			// `transition-all duration-300` etc. — remove the duration
			// handling and just match the token itself.
			return full;
		}

		const replacement = pickReplacement(classes);
		if (!replacement) {
			unresolved++;
			return full;
		}

		const newClasses = classes.map((c) => (c === 'transition-all' ? replacement : c));
		changes++;
		return `class=${quote}${newClasses.join(' ')}${quote}`;
	});

	return { out, changes, unresolved };
}

function migrate() {
	const paths = listFiles();
	let totalChanges = 0;
	let totalUnresolved = 0;
	let changedFiles = 0;

	for (const rel of paths) {
		const abs = join(REPO_ROOT, rel);
		const src = readFileSync(abs, 'utf8');
		if (!src.includes('transition-all')) continue;

		const { out, changes, unresolved } = migrateSource(src);
		totalChanges += changes;
		totalUnresolved += unresolved;

		if (changes > 0) {
			changedFiles++;
			if (!DRY_RUN) writeFileSync(abs, out, 'utf8');
			console.log(`  ${String(changes).padStart(3)} → (${unresolved} left)  ${rel}`);
		} else if (unresolved > 0) {
			console.log(`  ${'·'.padStart(3)}   (${unresolved} left)  ${rel}`);
		}
	}

	const verb = DRY_RUN ? 'Would migrate' : 'Migrated';
	console.log(
		`\n${verb} ${totalChanges} transition-all → specific, ` +
			`${totalUnresolved} left ambiguous across ${changedFiles} file(s).`
	);
	if (DRY_RUN) console.log('Run without --dry-run to apply.');
}

migrate();
