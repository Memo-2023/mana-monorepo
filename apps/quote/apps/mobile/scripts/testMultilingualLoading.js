#!/usr/bin/env node

/**
 * Test script for multilingual loading from JSON files
 */

console.log('🧪 Testing Multilingual Content Loading from JSON files...\n');

async function testJSONLoading() {
  try {
    // Test direct JSON loading
    console.log('1️⃣ Testing direct JSON file loading...');
    
    const deQuotes = require('../content/data/de/quotes.json');
    const enQuotes = require('../content/data/en/quotes.json');
    const deAuthors = require('../content/data/de/authors.json');
    const enAuthors = require('../content/data/en/authors.json');
    
    console.log(`   ✅ German: ${deQuotes.quotes.length} quotes, ${deAuthors.authors.length} authors`);
    console.log(`   ✅ English: ${enQuotes.quotes.length} quotes, ${enAuthors.authors.length} authors`);
    
    // Check language settings
    const deLangCheck = deQuotes.quotes.slice(0, 3).every(q => q.language === 'de');
    const enLangCheck = enQuotes.quotes.slice(0, 3).every(q => q.language === 'en');
    
    console.log(`   📍 German language setting: ${deLangCheck ? '✅ Correct' : '❌ Incorrect'}`);
    console.log(`   📍 English language setting: ${enLangCheck ? '✅ Correct' : '❌ Incorrect'}`);
    
    // Sample a few quotes to check translations
    console.log('\n2️⃣ Sample quote comparison:');
    const sampleId = 'q-001';
    const deQuote = deQuotes.quotes.find(q => q.id === sampleId);
    const enQuote = enQuotes.quotes.find(q => q.id === sampleId);
    
    if (deQuote && enQuote) {
      console.log(`   🇩🇪 DE: "${deQuote.text.substring(0, 60)}..."`);
      console.log(`   🇺🇸 EN: "${enQuote.text.substring(0, 60)}..."`);
      console.log(`   📊 Translation: ${deQuote.text !== enQuote.text ? '✅ Different' : '❌ Same'}`);
    }
    
    console.log('\n3️⃣ Testing multilingualContentLoader import...');
    
    try {
      // Try to import the multilingual content loader
      const { multilingualContentLoader } = require('../services/multilingualContentLoader');
      
      // Give it a moment to initialize
      setTimeout(() => {
        console.log('   📚 Getting German stats...');
        multilingualContentLoader.setLanguage('de');
        const deStats = multilingualContentLoader.getStats();
        console.log(`   🇩🇪 German: ${deStats.totalQuotes} quotes, ${deStats.totalAuthors} authors, ${deStats.totalCategories} categories`);
        
        console.log('   📚 Getting English stats...');
        multilingualContentLoader.setLanguage('en');
        const enStats = multilingualContentLoader.getStats();
        console.log(`   🇺🇸 English: ${enStats.totalQuotes} quotes, ${enStats.totalAuthors} authors, ${enStats.totalCategories} categories`);
        
        console.log('\n✅ Multilingual loading test completed successfully!');
      }, 1000);
      
    } catch (error) {
      console.log(`   ❌ Error testing multilingualContentLoader: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

if (require.main === module) {
  testJSONLoading();
}

module.exports = { testJSONLoading };