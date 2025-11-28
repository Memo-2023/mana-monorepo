/**
 * Script to update author biographies in TypeScript data files
 * from Markdown profile files
 */

import * as fs from 'fs';
import * as path from 'path';

interface MarkdownAuthorData {
	id: string;
	biography: string;
}

function extractBiographyFromMarkdown(filePath: string): MarkdownAuthorData | null {
	try {
		const content = fs.readFileSync(filePath, 'utf-8');

		// Extract ID from frontmatter
		const idMatch = content.match(/^id:\s*(.+)$/m);
		if (!idMatch) return null;

		const id = idMatch[1].trim();

		// Find the main content after the frontmatter
		const contentParts = content.split('---');
		if (contentParts.length < 3) return null;

		const mainContent = contentParts[2];

		// Extract biography text - look for "Kurzbiografie" section
		const bioSection = mainContent.split('## Kurzbiografie')[1];
		if (!bioSection) return null;

		// Get the first few paragraphs after Kurzbiografie
		const paragraphs = bioSection
			.split('\n')
			.filter((line) => line.trim() && !line.startsWith('#'))
			.slice(0, 3); // Take first 3 paragraphs

		const biography = paragraphs.join(' ').trim();

		if (!biography) return null;

		return { id, biography };
	} catch (error) {
		console.error(`Error reading ${filePath}:`, error);
		return null;
	}
}

function updateAuthorInFile(filePath: string, authorId: string, biography: string): boolean {
	try {
		let content = fs.readFileSync(filePath, 'utf-8');

		// Find the author object
		const authorPattern = new RegExp(
			`(\\{[^{}]*"id"\\s*:\\s*"${authorId}"[^}]*?"biography"\\s*:\\s*\\{[^}]*?\\}[^}]*?\\})`,
			'gs'
		);

		const match = content.match(authorPattern);
		if (!match) {
			console.log(`  Author ${authorId} not found in file`);
			return false;
		}

		const authorBlock = match[0];

		// Update the biography
		const updatedBlock = authorBlock.replace(
			/"biography"\s*:\s*\{[^}]*?\}/,
			`"biography": {
      "short": "${biography.substring(0, 150)}...",
      "long": "${biography}"
    }`
		);

		content = content.replace(authorBlock, updatedBlock);

		fs.writeFileSync(filePath, content, 'utf-8');
		return true;
	} catch (error) {
		console.error(`Error updating ${filePath}:`, error);
		return false;
	}
}

async function main() {
	const profilesDir = path.join(process.cwd(), 'content', 'authors', 'profiles');
	const deFile = path.join(process.cwd(), 'services', 'data', 'authors', 'de.ts');

	if (!fs.existsSync(profilesDir)) {
		console.error('Profiles directory not found:', profilesDir);
		return;
	}

	if (!fs.existsSync(deFile)) {
		console.error('German authors file not found:', deFile);
		return;
	}

	const markdownFiles = fs.readdirSync(profilesDir).filter((file) => file.endsWith('.md'));

	console.log(`Found ${markdownFiles.length} Markdown profiles\n`);

	let updated = 0;
	let skipped = 0;

	for (const file of markdownFiles) {
		const filePath = path.join(profilesDir, file);
		const authorData = extractBiographyFromMarkdown(filePath);

		if (!authorData) {
			console.log(`Skipped: ${file} (no biography found)`);
			skipped++;
			continue;
		}

		console.log(`Processing: ${authorData.id}`);

		if (updateAuthorInFile(deFile, authorData.id, authorData.biography)) {
			console.log(`  ✓ Updated biography`);
			updated++;
		} else {
			skipped++;
		}
	}

	console.log(`\n=== Summary ===`);
	console.log(`✓ Updated: ${updated} authors`);
	console.log(`→ Skipped: ${skipped} authors`);
	console.log(`Total: ${markdownFiles.length} files`);
}

main().catch(console.error);
