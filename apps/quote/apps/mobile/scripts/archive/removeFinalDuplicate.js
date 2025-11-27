#!/usr/bin/env node

/**
 * Remove the final duplicate Einstein quote
 */

const fs = require('fs');
const path = require('path');

function removeFinalDuplicate() {
	console.log('🧹 Removing final duplicate Einstein quote...\n');

	const deQuotesPath = path.join(__dirname, '../content/data/de/quotes.json');
	const enQuotesPath = path.join(__dirname, '../content/data/en/quotes.json');

	try {
		const deQuotes = JSON.parse(fs.readFileSync(deQuotesPath, 'utf8'));
		const enQuotes = JSON.parse(fs.readFileSync(enQuotesPath, 'utf8'));

		console.log(`📊 Before removal:`);
		console.log(`   Total quotes: ${deQuotes.quotes.length}`);

		// Remove q-267 (duplicate of q-133)
		const duplicateId = 'q-267';

		// Check what we're removing
		const duplicateQuote = deQuotes.quotes.find((q) => q.id === duplicateId);
		if (duplicateQuote) {
			console.log(`   Removing [${duplicateId}]: "${duplicateQuote.text.substring(0, 60)}..."`);
		}

		// Filter out the duplicate
		deQuotes.quotes = deQuotes.quotes.filter((q) => q.id !== duplicateId);
		enQuotes.quotes = enQuotes.quotes.filter((q) => q.id !== duplicateId);

		// Save cleaned files
		fs.writeFileSync(deQuotesPath, JSON.stringify(deQuotes, null, 2), 'utf8');
		fs.writeFileSync(enQuotesPath, JSON.stringify(enQuotes, null, 2), 'utf8');

		console.log(`\n✅ Removed duplicate!`);
		console.log(`📊 After removal:`);
		console.log(`   Total quotes: ${deQuotes.quotes.length}`);

		// Count Einstein quotes
		const einsteinQuotes = deQuotes.quotes.filter((q) => q.authorId === 'einstein-albert');
		console.log(`   Einstein quotes: ${einsteinQuotes.length}`);
	} catch (error) {
		console.error('❌ Failed to remove duplicate:', error);
	}
}

if (require.main === module) {
	removeFinalDuplicate();
}

module.exports = { removeFinalDuplicate };
