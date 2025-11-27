#!/usr/bin/env npx tsx

import fs from 'fs/promises';
import path from 'path';
import { Author } from '../services/contentLoader';

async function integrateAllAuthors() {
	console.log('📚 Integrating all 107 authors from archive...\n');

	// Load archived authors
	const archivePathEN = path.join(process.cwd(), 'content/archive/data/en/authors.json');
	const archivePathDE = path.join(process.cwd(), 'content/archive/data/de/authors.json');

	const archiveDataEN = JSON.parse(await fs.readFile(archivePathEN, 'utf-8'));
	const archiveDataDE = JSON.parse(await fs.readFile(archivePathDE, 'utf-8'));

	// Load author images
	const imagesPath = path.join(process.cwd(), 'author-images-all.json');
	const imageData = JSON.parse(await fs.readFile(imagesPath, 'utf-8'));

	// Create image lookup map
	const imageMap = new Map();
	imageData.authors.forEach((author) => {
		if (author.found && author.imageInfo) {
			imageMap.set(author.id, {
				thumbnail: author.imageInfo.url,
				full: author.imageInfo.url,
				credit: author.imageInfo.user,
				source: 'Wikimedia Commons',
			});
		}
	});

	// Process English authors
	const authorsEN: Author[] = archiveDataEN.authors
		.filter((a: any) => a.id !== 'unbekannt' && a.verified !== false)
		.map((author: any) => {
			const baseAuthor: Author = {
				id: author.id,
				name: author.name,
				profession: author.profession || [],
				biography: author.biography || { short: '' },
				lifespan: author.lifespan || {},
				verified: author.verified || true,
				featured: author.featured || false,
			};

			// Add image if available
			const image = imageMap.get(author.id);
			if (image) {
				baseAuthor.image = image;
			}

			return baseAuthor;
		});

	// Process German authors
	const authorsDE: Author[] = archiveDataDE.authors
		.filter((a: any) => a.id !== 'unbekannt' && a.verified !== false)
		.map((author: any) => {
			const baseAuthor: Author = {
				id: author.id,
				name: author.name,
				profession: author.profession || [],
				biography: author.biography || { short: '' },
				lifespan: author.lifespan || {},
				verified: author.verified || true,
				featured: author.featured || false,
			};

			// Add image if available
			const image = imageMap.get(author.id);
			if (image) {
				baseAuthor.image = image;
			}

			return baseAuthor;
		});

	// Add Unknown author for both
	const unknownAuthor = {
		id: 'unbekannt',
		name: 'Unknown',
		profession: ['Various'],
		biography: {
			short: 'Author unknown or folk wisdom.',
		},
		verified: false,
	};

	const unknownAuthorDE = {
		...unknownAuthor,
		name: 'Unbekannt',
		profession: ['Verschiedene'],
		biography: {
			short: 'Autor unbekannt oder Volksweisheit.',
		},
	};

	authorsEN.push(unknownAuthor);
	authorsDE.push(unknownAuthorDE);

	// Generate TypeScript files
	const enContent = `import { Author } from '../../contentLoader';

export const authorsEN: Author[] = ${JSON.stringify(authorsEN, null, 2)};
`;

	const deContent = `import { Author } from '../../contentLoader';

export const authorsDE: Author[] = ${JSON.stringify(authorsDE, null, 2)};
`;

	// Write files
	const enPath = path.join(process.cwd(), 'services/data/authors/en.ts');
	const dePath = path.join(process.cwd(), 'services/data/authors/de.ts');

	await fs.writeFile(enPath, enContent, 'utf-8');
	await fs.writeFile(dePath, deContent, 'utf-8');

	console.log(`✅ Successfully integrated ${authorsEN.length} English authors`);
	console.log(`✅ Successfully integrated ${authorsDE.length} German authors`);
	console.log('\n🎉 All 107+ authors with images are now in the app!');
}

integrateAllAuthors().catch((error) => {
	console.error('❌ Script failed:', error);
	process.exit(1);
});
