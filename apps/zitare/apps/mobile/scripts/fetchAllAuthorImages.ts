#!/usr/bin/env npx tsx

import { WikimediaImageService } from '../services/wikimediaImageService';
import fs from 'fs/promises';
import path from 'path';

interface ArchiveAuthor {
	id: string;
	name: string;
	profession: string[];
	verified?: boolean;
	featured?: boolean;
}

async function main() {
	console.log('🖼️  Fetching ALL author images from Wikimedia Commons...\n');

	// Read the archive authors file
	const archivePath = path.join(process.cwd(), 'content/archive/data/en/authors.json');
	const archiveData = JSON.parse(await fs.readFile(archivePath, 'utf-8'));
	const archiveAuthors: ArchiveAuthor[] = archiveData.authors;

	// Get authors we want to process (skip the ones already done - first 45)
	const startIndex = 100;
	const batchSize = 30;
	const authorsToProcess = archiveAuthors
		.filter((author) => author.verified !== false && author.id !== 'unbekannt')
		.slice(startIndex, startIndex + batchSize);

	if (authorsToProcess.length === 0) {
		console.log('✅ No more authors to process!');
		return;
	}

	console.log(
		`📚 Processing ${authorsToProcess.length} authors (batch ${Math.floor(startIndex / batchSize) + 1}):`
	);
	authorsToProcess.forEach((author) => console.log(`   • ${author.name} (${author.id})`));
	console.log();

	// Search for images
	const results = await WikimediaImageService.searchMultipleAuthors(
		authorsToProcess.map((author) => author.name)
	);

	// Display results
	console.log('🔍 Search Results:\n');
	results.forEach((result, index) => {
		const author = authorsToProcess[index];
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

	// Read existing combined results
	let allResults = [];
	const combinedPath = path.join(process.cwd(), 'author-images-all.json');

	try {
		const existingData = JSON.parse(await fs.readFile(combinedPath, 'utf-8'));
		allResults = existingData.authors || [];
		console.log(`📂 Loaded ${allResults.length} existing author images`);
	} catch (e) {
		console.log('📝 Creating new combined results file');
	}

	// Add new results (avoiding duplicates)
	const newResults = results.map((result, index) => ({
		id: authorsToProcess[index].id,
		name: authorsToProcess[index].name,
		profession: authorsToProcess[index].profession,
		found: result.found,
		imageInfo: result.imageInfo,
		error: result.error,
	}));

	// Filter out duplicates based on author ID
	const existingIds = new Set(allResults.map((r) => r.id));
	const uniqueNewResults = newResults.filter((r) => !existingIds.has(r.id));

	allResults.push(...uniqueNewResults);

	// Save combined results
	const combinedData = {
		timestamp: new Date().toISOString(),
		totalAuthors: allResults.length,
		authors: allResults,
	};

	await fs.writeFile(combinedPath, JSON.stringify(combinedData, null, 2), 'utf-8');
	console.log(`💾 Combined results saved to: ${combinedPath}`);

	// Summary
	const foundCount = newResults.filter((r) => r.found).length;
	const totalFound = allResults.filter((r) => r.found).length;

	console.log(`\n📊 New Batch Summary:`);
	console.log(`   • Found images: ${foundCount}/${newResults.length}`);
	console.log(`   • Success rate: ${Math.round((foundCount / newResults.length) * 100)}%`);

	console.log(`\n📊 Total Summary:`);
	console.log(`   • Total authors processed: ${allResults.length}`);
	console.log(`   • Total images found: ${totalFound}/${allResults.length}`);
	console.log(`   • Overall success rate: ${Math.round((totalFound / allResults.length) * 100)}%`);

	// Check if there are more authors to process
	const totalVerifiedAuthors = archiveAuthors.filter(
		(author) => author.verified !== false && author.id !== 'unbekannt'
	).length;
	const remaining = totalVerifiedAuthors - (startIndex + batchSize);
	if (remaining > 0) {
		console.log(`\n⏩ ${remaining} more authors remaining. Run the script again to continue!`);
	} else {
		console.log(`\n🎉 All authors processed!`);
	}
}

// Run the script
main().catch((error) => {
	console.error('❌ Script failed:', error);
	process.exit(1);
});
