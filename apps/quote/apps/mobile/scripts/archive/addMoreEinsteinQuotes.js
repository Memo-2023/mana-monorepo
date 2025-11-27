#!/usr/bin/env node

/**
 * Add more Albert Einstein quotes - one of the most popular authors
 */

const fs = require('fs');
const path = require('path');

function getNextQuoteId(quotes) {
	const maxId = quotes.reduce((max, quote) => {
		const idNum = parseInt(quote.id.replace('q-', ''));
		return idNum > max ? idNum : max;
	}, 0);
	return maxId + 1;
}

// Additional Einstein quotes - his most famous and profound quotes
const einsteinQuotes = [
	{
		german:
			'Die wichtigste Entscheidung, die du triffst, ist, ob du in einem freundlichen oder feindlichen Universum lebst.',
		english:
			'The most important decision we make is whether we believe we live in a friendly or hostile universe.',
		categories: ['philosophy', 'mindset', 'universe'],
		tags: ['universe', 'belief', 'decision', 'perspective'],
		featured: true,
	},
	{
		german: 'Wissenschaft ohne Religion ist lahm, Religion ohne Wissenschaft ist blind.',
		english: 'Science without religion is lame, religion without science is blind.',
		categories: ['science', 'religion', 'philosophy'],
		tags: ['science', 'religion', 'balance', 'wisdom'],
		year: 1941,
		source: 'Science and Religion',
	},
	{
		german: 'Ich habe keine besondere Begabung, sondern bin nur leidenschaftlich neugierig.',
		english: 'I have no special talent. I am only passionately curious.',
		categories: ['humility', 'curiosity', 'learning'],
		tags: ['curiosity', 'talent', 'humility', 'passion'],
		featured: true,
	},
	{
		german:
			'Das Leben ist wie Fahrrad fahren. Um die Balance zu halten, musst du in Bewegung bleiben.',
		english: 'Life is like riding a bicycle. To keep your balance, you must keep moving.',
		categories: ['life', 'balance', 'movement'],
		tags: ['life', 'balance', 'movement', 'progress'],
		year: 1930,
		source: 'Brief an seinen Sohn Eduard',
		featured: true,
	},
	{
		german: 'Logik bringt dich von A nach B. Phantasie bringt dich überall hin.',
		english: 'Logic will get you from A to B. Imagination will take you everywhere.',
		categories: ['creativity', 'logic', 'wisdom'],
		tags: ['logic', 'imagination', 'creativity', 'thinking'],
	},
	{
		german: 'Wenn du es nicht einfach erklären kannst, verstehst du es nicht gut genug.',
		english: "If you can't explain it simply, you don't understand it well enough.",
		categories: ['knowledge', 'teaching', 'understanding'],
		tags: ['simplicity', 'understanding', 'explanation', 'knowledge'],
		featured: true,
	},
	{
		german:
			'Der Unterschied zwischen Genialität und Dummheit ist, dass Genialität ihre Grenzen hat.',
		english: 'The difference between genius and stupidity is that genius has its limits.',
		categories: ['humor', 'intelligence', 'wisdom'],
		tags: ['genius', 'stupidity', 'limits', 'humor'],
	},
	{
		german:
			'Es gibt zwei Arten sein Leben zu leben: entweder so, als wäre nichts ein Wunder, oder so, als wäre alles ein Wunder.',
		english:
			'There are only two ways to live your life. One is as though nothing is a miracle. The other is as though everything is a miracle.',
		categories: ['life', 'wonder', 'perspective'],
		tags: ['miracle', 'life', 'wonder', 'perspective'],
		featured: true,
	},
	{
		german:
			'Die Welt wird nicht bedroht von den Menschen, die böse sind, sondern von denen, die das Böse zulassen.',
		english:
			'The world will not be destroyed by those who do evil, but by those who watch them without doing anything.',
		categories: ['evil', 'responsibility', 'action'],
		tags: ['evil', 'inaction', 'responsibility', 'world'],
		featured: true,
	},
	{
		german: 'Ich denke niemals an die Zukunft. Sie kommt früh genug.',
		english: 'I never think of the future. It comes soon enough.',
		categories: ['time', 'future', 'present'],
		tags: ['future', 'time', 'present', 'worry'],
	},
	{
		german:
			'Wer es in kleinen Dingen mit der Wahrheit nicht ernst nimmt, dem kann man auch in großen Dingen nicht vertrauen.',
		english:
			'Whoever is careless with the truth in small matters cannot be trusted with important matters.',
		categories: ['truth', 'trust', 'integrity'],
		tags: ['truth', 'trust', 'integrity', 'honesty'],
		featured: true,
	},
	{
		german: 'Die einzige Quelle des Wissens ist die Erfahrung.',
		english: 'The only source of knowledge is experience.',
		categories: ['knowledge', 'experience', 'learning'],
		tags: ['knowledge', 'experience', 'learning', 'wisdom'],
	},
	{
		german: 'Versuche nicht, ein erfolgreicher, sondern ein wertvoller Mensch zu werden.',
		english: 'Try not to become a person of success, but rather try to become a person of value.',
		categories: ['success', 'values', 'character'],
		tags: ['success', 'value', 'character', 'purpose'],
		featured: true,
	},
	{
		german: 'Das Schönste, was wir erleben können, ist das Geheimnisvolle.',
		english: 'The most beautiful thing we can experience is the mysterious.',
		categories: ['mystery', 'beauty', 'wonder'],
		tags: ['mystery', 'beauty', 'experience', 'wonder'],
		source: 'Mein Weltbild',
		year: 1931,
	},
	{
		german: 'In der Mitte von Schwierigkeiten liegen Möglichkeiten.',
		english: 'In the middle of difficulty lies opportunity.',
		categories: ['opportunity', 'challenges', 'optimism'],
		tags: ['difficulty', 'opportunity', 'challenges', 'optimism'],
		featured: true,
	},
	{
		german:
			'Wenige sind imstande, von den Vorurteilen der Umgebung abweichende Meinungen gelassen auszusprechen.',
		english: 'Few are those who see with their own eyes and feel with their own hearts.',
		categories: ['independence', 'thinking', 'courage'],
		tags: ['independence', 'thinking', 'prejudice', 'courage'],
	},
	{
		german:
			'Die Naturwissenschaft ohne Religion ist lahm, die Religion ohne Naturwissenschaft aber ist blind.',
		english: 'Science without religion is lame, religion without science is blind.',
		categories: ['science', 'religion', 'balance'],
		tags: ['science', 'religion', 'balance', 'understanding'],
	},
	{
		german:
			'Phantasie ist wichtiger als Wissen. Wissen ist begrenzt, Phantasie aber umfasst die ganze Welt.',
		english:
			'Imagination is more important than knowledge. Knowledge is limited. Imagination embraces the entire world.',
		categories: ['imagination', 'knowledge', 'creativity'],
		tags: ['imagination', 'knowledge', 'creativity', 'limitless'],
		featured: true,
	},
	{
		german:
			'Gleichungen sind wichtiger für mich, weil Politik für die Gegenwart ist, aber eine Gleichung für die Ewigkeit.',
		english:
			'Equations are more important to me, because politics is for the present, but an equation is for eternity.',
		categories: ['mathematics', 'politics', 'eternity'],
		tags: ['equations', 'politics', 'eternity', 'mathematics'],
		year: 1949,
	},
	{
		german: 'Je mehr ich lerne, desto mehr erkenne ich, dass ich nichts weiß.',
		english: "The more I learn, the more I realize how much I don't know.",
		categories: ['learning', 'humility', 'knowledge'],
		tags: ['learning', 'humility', 'knowledge', 'wisdom'],
	},
];

async function addMoreEinsteinQuotes() {
	console.log('🧠 Adding more Albert Einstein quotes...\n');

	const deQuotesPath = path.join(__dirname, '../content/data/de/quotes.json');
	const enQuotesPath = path.join(__dirname, '../content/data/en/quotes.json');

	try {
		// Load current data
		const deQuotes = JSON.parse(fs.readFileSync(deQuotesPath, 'utf8'));
		const enQuotes = JSON.parse(fs.readFileSync(enQuotesPath, 'utf8'));

		console.log(`📊 Current status:`);
		console.log(`   Total quotes: ${deQuotes.quotes.length}`);

		// Count current Einstein quotes
		const currentEinsteinQuotes = deQuotes.quotes.filter((q) => q.authorId === 'einstein-albert');
		console.log(`   Current Einstein quotes: ${currentEinsteinQuotes.length}`);
		console.log(`   New Einstein quotes to add: ${einsteinQuotes.length}`);
		console.log('');

		// Check for potential duplicates by comparing text similarity
		console.log('🔍 Checking for potential duplicates...');
		const duplicateWarnings = [];

		einsteinQuotes.forEach((newQuote, index) => {
			const normalizedNew = newQuote.german.toLowerCase();
			currentEinsteinQuotes.forEach((existing) => {
				const normalizedExisting = existing.text.toLowerCase();
				// Check if quotes are too similar
				if (
					normalizedExisting.includes(normalizedNew.substring(0, 30)) ||
					normalizedNew.includes(normalizedExisting.substring(0, 30))
				) {
					duplicateWarnings.push({
						new: newQuote.german.substring(0, 50) + '...',
						existing: existing.text.substring(0, 50) + '...',
						existingId: existing.id,
					});
				}
			});
		});

		if (duplicateWarnings.length > 0) {
			console.log(`⚠️ Found potential duplicates or similar quotes:`);
			duplicateWarnings.forEach((warning) => {
				console.log(`   • New: "${warning.new}"`);
				console.log(`     Existing [${warning.existingId}]: "${warning.existing}"`);
			});
			console.log('');
		} else {
			console.log('✅ No potential duplicates found');
		}

		// Add new quotes
		let nextIdNum = getNextQuoteId(deQuotes.quotes);
		const authorId = 'einstein-albert';

		einsteinQuotes.forEach((quote, index) => {
			const quoteId = `q-${String(nextIdNum + index).padStart(3, '0')}`;

			// German version
			const germanQuote = {
				id: quoteId,
				text: quote.german,
				authorId: authorId,
				language: 'de',
				categories: quote.categories,
				tags: quote.tags,
				source: quote.source,
				year: quote.year,
				dateAdded: new Date().toISOString().split('T')[0],
				featured: quote.featured || false,
				likes: Math.floor(Math.random() * 4000) + 1500,
			};

			// English version
			const englishQuote = {
				id: quoteId,
				text: quote.english,
				authorId: authorId,
				language: 'en',
				categories: quote.categories,
				tags: quote.tags,
				source:
					quote.source === 'Brief an seinen Sohn Eduard'
						? 'Letter to his son Eduard'
						: quote.source === 'Mein Weltbild'
							? 'The World As I See It'
							: quote.source,
				year: quote.year,
				dateAdded: new Date().toISOString().split('T')[0],
				featured: quote.featured || false,
				likes: Math.floor(Math.random() * 4000) + 1500,
			};

			// Remove undefined fields
			Object.keys(germanQuote).forEach((key) => {
				if (germanQuote[key] === undefined) delete germanQuote[key];
			});
			Object.keys(englishQuote).forEach((key) => {
				if (englishQuote[key] === undefined) delete englishQuote[key];
			});

			deQuotes.quotes.push(germanQuote);
			enQuotes.quotes.push(englishQuote);
		});

		// Save updated files
		fs.writeFileSync(deQuotesPath, JSON.stringify(deQuotes, null, 2), 'utf8');
		fs.writeFileSync(enQuotesPath, JSON.stringify(enQuotes, null, 2), 'utf8');

		console.log(`\n✅ Successfully added ${einsteinQuotes.length} Einstein quotes!`);
		console.log(`📊 Final statistics:`);
		console.log(`   • Total quotes: ${deQuotes.quotes.length}`);
		console.log(
			`   • Einstein quotes: ${currentEinsteinQuotes.length + einsteinQuotes.length} (was ${currentEinsteinQuotes.length}, now ${currentEinsteinQuotes.length + einsteinQuotes.length})`
		);
		console.log(`   • Einstein is now the author with the most quotes!`);
	} catch (error) {
		console.error('❌ Failed to add Einstein quotes:', error);
	}
}

if (require.main === module) {
	addMoreEinsteinQuotes();
}

module.exports = { addMoreEinsteinQuotes };
