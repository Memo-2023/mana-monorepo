import { describe, it, expect } from 'vitest';
import { renderPlainText } from './plain-text';

const campaign = { fromName: 'Till' };
const settings = {
	defaultFooter: 'Weitere Infos auf mana.how',
	legalAddress: 'Till AG, Bahnhofstr. 1, 8000 Zürich',
};

describe('renderPlainText', () => {
	it('includes the sender name', () => {
		const txt = renderPlainText({
			tiptapText: 'Hallo',
			campaign,
			settings,
		});
		expect(txt).toContain('Till');
	});

	it('includes the body content', () => {
		const txt = renderPlainText({
			tiptapText: 'Der Körper der Nachricht.',
			campaign,
			settings,
		});
		expect(txt).toContain('Der Körper der Nachricht.');
	});

	it('soft-wraps long paragraphs at 72 chars', () => {
		const long = 'wort '.repeat(30).trim(); // ~150 chars of 4-char words
		const txt = renderPlainText({
			tiptapText: long,
			campaign,
			settings,
		});
		// Every non-empty line in the body must be ≤72 chars.
		for (const line of txt.split('\n')) {
			expect(line.length).toBeLessThanOrEqual(72);
		}
	});

	it('preserves multiple paragraphs separated by newlines', () => {
		const txt = renderPlainText({
			tiptapText: 'Absatz eins.\nAbsatz zwei.',
			campaign,
			settings,
		});
		expect(txt).toContain('Absatz eins.');
		expect(txt).toContain('Absatz zwei.');
	});

	it('adds unsubscribe line with placeholder text by default', () => {
		const txt = renderPlainText({
			tiptapText: 'body',
			campaign,
			settings,
		});
		expect(txt).toContain('Abbestellen:');
		expect(txt).toContain('[Abmelde-Link wird beim Versand eingefügt]');
	});

	it('uses the provided unsubscribeUrl when set', () => {
		const txt = renderPlainText({
			tiptapText: 'body',
			campaign,
			settings,
			unsubscribeUrl: 'https://mail.mana.how/u/abc',
		});
		expect(txt).toContain('https://mail.mana.how/u/abc');
		expect(txt).not.toContain('[Abmelde-Link');
	});

	it('ends with the legal address', () => {
		const txt = renderPlainText({
			tiptapText: 'body',
			campaign,
			settings,
		});
		expect(txt).toContain('Till AG');
		expect(txt).toContain('8000 Zürich');
	});

	it('omits the optional footer when not set', () => {
		const txt = renderPlainText({
			tiptapText: 'body',
			campaign,
			settings: { defaultFooter: null, legalAddress: 'X AG' },
		});
		expect(txt).not.toContain('Weitere Infos');
	});
});
