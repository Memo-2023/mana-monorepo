#!/usr/bin/env node

/**
 * Script to fix malformed biography structures in author data files
 * Adds missing "sections" wrapper object around biography sections
 */

import * as fs from 'fs';
import * as path from 'path';

function fixBiographyStructures(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  let inBiography = false;
  let shortBioFound = false;
  let sectionsStarted = false;
  let fixedLines: string[] = [];
  let indentLevel = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Detect start of biography object
    if (trimmed === '"biography": {') {
      inBiography = true;
      shortBioFound = false;
      sectionsStarted = false;
      fixedLines.push(line);
      indentLevel = line.indexOf('"');
      continue;
    }
    
    // Detect end of biography object
    if (inBiography && trimmed === '},') {
      // Check if we need to close sections before closing biography
      if (sectionsStarted) {
        fixedLines.push(' '.repeat(indentLevel + 2) + '},'); // Close sections
      }
      inBiography = false;
      fixedLines.push(line);
      continue;
    }
    
    // Inside biography object
    if (inBiography) {
      // Check for short biography
      if (trimmed.startsWith('"short":')) {
        fixedLines.push(line);
        shortBioFound = true;
        
        // Check if next line is a section (not long, keyAchievements, or famousQuote)
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          const isSectionStart = nextLine.match(/^"(teacher|politician|wanderer|basel|weimar|exile|return|master|zarathustra|madness|earlyLife|patentClerk|riseToProminence|breakthrough|finalYears|earlyCareer|vienna|rome|composer|parisian|salon|court|renaissance|artist|polymath|warrior|philosopher|enlightenment|minister)": \{/);
          
          if (isSectionStart) {
            // Add comma after short bio if not present
            if (!line.endsWith(',')) {
              fixedLines[fixedLines.length - 1] = line + ',';
            }
            // Add sections wrapper
            fixedLines.push(' '.repeat(indentLevel + 2) + '"sections": {');
            sectionsStarted = true;
          }
        }
        continue;
      }
      
      // Check for long biography
      if (trimmed.startsWith('"long":')) {
        // If sections were started, close them first
        if (sectionsStarted) {
          fixedLines.push(' '.repeat(indentLevel + 2) + '},'); // Close sections
          sectionsStarted = false;
        }
        fixedLines.push(line);
        
        // Check if next line is a section
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          const isSectionStart = nextLine.match(/^"(teacher|politician|wanderer|basel|weimar|exile|return|master|zarathustra|madness|earlyLife|patentClerk|riseToProminence|breakthrough|finalYears|earlyCareer|vienna|rome|composer|parisian|salon|court|renaissance|artist|polymath|warrior|philosopher|enlightenment|minister)": \{/);
          
          if (isSectionStart) {
            // Add comma after long bio if not present
            if (!line.endsWith(',')) {
              fixedLines[fixedLines.length - 1] = line + ',';
            }
            // Add sections wrapper
            fixedLines.push(' '.repeat(indentLevel + 2) + '"sections": {');
            sectionsStarted = true;
          }
        }
        continue;
      }
      
      // Check for keyAchievements or famousQuote (these come after sections)
      if (trimmed.startsWith('"keyAchievements":') || trimmed.startsWith('"famousQuote":')) {
        // Close sections if they were started
        if (sectionsStarted) {
          fixedLines.push(' '.repeat(indentLevel + 2) + '},'); // Close sections
          sectionsStarted = false;
        }
        fixedLines.push(line);
        continue;
      }
    }
    
    // Default: keep line as is
    fixedLines.push(line);
  }
  
  return fixedLines.join('\n');
}

// Fix de.ts file
const deFile = path.join(process.cwd(), 'services', 'data', 'authors', 'de.ts');
if (fs.existsSync(deFile)) {
  console.log('Fixing services/data/authors/de.ts...');
  const fixed = fixBiographyStructures(deFile);
  fs.writeFileSync(deFile, fixed, 'utf-8');
  console.log('✓ Fixed de.ts');
}

// Fix en.ts file
const enFile = path.join(process.cwd(), 'services', 'data', 'authors', 'en.ts');
if (fs.existsSync(enFile)) {
  console.log('Fixing services/data/authors/en.ts...');
  const fixed = fixBiographyStructures(enFile);
  fs.writeFileSync(enFile, fixed, 'utf-8');
  console.log('✓ Fixed en.ts');
}

console.log('\nDone! Biography structures have been fixed.');