#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-console */
/**
 * Generate Test Summary
 *
 * Creates a GitHub Actions summary with test results, coverage, and trends.
 *
 * Usage:
 *   node generate-summary.js <test-results-dir>
 */

const fs = require('fs');
const path = require('path');

function findTestResults(dir) {
	const results = {
		coverage: [],
		testResults: [],
	};

	function walk(currentDir) {
		if (!fs.existsSync(currentDir)) {
			return;
		}

		const entries = fs.readdirSync(currentDir, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = path.join(currentDir, entry.name);

			if (entry.isDirectory()) {
				walk(fullPath);
			} else if (entry.name === 'coverage-summary.json') {
				results.coverage.push(fullPath);
			} else if (entry.name.includes('test-results.json')) {
				results.testResults.push(fullPath);
			}
		}
	}

	walk(dir);
	return results;
}

function generateSummary(resultsDir) {
	const { coverage } = findTestResults(resultsDir);

	let summary = '# 🧪 Daily Test Suite Results\n\n';
	summary += `**Date:** ${new Date().toISOString().split('T')[0]}\n\n`;

	if (coverage.length === 0) {
		summary += '⚠️ No coverage reports found.\n';
		return summary;
	}

	// Aggregate coverage stats
	const suites = [];
	let totalPassed = 0;
	let totalFailed = 0;

	coverage.forEach((file) => {
		const content = JSON.parse(fs.readFileSync(file, 'utf8'));
		const suiteName = path.basename(path.dirname(path.dirname(file)));

		if (content.total) {
			suites.push({
				name: suiteName,
				lines: content.total.lines.pct,
				statements: content.total.statements.pct,
				functions: content.total.functions.pct,
				branches: content.total.branches.pct,
			});
		}
	});

	// Coverage table
	summary += '## Coverage by Suite\n\n';
	summary += '| Suite | Lines | Statements | Functions | Branches | Status |\n';
	summary += '|-------|-------|------------|-----------|----------|--------|\n';

	suites.forEach((suite) => {
		const avgCoverage = (suite.lines + suite.statements + suite.functions + suite.branches) / 4;
		const status = avgCoverage >= 80 ? '✅ Pass' : avgCoverage >= 60 ? '⚠️ Warning' : '❌ Fail';

		summary += `| ${suite.name} | ${suite.lines.toFixed(1)}% | ${suite.statements.toFixed(1)}% | ${suite.functions.toFixed(1)}% | ${suite.branches.toFixed(1)}% | ${status} |\n`;

		if (avgCoverage >= 80) {
			totalPassed++;
		} else {
			totalFailed++;
		}
	});

	// Overall stats
	summary += '\n## Overall Statistics\n\n';
	summary += `- **Total Test Suites:** ${suites.length}\n`;
	summary += `- **Passed:** ${totalPassed} ✅\n`;
	summary += `- **Failed:** ${totalFailed} ❌\n`;

	const successRate = ((totalPassed / suites.length) * 100).toFixed(1);
	summary += `- **Success Rate:** ${successRate}%\n`;

	// Recommendations
	if (totalFailed > 0) {
		summary += '\n## ⚠️ Recommendations\n\n';
		summary += 'The following test suites need attention:\n\n';

		suites
			.filter((s) => (s.lines + s.statements + s.functions + s.branches) / 4 < 80)
			.forEach((suite) => {
				summary += `- **${suite.name}**: Improve coverage (currently ${((suite.lines + suite.statements + suite.functions + suite.branches) / 4).toFixed(1)}%)\n`;
			});
	}

	return summary;
}

function main() {
	const resultsDir = process.argv[2];

	if (!resultsDir) {
		console.error('Usage: node generate-summary.js <test-results-dir>');
		process.exit(1);
	}

	const summary = generateSummary(resultsDir);
	console.log(summary);
}

main();
