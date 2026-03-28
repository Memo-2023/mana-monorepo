/**
 * Markdown + Frontmatter Parser
 * Parses Markdown files with YAML frontmatter
 */

import matter from 'gray-matter';
import { marked } from 'marked';
import type { ZodType, ZodTypeDef } from 'zod';
import { sanitizeHtml } from './sanitize.js';

export interface ParsedContent<T> {
	frontmatter: T;
	content: string;
	html: string;
}

export interface ParseOptions {
	/** Convert Markdown to HTML */
	renderHtml?: boolean;
}

/**
 * Parse a Markdown file with frontmatter
 */
export function parseMarkdown<T>(
	rawContent: string,
	schema?: ZodType<T, ZodTypeDef, unknown>,
	options: ParseOptions = { renderHtml: true }
): ParsedContent<T> {
	const { data, content } = matter(rawContent);

	// Validate frontmatter if schema provided
	let frontmatter: T;
	if (schema) {
		const result = schema.safeParse(data);
		if (!result.success) {
			throw new Error(`Invalid frontmatter: ${result.error.message}`);
		}
		frontmatter = result.data;
	} else {
		frontmatter = data as T;
	}

	// Render HTML if requested, then sanitize to prevent XSS
	const html = options.renderHtml ? sanitizeHtml(marked.parse(content) as string) : '';

	return {
		frontmatter,
		content: content.trim(),
		html,
	};
}

/**
 * Parse multiple Markdown files
 */
export function parseMarkdownFiles<T>(
	files: { filename: string; content: string }[],
	schema?: ZodType<T, ZodTypeDef, unknown>,
	options?: ParseOptions
): Array<ParsedContent<T> & { filename: string }> {
	return files.map(({ filename, content }) => ({
		filename,
		...parseMarkdown<T>(content, schema, options),
	}));
}

/**
 * Extract text content from HTML (for search indexing)
 */
export function stripHtml(html: string): string {
	return html
		.replace(/<[^>]*>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

/**
 * Generate excerpt from content
 */
export function generateExcerpt(content: string, maxLength = 150): string {
	const text = stripHtml(content);
	if (text.length <= maxLength) {
		return text;
	}
	return text.substring(0, maxLength).trim() + '...';
}
