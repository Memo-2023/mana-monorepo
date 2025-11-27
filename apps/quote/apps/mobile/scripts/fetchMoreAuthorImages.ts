#!/usr/bin/env npx tsx

import { WikimediaImageService } from '../services/wikimediaImageService';
import fs from 'fs/promises';
import path from 'path';

interface ArchiveAuthor {
  id: string;
  name: string;
  profession: string[];
  verified?: boolean;
  featured?: boolean;
}

async function main() {
  console.log('🖼️  Fetching more author images from Wikimedia Commons...\n');

  // Read the archive authors file
  const archivePath = path.join(process.cwd(), 'content/archive/data/en/authors.json');
  const archiveData = JSON.parse(await fs.readFile(archivePath, 'utf-8'));
  const archiveAuthors: ArchiveAuthor[] = archiveData.authors;

  // Get authors we haven't processed yet (skip the first 17)
  const unprocessedAuthors = archiveAuthors
    .filter(author => author.verified !== false && author.id !== 'unbekannt')
    .slice(17, 25); // Get next 8 authors

  console.log(`📚 Processing ${unprocessedAuthors.length} additional authors:`);
  unprocessedAuthors.forEach(author => console.log(`   • ${author.name} (${author.id})`));
  console.log();

  // Search for images
  const results = await WikimediaImageService.searchMultipleAuthors(
    unprocessedAuthors.map(author => author.name)
  );

  // Display results
  console.log('🔍 Search Results:\n');
  results.forEach((result, index) => {
    const author = unprocessedAuthors[index];
    console.log(`📖 ${author.name} (${author.id}):`);
    
    if (result.found && result.imageInfo) {
      console.log(`   ✅ Found image: ${result.imageInfo.title}`);
      console.log(`   🔗 URL: ${result.imageInfo.url}`);
      console.log(`   👤 Credit: ${result.imageInfo.user}`);
      console.log(`   📐 Size: ${result.imageInfo.width}x${result.imageInfo.height}`);
    } else {
      console.log(`   ❌ Not found: ${result.error || 'Unknown error'}`);
    }
    console.log();
  });

  // Read existing results
  let allResults = [];
  const existingPath1 = path.join(process.cwd(), 'author-images-results.json');
  const existingPath2 = path.join(process.cwd(), 'author-images-results-batch2.json');
  
  try {
    const existing1 = JSON.parse(await fs.readFile(existingPath1, 'utf-8'));
    allResults.push(...existing1.authors);
  } catch (e) {
    console.log('No first batch file found');
  }
  
  try {
    const existing2 = JSON.parse(await fs.readFile(existingPath2, 'utf-8'));
    allResults.push(...existing2.authors);
  } catch (e) {
    console.log('No second batch file found');
  }

  // Add new results
  const newResults = results.map((result, index) => ({
    id: unprocessedAuthors[index].id,
    name: unprocessedAuthors[index].name,
    profession: unprocessedAuthors[index].profession,
    found: result.found,
    imageInfo: result.imageInfo,
    error: result.error
  }));
  
  allResults.push(...newResults);

  // Save combined results
  const combinedData = {
    timestamp: new Date().toISOString(),
    totalAuthors: allResults.length,
    authors: allResults
  };

  const combinedPath = path.join(process.cwd(), 'author-images-combined.json');
  await fs.writeFile(combinedPath, JSON.stringify(combinedData, null, 2), 'utf-8');
  console.log(`💾 Combined results saved to: ${combinedPath}`);

  // Summary
  const foundCount = newResults.filter(r => r.found).length;
  const totalFound = allResults.filter(r => r.found).length;
  
  console.log(`\n📊 New Batch Summary:`);
  console.log(`   • Found images: ${foundCount}/${newResults.length}`);
  console.log(`   • Success rate: ${Math.round((foundCount / newResults.length) * 100)}%`);
  
  console.log(`\n📊 Total Summary:`);
  console.log(`   • Total authors processed: ${allResults.length}`);
  console.log(`   • Total images found: ${totalFound}/${allResults.length}`);
  console.log(`   • Overall success rate: ${Math.round((totalFound / allResults.length) * 100)}%`);
}

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});