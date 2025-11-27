import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function deduplicateFile(filePath, language) {
  console.log(`\n📖 Processing ${language.toUpperCase()} quotes`);
  console.log(`   File: ${filePath}`);

  // Read file
  const content = readFileSync(filePath, 'utf-8');

  // Extract the array content between [ and ];
  const arrayStart = content.indexOf('[');
  const arrayEnd = content.lastIndexOf('];');

  if (arrayStart === -1 || arrayEnd === -1) {
    console.error('❌ Could not find array boundaries');
    return null;
  }

  const arrayContent = content.substring(arrayStart, arrayEnd + 1);

  // Parse JSON
  let quotes;
  try {
    quotes = JSON.parse(arrayContent);
  } catch (error) {
    console.error('❌ Parse error:', error.message);
    return null;
  }

  console.log(`📊 Total quotes before: ${quotes.length}`);

  // Track duplicates
  const textMap = new Map();
  const duplicates = [];

  quotes.forEach((quote, index) => {
    const text = quote.text;
    if (textMap.has(text)) {
      textMap.get(text).push({ quote, index });
    } else {
      textMap.set(text, [{ quote, index }]);
    }
  });

  // Find duplicates
  textMap.forEach((entries, text) => {
    if (entries.length > 1) {
      duplicates.push({ text, count: entries.length, ids: entries.map(e => e.quote.id) });
    }
  });

  console.log(`🔍 Found ${duplicates.length} duplicate texts`);

  // Show examples
  if (duplicates.length > 0) {
    console.log('\n📋 First 5 examples:');
    duplicates.slice(0, 5).forEach((dup, i) => {
      const shortText = dup.text.substring(0, 60) + (dup.text.length > 60 ? '...' : '');
      console.log(`   ${i + 1}. "${shortText}"`);
      console.log(`      IDs: ${dup.ids.join(', ')}`);
    });
  }

  // Deduplicate - keep first occurrence
  const unique = [];
  const seen = new Set();

  quotes.forEach(quote => {
    if (!seen.has(quote.text)) {
      unique.push(quote);
      seen.add(quote.text);
    }
  });

  console.log(`\n✅ After deduplication: ${unique.length}`);
  console.log(`🗑️  Removed: ${quotes.length - unique.length}`);

  // Create backup
  const timestamp = Date.now();
  const backupPath = `${filePath}.backup-${timestamp}`;
  writeFileSync(backupPath, content, 'utf-8');
  console.log(`💾 Backup: ${backupPath}`);

  // Write new file
  const varName = language === 'de' ? 'quotesDE' : 'quotesEN';
  const newContent = `import { EnhancedQuote } from '../../contentLoader';

export const ${varName}: Omit<EnhancedQuote, 'author'>[] = ${JSON.stringify(unique, null, 2)};
`;

  writeFileSync(filePath, newContent, 'utf-8');
  console.log(`✨ File updated!`);

  return {
    before: quotes.length,
    after: unique.length,
    removed: quotes.length - unique.length
  };
}

// Main
console.log('🚀 Starting deduplication...\n');
console.log('='.repeat(60));

const projectRoot = join(__dirname, '..');

const deResult = deduplicateFile(
  join(projectRoot, 'services/data/quotes/de.ts'),
  'de'
);

console.log('='.repeat(60));

const enResult = deduplicateFile(
  join(projectRoot, 'services/data/quotes/en.ts'),
  'en'
);

console.log('='.repeat(60));
console.log('\n📊 SUMMARY');
console.log('='.repeat(60));

if (deResult) {
  console.log(`\n🇩🇪 German:`);
  console.log(`   Before:  ${deResult.before}`);
  console.log(`   After:   ${deResult.after}`);
  console.log(`   Removed: ${deResult.removed}`);
}

if (enResult) {
  console.log(`\n🇬🇧 English:`);
  console.log(`   Before:  ${enResult.before}`);
  console.log(`   After:   ${enResult.after}`);
  console.log(`   Removed: ${enResult.removed}`);
}

console.log('\n✅ Complete!\n');
