const fs = require('fs');
const path = require('path');

async function deduplicateQuotes(filePath, language) {
  console.log(`\n📖 Processing ${language.toUpperCase()} quotes from: ${filePath}`);

  // Import the quotes dynamically
  const quotesModule = await import(filePath);
  const variableName = language === 'de' ? 'quotesDE' : 'quotesEN';
  const quotes = quotesModule[variableName];

  if (!quotes || !Array.isArray(quotes)) {
    console.error('❌ Could not load quotes array');
    return null;
  }

  console.log(`📊 Total quotes before deduplication: ${quotes.length}`);

  // Find duplicates by text
  const textMap = new Map();
  quotes.forEach(quote => {
    const existing = textMap.get(quote.text) || [];
    existing.push(quote);
    textMap.set(quote.text, existing);
  });

  // Identify duplicates
  const duplicates = [];
  textMap.forEach((quotesList, text) => {
    if (quotesList.length > 1) {
      duplicates.push({ text, quotes: quotesList });
    }
  });

  console.log(`\n🔍 Found ${duplicates.length} duplicate texts`);
  console.log(`📝 Total duplicate quote entries: ${duplicates.reduce((sum, d) => sum + d.quotes.length - 1, 0)}`);

  // Log some examples
  console.log('\n📋 Examples of duplicates:');
  duplicates.slice(0, 5).forEach((dup, index) => {
    console.log(`\n${index + 1}. Text: "${dup.text.substring(0, 80)}${dup.text.length > 80 ? '...' : ''}"`);
    console.log(`   Found ${dup.quotes.length} times with IDs: ${dup.quotes.map(q => q.id).join(', ')}`);
  });

  // Deduplicate: Keep the first occurrence of each text
  const uniqueQuotes = [];
  const seenTexts = new Set();

  quotes.forEach(quote => {
    if (!seenTexts.has(quote.text)) {
      uniqueQuotes.push(quote);
      seenTexts.add(quote.text);
    }
  });

  console.log(`\n✅ Quotes after deduplication: ${uniqueQuotes.length}`);
  console.log(`🗑️  Removed: ${quotes.length - uniqueQuotes.length} duplicate entries`);

  // Read original file for backup
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const backupPath = filePath + `.backup-${Date.now()}`;
  fs.writeFileSync(backupPath, fileContent);
  console.log(`\n💾 Backup created: ${backupPath}`);

  // Generate new file content
  const importStatement = "import { EnhancedQuote } from '../../contentLoader';";
  const newContent = `${importStatement}

export const ${variableName}: Omit<EnhancedQuote, 'author'>[] = ${JSON.stringify(uniqueQuotes, null, 2)};
`;

  // Write the deduplicated file
  fs.writeFileSync(filePath, newContent);
  console.log(`✨ File updated successfully: ${filePath}\n`);

  return {
    before: quotes.length,
    after: uniqueQuotes.length,
    removed: quotes.length - uniqueQuotes.length,
    duplicateTexts: duplicates.length
  };
}

// Main execution
async function main() {
  const projectRoot = path.join(__dirname, '..');

  console.log('🚀 Starting deduplication process...\n');
  console.log('='.repeat(60));

  const deResult = await deduplicateQuotes(
    path.join(projectRoot, 'services/data/quotes/de.ts'),
    'de'
  );

  console.log('='.repeat(60));

  const enResult = await deduplicateQuotes(
    path.join(projectRoot, 'services/data/quotes/en.ts'),
    'en'
  );

  console.log('='.repeat(60));
  console.log('\n📊 SUMMARY:');
  console.log('='.repeat(60));

  if (deResult) {
    console.log(`\n🇩🇪 German Quotes:`);
    console.log(`   Before: ${deResult.before}`);
    console.log(`   After:  ${deResult.after}`);
    console.log(`   Removed: ${deResult.removed}`);
  }

  if (enResult) {
    console.log(`\n🇬🇧 English Quotes:`);
    console.log(`   Before: ${enResult.before}`);
    console.log(`   After:  ${enResult.after}`);
    console.log(`   Removed: ${enResult.removed}`);
  }

  console.log('\n✅ Deduplication complete!\n');
}

main().catch(console.error);
