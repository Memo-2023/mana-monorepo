/**
 * HTML Sanitization
 * Prevents XSS when rendering Markdown-generated HTML via {@html}
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks.
 * Allows safe HTML tags commonly used in help content (headings, lists, links, etc.)
 */
export function sanitizeHtml(html: string): string {
	return DOMPurify.sanitize(html, {
		ALLOWED_TAGS: [
			'h1',
			'h2',
			'h3',
			'h4',
			'h5',
			'h6',
			'p',
			'br',
			'hr',
			'ul',
			'ol',
			'li',
			'a',
			'strong',
			'b',
			'em',
			'i',
			'code',
			'pre',
			'blockquote',
			'table',
			'thead',
			'tbody',
			'tr',
			'th',
			'td',
			'mark',
			'kbd',
			'img',
			'span',
			'div',
			'dl',
			'dt',
			'dd',
		],
		ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'id'],
		ADD_ATTR: ['target'],
	});
}
