#!/usr/bin/env node

/**
 * Translation Script for quotes 61-100
 */

const fs = require('fs');
const path = require('path');

// Translations for quotes q-061 to q-100
const batch3Translations = {
  'q-061': { text: 'Education is the most powerful weapon which you can use to change the world.' },
  'q-062': { text: 'The only source of knowledge is experience.' },
  'q-063': { text: 'Live as if you were to die tomorrow. Learn as if you were to live forever.' },
  'q-064': { text: 'Be the change that you wish to see in the world.' },
  'q-065': { text: 'In a gentle way, you can shake the world.' },
  'q-066': { text: 'Where there is love there is life.' },
  'q-067': { text: 'Happiness is when what you think, what you say, and what you do are in harmony.' },
  'q-068': { text: 'The weak can never forgive. Forgiveness is the attribute of the strong.' },
  'q-069': { text: 'An eye for an eye only ends up making the whole world blind.' },
  'q-070': { text: 'The best way to find yourself is to lose yourself in the service of others.' },
  'q-071': { text: 'You must be the change you wish to see in the world.' },
  'q-072': { text: 'The future depends on what you do today.' },
  'q-073': { text: 'A nation\'s culture resides in the hearts and in the soul of its people.' },
  'q-074': { text: 'Glory lies in the attempt to reach one\'s goal and not in reaching it.' },
  'q-075': { text: 'Strength does not come from physical capacity. It comes from an indomitable will.' },
  'q-076': { text: 'The difference between what we do and what we are capable of doing would suffice to solve most of the world\'s problems.' },
  'q-077': { text: 'You can chain me, you can torture me, you can even destroy this body, but you will never imprison my mind.' },
  'q-078': { text: 'Nobody can hurt me without my permission.' },
  'q-079': { text: 'Hate the sin, love the sinner.' },
  'q-080': { text: 'Truth never damages a cause that is just.' },
  'q-081': { text: 'The only tyrant I accept in this world is the \'still voice within\'.' },
  'q-082': { text: 'My life is my message.' },
  'q-083': { text: 'Service which is rendered without joy helps neither the servant nor the served.' },
  'q-084': { text: 'Prayer is not asking. It is a longing of the soul.' },
  'q-085': { text: 'The good man is the friend of all living things.' },
  'q-086': { text: 'First they ignore you, then they laugh at you, then they fight you, then you win.' },
  'q-087': { text: 'Earth provides enough to satisfy every man\'s needs, but not every man\'s greed.' },
  'q-088': { text: 'The greatness of a nation can be judged by the way its animals are treated.' },
  'q-089': { text: 'There is more to life than increasing its speed.' },
  'q-090': { text: 'A small body of determined spirits fired by an unquenchable faith in their mission can alter the course of history.' },
  'q-091': { text: 'The essence of all religions is one. Only their approaches are different.' },
  'q-092': { text: 'Non-violence is a weapon of the strong.' },
  'q-093': { text: 'Satisfaction lies in the effort, not in the attainment.' },
  'q-094': { text: 'Freedom is not worth having if it does not include the freedom to make mistakes.' },
  'q-095': { text: 'To believe in something, and not to live it, is dishonest.' },
  'q-096': { text: 'The moment there is suspicion about a person\'s motives, everything he does becomes tainted.' },
  'q-097': { text: 'Intolerance is itself a form of violence and an obstacle to the growth of a true democratic spirit.' },
  'q-098': { text: 'You may never know what results come of your actions, but if you do nothing, there will be no results.' },
  'q-099': { text: 'Even if you are a minority of one, the truth is the truth.' },
  'q-100': { text: 'The light that burns twice as bright burns half as long.' }
};

async function translateBatch3() {
  console.log('📚 Starting Batch 3 Translation (q-061 to q-100)...\n');
  
  const enQuotesPath = path.join(__dirname, '../content/data/en/quotes.json');
  
  try {
    // Load current English quotes
    const enQuotes = JSON.parse(fs.readFileSync(enQuotesPath, 'utf8'));
    
    let translatedCount = 0;
    
    // Apply translations
    enQuotes.quotes.forEach((quote) => {
      const translation = batch3Translations[quote.id];
      if (translation) {
        quote.text = translation.text;
        if (translation.context) quote.context = translation.context;
        if (translation.source) quote.source = translation.source;
        translatedCount++;
      }
    });
    
    // Save updated file
    fs.writeFileSync(enQuotesPath, JSON.stringify(enQuotes, null, 2), 'utf8');
    
    console.log(`✅ Batch 3 complete: ${translatedCount} quotes translated`);
    console.log(`📊 Total translated so far: 60 + ${translatedCount} = ${60 + translatedCount} quotes`);
    
    return translatedCount;
    
  } catch (error) {
    console.error('❌ Batch 3 translation failed:', error);
    return 0;
  }
}

if (require.main === module) {
  translateBatch3();
}

module.exports = { translateBatch3 };