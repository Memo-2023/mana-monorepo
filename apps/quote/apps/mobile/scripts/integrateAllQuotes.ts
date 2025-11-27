#!/usr/bin/env npx tsx

import fs from 'fs/promises';
import path from 'path';
import { EnhancedQuote } from '../services/contentLoader';

async function integrateAllQuotes() {
	console.log('📝 Integrating all quotes from archive...\n');

	// Load archived quotes
	const archivePathEN = path.join(process.cwd(), 'content/archive/data/en/quotes.json');
	const archivePathDE = path.join(process.cwd(), 'content/archive/data/de/quotes.json');

	const archiveDataEN = JSON.parse(await fs.readFile(archivePathEN, 'utf-8'));
	const archiveDataDE = JSON.parse(await fs.readFile(archivePathDE, 'utf-8'));

	console.log(`📊 Found ${archiveDataEN.quotes.length} English quotes`);
	console.log(`📊 Found ${archiveDataDE.quotes.length} German quotes`);

	// Process English quotes
	const quotesEN: Omit<EnhancedQuote, 'author'>[] = archiveDataEN.quotes.map((quote: any) => ({
		id: quote.id,
		text: quote.text,
		authorId: quote.authorId,
		categories: quote.categories || [],
		tags: quote.tags || [],
		source: quote.source,
		year: quote.year,
		featured: quote.featured || false,
		language: 'en' as const,
		isFavorite: false,
		category: quote.categories?.[0] || 'wisdom',
	}));

	// Process German quotes
	const quotesDE: Omit<EnhancedQuote, 'author'>[] = archiveDataDE.quotes.map((quote: any) => ({
		id: quote.id,
		text: quote.text,
		authorId: quote.authorId,
		categories: quote.categories || [],
		tags: quote.tags || [],
		source: quote.source,
		year: quote.year,
		featured: quote.featured || false,
		language: 'de' as const,
		isFavorite: false,
		category: quote.categories?.[0] || 'wisdom',
	}));

	// Generate TypeScript files
	const enContent = `import { EnhancedQuote } from '../../contentLoader';

export const quotesEN: Omit<EnhancedQuote, 'author'>[] = ${JSON.stringify(quotesEN, null, 2)};
`;

	const deContent = `import { EnhancedQuote } from '../../contentLoader';

export const quotesDE: Omit<EnhancedQuote, 'author'>[] = ${JSON.stringify(quotesDE, null, 2)};
`;

	// Write files
	const enPath = path.join(process.cwd(), 'services/data/quotes/en.ts');
	const dePath = path.join(process.cwd(), 'services/data/quotes/de.ts');

	await fs.writeFile(enPath, enContent, 'utf-8');
	await fs.writeFile(dePath, deContent, 'utf-8');

	console.log(`\n✅ Successfully integrated ${quotesEN.length} English quotes`);
	console.log(`✅ Successfully integrated ${quotesDE.length} German quotes`);
	console.log('\n🎉 All quotes from archive are now in the app!');
}

integrateAllQuotes().catch((error) => {
	console.error('❌ Script failed:', error);
	process.exit(1);
});
