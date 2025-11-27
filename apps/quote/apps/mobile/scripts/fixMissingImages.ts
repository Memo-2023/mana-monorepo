#!/usr/bin/env npx tsx

import { WikimediaImageService } from '../services/wikimediaImageService';
import fs from 'fs/promises';
import path from 'path';

// Custom search function for problematic authors
async function searchWithAlternativeNames(names: string[]): Promise<any> {
	for (const name of names) {
		console.log(`  Trying: ${name}`);
		const result = await WikimediaImageService.searchAuthorImage(name);
		if (result.found) {
			return result;
		}
	}
	return null;
}

// Direct Wikipedia API search
async function directWikipediaSearch(searchTerm: string, lang: string = 'en'): Promise<any> {
	const apiBase = `https://${lang}.wikipedia.org/w/api.php`;
	const searchUrl = new URL(apiBase);
	searchUrl.searchParams.set('action', 'query');
	searchUrl.searchParams.set('list', 'search');
	searchUrl.searchParams.set('srsearch', searchTerm);
	searchUrl.searchParams.set('srlimit', '5');
	searchUrl.searchParams.set('format', 'json');
	searchUrl.searchParams.set('origin', '*');

	try {
		const response = await fetch(searchUrl.toString());
		const data = await response.json();

		if (data.query?.search?.length > 0) {
			// Get images from the first result
			const pageTitle = data.query.search[0].title;
			console.log(`  Found page: ${pageTitle}`);

			const imagesUrl = new URL(apiBase);
			imagesUrl.searchParams.set('action', 'query');
			imagesUrl.searchParams.set('titles', pageTitle);
			imagesUrl.searchParams.set('prop', 'pageimages');
			imagesUrl.searchParams.set('piprop', 'original');
			imagesUrl.searchParams.set('format', 'json');
			imagesUrl.searchParams.set('origin', '*');

			const imgResponse = await fetch(imagesUrl.toString());
			const imgData = await imgResponse.json();

			const pages = imgData.query?.pages || {};
			const pageId = Object.keys(pages)[0];

			if (pageId && pages[pageId]?.original) {
				return {
					found: true,
					title: searchTerm,
					imageInfo: {
						url: pages[pageId].original.source,
						title: pageTitle,
						user: 'Wikipedia',
						width: pages[pageId].original.width,
						height: pages[pageId].original.height,
						size: 0,
					},
				};
			}
		}
	} catch (e) {
		console.error(`  Error: ${e}`);
	}

	return null;
}

async function main() {
	console.log('🔧 Fixing missing author images...\n');

	// 1. Fix Hippokrates
	console.log('1️⃣ Hippokrates:');
	const hippokratesResult = await searchWithAlternativeNames([
		'Hippocrates',
		'Hippocrates of Kos',
		'Hippokrates',
		'Ἱπποκράτης',
	]);

	// 2. Fix George Bernard Shaw
	console.log('\n2️⃣ George Bernard Shaw:');
	const shawResult = await searchWithAlternativeNames([
		'George Bernard Shaw',
		'Bernard Shaw',
		'G. B. Shaw',
		'G.B. Shaw',
	]);

	// 3. German Proverb - use generic image
	console.log('\n3️⃣ German Proverb:');
	console.log('  Searching for Germany/German culture image...');
	const germanResult = await directWikipediaSearch('Germany coat of arms', 'en');

	// 4. Chinese Proverb - use generic image
	console.log('\n4️⃣ Chinese Proverb:');
	console.log('  Searching for China/Chinese culture image...');
	const chineseResult = await directWikipediaSearch('Chinese dragon', 'en');

	// Load existing results
	const resultsPath = path.join(process.cwd(), 'author-images-all.json');
	const existingData = JSON.parse(await fs.readFile(resultsPath, 'utf-8'));

	// Update missing entries
	let updated = 0;

	// Update Hippokrates
	const hippIndex = existingData.authors.findIndex((a) => a.id === 'hippokrates');
	if (hippIndex >= 0 && hippokratesResult?.found) {
		existingData.authors[hippIndex] = {
			...existingData.authors[hippIndex],
			found: true,
			imageInfo: hippokratesResult.imageInfo,
			error: undefined,
		};
		updated++;
		console.log('\n✅ Fixed Hippokrates');
	}

	// Update Shaw
	const shawIndex = existingData.authors.findIndex((a) => a.id === 'shaw-bernard');
	if (shawIndex >= 0 && shawResult?.found) {
		existingData.authors[shawIndex] = {
			...existingData.authors[shawIndex],
			found: true,
			imageInfo: shawResult.imageInfo,
			error: undefined,
		};
		updated++;
		console.log('✅ Fixed George Bernard Shaw');
	}

	// Update German Proverb
	const germanIndex = existingData.authors.findIndex((a) => a.id === 'german-proverb');
	if (germanIndex >= 0 && germanResult?.found) {
		existingData.authors[germanIndex] = {
			...existingData.authors[germanIndex],
			found: true,
			imageInfo: germanResult.imageInfo,
			error: undefined,
		};
		updated++;
		console.log('✅ Added image for German Proverb');
	}

	// Update Chinese Proverb
	const chineseIndex = existingData.authors.findIndex((a) => a.id === 'chinese-proverb');
	if (chineseIndex >= 0 && chineseResult?.found) {
		existingData.authors[chineseIndex] = {
			...existingData.authors[chineseIndex],
			found: true,
			imageInfo: chineseResult.imageInfo,
			error: undefined,
		};
		updated++;
		console.log('✅ Added image for Chinese Proverb');
	}

	// Save updated results
	existingData.timestamp = new Date().toISOString();
	await fs.writeFile(resultsPath, JSON.stringify(existingData, null, 2), 'utf-8');

	// Final summary
	const totalFound = existingData.authors.filter((a) => a.found).length;
	console.log(`\n📊 Summary:`);
	console.log(`   • Fixed: ${updated}/4 missing images`);
	console.log(`   • Total with images: ${totalFound}/${existingData.authors.length}`);
	console.log(
		`   • Success rate: ${Math.round((totalFound / existingData.authors.length) * 100)}%`
	);
}

main().catch((error) => {
	console.error('❌ Script failed:', error);
	process.exit(1);
});
