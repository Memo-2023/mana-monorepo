import { marked } from 'marked';
import {
	extractReferences,
	fetchReferences,
	replaceReferences,
	type ReferenceData,
} from '$lib/services/referenceResolver';

// Configure marked for safe rendering
marked.setOptions({
	breaks: true, // Convert \n to <br>
	gfm: true, // GitHub Flavored Markdown
	pedantic: false,
});

/**
 * Render markdown to HTML with smart @reference display
 * This is the async version that fetches real names
 */
export async function renderMarkdownSmart(
	text: string,
	context?: { characters?: any[]; place?: any }
): Promise<string> {
	if (!text) return '';

	console.log('🎨 renderMarkdownSmart input:', text.substring(0, 200));

	// Handle REF_X placeholders if they exist (for backward compatibility)
	let processedText = text;
	if (/REF_\d+/.test(text) && context) {
		console.warn('⚠️ Found REF_X placeholders - attempting to fix them...');

		// Build mapping from context
		const refMapping: Record<string, string> = {};
		let refIndex = 0;

		// Add characters
		if (context.characters) {
			context.characters.forEach((char: any) => {
				if (char.slug) {
					refMapping[`REF_${refIndex}`] = `@${char.slug}`;
					console.log(`Mapping REF_${refIndex} → @${char.slug}`);
					refIndex++;
				}
			});
		}

		// Add place
		if (context.place?.slug) {
			refMapping[`REF_${refIndex}`] = `@${context.place.slug}`;
			console.log(`Mapping REF_${refIndex} → @${context.place.slug}`);
		}

		// Replace all REF_X with mapped values
		for (const [ref, replacement] of Object.entries(refMapping)) {
			processedText = processedText.replace(new RegExp(ref, 'g'), replacement);
		}

		console.log('Fixed text:', processedText.substring(0, 200));
	}

	// 1. Extract all @references
	const slugs = extractReferences(processedText);
	console.log('📝 Found slugs in text:', slugs);

	// 2. Fetch reference data (with caching)
	const references = slugs.length > 0 ? await fetchReferences(slugs) : new Map();
	console.log('📚 Fetched references:', Array.from(references.entries()));

	// 3. Temporarily protect references from markdown processing
	const placeholders: string[] = [];
	let protectedText = processedText.replace(/@([\w-]+)/g, (match) => {
		placeholders.push(match);
		return `__MDREF_${placeholders.length - 1}_MDREF__`;
	});

	// 4. Render markdown
	let html = String(marked.parse(protectedText));

	// 5. Restore references with smart display
	placeholders.forEach((ref, index) => {
		const slug = ref.substring(1);
		const data = references.get(slug);

		if (data) {
			// Use real name from database
			html = html.replace(
				`__MDREF_${index}_MDREF__`,
				`<a href="/${slug}" class="text-theme-primary-600 hover:text-theme-primary-500 font-medium" data-kind="${data.kind}">${data.title}</a>`
			);
		} else {
			// Fallback: format slug nicely
			const displayName = slug
				.split('-')
				.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
				.join(' ');

			html = html.replace(
				`__MDREF_${index}_MDREF__`,
				`<a href="/${slug}" class="text-theme-primary-600 hover:text-theme-primary-500 font-medium opacity-75">${displayName}</a>`
			);
		}
	});

	return html;
}

/**
 * Immediate markdown rendering (without async lookup)
 * Uses simple slug formatting as fallback
 */
export function renderMarkdown(text: string): string {
	if (!text) return '';

	// First, temporarily replace @references to protect them from markdown
	const references: string[] = [];
	let protectedText = text.replace(/@([\w-]+)/g, (match) => {
		references.push(match);
		return `__MDREF_${references.length - 1}_MDREF__`;
	});

	// Render markdown
	let html = String(marked.parse(protectedText));

	// Restore @references as links with formatted names
	references.forEach((ref, index) => {
		const slug = ref.substring(1);
		// Simple formatting: finn-zahnrad → Finn Zahnrad
		const displayName = slug
			.split('-')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');

		html = html.replace(
			`__MDREF_${index}_MDREF__`,
			`<a href="/${slug}" class="text-theme-primary-600 hover:text-theme-primary-500 font-medium">${displayName}</a>`
		);
	});

	return html;
}

/**
 * Parse @references in plain text (non-markdown)
 * This is the async version that fetches real names
 */
export async function parseReferencesSmart(text: string | undefined): Promise<string> {
	if (!text) return '';

	// Check if text contains markdown formatting
	const hasMarkdown = /[#*_`~\[\]]/.test(text);

	if (hasMarkdown) {
		// Use full markdown rendering with smart display
		return renderMarkdownSmart(text);
	} else {
		// Simple reference parsing for plain text
		const slugs = extractReferences(text);
		const references = slugs.length > 0 ? await fetchReferences(slugs) : new Map();

		return replaceReferences(text, references, {
			linkClass: 'text-theme-primary-600 hover:text-theme-primary-500 font-medium',
		});
	}
}

/**
 * Parse @references and create links (immediate version)
 */
export function parseReferences(text: string | undefined): string {
	if (!text) return '';

	// Check if text contains markdown formatting
	const hasMarkdown = /[#*_`~\[\]]/.test(text);

	if (hasMarkdown) {
		// Use full markdown rendering
		return renderMarkdown(text);
	} else {
		// Simple reference parsing for plain text with formatted names
		return text.replace(/@([\w-]+)/g, (match, slug) => {
			const displayName = slug
				.split('-')
				.map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
				.join(' ');

			return `<a href="/${slug}" class="text-theme-primary-600 hover:text-theme-primary-500 font-medium">${displayName}</a>`;
		});
	}
}
