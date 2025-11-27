#!/usr/bin/env node

/**
 * Remove the final duplicate Einstein quotes (q-274 through q-293)
 */

const fs = require('fs');
const path = require('path');

function removeFinalDuplicates() {
  console.log('🧹 Removing duplicate Einstein quotes...\n');
  
  const deQuotesPath = path.join(__dirname, '../content/data/de/quotes.json');
  const enQuotesPath = path.join(__dirname, '../content/data/en/quotes.json');
  
  // IDs to remove (all the duplicates from the last Einstein addition)
  const duplicatesToRemove = [
    'q-274', 'q-275', 'q-276', 'q-277', 'q-278',
    'q-279', 'q-280', 'q-281', 'q-282', 'q-283',
    'q-284', 'q-285', 'q-286', 'q-287', 'q-288',
    'q-289', 'q-290', 'q-291', 'q-292', 'q-293'
  ];
  
  try {
    const deQuotes = JSON.parse(fs.readFileSync(deQuotesPath, 'utf8'));
    const enQuotes = JSON.parse(fs.readFileSync(enQuotesPath, 'utf8'));
    
    console.log(`📊 Before removal:`);
    console.log(`   Total quotes: ${deQuotes.quotes.length}`);
    
    // Count Einstein quotes before
    const einsteinBefore = deQuotes.quotes.filter(q => q.authorId === 'einstein-albert').length;
    console.log(`   Einstein quotes before: ${einsteinBefore}`);
    
    // Filter out the duplicates
    deQuotes.quotes = deQuotes.quotes.filter(q => !duplicatesToRemove.includes(q.id));
    enQuotes.quotes = enQuotes.quotes.filter(q => !duplicatesToRemove.includes(q.id));
    
    // Save cleaned files
    fs.writeFileSync(deQuotesPath, JSON.stringify(deQuotes, null, 2), 'utf8');
    fs.writeFileSync(enQuotesPath, JSON.stringify(enQuotes, null, 2), 'utf8');
    
    console.log(`\n✅ Removed ${duplicatesToRemove.length} duplicate Einstein quotes!`);
    console.log(`📊 After removal:`);
    console.log(`   Total quotes: ${deQuotes.quotes.length}`);
    
    // Count Einstein quotes after
    const einsteinAfter = deQuotes.quotes.filter(q => q.authorId === 'einstein-albert').length;
    console.log(`   Einstein quotes after: ${einsteinAfter}`);
    console.log(`   Einstein remains the top author with ${einsteinAfter} unique quotes!`);
    
  } catch (error) {
    console.error('❌ Failed to remove duplicates:', error);
  }
}

if (require.main === module) {
  removeFinalDuplicates();
}

module.exports = { removeFinalDuplicates };