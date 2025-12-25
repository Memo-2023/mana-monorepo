#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-console */
/**
 * Detect Flaky Tests
 *
 * Analyzes test results over time to identify tests that fail intermittently.
 * A test is considered flaky if it fails sometimes but not always.
 *
 * Uses historical data from previous runs stored in GitHub Actions artifacts.
 *
 * Usage:
 *   node detect-flaky-tests.js <test-results-dir>
 */

const fs = require('fs');
const path = require('path');

// Configuration
const FLAKY_THRESHOLD = 0.1; // Test fails 10%+ of the time = flaky
const MIN_RUNS = 3; // Need at least 3 runs to detect flakiness

function loadTestHistory(resultsDir) {
	const historyFile = path.join(resultsDir, 'test-history.json');

	if (!fs.existsSync(historyFile)) {
		return {};
	}

	return JSON.parse(fs.readFileSync(historyFile, 'utf8'));
}

function saveTestHistory(resultsDir, history) {
	const historyFile = path.join(resultsDir, 'test-history.json');
	fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
}

function findTestResultFiles(dir) {
	const results = [];

	function walk(currentDir) {
		if (!fs.existsSync(currentDir)) {
			return;
		}

		const entries = fs.readdirSync(currentDir, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = path.join(currentDir, entry.name);

			if (entry.isDirectory()) {
				walk(fullPath);
			} else if (entry.name.match(/test.*results.*\.json$/i)) {
				results.push(fullPath);
			}
		}
	}

	walk(dir);
	return results;
}

function parseTestResults(files) {
	const allTests = [];

	for (const file of files) {
		try {
			const content = JSON.parse(fs.readFileSync(file, 'utf8'));

			// Handle different test result formats (Jest, Vitest, etc.)
			if (content.testResults) {
				// Jest format
				content.testResults.forEach((suite) => {
					suite.assertionResults?.forEach((test) => {
						allTests.push({
							name: test.fullName || test.title,
							status: test.status,
							duration: test.duration,
							suite: suite.name,
						});
					});
				});
			} else if (content.tests) {
				// Generic format
				content.tests.forEach((test) => {
					allTests.push({
						name: test.name || test.title,
						status: test.status || (test.pass ? 'passed' : 'failed'),
						duration: test.duration,
						suite: test.suite || 'unknown',
					});
				});
			}
		} catch (error) {
			console.error(`Error parsing ${file}:`, error.message);
		}
	}

	return allTests;
}

function updateHistory(history, currentTests) {
	const timestamp = new Date().toISOString();

	for (const test of currentTests) {
		const key = `${test.suite}::${test.name}`;

		if (!history[key]) {
			history[key] = {
				name: test.name,
				suite: test.suite,
				runs: [],
			};
		}

		history[key].runs.push({
			timestamp,
			status: test.status,
			duration: test.duration,
		});

		// Keep only last 30 runs
		if (history[key].runs.length > 30) {
			history[key].runs = history[key].runs.slice(-30);
		}
	}

	return history;
}

function detectFlakyTests(history) {
	const flakyTests = [];

	for (const data of Object.values(history)) {
		if (data.runs.length < MIN_RUNS) {
			continue;
		}

		const totalRuns = data.runs.length;
		const failures = data.runs.filter((r) => r.status === 'failed' || r.status === 'fail').length;
		const failureRate = failures / totalRuns;

		// Flaky: Sometimes passes, sometimes fails
		if (failureRate > 0 && failureRate < 1 && failureRate >= FLAKY_THRESHOLD) {
			flakyTests.push({
				name: data.name,
				suite: data.suite,
				totalRuns,
				failures,
				failureRate: (failureRate * 100).toFixed(1),
				lastFailure: data.runs
					.slice()
					.reverse()
					.find((r) => r.status === 'failed')?.timestamp,
			});
		}
	}

	// Sort by failure rate (descending)
	flakyTests.sort((a, b) => b.failureRate - a.failureRate);

	return flakyTests;
}

function generateFlakyReport(flakyTests) {
	if (flakyTests.length === 0) {
		return {
			summary: 'No flaky tests detected. ✅',
			tests: [],
		};
	}

	const summary =
		`Found ${flakyTests.length} flaky test(s). ⚠️\n\n` +
		'These tests fail intermittently and should be investigated:\n\n' +
		flakyTests
			.map(
				(t) =>
					`- **${t.name}**\n  - Suite: ${t.suite}\n  - Failure rate: ${t.failureRate}%\n  - Last failure: ${t.lastFailure}`
			)
			.join('\n\n');

	return {
		summary,
		tests: flakyTests,
	};
}

function main() {
	const resultsDir = process.argv[2];

	if (!resultsDir) {
		console.error('Usage: node detect-flaky-tests.js <test-results-dir>');
		process.exit(1);
	}

	console.log('Detecting flaky tests...');

	// Ensure results directory exists
	if (!fs.existsSync(resultsDir)) {
		fs.mkdirSync(resultsDir, { recursive: true });
	}

	// Load historical data
	const history = loadTestHistory(resultsDir);
	console.log(`Loaded history for ${Object.keys(history).length} tests`);

	// Find and parse current test results
	const resultFiles = findTestResultFiles(resultsDir);
	console.log(`Found ${resultFiles.length} test result files`);

	if (resultFiles.length > 0) {
		const currentTests = parseTestResults(resultFiles);
		console.log(`Parsed ${currentTests.length} test results`);

		// Update history
		const updatedHistory = updateHistory(history, currentTests);
		saveTestHistory(resultsDir, updatedHistory);
	}

	// Detect flaky tests
	const flakyTests = detectFlakyTests(history);
	const report = generateFlakyReport(flakyTests);

	// Save flaky tests report
	if (flakyTests.length > 0) {
		const flakyFile = path.join(resultsDir, 'flaky-tests.json');
		fs.writeFileSync(flakyFile, JSON.stringify(flakyTests, null, 2));
		console.log(`\n${report.summary}`);
		console.log(`\nFlaky tests report saved to ${flakyFile}`);
	} else {
		console.log('\n✅ No flaky tests detected!');
	}
}

main();
