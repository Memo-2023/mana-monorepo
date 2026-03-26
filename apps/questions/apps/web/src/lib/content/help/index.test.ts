import { describe, it, expect } from 'vitest';
import { getQuestionsHelpContent } from './index';

describe('Questions Help Content', () => {
	it('returns valid German content', () => {
		const content = getQuestionsHelpContent('de');

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
		const content = getQuestionsHelpContent('en');

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
		const de = getQuestionsHelpContent('de');
		const en = getQuestionsHelpContent('en');

		expect(de.faq.length).toBe(en.faq.length);
		expect(de.features.length).toBe(en.features.length);
	});

	it('has unique FAQ IDs', () => {
		const content = getQuestionsHelpContent('de');
		const ids = content.faq.map((f) => f.id);
		expect(new Set(ids).size).toBe(ids.length);
	});
});
