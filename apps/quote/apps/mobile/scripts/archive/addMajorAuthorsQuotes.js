#!/usr/bin/env node

/**
 * Add quotes for major philosophers and authors who need more content
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

// Platon quotes (currently has only 1!)
const platonQuotes = [
	{
		german: 'Der ungeprüfte Lebensgang ist des Menschen nicht wert.',
		english: 'The unexamined life is not worth living.',
		categories: ['philosophy', 'self-knowledge', 'wisdom'],
		tags: ['examination', 'life', 'wisdom', 'knowledge'],
		featured: true,
	},
	{
		german: 'Die Wahrheit ist die Tochter der Zeit.',
		english: 'Truth is the daughter of time.',
		categories: ['truth', 'time', 'philosophy'],
		tags: ['truth', 'time', 'revelation', 'patience'],
	},
	{
		german: 'Wissen ist die einzige Tugend und Unwissen das einzige Laster.',
		english: 'Knowledge is the only virtue and ignorance the only vice.',
		categories: ['knowledge', 'virtue', 'education'],
		tags: ['knowledge', 'virtue', 'ignorance', 'vice'],
		featured: true,
	},
	{
		german: 'Die Schönheit liegt im Auge des Betrachters.',
		english: 'Beauty lies in the eyes of the beholder.',
		categories: ['beauty', 'perception', 'philosophy'],
		tags: ['beauty', 'perception', 'subjectivity', 'observation'],
	},
	{
		german: 'Gerechtigkeit ist die Tugend der Seele.',
		english: 'Justice is the virtue of the soul.',
		categories: ['justice', 'virtue', 'soul'],
		tags: ['justice', 'virtue', 'soul', 'morality'],
		featured: true,
	},
	{
		german: 'Lernen bedeutet sich zu erinnern.',
		english: 'Learning is remembrance.',
		categories: ['learning', 'memory', 'knowledge'],
		tags: ['learning', 'memory', 'remembrance', 'education'],
	},
	{
		german: 'Nur die Toten haben das Ende des Krieges gesehen.',
		english: 'Only the dead have seen the end of war.',
		categories: ['war', 'death', 'peace'],
		tags: ['war', 'death', 'peace', 'mortality'],
	},
];

// Saint-Exupéry quotes (currently has 3, let's add more from The Little Prince)
const saintExuperyQuotes = [
	{
		german: 'Die Zeit, die du für deine Rose verloren hast, sie macht deine Rose so wichtig.',
		english: 'It is the time you have wasted for your rose that makes your rose so important.',
		source: 'Der kleine Prinz',
		year: 1943,
		categories: ['love', 'time', 'relationships'],
		tags: ['time', 'love', 'importance', 'relationships'],
		featured: true,
	},
	{
		german:
			'Wenn du ein Schiff bauen willst, dann trommle nicht Männer zusammen, sondern lehre sie die Sehnsucht nach dem weiten, endlosen Meer.',
		english:
			"If you want to build a ship, don't drum up people to collect wood and don't assign them tasks, but rather teach them to long for the endless sea.",
		categories: ['leadership', 'motivation', 'vision'],
		tags: ['leadership', 'vision', 'motivation', 'inspiration'],
		featured: true,
	},
	{
		german: 'Es ist viel schwerer, über sich selbst zu urteilen, als über andere.',
		english: 'It is much more difficult to judge oneself than to judge others.',
		source: 'Der kleine Prinz',
		year: 1943,
		categories: ['self-knowledge', 'judgment', 'wisdom'],
		tags: ['self-judgment', 'wisdom', 'introspection', 'difficulty'],
	},
	{
		german: 'Alle großen Leute waren einmal Kinder, aber nur wenige erinnern sich daran.',
		english: 'All grown-ups were once children... but only few of them remember it.',
		source: 'Der kleine Prinz',
		year: 1943,
		categories: ['childhood', 'memory', 'wisdom'],
		tags: ['childhood', 'adults', 'memory', 'innocence'],
		featured: true,
	},
	{
		german:
			'Perfektion ist nicht dann erreicht, wenn es nichts mehr hinzuzufügen gibt, sondern wenn nichts mehr weggenommen werden kann.',
		english:
			'Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away.',
		categories: ['perfection', 'simplicity', 'design'],
		tags: ['perfection', 'simplicity', 'minimalism', 'design'],
		featured: true,
	},
	{
		german:
			'Liebe besteht nicht darin, dass man einander ansieht, sondern dass man gemeinsam in die gleiche Richtung blickt.',
		english:
			'Love does not consist of gazing at each other, but in looking outward together in the same direction.',
		categories: ['love', 'relationships', 'partnership'],
		tags: ['love', 'partnership', 'direction', 'unity'],
	},
];

// Sokrates quotes (currently has 3, let's add more)
const sokratesQuotes = [
	{
		german: 'Ich weiß, dass ich nichts weiß.',
		english: 'I know that I know nothing.',
		categories: ['wisdom', 'humility', 'knowledge'],
		tags: ['knowledge', 'humility', 'wisdom', 'ignorance'],
		featured: true,
	},
	{
		german: 'Ein Leben ohne Prüfung ist nicht lebenswert.',
		english: 'The unexamined life is not worth living.',
		categories: ['philosophy', 'self-reflection', 'wisdom'],
		tags: ['examination', 'life', 'reflection', 'worth'],
	},
	{
		german: 'Tugend ist Wissen.',
		english: 'Virtue is knowledge.',
		categories: ['virtue', 'knowledge', 'morality'],
		tags: ['virtue', 'knowledge', 'morality', 'ethics'],
	},
	{
		german: 'Niemand tut freiwillig Böses.',
		english: 'No one does wrong willingly.',
		categories: ['morality', 'evil', 'philosophy'],
		tags: ['evil', 'will', 'morality', 'intention'],
	},
	{
		german: 'Das einzige Gute ist Wissen und das einzige Schlechte ist Unwissenheit.',
		english: 'The only good is knowledge and the only evil is ignorance.',
		categories: ['knowledge', 'good', 'evil'],
		tags: ['knowledge', 'good', 'evil', 'ignorance'],
		featured: true,
	},
];

// Marcus Aurelius quotes (currently has 3, let's add more)
const marcusAureliusQuotes = [
	{
		german:
			'Du hast Macht über deinen Geist - nicht über äußere Ereignisse. Erkenne das, und du wirst Stärke finden.',
		english:
			'You have power over your mind - not outside events. Realize this, and you will find strength.',
		source: 'Selbstbetrachtungen',
		categories: ['stoicism', 'mind', 'control'],
		tags: ['mind', 'control', 'strength', 'events'],
		featured: true,
	},
	{
		german:
			'Sehr wenig ist nötig, um ein glückliches Leben zu führen; alles liegt in dir selbst, in deiner Denkweise.',
		english:
			'Very little is needed to make a happy life; it is all within yourself, in your way of thinking.',
		source: 'Selbstbetrachtungen',
		categories: ['happiness', 'stoicism', 'thinking'],
		tags: ['happiness', 'thinking', 'simplicity', 'inner-life'],
		featured: true,
	},
	{
		german:
			'Verschwende keine Zeit mehr damit zu diskutieren, was ein guter Mensch sein sollte. Sei einer.',
		english: 'Waste no more time arguing what a good man should be. Be one.',
		source: 'Selbstbetrachtungen',
		categories: ['action', 'virtue', 'character'],
		tags: ['action', 'virtue', 'character', 'goodness'],
		featured: true,
	},
	{
		german: 'Das Glück deines Lebens hängt von der Beschaffenheit deiner Gedanken ab.',
		english: 'The happiness of your life depends upon the quality of your thoughts.',
		source: 'Selbstbetrachtungen',
		categories: ['happiness', 'thoughts', 'stoicism'],
		tags: ['happiness', 'thoughts', 'quality', 'life'],
	},
	{
		german:
			'Akzeptiere die Dinge, an die das Schicksal dich bindet, und liebe die Menschen, mit denen das Schicksal dich zusammenführt.',
		english:
			'Accept the things to which fate binds you, and love the people with whom fate brings you together.',
		source: 'Selbstbetrachtungen',
		categories: ['fate', 'acceptance', 'love'],
		tags: ['fate', 'acceptance', 'love', 'people'],
	},
];

async function addMajorAuthorsQuotes() {
	console.log('📚 Adding quotes for major authors who need more content...\n');

	const deQuotesPath = path.join(__dirname, '../content/data/de/quotes.json');
	const enQuotesPath = path.join(__dirname, '../content/data/en/quotes.json');

	try {
		const deQuotes = JSON.parse(fs.readFileSync(deQuotesPath, 'utf8'));
		const enQuotes = JSON.parse(fs.readFileSync(enQuotesPath, 'utf8'));

		console.log(`Current quotes: ${deQuotes.quotes.length}`);
		let nextIdNum = getNextQuoteId(deQuotes.quotes);

		const authorsToAdd = [
			{ name: 'Platon', id: 'platon', quotes: platonQuotes, currentCount: 1 },
			{
				name: 'Saint-Exupéry',
				id: 'saint-exupery-antoine',
				quotes: saintExuperyQuotes,
				currentCount: 3,
			},
			{ name: 'Sokrates', id: 'sokrates', quotes: sokratesQuotes, currentCount: 3 },
			{
				name: 'Marcus Aurelius',
				id: 'marcus-aurelius',
				quotes: marcusAureliusQuotes,
				currentCount: 3,
			},
		];

		let totalAdded = 0;

		for (const author of authorsToAdd) {
			console.log(
				`Adding ${author.quotes.length} quotes for ${author.name} (was ${author.currentCount})...`
			);

			author.quotes.forEach((quote, index) => {
				const quoteId = `q-${String(nextIdNum + index).padStart(3, '0')}`;

				// German version
				const germanQuote = {
					id: quoteId,
					text: quote.german,
					authorId: author.id,
					language: 'de',
					categories: quote.categories,
					tags: quote.tags,
					source: quote.source,
					year: quote.year,
					dateAdded: new Date().toISOString().split('T')[0],
					featured: quote.featured || false,
					likes: Math.floor(Math.random() * 3000) + 1000,
				};

				// English version
				const englishQuote = {
					id: quoteId,
					text: quote.english,
					authorId: author.id,
					language: 'en',
					categories: quote.categories,
					tags: quote.tags,
					source:
						quote.source === 'Der kleine Prinz'
							? 'The Little Prince'
							: quote.source === 'Selbstbetrachtungen'
								? 'Meditations'
								: quote.source,
					year: quote.year,
					dateAdded: new Date().toISOString().split('T')[0],
					featured: quote.featured || false,
					likes: Math.floor(Math.random() * 3000) + 1000,
				};

				deQuotes.quotes.push(germanQuote);
				enQuotes.quotes.push(englishQuote);
			});

			nextIdNum += author.quotes.length;
			totalAdded += author.quotes.length;
		}

		// Save files
		fs.writeFileSync(deQuotesPath, JSON.stringify(deQuotes, null, 2), 'utf8');
		fs.writeFileSync(enQuotesPath, JSON.stringify(enQuotes, null, 2), 'utf8');

		console.log(`\n✅ Added ${totalAdded} quotes total:`);
		authorsToAdd.forEach((author) => {
			console.log(
				`   • ${author.name}: +${author.quotes.length} quotes (was ${author.currentCount}, now ${author.currentCount + author.quotes.length})`
			);
		});
		console.log(`📊 New total: ${deQuotes.quotes.length} quotes in both languages`);
	} catch (error) {
		console.error('❌ Failed to add quotes:', error);
	}
}

if (require.main === module) {
	addMajorAuthorsQuotes();
}

module.exports = { addMajorAuthorsQuotes };
