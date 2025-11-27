import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Processing German quotes only...\n');

const filePath = join(__dirname, '..', 'services/data/quotes/de.ts');
console.log(`📖 File: ${filePath}`);

// Read file
const content = readFileSync(filePath, 'utf-8');

// Find array boundaries more carefully
const lines = content.split('\n');
let arrayStart = -1;
let arrayEnd = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('= [')) {
    arrayStart = content.indexOf('[', content.indexOf(lines[i]));
  }
  if (lines[i].trim() === '];') {
    arrayEnd = content.indexOf('];', arrayStart);
    break;
  }
}

console.log(`Array bounds: start=${arrayStart}, end=${arrayEnd}`);

if (arrayStart === -1 || arrayEnd === -1) {
  console.error('❌ Could not find array');
  process.exit(1);
}

const arrayContent = content.substring(arrayStart, arrayEnd + 1);

// Parse JSON
let quotes;
try {
  quotes = JSON.parse(arrayContent);
  console.log(`✅ Parsed ${quotes.length} quotes`);
} catch (error) {
  console.error('❌ Parse error:', error.message);
  // Try to find the issue
  console.log('First 500 chars of array:', arrayContent.substring(0, 500));
  process.exit(1);
}

// Deduplicate
const seen = new Set();
const unique = [];
let removed = 0;

quotes.forEach(quote => {
  if (!seen.has(quote.text)) {
    unique.push(quote);
    seen.add(quote.text);
  } else {
    removed++;
  }
});

console.log(`\n📊 Results:`);
console.log(`   Before:  ${quotes.length}`);
console.log(`   After:   ${unique.length}`);
console.log(`   Removed: ${removed}`);

// Backup
const backupPath = `${filePath}.backup-${Date.now()}`;
writeFileSync(backupPath, content, 'utf-8');
console.log(`\n💾 Backup: ${backupPath}`);

// Write new
const newContent = `import { EnhancedQuote } from '../../contentLoader';

export const quotesDE: Omit<EnhancedQuote, 'author'>[] = ${JSON.stringify(unique, null, 2)};
`;

writeFileSync(filePath, newContent, 'utf-8');
console.log(`✨ File updated!\n`);
