#!/usr/bin/env node

/**
 * Script to remove duplicate authors and simplify biographies
 */

import * as fs from 'fs';
import * as path from 'path';

function processAuthorFile(filePath: string) {
  console.log(`\nProcessing: ${path.basename(filePath)}`);
  
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // List of known duplicate IDs to remove (keep first occurrence)
  const duplicateIds = [
    'aristoteles',
    'aurelius-marcus', 
    'bacon-francis',
    'brecht-bertolt',
    'demokrit',
    'drucker-peter',
    'ford-henry',
    'hesse-hermann',
    'kaestner-erich',
    'kafka-franz',
    'lasorda-tommy',
    'roosevelt-eleanor',
    'rousseau-jean-jacques',
    'sokrates',
    'swindoll-charles'
  ];
  
  // Track which IDs we've seen
  const seenIds = new Set<string>();
  let changesMade = false;
  
  // Process each duplicate
  for (const duplicateId of duplicateIds) {
    const regex = new RegExp(
      `(\\{[^{}]*"id"\\s*:\\s*"${duplicateId}"[^}]*?(?:\\{[^}]*\\}[^}]*?)*?\\})(?=,\\s*\\{|\\s*\\])`,
      'gs'
    );
    
    const matches = content.match(regex);
    if (matches && matches.length > 1) {
      console.log(`Found ${matches.length} instances of ${duplicateId}`);
      
      // Keep only the first match
      for (let i = 1; i < matches.length; i++) {
        const toRemove = matches[i];
        // Remove the duplicate entry and its trailing comma if present
        content = content.replace(`,\n  ${toRemove}`, '');
        content = content.replace(`,\n${toRemove}`, '');
        content = content.replace(`${toRemove},`, '');
        changesMade = true;
      }
    }
  }
  
  // Now simplify all biographies - keep only short description as fallback
  // The detailed biographies come from Markdown files
  const biographyRegex = /"biography":\s*\{[^}]*(?:\{[^}]*\}[^}]*)*?\}/g;
  
  content = content.replace(biographyRegex, (match) => {
    // Extract just the short description if it exists
    const shortMatch = match.match(/"short":\s*"([^"]*)"/);
    if (shortMatch) {
      changesMade = true;
      return `"biography": {\n      "short": "${shortMatch[1]}"\n    }`;
    }
    return match;
  });
  
  if (changesMade) {
    // Create backup
    const backupPath = filePath.replace('.ts', '.backup.ts');
    fs.copyFileSync(filePath, backupPath);
    console.log(`Created backup: ${backupPath}`);
    
    // Save cleaned file
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ Cleaned and saved: ${path.basename(filePath)}`);
  } else {
    console.log(`No changes needed for ${path.basename(filePath)}`);
  }
  
  return changesMade;
}

async function main() {
  console.log('=== Removing duplicate authors and simplifying biographies ===');
  
  const authorsPath = path.join(process.cwd(), 'services', 'data', 'authors');
  const deFile = path.join(authorsPath, 'de.ts');
  const enFile = path.join(authorsPath, 'en.ts');
  
  let changesDE = false;
  let changesEN = false;
  
  if (fs.existsSync(deFile)) {
    changesDE = processAuthorFile(deFile);
  } else {
    console.error('German authors file not found');
  }
  
  if (fs.existsSync(enFile)) {
    changesEN = processAuthorFile(enFile);
  } else {
    console.error('English authors file not found');
  }
  
  console.log('\n=== Summary ===');
  console.log(`German file: ${changesDE ? '✓ Updated' : '○ No changes'}`);
  console.log(`English file: ${changesEN ? '✓ Updated' : '○ No changes'}`);
  
  if (changesDE || changesEN) {
    console.log('\n✨ Cleanup complete! Backup files created with .backup.ts extension');
    console.log('📚 Biographies are now loaded from Markdown files via the build process');
  } else {
    console.log('\n✅ No cleanup needed - files are already clean');
  }
}

main().catch(console.error);