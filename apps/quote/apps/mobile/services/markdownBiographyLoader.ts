/**
 * Markdown Biography Loader Service
 * Loads author biographies from Markdown files in content/authors/profiles
 */

import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

export interface MarkdownBiography {
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

export interface MarkdownAuthor {
	id: string;
	name: string;
	born?: string;
	died?: string;
	nationality?: string;
	image?: string;
	featured?: boolean;
	biography: MarkdownBiography;
}

class MarkdownBiographyLoader {
	private biographies: Map<string, MarkdownBiography> = new Map();
	private initialized = false;

	constructor() {
		// Initialize will be called when needed
	}

	private async initialize() {
		if (this.initialized) return;

		try {
			const profilesPath = path.join(process.cwd(), 'content', 'authors', 'profiles');

			// Check if we're in a React Native environment
			if (typeof window !== 'undefined' || typeof document !== 'undefined') {
				// In React Native/Web environment, we need to use a different approach
				await this.loadBiographiesForClient();
			} else {
				// In Node.js environment (build time)
				await this.loadBiographiesFromFiles(profilesPath);
			}

			this.initialized = true;
		} catch (error) {
			console.error('Failed to initialize MarkdownBiographyLoader:', error);
			this.initialized = true; // Mark as initialized even on error to prevent infinite loops
		}
	}

	private async loadBiographiesFromFiles(profilesPath: string) {
		if (!fs.existsSync(profilesPath)) {
			console.warn('Profiles directory not found:', profilesPath);
			return;
		}

		const files = fs.readdirSync(profilesPath).filter((f) => f.endsWith('.md'));

		for (const file of files) {
			const filePath = path.join(profilesPath, file);
			const content = fs.readFileSync(filePath, 'utf-8');
			const biography = this.parseMarkdownFile(content);

			if (biography) {
				const id = file.replace('.md', '');
				this.biographies.set(id, biography);
			}
		}
	}

	private async loadBiographiesForClient() {
		// For client-side, we need to import a pre-generated JSON file
		try {
			// This file will be generated at build time
			const biographiesModule = await import('../content/generated/biographies.json');
			const biographies = biographiesModule.default || biographiesModule;

			Object.entries(biographies).forEach(([id, bio]) => {
				this.biographies.set(id, bio as MarkdownBiography);
			});
		} catch (error) {
			console.warn('Could not load pre-generated biographies:', error);
		}
	}

	private parseMarkdownFile(content: string): MarkdownBiography | null {
		try {
			const { data: frontMatter, content: markdownContent } = matter(content);

			if (!markdownContent) return null;

			const lines = markdownContent.split('\n').filter((line) => line.trim());
			const biography: MarkdownBiography = {
				short: '',
				sections: {},
				keyAchievements: [],
			};

			// Extract short biography from "Kurzbiografie" section
			const kurzBioIndex = lines.findIndex((line) => line.includes('## Kurzbiografie'));
			if (kurzBioIndex !== -1) {
				let shortBio = '';
				for (let i = kurzBioIndex + 1; i < lines.length; i++) {
					if (lines[i].startsWith('#')) break;
					if (lines[i].trim()) {
						shortBio += (shortBio ? ' ' : '') + lines[i].trim();
					}
				}
				biography.short = shortBio;
				biography.long = shortBio; // Use the same as long for now
			}

			// Extract main sections
			let currentSection: string | null = null;
			let currentContent: string[] = [];

			for (let i = 0; i < lines.length; i++) {
				const line = lines[i];

				if (line.startsWith('## ') || line.startsWith('### ')) {
					// Save previous section if exists
					if (currentSection && currentContent.length > 0) {
						const sectionKey = this.normalizeKey(currentSection);
						if (!['kurzbiografie', 'berühmtezitate', 'weiterführendelinks'].includes(sectionKey)) {
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
						const achievement = line.replace(/^[-*]\s*/, '').trim();
						if (
							currentSection.toLowerCase().includes('achievement') ||
							currentSection.toLowerCase().includes('errungenschaft')
						) {
							biography.keyAchievements!.push(achievement);
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
				const sectionKey = this.normalizeKey(currentSection);
				if (!['kurzbiografie', 'berühmtezitate', 'weiterführendelinks'].includes(sectionKey)) {
					biography.sections![sectionKey] = {
						title: currentSection,
						content: currentContent.join(' ').trim(),
					};
				}
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

	private normalizeKey(title: string): string {
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

	async getBiography(authorId: string): Promise<MarkdownBiography | null> {
		await this.initialize();
		return this.biographies.get(authorId) || null;
	}

	async getAllBiographies(): Promise<Map<string, MarkdownBiography>> {
		await this.initialize();
		return new Map(this.biographies);
	}

	async enrichAuthor<T extends { id: string; biography?: any }>(author: T): Promise<T> {
		const markdownBio = await this.getBiography(author.id);

		if (markdownBio) {
			return {
				...author,
				biography: {
					...author.biography,
					...markdownBio,
				},
			};
		}

		return author;
	}

	async enrichAuthors<T extends { id: string; biography?: any }>(authors: T[]): Promise<T[]> {
		return Promise.all(authors.map((author) => this.enrichAuthor(author)));
	}
}

// Singleton instance
export const markdownBiographyLoader = new MarkdownBiographyLoader();
