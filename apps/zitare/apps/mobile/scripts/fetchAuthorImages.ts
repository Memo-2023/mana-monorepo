#!/usr/bin/env npx tsx

import { WikimediaImageService } from '../services/wikimediaImageService';
import { authorsEN } from '../services/data/authors/en';
import { authorsDE } from '../services/data/authors/de';
import fs from 'fs/promises';
import path from 'path';

async function main() {
	console.log('🖼️  Fetching author images from Wikimedia Commons...\n');

	// Get unique authors from both languages
	const allAuthors = [...authorsEN, ...authorsDE];
	const uniqueAuthors = Array.from(
		new Map(allAuthors.map((author) => [author.id, author])).values()
	);

	// Filter out 'unknown' authors and get next batch
	const realAuthors = uniqueAuthors
		.filter((author) => author.id !== 'unbekannt' && author.verified)
		.slice(8, 16); // Next 8 authors (9-16)

	console.log(`📚 Processing ${realAuthors.length} authors:`);
	realAuthors.forEach((author) => console.log(`   • ${author.name}`));
	console.log();

	// Search for images
	const results = await WikimediaImageService.searchMultipleAuthors(
		realAuthors.map((author) => author.name)
	);

	// Display results
	console.log('🔍 Search Results:\n');
	results.forEach((result, index) => {
		const author = realAuthors[index];
		console.log(`📖 ${author.name} (${author.id}):`);

		if (result.found && result.imageInfo) {
			console.log(`   ✅ Found image: ${result.imageInfo.title}`);
			console.log(`   🔗 URL: ${result.imageInfo.url}`);
			console.log(`   👤 Credit: ${result.imageInfo.user}`);
			console.log(`   📐 Size: ${result.imageInfo.width}x${result.imageInfo.height}`);
		} else {
			console.log(`   ❌ Not found: ${result.error || 'Unknown error'}`);
		}
		console.log();
	});

	// Save results to JSON file
	const outputData = {
		timestamp: new Date().toISOString(),
		authors: results.map((result, index) => ({
			id: realAuthors[index].id,
			name: realAuthors[index].name,
			found: result.found,
			imageInfo: result.imageInfo,
			error: result.error,
		})),
	};

	const outputPath = path.join(process.cwd(), 'author-images-results-batch2.json');
	await fs.writeFile(outputPath, JSON.stringify(outputData, null, 2), 'utf-8');
	console.log(`💾 Results saved to: ${outputPath}`);

	// Summary
	const foundCount = results.filter((r) => r.found).length;
	console.log(`\n📊 Summary:`);
	console.log(`   • Found images: ${foundCount}/${results.length}`);
	console.log(`   • Success rate: ${Math.round((foundCount / results.length) * 100)}%`);
}

// Run the script
main().catch((error) => {
	console.error('❌ Script failed:', error);
	process.exit(1);
});
