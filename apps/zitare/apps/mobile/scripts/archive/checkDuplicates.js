#!/usr/bin/env node

/**
 * Check for duplicate quotes in the database
 */

const fs = require('fs');
const path = require('path');

function findDuplicates() {
	console.log('🔍 Checking for duplicate quotes...\n');

	const deQuotesPath = path.join(__dirname, '../content/data/de/quotes.json');
	const enQuotesPath = path.join(__dirname, '../content/data/en/quotes.json');

	try {
		const deQuotes = JSON.parse(fs.readFileSync(deQuotesPath, 'utf8'));
		const enQuotes = JSON.parse(fs.readFileSync(enQuotesPath, 'utf8'));

		console.log(`📊 Total German quotes: ${deQuotes.quotes.length}`);
		console.log(`📊 Total English quotes: ${enQuotes.quotes.length}`);
		console.log('');

		// Check for duplicate IDs
		console.log('1️⃣ Checking for duplicate IDs...');
		const deIds = new Map();
		const enIds = new Map();
		const duplicateIds = [];

		deQuotes.quotes.forEach((quote, index) => {
			if (deIds.has(quote.id)) {
				duplicateIds.push({
					id: quote.id,
					firstIndex: deIds.get(quote.id),
					secondIndex: index,
					language: 'de',
				});
			} else {
				deIds.set(quote.id, index);
			}
		});

		enQuotes.quotes.forEach((quote, index) => {
			if (enIds.has(quote.id)) {
				duplicateIds.push({
					id: quote.id,
					firstIndex: enIds.get(quote.id),
					secondIndex: index,
					language: 'en',
				});
			} else {
				enIds.set(quote.id, index);
			}
		});

		if (duplicateIds.length > 0) {
			console.log(`❌ Found ${duplicateIds.length} duplicate IDs:`);
			duplicateIds.forEach((dup) => {
				console.log(
					`   • ${dup.id} appears at indices ${dup.firstIndex} and ${dup.secondIndex} in ${dup.language}`
				);
			});
		} else {
			console.log('✅ No duplicate IDs found');
		}

		// Check for duplicate text content (German)
		console.log('\n2️⃣ Checking for duplicate German texts...');
		const deTexts = new Map();
		const duplicateTexts = [];

		deQuotes.quotes.forEach((quote, index) => {
			const normalizedText = quote.text.toLowerCase().trim();
			if (deTexts.has(normalizedText)) {
				const firstQuote = deQuotes.quotes[deTexts.get(normalizedText)];
				duplicateTexts.push({
					text: quote.text.substring(0, 60) + '...',
					ids: [firstQuote.id, quote.id],
					authors: [firstQuote.authorId, quote.authorId],
					indices: [deTexts.get(normalizedText), index],
				});
			} else {
				deTexts.set(normalizedText, index);
			}
		});

		if (duplicateTexts.length > 0) {
			console.log(`⚠️ Found ${duplicateTexts.length} duplicate German texts:`);
			duplicateTexts.forEach((dup) => {
				console.log(`   • "${dup.text}"`);
				console.log(`     IDs: ${dup.ids.join(', ')} | Authors: ${dup.authors.join(', ')}`);
			});
		} else {
			console.log('✅ No duplicate German texts found');
		}

		// Check for similar texts (might be slight variations)
		console.log('\n3️⃣ Checking for similar quotes (potential variations)...');
		const similarQuotes = [];
		const processedPairs = new Set();

		deQuotes.quotes.forEach((quote1, i) => {
			deQuotes.quotes.forEach((quote2, j) => {
				if (i >= j) return; // Skip same quote and already processed pairs

				const pairKey = `${i}-${j}`;
				if (processedPairs.has(pairKey)) return;
				processedPairs.add(pairKey);

				const text1 = quote1.text.toLowerCase();
				const text2 = quote2.text.toLowerCase();

				// Check if texts are very similar (share significant portion)
				const words1 = text1.split(/\s+/);
				const words2 = text2.split(/\s+/);

				if (words1.length > 5 && words2.length > 5) {
					const commonWords = words1.filter((word) => word.length > 4 && text2.includes(word));

					const similarity = commonWords.length / Math.min(words1.length, words2.length);

					if (similarity > 0.7 && quote1.authorId === quote2.authorId) {
						similarQuotes.push({
							quote1: {
								id: quote1.id,
								text: quote1.text.substring(0, 50) + '...',
								author: quote1.authorId,
							},
							quote2: {
								id: quote2.id,
								text: quote2.text.substring(0, 50) + '...',
								author: quote2.authorId,
							},
							similarity: Math.round(similarity * 100),
						});
					}
				}
			});
		});

		if (similarQuotes.length > 0) {
			console.log(`🔸 Found ${similarQuotes.length} potentially similar quotes from same authors:`);
			similarQuotes.slice(0, 10).forEach((pair) => {
				console.log(`\n   Author: ${pair.quote1.author} (${pair.similarity}% similar)`);
				console.log(`   • [${pair.quote1.id}] "${pair.quote1.text}"`);
				console.log(`   • [${pair.quote2.id}] "${pair.quote2.text}"`);
			});
			if (similarQuotes.length > 10) {
				console.log(`   ... and ${similarQuotes.length - 10} more`);
			}
		} else {
			console.log('✅ No suspiciously similar quotes found');
		}

		// Check author distribution
		console.log('\n4️⃣ Author quote distribution:');
		const authorCounts = new Map();
		deQuotes.quotes.forEach((quote) => {
			const count = authorCounts.get(quote.authorId) || 0;
			authorCounts.set(quote.authorId, count + 1);
		});

		const sortedAuthors = Array.from(authorCounts.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, 15);

		console.log('Top 15 authors by quote count:');
		sortedAuthors.forEach(([author, count], index) => {
			console.log(`   ${index + 1}. ${author}: ${count} quotes`);
		});

		// Summary
		console.log('\n📈 Summary:');
		console.log(`   • Total quotes: ${deQuotes.quotes.length}`);
		console.log(`   • Unique IDs: ${deIds.size}`);
		console.log(`   • Unique texts: ${deTexts.size}`);
		console.log(`   • Duplicate IDs: ${duplicateIds.length}`);
		console.log(`   • Duplicate texts: ${duplicateTexts.length}`);
		console.log(`   • Authors with quotes: ${authorCounts.size}`);

		return {
			duplicateIds,
			duplicateTexts,
			similarQuotes,
			totalQuotes: deQuotes.quotes.length,
			uniqueIds: deIds.size,
			uniqueTexts: deTexts.size,
		};
	} catch (error) {
		console.error('❌ Error checking duplicates:', error);
		return null;
	}
}

if (require.main === module) {
	findDuplicates();
}

module.exports = { findDuplicates };
