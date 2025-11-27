#!/usr/bin/env node

/**
 * Analyze author distribution and find who needs more quotes
 */

const fs = require('fs');
const path = require('path');

function analyzeAuthors() {
	console.log('📊 Analyzing author distribution...\n');

	const deQuotesPath = path.join(__dirname, '../content/data/de/quotes.json');
	const deAuthorsPath = path.join(__dirname, '../content/data/de/authors.json');

	try {
		const quotesData = JSON.parse(fs.readFileSync(deQuotesPath, 'utf8'));
		const authorsData = JSON.parse(fs.readFileSync(deAuthorsPath, 'utf8'));

		// Count quotes per author
		const authorQuoteCounts = {};
		quotesData.quotes.forEach((quote) => {
			if (authorQuoteCounts[quote.authorId]) {
				authorQuoteCounts[quote.authorId]++;
			} else {
				authorQuoteCounts[quote.authorId] = 1;
			}
		});

		// Get author names
		const authorNames = {};
		authorsData.authors.forEach((author) => {
			authorNames[author.id] = author.name;
		});

		// Sort authors by quote count
		const authorStats = Object.entries(authorQuoteCounts)
			.map(([id, count]) => ({
				id,
				name: authorNames[id] || id,
				count,
			}))
			.sort((a, b) => b.count - a.count);

		console.log('🏆 Top authors by quote count:');
		authorStats.slice(0, 20).forEach((author, index) => {
			console.log(`${index + 1}. ${author.name}: ${author.count} quotes`);
		});

		console.log('\n📈 Authors with fewer quotes (good candidates for expansion):');
		const fewQuotes = authorStats.filter((a) => a.count <= 3).slice(0, 15);
		fewQuotes.forEach((author) => {
			console.log(`• ${author.name}: ${author.count} quotes`);
		});

		// Famous authors that should have more quotes
		const famousAuthors = [
			'einstein-albert',
			'shakespeare-william',
			'nietzsche-friedrich',
			'goethe-johann',
			'twain-mark',
			'buddha',
			'konfuzius',
			'platon',
			'aristoteles',
			'gandhi-mahatma',
		];

		console.log('\n⭐ Major authors current quote counts:');
		famousAuthors.forEach((id) => {
			const count = authorQuoteCounts[id] || 0;
			const name = authorNames[id] || id;
			console.log(`• ${name}: ${count} quotes`);
		});

		return { authorStats, authorQuoteCounts, authorNames };
	} catch (error) {
		console.error('❌ Analysis failed:', error);
		return null;
	}
}

if (require.main === module) {
	analyzeAuthors();
}

module.exports = { analyzeAuthors };
