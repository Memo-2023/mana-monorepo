import { describe, it, expect, beforeAll } from 'vitest';
import { addMessages, init, locale, waitLocale } from 'svelte-i18n';
import deHelp from '$lib/i18n/locales/help/de.json';
import enHelp from '$lib/i18n/locales/help/en.json';
import { getManaHelpContent } from './index';

// svelte-i18n is module-scoped: register the help dictionary once before
// any test calls the t() helper. Without this the store returns the bare
// key strings and getManaHelpContent() throws on `.split(',')` of an
// untranslated tags field.
beforeAll(async () => {
	addMessages('de', { help: deHelp });
	addMessages('en', { help: enHelp });
	init({ fallbackLocale: 'de', initialLocale: 'de' });
	locale.set('de');
	await waitLocale('de');
	await waitLocale('en');
});

describe('Mana Help Content', () => {
	it('returns valid German content', () => {
		const content = getManaHelpContent('de');

		expect(content.faq.length).toBeGreaterThan(0);
		content.faq.forEach((faq) => {
			expect(faq.id).toBeTruthy();
			expect(faq.question).toBeTruthy();
			expect(faq.answer).toBeTruthy();
		});

		expect(content.features).toBeDefined();
		expect(content.contact).toBeDefined();
		expect(content.contact.supportEmail).toBe('support@mana.how');
	});

	it('returns valid English content', () => {
		const content = getManaHelpContent('en');

		expect(content.faq.length).toBeGreaterThan(0);
		content.faq.forEach((faq) => {
			expect(faq.id).toBeTruthy();
			expect(faq.question).toBeTruthy();
			expect(faq.answer).toBeTruthy();
		});

		expect(content.features).toBeDefined();
		expect(content.contact).toBeDefined();
	});

	it('returns same number of FAQ items for both languages', () => {
		const de = getManaHelpContent('de');
		const en = getManaHelpContent('en');

		expect(de.faq.length).toBe(en.faq.length);
		expect(de.features.length).toBe(en.features.length);
	});

	it('has unique FAQ IDs', () => {
		const content = getManaHelpContent('de');
		const ids = content.faq.map((f) => f.id);
		expect(new Set(ids).size).toBe(ids.length);
	});
});
