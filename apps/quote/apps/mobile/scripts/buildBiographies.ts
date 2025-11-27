/**
 * Build script to compile Markdown biographies into a JSON file
 * Run this during build time to generate biographies for client-side use
 */

import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

interface Biography {
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

function parseMarkdownFile(content: string): Biography | null {
	try {
		const { data: frontMatter, content: markdownContent } = matter(content);

		if (!markdownContent) return null;

		const lines = markdownContent.split('\n').filter((line) => line.trim());
		const biography: Biography = {
			short: '',
			sections: {},
			keyAchievements: [],
		};

		// Extract short biography from "Kurzbiografie" section
		const kurzBioIndex = lines.findIndex((line) => line.includes('## Kurzbiografie'));
		if (kurzBioIndex !== -1) {
			let shortBio = '';
			let paragraphCount = 0;
			for (let i = kurzBioIndex + 1; i < lines.length; i++) {
				if (lines[i].startsWith('#')) break;
				if (lines[i].trim()) {
					shortBio += (shortBio ? ' ' : '') + lines[i].trim();
					if (lines[i].endsWith('.')) {
						paragraphCount++;
						if (paragraphCount >= 2) break; // Take first 2 paragraphs
					}
				}
			}
			biography.short = shortBio;
			biography.long = shortBio;
		}

		// Extract main sections
		let currentSection: string | null = null;
		let currentContent: string[] = [];

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];

			if (line.startsWith('## ') || line.startsWith('### ')) {
				// Save previous section if exists
				if (currentSection && currentContent.length > 0) {
					const sectionKey = normalizeKey(currentSection);
					if (!['kurzbiografie', 'beruehmtezitate', 'weiterfuehrendelinks'].includes(sectionKey)) {
						biography.sections![sectionKey] = {
							title: currentSection,
							content: currentContent.join(' ').trim(),
						};
					}
				}

				// Start new section
				currentSection = line.replace(/^#+\s*/, '').trim();
				currentContent = [];
			} else if (currentSection && line.trim() && !line.startsWith('>')) {
				// Skip quotes and collect content
				if (line.startsWith('-') || line.startsWith('*')) {
					// This might be a key achievement
					const item = line.replace(/^[-*]\s*/, '').trim();
					if (
						currentSection.toLowerCase().includes('achievement') ||
						currentSection.toLowerCase().includes('errungenschaft') ||
						currentSection.toLowerCase().includes('werk') ||
						currentSection.toLowerCase().includes('bedeutung')
					) {
						if (!biography.keyAchievements) biography.keyAchievements = [];
						biography.keyAchievements.push(item);
					}
				} else {
					currentContent.push(line.trim());
				}
			} else if (line.startsWith('>')) {
				// Extract famous quote
				if (!biography.famousQuote) {
					biography.famousQuote = line
						.replace(/^>\s*"?/, '')
						.replace(/"?$/, '')
						.trim();
				}
			}
		}

		// Save last section
		if (currentSection && currentContent.length > 0) {
			const sectionKey = normalizeKey(currentSection);
			if (!['kurzbiografie', 'beruehmtezitate', 'weiterfuehrendelinks'].includes(sectionKey)) {
				biography.sections![sectionKey] = {
					title: currentSection,
					content: currentContent.join(' ').trim(),
				};
			}
		}

		// Limit sections to the most important ones
		if (biography.sections && Object.keys(biography.sections).length > 5) {
			const prioritySections = ['leben', 'werk', 'philosophie', 'bedeutung', 'vermaechtnis'];
			const importantSections: any = {};

			// First, add priority sections if they exist
			for (const key of prioritySections) {
				if (biography.sections[key]) {
					importantSections[key] = biography.sections[key];
				}
			}

			// Then add others until we have 5
			for (const [key, section] of Object.entries(biography.sections)) {
				if (Object.keys(importantSections).length >= 5) break;
				if (!importantSections[key]) {
					importantSections[key] = section;
				}
			}

			biography.sections = importantSections;
		}

		// Limit key achievements to 5
		if (biography.keyAchievements && biography.keyAchievements.length > 5) {
			biography.keyAchievements = biography.keyAchievements.slice(0, 5);
		}

		// Ensure we have at least a short biography
		if (!biography.short && Object.keys(biography.sections || {}).length > 0) {
			// Take the first section as short biography
			const firstSection = Object.values(biography.sections!)[0];
			biography.short = firstSection.content.substring(0, 200) + '...';
		}

		return biography.short ? biography : null;
	} catch (error) {
		console.error('Error parsing markdown file:', error);
		return null;
	}
}

function normalizeKey(title: string): string {
	return title
		.toLowerCase()
		.replace(/[äöüß]/g, (match) => {
			const replacements: { [key: string]: string } = {
				ä: 'ae',
				ö: 'oe',
				ü: 'ue',
				ß: 'ss',
			};
			return replacements[match] || match;
		})
		.replace(/[^a-z0-9]/g, '');
}

async function buildBiographies() {
	const profilesPath = path.join(process.cwd(), 'content', 'authors', 'profiles');
	const outputPath = path.join(process.cwd(), 'content', 'generated');
	const outputFile = path.join(outputPath, 'biographies.json');

	if (!fs.existsSync(profilesPath)) {
		console.error('Profiles directory not found:', profilesPath);
		return;
	}

	// Create output directory if it doesn't exist
	if (!fs.existsSync(outputPath)) {
		fs.mkdirSync(outputPath, { recursive: true });
	}

	const files = fs.readdirSync(profilesPath).filter((f) => f.endsWith('.md'));
	const biographies: { [key: string]: Biography } = {};

	console.log(`Processing ${files.length} biography files...`);

	let successCount = 0;
	let errorCount = 0;

	for (const file of files) {
		const filePath = path.join(profilesPath, file);
		const content = fs.readFileSync(filePath, 'utf-8');

		// Extract ID from frontmatter or filename
		const idMatch = content.match(/^id:\s*(.+)$/m);
		const id = idMatch ? idMatch[1].trim() : file.replace('.md', '');

		const biography = parseMarkdownFile(content);

		if (biography) {
			biographies[id] = biography;
			successCount++;
			console.log(`✓ Processed ${id}`);
		} else {
			errorCount++;
			console.log(`✗ Failed to process ${file}`);
		}
	}

	// Write the compiled biographies to JSON
	fs.writeFileSync(outputFile, JSON.stringify(biographies, null, 2), 'utf-8');

	console.log('\n=== Build Complete ===');
	console.log(`✓ Successfully processed: ${successCount}`);
	console.log(`✗ Errors: ${errorCount}`);
	console.log(`📁 Output: ${outputFile}`);
	console.log(`📊 Total size: ${(fs.statSync(outputFile).size / 1024).toFixed(2)} KB`);
}

// Run the build
buildBiographies().catch(console.error);
