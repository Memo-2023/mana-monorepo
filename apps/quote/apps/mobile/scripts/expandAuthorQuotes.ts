#!/usr/bin/env npx tsx

import fs from 'fs/promises';
import path from 'path';

// Additional famous quotes for authors with few quotes
const additionalQuotes = {
  'goethe': [
    {
      text: "Man sieht nur das, was man weiß.",
      textEN: "You only see what you know.",
      categories: ['wisdom', 'knowledge']
    },
    {
      text: "Auch aus Steinen, die einem in den Weg gelegt werden, kann man Schönes bauen.",
      textEN: "Even from stones placed in your path, you can build something beautiful.",
      categories: ['motivation', 'creativity']
    },
    {
      text: "Es ist nicht genug zu wissen, man muss auch anwenden. Es ist nicht genug zu wollen, man muss auch tun.",
      textEN: "Knowing is not enough; we must apply. Willing is not enough; we must do.",
      categories: ['wisdom', 'action']
    },
    {
      text: "Was immer du tun kannst oder träumst es zu können, fang damit an.",
      textEN: "Whatever you can do or dream you can, begin it.",
      categories: ['motivation', 'courage']
    },
    {
      text: "Die beste Bildung findet ein gescheiter Mensch auf Reisen.",
      textEN: "The best education for a clever person is found in travel.",
      categories: ['wisdom', 'life']
    }
  ],
  'marie-curie': [
    {
      text: "Nichts im Leben ist zu fürchten, es ist nur zu verstehen.",
      textEN: "Nothing in life is to be feared, it is only to be understood.",
      categories: ['courage', 'wisdom']
    },
    {
      text: "Man merkt nie, was schon getan wurde, man sieht immer nur, was noch zu tun bleibt.",
      textEN: "One never notices what has been done; one can only see what remains to be done.",
      categories: ['perseverance', 'wisdom']
    },
    {
      text: "Im Leben geht es nicht darum zu warten, dass das Unwetter vorbeizieht, sondern zu lernen, im Regen zu tanzen.",
      textEN: "Life is not about waiting for the storm to pass, but learning to dance in the rain.",
      categories: ['life', 'strength']
    },
    {
      text: "Träume dir dein Leben schön und mach aus diesen Träumen eine Realität.",
      textEN: "Dream your life beautiful and make these dreams a reality.",
      categories: ['dreams', 'motivation']
    }
  ],
  'oscar-wilde': [
    {
      text: "Sei du selbst! Alle anderen sind bereits vergeben.",
      textEN: "Be yourself; everyone else is already taken.",
      categories: ['wisdom', 'individuality']
    },
    {
      text: "Wir leben alle in der Gosse, aber einige von uns schauen zu den Sternen.",
      textEN: "We are all in the gutter, but some of us are looking at the stars.",
      categories: ['hope', 'wisdom']
    },
    {
      text: "Die einzige Art, eine Versuchung loszuwerden, ist, ihr nachzugeben.",
      textEN: "The only way to get rid of a temptation is to yield to it.",
      categories: ['humor', 'wisdom']
    },
    {
      text: "Erfahrung ist der Name, den jeder seinen Fehlern gibt.",
      textEN: "Experience is simply the name we give to our mistakes.",
      categories: ['wisdom', 'life']
    },
    {
      text: "Man kann nie zu viel Gepäck oder zu wenig Champagner haben.",
      textEN: "One can never have too much luggage or too little champagne.",
      categories: ['humor', 'life']
    }
  ],
  'mark-twain': [
    {
      text: "Die beiden wichtigsten Tage deines Lebens sind der Tag, an dem du geboren wurdest, und der Tag, an dem du herausfindest, warum.",
      textEN: "The two most important days in your life are the day you are born and the day you find out why.",
      categories: ['life', 'purpose']
    },
    {
      text: "Mut ist Widerstand gegen die Angst, nicht Abwesenheit von Angst.",
      textEN: "Courage is resistance to fear, mastery of fear, not absence of fear.",
      categories: ['courage', 'strength']
    },
    {
      text: "Gib jedem Tag die Chance, der schönste deines Lebens zu werden.",
      textEN: "Give every day the chance to become the most beautiful day of your life.",
      categories: ['life', 'optimism']
    },
    {
      text: "In zwanzig Jahren wirst du mehr enttäuscht sein über die Dinge, die du nicht getan hast, als über die Dinge, die du getan hast.",
      textEN: "Twenty years from now you will be more disappointed by the things you didn't do than by the ones you did do.",
      categories: ['life', 'courage']
    }
  ],
  'konfuzius': [
    {
      text: "Wer einen Fehler gemacht hat und ihn nicht korrigiert, begeht einen zweiten.",
      textEN: "A man who has committed a mistake and doesn't correct it is committing another mistake.",
      categories: ['wisdom', 'learning']
    },
    {
      text: "Es ist besser, ein einziges kleines Licht anzuzünden, als die Dunkelheit zu verfluchen.",
      textEN: "It is better to light a single candle than to curse the darkness.",
      categories: ['wisdom', 'action']
    },
    {
      text: "Wenn du liebst, was du tust, wirst du nie wieder in deinem Leben arbeiten.",
      textEN: "Choose a job you love, and you will never have to work a day in your life.",
      categories: ['work', 'happiness']
    },
    {
      text: "Der Weg ist das Ziel.",
      textEN: "The journey is the destination.",
      categories: ['wisdom', 'life']
    },
    {
      text: "Wohin du auch gehst, geh mit deinem ganzen Herzen.",
      textEN: "Wherever you go, go with all your heart.",
      categories: ['wisdom', 'life']
    }
  ],
  'aristoteles': [
    {
      text: "Wir sind das, was wir wiederholt tun. Vorzüglichkeit ist daher keine Handlung, sondern eine Gewohnheit.",
      textEN: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
      categories: ['wisdom', 'excellence']
    },
    {
      text: "Das Ganze ist mehr als die Summe seiner Teile.",
      textEN: "The whole is greater than the sum of its parts.",
      categories: ['wisdom', 'philosophy']
    },
    {
      text: "Glück hängt von uns selbst ab.",
      textEN: "Happiness depends upon ourselves.",
      categories: ['happiness', 'wisdom']
    },
    {
      text: "Der Anfang ist die Hälfte des Ganzen.",
      textEN: "Well begun is half done.",
      categories: ['motivation', 'wisdom']
    }
  ],
  'sokrates': [
    {
      text: "Ein Leben, das nicht hinterfragt wird, ist nicht lebenswert.",
      textEN: "The unexamined life is not worth living.",
      categories: ['philosophy', 'wisdom']
    },
    {
      text: "Erkenne dich selbst.",
      textEN: "Know thyself.",
      categories: ['wisdom', 'self-knowledge']
    },
    {
      text: "Es gibt nur ein Übel: Unwissenheit, und nur ein Gut: Wissen.",
      textEN: "There is only one evil: ignorance, and only one good: knowledge.",
      categories: ['knowledge', 'wisdom']
    }
  ],
  'platon': [
    {
      text: "Der Preis, den gute Menschen dafür zahlen, dass sie sich nicht für Politik interessieren, ist, von schlechteren Menschen regiert zu werden.",
      textEN: "The price good men pay for indifference to public affairs is to be ruled by evil men.",
      categories: ['politics', 'wisdom']
    },
    {
      text: "Mut ist zu wissen, was man nicht zu fürchten hat.",
      textEN: "Courage is knowing what not to fear.",
      categories: ['courage', 'wisdom']
    },
    {
      text: "Die größte Strafe für diejenigen, die sich nicht für Politik interessieren, ist, dass sie von Leuten regiert werden, die sich dafür interessieren.",
      textEN: "One of the penalties for refusing to participate in politics is that you end up being governed by your inferiors.",
      categories: ['politics', 'society']
    },
    {
      text: "Musik gibt dem Universum eine Seele, dem Geist Flügel, der Fantasie Flug.",
      textEN: "Music gives a soul to the universe, wings to the mind, flight to the imagination.",
      categories: ['art', 'creativity']
    }
  ],
  'churchill-winston': [
    {
      text: "Erfolg ist die Fähigkeit, von einem Misserfolg zum anderen zu gehen, ohne seine Begeisterung zu verlieren.",
      textEN: "Success is the ability to go from one failure to another with no loss of enthusiasm.",
      categories: ['success', 'perseverance']
    },
    {
      text: "Ein Pessimist sieht die Schwierigkeit in jeder Möglichkeit; ein Optimist sieht die Möglichkeit in jeder Schwierigkeit.",
      textEN: "A pessimist sees the difficulty in every opportunity; an optimist sees the opportunity in every difficulty.",
      categories: ['optimism', 'wisdom']
    },
    {
      text: "Mut ist, was es braucht, um aufzustehen und zu sprechen; Mut ist auch, was es braucht, um sich hinzusetzen und zuzuhören.",
      textEN: "Courage is what it takes to stand up and speak; courage is also what it takes to sit down and listen.",
      categories: ['courage', 'wisdom']
    }
  ],
  'gandhi-mahatma': [
    {
      text: "Sei du selbst die Veränderung, die du in der Welt sehen willst.",
      textEN: "Be the change you wish to see in the world.",
      categories: ['change', 'action']
    },
    {
      text: "Die Schwachen können niemals vergeben. Vergebung ist das Attribut der Starken.",
      textEN: "The weak can never forgive. Forgiveness is the attribute of the strong.",
      categories: ['forgiveness', 'strength']
    },
    {
      text: "Lebe, als würdest du morgen sterben. Lerne, als würdest du ewig leben.",
      textEN: "Live as if you were to die tomorrow. Learn as if you were to live forever.",
      categories: ['life', 'learning']
    },
    {
      text: "Die Größe einer Nation kann daran gemessen werden, wie sie ihre Tiere behandelt.",
      textEN: "The greatness of a nation can be judged by the way its animals are treated.",
      categories: ['humanity', 'compassion']
    }
  ]
};

async function expandQuotes() {
  console.log('🚀 Expanding quotes for authors...\n');

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
  let maxId = 266;
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