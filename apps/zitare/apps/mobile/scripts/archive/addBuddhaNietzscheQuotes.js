#!/usr/bin/env node

/**
 * Add Buddha and Nietzsche quotes - major expansion
 */

const fs = require('fs');
const path = require('path');

// Find the highest quote ID to continue numbering
function getNextQuoteId(quotes) {
	const maxId = quotes.reduce((max, quote) => {
		const idNum = parseInt(quote.id.replace('q-', ''));
		return idNum > max ? idNum : max;
	}, 0);
	return maxId + 1;
}

// Buddha quotes (currently has only 1!)
const buddhaQuotes = [
	{
		german: 'Das Glück liegt nicht im Besitz, sondern im Genießen.',
		english:
			'Happiness does not depend on what you have or who you are, it solely relies on what you think.',
		categories: ['happiness', 'mindfulness', 'wisdom'],
		tags: ['happiness', 'possession', 'mindfulness', 'contentment'],
		featured: true,
	},
	{
		german:
			'Hass wird niemals durch Hass beendet. Hass wird durch Liebe beendet. Das ist das ewige Gesetz.',
		english:
			'Hatred is never appeased by hatred in this world. By non-hatred alone is hatred appeased. This is a law eternal.',
		categories: ['love', 'peace', 'wisdom'],
		tags: ['hate', 'love', 'peace', 'eternal-law'],
		featured: true,
	},
	{
		german: 'Der Geist ist alles. Was du denkst, das wirst du.',
		english: 'The mind is everything. What you think you become.',
		categories: ['mind', 'thoughts', 'self-development'],
		tags: ['mind', 'thoughts', 'becoming', 'consciousness'],
		featured: true,
	},
	{
		german:
			'Tausende von Kerzen können von einer einzigen Kerze angezündet werden, ohne dass ihr Licht schwächer wird.',
		english:
			'Thousands of candles can be lighted from a single candle, and the life of the candle will not be shortened.',
		categories: ['sharing', 'wisdom', 'generosity'],
		tags: ['sharing', 'light', 'generosity', 'abundance'],
	},
	{
		german:
			'Verweile nicht in der Vergangenheit, träume nicht von der Zukunft. Konzentriere dich auf den gegenwärtigen Moment.',
		english:
			'Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.',
		categories: ['mindfulness', 'present', 'meditation'],
		tags: ['present', 'mindfulness', 'past', 'future'],
		featured: true,
	},
	{
		german:
			'Drei Dinge können nicht lange verborgen bleiben: die Sonne, der Mond und die Wahrheit.',
		english: 'Three things cannot be long hidden: the sun, the moon, and the truth.',
		categories: ['truth', 'wisdom', 'nature'],
		tags: ['truth', 'sun', 'moon', 'hidden'],
	},
	{
		german: 'Frieden kommt von innen. Suche ihn nicht im Äußeren.',
		english: 'Peace comes from within. Do not seek it without.',
		categories: ['peace', 'inner-peace', 'wisdom'],
		tags: ['peace', 'inner', 'seeking', 'external'],
	},
	{
		german:
			'Du selbst musst dich um dein eigenes Wohlbefinden kümmern. Niemand sonst kann das für dich tun.',
		english:
			'No one saves us but ourselves. No one can and no one may. We ourselves must walk the path.',
		categories: ['self-reliance', 'responsibility', 'independence'],
		tags: ['self-reliance', 'responsibility', 'independence', 'path'],
	},
	{
		german: 'Gesundheit ist die größte Gabe, Zufriedenheit der größte Reichtum.',
		english:
			'Health is the greatest gift, contentment the greatest wealth, faithfulness the best relationship.',
		categories: ['health', 'contentment', 'wisdom'],
		tags: ['health', 'contentment', 'wealth', 'gifts'],
	},
];

// Nietzsche quotes (currently has 5, let's add more)
const nietzscheQuotes = [
	{
		german: 'Gott ist tot! Gott bleibt tot! Und wir haben ihn getötet!',
		english: 'God is dead! God remains dead! And we have killed him!',
		source: 'Die fröhliche Wissenschaft',
		year: 1882,
		categories: ['philosophy', 'religion', 'nihilism'],
		tags: ['god', 'death', 'nihilism', 'religion'],
		featured: true,
	},
	{
		german: 'Was aus Liebe getan wird, geschieht immer jenseits von Gut und Böse.',
		english: 'What is done out of love always takes place beyond good and evil.',
		categories: ['love', 'morality', 'philosophy'],
		tags: ['love', 'morality', 'good', 'evil'],
		featured: true,
	},
	{
		german: 'Der Mensch ist etwas, das überwunden werden soll.',
		english: 'Man is something that shall be overcome.',
		source: 'Also sprach Zarathustra',
		year: 1883,
		categories: ['philosophy', 'human-nature', 'evolution'],
		tags: ['human', 'overcome', 'evolution', 'development'],
	},
	{
		german: 'Ohne Musik wäre das Leben ein Irrtum.',
		english: 'Without music, life would be a mistake.',
		categories: ['music', 'art', 'life'],
		tags: ['music', 'life', 'art', 'mistake'],
		featured: true,
	},
	{
		german: 'Werde, was du bist.',
		english: 'Become who you are.',
		categories: ['self-development', 'identity', 'authenticity'],
		tags: ['become', 'identity', 'authenticity', 'self'],
		featured: true,
	},
	{
		german: 'Wer ein Warum zu leben hat, erträgt fast jedes Wie.',
		english: 'He who has a why to live can bear almost any how.',
		categories: ['purpose', 'meaning', 'resilience'],
		tags: ['why', 'purpose', 'meaning', 'endurance'],
		featured: true,
	},
	{
		german:
			'Die Hoffnung ist der schlechteste der Übel, denn sie verlängert die Qualen des Menschen.',
		english: 'Hope is the worst of evils, for it prolongs the torments of man.',
		categories: ['hope', 'philosophy', 'suffering'],
		tags: ['hope', 'evil', 'suffering', 'torment'],
	},
	{
		german: 'Alle Vorurteile stammen aus den Eingeweiden.',
		english: 'All prejudices come from the intestines.',
		categories: ['prejudice', 'wisdom', 'psychology'],
		tags: ['prejudice', 'intuition', 'psychology', 'bias'],
	},
	{
		german: 'Das Individuum hat immer gegen die Gesellschaft zu kämpfen.',
		english: 'The individual has always had to struggle not to be overwhelmed by the tribe.',
		categories: ['individualism', 'society', 'independence'],
		tags: ['individual', 'society', 'struggle', 'independence'],
	},
];

async function addMoreQuotes() {
	console.log('🧘‍♂️ Adding Buddha quotes (currently 1) and more Nietzsche quotes...\n');

	const deQuotesPath = path.join(__dirname, '../content/data/de/quotes.json');
	const enQuotesPath = path.join(__dirname, '../content/data/en/quotes.json');

	try {
		// Load current data
		const deQuotes = JSON.parse(fs.readFileSync(deQuotesPath, 'utf8'));
		const enQuotes = JSON.parse(fs.readFileSync(enQuotesPath, 'utf8'));

		console.log(`Current quotes: ${deQuotes.quotes.length}`);

		let nextIdNum = getNextQuoteId(deQuotes.quotes);

		// Add Buddha quotes
		const buddhaAuthorId = 'buddha'; // From analysis
		console.log(`Adding ${buddhaQuotes.length} Buddha quotes...`);

		buddhaQuotes.forEach((quote, index) => {
			const quoteId = `q-${String(nextIdNum + index).padStart(3, '0')}`;

			// German version
			const germanQuote = {
				id: quoteId,
				text: quote.german,
				authorId: buddhaAuthorId,
				language: 'de',
				categories: quote.categories,
				tags: quote.tags,
				dateAdded: new Date().toISOString().split('T')[0],
				featured: quote.featured || false,
				likes: Math.floor(Math.random() * 4000) + 1500,
			};

			// English version
			const englishQuote = {
				id: quoteId,
				text: quote.english,
				authorId: buddhaAuthorId,
				language: 'en',
				categories: quote.categories,
				tags: quote.tags,
				dateAdded: new Date().toISOString().split('T')[0],
				featured: quote.featured || false,
				likes: Math.floor(Math.random() * 4000) + 1500,
			};

			deQuotes.quotes.push(germanQuote);
			enQuotes.quotes.push(englishQuote);
		});

		nextIdNum += buddhaQuotes.length;

		// Add Nietzsche quotes
		const nietzscheAuthorId = 'nietzsche-friedrich';
		console.log(`Adding ${nietzscheQuotes.length} more Nietzsche quotes...`);

		nietzscheQuotes.forEach((quote, index) => {
			const quoteId = `q-${String(nextIdNum + index).padStart(3, '0')}`;

			// German version
			const germanQuote = {
				id: quoteId,
				text: quote.german,
				authorId: nietzscheAuthorId,
				language: 'de',
				categories: quote.categories,
				tags: quote.tags,
				source: quote.source,
				year: quote.year,
				dateAdded: new Date().toISOString().split('T')[0],
				featured: quote.featured || false,
				likes: Math.floor(Math.random() * 3500) + 1200,
			};

			// English version
			const englishQuote = {
				id: quoteId,
				text: quote.english,
				authorId: nietzscheAuthorId,
				language: 'en',
				categories: quote.categories,
				tags: quote.tags,
				source:
					quote.source === 'Die fröhliche Wissenschaft'
						? 'The Gay Science'
						: quote.source === 'Also sprach Zarathustra'
							? 'Thus Spoke Zarathustra'
							: quote.source,
				year: quote.year,
				dateAdded: new Date().toISOString().split('T')[0],
				featured: quote.featured || false,
				likes: Math.floor(Math.random() * 3500) + 1200,
			};

			deQuotes.quotes.push(germanQuote);
			enQuotes.quotes.push(englishQuote);
		});

		// Save files
		fs.writeFileSync(deQuotesPath, JSON.stringify(deQuotes, null, 2), 'utf8');
		fs.writeFileSync(enQuotesPath, JSON.stringify(enQuotes, null, 2), 'utf8');

		const totalAdded = buddhaQuotes.length + nietzscheQuotes.length;
		console.log(`✅ Added ${totalAdded} quotes total:`);
		console.log(
			`   • Buddha: ${buddhaQuotes.length} quotes (was 1, now ${1 + buddhaQuotes.length})`
		);
		console.log(
			`   • Nietzsche: ${nietzscheQuotes.length} quotes (was 5, now ${5 + nietzscheQuotes.length})`
		);
		console.log(`📊 New total: ${deQuotes.quotes.length} quotes in both languages`);
	} catch (error) {
		console.error('❌ Failed to add quotes:', error);
	}
}

if (require.main === module) {
	addMoreQuotes();
}

module.exports = { addMoreQuotes };
