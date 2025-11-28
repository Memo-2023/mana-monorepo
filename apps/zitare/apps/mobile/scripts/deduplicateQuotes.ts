import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface Quote {
	id: string;
	text: string;
	authorId: string;
	categories: string[];
	tags: string[];
	source?: string;
	year?: number;
	featured?: boolean;
	language: string;
	isFavorite: boolean;
	category: string;
}

function deduplicateQuotes(filePath: string, language: 'de' | 'en') {
	console.log(`\n📖 Processing ${language.toUpperCase()} quotes from: ${filePath}`);

	// Read the file
	const fileContent = readFileSync(filePath, 'utf-8');

	// Extract the quotes array using regex
	const arrayMatch = fileContent.match(/export const quotes[A-Z]{2}: .*?\[\s*([\s\S]*?)\s*\];/);
	if (!arrayMatch) {
		console.error('❌ Could not find quotes array in file');
		return;
	}

	// Parse the JSON array
	const quotesArrayString = '[' + arrayMatch[1] + ']';
	let quotes: Quote[];
	try {
		quotes = JSON.parse(quotesArrayString);
	} catch (error) {
		console.error('❌ Error parsing quotes:', error);
		return;
	}

	console.log(`📊 Total quotes before deduplication: ${quotes.length}`);

	// Find duplicates by text
	const textMap = new Map<string, Quote[]>();
	quotes.forEach((quote) => {
		const existing = textMap.get(quote.text) || [];
		existing.push(quote);
		textMap.set(quote.text, existing);
	});

	// Identify duplicates
	const duplicates: Array<{ text: string; quotes: Quote[] }> = [];
	textMap.forEach((quotesList, text) => {
		if (quotesList.length > 1) {
			duplicates.push({ text, quotes: quotesList });
		}
	});

	console.log(`\n🔍 Found ${duplicates.length} duplicate texts`);
	console.log(
		`📝 Total duplicate quote entries: ${duplicates.reduce((sum, d) => sum + d.quotes.length - 1, 0)}`
	);

	// Log some examples
	console.log('\n📋 Examples of duplicates:');
	duplicates.slice(0, 5).forEach((dup, index) => {
		console.log(
			`\n${index + 1}. Text: "${dup.text.substring(0, 80)}${dup.text.length > 80 ? '...' : ''}"`
		);
		console.log(
			`   Found ${dup.quotes.length} times with IDs: ${dup.quotes.map((q) => q.id).join(', ')}`
		);
	});

	// Deduplicate: Keep the first occurrence of each text
	const uniqueQuotes: Quote[] = [];
	const seenTexts = new Set<string>();

	quotes.forEach((quote) => {
		if (!seenTexts.has(quote.text)) {
			uniqueQuotes.push(quote);
			seenTexts.add(quote.text);
		}
	});

	console.log(`\n✅ Quotes after deduplication: ${uniqueQuotes.length}`);
	console.log(`🗑️  Removed: ${quotes.length - uniqueQuotes.length} duplicate entries`);

	// Create backup
	const backupPath = filePath + `.backup-${Date.now()}`;
	writeFileSync(backupPath, fileContent);
	console.log(`\n💾 Backup created: ${backupPath}`);

	// Generate new file content
	const variableName = language === 'de' ? 'quotesDE' : 'quotesEN';
	const importStatement =
		fileContent.match(/^import .*?;/m)?.[0] ||
		"import { EnhancedQuote } from '../../contentLoader';";

	const newContent = `${importStatement}

export const ${variableName}: Omit<EnhancedQuote, 'author'>[] = ${JSON.stringify(uniqueQuotes, null, 2)};
`;

	// Write the deduplicated file
	writeFileSync(filePath, newContent);
	console.log(`✨ File updated successfully: ${filePath}\n`);

	return {
		before: quotes.length,
		after: uniqueQuotes.length,
		removed: quotes.length - uniqueQuotes.length,
		duplicateTexts: duplicates.length,
	};
}

// Main execution
const projectRoot = join(__dirname, '..');

console.log('🚀 Starting deduplication process...\n');
console.log('='.repeat(60));

const deResult = deduplicateQuotes(join(projectRoot, 'services/data/quotes/de.ts'), 'de');

console.log('='.repeat(60));

const enResult = deduplicateQuotes(join(projectRoot, 'services/data/quotes/en.ts'), 'en');

console.log('='.repeat(60));
console.log('\n📊 SUMMARY:');
console.log('='.repeat(60));
if (deResult) {
	console.log(`\n🇩🇪 German Quotes:`);
	console.log(`   Before: ${deResult.before}`);
	console.log(`   After:  ${deResult.after}`);
	console.log(`   Removed: ${deResult.removed}`);
}

if (enResult) {
	console.log(`\n🇬🇧 English Quotes:`);
	console.log(`   Before: ${enResult.before}`);
	console.log(`   After:  ${enResult.after}`);
	console.log(`   Removed: ${enResult.removed}`);
}

console.log('\n✅ Deduplication complete!\n');
