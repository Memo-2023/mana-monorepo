#!/usr/bin/env npx tsx

import fs from 'fs/promises';
import path from 'path';

// More quotes for already expanded authors to build a rich collection
const additionalQuotes = {
	goethe: [
		{
			text: 'Wer sich den Gesetzen nicht fügen will, muss die Gegend verlassen, wo sie gelten.',
			textEN: 'Whoever will not obey the law must leave the area where it applies.',
			categories: ['law', 'society'],
		},
		{
			text: 'Mit dem Wissen wächst der Zweifel.',
			textEN: 'Doubt grows with knowledge.',
			categories: ['knowledge', 'doubt'],
		},
		{
			text: 'Eigentlich weiß man nur, wenn man wenig weiß. Mit dem Wissen wächst der Zweifel.',
			textEN: 'We know accurately only when we know little; doubt grows with knowledge.',
			categories: ['knowledge', 'wisdom'],
		},
		{
			text: 'Einer neuen Wahrheit ist nichts schädlicher als ein alter Irrtum.',
			textEN: 'Nothing is more damaging to a new truth than an old error.',
			categories: ['truth', 'error'],
		},
		{
			text: 'Der Worte sind genug gewechselt, lasst mich auch endlich Taten sehn!',
			textEN: 'Enough words have been exchanged; now at last let me see some deeds!',
			categories: ['action', 'words'],
		},
	],
	'einstein-albert': [
		{
			text: 'Die besten Dinge im Leben sind nicht die, die man für Geld bekommt.',
			textEN: 'The best things in life are not those one gets for money.',
			categories: ['life', 'values'],
		},
		{
			text: 'Wenn die Menschen nur über das sprächen, was sie begreifen, dann würde es sehr still auf der Welt sein.',
			textEN:
				'If people only talked about what they understood, the world would be a very quiet place.',
			categories: ['wisdom', 'humor'],
		},
		{
			text: 'Die Welt wird nicht bedroht von den Menschen, die böse sind, sondern von denen, die das Böse zulassen.',
			textEN: 'The world is not threatened by those who are evil, but by those who allow evil.',
			categories: ['evil', 'responsibility'],
		},
		{
			text: 'Es ist schwieriger, eine vorgefasste Meinung zu zertrümmern als ein Atom.',
			textEN: 'It is harder to crack a prejudice than an atom.',
			categories: ['prejudice', 'change'],
		},
		{
			text: 'Zeit ist das, was man an der Uhr abliest.',
			textEN: 'Time is what you read on a clock.',
			categories: ['time', 'philosophy'],
		},
	],
	'nietzsche-friedrich': [
		{
			text: 'Alle wahrhaft großen Gedanken werden beim Gehen empfangen.',
			textEN: 'All truly great thoughts are conceived while walking.',
			categories: ['creativity', 'thinking'],
		},
		{
			text: 'Der Mensch ist ein Seil, geknüpft zwischen Tier und Übermensch - ein Seil über einem Abgrunde.',
			textEN: 'Man is a rope stretched between animal and superman - a rope over an abyss.',
			categories: ['humanity', 'philosophy'],
		},
		{
			text: 'Von der Zukunft hängt ab, wer die Vergangenheit beherrscht.',
			textEN: 'Whoever controls the future controls the past.',
			categories: ['future', 'past'],
		},
		{
			text: 'Nicht durch Zorn, sondern durch Lachen tötet man.',
			textEN: 'One does not kill by anger but by laughter.',
			categories: ['humor', 'philosophy'],
		},
		{
			text: 'Der Irrsinn ist bei Einzelnen etwas Seltenes - aber bei Gruppen, Parteien, Völkern die Regel.',
			textEN: 'Madness is rare in individuals - but in groups, parties, nations, it is the rule.',
			categories: ['society', 'madness'],
		},
	],
	buddha: [
		{
			text: 'Jeder Morgen ist eine neue Chance, das zu tun, was du dir vorgenommen hast.',
			textEN: 'Every morning we are born again. What we do today matters most.',
			categories: ['renewal', 'action'],
		},
		{
			text: 'Der Weg liegt nicht im Himmel. Der Weg liegt im Herzen.',
			textEN: 'The way is not in the sky. The way is in the heart.',
			categories: ['heart', 'path'],
		},
		{
			text: 'Tausende von Kerzen kann man am Licht einer Kerze anzünden, ohne dass ihr Licht schwächer wird.',
			textEN: 'Thousands of candles can be lit from a single candle without diminishing its light.',
			categories: ['sharing', 'light'],
		},
		{
			text: 'Verweile nicht in der Vergangenheit, träume nicht von der Zukunft. Konzentriere dich auf den gegenwärtigen Moment.',
			textEN:
				'Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.',
			categories: ['present', 'mindfulness'],
		},
		{
			text: 'In der Wut verliert der Mensch seine Intelligenz.',
			textEN: 'In anger, a person loses their intelligence.',
			categories: ['anger', 'wisdom'],
		},
	],
	'marie-curie': [
		{
			text: 'Das Leben ist für keinen von uns einfach. Aber was macht das? Wir müssen Ausdauer und vor allem Vertrauen in uns selbst haben.',
			textEN:
				'Life is not easy for any of us. But what of that? We must have perseverance and confidence in ourselves.',
			categories: ['perseverance', 'confidence'],
		},
		{
			text: 'Ich habe gelernt, dass der Weg des Fortschritts weder kurz noch unbeschwerlich ist.',
			textEN: 'I have learned that the path of progress is neither short nor easy.',
			categories: ['progress', 'perseverance'],
		},
		{
			text: 'Man braucht nichts im Leben zu fürchten, man muss nur alles verstehen.',
			textEN: 'Nothing in life is to be feared, everything is to be understood.',
			categories: ['fear', 'understanding'],
		},
		{
			text: 'Sei weniger neugierig auf Menschen und mehr neugierig auf Ideen.',
			textEN: 'Be less curious about people and more curious about ideas.',
			categories: ['curiosity', 'ideas'],
		},
	],
	'oscar-wilde': [
		{
			text: 'Das Leben ist zu wichtig, um es ernst zu nehmen.',
			textEN: 'Life is too important to be taken seriously.',
			categories: ['life', 'humor'],
		},
		{
			text: 'Die Tragödie des Alters ist nicht, dass man alt ist, sondern dass man jung ist.',
			textEN: 'The tragedy of old age is not that one is old, but that one is young.',
			categories: ['age', 'youth'],
		},
		{
			text: 'Jeder kann Geschichte machen, aber nur ein großer Mann kann Geschichte schreiben.',
			textEN: 'Anyone can make history, but only a great man can write it.',
			categories: ['history', 'greatness'],
		},
		{
			text: 'Es ist absurd, die Menschen in gute und schlechte einzuteilen. Die Menschen sind entweder charmant oder langweilig.',
			textEN:
				'It is absurd to divide people into good and bad. People are either charming or tedious.',
			categories: ['people', 'humor'],
		},
		{
			text: 'Die meisten Menschen sind andere Leute. Ihre Gedanken sind die Meinungen anderer.',
			textEN: "Most people are other people. Their thoughts are someone else's opinions.",
			categories: ['individuality', 'society'],
		},
	],
	'mark-twain': [
		{
			text: 'Das Geheimnis des Erfolgs ist anzufangen.',
			textEN: 'The secret of getting ahead is getting started.',
			categories: ['success', 'action'],
		},
		{
			text: 'Freundlichkeit ist die Sprache, die Taube hören und Blinde lesen können.',
			textEN: 'Kindness is the language which the deaf can hear and the blind can see.',
			categories: ['kindness', 'communication'],
		},
		{
			text: 'Name ist Schall und Rauch, aber Schall und Rauch können sehr profitabel sein.',
			textEN: 'A lie can travel halfway around the world while the truth is putting on its shoes.',
			categories: ['truth', 'lies'],
		},
		{
			text: 'Es ist besser, Leuten zu gefallen, die einem nicht gefallen, als Leuten nicht zu gefallen, die einem gefallen.',
			textEN:
				"It's better to keep your mouth shut and appear stupid than open it and remove all doubt.",
			categories: ['wisdom', 'silence'],
		},
		{
			text: 'Wenn wir bedenken, dass wir alle verrückt sind, ist das Leben erklärt.',
			textEN: 'When we remember we are all mad, the mysteries disappear and life stands explained.',
			categories: ['life', 'madness'],
		},
	],
	konfuzius: [
		{
			text: 'Wer das Ziel kennt, kann entscheiden. Wer entscheidet, findet Ruhe.',
			textEN: 'He who knows the goal can decide. He who decides finds peace.',
			categories: ['decision', 'peace'],
		},
		{
			text: 'Die Erfahrung ist wie eine Laterne im Rücken; sie beleuchtet stets nur das Stück Weg, das wir bereits hinter uns haben.',
			textEN:
				'Experience is like a lantern on our back; it only illuminates the path we have already traveled.',
			categories: ['experience', 'wisdom'],
		},
		{
			text: 'Ist man in kleinen Dingen nicht geduldig, bringt man die großen Vorhaben zum Scheitern.',
			textEN: 'If you are not patient in small things, you will bring great plans to failure.',
			categories: ['patience', 'success'],
		},
		{
			text: 'Wer ständig glücklich sein möchte, muss sich oft verändern.',
			textEN: 'If you want constant happiness, you must change often.',
			categories: ['happiness', 'change'],
		},
		{
			text: 'Der sittliche Mensch liebt seine Seele, der gewöhnliche sein Eigentum.',
			textEN: 'The moral man loves his soul, the ordinary man his property.',
			categories: ['morality', 'values'],
		},
	],
	sokrates: [
		{
			text: 'Bedenke stets, dass alles vergänglich ist; dann wirst du im Glück nicht zu fröhlich und im Unglück nicht zu traurig sein.',
			textEN:
				'Remember that all things are transitory; then you will not be too joyful in happiness nor too sad in misfortune.',
			categories: ['impermanence', 'balance'],
		},
		{
			text: 'Wer glaubt, etwas zu sein, hat aufgehört, etwas zu werden.',
			textEN: 'He who thinks he knows, has ceased to learn.',
			categories: ['learning', 'humility'],
		},
		{
			text: 'Die Jugend von heute liebt den Luxus, hat schlechte Manieren und verachtet die Autorität.',
			textEN: 'The youth of today love luxury, have bad manners, and despise authority.',
			categories: ['youth', 'society'],
		},
		{
			text: 'Das Geheimnis der Veränderung besteht darin, deine ganze Energie darauf zu fokussieren, Neues aufzubauen, statt Altes zu bekämpfen.',
			textEN:
				'The secret of change is to focus all your energy not on fighting the old, but on building the new.',
			categories: ['change', 'focus'],
		},
	],
	platon: [
		{
			text: 'Der Anfang ist der wichtigste Teil der Arbeit.',
			textEN: 'The beginning is the most important part of the work.',
			categories: ['beginning', 'work'],
		},
		{
			text: 'Wissen, welches man nicht täglich vermehrt, nimmt ab.',
			textEN: 'Knowledge which is not increased daily, decreases.',
			categories: ['knowledge', 'learning'],
		},
		{
			text: 'Die schlimmste Art der Ungerechtigkeit ist die vorgespielte Gerechtigkeit.',
			textEN: 'The worst form of injustice is pretended justice.',
			categories: ['justice', 'truth'],
		},
		{
			text: 'Niemand ist mehr Sklave als der, der sich für frei hält, ohne es zu sein.',
			textEN: 'No one is more enslaved than those who falsely believe they are free.',
			categories: ['freedom', 'illusion'],
		},
	],
	aristoteles: [
		{
			text: 'Freundschaft ist eine Seele in zwei Körpern.',
			textEN: 'Friendship is a single soul dwelling in two bodies.',
			categories: ['friendship', 'relationships'],
		},
		{
			text: 'Die Hoffnung ist ein Wachtraum.',
			textEN: 'Hope is a waking dream.',
			categories: ['hope', 'dreams'],
		},
		{
			text: 'Wer Sicherheit der Freiheit vorzieht, ist zu Recht ein Sklave.',
			textEN: 'He who prefers security to freedom deserves to be a slave.',
			categories: ['freedom', 'security'],
		},
		{
			text: 'Die Wurzeln der Bildung sind bitter, aber die Frucht ist süß.',
			textEN: 'The roots of education are bitter, but the fruit is sweet.',
			categories: ['education', 'learning'],
		},
	],
};

async function expandQuotes() {
	console.log('🚀 Expanding existing popular authors with more quotes...\n');

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
		console.log(`📝 Adding ${quotes.length} more quotes for ${authorId}`);

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
