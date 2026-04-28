import { describe, it, expect } from 'vitest';
import { renderEmailHtml } from './email-html';

const campaign = {
	subject: 'Hallo Welt',
	preheader: 'Ein kurzer Vorschautext',
	fromName: 'Till',
	fromEmail: 'till@example.ch',
};

const settings = {
	defaultFooter: 'Weitere Infos auf mana.how',
	legalAddress: 'Till AG\nBahnhofstr. 1\n8000 Zürich',
};

describe('renderEmailHtml', () => {
	it('produces a full HTML document', () => {
		const html = renderEmailHtml({
			tiptapHtml: '<p>Hallo</p>',
			campaign,
			settings,
		});
		expect(html.toLowerCase()).toContain('<!doctype html>');
		expect(html).toContain('<html');
		expect(html).toContain('</html>');
	});

	it('includes the subject as the document title', () => {
		const html = renderEmailHtml({
			tiptapHtml: '<p>body</p>',
			campaign,
			settings,
		});
		expect(html).toContain('<title>Hallo Welt</title>');
	});

	it('HTML-escapes the subject to prevent injection', () => {
		const html = renderEmailHtml({
			tiptapHtml: '<p>body</p>',
			campaign: { ...campaign, subject: 'Alert <script>x</script>' },
			settings,
		});
		expect(html).not.toContain('<script>');
		expect(html).toContain('&lt;script&gt;');
	});

	it('embeds the preheader in a hidden block', () => {
		const html = renderEmailHtml({
			tiptapHtml: '<p>body</p>',
			campaign,
			settings,
		});
		expect(html).toContain('Ein kurzer Vorschautext');
		// The preheader block must be hidden from visible rendering.
		expect(html).toContain('display:none');
	});

	it('injects the Tiptap HTML body verbatim (trusted source)', () => {
		const tiptapHtml = '<h2>Willkommen</h2><p>Bold <strong>text</strong></p>';
		const html = renderEmailHtml({ tiptapHtml, campaign, settings });
		expect(html).toContain('<h2>Willkommen</h2>');
		expect(html).toContain('<strong>text</strong>');
	});

	it('falls back to a blank paragraph for empty body', () => {
		const html = renderEmailHtml({ tiptapHtml: '', campaign, settings });
		// Body should still render without breaking the document shell.
		expect(html).toContain('<p>&nbsp;</p>');
	});

	it('includes the sender name above the body', () => {
		const html = renderEmailHtml({
			tiptapHtml: '<p>body</p>',
			campaign,
			settings,
		});
		expect(html).toContain('>Till<');
	});

	it('includes unsubscribe link (preview placeholder by default)', () => {
		const html = renderEmailHtml({
			tiptapHtml: '<p>body</p>',
			campaign,
			settings,
		});
		expect(html).toContain('Abbestellen');
		expect(html).toContain('#unsubscribe-preview');
	});

	it('uses the provided unsubscribeUrl when set (send-time)', () => {
		const html = renderEmailHtml({
			tiptapHtml: '<p>body</p>',
			campaign,
			settings,
			unsubscribeUrl: 'https://mail.mana.how/v1/mail/track/unsubscribe/abc',
		});
		expect(html).toContain('https://mail.mana.how/v1/mail/track/unsubscribe/abc');
	});

	it('renders legal address in the footer with line breaks', () => {
		const html = renderEmailHtml({
			tiptapHtml: '<p>body</p>',
			campaign,
			settings,
		});
		expect(html).toContain('Till AG');
		expect(html).toContain('8000 Zürich');
		// Newlines should become <br> in the footer.
		expect(html).toMatch(/Till AG<br>Bahnhofstr/);
	});

	it('omits the footer block when defaultFooter is empty', () => {
		const html = renderEmailHtml({
			tiptapHtml: '<p>body</p>',
			campaign,
			settings: { defaultFooter: null, legalAddress: 'X AG' },
		});
		// The optional "Weitere Infos" block shouldn't appear, but the legal
		// address still does.
		expect(html).not.toContain('Weitere Infos');
		expect(html).toContain('X AG');
	});

	it('includes the web-view link', () => {
		const html = renderEmailHtml({
			tiptapHtml: '<p>body</p>',
			campaign,
			settings,
			webViewUrl: 'https://mail.mana.how/view/abc123',
		});
		expect(html).toContain('https://mail.mana.how/view/abc123');
		expect(html).toContain('Im Browser ansehen');
	});
});
