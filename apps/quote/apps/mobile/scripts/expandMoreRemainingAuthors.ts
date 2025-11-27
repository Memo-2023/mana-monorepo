#!/usr/bin/env npx tsx

import fs from 'fs/promises';
import path from 'path';

// Additional quotes for more remaining authors
const additionalQuotes = {
  'kennedy-john-f': [
    {
      text: "Frage nicht, was dein Land für dich tun kann - frage, was du für dein Land tun kannst.",
      textEN: "Ask not what your country can do for you - ask what you can do for your country.",
      categories: ['patriotism', 'service']
    },
    {
      text: "Veränderung ist das Gesetz des Lebens. Wer nur auf die Vergangenheit oder Gegenwart blickt, verpasst die Zukunft.",
      textEN: "Change is the law of life. And those who look only to the past or present are certain to miss the future.",
      categories: ['change', 'future']
    },
    {
      text: "Die Menschheit muss dem Krieg ein Ende setzen, oder der Krieg setzt der Menschheit ein Ende.",
      textEN: "Mankind must put an end to war, or war will put an end to mankind.",
      categories: ['war', 'peace']
    },
    {
      text: "Führung und Lernen sind für einander unentbehrlich.",
      textEN: "Leadership and learning are indispensable to each other.",
      categories: ['leadership', 'learning']
    },
    {
      text: "Wer zu Friedenszeiten baut, hat in Kriegszeiten zu essen.",
      textEN: "The time to repair the roof is when the sun is shining.",
      categories: ['preparation', 'foresight']
    }
  ],
  'fromm-erich': [
    {
      text: "Lieben heißt, sich ohne Garantie hinzugeben.",
      textEN: "To love means to commit oneself without guarantee.",
      categories: ['love', 'commitment']
    },
    {
      text: "Die Liebe ist die einzige vernünftige und befriedigende Antwort auf das Problem der menschlichen Existenz.",
      textEN: "Love is the only sane and satisfactory answer to the problem of human existence.",
      categories: ['love', 'existence']
    },
    {
      text: "Der moderne Mensch lebt in der Illusion, er wisse, was er wolle.",
      textEN: "Modern man lives under the illusion that he knows what he wants.",
      categories: ['illusion', 'desire']
    },
    {
      text: "Kreativität erfordert den Mut, seine Sicherheiten loszulassen.",
      textEN: "Creativity requires the courage to let go of certainties.",
      categories: ['creativity', 'courage']
    },
    {
      text: "Nicht der ist reich, der viel hat, sondern der, welcher viel gibt.",
      textEN: "Not he who has much is rich, but he who gives much.",
      categories: ['generosity', 'wealth']
    }
  ],
  'skinner-bf': [
    {
      text: "Bildung ist das, was übrig bleibt, wenn wir vergessen, was wir gelernt haben.",
      textEN: "Education is what survives when what has been learned has been forgotten.",
      categories: ['education', 'learning']
    },
    {
      text: "Das Problem ist nicht, ob Maschinen denken können, sondern ob Menschen es tun.",
      textEN: "The real problem is not whether machines think but whether men do.",
      categories: ['thinking', 'humanity']
    },
    {
      text: "Wir sollten nicht lehren, was zu denken ist, sondern wie zu denken ist.",
      textEN: "We shouldn't teach what to think, but how to think.",
      categories: ['education', 'thinking']
    },
    {
      text: "Eine Misserfolg ist nicht immer ein Fehler. Es kann einfach das Beste sein, was man unter den Umständen tun kann.",
      textEN: "A failure is not always a mistake. It may simply be the best one can do under the circumstances.",
      categories: ['failure', 'perspective']
    },
    {
      text: "Das Verhalten formt die Überzeugungen mehr als Überzeugungen das Verhalten formen.",
      textEN: "Behavior shapes beliefs more than beliefs shape behavior.",
      categories: ['behavior', 'belief']
    }
  ],
  'wright-frank-lloyd': [
    {
      text: "Studiere die Natur, liebe die Natur, bleibe nah an der Natur. Sie wird dich niemals enttäuschen.",
      textEN: "Study nature, love nature, stay close to nature. It will never fail you.",
      categories: ['nature', 'wisdom']
    },
    {
      text: "Weniger ist nur mehr, wenn mehr zu viel ist.",
      textEN: "Less is only more where more is too much.",
      categories: ['simplicity', 'design']
    },
    {
      text: "Der Raum innerhalb wird zur Realität des Gebäudes.",
      textEN: "The space within becomes the reality of the building.",
      categories: ['architecture', 'space']
    },
    {
      text: "Form folgt Funktion - das ist missverständlich. Form und Funktion sollten eins sein.",
      textEN: "Form follows function - that has been misunderstood. Form and function should be one.",
      categories: ['design', 'unity']
    },
    {
      text: "Jeder große Architekt ist - notwendigerweise - ein großer Dichter.",
      textEN: "Every great architect is - necessarily - a great poet.",
      categories: ['architecture', 'poetry']
    }
  ],
  'morgenstern-christian': [
    {
      text: "Wer sich selbst treu bleiben will, kann nicht immer anderen treu bleiben.",
      textEN: "He who wants to remain true to himself cannot always remain true to others.",
      categories: ['authenticity', 'loyalty']
    },
    {
      text: "Es ist nicht alles Gott, was glänzt.",
      textEN: "All that glitters is not God.",
      categories: ['wisdom', 'illusion']
    },
    {
      text: "Man sieht oft etwas hundert Mal, tausend Mal, ehe man es zum allerersten Mal wirklich sieht.",
      textEN: "One often sees something a hundred times, a thousand times, before really seeing it for the first time.",
      categories: ['perception', 'awareness']
    },
    {
      text: "Humor ist der Knopf, der verhindert, dass uns der Kragen platzt.",
      textEN: "Humor is the button that keeps our collar from bursting.",
      categories: ['humor', 'stress']
    },
    {
      text: "Die Unmöglichkeit ist schwarz gekleidet. Aber sie hat ein lächelndes Gesicht.",
      textEN: "Impossibility is dressed in black. But it has a smiling face.",
      categories: ['impossibility', 'paradox']
    }
  ],
  'aristotle': [
    {
      text: "Exzellenz ist niemals ein Unfall. Es ist immer das Ergebnis hoher Absicht, aufrichtiger Bemühung und intelligenter Ausführung.",
      textEN: "Excellence is never an accident. It is always the result of high intention, sincere effort, and intelligent execution.",
      categories: ['excellence', 'effort']
    },
    {
      text: "Wissen besteht im Kennen der Ursachen.",
      textEN: "Knowing consists in knowing the causes.",
      categories: ['knowledge', 'understanding']
    },
    {
      text: "Die Natur macht nichts vergeblich.",
      textEN: "Nature does nothing in vain.",
      categories: ['nature', 'purpose']
    },
    {
      text: "Was es zu lernen gibt, bevor man es tut, lernt man, indem man es tut.",
      textEN: "What we have to learn to do, we learn by doing.",
      categories: ['learning', 'practice']
    },
    {
      text: "Der Zweck der Kunst ist, den geheimen Sinn der Dinge zu enthüllen, nicht ihre Erscheinung zu kopieren.",
      textEN: "The aim of art is to represent not the outward appearance of things, but their inward significance.",
      categories: ['art', 'meaning']
    }
  ],
  'lao-tzu': [
    {
      text: "Wasser ist das Weichste auf der Welt, doch nichts übertrifft es darin, das Harte zu besiegen.",
      textEN: "Water is the softest thing in the world, yet nothing surpasses it in conquering the hard.",
      categories: ['flexibility', 'strength']
    },
    {
      text: "Wahre Worte sind nicht schön, schöne Worte sind nicht wahr.",
      textEN: "True words are not beautiful, beautiful words are not true.",
      categories: ['truth', 'beauty']
    },
    {
      text: "Wer viel redet, erschöpft sich schnell. Besser ist es, das Zentrum zu bewahren.",
      textEN: "He who talks much exhausts himself quickly. Better to preserve the center.",
      categories: ['silence', 'balance']
    },
    {
      text: "Handle, ohne zu handeln.",
      textEN: "Act without acting.",
      categories: ['wisdom', 'paradox']
    },
    {
      text: "Das Universum ist heilig. Du kannst es nicht verbessern.",
      textEN: "The universe is sacred. You cannot improve it.",
      categories: ['acceptance', 'nature']
    }
  ],
  'rousseau-jean-jacques': [
    {
      text: "Das Gewissen ist die Stimme der Seele, die Leidenschaften sind die Stimme des Körpers.",
      textEN: "Conscience is the voice of the soul, passions are the voice of the body.",
      categories: ['conscience', 'passion']
    },
    {
      text: "Alles ist gut, wie es aus den Händen des Schöpfers kommt; alles entartet unter den Händen des Menschen.",
      textEN: "Everything is good as it comes from the hands of the Creator; everything degenerates in the hands of man.",
      categories: ['nature', 'corruption']
    },
    {
      text: "Der stärkste ist niemals stark genug, um immer Herr zu sein, wenn er seine Stärke nicht in Recht verwandelt.",
      textEN: "The strongest is never strong enough to be always master, unless he transforms his strength into right.",
      categories: ['power', 'justice']
    },
    {
      text: "Je mehr man weiß, desto mehr zweifelt man.",
      textEN: "The more one knows, the more one doubts.",
      categories: ['knowledge', 'doubt']
    },
    {
      text: "Glück besteht nicht darin, zu tun, was man will, sondern zu wollen, was man tut.",
      textEN: "Happiness consists not in doing what we want, but in wanting what we do.",
      categories: ['happiness', 'contentment']
    }
  ],
  'carlyle-thomas': [
    {
      text: "Schweigen ist tiefer als alle Worte.",
      textEN: "Silence is more eloquent than words.",
      categories: ['silence', 'communication']
    },
    {
      text: "Die Überzeugung eines Menschen ist immer stärker als seine Argumente.",
      textEN: "A person's conviction is always stronger than their arguments.",
      categories: ['conviction', 'belief']
    },
    {
      text: "Nichts, das aufhört, Schmerz zu sein, wird erinnert.",
      textEN: "Nothing that ceases to be painful is remembered.",
      categories: ['pain', 'memory']
    },
    {
      text: "Genie ist die unendliche Fähigkeit, Schmerz zu ertragen.",
      textEN: "Genius is an infinite capacity for taking pains.",
      categories: ['genius', 'perseverance']
    },
    {
      text: "Die Geschichte der Welt ist die Biographie großer Menschen.",
      textEN: "The history of the world is but the biography of great men.",
      categories: ['history', 'greatness']
    }
  ],
  'james-william': [
    {
      text: "Die Kunst, weise zu sein, ist die Kunst zu wissen, was zu übersehen ist.",
      textEN: "The art of being wise is the art of knowing what to overlook.",
      categories: ['wisdom', 'discernment']
    },
    {
      text: "Wir sind nicht nur glücklich, weil wir lächeln, sondern wir lächeln auch, weil wir glücklich sind.",
      textEN: "We don't laugh because we're happy, we're happy because we laugh.",
      categories: ['happiness', 'emotion']
    },
    {
      text: "Ein Genie ist oft nur ein talentierter Mensch, der seine Hausaufgaben gemacht hat.",
      textEN: "Genius means little more than the faculty of perceiving in an unhabitual way.",
      categories: ['genius', 'perception']
    },
    {
      text: "Der größte Nutzen des Lebens ist, es für etwas auszugeben, das es überdauert.",
      textEN: "The greatest use of life is to spend it for something that will outlast it.",
      categories: ['purpose', 'legacy']
    },
    {
      text: "Glaube ist die Bereitschaft zu handeln, auch wenn der Erfolg nicht garantiert ist.",
      textEN: "Faith is the willingness to act even when success is not guaranteed.",
      categories: ['faith', 'action']
    }
  ],
  'cicero-marcus-tullius': [
    {
      text: "Der Anfang ist die Hälfte des Ganzen.",
      textEN: "The beginning is half the whole.",
      categories: ['beginning', 'action']
    },
    {
      text: "Niemand ist so alt, dass er nicht glaubt, noch ein Jahr leben zu können.",
      textEN: "No one is so old that he does not think he could live another year.",
      categories: ['hope', 'life']
    },
    {
      text: "Die Dankbarkeit ist nicht nur die größte aller Tugenden, sondern auch die Mutter aller anderen.",
      textEN: "Gratitude is not only the greatest of virtues, but the parent of all others.",
      categories: ['gratitude', 'virtue']
    },
    {
      text: "Jeder Mensch kann irren, aber nur Dummköpfe verharren im Irrtum.",
      textEN: "Any man can make mistakes, but only an idiot persists in his error.",
      categories: ['mistakes', 'wisdom']
    },
    {
      text: "Freundschaft macht das Glück strahlender und erleichtert das Unglück.",
      textEN: "Friendship makes happiness brighter and lightens misfortune.",
      categories: ['friendship', 'happiness']
    }
  ]
};

async function expandQuotes() {
  console.log('🚀 Expanding more remaining authors with quotes...\n');

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