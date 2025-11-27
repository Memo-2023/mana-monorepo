#!/usr/bin/env npx tsx

import fs from 'fs/promises';
import path from 'path';

// Additional quotes for next batch of authors
const additionalQuotes = {
  'chaplin-charlie': [
    {
      text: "Ein Tag ohne Lachen ist ein verlorener Tag.",
      textEN: "A day without laughter is a day wasted.",
      categories: ['laughter', 'joy']
    },
    {
      text: "Das Leben ist eine Tragödie in der Nahaufnahme, aber eine Komödie in der Totale.",
      textEN: "Life is a tragedy when seen in close-up, but a comedy in long-shot.",
      categories: ['life', 'perspective']
    },
    {
      text: "Wir denken zu viel und fühlen zu wenig.",
      textEN: "We think too much and feel too little.",
      categories: ['thinking', 'feeling']
    },
    {
      text: "Um sich selbst zu finden, muss man allein sein.",
      textEN: "To find yourself, you must be alone.",
      categories: ['solitude', 'self-discovery']
    },
    {
      text: "Im Lichte der Ewigkeit ist alles Zeitliche eine Komödie.",
      textEN: "In the light of eternity, all temporal things are a comedy.",
      categories: ['time', 'perspective']
    }
  ],
  'bach-richard': [
    {
      text: "Der beste Weg, sich selbst zu finden, ist, sich im Dienst für andere zu verlieren.",
      textEN: "The best way to find yourself is to lose yourself in the service of others.",
      categories: ['service', 'self-discovery']
    },
    {
      text: "Was die Raupe das Ende nennt, nennt der Rest der Welt einen Schmetterling.",
      textEN: "What the caterpillar calls the end of the world, the rest of the world calls a butterfly.",
      categories: ['transformation', 'perspective']
    },
    {
      text: "Die Bindung, die deine wahre Familie verbindet, ist nicht die des Blutes, sondern die des Respekts und der Freude.",
      textEN: "The bond that links your true family is not one of blood, but of respect and joy.",
      categories: ['family', 'love']
    },
    {
      text: "Du lehrst am besten, was du am meisten lernen musst.",
      textEN: "You teach best what you most need to learn.",
      categories: ['teaching', 'learning']
    },
    {
      text: "Deine Freunde werden dich besser kennen in der ersten Minute, als deine Bekannten in tausend Jahren.",
      textEN: "Your friends will know you better in the first minute than your acquaintances will know you in a thousand years.",
      categories: ['friendship', 'connection']
    }
  ],
  'augustinus-aurelius': [
    {
      text: "Die Welt ist ein Buch, und wer nie reist, liest nur eine Seite.",
      textEN: "The world is a book, and those who do not travel read only one page.",
      categories: ['travel', 'experience']
    },
    {
      text: "Liebe ist das Gewicht der Seele.",
      textEN: "Love is the weight of the soul.",
      categories: ['love', 'soul']
    },
    {
      text: "Der Mensch ist ein Abgrund, es schwindelt einen, wenn man hinabsieht.",
      textEN: "Man is an abyss, it makes one dizzy to look down.",
      categories: ['humanity', 'depth']
    },
    {
      text: "Glaube, um zu verstehen.",
      textEN: "Believe in order to understand.",
      categories: ['faith', 'understanding']
    },
    {
      text: "In dir muss brennen, was du in anderen entzünden willst.",
      textEN: "You must burn within you what you want to kindle in others.",
      categories: ['passion', 'inspiration']
    }
  ],
  'moliere': [
    {
      text: "Es sind nicht nur die großen Dinge, die uns auf den rechten Weg bringen. Die kleinen, häufiger wiederholten Freundlichkeiten sind es, die das Herz erobern.",
      textEN: "It is not only the great things that put us on the right path. The small, frequently repeated kindnesses are what conquer the heart.",
      categories: ['kindness', 'love']
    },
    {
      text: "Je größer das Hindernis, desto größer die Ehre, es zu überwinden.",
      textEN: "The greater the obstacle, the more glory in overcoming it.",
      categories: ['obstacles', 'achievement']
    },
    {
      text: "Man soll mit dem Essen aufhören, wenn es am besten schmeckt.",
      textEN: "One should eat to live, not live to eat.",
      categories: ['moderation', 'wisdom']
    },
    {
      text: "Die Menschen gleichen sich in den Worten, aber an den Taten erkennt man die Unterschiede.",
      textEN: "People are alike in their words, but it is in their deeds that we recognize the differences.",
      categories: ['actions', 'character']
    },
    {
      text: "Ein gelehrter Narr ist närrischer als ein unwissender Narr.",
      textEN: "A learned fool is more foolish than an ignorant fool.",
      categories: ['knowledge', 'wisdom']
    }
  ],
  'kay-alan': [
    {
      text: "Die beste Art, die Zukunft vorauszusagen, ist, sie zu erfinden.",
      textEN: "The best way to predict the future is to invent it.",
      categories: ['future', 'innovation']
    },
    {
      text: "Technologie ist alles, was nach deiner Geburt erfunden wurde.",
      textEN: "Technology is anything that was invented after you were born.",
      categories: ['technology', 'perspective']
    },
    {
      text: "Einfache Dinge sollten einfach sein, komplexe Dinge sollten möglich sein.",
      textEN: "Simple things should be simple, complex things should be possible.",
      categories: ['simplicity', 'design']
    },
    {
      text: "Der Computer ist das bemerkenswerteste Werkzeug, das wir je bekommen haben.",
      textEN: "The computer is the most remarkable tool we've ever come up with.",
      categories: ['technology', 'tools']
    },
    {
      text: "Perspektive ist 80 IQ-Punkte wert.",
      textEN: "Perspective is worth 80 IQ points.",
      categories: ['perspective', 'intelligence']
    }
  ],
  'saunders-cicely': [
    {
      text: "Du zählst, weil du du bist, und du zählst bis zum letzten Moment deines Lebens.",
      textEN: "You matter because you are you, and you matter to the last moment of your life.",
      categories: ['dignity', 'life']
    },
    {
      text: "Wie Menschen sterben, bleibt in der Erinnerung derer, die leben.",
      textEN: "How people die remains in the memory of those who live on.",
      categories: ['death', 'memory']
    },
    {
      text: "Wir können dem Leben nicht mehr Tage geben, aber den Tagen mehr Leben.",
      textEN: "We cannot add days to life, but we can add life to days.",
      categories: ['life', 'quality']
    },
    {
      text: "Leiden ist nur unerträglich, wenn niemand sich kümmert.",
      textEN: "Suffering is only intolerable when nobody cares.",
      categories: ['suffering', 'compassion']
    },
    {
      text: "Das Leben ist ein Geschenk, und es verdient unsere Dankbarkeit.",
      textEN: "Life is a gift, and it deserves our gratitude.",
      categories: ['life', 'gratitude']
    }
  ],
  'keller-gottfried': [
    {
      text: "Achte jedes Menschen Vaterland, aber das deinige liebe.",
      textEN: "Respect every person's homeland, but love your own.",
      categories: ['homeland', 'respect']
    },
    {
      text: "Die Zeit verwandelt uns nicht, sie entfaltet uns nur.",
      textEN: "Time does not transform us, it only unfolds us.",
      categories: ['time', 'growth']
    },
    {
      text: "Es gibt Leute, deren Herzen gerade so viel Wärme haben, um sich selbst warm zu halten.",
      textEN: "There are people whose hearts have just enough warmth to keep themselves warm.",
      categories: ['selfishness', 'humanity']
    },
    {
      text: "Wer heute einen Gedanken sät, erntet morgen die Tat.",
      textEN: "Who sows a thought today, reaps the deed tomorrow.",
      categories: ['thought', 'action']
    },
    {
      text: "Am Grunde des Herzens eines jeden Winters liegt ein Frühlingsahnen.",
      textEN: "At the bottom of every winter's heart lies a spring's premonition.",
      categories: ['hope', 'seasons']
    }
  ],
  'beuys-joseph': [
    {
      text: "Jeder Mensch ist ein Künstler.",
      textEN: "Everyone is an artist.",
      categories: ['art', 'humanity']
    },
    {
      text: "Die Mysterien finden im Hauptbahnhof statt.",
      textEN: "The mysteries take place at the main station.",
      categories: ['art', 'everyday']
    },
    {
      text: "Kunst ist ja Therapie.",
      textEN: "Art is therapy.",
      categories: ['art', 'healing']
    },
    {
      text: "Denken ist Plastik.",
      textEN: "Thinking is sculpture.",
      categories: ['thinking', 'art']
    },
    {
      text: "Das ist meine Waffe: die Kreativität.",
      textEN: "This is my weapon: creativity.",
      categories: ['creativity', 'power']
    }
  ],
  'lloyd-george-david': [
    {
      text: "Man kann nicht über einen Abgrund in zwei kleinen Sprüngen springen.",
      textEN: "You cannot cross a chasm in two small jumps.",
      categories: ['courage', 'commitment']
    },
    {
      text: "Was ist unsere Aufgabe? Krieg gegen eine monströse Tyrannei zu führen.",
      textEN: "What is our task? To make war against a monstrous tyranny.",
      categories: ['justice', 'courage']
    },
    {
      text: "Die feinste Klinge wird durch den härtesten Stein geschärft.",
      textEN: "The finest blade is sharpened by the hardest stone.",
      categories: ['adversity', 'strength']
    },
    {
      text: "Mut ist ansteckend.",
      textEN: "Courage is contagious.",
      categories: ['courage', 'influence']
    },
    {
      text: "Es gibt keinen größeren Fehler als nichts zu tun, weil man nur wenig tun kann.",
      textEN: "There is no greater mistake than to do nothing because you can only do a little.",
      categories: ['action', 'effort']
    }
  ],
  'shaw-george-bernard': [
    {
      text: "Der einzige Mensch, der sich vernünftig benimmt, ist mein Schneider.",
      textEN: "The only man who behaves sensibly is my tailor.",
      categories: ['humor', 'society']
    },
    {
      text: "Wir hören auf zu spielen, nicht weil wir alt werden. Wir werden alt, weil wir aufhören zu spielen.",
      textEN: "We don't stop playing because we grow old; we grow old because we stop playing.",
      categories: ['youth', 'play']
    },
    {
      text: "Der größte Sünder hat eine Zukunft, selbst wie der größte Heilige eine Vergangenheit hat.",
      textEN: "The greatest sinner has a future, even as the greatest saint has a past.",
      categories: ['redemption', 'humanity']
    },
    {
      text: "Menschen, die behaupten, es gäbe keine schlechte Publicity, wurden noch nie öffentlich lächerlich gemacht.",
      textEN: "People who say there's no such thing as bad publicity have never been publicly ridiculed.",
      categories: ['reputation', 'public']
    },
    {
      text: "Erfolg besteht darin, dass man genau die Fähigkeiten hat, die im Moment gefragt sind.",
      textEN: "Success consists of having exactly the skills that are in demand at the moment.",
      categories: ['success', 'skills']
    }
  ],
  'siena-katharina': [
    {
      text: "Beginne tapfer, denn die Seele hat keine andere Krankheit als die Sünde.",
      textEN: "Start being brave, for the soul has no other sickness than sin.",
      categories: ['courage', 'soul']
    },
    {
      text: "Alles kommt von der Liebe, alles ist auf das Heil der Menschen hingeordnet.",
      textEN: "Everything comes from love, everything is ordered for the salvation of humanity.",
      categories: ['love', 'salvation']
    },
    {
      text: "Die Seele kann ohne Gott nicht leben.",
      textEN: "The soul cannot live without God.",
      categories: ['soul', 'faith']
    },
    {
      text: "Seid sanftmütig, niemals grausam.",
      textEN: "Be gentle, never cruel.",
      categories: ['gentleness', 'kindness']
    },
    {
      text: "Wir wurden für nichts Geringeres geschaffen als für die Liebe.",
      textEN: "We were created for nothing less than love.",
      categories: ['love', 'purpose']
    }
  ]
};

async function expandQuotes() {
  console.log('🚀 Expanding next batch of authors with quotes...\n');

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