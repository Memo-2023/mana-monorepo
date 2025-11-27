#!/usr/bin/env npx tsx

import fs from 'fs/promises';
import path from 'path';

// Additional quotes for remaining authors with few quotes
const additionalQuotes = {
  'coelho-paulo': [
    {
      text: "Wenn du etwas wirklich willst, wird das ganze Universum sich verschwören, um dir zu helfen, es zu erreichen.",
      textEN: "When you want something, all the universe conspires in helping you to achieve it.",
      categories: ['desire', 'universe']
    },
    {
      text: "Es gibt nur eines, was einen Traum unmöglich macht: die Angst vor dem Scheitern.",
      textEN: "There is only one thing that makes a dream impossible to achieve: the fear of failure.",
      categories: ['dreams', 'fear']
    },
    {
      text: "Die Möglichkeit, dass Träume wahr werden können, macht das Leben interessant.",
      textEN: "The possibility of having a dream come true makes life interesting.",
      categories: ['dreams', 'life']
    },
    {
      text: "Menschen lernen erst dann, wenn sie bereit sind zu lernen.",
      textEN: "People learn only when they are ready to learn.",
      categories: ['learning', 'readiness']
    },
    {
      text: "Je näher man seinem Traum kommt, desto mehr wird der persönliche Legende zu seinem wahren Lebenszweck.",
      textEN: "The closer one gets to realizing his destiny, the more that destiny becomes his true reason for being.",
      categories: ['destiny', 'purpose']
    }
  ],
  'rowling-jk': [
    {
      text: "Es sind unsere Entscheidungen, die zeigen, wer wir wirklich sind, mehr als unsere Fähigkeiten.",
      textEN: "It is our choices that show what we truly are, far more than our abilities.",
      categories: ['choices', 'character']
    },
    {
      text: "Glück kann man sogar in den dunkelsten Zeiten finden, wenn man sich nur daran erinnert, das Licht einzuschalten.",
      textEN: "Happiness can be found even in the darkest of times, if one only remembers to turn on the light.",
      categories: ['happiness', 'hope']
    },
    {
      text: "Worte sind unsere unerschöpflichste Quelle der Magie.",
      textEN: "Words are our most inexhaustible source of magic.",
      categories: ['words', 'magic']
    },
    {
      text: "Wir müssen alle die Wahl zwischen dem treffen, was richtig ist und dem, was leicht ist.",
      textEN: "We must all face the choice between what is right and what is easy.",
      categories: ['choice', 'morality']
    },
    {
      text: "Es erfordert viel Mut, sich seinen Feinden entgegenzustellen, aber noch mehr, sich seinen Freunden entgegenzustellen.",
      textEN: "It takes a great deal of bravery to stand up to our enemies, but just as much to stand up to our friends.",
      categories: ['courage', 'friendship']
    }
  ],
  'pasteur-louis': [
    {
      text: "Der Zufall begünstigt nur den vorbereiteten Geist.",
      textEN: "Chance favors only the prepared mind.",
      categories: ['preparation', 'opportunity']
    },
    {
      text: "Wissenschaft kennt kein Land, denn Wissen gehört der Menschheit.",
      textEN: "Science knows no country, because knowledge belongs to humanity.",
      categories: ['science', 'humanity']
    },
    {
      text: "Im Bereich der Beobachtung begünstigt der Zufall nur den vorbereiteten Geist.",
      textEN: "In the fields of observation chance favors only the prepared mind.",
      categories: ['observation', 'preparation']
    },
    {
      text: "Die Wissenschaft besteht aus Fehlern, aber es sind Fehler, die man begehen muss, denn sie führen nach und nach zur Wahrheit.",
      textEN: "Science is made up of mistakes, but they are mistakes which it is useful to make, because they lead little by little to the truth.",
      categories: ['science', 'truth']
    },
    {
      text: "Ein wenig Wissenschaft entfernt von Gott, viel Wissenschaft führt zu ihm zurück.",
      textEN: "A little science distances one from God, much science brings one back to Him.",
      categories: ['science', 'faith']
    }
  ],
  'garland-judy': [
    {
      text: "Sei immer eine erstklassige Ausgabe von dir selbst, statt eine zweitklassige Ausgabe von jemand anderem.",
      textEN: "Always be a first-rate version of yourself, instead of a second-rate version of somebody else.",
      categories: ['authenticity', 'self']
    },
    {
      text: "Hinter jedem Regenbogen wartet ein weiterer Sturm.",
      textEN: "Behind every rainbow is another storm.",
      categories: ['life', 'resilience']
    },
    {
      text: "Wenn ich auf die Musik höre, kann ich immer durch alles hindurchkommen.",
      textEN: "When I listen to music, I can always get through anything.",
      categories: ['music', 'strength']
    },
    {
      text: "Ich glaube, dass Lachen die beste Art ist, Kalorien zu verbrennen.",
      textEN: "I believe that laughing is the best calorie burner.",
      categories: ['laughter', 'joy']
    },
    {
      text: "Es ist einsam und kalt an der Spitze - warm und freundlich unten.",
      textEN: "It's lonely and cold at the top - warm and friendly at the bottom.",
      categories: ['success', 'humanity']
    }
  ],
  'kneipp-sebastian': [
    {
      text: "Wer nicht jeden Tag etwas für seine Gesundheit aufbringt, muss eines Tages sehr viel Zeit für die Krankheit opfern.",
      textEN: "He who does not invest something for his health every day will one day have to sacrifice a lot of time for illness.",
      categories: ['health', 'prevention']
    },
    {
      text: "Die Natur ist die beste Apotheke.",
      textEN: "Nature is the best pharmacy.",
      categories: ['nature', 'health']
    },
    {
      text: "Erst als ich die Leute kannte, verstand ich die Tiere.",
      textEN: "Only when I knew people did I understand animals.",
      categories: ['humanity', 'nature']
    },
    {
      text: "Gesundheit bekommt man nicht im Handel, sondern durch den Lebenswandel.",
      textEN: "Health is not bought in stores, but through lifestyle.",
      categories: ['health', 'lifestyle']
    },
    {
      text: "Vorbeugen ist besser als heilen.",
      textEN: "Prevention is better than cure.",
      categories: ['prevention', 'health']
    }
  ],
  'bergman-ingmar': [
    {
      text: "Altern ist wie Bergsteigen: Je höher man kommt, desto erschöpfter wird man, aber die Aussicht wird besser.",
      textEN: "Aging is like mountain climbing: the higher you get, the more exhausted you become, but the view gets better.",
      categories: ['aging', 'perspective']
    },
    {
      text: "Es gibt keine Grenzen. Weder für Gedanken noch für Gefühle.",
      textEN: "There are no boundaries. Neither for thoughts nor for feelings.",
      categories: ['freedom', 'emotion']
    },
    {
      text: "Film als Traum, Film als Musik. Kein anderes Medium drückt so gut das Bewusstsein aus.",
      textEN: "Film as dream, film as music. No other medium expresses consciousness so well.",
      categories: ['film', 'art']
    },
    {
      text: "Ich schreibe Drehbücher, um ihnen Fleisch und Blut zu geben.",
      textEN: "I write scripts to give them flesh and blood.",
      categories: ['writing', 'creation']
    },
    {
      text: "Die Dämonen sind unzählig, kommen in den verschiedensten Gestalten und haben mir all meine Freude geraubt.",
      textEN: "The demons are countless, arrive in the most varied shapes and rob me of all my joy.",
      categories: ['struggle', 'creativity']
    }
  ],
  'johannes-paul-ii': [
    {
      text: "Die Zukunft beginnt heute, nicht morgen.",
      textEN: "The future starts today, not tomorrow.",
      categories: ['future', 'action']
    },
    {
      text: "Es gibt keine Hoffnung ohne Furcht und keine Furcht ohne Hoffnung.",
      textEN: "There is no hope without fear and no fear without hope.",
      categories: ['hope', 'fear']
    },
    {
      text: "Freiheit besteht nicht darin, das zu tun, was wir wollen, sondern das Recht zu haben, das zu tun, was wir sollten.",
      textEN: "Freedom consists not in doing what we like, but in having the right to do what we ought.",
      categories: ['freedom', 'responsibility']
    },
    {
      text: "Der schlimmste Gefängnis ist ein geschlossenes Herz.",
      textEN: "The worst prison is a closed heart.",
      categories: ['heart', 'openness']
    },
    {
      text: "Habt keine Angst!",
      textEN: "Do not be afraid!",
      categories: ['courage', 'faith']
    }
  ],
  'ben-gurion-david': [
    {
      text: "Um Realist zu sein, muss man an Wunder glauben.",
      textEN: "In order to be a realist you must believe in miracles.",
      categories: ['miracles', 'reality']
    },
    {
      text: "Mut ist eine besondere Art von Wissen: das Wissen, wie man Angst überwindet.",
      textEN: "Courage is a special kind of knowledge: the knowledge of how to fear what ought to be feared.",
      categories: ['courage', 'knowledge']
    },
    {
      text: "Wer nicht an Wunder glaubt, ist kein Realist.",
      textEN: "Anyone who doesn't believe in miracles is not a realist.",
      categories: ['miracles', 'belief']
    },
    {
      text: "Ohne moralische und intellektuelle Unabhängigkeit gibt es keine menschliche Würde.",
      textEN: "Without moral and intellectual independence, there is no human dignity.",
      categories: ['independence', 'dignity']
    },
    {
      text: "Gedanken sind die Quelle aller Dinge.",
      textEN: "Thought is the source of all things.",
      categories: ['thought', 'creation']
    }
  ],
  'hillary-edmund': [
    {
      text: "Es ist nicht der Berg, den wir bezwingen, sondern uns selbst.",
      textEN: "It is not the mountain we conquer, but ourselves.",
      categories: ['achievement', 'self']
    },
    {
      text: "Menschen antworten nicht auf Berge, sondern auf die Herausforderung.",
      textEN: "People do not decide to become extraordinary. They decide to accomplish extraordinary things.",
      categories: ['challenge', 'achievement']
    },
    {
      text: "Ich habe gelernt, dass Mut nicht die Abwesenheit von Angst ist, sondern der Triumph darüber.",
      textEN: "I have learned that courage is not the absence of fear, but the triumph over it.",
      categories: ['courage', 'fear']
    },
    {
      text: "Das Leben ist entweder ein gewagtes Abenteuer oder gar nichts.",
      textEN: "Life is either a daring adventure or nothing at all.",
      categories: ['adventure', 'life']
    },
    {
      text: "Wenn du nur kleine Ziele hast, wirst du nur kleine Erfolge haben.",
      textEN: "If you only have small goals, you will only have small successes.",
      categories: ['goals', 'ambition']
    }
  ],
  'buffett-jimmy': [
    {
      text: "Es ist diese Zeit zwischen Hund und Wolf, die uns alle zu Philosophen macht.",
      textEN: "It's that time between dog and wolf that makes philosophers of us all.",
      categories: ['time', 'philosophy']
    },
    {
      text: "Das Problem ist, dass wir zu viel denken und zu wenig trinken.",
      textEN: "The problem is we think too much and drink too little.",
      categories: ['humor', 'life']
    },
    {
      text: "Wenn das Leben dir Limetten gibt, mach Margaritas.",
      textEN: "If life gives you limes, make margaritas.",
      categories: ['optimism', 'humor']
    },
    {
      text: "Die Suche nach dem verlorenen Salzstreuer ist die Suche nach dem Sinn des Lebens.",
      textEN: "Searching for my lost shaker of salt is searching for the meaning of life.",
      categories: ['meaning', 'humor']
    },
    {
      text: "Wir sind nicht hier für eine lange Zeit, wir sind hier für eine gute Zeit.",
      textEN: "We're not here for a long time, we're here for a good time.",
      categories: ['life', 'enjoyment']
    }
  ],
  'kakuzo-okakura': [
    {
      text: "Die Kunst des Lebens liegt in einer dauernden Neueinstellung zu unserer Umgebung.",
      textEN: "The art of life lies in constant readjustment to our surroundings.",
      categories: ['adaptation', 'life']
    },
    {
      text: "Tee ist ein Kunstwerk und braucht die Hand eines Meisters.",
      textEN: "Tea is a work of art and needs the hand of a master.",
      categories: ['art', 'mastery']
    },
    {
      text: "Im Kleinen das Große sehen - das ist die Kunst.",
      textEN: "To see the great in the small - that is art.",
      categories: ['perspective', 'art']
    },
    {
      text: "Die Philosophie des Tees ist keine bloße Ästhetik, sondern die ganze Ethik.",
      textEN: "The philosophy of tea is not mere aesthetics, but the whole ethics.",
      categories: ['philosophy', 'tea']
    },
    {
      text: "Einfachheit ist die ultimative Raffinesse.",
      textEN: "Simplicity is the ultimate sophistication.",
      categories: ['simplicity', 'elegance']
    }
  ],
  'sallustius-gaius': [
    {
      text: "Jeder ist seines eigenen Glückes Schmied.",
      textEN: "Every man is the architect of his own fortune.",
      categories: ['fortune', 'responsibility']
    },
    {
      text: "Durch Eintracht wachsen kleine Dinge, durch Zwietracht verfallen die größten.",
      textEN: "Through harmony small things grow, through discord the greatest things decay.",
      categories: ['unity', 'discord']
    },
    {
      text: "Die gleiche Sache schadet dem einen, nützt dem anderen.",
      textEN: "The same thing harms one, benefits another.",
      categories: ['perspective', 'relativity']
    },
    {
      text: "Wenige wünschen sich das, was sie verdienen.",
      textEN: "Few wish for what they deserve.",
      categories: ['desire', 'merit']
    },
    {
      text: "Der Ruhm folgt der Tugend wie ihr Schatten.",
      textEN: "Glory follows virtue as its shadow.",
      categories: ['virtue', 'glory']
    }
  ]
};

async function expandQuotes() {
  console.log('🚀 Expanding final batch of authors with quotes...\n');

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