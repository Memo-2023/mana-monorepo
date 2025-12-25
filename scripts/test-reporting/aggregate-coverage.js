#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-console */
/**
 * Aggregate Coverage Reports
 *
 * Merges multiple coverage reports from different test suites into a single
 * aggregated report for overall project coverage analysis.
 *
 * Usage:
 *   node aggregate-coverage.js <input-dir> <output-dir>
 */

const fs = require('fs');
const path = require('path');

function findCoverageFiles(dir) {
	const coverageFiles = [];

	function walk(currentDir) {
		const entries = fs.readdirSync(currentDir, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = path.join(currentDir, entry.name);

			if (entry.isDirectory()) {
				walk(fullPath);
			} else if (entry.name === 'coverage-summary.json') {
				coverageFiles.push(fullPath);
			}
		}
	}

	walk(dir);
	return coverageFiles;
}

function mergeCoverage(coverageFiles) {
	const merged = {
		total: {
			lines: { total: 0, covered: 0, skipped: 0, pct: 0 },
			statements: { total: 0, covered: 0, skipped: 0, pct: 0 },
			functions: { total: 0, covered: 0, skipped: 0, pct: 0 },
			branches: { total: 0, covered: 0, skipped: 0, pct: 0 },
		},
		suites: {},
	};

	for (const file of coverageFiles) {
		const content = JSON.parse(fs.readFileSync(file, 'utf8'));
		const suiteName = path.basename(path.dirname(path.dirname(file)));

		// Store individual suite data
		merged.suites[suiteName] = content.total;

		// Aggregate totals
		if (content.total) {
			['lines', 'statements', 'functions', 'branches'].forEach((metric) => {
				merged.total[metric].total += content.total[metric].total || 0;
				merged.total[metric].covered += content.total[metric].covered || 0;
				merged.total[metric].skipped += content.total[metric].skipped || 0;
			});
		}
	}

	// Calculate percentages
	['lines', 'statements', 'functions', 'branches'].forEach((metric) => {
		if (merged.total[metric].total > 0) {
			merged.total[metric].pct = (merged.total[metric].covered / merged.total[metric].total) * 100;
		}
	});

	return merged;
}

function generateMarkdownSummary(coverage) {
	let markdown = '# Test Coverage Summary\n\n';

	// Overall coverage table
	markdown += '## Overall Coverage\n\n';
	markdown += '| Metric | Coverage | Total | Covered |\n';
	markdown += '|--------|----------|-------|--------|\n';

	['lines', 'statements', 'functions', 'branches'].forEach((metric) => {
		const data = coverage.total[metric];
		const pct = data.pct.toFixed(2);
		const icon = data.pct >= 80 ? '✅' : data.pct >= 60 ? '⚠️' : '❌';
		markdown += `| ${metric.charAt(0).toUpperCase() + metric.slice(1)} | ${icon} ${pct}% | ${data.total} | ${data.covered} |\n`;
	});

	// Per-suite breakdown
	markdown += '\n## Coverage by Test Suite\n\n';
	markdown += '| Suite | Lines | Statements | Functions | Branches |\n';
	markdown += '|-------|-------|------------|-----------|----------|\n';

	Object.entries(coverage.suites).forEach(([suite, data]) => {
		const linesPct = data.lines.pct.toFixed(1);
		const stmtPct = data.statements.pct.toFixed(1);
		const funcPct = data.functions.pct.toFixed(1);
		const branchPct = data.branches.pct.toFixed(1);

		markdown += `| ${suite} | ${linesPct}% | ${stmtPct}% | ${funcPct}% | ${branchPct}% |\n`;
	});

	return markdown;
}

function main() {
	const inputDir = process.argv[2];
	const outputDir = process.argv[3];

	if (!inputDir || !outputDir) {
		console.error('Usage: node aggregate-coverage.js <input-dir> <output-dir>');
		process.exit(1);
	}

	// Ensure output directory exists
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true });
	}

	// Find all coverage files
	console.log(`Searching for coverage files in ${inputDir}...`);
	const coverageFiles = findCoverageFiles(inputDir);
	console.log(`Found ${coverageFiles.length} coverage files`);

	if (coverageFiles.length === 0) {
		console.log('No coverage files found. Skipping aggregation.');
		process.exit(0);
	}

	// Merge coverage data
	console.log('Merging coverage data...');
	const merged = mergeCoverage(coverageFiles);

	// Write aggregated coverage
	const outputFile = path.join(outputDir, 'total-coverage.json');
	fs.writeFileSync(outputFile, JSON.stringify(merged, null, 2));
	console.log(`Wrote aggregated coverage to ${outputFile}`);

	// Generate markdown summary
	const summary = generateMarkdownSummary(merged);
	const summaryFile = path.join(outputDir, 'summary.md');
	fs.writeFileSync(summaryFile, summary);
	console.log(`Wrote summary to ${summaryFile}`);

	// Output summary to console
	console.log('\n' + summary);

	// Exit with error if coverage is too low
	if (merged.total.lines.pct < 80) {
		console.error(`\n❌ Coverage ${merged.total.lines.pct.toFixed(2)}% is below 80% threshold`);
		process.exit(1);
	}

	console.log(`\n✅ Coverage ${merged.total.lines.pct.toFixed(2)}% meets 80% threshold`);
}

main();
