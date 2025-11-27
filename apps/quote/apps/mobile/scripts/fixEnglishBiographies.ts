#!/usr/bin/env node

/**
 * Fix all biography formatting issues in en.ts
 */

import * as fs from 'fs';
import * as path from 'path';

function fixBiographies(content: string): string {
  const lines = content.split('\n');
  const result: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Check for pattern: "short": "...text...",
    // followed by },
    if (trimmed.startsWith('"short":') && trimmed.endsWith(',') && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      
      if (nextLine === '},') {
        // Remove the trailing comma from the short line
        result.push(line.replace(/,$/, ''));
        continue;
      }
    }
    
    result.push(line);
  }
  
  return result.join('\n');
}

// Fix en.ts
const enFile = path.join(process.cwd(), 'services', 'data', 'authors', 'en.ts');
if (fs.existsSync(enFile)) {
  console.log('Fixing en.ts biographies...');
  const content = fs.readFileSync(enFile, 'utf-8');
  const fixed = fixBiographies(content);
  fs.writeFileSync(enFile, fixed, 'utf-8');
  console.log('✓ Fixed en.ts');
}

console.log('\nDone!');