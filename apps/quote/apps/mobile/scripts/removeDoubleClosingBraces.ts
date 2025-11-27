#!/usr/bin/env node

/**
 * Remove double closing braces that are causing syntax errors
 */

import * as fs from 'fs';
import * as path from 'path';

function removeDoubleClosingBraces(content: string): string {
  const lines = content.split('\n');
  const result: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Check for double closing braces pattern
    if (trimmed === '},' && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      
      if (nextLine === '},') {
        // Skip the second closing brace
        continue;
      }
    }
    
    result.push(line);
  }
  
  return result.join('\n');
}

// Fix de.ts
const deFile = path.join(process.cwd(), 'services', 'data', 'authors', 'de.ts');
if (fs.existsSync(deFile)) {
  console.log('Removing double closing braces from de.ts...');
  const content = fs.readFileSync(deFile, 'utf-8');
  const fixed = removeDoubleClosingBraces(content);
  fs.writeFileSync(deFile, fixed, 'utf-8');
  console.log('✓ Fixed de.ts');
}

// Fix en.ts
const enFile = path.join(process.cwd(), 'services', 'data', 'authors', 'en.ts');
if (fs.existsSync(enFile)) {
  console.log('Removing double closing braces from en.ts...');
  const content = fs.readFileSync(enFile, 'utf-8');
  const fixed = removeDoubleClosingBraces(content);
  fs.writeFileSync(enFile, fixed, 'utf-8');
  console.log('✓ Fixed en.ts');
}

console.log('\nDone!');