#!/usr/bin/env npx tsx

import fs from 'fs/promises';
import path from 'path';

async function analyzeQuoteCounts() {
  console.log('📊 Analyzing quote counts per author...\n');

  // Load current data
  const quotesPath = path.join(process.cwd(), 'services/data/quotes/en.ts');
  const authorsPath = path.join(process.cwd(), 'services/data/authors/en.ts');
  
  const quotesContent = await fs.readFile(quotesPath, 'utf-8');
  const authorsContent = await fs.readFile(authorsPath, 'utf-8');
  
  // Extract quotes data
  const quotesMatch = quotesContent.match(/export const quotesEN[^=]+=\s*(\[[\s\S]*\]);/);
  const quotesData = eval(quotesMatch![1]);
  
  // Extract authors data
  const authorsMatch = authorsContent.match(/export const authorsEN[^=]+=\s*(\[[\s\S]*\]);/);
  const authorsData = eval(authorsMatch![1]);
  
  // Count quotes per author
  const quoteCounts = new Map<string, number>();
  quotesData.forEach((quote: any) => {
    const count = quoteCounts.get(quote.authorId) || 0;
    quoteCounts.set(quote.authorId, count + 1);
  });
  
  // Create author statistics
  const authorStats = authorsData.map((author: any) => ({
    id: author.id,
    name: author.name,
    quoteCount: quoteCounts.get(author.id) || 0,
    featured: author.featured || false
  }));
  
  // Sort by quote count
  authorStats.sort((a: any, b: any) => a.quoteCount - b.quoteCount);
  
  // Show statistics
  console.log('📉 Authors with fewest quotes:');
  console.log('================================');
  
  const authorsWithNoQuotes = authorStats.filter((a: any) => a.quoteCount === 0);
  const authorsWithFewQuotes = authorStats.filter((a: any) => a.quoteCount > 0 && a.quoteCount <= 3);
  const authorsWithMediumQuotes = authorStats.filter((a: any) => a.quoteCount > 3 && a.quoteCount <= 10);
  
  console.log(`\n❌ No quotes (${authorsWithNoQuotes.length} authors):`);
  authorsWithNoQuotes.forEach((a: any) => {
    console.log(`   • ${a.name} (${a.id})`);
  });
  
  console.log(`\n⚠️  Few quotes (1-3) (${authorsWithFewQuotes.length} authors):`);
  authorsWithFewQuotes.slice(0, 20).forEach((a: any) => {
    console.log(`   • ${a.name}: ${a.quoteCount} quote${a.quoteCount > 1 ? 's' : ''}`);
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`   • Total authors: ${authorStats.length}`);
  console.log(`   • Authors with no quotes: ${authorsWithNoQuotes.length}`);
  console.log(`   • Authors with 1-3 quotes: ${authorsWithFewQuotes.length}`);
  console.log(`   • Authors with 4-10 quotes: ${authorsWithMediumQuotes.length}`);
  console.log(`   • Authors with 10+ quotes: ${authorStats.filter((a: any) => a.quoteCount > 10).length}`);
  
  // Top authors
  console.log(`\n🏆 Top 5 authors by quote count:`);
  authorStats.slice(-5).reverse().forEach((a: any) => {
    console.log(`   • ${a.name}: ${a.quoteCount} quotes`);
  });
  
  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    totalAuthors: authorStats.length,
    totalQuotes: quotesData.length,
    authorsWithNoQuotes: authorsWithNoQuotes.map((a: any) => ({ id: a.id, name: a.name })),
    authorsWithFewQuotes: authorsWithFewQuotes.map((a: any) => ({ id: a.id, name: a.name, count: a.quoteCount })),
    needsMoreQuotes: [...authorsWithNoQuotes, ...authorsWithFewQuotes].map((a: any) => a.id)
  };
  
  await fs.writeFile(
    path.join(process.cwd(), 'quote-analysis.json'),
    JSON.stringify(report, null, 2),
    'utf-8'
  );
  
  console.log('\n💾 Analysis saved to quote-analysis.json');
  
  return report;
}

analyzeQuoteCounts().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});