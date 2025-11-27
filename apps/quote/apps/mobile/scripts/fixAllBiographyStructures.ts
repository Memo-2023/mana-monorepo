#!/usr/bin/env node

/**
 * Script to fix ALL malformed biography structures in author data files
 * Handles cases where biography object closes prematurely
 */

import * as fs from 'fs';
import * as path from 'path';

function fixBiographyStructures(content: string): string {
	const lines = content.split('\n');
	const fixedLines: string[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const trimmed = line.trim();

		// Check for the problematic pattern: biography with only short, then },
		if (trimmed === '"biography": {' && i + 2 < lines.length) {
			const nextLine = lines[i + 1];
			const afterNext = lines[i + 2];

			// Check if it's the problematic pattern
			if (nextLine.includes('"short":') && afterNext.trim() === '},') {
				// Check what comes after - if it's a section definition
				if (i + 3 < lines.length) {
					const sectionLine = lines[i + 3].trim();
					// Check if next line looks like a section
					if (
						sectionLine.match(
							/^"(teacher|politician|wanderer|basel|weimar|exile|return|master|zarathustra|madness|earlyLife|patentClerk|riseToProminence|breakthrough|finalYears|earlyCareer|vienna|rome|composer|parisian|salon|court|renaissance|artist|polymath|warrior|philosopher|enlightenment|minister|cambridge|soldier|leipzig|studies|lawyer|paris|algiers|youth|resistance|prague|spain|america|struggle|prison|president|rebel|thinker|war|peace|early|mature|late|young|middle|final|reform|exile|modern|contemporary|classical|romantic|baroque|impressionist|expressionist|surrealist|abstract|minimalist|conceptual|performance|installation|video|digital|virtual|augmented|mixed|hybrid|fusion|synthesis|integration|evolution|revolution|transformation|transcendence|ascension|apotheosis|divinity|infinity|eternity|immortality|legacy)": \{/
						)
					) {
						// Fix: add sections wrapper
						fixedLines.push(line); // biography line
						fixedLines.push(nextLine + ','); // short line with comma
						fixedLines.push(lines[i + 2].replace('},', '  "sections": {')); // replace }, with sections
						i += 2; // skip the lines we've processed
						continue;
					}
				}
			}
		}

		// Check for closing pattern - need to close sections before closing biography
		if (trimmed === '},' && i >= 2) {
			// Look back to see if we're closing a section
			const prevLine = lines[i - 1].trim();
			const prevPrevLine = lines[i - 2].trim();

			// Check if previous lines indicate end of a section
			if (prevLine === '}' && prevPrevLine.includes('"content":')) {
				// Check what comes next
				if (i + 1 < lines.length) {
					const nextLine = lines[i + 1].trim();
					// If next line is keyAchievements or famousQuote, we need to close sections
					if (nextLine.startsWith('"keyAchievements":') || nextLine.startsWith('"famousQuote":')) {
						fixedLines.push('      }'); // close sections
						fixedLines.push(line); // then the }, for biography
						continue;
					}
				}
			}
		}

		// Default: keep line as is
		fixedLines.push(line);
	}

	return fixedLines.join('\n');
}

// Fix de.ts file
const deFile = path.join(process.cwd(), 'services', 'data', 'authors', 'de.ts');
if (fs.existsSync(deFile)) {
	console.log('Fixing services/data/authors/de.ts...');
	const content = fs.readFileSync(deFile, 'utf-8');
	const fixed = fixBiographyStructures(content);
	fs.writeFileSync(deFile, fixed, 'utf-8');
	console.log('✓ Fixed de.ts');
}

// Fix en.ts file
const enFile = path.join(process.cwd(), 'services', 'data', 'authors', 'en.ts');
if (fs.existsSync(enFile)) {
	console.log('Fixing services/data/authors/en.ts...');
	const content = fs.readFileSync(enFile, 'utf-8');
	const fixed = fixBiographyStructures(content);
	fs.writeFileSync(enFile, fixed, 'utf-8');
	console.log('✓ Fixed en.ts');
}

console.log('\nDone! Biography structures have been fixed.');
