#!/usr/bin/env npx tsx

import fs from 'fs/promises';
import path from 'path';

// Additional quotes for more authors
const additionalQuotes = {
	'lincoln-abraham': [
		{
			text: 'Am Ende sind es nicht die Jahre in deinem Leben, die zählen. Es ist das Leben in deinen Jahren.',
			textEN:
				"In the end, it's not the years in your life that count. It's the life in your years.",
			categories: ['life', 'time'],
		},
		{
			text: 'Die beste Art, die Zukunft vorauszusagen, ist, sie zu erschaffen.',
			textEN: 'The best way to predict the future is to create it.',
			categories: ['future', 'action'],
		},
		{
			text: 'Ich gehe langsam, aber ich gehe nie zurück.',
			textEN: 'I walk slowly, but I never walk backward.',
			categories: ['progress', 'persistence'],
		},
		{
			text: 'Wer anderen die Freiheit verweigert, verdient sie nicht für sich selbst.',
			textEN: 'Those who deny freedom to others deserve it not for themselves.',
			categories: ['freedom', 'justice'],
		},
		{
			text: 'Die Wahrscheinlichkeit, dass wir scheitern, darf uns nicht davon abhalten, eine Sache zu unterstützen, von der wir glauben, dass sie richtig ist.',
			textEN:
				'The probability that we may fail in the struggle ought not to deter us from the support of a cause we believe to be just.',
			categories: ['courage', 'justice'],
		},
	],
	laozi: [
		{
			text: 'Eine Reise von tausend Meilen beginnt mit einem einzigen Schritt.',
			textEN: 'A journey of a thousand miles begins with a single step.',
			categories: ['journey', 'beginning'],
		},
		{
			text: 'Wer andere kennt, ist klug. Wer sich selbst kennt, ist erleuchtet.',
			textEN: 'He who knows others is wise. He who knows himself is enlightened.',
			categories: ['wisdom', 'self-knowledge'],
		},
		{
			text: 'Wenn ich loslasse, was ich bin, werde ich, was ich sein könnte.',
			textEN: 'When I let go of what I am, I become what I might be.',
			categories: ['change', 'potential'],
		},
		{
			text: 'Stille ist eine Quelle großer Stärke.',
			textEN: 'Silence is a source of great strength.',
			categories: ['silence', 'strength'],
		},
		{
			text: 'Die Natur eilt nicht, und doch wird alles vollbracht.',
			textEN: 'Nature does not hurry, yet everything is accomplished.',
			categories: ['nature', 'patience'],
		},
	],
	'covey-stephen': [
		{
			text: 'Beginne mit dem Ende im Kopf.',
			textEN: 'Begin with the end in mind.',
			categories: ['planning', 'vision'],
		},
		{
			text: 'Die Hauptsache ist, die Hauptsache die Hauptsache sein zu lassen.',
			textEN: 'The main thing is to keep the main thing the main thing.',
			categories: ['focus', 'priorities'],
		},
		{
			text: 'Zwischen Reiz und Reaktion liegt ein Raum. In diesem Raum liegt unsere Freiheit zu wählen.',
			textEN:
				'Between stimulus and response there is a space. In that space is our power to choose.',
			categories: ['choice', 'freedom'],
		},
		{
			text: 'Vertrauen ist der Klebstoff des Lebens.',
			textEN: 'Trust is the glue of life.',
			categories: ['trust', 'relationships'],
		},
		{
			text: 'Ich bin nicht ein Produkt meiner Umstände. Ich bin ein Produkt meiner Entscheidungen.',
			textEN: 'I am not a product of my circumstances. I am a product of my decisions.',
			categories: ['choice', 'responsibility'],
		},
	],
	'matisse-henri': [
		{
			text: 'Kreativität erfordert Mut.',
			textEN: 'Creativity takes courage.',
			categories: ['creativity', 'courage'],
		},
		{
			text: 'Es gibt Blumen überall für den, der sie sehen will.',
			textEN: 'There are always flowers for those who want to see them.',
			categories: ['beauty', 'perspective'],
		},
		{
			text: 'Ich träume nicht, ich male.',
			textEN: "I don't dream, I paint.",
			categories: ['art', 'action'],
		},
		{
			text: 'Ein Künstler muss nie das Gefühl haben, fertig zu sein.',
			textEN: 'An artist must never feel that he is finished.',
			categories: ['art', 'growth'],
		},
		{
			text: 'Zeichnen ist wie eine ausdrucksvolle Geste mit dem Vorteil der Beständigkeit.',
			textEN: 'Drawing is like making an expressive gesture with the advantage of permanence.',
			categories: ['art', 'expression'],
		},
	],
	'king-bb': [
		{
			text: 'Das Schöne am Lernen ist, dass es dir niemand wegnehmen kann.',
			textEN: 'The beautiful thing about learning is that nobody can take it away from you.',
			categories: ['learning', 'knowledge'],
		},
		{
			text: 'Blues ist einfach zu spielen, aber schwer zu fühlen.',
			textEN: 'Blues is easy to play, but hard to feel.',
			categories: ['music', 'emotion'],
		},
		{
			text: 'Je mehr du weißt, desto besser wird deine Musik.',
			textEN: 'The more you know, the better your music becomes.',
			categories: ['knowledge', 'music'],
		},
		{
			text: 'Ich habe nie eine Note gespielt, die ich nicht fühle.',
			textEN: "I never played a note I didn't feel.",
			categories: ['music', 'authenticity'],
		},
		{
			text: 'Ein Gitarrensolo sollte eine Geschichte erzählen.',
			textEN: 'A guitar solo should tell a story.',
			categories: ['music', 'storytelling'],
		},
	],
	'milne-aa': [
		{
			text: 'Du bist mutiger als du glaubst, stärker als du scheinst und klüger als du denkst.',
			textEN:
				'You are braver than you believe, stronger than you seem, and smarter than you think.',
			categories: ['courage', 'strength'],
		},
		{
			text: 'Ein Tag ohne einen Freund ist wie ein Topf ohne einen einzigen Tropfen Honig.',
			textEN: 'A day without a friend is like a pot without a single drop of honey.',
			categories: ['friendship', 'joy'],
		},
		{
			text: 'Wie glücklich ich bin, etwas zu haben, was den Abschied so schwer macht.',
			textEN: 'How lucky I am to have something that makes saying goodbye so hard.',
			categories: ['love', 'gratitude'],
		},
		{
			text: 'Flüsse wissen: Es gibt keine Eile. Wir werden eines Tages dort ankommen.',
			textEN: 'Rivers know this: there is no hurry. We shall get there some day.',
			categories: ['patience', 'time'],
		},
		{
			text: 'Manchmal sind die kleinsten Dinge diejenigen, die den meisten Platz in deinem Herzen einnehmen.',
			textEN: 'Sometimes the smallest things take up the most room in your heart.',
			categories: ['love', 'simplicity'],
		},
	],
	'adler-alfred': [
		{
			text: 'Es ist leichter, für ein Prinzip zu kämpfen, als ihm gerecht zu werden.',
			textEN: "It is easier to fight for one's principles than to live up to them.",
			categories: ['principles', 'integrity'],
		},
		{
			text: 'Der Mensch weiß viel mehr als er versteht.',
			textEN: 'Man knows much more than he understands.',
			categories: ['knowledge', 'understanding'],
		},
		{
			text: 'Die größte Gefahr im Leben ist, dass man zu vorsichtig wird.',
			textEN: 'The greatest danger in life is that you may become too cautious.',
			categories: ['caution', 'risk'],
		},
		{
			text: 'Mut ist nicht angeboren, sondern erworben.',
			textEN: 'Courage is not innate, but acquired.',
			categories: ['courage', 'growth'],
		},
		{
			text: 'Was wir für uns selbst tun, stirbt mit uns. Was wir für andere tun, ist und bleibt unsterblich.',
			textEN:
				'What we do for ourselves dies with us. What we do for others is and remains immortal.',
			categories: ['legacy', 'service'],
		},
	],
	'liebknecht-karl': [
		{
			text: 'Trotz alledem!',
			textEN: 'Despite everything!',
			categories: ['resilience', 'defiance'],
		},
		{
			text: 'Nicht durch Zorn, sondern durch Lachen tötet man.',
			textEN: 'One does not kill through anger, but through laughter.',
			categories: ['humor', 'power'],
		},
		{
			text: 'Die Revolution ist großartig, alles andere ist Quark.',
			textEN: 'Revolution is great, everything else is nonsense.',
			categories: ['revolution', 'change'],
		},
		{
			text: 'Studieren, propagandieren, organisieren.',
			textEN: 'Study, propagate, organize.',
			categories: ['action', 'knowledge'],
		},
		{
			text: 'Die Zukunft gehört dem Volk.',
			textEN: 'The future belongs to the people.',
			categories: ['future', 'democracy'],
		},
	],
	'deutsches-sprichwort': [
		{
			text: 'Morgenstund hat Gold im Mund.',
			textEN: 'The early bird catches the worm.',
			categories: ['diligence', 'time'],
		},
		{
			text: 'Ohne Fleiß kein Preis.',
			textEN: 'No pain, no gain.',
			categories: ['work', 'reward'],
		},
		{
			text: 'Wer rastet, der rostet.',
			textEN: 'A rolling stone gathers no moss.',
			categories: ['activity', 'growth'],
		},
		{
			text: 'Übung macht den Meister.',
			textEN: 'Practice makes perfect.',
			categories: ['practice', 'mastery'],
		},
		{
			text: 'Was Hänschen nicht lernt, lernt Hans nimmermehr.',
			textEN: "You can't teach an old dog new tricks.",
			categories: ['learning', 'youth'],
		},
	],
	'chinesisches-sprichwort': [
		{
			text: 'Wenn der Wind der Veränderung weht, bauen die einen Mauern und die anderen Windmühlen.',
			textEN: 'When the winds of change blow, some people build walls and others build windmills.',
			categories: ['change', 'adaptation'],
		},
		{
			text: 'Der beste Zeitpunkt, einen Baum zu pflanzen, war vor 20 Jahren. Der zweitbeste ist jetzt.',
			textEN: 'The best time to plant a tree was 20 years ago. The second best time is now.',
			categories: ['action', 'time'],
		},
		{
			text: 'Gib einem Hungrigen einen Fisch, und er wird einmal satt. Lehre ihn das Fischen, und er wird nie wieder hungern.',
			textEN:
				'Give a man a fish and you feed him for a day. Teach a man to fish and you feed him for a lifetime.',
			categories: ['education', 'empowerment'],
		},
		{
			text: 'Ein Lächeln ist die kürzeste Entfernung zwischen zwei Menschen.',
			textEN: 'A smile is the shortest distance between two people.',
			categories: ['kindness', 'connection'],
		},
		{
			text: 'Wer fragt, ist ein Narr für fünf Minuten. Wer nicht fragt, bleibt ein Narr für immer.',
			textEN: 'He who asks is a fool for five minutes. He who does not ask remains a fool forever.',
			categories: ['learning', 'curiosity'],
		},
	],
	'fischer-thomas': [
		{
			text: 'Das Recht ist die Mathematik der Freiheit.',
			textEN: 'Law is the mathematics of freedom.',
			categories: ['law', 'freedom'],
		},
		{
			text: 'Die Würde des Menschen ist unantastbar - sie zu achten und zu schützen ist Verpflichtung aller staatlichen Gewalt.',
			textEN:
				'Human dignity is inviolable - to respect and protect it is the duty of all state authority.',
			categories: ['dignity', 'justice'],
		},
		{
			text: 'Gerechtigkeit ist die erste Tugend sozialer Institutionen.',
			textEN: 'Justice is the first virtue of social institutions.',
			categories: ['justice', 'society'],
		},
		{
			text: 'Recht ohne Macht ist ohnmächtig, Macht ohne Recht ist tyrannisch.',
			textEN: 'Law without power is impotent, power without law is tyrannical.',
			categories: ['law', 'power'],
		},
		{
			text: 'Die Freiheit des Einzelnen endet dort, wo die Freiheit des Anderen beginnt.',
			textEN: 'The freedom of the individual ends where the freedom of another begins.',
			categories: ['freedom', 'boundaries'],
		},
	],
	'gump-forrest': [
		{
			text: 'Das Leben ist wie eine Schachtel Pralinen. Man weiß nie, was man kriegt.',
			textEN: "Life is like a box of chocolates. You never know what you're gonna get.",
			categories: ['life', 'uncertainty'],
		},
		{
			text: 'Dumm ist der, der Dummes tut.',
			textEN: 'Stupid is as stupid does.',
			categories: ['wisdom', 'action'],
		},
		{
			text: 'Ich bin vielleicht nicht sehr schlau, aber ich weiß, was Liebe ist.',
			textEN: 'I may not be a smart man, but I know what love is.',
			categories: ['love', 'wisdom'],
		},
		{
			text: 'Manchmal gibt es einfach nicht genug Steine.',
			textEN: "Sometimes there just aren't enough rocks.",
			categories: ['acceptance', 'limits'],
		},
		{
			text: 'Man muss das Beste aus dem machen, was Gott einem gegeben hat.',
			textEN: 'You have to do the best with what God gave you.',
			categories: ['acceptance', 'effort'],
		},
	],
};

async function expandQuotes() {
	console.log('🚀 Continuing expansion of quotes for more authors...\n');

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
