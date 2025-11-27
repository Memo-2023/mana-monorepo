#!/usr/bin/env node

/**
 * Fix all sections issues where sections: { is followed by lifespan
 */

import * as fs from 'fs';
import * as path from 'path';

function fixSectionsIssues(content: string): string {
  // Replace pattern where "sections": { is followed by "lifespan": {
  // This means the biography has no real sections and should be closed
  const pattern = /("short": "[^"]*")\s*,\s*"sections": \{\s*("lifespan": \{)/gm;
  const replacement = '$1\n    },\n    $2';
  
  return content.replace(pattern, replacement);
}

// Fix de.ts
const deFile = path.join(process.cwd(), 'services', 'data', 'authors', 'de.ts');
if (fs.existsSync(deFile)) {
  console.log('Fixing sections issues in de.ts...');
  const content = fs.readFileSync(deFile, 'utf-8');
  const fixed = fixSectionsIssues(content);
  fs.writeFileSync(deFile, fixed, 'utf-8');
  console.log('✓ Fixed de.ts');
}

// Fix en.ts  
const enFile = path.join(process.cwd(), 'services', 'data', 'authors', 'en.ts');
if (fs.existsSync(enFile)) {
  console.log('Fixing sections issues in en.ts...');
  const content = fs.readFileSync(enFile, 'utf-8');
  const fixed = fixSectionsIssues(content);
  fs.writeFileSync(enFile, fixed, 'utf-8');
  console.log('✓ Fixed en.ts');
}

console.log('\nDone!');