#!/usr/bin/env node

/**
 * Remove duplicate quotes from the database
 */

const fs = require('fs');
const path = require('path');

// List of duplicate IDs to remove (keeping the first occurrence)
const duplicatesToRemove = [
  'q-151', // Duplicate of q-050 (Churchill quote about success)
  'q-155', // Duplicate of q-090 (Churchill - If you're going through hell)
  'q-160', // Duplicate of q-068 (Churchill - The art is to get up once more)
  'q-163', // Duplicate of q-063 (Aristoteles - We can't change the wind)
  'q-166', // Duplicate of q-007 (Confucius - The journey is the destination)
  'q-167', // Duplicate of q-008 (Brecht - Who fights may lose)
  'q-168', // Duplicate of q-053 (Chinese proverb - Best time to plant a tree)
  'q-169', // Duplicate of q-076 (Hesse - Must try the impossible)
  'q-170', // Duplicate of q-089 (Marcus Aurelius - Happiness depends on thoughts)
  'q-171', // Duplicate of q-136 (Victor Hugo - Nothing is more powerful than an idea)
  'q-173', // Duplicate of q-035 (Twain - Give every day the chance)
  'q-174', // Duplicate of q-028 (Gandhi - The future depends on what we do today)
  'q-175', // Duplicate of q-048 (Henry Ford - Who always does what he can)
  'q-178', // Duplicate of q-147 (Adler - Greatest danger is being too cautious)
  'q-187', // Duplicate of q-100 (Swindoll - Life is 10% what happens)
  'q-188', // Duplicate of q-001 (Einstein - Imagination is more important)
  'q-189', // Duplicate of q-049 (Lasorda - Difference between impossible)
  'q-193', // Duplicate of q-082 (Eleanor Roosevelt - No one can make you feel inferior)
  'q-194', // Duplicate of q-112 (Tracy/Brown - The only limits)
  'q-197', // Duplicate of q-018 (Bruckner - Who wants to build high towers)
  'q-199', // Duplicate of q-045 (Democritus - Courage at beginning)
  'q-226', // Duplicate of q-016 (Nietzsche - Become who you are)
  'q-252'  // Duplicate of q-089 (Marcus Aurelius - happiness of your life)
];

function removeDuplicates() {
  console.log('🧹 Removing duplicate quotes...\n');
  
  const deQuotesPath = path.join(__dirname, '../content/data/de/quotes.json');
  const enQuotesPath = path.join(__dirname, '../content/data/en/quotes.json');
  
  try {
    // Load current data
    const deQuotes = JSON.parse(fs.readFileSync(deQuotesPath, 'utf8'));
    const enQuotes = JSON.parse(fs.readFileSync(enQuotesPath, 'utf8'));
    
    console.log(`📊 Before removal:`);
    console.log(`   German quotes: ${deQuotes.quotes.length}`);
    console.log(`   English quotes: ${enQuotes.quotes.length}`);
    console.log(`   Duplicates to remove: ${duplicatesToRemove.length}`);
    console.log('');
    
    // Remove duplicates from German quotes
    const deFiltered = deQuotes.quotes.filter(quote => 
      !duplicatesToRemove.includes(quote.id)
    );
    
    // Remove duplicates from English quotes
    const enFiltered = enQuotes.quotes.filter(quote => 
      !duplicatesToRemove.includes(quote.id)
    );
    
    // Update the data structures
    deQuotes.quotes = deFiltered;
    enQuotes.quotes = enFiltered;
    
    // Save cleaned files
    fs.writeFileSync(deQuotesPath, JSON.stringify(deQuotes, null, 2), 'utf8');
    fs.writeFileSync(enQuotesPath, JSON.stringify(enQuotes, null, 2), 'utf8');
    
    console.log(`✅ Successfully removed duplicates!`);
    console.log(`📊 After removal:`);
    console.log(`   German quotes: ${deQuotes.quotes.length} (removed ${duplicatesToRemove.length})`);
    console.log(`   English quotes: ${enQuotes.quotes.length} (removed ${duplicatesToRemove.length})`);
    console.log('');
    
    // Verify no duplicates remain
    console.log('🔍 Verifying no duplicates remain...');
    const deTexts = new Set();
    let remainingDuplicates = 0;
    
    deQuotes.quotes.forEach(quote => {
      const normalizedText = quote.text.toLowerCase().trim();
      if (deTexts.has(normalizedText)) {
        remainingDuplicates++;
        console.log(`   ⚠️ Still duplicate: ${quote.text.substring(0, 50)}...`);
      } else {
        deTexts.set(normalizedText);
      }
    });
    
    if (remainingDuplicates === 0) {
      console.log('✅ All duplicates have been removed!');
    } else {
      console.log(`⚠️ ${remainingDuplicates} duplicates still remain`);
    }
    
    // Final statistics
    console.log('\n📈 Final statistics:');
    console.log(`   • Total unique quotes: ${deQuotes.quotes.length}`);
    console.log(`   • Unique texts: ${deTexts.size}`);
    console.log(`   • IDs match between languages: ${deQuotes.quotes.length === enQuotes.quotes.length ? '✅ Yes' : '❌ No'}`);
    
    return {
      removed: duplicatesToRemove.length,
      finalCount: deQuotes.quotes.length,
      uniqueTexts: deTexts.size
    };
    
  } catch (error) {
    console.error('❌ Failed to remove duplicates:', error);
    return null;
  }
}

if (require.main === module) {
  removeDuplicates();
}

module.exports = { removeDuplicates };