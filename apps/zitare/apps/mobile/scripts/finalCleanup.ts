#!/usr/bin/env node

/**
 * Final cleanup - manually remove remaining duplicates
 */

import * as fs from 'fs';
import * as path from 'path';

function removeDuplicatesManually(filePath: string): number {
	let content = fs.readFileSync(filePath, 'utf-8');
	let removedCount = 0;

	// Specific line ranges for duplicates in de.ts
	if (filePath.includes('de.ts')) {
		const duplicatesToRemove = [
			{
				id: 'aristoteles',
				startPattern:
					'  {\n    "id": "aristoteles",\n    "name": "Aristoteles",\n    "profession": [\n      "Philosoph"',
				lineCount: 15,
			},
			{ id: 'aurelius-marcus', startPattern: '  {\n    "id": "aurelius-marcus",', lineCount: 12 },
			{
				id: 'brecht-bertolt',
				startPattern:
					'  {\n    "id": "brecht-bertolt",\n    "name": "Bertolt Brecht",\n    "profession": [\n      "Playwright"',
				lineCount: 12,
			},
			{
				id: 'hesse-hermann',
				startPattern:
					'  {\n    "id": "hesse-hermann",\n    "name": "Hermann Hesse",\n    "profession": [\n      "Writer"',
				lineCount: 12,
			},
			{
				id: 'roosevelt-eleanor',
				startPattern:
					'  {\n    "id": "roosevelt-eleanor",\n    "name": "Eleanor Roosevelt",\n    "profession": [\n      "First Lady"',
				lineCount: 15,
			},
		];

		// Process in reverse order to maintain indices
		for (const dup of duplicatesToRemove.reverse()) {
			const index = content.lastIndexOf(dup.startPattern);
			if (index > -1) {
				// Find the end of this object (look for the next "},")
				let endIndex = content.indexOf('\n  },', index);
				if (endIndex > -1) {
					endIndex += 5; // Include the "}," part
					// Also include the comma and newline if it's not the last item
					if (content[endIndex] === ',') {
						endIndex++;
					}
					if (content[endIndex] === '\n') {
						endIndex++;
					}

					content = content.substring(0, index) + content.substring(endIndex);
					removedCount++;
					console.log(`Removed duplicate: ${dup.id}`);
				}
			}
		}
	}

	// For en.ts file
	if (filePath.includes('en.ts')) {
		// Similar process for English file - find and remove last occurrence
		const idsToRemove = [
			'aristoteles',
			'aurelius-marcus',
			'demokrit',
			'drucker-peter',
			'ford-henry',
			'hesse-hermann',
			'lasorda-tommy',
			'roosevelt-eleanor',
			'sokrates',
			'swindoll-charles',
		];

		for (const id of idsToRemove) {
			const pattern = `  {\n    "id": "${id}",`;
			const firstIndex = content.indexOf(pattern);
			const lastIndex = content.lastIndexOf(pattern);

			if (firstIndex > -1 && lastIndex > -1 && firstIndex !== lastIndex) {
				// Remove the last occurrence
				let endIndex = content.indexOf('\n  },', lastIndex);
				if (endIndex > -1) {
					endIndex += 5;
					if (content[endIndex] === ',') endIndex++;
					if (content[endIndex] === '\n') endIndex++;

					content = content.substring(0, lastIndex) + content.substring(endIndex);
					removedCount++;
					console.log(`Removed duplicate: ${id}`);
				}
			}
		}
	}

	if (removedCount > 0) {
		fs.writeFileSync(filePath, content, 'utf-8');
		console.log(`✓ Saved changes to ${path.basename(filePath)}`);
	}

	return removedCount;
}

function countAuthors(filePath: string): { total: number; unique: number } {
	const content = fs.readFileSync(filePath, 'utf-8');
	const allIds = [...content.matchAll(/"id":\s*"([^"]*)"/g)].map((m) => m[1]);
	const uniqueIds = new Set(allIds);
	return { total: allIds.length, unique: uniqueIds.size };
}

async function main() {
	console.log('=== Final Cleanup ===\n');

	const deFile = path.join(process.cwd(), 'services', 'data', 'authors', 'de.ts');
	const enFile = path.join(process.cwd(), 'services', 'data', 'authors', 'en.ts');

	// Count before
	console.log('Before cleanup:');
	const deBefore = countAuthors(deFile);
	const enBefore = countAuthors(enFile);
	console.log(
		`DE: ${deBefore.total} total, ${deBefore.unique} unique (${deBefore.total - deBefore.unique} duplicates)`
	);
	console.log(
		`EN: ${enBefore.total} total, ${enBefore.unique} unique (${enBefore.total - enBefore.unique} duplicates)`
	);

	console.log('\nRemoving duplicates...\n');

	// Remove duplicates
	const deRemoved = removeDuplicatesManually(deFile);
	const enRemoved = removeDuplicatesManually(enFile);

	// Count after
	console.log('\nAfter cleanup:');
	const deAfter = countAuthors(deFile);
	const enAfter = countAuthors(enFile);
	console.log(
		`DE: ${deAfter.total} total, ${deAfter.unique} unique (${deAfter.total - deAfter.unique} duplicates)`
	);
	console.log(
		`EN: ${enAfter.total} total, ${enAfter.unique} unique (${enAfter.total - enAfter.unique} duplicates)`
	);

	console.log('\n=== Summary ===');
	console.log(`✓ Removed ${deRemoved} duplicates from de.ts`);
	console.log(`✓ Removed ${enRemoved} duplicates from en.ts`);

	if (deAfter.total === deAfter.unique && enAfter.total === enAfter.unique) {
		console.log('\n✅ All duplicates removed successfully!');
	} else {
		console.log('\n⚠️  Some duplicates may still remain. Manual review recommended.');
	}
}

main().catch(console.error);
