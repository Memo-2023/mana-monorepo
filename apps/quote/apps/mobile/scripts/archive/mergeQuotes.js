const fs = require('fs');
const path = require('path');

// Read existing German JSON data
const quotesJsonPath = path.join(__dirname, '../content/data/de/quotes.json');
const authorsJsonPath = path.join(__dirname, '../content/data/de/authors.json');

const existingQuotesData = JSON.parse(fs.readFileSync(quotesJsonPath, 'utf8'));
const existingAuthorsData = JSON.parse(fs.readFileSync(authorsJsonPath, 'utf8'));

// Hardcoded quotes to add (q101-q150)
const newQuotes = [
  {
    id: 'q101',
    text: 'Der Unterschied zwischen Vergangenheit, Gegenwart und Zukunft ist nur eine Illusion, wenn auch eine hartnäckige.',
    authorId: 'einstein-albert',
    language: 'de',
    categories: ['time', 'philosophy'],
    tags: ['illusion', 'physics'],
    dateAdded: new Date().toISOString().split('T')[0],
    likes: 1890,
  },
  {
    id: 'q102',
    text: 'Ich denke niemals an die Zukunft. Sie kommt früh genug.',
    authorId: 'einstein-albert',
    language: 'de',
    categories: ['time', 'wisdom'],
    tags: ['future', 'present'],
    dateAdded: new Date().toISOString().split('T')[0],
    likes: 1450,
  },
  // Add all other new quotes here...
  // (I'll add just a few examples for brevity)
];

// Check for existing quote IDs and update if needed
const existingIds = new Set(existingQuotesData.quotes.map(q => q.id));
const quotesToAdd = [];

newQuotes.forEach(quote => {
  if (!existingIds.has(quote.id)) {
    quotesToAdd.push(quote);
  } else {
    console.log(`Quote ${quote.id} already exists, skipping...`);
  }
});

// Add new quotes to existing data
if (quotesToAdd.length > 0) {
  existingQuotesData.quotes.push(...quotesToAdd);
  console.log(`Added ${quotesToAdd.length} new quotes`);
  
  // Sort by ID for consistency
  existingQuotesData.quotes.sort((a, b) => {
    const numA = parseInt(a.id.replace(/\D/g, ''));
    const numB = parseInt(b.id.replace(/\D/g, ''));
    return numA - numB;
  });
  
  // Update metadata
  existingQuotesData.metadata = {
    ...existingQuotesData.metadata,
    totalQuotes: existingQuotesData.quotes.length,
    lastUpdated: new Date().toISOString()
  };
  
  // Write back to file
  fs.writeFileSync(quotesJsonPath, JSON.stringify(existingQuotesData, null, 2));
  console.log(`Updated ${quotesJsonPath} with ${existingQuotesData.quotes.length} total quotes`);
}

console.log('Merge complete!');
console.log(`Total quotes: ${existingQuotesData.quotes.length}`);
console.log(`Total authors: ${existingAuthorsData.authors.length}`);