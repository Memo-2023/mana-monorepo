#!/usr/bin/env node

/**
 * Final comprehensive fix for biography structures
 */

import * as fs from 'fs';
import * as path from 'path';

function fixAllBiographies(content: string): string {
	const lines = content.split('\n');
	const result: string[] = [];

	let i = 0;
	while (i < lines.length) {
		const line = lines[i];
		const trimmed = line.trim();

		// Check for biography object that has only short and closes immediately
		if (trimmed === '"biography": {' && i + 2 < lines.length) {
			const nextLine = lines[i + 1];
			const afterNext = lines[i + 2];

			if (nextLine.includes('"short":') && afterNext.trim() === '},') {
				// Check if line i+3 is a section definition
				if (i + 3 < lines.length) {
					const possibleSection = lines[i + 3].trim();
					// Check if it's a section (has structure like "sectionName": {)
					if (possibleSection.match(/^"[a-zA-Z]+": \{$/)) {
						// We need to fix this - add sections wrapper
						result.push(line); // biography line
						result.push(nextLine.endsWith(',') ? nextLine : nextLine + ','); // short line
						result.push('      "sections": {'); // add sections wrapper

						// Now find where sections end (look for keyAchievements or famousQuote)
						let j = i + 3;
						let sectionsContent: string[] = [];
						while (j < lines.length) {
							const currentLine = lines[j];
							const currentTrimmed = currentLine.trim();

							if (
								currentTrimmed.startsWith('"keyAchievements":') ||
								currentTrimmed.startsWith('"famousQuote":') ||
								currentTrimmed === '},'
							) {
								// End of sections
								break;
							}
							sectionsContent.push(currentLine);
							j++;
						}

						// Add all section content
						sectionsContent.forEach((sectionLine) => result.push(sectionLine));

						// Close sections
						result.push('      },');

						// Continue from where we left off
						i = j;
						continue;
					}
				}
			}
		}

		// Default case - just add the line
		result.push(line);
		i++;
	}

	return result.join('\n');
}

// Fix de.ts
const deFile = path.join(process.cwd(), 'services', 'data', 'authors', 'de.ts');
if (fs.existsSync(deFile)) {
	console.log('Final fix for de.ts...');
	const content = fs.readFileSync(deFile, 'utf-8');
	const fixed = fixAllBiographies(content);
	fs.writeFileSync(deFile, fixed, 'utf-8');
	console.log('✓ Fixed de.ts');
}

// Fix en.ts
const enFile = path.join(process.cwd(), 'services', 'data', 'authors', 'en.ts');
if (fs.existsSync(enFile)) {
	console.log('Final fix for en.ts...');
	const content = fs.readFileSync(enFile, 'utf-8');
	const fixed = fixAllBiographies(content);
	fs.writeFileSync(enFile, fixed, 'utf-8');
	console.log('✓ Fixed en.ts');
}

console.log('\nDone!');
