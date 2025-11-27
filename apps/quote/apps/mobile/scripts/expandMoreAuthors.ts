#!/usr/bin/env npx tsx

import fs from 'fs/promises';
import path from 'path';

// Additional quotes for more authors with few quotes
const additionalQuotes = {
  'cicero-marcus-tullius': [
    {
      text: "Schweigen ist eine der großen Künste der Konversation.",
      textEN: "Silence is one of the great arts of conversation.",
      categories: ['silence', 'communication']
    },
    {
      text: "Ein Zimmer ohne Bücher ist wie ein Körper ohne Seele.",
      textEN: "A room without books is like a body without a soul.",
      categories: ['books', 'soul']
    },
    {
      text: "Der größte Ansporn im Leben eines Menschen ist der Wunsch, Anerkennung zu finden.",
      textEN: "The greatest incentive in a person's life is the desire to find recognition.",
      categories: ['recognition', 'motivation']
    },
    {
      text: "Die Menschen verstehen nicht, welch große Einnahmequelle in der Sparsamkeit liegt.",
      textEN: "People do not understand what a great source of income frugality is.",
      categories: ['frugality', 'wisdom']
    },
    {
      text: "Nichts ist so sicher gebunden wie die Kette der Gewohnheit.",
      textEN: "Nothing is so firmly bound as the chain of habit.",
      categories: ['habit', 'behavior']
    }
  ],
  'angelou-maya': [
    {
      text: "Ich habe gelernt, dass Menschen vergessen werden, was du gesagt hast, aber niemals, wie du sie fühlen lassen hast.",
      textEN: "I've learned that people will forget what you said, but people will never forget how you made them feel.",
      categories: ['empathy', 'relationships']
    },
    {
      text: "Wenn dir etwas nicht gefällt, ändere es. Wenn du es nicht ändern kannst, ändere deine Einstellung.",
      textEN: "If you don't like something, change it. If you can't change it, change your attitude.",
      categories: ['change', 'attitude']
    },
    {
      text: "Es gibt keine größere Qual, als eine unerzählte Geschichte in sich zu tragen.",
      textEN: "There is no greater agony than bearing an untold story inside you.",
      categories: ['storytelling', 'expression']
    },
    {
      text: "Erfolg ist, sich selbst zu mögen, zu mögen, was man tut, und zu mögen, wie man es tut.",
      textEN: "Success is liking yourself, liking what you do, and liking how you do it.",
      categories: ['success', 'self-love']
    },
    {
      text: "Wir mögen verschiedene Religionen, Sprachen und Hautfarben haben, aber wir gehören alle zu einer menschlichen Rasse.",
      textEN: "We may have different religions, languages, and skin colors, but we all belong to one human race.",
      categories: ['unity', 'humanity']
    }
  ],
  'kaestner-erich': [
    {
      text: "Es gibt nichts Gutes, außer man tut es.",
      textEN: "There is nothing good unless you do it.",
      categories: ['action', 'goodness']
    },
    {
      text: "Auch aus Steinen, die dir in den Weg gelegt werden, kannst du etwas Schönes bauen.",
      textEN: "Even from stones placed in your path, you can build something beautiful.",
      categories: ['resilience', 'creativity']
    },
    {
      text: "Die meisten Menschen legen ihre Kindheit ab wie einen alten Hut.",
      textEN: "Most people put away their childhood like an old hat.",
      categories: ['childhood', 'growing']
    },
    {
      text: "Wunder stehen nicht im Gegensatz zur Natur, sondern nur im Gegensatz zu dem, was wir über die Natur wissen.",
      textEN: "Miracles are not contrary to nature, but only contrary to what we know about nature.",
      categories: ['miracles', 'nature']
    },
    {
      text: "Je üppiger die Pläne blühen, umso verzwickter wird die Tat.",
      textEN: "The more lavishly plans bloom, the more complicated the deed becomes.",
      categories: ['planning', 'action']
    }
  ],
  'william-james': [
    {
      text: "Handele so, als ob das, was du tust, einen Unterschied macht. Das tut es.",
      textEN: "Act as if what you do makes a difference. It does.",
      categories: ['action', 'impact']
    },
    {
      text: "Die größte Entdeckung meiner Generation ist, dass Menschen ihr Leben ändern können, indem sie ihre Einstellung ändern.",
      textEN: "The greatest discovery of my generation is that human beings can alter their lives by altering their attitudes.",
      categories: ['attitude', 'change']
    },
    {
      text: "Wir sind wie Inseln im Meer, getrennt an der Oberfläche, aber verbunden in der Tiefe.",
      textEN: "We are like islands in the sea, separate on the surface but connected in the deep.",
      categories: ['connection', 'humanity']
    },
    {
      text: "Der tiefste Wunsch der menschlichen Natur ist der Wunsch, geschätzt zu werden.",
      textEN: "The deepest craving of human nature is the need to be appreciated.",
      categories: ['appreciation', 'human nature']
    },
    {
      text: "Glaube schafft die tatsächliche Tatsache.",
      textEN: "Belief creates the actual fact.",
      categories: ['belief', 'reality']
    }
  ],
  'nin-anais': [
    {
      text: "Wir sehen die Dinge nicht, wie sie sind. Wir sehen sie, wie wir sind.",
      textEN: "We don't see things as they are, we see them as we are.",
      categories: ['perception', 'self']
    },
    {
      text: "Das Leben schrumpft oder dehnt sich aus im Verhältnis zu unserem Mut.",
      textEN: "Life shrinks or expands in proportion to one's courage.",
      categories: ['courage', 'life']
    },
    {
      text: "Jeder Moment ist eine goldene für den, der die Vision hat, ihn als solchen zu erkennen.",
      textEN: "Every moment is a golden one for him who has the vision to recognize it as such.",
      categories: ['moment', 'awareness']
    },
    {
      text: "Der Traum war immer der Weg zur Freiheit.",
      textEN: "Dreams are always the way to freedom.",
      categories: ['dreams', 'freedom']
    },
    {
      text: "Wir schreiben, um das Leben zweimal zu kosten, im Moment und im Nachhinein.",
      textEN: "We write to taste life twice, in the moment and in retrospect.",
      categories: ['writing', 'life']
    }
  ],
  'rand-ayn': [
    {
      text: "Die Frage ist nicht, wer mich lässt; es ist, wer mich aufhalten wird.",
      textEN: "The question isn't who is going to let me; it's who is going to stop me.",
      categories: ['determination', 'strength']
    },
    {
      text: "Man kann die Realität ignorieren, aber man kann nicht die Konsequenzen ignorieren, die Realität zu ignorieren.",
      textEN: "You can ignore reality, but you cannot ignore the consequences of ignoring reality.",
      categories: ['reality', 'consequences']
    },
    {
      text: "Das kleinste Minderheit auf der Erde ist das Individuum.",
      textEN: "The smallest minority on earth is the individual.",
      categories: ['individuality', 'rights']
    },
    {
      text: "Kreative Menschen müssen irgendwo anfangen.",
      textEN: "Creative people have to start somewhere.",
      categories: ['creativity', 'beginning']
    },
    {
      text: "Lernen zu denken ist lernen zu leben.",
      textEN: "To learn to think is to learn to live.",
      categories: ['thinking', 'living']
    }
  ],
  'gide-andre': [
    {
      text: "Man entdeckt keine neuen Erdteile, ohne den Mut zu haben, alte Küsten aus den Augen zu verlieren.",
      textEN: "One doesn't discover new lands without consenting to lose sight of the shore.",
      categories: ['discovery', 'courage']
    },
    {
      text: "Es ist besser, gehässt zu werden für das, was man ist, als geliebt zu werden für das, was man nicht ist.",
      textEN: "It is better to be hated for what you are than to be loved for what you are not.",
      categories: ['authenticity', 'truth']
    },
    {
      text: "Vertraue denen, die die Wahrheit suchen, und misstraue denen, die sie gefunden haben.",
      textEN: "Trust those who seek the truth, distrust those who have found it.",
      categories: ['truth', 'wisdom']
    },
    {
      text: "Kunst ist eine Zusammenarbeit zwischen Gott und dem Künstler, und je weniger der Künstler tut, desto besser.",
      textEN: "Art is a collaboration between God and the artist, and the less the artist does the better.",
      categories: ['art', 'creation']
    },
    {
      text: "Das Geheimnis des Glücks liegt nicht im Besitz, sondern im Geben.",
      textEN: "The secret of happiness lies not in possession but in giving.",
      categories: ['happiness', 'generosity']
    }
  ],
  'kabat-zinn-jon': [
    {
      text: "Du kannst die Wellen nicht stoppen, aber du kannst lernen zu surfen.",
      textEN: "You can't stop the waves, but you can learn to surf.",
      categories: ['acceptance', 'adaptation']
    },
    {
      text: "Wohin du auch gehst, da bist du.",
      textEN: "Wherever you go, there you are.",
      categories: ['presence', 'mindfulness']
    },
    {
      text: "Der beste Weg, für die Zukunft zu sorgen, ist, sich um den gegenwärtigen Moment zu kümmern.",
      textEN: "The best way to take care of the future is to take care of the present moment.",
      categories: ['present', 'future']
    },
    {
      text: "Achtsamkeit ist das Bewusstsein, das entsteht, wenn man absichtlich und urteilsfrei auf den gegenwärtigen Moment achtet.",
      textEN: "Mindfulness is awareness that arises through paying attention, on purpose, in the present moment, non-judgmentally.",
      categories: ['mindfulness', 'awareness']
    },
    {
      text: "In der Stille liegt die Kraft.",
      textEN: "In stillness lies strength.",
      categories: ['stillness', 'strength']
    }
  ],
  'ruskin-john': [
    {
      text: "Qualität ist niemals ein Zufall; sie ist immer das Ergebnis intelligenter Anstrengung.",
      textEN: "Quality is never an accident; it is always the result of intelligent effort.",
      categories: ['quality', 'effort']
    },
    {
      text: "Die höchste Belohnung für die Mühe eines Menschen ist nicht das, was er dafür bekommt, sondern das, was er dadurch wird.",
      textEN: "The highest reward for a person's toil is not what they get for it, but what they become by it.",
      categories: ['work', 'growth']
    },
    {
      text: "Sonnenschein ist köstlich, Regen erfrischend, Wind fordert heraus, Schnee ist berauschend; es gibt wirklich kein schlechtes Wetter, nur verschiedene Arten von gutem Wetter.",
      textEN: "Sunshine is delicious, rain is refreshing, wind braces us up, snow is exhilarating; there is really no such thing as bad weather, only different kinds of good weather.",
      categories: ['weather', 'perspective']
    },
    {
      text: "Große Nationen schreiben ihre Autobiographien in drei Manuskripten: das Buch ihrer Taten, das Buch ihrer Worte und das Buch ihrer Kunst.",
      textEN: "Great nations write their autobiographies in three manuscripts: the book of their deeds, the book of their words, and the book of their art.",
      categories: ['nations', 'legacy']
    },
    {
      text: "Es gibt keine Reichtümer über einen gesunden Körper und einen fröhlichen Geist.",
      textEN: "There is no wealth but life.",
      categories: ['health', 'happiness']
    }
  ],
  'machado-antonio': [
    {
      text: "Wanderer, es gibt keinen Weg, der Weg entsteht im Gehen.",
      textEN: "Wanderer, there is no road, the road is made by walking.",
      categories: ['journey', 'path']
    },
    {
      text: "Heute ist immer noch.",
      textEN: "Today is always still.",
      categories: ['present', 'time']
    },
    {
      text: "In meiner Einsamkeit habe ich viele Dinge gesehen, die nicht wahr waren.",
      textEN: "In my solitude I have seen things very clearly that were not true.",
      categories: ['solitude', 'perception']
    },
    {
      text: "Die Augen, weil sie sehen, glauben sie; das Herz, weil es liebt, glaubt es.",
      textEN: "The eyes, because they see, they believe; the heart, because it loves, it believes.",
      categories: ['perception', 'love']
    },
    {
      text: "Zwischen dem Leben und mir gibt es eine Glasscheibe. Wie gefroren, wenn ich sie auch mit der Hitze meines Atems erwärme.",
      textEN: "Between living and dreaming there is a third thing. Guess it.",
      categories: ['life', 'mystery']
    }
  ],
  'thoreau-henry-david': [
    {
      text: "Gehe vertrauensvoll in die Richtung deiner Träume! Führe das Leben, das du dir vorgestellt hast.",
      textEN: "Go confidently in the direction of your dreams! Live the life you've imagined.",
      categories: ['dreams', 'confidence']
    },
    {
      text: "Die Dinge ändern sich nicht; wir ändern uns.",
      textEN: "Things do not change; we change.",
      categories: ['change', 'self']
    },
    {
      text: "Was vor uns liegt und was hinter uns liegt, ist nichts im Vergleich zu dem, was in uns liegt.",
      textEN: "What lies before us and what lies behind us are small matters compared to what lies within us.",
      categories: ['inner strength', 'self']
    },
    {
      text: "Erfolg kommt gewöhnlich zu denen, die zu beschäftigt sind, um danach zu suchen.",
      textEN: "Success usually comes to those who are too busy to be looking for it.",
      categories: ['success', 'work']
    },
    {
      text: "Es ist nie zu spät, das zu werden, was man hätte sein können.",
      textEN: "It's never too late to become what you might have been.",
      categories: ['potential', 'time']
    }
  ],
  'voltaire': [
    {
      text: "Zweifel ist nicht angenehm, aber Gewissheit ist absurd.",
      textEN: "Doubt is not pleasant, but certainty is absurd.",
      categories: ['doubt', 'certainty']
    },
    {
      text: "Der gesunde Menschenverstand ist nicht so gewöhnlich.",
      textEN: "Common sense is not so common.",
      categories: ['wisdom', 'society']
    },
    {
      text: "Jeder Mensch ist schuldig an all dem Guten, das er nicht getan hat.",
      textEN: "Every man is guilty of all the good he did not do.",
      categories: ['responsibility', 'morality']
    },
    {
      text: "Arbeit hält drei große Übel fern: Langeweile, Laster und Not.",
      textEN: "Work keeps away three great evils: boredom, vice, and need.",
      categories: ['work', 'purpose']
    },
    {
      text: "Das Vollkommene ist der Feind des Guten.",
      textEN: "The perfect is the enemy of the good.",
      categories: ['perfection', 'progress']
    }
  ]
};

async function expandQuotes() {
  console.log('🚀 Expanding more authors with additional quotes...\n');

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
        category: quote.categories[0]
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
        category: quote.categories[0]
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

expandQuotes().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});