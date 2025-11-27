#!/usr/bin/env node

/**
 * Add famous Shakespeare quotes - he currently has 0 quotes!
 */

const fs = require('fs');
const path = require('path');

// Find the highest quote ID to continue numbering
function getNextQuoteId(quotes) {
	const maxId = quotes.reduce((max, quote) => {
		const idNum = parseInt(quote.id.replace('q-', ''));
		return idNum > max ? idNum : max;
	}, 0);
	return `q-${String(maxId + 1).padStart(3, '0')}`;
}

// Shakespeare quotes - German and English
const shakespeareQuotes = [
	{
		german: 'Sein oder Nichtsein, das ist hier die Frage.',
		english: 'To be or not to be, that is the question.',
		source: 'Hamlet',
		year: 1603,
		categories: ['philosophy', 'existence', 'life'],
		tags: ['existence', 'death', 'choice', 'philosophy'],
		featured: true,
	},
	{
		german: 'Die ganze Welt ist eine Bühne, und alle Frauen und Männer bloße Spieler.',
		english: "All the world's a stage, and all the men and women merely players.",
		source: 'Wie es euch gefällt',
		year: 1599,
		categories: ['life', 'philosophy', 'theater'],
		tags: ['life', 'roles', 'performance', 'world'],
		featured: true,
	},
	{
		german:
			'Was ist in einem Namen? Was wir Rose nennen, würde unter jedem anderen Namen genauso süß duften.',
		english: "What's in a name? That which we call a rose by any other name would smell as sweet.",
		source: 'Romeo und Julia',
		year: 1595,
		categories: ['love', 'philosophy', 'identity'],
		tags: ['names', 'identity', 'love', 'essence'],
	},
	{
		german: 'Liebe schaut nicht mit den Augen, sondern mit dem Geiste.',
		english: 'Love looks not with the eyes but with the mind.',
		source: 'Ein Sommernachtstraum',
		year: 1595,
		categories: ['love', 'perception', 'wisdom'],
		tags: ['love', 'perception', 'heart', 'mind'],
	},
	{
		german:
			'Zweifel sind Verräter und lassen uns oft das Gute verlieren, das wir gewinnen könnten, wenn wir nur den Versuch nicht scheuten.',
		english:
			'Our doubts are traitors, and make us lose the good we oft might win, by fearing to attempt.',
		source: 'Maß für Maß',
		year: 1604,
		categories: ['courage', 'motivation', 'fear'],
		tags: ['doubt', 'fear', 'opportunity', 'courage'],
	},
	{
		german: 'Es gibt mehr Dinge im Himmel und auf Erden, als eure Schulweisheit sich träumt.',
		english: 'There are more things in heaven and earth than are dreamt of in your philosophy.',
		source: 'Hamlet',
		year: 1603,
		categories: ['wisdom', 'mystery', 'knowledge'],
		tags: ['mystery', 'knowledge', 'universe', 'wisdom'],
	},
	{
		german: 'Wir wissen, was wir sind, aber nicht, was wir werden könnten.',
		english: 'We know what we are, but know not what we may be.',
		source: 'Hamlet',
		year: 1603,
		categories: ['potential', 'self-knowledge', 'future'],
		tags: ['potential', 'identity', 'future', 'growth'],
	},
	{
		german: 'Der Narr hält sich für weise, aber der Weise weiß, dass er ein Narr ist.',
		english: 'The fool doth think he is wise, but the wise man knows himself to be a fool.',
		source: 'Wie es euch gefällt',
		year: 1599,
		categories: ['wisdom', 'humility', 'knowledge'],
		tags: ['wisdom', 'humility', 'knowledge', 'foolishness'],
	},
	{
		german: 'Besser ein schlechter Witz als gar keine Unterhaltung.',
		english: 'Better a witty fool than a foolish wit.',
		source: 'Was ihr wollt',
		year: 1601,
		categories: ['humor', 'wit', 'intelligence'],
		tags: ['wit', 'humor', 'intelligence', 'entertainment'],
	},
	{
		german: 'Die Vergangenheit ist Prolog.',
		english: "What's past is prologue.",
		source: 'Der Sturm',
		year: 1611,
		categories: ['time', 'future', 'philosophy'],
		tags: ['past', 'future', 'time', 'beginning'],
	},
	{
		german: 'Macht ist gefährlich, außer sie liegt in den Händen derer, die sie nicht begehren.',
		english: 'Power is dangerous unless you have humility.',
		source: 'Measure for Measure',
		year: 1604,
		categories: ['power', 'humility', 'politics'],
		tags: ['power', 'humility', 'leadership', 'danger'],
	},
	{
		german: 'Das Gewissen macht Feiglinge aus uns allen.',
		english: 'Conscience does make cowards of us all.',
		source: 'Hamlet',
		year: 1603,
		categories: ['morality', 'conscience', 'courage'],
		tags: ['conscience', 'morality', 'courage', 'guilt'],
	},
];

async function addShakespeareQuotes() {
	console.log('📚 Adding Shakespeare quotes (currently has 0!)...\n');

	const deQuotesPath = path.join(__dirname, '../content/data/de/quotes.json');
	const enQuotesPath = path.join(__dirname, '../content/data/en/quotes.json');

	try {
		// Load current data
		const deQuotes = JSON.parse(fs.readFileSync(deQuotesPath, 'utf8'));
		const enQuotes = JSON.parse(fs.readFileSync(enQuotesPath, 'utf8'));

		console.log(`Current German quotes: ${deQuotes.quotes.length}`);
		console.log(`Current English quotes: ${enQuotes.quotes.length}`);

		// Check if Shakespeare author exists
		const deAuthorsPath = path.join(__dirname, '../content/data/de/authors.json');
		const deAuthors = JSON.parse(fs.readFileSync(deAuthorsPath, 'utf8'));

		const shakespeareAuthor = deAuthors.authors.find(
			(a) => a.name.includes('Shakespeare') || a.id.includes('shakespeare')
		);

		let authorId = 'shakespeare-william';
		if (shakespeareAuthor) {
			authorId = shakespeareAuthor.id;
			console.log(`Found Shakespeare author: ${shakespeareAuthor.name} (${authorId})`);
		} else {
			console.log('⚠️ Shakespeare author not found, using default ID: shakespeare-william');
		}

		// Add German quotes
		let nextId = getNextQuoteId(deQuotes.quotes);
		shakespeareQuotes.forEach((quote, index) => {
			const quoteId = `q-${String(parseInt(nextId.replace('q-', '')) + index).padStart(3, '0')}`;

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
				likes: Math.floor(Math.random() * 3000) + 1000,
			};

			deQuotes.quotes.push(germanQuote);
		});

		// Add English quotes
		shakespeareQuotes.forEach((quote, index) => {
			const quoteId = `q-${String(parseInt(nextId.replace('q-', '')) + index).padStart(3, '0')}`;

			const englishQuote = {
				id: quoteId,
				text: quote.english,
				authorId: authorId,
				language: 'en',
				categories: quote.categories,
				tags: quote.tags,
				source:
					quote.source === 'Wie es euch gefällt'
						? 'As You Like It'
						: quote.source === 'Romeo und Julia'
							? 'Romeo and Juliet'
							: quote.source === 'Ein Sommernachtstraum'
								? "A Midsummer Night's Dream"
								: quote.source === 'Maß für Maß'
									? 'Measure for Measure'
									: quote.source === 'Was ihr wollt'
										? 'Twelfth Night'
										: quote.source === 'Der Sturm'
											? 'The Tempest'
											: quote.source,
				year: quote.year,
				dateAdded: new Date().toISOString().split('T')[0],
				featured: quote.featured || false,
				likes: Math.floor(Math.random() * 3000) + 1000,
			};

			enQuotes.quotes.push(englishQuote);
		});

		// Save files
		fs.writeFileSync(deQuotesPath, JSON.stringify(deQuotes, null, 2), 'utf8');
		fs.writeFileSync(enQuotesPath, JSON.stringify(enQuotes, null, 2), 'utf8');

		console.log(`✅ Added ${shakespeareQuotes.length} Shakespeare quotes to both languages`);
		console.log(
			`📊 New totals: German ${deQuotes.quotes.length}, English ${enQuotes.quotes.length}`
		);
	} catch (error) {
		console.error('❌ Failed to add Shakespeare quotes:', error);
	}
}

if (require.main === module) {
	addShakespeareQuotes();
}

module.exports = { addShakespeareQuotes };
