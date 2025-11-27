import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import { authorsDE } from '../services/data/authors/de';
import { authorsEN } from '../services/data/authors/en';

const anthropic = new Anthropic({
	apiKey: process.env.ANTHROPIC_API_KEY,
});

interface Author {
	id: string;
	name: string;
	biography?: {
		short?: string;
		long?: string;
	};
	lifespan?: {
		birth?: string;
		death?: string;
	};
}

// Find authors missing detailed bios
const deAuthorsMissingLong = authorsDE.filter((author) => {
	const hasLongBio = author.biography?.long && author.biography.long.length > 500;
	return !hasLongBio;
});

const enAuthorsMissingLong = authorsEN.filter((author) => {
	const hasLongBio = author.biography?.long && author.biography.long.length > 500;
	return !hasLongBio;
});

async function generateDetailedBio(author: Author, language: 'de' | 'en'): Promise<string> {
	const prompt =
		language === 'de'
			? `Erstelle eine ausführliche Biographie für ${author.name} auf Deutsch.

Die Biographie sollte:
- In Markdown-Format sein mit # als Hauptüberschrift (Name und Lebensdaten)
- Eine "Kurzbiografie" Sektion mit kompakter Zusammenfassung (2-3 Absätze)
- Mehrere thematische Hauptsektionen mit ## Überschriften über wichtige Lebensphasen
- Detaillierte Informationen über Leben, Werk und Einfluss
- Berühmte Zitate in Blockquote-Format (> )
- Kulturellen/historischen Kontext
- Vermächtnis und Bedeutung
- Ca. 3000-5000 Wörter lang sein
- Informativ, gut strukturiert und ansprechend geschrieben sein

${author.biography?.short ? `Kurze Bio als Kontext: ${author.biography.short}` : ''}
${author.lifespan?.birth ? `Geboren: ${author.lifespan.birth}` : ''}
${author.lifespan?.death ? `Gestorben: ${author.lifespan.death}` : ''}

Schreibe die vollständige Biographie:`
			: `Create a detailed biography for ${author.name} in English.

The biography should:
- Be in Markdown format with # as main heading (name and lifespan)
- Have a "Brief Biography" section with compact summary (2-3 paragraphs)
- Have multiple thematic main sections with ## headings about important life phases
- Include detailed information about life, work, and influence
- Include famous quotes in blockquote format (> )
- Provide cultural/historical context
- Discuss legacy and significance
- Be approximately 3000-5000 words long
- Be informative, well-structured, and engagingly written

${author.biography?.short ? `Short bio for context: ${author.biography.short}` : ''}
${author.lifespan?.birth ? `Born: ${author.lifespan.birth}` : ''}
${author.lifespan?.death ? `Died: ${author.lifespan.death}` : ''}

Write the complete biography:`;

	console.log(`\n🤖 Generating ${language.toUpperCase()} biography for: ${author.name}`);

	const message = await anthropic.messages.create({
		model: 'claude-sonnet-4-20250514',
		max_tokens: 16000,
		messages: [
			{
				role: 'user',
				content: prompt,
			},
		],
	});

	const biography = message.content[0].type === 'text' ? message.content[0].text : '';
	console.log(`✅ Generated ${biography.length} characters for ${author.name}`);

	return biography;
}

async function updateAuthorFile(
	filePath: string,
	authorId: string,
	longBio: string,
	language: 'de' | 'en'
): Promise<void> {
	const fileContent = fs.readFileSync(filePath, 'utf-8');

	// Create backup
	const backupPath = `${filePath}.backup-${Date.now()}.ts`;
	fs.writeFileSync(backupPath, fileContent);
	console.log(`📦 Backup created: ${backupPath}`);

	// Find the author object and add/update the long bio
	// This is a simple string replacement approach
	const authorPattern = new RegExp(
		`("id":\\s*"${authorId}"[^}]*"biography":\\s*{[^}]*"short":[^,]*,?)`,
		'gs'
	);

	const bioToInsert = `\n      "long": ${JSON.stringify(longBio)}`;

	const updatedContent = fileContent.replace(authorPattern, (match) => {
		if (match.includes('"long":')) {
			// Already has long bio, replace it
			return match.replace(/"long":\s*"[^"]*"/, `"long": ${JSON.stringify(longBio)}`);
		} else {
			// Add long bio after short
			return match + bioToInsert;
		}
	});

	fs.writeFileSync(filePath, updatedContent);
	console.log(`💾 Updated file: ${filePath}`);
}

async function main() {
	console.log('=== GENERATING MISSING DETAILED BIOGRAPHIES ===\n');
	console.log(`German authors missing bios: ${deAuthorsMissingLong.length}`);
	console.log(`English authors missing bios: ${enAuthorsMissingLong.length}\n`);

	const batchSize = 5; // Process in smaller batches

	// Process German authors
	console.log('\n📚 Processing German authors...\n');
	for (let i = 0; i < Math.min(batchSize, deAuthorsMissingLong.length); i++) {
		const author = deAuthorsMissingLong[i];
		try {
			const longBio = await generateDetailedBio(author, 'de');

			await updateAuthorFile(
				path.join(__dirname, '../services/data/authors/de.ts'),
				author.id,
				longBio,
				'de'
			);

			// Also update English version
			const enAuthor = enAuthorsMissingLong.find((a) => a.id === author.id);
			if (enAuthor) {
				const enLongBio = await generateDetailedBio(enAuthor, 'en');
				await updateAuthorFile(
					path.join(__dirname, '../services/data/authors/en.ts'),
					author.id,
					enLongBio,
					'en'
				);
			}

			console.log(`\n✨ Completed ${i + 1}/${batchSize}: ${author.name}\n`);

			// Small delay to avoid rate limits
			await new Promise((resolve) => setTimeout(resolve, 1000));
		} catch (error) {
			console.error(`❌ Error processing ${author.name}:`, error);
		}
	}

	console.log('\n✅ Batch complete!');
	console.log(`Remaining: ${deAuthorsMissingLong.length - batchSize} German authors`);
}

main().catch(console.error);
