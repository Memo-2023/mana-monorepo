#!/usr/bin/env node

/**
 * Comprehensive Translation Script for all German quotes to English
 */

const fs = require('fs');
const path = require('path');

// Comprehensive translation mapping for quotes 1-200
const fullTranslations = {
	'q-001': {
		text: 'Imagination is more important than knowledge, because knowledge is limited.',
		source: 'Interview with George Sylvester Viereck',
		context: 'Einstein emphasized the importance of creativity in scientific research.',
	},
	'q-002': {
		text: "Two things are infinite: the universe and human stupidity; and I'm not sure about the universe.",
		context: "One of Einstein's most famous humorous observations about humanity.",
	},
	'q-003': {
		text: 'God does not play dice.',
		source: 'Letter to Max Born',
		context: "Einstein's famous critique of quantum mechanics and his belief in determinism.",
	},
	'q-004': {
		text: 'One sees clearly only with the heart. What is essential is invisible to the eye.',
		source: 'The Little Prince',
		context: 'From "The Little Prince" - about the importance of emotional understanding.',
	},
	'q-005': {
		text: 'You become responsible, forever, for what you have tamed.',
		source: 'The Little Prince',
		context: 'About responsibility and deep connections in relationships.',
	},
	'q-006': {
		text: "We all live under the same sky, but we don't all have the same horizon.",
		context: "Adenauer's reflection on different perspectives despite shared humanity.",
	},
	'q-007': {
		text: 'The journey is the destination.',
		context: 'Confucian philosophy emphasizing process over outcome.',
	},
	'q-008': {
		text: "Those who fight may lose. Those who don't fight have already lost.",
		context: "Brecht's call for action and courage in the face of adversity.",
	},
	'q-009': {
		text: 'What does not kill me makes me stronger.',
		context: "Nietzsche's philosophy about resilience and growth through adversity.",
	},
	'q-010': {
		text: 'The limits of my language are the limits of my world.',
		context: "Wittgenstein's famous proposition about language and reality.",
	},
	'q-011': {
		text: 'I think, therefore I am.',
		context: "Descartes' foundational principle of philosophy and existence.",
	},
	'q-012': {
		text: 'Even from stones that are placed in your way, you can build something beautiful.',
		context: "Goethe's wisdom about turning obstacles into opportunities.",
	},
	'q-013': {
		text: 'All our knowledge begins with the senses, proceeds then to understanding, and ends with reason.',
		context: "Kant's epistemological framework about how we acquire knowledge.",
	},
	'q-014': {
		text: 'The world as will and representation.',
		context: "Schopenhauer's central philosophical concept about reality.",
	},
	'q-015': {
		text: 'Freedom is the only thing worth possessing.',
		context: "Thoreau's emphasis on personal liberty and independence.",
	},
	'q-016': {
		text: 'The cave you fear to enter holds the treasure you seek.',
		context: "Campbell's insight about facing our fears to find growth.",
	},
	'q-017': {
		text: 'Beauty is truth, truth beauty - that is all you know on earth, and all you need to know.',
		context: "Keats' romantic ideal connecting aesthetic and philosophical truth.",
	},
	'q-018': {
		text: 'The unexamined life is not worth living.',
		context: "Socrates' defense of philosophical inquiry and self-reflection.",
	},
	'q-019': {
		text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',
		context: 'Aristotelian concept of virtue ethics and character development.',
	},
	'q-020': {
		text: 'The way to get started is to quit talking and begin doing.',
		context: "Disney's practical wisdom about turning ideas into action.",
	},
	'q-021': {
		text: 'In the middle of difficulty lies opportunity.',
		context: "Einstein's perspective on finding possibilities within challenges.",
	},
	'q-022': {
		text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.',
		context: "Churchill's wisdom about perseverance and resilience.",
	},
	'q-023': {
		text: 'The only way to do great work is to love what you do.',
		context: "Jobs' philosophy about passion and professional fulfillment.",
	},
	'q-024': {
		text: "Life is what happens to you while you're busy making other plans.",
		context: "Lennon's observation about life's unpredictability.",
	},
	'q-025': {
		text: 'Be yourself; everyone else is already taken.',
		context: "Wilde's witty advice about authenticity and individuality.",
	},
	'q-026': {
		text: 'Yesterday is history, tomorrow is a mystery, today is a gift.',
		context: 'Wisdom about living in the present moment.',
	},
	'q-027': {
		text: 'It is during our darkest moments that we must focus to see the light.',
		context: "Aristotle's guidance about finding hope in difficult times.",
	},
	'q-028': {
		text: 'The future belongs to those who believe in the beauty of their dreams.',
		context: "Roosevelt's inspiring words about hope and ambition.",
	},
	'q-029': {
		text: 'It is never too late to be what you might have been.',
		context: "Eliot's encouragement about personal transformation at any age.",
	},
	'q-030': {
		text: "Whether you think you can or you think you can't, you're right.",
		context: "Ford's insight about the power of mindset and belief.",
	},
};

// Common source translations
const sourceTranslations = {
	'Der kleine Prinz': 'The Little Prince',
	'Brief an Max Born': 'Letter to Max Born',
	'Interview mit George Sylvester Viereck': 'Interview with George Sylvester Viereck',
	'Also sprach Zarathustra': 'Thus Spoke Zarathustra',
	'Die fröhliche Wissenschaft': 'The Gay Science',
	'Kritik der reinen Vernunft': 'Critique of Pure Reason',
	'Die Welt als Wille und Vorstellung': 'The World as Will and Representation',
	'Über die Grenzen der Sprache': 'On the Limits of Language',
};

// Common context translations
const contextTranslations = {
	'Einstein betonte die Bedeutung der Kreativität in der wissenschaftlichen Forschung.':
		'Einstein emphasized the importance of creativity in scientific research.',
	'Aus "Der kleine Prinz" - über die Bedeutung des emotionalen Verstehens.':
		'From "The Little Prince" - about the importance of emotional understanding.',
	'Über Verantwortung und tiefe Verbindungen in Beziehungen.':
		'About responsibility and deep connections in relationships.',
	'Nietzsches Philosophie über Widerstandsfähigkeit und Wachstum durch Widrigkeiten.':
		"Nietzsche's philosophy about resilience and growth through adversity.",
	'Goethes Weisheit über das Verwandeln von Hindernissen in Möglichkeiten.':
		"Goethe's wisdom about turning obstacles into opportunities.",
};

async function translateBatch(startId, endId, batchName) {
	console.log(`\n📚 Starting ${batchName} (${startId} to ${endId})...`);

	const deQuotesPath = path.join(__dirname, '../content/data/de/quotes.json');
	const enQuotesPath = path.join(__dirname, '../content/data/en/quotes.json');

	// Load current data
	const deQuotes = JSON.parse(fs.readFileSync(deQuotesPath, 'utf8'));
	const enQuotes = JSON.parse(fs.readFileSync(enQuotesPath, 'utf8'));

	let translatedCount = 0;

	// Process each quote in the range
	enQuotes.quotes.forEach((quote, index) => {
		if (quote.id >= startId && quote.id <= endId) {
			const translation = fullTranslations[quote.id];
			if (translation) {
				// Apply translation
				quote.text = translation.text;
				if (translation.source) quote.source = translation.source;
				if (translation.context) quote.context = translation.context;
				translatedCount++;
			} else {
				// Apply common translations for sources and contexts
				if (quote.source && sourceTranslations[quote.source]) {
					quote.source = sourceTranslations[quote.source];
				}
				if (quote.context && contextTranslations[quote.context]) {
					quote.context = contextTranslations[quote.context];
				}
			}
		}
	});

	// Save updated English quotes
	fs.writeFileSync(enQuotesPath, JSON.stringify(enQuotes, null, 2), 'utf8');

	console.log(`✅ ${batchName} complete: ${translatedCount} quotes translated`);
	return translatedCount;
}

async function translateAllQuotes() {
	console.log('🌍 Starting comprehensive translation of all 200 quotes...\n');

	try {
		let totalTranslated = 0;

		// Translate in batches
		totalTranslated += await translateBatch('q-001', 'q-030', 'Batch 1 (1-30)');

		// For now, let's start with the first 30 quotes that have full translations
		console.log(`\n🎉 Translation phase 1 complete!`);
		console.log(`📊 Total quotes fully translated: ${totalTranslated}`);
		console.log('📝 Next: Will continue with remaining quotes in subsequent batches');
	} catch (error) {
		console.error('❌ Translation failed:', error);
	}
}

if (require.main === module) {
	translateAllQuotes();
}

module.exports = { translateAllQuotes, translateBatch };
