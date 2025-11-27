/**
 * Script to sync Markdown biographies to TypeScript data files
 * This updates the author biographies in the services/data/authors files
 * with the content from the Markdown files in content/authors/profiles
 */

import * as fs from 'fs';
import * as path from 'path';
import * as matter from 'gray-matter';

interface MarkdownProfile {
	id: string;
	name: string;
	born?: string;
	died?: string;
	nationality?: string;
	image?: string;
	featured?: boolean;
	content: string;
}

interface AuthorBiography {
	short: string;
	long?: string;
	sections?: {
		[key: string]: {
			title: string;
			content: string;
		};
	};
	keyAchievements?: string[];
	famousQuote?: string;
}

function parseMarkdownContent(content: string): AuthorBiography {
	const lines = content.split('\n').filter((line) => line.trim());
	const biography: AuthorBiography = {
		short: '',
		long: '',
		sections: {},
		keyAchievements: [],
	};

	// Find "Kurzbiografie" section for short bio
	const kurzBioIndex = lines.findIndex((line) => line.includes('## Kurzbiografie'));
	if (kurzBioIndex !== -1 && kurzBioIndex + 1 < lines.length) {
		// Get the paragraph after "Kurzbiografie"
		let shortBio = '';
		for (let i = kurzBioIndex + 1; i < lines.length; i++) {
			if (lines[i].startsWith('#')) break;
			if (lines[i].trim()) {
				shortBio += lines[i] + ' ';
			}
		}
		biography.short = shortBio.trim();
	}

	// Extract a longer biography from the first few paragraphs
	let longBio = '';
	let startCollecting = false;
	let paragraphCount = 0;

	for (const line of lines) {
		if (line.includes('## Kurzbiografie')) {
			startCollecting = true;
			continue;
		}
		if (startCollecting && !line.startsWith('#') && line.trim()) {
			longBio += line + ' ';
			if (line.endsWith('.')) {
				paragraphCount++;
				if (paragraphCount >= 2) break;
			}
		}
	}

	if (longBio) {
		biography.long = longBio.trim();
	}

	// Extract sections with specific titles
	const sectionTitles = [
		'Leben und Werk',
		'Philosophie',
		'Wissenschaftliche Leistungen',
		'Literarisches Schaffen',
		'Politische Laufbahn',
		'Hauptwerke',
		'Vermächtnis',
		'Bedeutung',
	];

	for (const title of sectionTitles) {
		const sectionIndex = lines.findIndex(
			(line) => line.includes(`## ${title}`) || line.includes(`### ${title}`)
		);

		if (sectionIndex !== -1) {
			let sectionContent = '';
			for (let i = sectionIndex + 1; i < lines.length; i++) {
				if (lines[i].startsWith('#')) break;
				if (lines[i].trim() && !lines[i].startsWith('-')) {
					sectionContent += lines[i] + ' ';
				}
			}

			if (sectionContent.trim()) {
				const sectionKey = title.toLowerCase().replace(/\s+/g, '');
				biography.sections![sectionKey] = {
					title,
					content: sectionContent.trim(),
				};
			}
		}
	}

	// Extract key achievements (look for bullet points)
	const achievementsIndex = lines.findIndex(
		(line) =>
			line.includes('Errungenschaften') ||
			line.includes('Leistungen') ||
			line.includes('Wichtige Werke')
	);

	if (achievementsIndex !== -1) {
		for (let i = achievementsIndex + 1; i < lines.length; i++) {
			if (lines[i].startsWith('#')) break;
			if (lines[i].startsWith('-') || lines[i].startsWith('*')) {
				const achievement = lines[i].replace(/^[-*]\s*/, '').trim();
				if (achievement) {
					biography.keyAchievements!.push(achievement);
				}
			}
		}
	}

	// Extract a famous quote
	const quoteIndex = lines.findIndex((line) => line.startsWith('>'));
	if (quoteIndex !== -1) {
		biography.famousQuote = lines[quoteIndex]
			.replace(/^>\s*"?/, '')
			.replace(/"?$/, '')
			.trim();
	}

	return biography;
}

function updateAuthorData(authorId: string, biography: AuthorBiography, filePath: string): boolean {
	try {
		let fileContent = fs.readFileSync(filePath, 'utf-8');

		// Find the author in the file
		const authorRegex = new RegExp(`"id":\\s*"${authorId}"[^}]*?\\}(?=,\\s*\\{|\\s*\\])`, 'gs');
		const match = fileContent.match(authorRegex);

		if (!match) {
			console.log(`Author ${authorId} not found in ${filePath}`);
			return false;
		}

		// Create the new biography object
		const biographyObj = {
			short: biography.short,
			...(biography.long && { long: biography.long }),
			...(Object.keys(biography.sections || {}).length > 0 && { sections: biography.sections }),
			...(biography.keyAchievements &&
				biography.keyAchievements.length > 0 && { keyAchievements: biography.keyAchievements }),
			...(biography.famousQuote && { famousQuote: biography.famousQuote }),
		};

		// Find where to insert/update the biography
		const authorStartIndex = fileContent.indexOf(match[0]);
		const authorEndIndex = authorStartIndex + match[0].length;
		const authorContent = match[0];

		// Check if biography already exists
		const biographyMatch = authorContent.match(/"biography":\s*\{[^}]*\}/);

		let updatedAuthorContent: string;
		if (biographyMatch) {
			// Replace existing biography
			updatedAuthorContent = authorContent.replace(
				/"biography":\s*\{[^}]*\}/,
				`"biography": ${JSON.stringify(biographyObj, null, 6).replace(/\n/g, '\n      ')}`
			);
		} else {
			// Add biography before the closing bracket
			const lastCommaIndex = authorContent.lastIndexOf(',');
			if (lastCommaIndex !== -1) {
				updatedAuthorContent =
					authorContent.slice(0, lastCommaIndex + 1) +
					`\n    "biography": ${JSON.stringify(biographyObj, null, 6).replace(/\n/g, '\n      ')},` +
					authorContent.slice(lastCommaIndex + 1);
			} else {
				// Add as first property (edge case)
				updatedAuthorContent = authorContent.replace(
					/\{/,
					`{\n    "biography": ${JSON.stringify(biographyObj, null, 6).replace(/\n/g, '\n      ')},`
				);
			}
		}

		// Update the file content
		fileContent =
			fileContent.slice(0, authorStartIndex) +
			updatedAuthorContent +
			fileContent.slice(authorEndIndex);

		fs.writeFileSync(filePath, fileContent, 'utf-8');
		return true;
	} catch (error) {
		console.error(`Error updating ${filePath}:`, error);
		return false;
	}
}

async function syncBiographies() {
	const profilesDir = path.join(process.cwd(), 'content', 'authors', 'profiles');
	const deAuthorsFile = path.join(process.cwd(), 'services', 'data', 'authors', 'de.ts');
	const enAuthorsFile = path.join(process.cwd(), 'services', 'data', 'authors', 'en.ts');

	if (!fs.existsSync(profilesDir)) {
		console.error('Profiles directory not found:', profilesDir);
		return;
	}

	const markdownFiles = fs.readdirSync(profilesDir).filter((file) => file.endsWith('.md'));

	console.log(`Found ${markdownFiles.length} Markdown profiles to sync\n`);

	let successCount = 0;
	let skipCount = 0;
	let errorCount = 0;

	for (const file of markdownFiles) {
		const filePath = path.join(profilesDir, file);
		const fileContent = fs.readFileSync(filePath, 'utf-8');
		const { data: frontMatter, content } = matter(fileContent);

		const authorId = frontMatter.id || file.replace('.md', '');

		console.log(`Processing ${authorId}...`);

		if (!content || content.trim().length < 100) {
			console.log(`  → Skipped (content too short)`);
			skipCount++;
			continue;
		}

		const biography = parseMarkdownContent(content);

		if (!biography.short) {
			console.log(`  → Skipped (no biography found)`);
			skipCount++;
			continue;
		}

		// Update German file
		const deSuccess = updateAuthorData(authorId, biography, deAuthorsFile);

		// For English file, we'd need translations, so skip for now
		// const enSuccess = updateAuthorData(authorId, biography, enAuthorsFile);

		if (deSuccess) {
			console.log(`  ✓ Updated in de.ts`);
			successCount++;
		} else {
			console.log(`  ✗ Failed to update`);
			errorCount++;
		}
	}

	console.log('\n=== Summary ===');
	console.log(`✓ Successfully updated: ${successCount}`);
	console.log(`→ Skipped: ${skipCount}`);
	console.log(`✗ Errors: ${errorCount}`);
	console.log(`Total processed: ${markdownFiles.length}`);
}

// Run the sync
syncBiographies().catch(console.error);
