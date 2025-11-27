#!/usr/bin/env npx tsx

import fs from 'fs/promises';
import path from 'path';

// Additional famous quotes for authors with few quotes
const additionalQuotes = {
  'einstein-albert': [
    {
      text: "Zwei Dinge sind unendlich: das Universum und die menschliche Dummheit; aber bei dem Universum bin ich mir noch nicht ganz sicher.",
      textEN: "Two things are infinite: the universe and human stupidity; and I'm not sure about the universe.",
      categories: ['humor', 'wisdom']
    },
    {
      text: "Leben ist wie Radfahren. Um die Balance zu halten, musst du in Bewegung bleiben.",
      textEN: "Life is like riding a bicycle. To keep your balance, you must keep moving.",
      categories: ['life', 'wisdom']
    },
    {
      text: "Logik bringt dich von A nach B. Deine Phantasie bringt dich überall hin.",
      textEN: "Logic will get you from A to B. Imagination will take you everywhere.",
      categories: ['creativity', 'wisdom']
    },
    {
      text: "Lernen ist Erfahrung. Alles andere ist einfach nur Information.",
      textEN: "Learning is experience. Everything else is just information.",
      categories: ['learning', 'education']
    },
    {
      text: "Es gibt keine großen Entdeckungen und Fortschritte, solange es noch ein unglückliches Kind auf Erden gibt.",
      textEN: "There are no great discoveries and advances, as long as there is an unhappy child on earth.",
      categories: ['humanity', 'compassion']
    }
  ],
  'descartes-rene': [
    {
      text: "Ich denke, also bin ich.",
      textEN: "I think, therefore I am.",
      categories: ['philosophy', 'existence']
    },
    {
      text: "Der gesunde Menschenverstand ist die bestverteilte Sache der Welt.",
      textEN: "Common sense is the most widely shared thing in the world.",
      categories: ['wisdom', 'humanity']
    },
    {
      text: "Zweifel ist der Weisheit Anfang.",
      textEN: "Doubt is the origin of wisdom.",
      categories: ['wisdom', 'philosophy']
    },
    {
      text: "Um die Wahrheit zu erforschen, ist es nötig, einmal im Leben an allen Dingen zu zweifeln.",
      textEN: "To investigate truth it is necessary to doubt all things once in your life.",
      categories: ['philosophy', 'truth']
    }
  ],
  'franklin-benjamin': [
    {
      text: "In dieser Welt gibt es nichts Sicheres außer dem Tod und den Steuern.",
      textEN: "In this world nothing can be said to be certain, except death and taxes.",
      categories: ['humor', 'life']
    },
    {
      text: "Früh zu Bett und früh aufstehen macht einen Mann gesund, wohlhabend und weise.",
      textEN: "Early to bed and early to rise makes a man healthy, wealthy and wise.",
      categories: ['wisdom', 'success']
    },
    {
      text: "Sage mir und ich vergesse. Lehre mich und ich erinnere. Beziehe mich ein und ich lerne.",
      textEN: "Tell me and I forget. Teach me and I remember. Involve me and I learn.",
      categories: ['learning', 'education']
    },
    {
      text: "Wer die Freiheit aufgibt, um Sicherheit zu gewinnen, wird am Ende beides verlieren.",
      textEN: "Those who would give up essential liberty to purchase a little temporary safety deserve neither liberty nor safety.",
      categories: ['freedom', 'politics']
    },
    {
      text: "Ein Penny gespart ist ein Penny verdient.",
      textEN: "A penny saved is a penny earned.",
      categories: ['wisdom', 'money']
    }
  ],
  'newton-isaac': [
    {
      text: "Wenn ich weiter gesehen habe, so deshalb, weil ich auf den Schultern von Riesen stehe.",
      textEN: "If I have seen further it is by standing on the shoulders of giants.",
      categories: ['humility', 'science']
    },
    {
      text: "Was wir wissen, ist ein Tropfen; was wir nicht wissen, ein Ozean.",
      textEN: "What we know is a drop, what we don't know is an ocean.",
      categories: ['knowledge', 'humility']
    },
    {
      text: "Die Wahrheit liegt immer in der Einfachheit, niemals in der Vielschichtigkeit und Verwirrung.",
      textEN: "Truth is ever to be found in simplicity, and not in the multiplicity and confusion of things.",
      categories: ['truth', 'wisdom']
    },
    {
      text: "Takt ist die Kunst, einen Punkt zu machen, ohne sich einen Feind zu machen.",
      textEN: "Tact is the art of making a point without making an enemy.",
      categories: ['wisdom', 'relationships']
    }
  ],
  'rousseau-jean-jacques': [
    {
      text: "Der Mensch ist frei geboren, und überall liegt er in Ketten.",
      textEN: "Man is born free, and everywhere he is in chains.",
      categories: ['freedom', 'society']
    },
    {
      text: "Die Natur macht keine Sprünge.",
      textEN: "Nature never deceives us; it is we who deceive ourselves.",
      categories: ['nature', 'truth']
    },
    {
      text: "Die Geduld ist bitter, aber ihre Frucht ist süß.",
      textEN: "Patience is bitter, but its fruit is sweet.",
      categories: ['patience', 'perseverance']
    },
    {
      text: "Menschen, seid menschlich, das ist eure erste Pflicht.",
      textEN: "People, be human, that is your first duty.",
      categories: ['humanity', 'morality']
    }
  ],
  'ford-henry': [
    {
      text: "Ob du denkst, du kannst es, oder du kannst es nicht: Du wirst recht behalten.",
      textEN: "Whether you think you can or you think you can't, you're right.",
      categories: ['mindset', 'success']
    },
    {
      text: "Misserfolg ist nur eine Gelegenheit, mit neuen Ansichten noch einmal anzufangen.",
      textEN: "Failure is simply the opportunity to begin again, this time more intelligently.",
      categories: ['failure', 'perseverance']
    },
    {
      text: "Zusammenkommen ist ein Beginn, Zusammenbleiben ist ein Fortschritt, Zusammenarbeiten ist ein Erfolg.",
      textEN: "Coming together is a beginning, staying together is progress, and working together is success.",
      categories: ['teamwork', 'success']
    },
    {
      text: "Qualität bedeutet, es richtig zu machen, wenn niemand zuschaut.",
      textEN: "Quality means doing it right when no one is looking.",
      categories: ['integrity', 'excellence']
    }
  ],
  'nietzsche-friedrich': [
    {
      text: "Was uns nicht umbringt, macht uns stärker.",
      textEN: "What doesn't kill us makes us stronger.",
      categories: ['strength', 'resilience']
    },
    {
      text: "Ohne Musik wäre das Leben ein Irrtum.",
      textEN: "Without music, life would be a mistake.",
      categories: ['art', 'life']
    },
    {
      text: "Man muss noch Chaos in sich haben, um einen tanzenden Stern gebären zu können.",
      textEN: "One must still have chaos in oneself to be able to give birth to a dancing star.",
      categories: ['creativity', 'potential']
    },
    {
      text: "Wer ein Warum zum Leben hat, erträgt fast jedes Wie.",
      textEN: "He who has a why to live can bear almost any how.",
      categories: ['purpose', 'resilience']
    },
    {
      text: "Es gibt keine Tatsachen, nur Interpretationen.",
      textEN: "There are no facts, only interpretations.",
      categories: ['philosophy', 'truth']
    }
  ],
  'wittgenstein-ludwig': [
    {
      text: "Die Grenzen meiner Sprache bedeuten die Grenzen meiner Welt.",
      textEN: "The limits of my language mean the limits of my world.",
      categories: ['language', 'philosophy']
    },
    {
      text: "Wovon man nicht sprechen kann, darüber muss man schweigen.",
      textEN: "Whereof one cannot speak, thereof one must be silent.",
      categories: ['philosophy', 'wisdom']
    },
    {
      text: "Die Philosophie ist ein Kampf gegen die Verhexung unseres Verstandes durch die Mittel unserer Sprache.",
      textEN: "Philosophy is a battle against the bewitchment of our intelligence by means of language.",
      categories: ['philosophy', 'language']
    },
    {
      text: "Das Rätsel gibt es nicht.",
      textEN: "There is no riddle.",
      categories: ['philosophy', 'truth']
    }
  ],
  'camus-albert': [
    {
      text: "Der Kampf gegen Gipfel vermag ein Menschenherz auszufüllen.",
      textEN: "The struggle itself toward the heights is enough to fill a man's heart.",
      categories: ['perseverance', 'purpose']
    },
    {
      text: "Mitten im Winter habe ich erfahren, dass es in mir einen unbesiegbaren Sommer gibt.",
      textEN: "In the depth of winter, I finally learned that there was in me an invincible summer.",
      categories: ['resilience', 'hope']
    },
    {
      text: "Das Absurde entsteht aus der Gegenüberstellung des menschlichen Bedürfnisses und der vernunftlosen Stille der Welt.",
      textEN: "The absurd is born out of the confrontation between the human need and the unreasonable silence of the world.",
      categories: ['philosophy', 'existence']
    },
    {
      text: "Man muss sich Sisyphos als einen glücklichen Menschen vorstellen.",
      textEN: "One must imagine Sisyphus happy.",
      categories: ['philosophy', 'happiness']
    }
  ],
  'brecht-bertolt': [
    {
      text: "Wer kämpft, kann verlieren. Wer nicht kämpft, hat schon verloren.",
      textEN: "He who fights can lose. He who doesn't fight has already lost.",
      categories: ['courage', 'action']
    },
    {
      text: "Der Mensch ist erst wirklich tot, wenn niemand mehr an ihn denkt.",
      textEN: "A person is really dead only when no one thinks of them anymore.",
      categories: ['memory', 'mortality']
    },
    {
      text: "Erst kommt das Fressen, dann kommt die Moral.",
      textEN: "First comes food, then morality.",
      categories: ['society', 'reality']
    },
    {
      text: "Die Wahrheit ist das Kind der Zeit.",
      textEN: "Truth is the child of time.",
      categories: ['truth', 'wisdom']
    }
  ]
};

async function expandQuotes() {
  console.log('🚀 Expanding quotes for more authors...\n');

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