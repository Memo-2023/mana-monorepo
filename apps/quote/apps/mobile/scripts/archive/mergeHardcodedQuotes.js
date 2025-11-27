#!/usr/bin/env node

/**
 * Script to merge hardcoded quotes from contentLoader.ts into JSON files
 */

const fs = require('fs');
const path = require('path');

// Hardcoded quotes from contentLoader.ts
const hardcodedQuotes = [
  {
    id: 'q1',
    text: 'Phantasie ist wichtiger als Wissen, denn Wissen ist begrenzt.',
    authorId: 'einstein-albert',
    categories: ['wisdom', 'creativity'],
    tags: ['imagination', 'knowledge'],
    featured: true,
    likes: 1250,
  },
  {
    id: 'q2',
    text: 'Zwei Dinge sind unendlich: das Universum und die menschliche Dummheit; aber bei dem Universum bin ich mir noch nicht ganz sicher.',
    authorId: 'einstein-albert',
    categories: ['humor', 'wisdom'],
    featured: true,
    likes: 2340,
  },
  // Add all other hardcoded quotes...
];

// Hardcoded authors from contentLoader.ts
const hardcodedAuthors = [
  {
    id: 'einstein-albert',
    name: 'Albert Einstein',
    profession: ['Physiker', 'Philosoph'],
    biography: {
      short: 'Theoretischer Physiker, der die Relativitätstheorie entwickelte.',
    },
    lifespan: { birth: '1879-03-14', death: '1955-04-18' },
    verified: true,
    featured: true,
  },
  // Add all other hardcoded authors...
];

function mergeQuotes() {
  const quotesPath = path.join(__dirname, '../content/data/de/quotes.json');
  const authorsPath = path.join(__dirname, '../content/data/de/authors.json');
  
  // Load existing JSON data
  const quotesData = JSON.parse(fs.readFileSync(quotesPath, 'utf8'));
  const authorsData = JSON.parse(fs.readFileSync(authorsPath, 'utf8'));
  
  console.log(`📚 Current German quotes: ${quotesData.quotes.length}`);
  console.log(`👥 Current German authors: ${authorsData.authors.length}`);
  
  // Check if hardcoded quotes are missing from JSON
  const existingQuoteIds = new Set(quotesData.quotes.map(q => q.id));
  const missingQuotes = hardcodedQuotes.filter(q => !existingQuoteIds.has(q.id));
  
  console.log(`🔍 Found ${missingQuotes.length} missing quotes from hardcoded data`);
  
  if (missingQuotes.length > 0) {
    // Convert hardcoded quotes to proper format
    const formattedQuotes = missingQuotes.map(quote => ({
      ...quote,
      language: 'de',
      dateAdded: new Date().toISOString().split('T')[0]
    }));
    
    // Add missing quotes
    quotesData.quotes.push(...formattedQuotes);
    
    // Save updated quotes file
    fs.writeFileSync(quotesPath, JSON.stringify(quotesData, null, 2), 'utf8');
    console.log(`✅ Added ${missingQuotes.length} quotes to German JSON`);
  }
  
  // Check authors
  const existingAuthorIds = new Set(authorsData.authors.map(a => a.id));
  const missingAuthors = hardcodedAuthors.filter(a => !existingAuthorIds.has(a.id));
  
  console.log(`🔍 Found ${missingAuthors.length} missing authors from hardcoded data`);
  
  if (missingAuthors.length > 0) {
    authorsData.authors.push(...missingAuthors);
    fs.writeFileSync(authorsPath, JSON.stringify(authorsData, null, 2), 'utf8');
    console.log(`✅ Added ${missingAuthors.length} authors to German JSON`);
  }
  
  console.log(`📊 Final stats:`);
  console.log(`  German quotes: ${quotesData.quotes.length}`);
  console.log(`  German authors: ${authorsData.authors.length}`);
}

// For now, let's just analyze the data without merging
function analyzeData() {
  const quotesPath = path.join(__dirname, '../content/data/de/quotes.json');
  const authorsPath = path.join(__dirname, '../content/data/de/authors.json');
  
  try {
    const quotesData = JSON.parse(fs.readFileSync(quotesPath, 'utf8'));
    const authorsData = JSON.parse(fs.readFileSync(authorsPath, 'utf8'));
    
    console.log(`📚 Current German quotes: ${quotesData.quotes.length}`);
    console.log(`👥 Current German authors: ${authorsData.authors.length}`);
    
    // Sample some quote IDs to see the format
    console.log(`\n🔍 Sample quote IDs:`);
    quotesData.quotes.slice(0, 10).forEach(q => {
      console.log(`  ${q.id}: ${q.text.substring(0, 50)}...`);
    });
    
    console.log(`\n👤 Sample author IDs:`);
    authorsData.authors.slice(0, 10).forEach(a => {
      console.log(`  ${a.id}: ${a.name}`);
    });
    
  } catch (error) {
    console.error('Error analyzing data:', error);
  }
}

if (require.main === module) {
  analyzeData();
}

module.exports = { mergeQuotes, analyzeData };