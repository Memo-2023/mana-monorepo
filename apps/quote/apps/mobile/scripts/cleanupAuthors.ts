/**
 * Script to clean up author data:
 * 1. Remove duplicate authors
 * 2. Remove redundant biography data (keep only essential fields)
 * 3. Ensure consistency
 */

import * as fs from 'fs';
import * as path from 'path';

interface Author {
  id: string;
  name: string;
  profession?: string[];
  biography?: any;
  lifespan?: {
    birth?: string;
    death?: string;
  };
  verified?: boolean;
  featured?: boolean;
  image?: any;
  nationality?: string[];
  links?: any;
}

function cleanupAuthors(filePath: string) {
  console.log(`\nProcessing: ${path.basename(filePath)}`);
  
  // Read the file
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Extract the authors array
  const match = content.match(/export const authors[A-Z]{2}: Author\[\] = (\[[\s\S]*?\]);/);
  if (!match) {
    console.error('Could not find authors array in file');
    return;
  }
  
  // Parse the authors array (safely)
  let authorsString = match[1];
  
  // Convert to valid JSON (handle trailing commas, etc)
  authorsString = authorsString
    .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
    .replace(/'/g, '"') // Replace single quotes with double quotes
    .replace(/(\w+):/g, '"$1":') // Quote property names
    .replace(/"\s*"([^"]+)":/g, '"$1":'); // Fix double-quoted property names
  
  let authors: Author[];
  try {
    // Use eval to parse the TypeScript object notation
    // Note: This is safe because we're processing our own code
    eval(`authors = ${authorsString}`);
  } catch (error) {
    console.error('Error parsing authors:', error);
    return;
  }
  
  console.log(`Found ${authors.length} authors`);
  
  // Remove duplicates (keep the first occurrence)
  const seen = new Set<string>();
  const uniqueAuthors: Author[] = [];
  const duplicates: string[] = [];
  
  for (const author of authors) {
    if (seen.has(author.id)) {
      duplicates.push(author.id);
    } else {
      seen.add(author.id);
      
      // Clean up biography - remove redundant data since we load from Markdown
      if (author.biography) {
        // Keep only minimal biography info as fallback
        author.biography = {
          short: author.biography.short || `${author.name} - ${(author.profession || []).join(', ')}`
        };
      }
      
      uniqueAuthors.push(author);
    }
  }
  
  console.log(`Removed ${duplicates.length} duplicates:`, duplicates);
  console.log(`Unique authors: ${uniqueAuthors.length}`);
  
  // Reconstruct the file
  const importStatement = content.substring(0, content.indexOf('export const'));
  const exportName = path.basename(filePath, '.ts') === 'de' ? 'authorsDE' : 'authorsEN';
  
  // Format authors array
  const authorsFormatted = uniqueAuthors.map(author => {
    // Clean up the author object
    const cleaned: any = {
      id: author.id,
      name: author.name
    };
    
    if (author.profession && author.profession.length > 0) {
      cleaned.profession = author.profession;
    }
    
    // Minimal biography as fallback
    cleaned.biography = {
      short: author.biography?.short || `${author.name} ist ein bedeutender Denker.`
    };
    
    if (author.lifespan) {
      cleaned.lifespan = author.lifespan;
    }
    
    if (author.verified !== undefined) {
      cleaned.verified = author.verified;
    }
    
    if (author.featured !== undefined) {
      cleaned.featured = author.featured;
    }
    
    if (author.nationality) {
      cleaned.nationality = author.nationality;
    }
    
    if (author.image) {
      cleaned.image = author.image;
    }
    
    if (author.links) {
      cleaned.links = author.links;
    }
    
    return cleaned;
  });
  
  // Write the cleaned file
  const newContent = `${importStatement}export const ${exportName}: Author[] = ${JSON.stringify(authorsFormatted, null, 2)
    .replace(/"([^"]+)":/g, '"$1":')  // Keep quotes on property names for consistency
    .replace(/\n/g, '\n')};
`;
  
  // Backup original file
  const backupPath = filePath.replace('.ts', '.backup.ts');
  fs.copyFileSync(filePath, backupPath);
  console.log(`Created backup: ${backupPath}`);
  
  // Write cleaned file
  fs.writeFileSync(filePath, newContent, 'utf-8');
  console.log(`✓ Cleaned and saved: ${path.basename(filePath)}`);
  
  return {
    total: authors.length,
    unique: uniqueAuthors.length,
    duplicates: duplicates.length
  };
}

async function main() {
  console.log('=== Cleaning up author data ===\n');
  
  const deFile = path.join(process.cwd(), 'services', 'data', 'authors', 'de.ts');
  const enFile = path.join(process.cwd(), 'services', 'data', 'authors', 'en.ts');
  
  // Clean German file
  if (fs.existsSync(deFile)) {
    const deStats = cleanupAuthors(deFile);
    if (deStats) {
      console.log(`\nGerman file: ${deStats.total} → ${deStats.unique} authors (${deStats.duplicates} duplicates removed)`);
    }
  }
  
  // Clean English file
  if (fs.existsSync(enFile)) {
    const enStats = cleanupAuthors(enFile);
    if (enStats) {
      console.log(`\nEnglish file: ${enStats.total} → ${enStats.unique} authors (${enStats.duplicates} duplicates removed)`);
    }
  }
  
  console.log('\n=== Cleanup complete! ===');
  console.log('Note: Backup files created with .backup.ts extension');
  console.log('Biography data is now loaded from Markdown files via the build process.');
}

main().catch(console.error);