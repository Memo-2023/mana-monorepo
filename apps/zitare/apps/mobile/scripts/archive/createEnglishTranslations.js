#!/usr/bin/env node

/**
 * Script to create English translations of German quotes and authors
 */

const fs = require('fs');
const path = require('path');

// English translations for key quotes (partial sample)
const translations = {
	'q-001': {
		text: 'Imagination is more important than knowledge, because knowledge is limited.',
		context: 'Einstein emphasized the importance of creativity in scientific research.',
	},
	'q-002': {
		text: "Two things are infinite: the universe and human stupidity; and I'm not sure about the universe.",
		context: "One of Einstein's most famous humorous observations about humanity.",
	},
	'q-003': {
		text: 'God does not play dice.',
		context: "Einstein's famous critique of quantum mechanics.",
	},
	'q-004': {
		text: 'One sees clearly only with the heart. What is essential is invisible to the eye.',
		context: 'From "The Little Prince" - about the importance of emotional understanding.',
	},
	'q-005': {
		text: 'You are responsible for what you have tamed.',
		context: 'From "The Little Prince" - about responsibility and relationships.',
	},
	'q-007': {
		text: 'The journey is the destination.',
		context: "Goethe's philosophy about the process being more important than the goal.",
	},
	'q-009': {
		text: 'What does not kill me makes me stronger.',
		context: "Nietzsche's philosophy about resilience and growth through adversity.",
	},
};

// English author translations
const authorTranslations = {
	'einstein-albert': {
		profession: ['Physicist', 'Philosopher'],
		biography: {
			short: 'Theoretical physicist who developed the theory of relativity.',
		},
	},
	'saint-exupery-antoine': {
		profession: ['Writer', 'Pilot'],
		biography: {
			short: 'French writer and pilot, known for "The Little Prince".',
		},
	},
	'goethe-johann': {
		profession: ['Poet', 'Natural Philosopher'],
		biography: {
			short:
				'German poet and natural philosopher, one of the most significant creators of German-language poetry.',
		},
	},
	'nietzsche-friedrich': {
		profession: ['Philosopher', 'Philologist'],
		biography: {
			short: 'German philosopher and classical philologist.',
		},
	},
};

function createEnglishTranslations() {
	const deQuotesPath = path.join(__dirname, '../content/data/de/quotes.json');
	const enQuotesPath = path.join(__dirname, '../content/data/en/quotes.json');
	const deAuthorsPath = path.join(__dirname, '../content/data/de/authors.json');
	const enAuthorsPath = path.join(__dirname, '../content/data/en/authors.json');

	// Load German data
	const deQuotes = JSON.parse(fs.readFileSync(deQuotesPath, 'utf8'));
	const deAuthors = JSON.parse(fs.readFileSync(deAuthorsPath, 'utf8'));

	console.log(`📚 Processing ${deQuotes.quotes.length} German quotes...`);

	// Create English quotes - for now, use available translations and keep German for others
	const enQuotes = {
		quotes: deQuotes.quotes.map((quote) => {
			const translation = translations[quote.id];
			return {
				...quote,
				language: 'en',
				text: translation ? translation.text : quote.text, // Use translation if available
				context: translation?.context || quote.context,
				// Translate some common source titles
				source: quote.source === 'Der kleine Prinz' ? 'The Little Prince' : quote.source,
			};
		}),
	};

	console.log(
		`📚 Created ${enQuotes.quotes.length} English quotes (${Object.keys(translations).length} fully translated)`
	);

	// Create English authors
	const enAuthors = {
		authors: deAuthors.authors.map((author) => {
			const translation = authorTranslations[author.id];
			return {
				...author,
				profession: translation?.profession || author.profession,
				biography: translation?.biography || author.biography,
			};
		}),
	};

	console.log(
		`👥 Created ${enAuthors.authors.length} English authors (${Object.keys(authorTranslations).length} fully translated)`
	);

	// Write English files
	fs.writeFileSync(enQuotesPath, JSON.stringify(enQuotes, null, 2), 'utf8');
	fs.writeFileSync(enAuthorsPath, JSON.stringify(enAuthors, null, 2), 'utf8');

	console.log('✅ English translation files created successfully!');
	console.log('📝 Note: This is a partial translation. Many quotes still need translation.');
}

function analyzeCurrentEnglishFiles() {
	const enQuotesPath = path.join(__dirname, '../content/data/en/quotes.json');
	const enAuthorsPath = path.join(__dirname, '../content/data/en/authors.json');

	try {
		const enQuotes = JSON.parse(fs.readFileSync(enQuotesPath, 'utf8'));
		const enAuthors = JSON.parse(fs.readFileSync(enAuthorsPath, 'utf8'));

		console.log(`📚 Current English quotes: ${enQuotes.quotes.length}`);
		console.log(`👥 Current English authors: ${enAuthors.authors.length}`);

		// Check language setting
		const languageCheck = enQuotes.quotes.slice(0, 5).map((q) => `${q.id}: ${q.language}`);
		console.log(`🌍 Language settings:`, languageCheck);
	} catch (error) {
		console.error('Error analyzing English files:', error.message);
	}
}

if (require.main === module) {
	console.log('🔍 Analyzing current English files...');
	analyzeCurrentEnglishFiles();
	console.log('\n🔄 Creating English translations...');
	createEnglishTranslations();
}

module.exports = { createEnglishTranslations };
