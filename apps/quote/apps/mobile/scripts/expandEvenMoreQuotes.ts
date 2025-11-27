#!/usr/bin/env npx tsx

import fs from 'fs/promises';
import path from 'path';

// Additional famous quotes for more authors with few quotes
const additionalQuotes = {
  'hesse-hermann': [
    {
      text: "Jedem Anfang wohnt ein Zauber inne.",
      textEN: "There is magic in every beginning.",
      categories: ['beginnings', 'hope']
    },
    {
      text: "Man muss das Unmögliche versuchen, um das Mögliche zu erreichen.",
      textEN: "One must attempt the impossible to achieve the possible.",
      categories: ['courage', 'ambition']
    },
    {
      text: "Glück ist Liebe, nichts anderes. Wer lieben kann, ist glücklich.",
      textEN: "Happiness is love, nothing else. He who can love is happy.",
      categories: ['love', 'happiness']
    },
    {
      text: "Wahrheit wird nicht gefunden, sie wird geschaffen.",
      textEN: "Truth is not found, it is created.",
      categories: ['truth', 'philosophy']
    },
    {
      text: "Damit das Mögliche entsteht, muss immer wieder das Unmögliche versucht werden.",
      textEN: "For the possible to arise, the impossible must be attempted again and again.",
      categories: ['perseverance', 'possibility']
    }
  ],
  'jung-carl-gustav': [
    {
      text: "Wer nach außen schaut, träumt. Wer nach innen schaut, erwacht.",
      textEN: "Who looks outside, dreams. Who looks inside, awakens.",
      categories: ['self-knowledge', 'wisdom']
    },
    {
      text: "Alles, was uns an anderen missfällt, kann uns zu besserer Selbsterkenntnis führen.",
      textEN: "Everything that irritates us about others can lead us to an understanding of ourselves.",
      categories: ['self-knowledge', 'relationships']
    },
    {
      text: "Die Begegnung zweier Persönlichkeiten ist wie der Kontakt zweier chemischer Substanzen: Wenn es eine Reaktion gibt, werden beide transformiert.",
      textEN: "The meeting of two personalities is like the contact of two chemical substances: if there is any reaction, both are transformed.",
      categories: ['relationships', 'change']
    },
    {
      text: "Ich bin nicht, was mir passiert ist. Ich bin, was ich entschieden habe zu werden.",
      textEN: "I am not what happened to me, I am what I choose to become.",
      categories: ['choice', 'identity']
    },
    {
      text: "Der Schuh, der dem einen passt, drückt den anderen.",
      textEN: "The shoe that fits one person pinches another.",
      categories: ['individuality', 'wisdom']
    }
  ],
  'gibran-khalil': [
    {
      text: "Aus dem Leiden entstehen die stärksten Seelen.",
      textEN: "Out of suffering have emerged the strongest souls.",
      categories: ['strength', 'suffering']
    },
    {
      text: "Die Bäume lehren uns Stille, wenn sie still sind, und sie lehren uns zu sprechen, wenn sie rauschen.",
      textEN: "Trees teach us silence when they are quiet, and they teach us to speak when they rustle.",
      categories: ['nature', 'wisdom']
    },
    {
      text: "Vertrauen ist eine Oase im Herzen, die von der Karawane des Denkens nie erreicht wird.",
      textEN: "Trust is an oasis in the heart which will never be reached by the caravan of thinking.",
      categories: ['trust', 'heart']
    },
    {
      text: "Je tiefer sich die Trauer in dein Wesen gräbt, desto mehr Freude kannst du fassen.",
      textEN: "The deeper sorrow carves into your being, the more joy you can contain.",
      categories: ['sorrow', 'joy']
    },
    {
      text: "Deine Kinder sind nicht deine Kinder. Sie sind die Söhne und Töchter der Sehnsucht des Lebens nach sich selbst.",
      textEN: "Your children are not your children. They are the sons and daughters of Life's longing for itself.",
      categories: ['children', 'life']
    }
  ],
  'adenauer-konrad': [
    {
      text: "Wir leben alle unter dem gleichen Himmel, aber wir haben nicht alle den gleichen Horizont.",
      textEN: "We all live under the same sky, but we don't all have the same horizon.",
      categories: ['perspective', 'diversity']
    },
    {
      text: "Man muss die Dinge so nehmen, wie sie kommen. Aber man sollte dafür sorgen, dass sie so kommen, wie man sie nehmen möchte.",
      textEN: "You have to take things as they come. But you should make sure they come as you'd like to take them.",
      categories: ['wisdom', 'control']
    },
    {
      text: "Die Erfahrungen sind wie die Samenkörner, aus denen die Klugheit emporwächst.",
      textEN: "Experiences are like seeds from which wisdom grows.",
      categories: ['experience', 'wisdom']
    },
    {
      text: "In der Politik geht es nicht darum, recht zu haben, sondern recht zu behalten.",
      textEN: "In politics, it's not about being right, but about staying right.",
      categories: ['politics', 'strategy']
    }
  ],
  'franz-von-assisi': [
    {
      text: "Wo Hass ist, lass mich Liebe säen.",
      textEN: "Where there is hatred, let me sow love.",
      categories: ['love', 'peace']
    },
    {
      text: "Alle Geschöpfe der Erde fühlen wie wir, alle Geschöpfe streben nach Glück wie wir.",
      textEN: "All creatures of the earth feel as we do, all creatures strive for happiness as we do.",
      categories: ['compassion', 'nature']
    },
    {
      text: "Was du in dir selbst suchst, wirst du niemals außen finden.",
      textEN: "What you are looking for within yourself, you will never find outside.",
      categories: ['self-knowledge', 'wisdom']
    },
    {
      text: "Ein einziger Sonnenstrahl reicht aus, um viele Schatten zu vertreiben.",
      textEN: "A single sunbeam is enough to drive away many shadows.",
      categories: ['hope', 'light']
    }
  ],
  'heraklit': [
    {
      text: "Man kann nicht zweimal in denselben Fluss steigen.",
      textEN: "No man ever steps in the same river twice.",
      categories: ['change', 'philosophy']
    },
    {
      text: "Der Weg hinauf und der Weg hinab sind ein und derselbe.",
      textEN: "The way up and the way down are one and the same.",
      categories: ['philosophy', 'perspective']
    },
    {
      text: "Charakter ist Schicksal.",
      textEN: "Character is destiny.",
      categories: ['character', 'fate']
    },
    {
      text: "Vieles Wissen lehrt nicht, Vernunft zu haben.",
      textEN: "Much learning does not teach understanding.",
      categories: ['knowledge', 'wisdom']
    },
    {
      text: "Die Natur liebt es, sich zu verbergen.",
      textEN: "Nature loves to hide.",
      categories: ['nature', 'mystery']
    }
  ],
  'demokrit': [
    {
      text: "Das Glück wohnt nicht im Besitze und nicht im Golde, das Glücksgefühl ist in der Seele zu Hause.",
      textEN: "Happiness resides not in possessions, and not in gold, happiness dwells in the soul.",
      categories: ['happiness', 'soul']
    },
    {
      text: "Mut steht am Anfang des Handelns, Glück am Ende.",
      textEN: "Courage stands at the beginning of action, happiness at the end.",
      categories: ['courage', 'happiness']
    },
    {
      text: "Ein Leben ohne Freude ist wie eine weite Reise ohne Gasthaus.",
      textEN: "A life without joy is like a long journey without an inn.",
      categories: ['joy', 'life']
    },
    {
      text: "Es ist besser, über sein eigenes Vergehen nachzudenken als über das anderer.",
      textEN: "It is better to think about your own faults than about those of others.",
      categories: ['self-reflection', 'wisdom']
    }
  ],
  'epiktet': [
    {
      text: "Es sind nicht die Dinge selbst, die uns beunruhigen, sondern die Vorstellungen und Meinungen von den Dingen.",
      textEN: "It's not things themselves that disturb us, but our interpretations of their significance.",
      categories: ['philosophy', 'perception']
    },
    {
      text: "Verlange nicht, dass die Dinge gehen, wie du es wünschst, sondern wünsche sie so, wie sie gehen, und du wirst zufrieden sein.",
      textEN: "Don't demand that things happen as you wish, but wish that they happen as they do happen, and you will go on well.",
      categories: ['acceptance', 'wisdom']
    },
    {
      text: "Niemand ist frei, der nicht Herr über sich selbst ist.",
      textEN: "No one is free who is not master of himself.",
      categories: ['freedom', 'self-control']
    },
    {
      text: "Schweigen ist für die meisten Menschen eine schwer zu erlernende Kunst.",
      textEN: "Silence is a lesson learned through life's many sufferings.",
      categories: ['silence', 'wisdom']
    }
  ],
  'bacon-francis': [
    {
      text: "Wissen ist Macht.",
      textEN: "Knowledge is power.",
      categories: ['knowledge', 'power']
    },
    {
      text: "Die Wahrheit ist die Tochter der Zeit, nicht der Autorität.",
      textEN: "Truth is the daughter of time, not of authority.",
      categories: ['truth', 'time']
    },
    {
      text: "Bücher sollten nicht Lehrer, sondern Berater sein.",
      textEN: "Books should not be teachers but advisors.",
      categories: ['books', 'learning']
    },
    {
      text: "Der kluge Mann macht nicht alle Fehler selbst. Er gibt auch anderen eine Chance.",
      textEN: "A wise man will make more opportunities than he finds.",
      categories: ['wisdom', 'opportunity']
    },
    {
      text: "Hoffnung ist ein gutes Frühstück, aber ein schlechtes Abendessen.",
      textEN: "Hope is a good breakfast, but it is a bad supper.",
      categories: ['hope', 'wisdom']
    }
  ],
  'hippokrates': [
    {
      text: "Das Leben ist kurz, die Kunst ist lang.",
      textEN: "Life is short, art is long.",
      categories: ['life', 'art']
    },
    {
      text: "Eure Nahrungsmittel sollen eure Heilmittel sein.",
      textEN: "Let food be thy medicine and medicine be thy food.",
      categories: ['health', 'wisdom']
    },
    {
      text: "Krankheiten fallen nicht vom Himmel, sondern entwickeln sich aus täglichen Sünden wider die Natur.",
      textEN: "Illnesses do not come upon us out of the blue. They are developed from daily sins against nature.",
      categories: ['health', 'nature']
    },
    {
      text: "Die natürlichen Kräfte in uns sind die wahren Heiler von Krankheiten.",
      textEN: "Natural forces within us are the true healers of disease.",
      categories: ['health', 'healing']
    }
  ],
  'shaw-george-bernard': [
    {
      text: "Das Leben besteht nicht darin, gute Karten zu haben, sondern mit einem schlechten Blatt ein gutes Spiel zu machen.",
      textEN: "Life consists not in holding good cards but in playing those you hold well.",
      categories: ['life', 'resilience']
    },
    {
      text: "Der vernünftige Mensch passt sich der Welt an; der unvernünftige besteht auf dem Versuch, die Welt sich anzupassen.",
      textEN: "The reasonable man adapts himself to the world; the unreasonable one persists in trying to adapt the world to himself.",
      categories: ['change', 'individuality']
    },
    {
      text: "Fortschritt ist unmöglich ohne Veränderung, und wer seine Meinung nie ändert, kann weder seinen Geist noch irgendetwas anderes ändern.",
      textEN: "Progress is impossible without change, and those who cannot change their minds cannot change anything.",
      categories: ['progress', 'change']
    },
    {
      text: "Wir lernen nicht durch Erfahrung, sondern durch unsere Fähigkeit, Erfahrungen zu machen.",
      textEN: "We don't stop playing because we grow old; we grow old because we stop playing.",
      categories: ['youth', 'play']
    }
  ],
  'schiller-friedrich': [
    {
      text: "Der Mensch ist nur da ganz Mensch, wo er spielt.",
      textEN: "Man is only fully human when he plays.",
      categories: ['humanity', 'play']
    },
    {
      text: "Was ist die Mehrheit? Mehrheit ist Unsinn; Verstand ist stets bei wenigen nur gewesen.",
      textEN: "What is the majority? Majority is nonsense; understanding has always been with only a few.",
      categories: ['wisdom', 'society']
    },
    {
      text: "Es ist der Geist, der sich den Körper baut.",
      textEN: "It is the spirit that builds itself a body.",
      categories: ['spirit', 'body']
    },
    {
      text: "Die Kunst ist eine Tochter der Freiheit.",
      textEN: "Art is a daughter of freedom.",
      categories: ['art', 'freedom']
    }
  ],
  'leonardo-da-vinci': [
    {
      text: "Wer wenig denkt, irrt sich viel.",
      textEN: "He who thinks little, errs much.",
      categories: ['thinking', 'wisdom']
    },
    {
      text: "Die größte Täuschung der Menschen ist ihre eigene Meinung.",
      textEN: "The greatest deception men suffer is from their own opinions.",
      categories: ['opinion', 'truth']
    },
    {
      text: "Einfachheit ist die höchste Form der Raffinesse.",
      textEN: "Simplicity is the ultimate sophistication.",
      categories: ['simplicity', 'elegance']
    },
    {
      text: "Wer das Leben nicht schätzt, der verdient es nicht.",
      textEN: "He who does not value life does not deserve it.",
      categories: ['life', 'gratitude']
    }
  ]
};

async function expandQuotes() {
  console.log('🚀 Expanding quotes for even more authors...\n');

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