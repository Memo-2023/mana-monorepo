#!/usr/bin/env npx tsx

import fs from 'fs/promises';
import path from 'path';

// Additional quotes for final remaining authors
const additionalQuotes = {
  'schopenhauer-arthur': [
    {
      text: "Das Schicksal mischt die Karten, und wir spielen.",
      textEN: "Fate shuffles the cards, and we play.",
      categories: ['fate', 'life']
    },
    {
      text: "Einsamkeit ist das Los aller hervorragenden Geister.",
      textEN: "Solitude is the fate of all excellent minds.",
      categories: ['solitude', 'excellence']
    },
    {
      text: "Fast alles Große ist durch ein trotzdem zustande gekommen.",
      textEN: "Almost everything great has been accomplished through a nevertheless.",
      categories: ['perseverance', 'greatness']
    },
    {
      text: "Die Gesundheit überwiegt alle äußeren Güter.",
      textEN: "Health outweighs all external goods.",
      categories: ['health', 'values']
    },
    {
      text: "Je edler und vollkommener eine Sache ist, desto später und langsamer gelangt sie zur Reife.",
      textEN: "The nobler and more perfect a thing is, the later and slower it reaches maturity.",
      categories: ['growth', 'perfection']
    }
  ],
  'seneca-lucius-annaeus': [
    {
      text: "Es ist nicht wenig Zeit, die wir haben, sondern es ist viel Zeit, die wir nicht nutzen.",
      textEN: "It is not that we have so little time but that we waste so much of it.",
      categories: ['time', 'waste']
    },
    {
      text: "Jeder Neue Anfang kommt aus eines anderen Anfangs Ende.",
      textEN: "Every new beginning comes from some other beginning's end.",
      categories: ['beginnings', 'endings']
    },
    {
      text: "Glück ist, was passiert, wenn Vorbereitung auf Gelegenheit trifft.",
      textEN: "Luck is what happens when preparation meets opportunity.",
      categories: ['luck', 'preparation']
    },
    {
      text: "Nicht wer wenig hat, sondern wer viel wünscht, ist arm.",
      textEN: "It is not the man who has too little, but the man who craves more, who is poor.",
      categories: ['contentment', 'desire']
    },
    {
      text: "Die Schwierigkeiten stärken den Geist, wie die Arbeit den Körper stärkt.",
      textEN: "Difficulties strengthen the mind, as labor does the body.",
      categories: ['difficulties', 'strength']
    }
  ],
  'drucker-peter-f': [
    {
      text: "Der beste Weg, die Zukunft vorauszusagen, ist, sie zu gestalten.",
      textEN: "The best way to predict the future is to create it.",
      categories: ['future', 'action']
    },
    {
      text: "Management ist die Kunst, die Dinge richtig zu tun. Führung ist die Kunst, die richtigen Dinge zu tun.",
      textEN: "Management is doing things right; leadership is doing the right things.",
      categories: ['management', 'leadership']
    },
    {
      text: "Was nicht gemessen wird, kann nicht gemanagt werden.",
      textEN: "What gets measured gets managed.",
      categories: ['measurement', 'management']
    },
    {
      text: "Die wichtigste Sache in der Kommunikation ist zu hören, was nicht gesagt wird.",
      textEN: "The most important thing in communication is to hear what isn't being said.",
      categories: ['communication', 'listening']
    },
    {
      text: "Wissen muss ständig verbessert, herausgefordert und vermehrt werden, oder es verschwindet.",
      textEN: "Knowledge has to be improved, challenged, and increased constantly, or it vanishes.",
      categories: ['knowledge', 'growth']
    }
  ],
  'roosevelt-theodore': [
    {
      text: "Glaube, dass du kannst, und du bist schon halb da.",
      textEN: "Believe you can and you're halfway there.",
      categories: ['belief', 'confidence']
    },
    {
      text: "Tu, was du kannst, mit dem, was du hast, wo du bist.",
      textEN: "Do what you can, with what you have, where you are.",
      categories: ['action', 'resourcefulness']
    },
    {
      text: "Es ist hart zu scheitern, aber es ist schlimmer, niemals versucht zu haben, erfolgreich zu sein.",
      textEN: "It is hard to fail, but it is worse never to have tried to succeed.",
      categories: ['failure', 'trying']
    },
    {
      text: "Sprich leise und trage einen großen Stock.",
      textEN: "Speak softly and carry a big stick.",
      categories: ['diplomacy', 'strength']
    },
    {
      text: "Der einzige Mann, der nie einen Fehler macht, ist der Mann, der nie etwas tut.",
      textEN: "The only man who never makes a mistake is the man who never does anything.",
      categories: ['mistakes', 'action']
    }
  ],
  'keane-bil': [
    {
      text: "Gestern ist Geschichte, morgen ist ein Geheimnis, heute ist ein Geschenk.",
      textEN: "Yesterday is history, tomorrow is a mystery, today is a gift.",
      categories: ['present', 'time']
    },
    {
      text: "Eine Umarmung ist wie ein Bumerang - du bekommst sie sofort zurück.",
      textEN: "A hug is like a boomerang - you get it back right away.",
      categories: ['love', 'kindness']
    },
    {
      text: "Kinder brauchen Liebe, besonders wenn sie sie nicht verdienen.",
      textEN: "Children need love, especially when they don't deserve it.",
      categories: ['children', 'love']
    },
    {
      text: "Zeit fliegt. Sie ist der Pilot.",
      textEN: "Time flies. You're the pilot.",
      categories: ['time', 'control']
    },
    {
      text: "Gott hat uns Erinnerungen gegeben, damit wir im Winter des Lebens Rosen haben können.",
      textEN: "God gave us memories so we could have roses in the winter of life.",
      categories: ['memories', 'comfort']
    }
  ],
  'levenson-sam': [
    {
      text: "Der Grund, warum Großeltern und Enkel so gut miteinander auskommen, ist, dass sie einen gemeinsamen Feind haben.",
      textEN: "The reason grandparents and grandchildren get along so well is that they have a common enemy.",
      categories: ['family', 'humor']
    },
    {
      text: "Der Unterschied zwischen Liebe und Wahnsinn ist nur eine Frage des Grades.",
      textEN: "The difference between love and madness is only a matter of degree.",
      categories: ['love', 'madness']
    },
    {
      text: "Bleib jung - es ist die einzige Möglichkeit, unsterblich zu werden.",
      textEN: "Stay young - it's the only way to become immortal.",
      categories: ['youth', 'immortality']
    },
    {
      text: "Die Uhr der Weisheit tickt mit jedem Fehler, den wir machen.",
      textEN: "The clock of wisdom ticks with every mistake we make.",
      categories: ['wisdom', 'mistakes']
    },
    {
      text: "Glück ist, einen großen, liebevollen, fürsorglichen, eng verbundenen Familie in einer anderen Stadt zu haben.",
      textEN: "Happiness is having a large, loving, caring, close-knit family in another city.",
      categories: ['family', 'humor']
    }
  ],
  'wilde-oscar': [
    {
      text: "Ich kann allem widerstehen, außer der Versuchung.",
      textEN: "I can resist everything except temptation.",
      categories: ['temptation', 'humor']
    },
    {
      text: "Ein Zyniker ist jemand, der von allem den Preis kennt und von nichts den Wert.",
      textEN: "A cynic is someone who knows the price of everything and the value of nothing.",
      categories: ['cynicism', 'value']
    },
    {
      text: "Zu lieben heißt, sich selbst in einem anderen zu übertreffen.",
      textEN: "To love is to surpass oneself.",
      categories: ['love', 'growth']
    },
    {
      text: "Die Wahrheit ist selten rein und niemals einfach.",
      textEN: "The truth is rarely pure and never simple.",
      categories: ['truth', 'complexity']
    },
    {
      text: "Ich denke, Gott hat beim Erschaffen des Menschen seine Fähigkeiten etwas überschätzt.",
      textEN: "I think God, in creating man, somewhat overestimated his ability.",
      categories: ['humanity', 'humor']
    }
  ],
  'jung-carl-gustav': [
    {
      text: "Das Privileg eines Lebens ist es, zu werden, wer du wirklich bist.",
      textEN: "The privilege of a lifetime is to become who you truly are.",
      categories: ['authenticity', 'life']
    },
    {
      text: "Das Unbewusste ist nicht nur böse, sondern auch die Quelle des höchsten Guten.",
      textEN: "The unconscious is not just evil, but also the source of the highest good.",
      categories: ['psychology', 'good']
    },
    {
      text: "Wo Liebe herrscht, gibt es keinen Machtwillen.",
      textEN: "Where love rules, there is no will to power.",
      categories: ['love', 'power']
    },
    {
      text: "Die größte und wichtigste Aufgabe im Leben ist, sich selbst zu finden.",
      textEN: "The greatest and most important task in life is to find yourself.",
      categories: ['self-discovery', 'purpose']
    },
    {
      text: "Ihre Vision wird erst dann klar, wenn Sie in Ihr eigenes Herz schauen.",
      textEN: "Your vision will become clear only when you look into your own heart.",
      categories: ['vision', 'introspection']
    }
  ],
  'yeats-william-butler': [
    {
      text: "Tritt leise auf, denn du trittst auf meine Träume.",
      textEN: "Tread softly because you tread on my dreams.",
      categories: ['dreams', 'gentleness']
    },
    {
      text: "Es braucht mehr Mut, seine Meinung zu ändern als dabei zu bleiben.",
      textEN: "It takes more courage to change your mind than to stick to it.",
      categories: ['courage', 'change']
    },
    {
      text: "Die Welt ist voller magischer Dinge, die geduldig darauf warten, dass unsere Sinne schärfer werden.",
      textEN: "The world is full of magical things patiently waiting for our wits to grow sharper.",
      categories: ['magic', 'perception']
    },
    {
      text: "Je älter ich werde, desto mehr glaube ich, dass das einzig Wissenschaftliche das Unwahrscheinliche ist.",
      textEN: "The older I get, the more I believe that the only science is the improbable.",
      categories: ['science', 'mystery']
    },
    {
      text: "In Träumen beginnen Verantwortungen.",
      textEN: "In dreams begin responsibilities.",
      categories: ['dreams', 'responsibility']
    }
  ],
  'kaestner-erich': [
    {
      text: "An allem Unfug, der passiert, sind nicht etwa nur die schuld, die ihn tun, sondern auch die, die ihn nicht verhindern.",
      textEN: "All mischief that happens is not only the fault of those who do it, but also those who don't prevent it.",
      categories: ['responsibility', 'action']
    },
    {
      text: "Wie gesagt, das Leben muss noch vor dem Tode erledigt werden.",
      textEN: "As said, life must be done before death.",
      categories: ['life', 'urgency']
    },
    {
      text: "Die Erde ist ein gebildeter Stern mit sehr viel Wasserspülung.",
      textEN: "Earth is an educated star with a lot of water flushing.",
      categories: ['earth', 'humor']
    },
    {
      text: "Irrtümer haben ihren Wert; jedoch nur hier und da. Nicht jeder, der nach Indien fährt, entdeckt Amerika.",
      textEN: "Mistakes have their value; but only here and there. Not everyone who sails to India discovers America.",
      categories: ['mistakes', 'discovery']
    },
    {
      text: "Entweder man lebt, oder man ist konsequent.",
      textEN: "Either you live, or you are consistent.",
      categories: ['life', 'consistency']
    }
  ],
  'shedd-john-a': [
    {
      text: "Lebe so, als würdest du morgen sterben. Lerne so, als würdest du ewig leben.",
      textEN: "Live as if you were to die tomorrow. Learn as if you were to live forever.",
      categories: ['life', 'learning']
    },
    {
      text: "Große Träume beinhalten große Risiken.",
      textEN: "Great dreams involve great risks.",
      categories: ['dreams', 'risk']
    },
    {
      text: "Die größten Siege kommen aus den größten Herausforderungen.",
      textEN: "The greatest victories come from the greatest challenges.",
      categories: ['victory', 'challenges']
    },
    {
      text: "Fehler sind die Wegweiser zum Erfolg.",
      textEN: "Mistakes are the guideposts to success.",
      categories: ['mistakes', 'success']
    },
    {
      text: "Mut ist die Magie, die Träume wahr werden lässt.",
      textEN: "Courage is the magic that makes dreams come true.",
      categories: ['courage', 'dreams']
    }
  ]
};

async function expandQuotes() {
  console.log('🚀 Expanding final remaining authors with quotes...\n');

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