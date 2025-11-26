import DOMPurify from 'isomorphic-dompurify';
import type { CardConstraints, TemplateVariable } from '$lib/components/cards/types';

export interface SanitizationOptions {
	allowedTags?: string[];
	allowedAttributes?: Record<string, string[]>;
	allowedStyles?: string[];
	maxNesting?: number;
	removeScripts?: boolean;
	removeEventHandlers?: boolean;
	removeImports?: boolean;
}

export class CardSanitizer {
	private domPurify = DOMPurify;

	/**
	 * Sanitize HTML content for safe rendering
	 */
	sanitizeHTML(html: string, options?: SanitizationOptions): string {
		const defaultOptions: SanitizationOptions = {
			allowedTags: [
				'div',
				'span',
				'p',
				'h1',
				'h2',
				'h3',
				'h4',
				'h5',
				'h6',
				'a',
				'img',
				'ul',
				'ol',
				'li',
				'strong',
				'em',
				'b',
				'i',
				'br',
				'hr',
				'blockquote',
				'pre',
				'code',
				'table',
				'thead',
				'tbody',
				'tr',
				'td',
				'th',
				'section',
				'article',
				'nav',
				'header',
				'footer',
				'aside',
				'main',
				'figure',
				'figcaption',
				'button',
				'svg',
				'path',
				'circle',
				'rect',
				'line',
				'polygon'
			],
			allowedAttributes: {
				'*': ['class', 'id', 'style'],
				a: ['href', 'target', 'rel'],
				img: ['src', 'alt', 'width', 'height'],
				svg: ['viewBox', 'width', 'height', 'fill', 'stroke'],
				path: ['d', 'fill', 'stroke', 'stroke-width'],
				button: ['type', 'disabled']
			},
			removeScripts: true,
			removeEventHandlers: true
		};

		const mergedOptions = { ...defaultOptions, ...options };

		// Configure DOMPurify
		const config: any = {
			ALLOWED_TAGS: mergedOptions.allowedTags,
			ALLOWED_ATTR: [],
			FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select'],
			FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur']
		};

		// Build allowed attributes list
		if (mergedOptions.allowedAttributes) {
			for (const [tag, attrs] of Object.entries(mergedOptions.allowedAttributes)) {
				if (tag === '*') {
					config.ALLOWED_ATTR.push(...attrs);
				} else {
					attrs.forEach((attr) => {
						config.ALLOWED_ATTR.push(`${tag}:${attr}`);
					});
				}
			}
		}

		// Sanitize HTML
		const sanitized = this.domPurify.sanitize(html, config);

		// Convert to string and do additional cleaning for javascript: URLs
		const result = String(sanitized);
		return result.replace(/javascript:/gi, '').replace(/on\w+\s*=/gi, '');
	}

	/**
	 * Sanitize CSS content for safe rendering
	 */
	sanitizeCSS(css: string, options?: SanitizationOptions): string {
		const defaultOptions: SanitizationOptions = {
			removeImports: true,
			allowedStyles: [
				'color',
				'background',
				'background-color',
				'background-image',
				'border',
				'border-radius',
				'border-color',
				'border-width',
				'padding',
				'margin',
				'width',
				'height',
				'max-width',
				'max-height',
				'min-width',
				'min-height',
				'display',
				'flex',
				'grid',
				'position',
				'top',
				'bottom',
				'left',
				'right',
				'font-size',
				'font-family',
				'font-weight',
				'text-align',
				'text-decoration',
				'line-height',
				'letter-spacing',
				'opacity',
				'visibility',
				'z-index',
				'overflow',
				'transform',
				'transition',
				'animation',
				'box-shadow',
				'cursor',
				'pointer-events'
			],
			maxNesting: 3
		};

		const mergedOptions = { ...defaultOptions, ...options };

		let sanitized = css;

		// Remove @import statements
		if (mergedOptions.removeImports) {
			sanitized = sanitized.replace(/@import\s+[^;]+;/gi, '');
		}

		// Remove javascript in CSS
		sanitized = sanitized.replace(/javascript:/gi, '');
		sanitized = sanitized.replace(/expression\s*\(/gi, '');
		sanitized = sanitized.replace(/behavior\s*:/gi, '');
		sanitized = sanitized.replace(/-moz-binding\s*:/gi, '');

		// Remove external URLs (except for safe properties like background-image)
		sanitized = sanitized.replace(
			/url\s*\(\s*['"]?(?!data:)(?!https:\/\/[^'"]+\.(jpg|jpeg|png|gif|svg|webp))/gi,
			'url('
		);

		// Limit selector complexity (prevent performance issues)
		const lines = sanitized.split('\n');
		const processedLines = lines.map((line) => {
			// Count selector depth
			const selectorDepth = (line.match(/\s+/g) || []).length;
			if (selectorDepth > (mergedOptions.maxNesting || 3)) {
				return '/* Selector too deeply nested */';
			}
			return line;
		});

		sanitized = processedLines.join('\n');

		// Remove potentially dangerous properties
		const dangerousProperties = ['behavior', '-moz-binding', 'filter', 'content'];

		dangerousProperties.forEach((prop) => {
			const regex = new RegExp(`${prop}\\s*:([^;]+);`, 'gi');
			sanitized = sanitized.replace(regex, '');
		});

		return sanitized;
	}

	/**
	 * Validate card constraints
	 */
	validateConstraints(html: string, constraints: CardConstraints): boolean {
		if (!constraints) return true;

		// Create a temporary DOM element to analyze
		const parser = new DOMParser();
		const doc = parser.parseFromString(html, 'text/html');

		// Check for forbidden tags (if defined in constraints)
		const allowedTags = (constraints as any).allowedTags;
		if (allowedTags && Array.isArray(allowedTags)) {
			const allTags = Array.from(doc.body.getElementsByTagName('*'));
			for (const element of allTags) {
				if (!allowedTags.includes(element.tagName.toLowerCase())) {
					console.warn(`Forbidden tag found: ${element.tagName}`);
					return false;
				}
			}
		}

		// Check for scripts (should already be removed by sanitizer)
		if (constraints.preventScripts) {
			if (doc.querySelector('script')) {
				console.warn('Script tags are not allowed');
				return false;
			}
		}

		return true;
	}

	/**
	 * Extract template variables from HTML
	 */
	extractVariables(html: string): TemplateVariable[] {
		const variables: TemplateVariable[] = [];
		const seen = new Set<string>();

		// Match {{variable}} or {{variable:type}}
		const regex = /\{\{(\w+)(?::(\w+))?\}\}/g;
		let match;

		while ((match = regex.exec(html)) !== null) {
			const name = match[1];
			const type = match[2] || 'text';

			if (!seen.has(name)) {
				seen.add(name);
				variables.push({
					name,
					type: type as any,
					required: true,
					label: name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' ')
				});
			}
		}

		return variables;
	}

	/**
	 * Replace template variables with values
	 */
	replaceVariables(template: string, values: Record<string, any>): string {
		let result = template;

		// Replace {{variable}} patterns
		Object.entries(values).forEach(([key, value]) => {
			// Escape the value to prevent XSS
			const escapedValue = this.escapeHtml(String(value || ''));
			const regex = new RegExp(`\\{\\{${key}(?::\\w+)?\\}\\}`, 'g');
			result = result.replace(regex, escapedValue);
		});

		// Remove any remaining unmatched variables
		result = result.replace(/\{\{\w+(?::\w+)?\}\}/g, '');

		return result;
	}

	/**
	 * Escape HTML characters
	 */
	private escapeHtml(text: string): string {
		const map: Record<string, string> = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#x27;',
			'/': '&#x2F;'
		};
		return text.replace(/[&<>"'/]/g, (char) => map[char]);
	}

	/**
	 * Create safe iframe content
	 */
	createSafeIframeContent(html: string, css: string, constraints?: CardConstraints): string {
		const sanitizedHTML = this.sanitizeHTML(html);
		const sanitizedCSS = this.sanitizeCSS(css);

		// Build CSP meta tag
		const csp = `
			default-src 'none';
			style-src 'unsafe-inline';
			img-src data: https:;
			font-src data: https:;
		`
			.replace(/\s+/g, ' ')
			.trim();

		// Build the iframe content
		const iframeContent = `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<meta http-equiv="Content-Security-Policy" content="${csp}">
				<style>
					/* Reset styles */
					* {
						margin: 0;
						padding: 0;
						box-sizing: border-box;
					}
					
					html, body {
						width: 100%;
						height: 100%;
						overflow: auto;
					}
					
					body {
						font-family: system-ui, -apple-system, sans-serif;
						line-height: 1.5;
					}
					
					/* Container styles */
					.card-content {
						width: 100%;
						height: 100%;
						${constraints?.aspectRatio ? `aspect-ratio: ${constraints.aspectRatio};` : ''}
						${constraints?.maxWidth ? `max-width: ${constraints.maxWidth};` : ''}
						${constraints?.minHeight ? `min-height: ${constraints.minHeight};` : ''}
						${constraints?.maxHeight ? `max-height: ${constraints.maxHeight};` : ''}
					}
					
					/* User styles */
					${sanitizedCSS}
				</style>
			</head>
			<body>
				<div class="card-content">
					${sanitizedHTML}
				</div>
			</body>
			</html>
		`;

		return iframeContent;
	}

	/**
	 * Validate CSS property value
	 */
	private isValidCSSValue(property: string, value: string): boolean {
		// Basic validation for common properties
		const validPatterns: Record<string, RegExp> = {
			color: /^(#[0-9a-f]{3,8}|rgb|rgba|hsl|hsla|[a-z]+)$/i,
			width: /^(\d+(%|px|em|rem|vw|vh)|auto|inherit)$/i,
			height: /^(\d+(%|px|em|rem|vw|vh)|auto|inherit)$/i,
			'font-size': /^(\d+(%|px|em|rem)|inherit)$/i,
			margin: /^(\d+(%|px|em|rem)|auto|inherit)$/i,
			padding: /^(\d+(%|px|em|rem)|inherit)$/i
		};

		const pattern = validPatterns[property];
		if (pattern) {
			return pattern.test(value.trim());
		}

		// Default: allow if no javascript
		return !value.includes('javascript:') && !value.includes('expression(');
	}
}

// Export singleton instance
export const cardSanitizer = new CardSanitizer();
