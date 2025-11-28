#!/usr/bin/env npx tsx

import fs from 'fs/promises';
import path from 'path';

// Additional quotes for more authors
const additionalQuotes = {
	'picasso-pablo': [
		{
			text: 'Jedes Kind ist ein Künstler. Das Problem ist nur, ein Künstler zu bleiben, während man erwachsen wird.',
			textEN: 'Every child is an artist. The problem is how to remain an artist once we grow up.',
			categories: ['art', 'creativity'],
		},
		{
			text: 'Kunst wäscht den Staub des Alltags von der Seele.',
			textEN: 'Art washes away from the soul the dust of everyday life.',
			categories: ['art', 'soul'],
		},
		{
			text: 'Ich male die Dinge, wie ich sie denke, nicht wie ich sie sehe.',
			textEN: 'I paint objects as I think them, not as I see them.',
			categories: ['art', 'perception'],
		},
		{
			text: 'Gute Künstler kopieren, große Künstler stehlen.',
			textEN: 'Good artists copy, great artists steal.',
			categories: ['art', 'creativity'],
		},
		{
			text: 'Die Bedeutung der Dinge liegt nicht in den Dingen selbst, sondern in unserer Einstellung zu ihnen.',
			textEN:
				'The meaning of things lies not in the things themselves, but in our attitude towards them.',
			categories: ['meaning', 'perspective'],
		},
	],
	'kafka-franz': [
		{
			text: 'Wege entstehen dadurch, dass man sie geht.',
			textEN: 'Paths are made by walking.',
			categories: ['path', 'action'],
		},
		{
			text: 'Ein Buch muss die Axt sein für das gefrorene Meer in uns.',
			textEN: 'A book must be the axe for the frozen sea within us.',
			categories: ['books', 'transformation'],
		},
		{
			text: 'Jeder, der sich die Fähigkeit erhält, Schönes zu erkennen, wird nie alt werden.',
			textEN: 'Anyone who keeps the ability to see beauty never grows old.',
			categories: ['beauty', 'youth'],
		},
		{
			text: 'Von einem gewissen Punkt an gibt es keine Rückkehr mehr. Dieser Punkt ist zu erreichen.',
			textEN:
				'From a certain point onward there is no longer any turning back. That is the point that must be reached.',
			categories: ['commitment', 'decision'],
		},
		{
			text: 'Die Wahrheit über Sancho Pansa ist, dass er seinen Teufel losgeworden ist.',
			textEN: 'In the struggle between yourself and the world, side with the world.',
			categories: ['struggle', 'acceptance'],
		},
	],
	'ali-muhammad': [
		{
			text: 'Schwebe wie ein Schmetterling, stich wie eine Biene.',
			textEN: 'Float like a butterfly, sting like a bee.',
			categories: ['strategy', 'strength'],
		},
		{
			text: 'Unmöglich ist nur ein großes Wort, das von kleinen Menschen benutzt wird.',
			textEN: 'Impossible is just a big word thrown around by small men.',
			categories: ['possibility', 'courage'],
		},
		{
			text: 'Der Mensch, der keine Fantasie hat, hat keine Flügel.',
			textEN: 'The man who has no imagination has no wings.',
			categories: ['imagination', 'freedom'],
		},
		{
			text: 'Ich hasse jede Minute des Trainings, aber ich sage: Gib nicht auf. Leide jetzt und lebe den Rest deines Lebens als Champion.',
			textEN:
				"I hated every minute of training, but I said, 'Don't quit. Suffer now and live the rest of your life as a champion.'",
			categories: ['perseverance', 'success'],
		},
		{
			text: 'Champions werden nicht in Fitnessstudios gemacht. Champions werden aus etwas gemacht, das sie tief in sich haben - einem Verlangen, einem Traum, einer Vision.',
			textEN:
				"Champions aren't made in gyms. Champions are made from something they have deep inside them - a desire, a dream, a vision.",
			categories: ['champions', 'vision'],
		},
	],
	'yeats-william-butler': [
		{
			text: 'Bildung ist nicht das Füllen eines Eimers, sondern das Entzünden eines Feuers.',
			textEN: 'Education is not the filling of a pail, but the lighting of a fire.',
			categories: ['education', 'inspiration'],
		},
		{
			text: 'Es gibt noch eine andere Welt, aber sie ist in dieser.',
			textEN: 'There is another world, but it is in this one.',
			categories: ['reality', 'mystery'],
		},
		{
			text: 'Verantwortung beginnt in Träumen.',
			textEN: 'In dreams begins responsibility.',
			categories: ['dreams', 'responsibility'],
		},
		{
			text: 'Denke wie ein weiser Mann, aber kommuniziere in der Sprache des Volkes.',
			textEN: 'Think like a wise man but communicate in the language of the people.',
			categories: ['wisdom', 'communication'],
		},
		{
			text: 'Wir können aus der Streiterei der anderen Wahrheit machen, aber aus unserer eigenen nur Poesie.',
			textEN:
				'We make out of the quarrel with others, rhetoric, but of the quarrel with ourselves, poetry.',
			categories: ['conflict', 'creativity'],
		},
	],
	'eliot-george': [
		{
			text: 'Es ist nie zu spät, das zu werden, was man hätte sein können.',
			textEN: 'It is never too late to be what you might have been.',
			categories: ['potential', 'growth'],
		},
		{
			text: 'Die Tiere sind so angenehme Freunde - sie stellen keine Fragen, sie üben keine Kritik.',
			textEN:
				'Animals are such agreeable friends - they ask no questions, they pass no criticisms.',
			categories: ['animals', 'friendship'],
		},
		{
			text: 'Was wir Verzweiflung nennen, ist oft nur die schmerzhafte Sehnsucht ungenährter Hoffnung.',
			textEN: 'What we call despair is often only the painful eagerness of unfed hope.',
			categories: ['hope', 'despair'],
		},
		{
			text: 'Gesegnet ist der Mensch, der nichts zu sagen hat und den Mund hält.',
			textEN:
				'Blessed is the man who, having nothing to say, abstains from giving us wordy evidence of the fact.',
			categories: ['silence', 'wisdom'],
		},
		{
			text: 'Die stärksten Frauen sind die, die Liebe zeigen, auch wenn sie leiden.',
			textEN: 'The strongest women are those who love beyond all faults.',
			categories: ['strength', 'love'],
		},
	],
	'tracy-brian': [
		{
			text: 'Erfolgreiche Menschen sind einfach jene mit erfolgreichen Gewohnheiten.',
			textEN: 'Successful people are simply those with successful habits.',
			categories: ['success', 'habits'],
		},
		{
			text: 'Du wirst nie die Zeit haben, alles zu tun, aber du wirst immer die Zeit haben, das Wichtigste zu tun.',
			textEN:
				'You will never have enough time to do everything, but you will always have enough time to do the most important thing.',
			categories: ['time', 'priorities'],
		},
		{
			text: 'Die Qualität deines Denkens bestimmt die Qualität deines Lebens.',
			textEN: 'The quality of your thinking determines the quality of your life.',
			categories: ['thinking', 'life'],
		},
		{
			text: 'Investiere die ersten 10 Prozent deines Tages in dich selbst, und die restlichen 90 Prozent werden sich von selbst regeln.',
			textEN:
				'Invest the first 10 percent of your day in yourself, and the remaining 90 percent will take care of itself.',
			categories: ['self-investment', 'productivity'],
		},
		{
			text: 'Der Schlüssel zum Erfolg ist, sich auf Ziele zu fokussieren, nicht auf Hindernisse.',
			textEN: 'The key to success is to focus on goals, not obstacles.',
			categories: ['focus', 'success'],
		},
	],
	'sinatra-frank': [
		{
			text: 'Das Beste liegt noch vor uns.',
			textEN: 'The best is yet to come.',
			categories: ['optimism', 'future'],
		},
		{
			text: 'Ich tat es auf meine Weise.',
			textEN: 'I did it my way.',
			categories: ['individuality', 'pride'],
		},
		{
			text: 'Du bist nur einmal jung, aber du kannst für immer unreif sein.',
			textEN: 'You only live once, but if you do it right, once is enough.',
			categories: ['life', 'youth'],
		},
		{
			text: 'Alkohol mag der schlimmste Feind des Menschen sein, aber die Bibel sagt, liebe deinen Feind.',
			textEN: "Alcohol may be man's worst enemy, but the bible says love your enemy.",
			categories: ['humor', 'life'],
		},
		{
			text: 'Der beste Rache ist massiver Erfolg.',
			textEN: 'The best revenge is massive success.',
			categories: ['success', 'revenge'],
		},
	],
	'zuckerberg-mark': [
		{
			text: 'Das größte Risiko ist, kein Risiko einzugehen.',
			textEN: 'The biggest risk is not taking any risk.',
			categories: ['risk', 'courage'],
		},
		{
			text: 'Ideen kommen nicht vollständig ausgeformt heraus. Sie werden nur klarer, wenn man daran arbeitet.',
			textEN: "Ideas don't come out fully formed. They only become clear as you work on them.",
			categories: ['ideas', 'work'],
		},
		{
			text: 'Bewege dich schnell und zerbrich Dinge. Wenn du nichts zerbrichst, bewegst du dich nicht schnell genug.',
			textEN:
				'Move fast and break things. Unless you are breaking stuff, you are not moving fast enough.',
			categories: ['innovation', 'speed'],
		},
		{
			text: 'Menschen beeinflussen macht Spaß. Das ist der Grund, warum ich das tue.',
			textEN:
				'People influence people. Nothing influences people more than a recommendation from a trusted friend.',
			categories: ['influence', 'trust'],
		},
		{
			text: 'In einer Welt, die sich sehr schnell verändert, ist die einzige Strategie, die garantiert scheitert, kein Risiko einzugehen.',
			textEN:
				"In a world that's changing really quickly, the only strategy that is guaranteed to fail is not taking risks.",
			categories: ['change', 'strategy'],
		},
	],
	'bruckner-anton': [
		{
			text: 'Wer hohe Türme bauen will, muss lange beim Fundament verweilen.',
			textEN: 'Whoever wants to build high towers must spend a long time on the foundation.',
			categories: ['patience', 'foundation'],
		},
		{
			text: 'Die Musik ist die Sprache der Engel.',
			textEN: 'Music is the language of angels.',
			categories: ['music', 'spirituality'],
		},
		{
			text: 'Ich habe keine Zeit, mich zu beeilen.',
			textEN: "I don't have time to hurry.",
			categories: ['patience', 'time'],
		},
		{
			text: 'Gott hat mir die Gabe gegeben, und ich muss sie nutzen.',
			textEN: 'God has given me the gift, and I must use it.',
			categories: ['talent', 'purpose'],
		},
		{
			text: 'Die Stille zwischen den Tönen ist genauso wichtig wie die Töne selbst.',
			textEN: 'The silence between the notes is as important as the notes themselves.',
			categories: ['music', 'silence'],
		},
	],
	'mazzini-giuseppe': [
		{
			text: 'Ohne Heimat bist du nur ein Wanderer.',
			textEN: 'Without a country you are a wanderer.',
			categories: ['homeland', 'identity'],
		},
		{
			text: 'Das Geheimnis der Macht liegt im Willen.',
			textEN: 'The secret of power lies in the will.',
			categories: ['power', 'will'],
		},
		{
			text: 'Große Revolutionen sind das Werk von Prinzipien, nicht von Bajonetten.',
			textEN: 'Great revolutions are the work of principles, not of bayonets.',
			categories: ['revolution', 'principles'],
		},
		{
			text: 'Die Familie ist das Vaterland des Herzens.',
			textEN: 'The family is the homeland of the heart.',
			categories: ['family', 'love'],
		},
		{
			text: 'Pflicht ist das Wort, das das gesamte Dasein des Menschen ausdrückt.',
			textEN: 'Duty is the word that expresses the entire existence of man.',
			categories: ['duty', 'purpose'],
		},
	],
	'shedd-john-a': [
		{
			text: 'Ein Schiff im Hafen ist sicher, aber dafür werden Schiffe nicht gebaut.',
			textEN: 'A ship in harbor is safe, but that is not what ships are built for.',
			categories: ['risk', 'purpose'],
		},
		{
			text: 'Chancen sind wie Sonnenaufgänge. Wenn du zu lange wartest, verpasst du sie.',
			textEN: 'Opportunities are like sunrises. If you wait too long, you miss them.',
			categories: ['opportunity', 'action'],
		},
		{
			text: 'Der Unterschied zwischen einem Traum und einem Ziel ist ein Plan.',
			textEN: 'The difference between a dream and a goal is a plan.',
			categories: ['goals', 'planning'],
		},
		{
			text: 'Mut ist nicht die Abwesenheit von Angst, sondern die Entscheidung, dass etwas anderes wichtiger ist.',
			textEN:
				'Courage is not the absence of fear, but deciding that something else is more important.',
			categories: ['courage', 'fear'],
		},
		{
			text: 'Der Wind kann die Richtung nicht ändern, wenn man die Segel nicht setzt.',
			textEN: "The wind cannot change direction if you don't set the sails.",
			categories: ['action', 'change'],
		},
	],
	'lasorda-tommy': [
		{
			text: 'Der Unterschied zwischen dem Unmöglichen und dem Möglichen liegt in der Entschlossenheit eines Menschen.',
			textEN:
				"The difference between the impossible and the possible lies in a person's determination.",
			categories: ['determination', 'possibility'],
		},
		{
			text: 'Es gibt drei Arten von Spielern: diejenigen, die es geschehen lassen, diejenigen, die zusehen, und diejenigen, die sich fragen, was passiert ist.',
			textEN:
				'There are three types of players: those who make it happen, those who watch it happen, and those who wonder what happened.',
			categories: ['action', 'leadership'],
		},
		{
			text: 'Druck ist etwas, das man nur fühlt, wenn man nicht weiß, was man tut.',
			textEN: "Pressure is something you feel when you don't know what you're doing.",
			categories: ['confidence', 'competence'],
		},
		{
			text: 'Die besten Möglichkeiten im Leben kommen nur einmal.',
			textEN: 'The best opportunities in life come only once.',
			categories: ['opportunity', 'life'],
		},
		{
			text: 'Vertrauen ist der Grundstein des Erfolgs.',
			textEN: 'Trust is the foundation of success.',
			categories: ['trust', 'success'],
		},
	],
};

async function expandQuotes() {
	console.log('🚀 Expanding additional authors with more quotes...\n');

	// Load current quotes
	const quotesPathEN = path.join(process.cwd(), 'services/data/quotes/en.ts');
	const quotesPathDE = path.join(process.cwd(), 'services/data/quotes/de.ts');

	const quotesContentEN = await fs.readFile(quotesPathEN, 'utf-8');
	const quotesContentDE = await fs.readFile(quotesPathDE, 'utf-8');

	// Extract existing quotes
	const quotesMatchEN = quotesContentEN.match(/export const quotesEN[^=]+=\s*(\[[\s\S]*\]);/);
	const quotesMatchDE = quotesContentDE.match(/export const quotesDE[^=]+=\s*(\[[\s\S]*\]);/);

	const existingQuotesEN = eval(quotesMatchEN![1]);
	const existingQuotesDE = eval(quotesMatchDE![1]);

	// Get next ID
	let maxId = 0;
	existingQuotesEN.forEach((q: any) => {
		const idNum = parseInt(q.id.replace('q', ''));
		if (idNum > maxId) maxId = idNum;
	});

	let nextId = maxId + 1;
	const newQuotesEN: any[] = [];
	const newQuotesDE: any[] = [];

	// Generate new quotes
	for (const [authorId, quotes] of Object.entries(additionalQuotes)) {
		console.log(`📝 Adding ${quotes.length} quotes for ${authorId}`);

		quotes.forEach((quote: any) => {
			const quoteId = `q${nextId++}`;

			// English quote
			newQuotesEN.push({
				id: quoteId,
				text: quote.textEN,
				authorId: authorId,
				categories: quote.categories,
				tags: [],
				featured: false,
				language: 'en',
				isFavorite: false,
				category: quote.categories[0],
			});

			// German quote
			newQuotesDE.push({
				id: quoteId,
				text: quote.text,
				authorId: authorId,
				categories: quote.categories,
				tags: [],
				featured: false,
				language: 'de',
				isFavorite: false,
				category: quote.categories[0],
			});
		});
	}

	// Combine with existing quotes
	const allQuotesEN = [...existingQuotesEN, ...newQuotesEN];
	const allQuotesDE = [...existingQuotesDE, ...newQuotesDE];

	// Generate TypeScript files
	const enContent = `import { EnhancedQuote } from '../../contentLoader';

export const quotesEN: Omit<EnhancedQuote, 'author'>[] = ${JSON.stringify(allQuotesEN, null, 2)};
`;

	const deContent = `import { EnhancedQuote } from '../../contentLoader';

export const quotesDE: Omit<EnhancedQuote, 'author'>[] = ${JSON.stringify(allQuotesDE, null, 2)};
`;

	// Write files
	await fs.writeFile(quotesPathEN, enContent, 'utf-8');
	await fs.writeFile(quotesPathDE, deContent, 'utf-8');

	console.log(`\n✅ Added ${newQuotesEN.length} new quotes!`);
	console.log(`📊 Total quotes now: ${allQuotesEN.length} (was ${existingQuotesEN.length})`);
}

expandQuotes().catch((error) => {
	console.error('❌ Script failed:', error);
	process.exit(1);
});
