#!/usr/bin/env node
/**
 * Validate that every i18n namespace under apps/mana/apps/web has the
 * same key-set across all supported locales. A missing key would fall
 * back to the default locale (DE) at runtime — which silently produces
 * mixed-language UI for non-German users instead of a loud failure.
 * An extra key (present in one locale but not DE) is an obsolete
 * legacy string that nothing references any more.
 *
 * Canonical locale: DE (the `fallbackLocale` in src/lib/i18n/index.ts).
 * Every other locale must mirror DE's key-set exactly.
 *
 * Scope: apps/mana/apps/web/src/lib/i18n/locales/<namespace>/<locale>.json
 *
 * Usage:
 *   node scripts/validate-i18n-parity.mjs
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const LOCALES_DIR = join(REPO_ROOT, 'apps/mana/apps/web/src/lib/i18n/locales');
const CANONICAL_LOCALE = 'de';
const SUPPORTED_LOCALES = ['de', 'en', 'it', 'fr', 'es'];

function flattenKeys(obj, prefix = '') {
	const keys = [];
	for (const [k, v] of Object.entries(obj)) {
		const path = prefix ? `${prefix}.${k}` : k;
		if (v && typeof v === 'object' && !Array.isArray(v)) {
			keys.push(...flattenKeys(v, path));
		} else {
			keys.push(path);
		}
	}
	return keys;
}

function validate() {
	if (!existsSync(LOCALES_DIR)) {
		console.log('✓ i18n parity: locales directory not found — skipped.');
		return;
	}

	const namespaces = readdirSync(LOCALES_DIR).filter((f) =>
		statSync(join(LOCALES_DIR, f)).isDirectory()
	);

	const violations = [];
	let totalKeys = 0;

	for (const ns of namespaces) {
		const canonicalPath = join(LOCALES_DIR, ns, `${CANONICAL_LOCALE}.json`);
		if (!existsSync(canonicalPath)) {
			violations.push({ ns, locale: CANONICAL_LOCALE, kind: 'ns-missing-canonical' });
			continue;
		}

		let canonical;
		try {
			canonical = new Set(flattenKeys(JSON.parse(readFileSync(canonicalPath, 'utf8'))));
		} catch (err) {
			violations.push({ ns, locale: CANONICAL_LOCALE, kind: 'parse-error', err: err.message });
			continue;
		}
		totalKeys += canonical.size;

		for (const locale of SUPPORTED_LOCALES) {
			if (locale === CANONICAL_LOCALE) continue;
			const path = join(LOCALES_DIR, ns, `${locale}.json`);
			if (!existsSync(path)) {
				violations.push({ ns, locale, kind: 'file-missing' });
				continue;
			}

			let keys;
			try {
				keys = new Set(flattenKeys(JSON.parse(readFileSync(path, 'utf8'))));
			} catch (err) {
				violations.push({ ns, locale, kind: 'parse-error', err: err.message });
				continue;
			}

			const missing = [...canonical].filter((k) => !keys.has(k));
			const extra = [...keys].filter((k) => !canonical.has(k));

			if (missing.length > 0) violations.push({ ns, locale, kind: 'missing', keys: missing });
			if (extra.length > 0) violations.push({ ns, locale, kind: 'extra', keys: extra });
		}
	}

	if (violations.length > 0) {
		console.error(`\n✗ i18n parity check FAILED (${violations.length} issue(s)):\n`);
		for (const v of violations) {
			if (v.kind === 'missing') {
				console.error(
					`  ${v.ns}/${v.locale}.json — ${v.keys.length} key(s) missing vs ${CANONICAL_LOCALE}:`
				);
				for (const k of v.keys.slice(0, 8)) console.error(`    - ${k}`);
				if (v.keys.length > 8) console.error(`    … +${v.keys.length - 8} more`);
			} else if (v.kind === 'extra') {
				console.error(
					`  ${v.ns}/${v.locale}.json — ${v.keys.length} key(s) not in ${CANONICAL_LOCALE} (legacy?):`
				);
				for (const k of v.keys.slice(0, 8)) console.error(`    - ${k}`);
				if (v.keys.length > 8) console.error(`    … +${v.keys.length - 8} more`);
			} else if (v.kind === 'file-missing') {
				console.error(`  ${v.ns}/${v.locale}.json — file does not exist`);
			} else if (v.kind === 'ns-missing-canonical') {
				console.error(
					`  ${v.ns}/ — canonical ${CANONICAL_LOCALE}.json missing; cannot validate namespace`
				);
			} else if (v.kind === 'parse-error') {
				console.error(`  ${v.ns}/${v.locale}.json — JSON parse error: ${v.err}`);
			}
		}
		console.error(
			`\nEvery locale file must mirror ${CANONICAL_LOCALE}.json's key-set exactly.\n` +
				`Missing keys fall back to ${CANONICAL_LOCALE} at runtime (mixed-language UI);\n` +
				`extra keys are dead code. Add the translation or delete the key.\n`
		);
		process.exit(1);
	}

	console.log(
		`✓ i18n parity: ${namespaces.length} namespaces × ${SUPPORTED_LOCALES.length} locales — ${totalKeys} canonical keys, all aligned.`
	);
}

validate();
