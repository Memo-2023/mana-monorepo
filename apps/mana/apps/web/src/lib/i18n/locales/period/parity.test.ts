/**
 * i18n parity test for the period module.
 *
 * Ensures all 5 locale files (de/en/it/fr/es) have identical key
 * structure — stub copies of en.json would otherwise drift silently
 * as keys are added to de/en and forgotten in the others.
 *
 * The test does NOT enforce that values are different (stubs are
 * allowed); it only enforces that the *shape* (nested key paths)
 * matches exactly across all locales.
 */

import { describe, expect, it as test } from 'vitest';
import de from './de.json';
import en from './en.json';
import itLocale from './it.json';
import fr from './fr.json';
import es from './es.json';

type Dict = Record<string, unknown>;

/** Flatten an object into dot-separated leaf key paths. */
function flattenKeys(obj: Dict, prefix = ''): string[] {
	const keys: string[] = [];
	for (const [k, v] of Object.entries(obj)) {
		const path = prefix ? `${prefix}.${k}` : k;
		if (v && typeof v === 'object' && !Array.isArray(v)) {
			keys.push(...flattenKeys(v as Dict, path));
		} else {
			keys.push(path);
		}
	}
	return keys.sort();
}

const locales = {
	de: de as Dict,
	en: en as Dict,
	it: itLocale as Dict,
	fr: fr as Dict,
	es: es as Dict,
};

describe('period i18n parity', () => {
	const referenceKeys = flattenKeys(locales.de);

	test('de has a non-empty set of keys', () => {
		expect(referenceKeys.length).toBeGreaterThan(0);
	});

	for (const [lang, dict] of Object.entries(locales)) {
		if (lang === 'de') continue;
		test(`${lang} matches de key structure`, () => {
			const langKeys = flattenKeys(dict);
			expect(langKeys).toEqual(referenceKeys);
		});
	}

	test('no locale has empty string values', () => {
		for (const [lang, dict] of Object.entries(locales)) {
			const flat = flattenKeys(dict);
			for (const keyPath of flat) {
				const value = keyPath.split('.').reduce<unknown>((acc, segment) => {
					if (acc && typeof acc === 'object') return (acc as Dict)[segment];
					return undefined;
				}, dict);
				expect(value, `${lang}.${keyPath}`).not.toBe('');
				expect(typeof value, `${lang}.${keyPath}`).toBe('string');
			}
		}
	});
});
