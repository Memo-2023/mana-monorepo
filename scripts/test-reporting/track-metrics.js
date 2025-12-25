#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-console */
/**
 * Track Test Performance Metrics
 *
 * Records test execution time, memory usage, and other performance metrics
 * to track trends over time and identify performance regressions.
 *
 * Usage:
 *   node track-metrics.js <test-results-dir>
 */

const fs = require('fs');
const path = require('path');

function loadMetricsHistory(resultsDir) {
	const historyFile = path.join(resultsDir, 'metrics-history.json');

	if (!fs.existsSync(historyFile)) {
		return [];
	}

	return JSON.parse(fs.readFileSync(historyFile, 'utf8'));
}

function saveMetricsHistory(resultsDir, history) {
	const historyFile = path.join(resultsDir, 'metrics-history.json');
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

function calculateMetrics(resultFiles) {
	let totalTests = 0;
	let totalDuration = 0;
	let slowestTest = null;
	const suiteMetrics = {};

	for (const file of resultFiles) {
		try {
			const content = JSON.parse(fs.readFileSync(file, 'utf8'));
			const suiteName = path.basename(path.dirname(file));

			if (!suiteMetrics[suiteName]) {
				suiteMetrics[suiteName] = {
					tests: 0,
					duration: 0,
					slowestTest: null,
				};
			}

			// Jest format
			if (content.testResults) {
				content.testResults.forEach((suite) => {
					const suiteTests = suite.assertionResults || [];
					totalTests += suiteTests.length;
					suiteMetrics[suiteName].tests += suiteTests.length;

					suiteTests.forEach((test) => {
						const duration = test.duration || 0;
						totalDuration += duration;
						suiteMetrics[suiteName].duration += duration;

						if (!slowestTest || duration > slowestTest.duration) {
							slowestTest = {
								name: test.fullName || test.title,
								duration,
								suite: suite.name,
							};
						}

						if (
							!suiteMetrics[suiteName].slowestTest ||
							duration > suiteMetrics[suiteName].slowestTest.duration
						) {
							suiteMetrics[suiteName].slowestTest = {
								name: test.fullName || test.title,
								duration,
							};
						}
					});
				});
			}

			// Handle other formats...
		} catch (error) {
			console.error(`Error parsing ${file}:`, error.message);
		}
	}

	return {
		timestamp: new Date().toISOString(),
		totalTests,
		totalDuration: Math.round(totalDuration),
		averageDuration: totalTests > 0 ? Math.round(totalDuration / totalTests) : 0,
		slowestTest,
		suiteMetrics,
	};
}

function detectRegressions(currentMetrics, history) {
	if (history.length === 0) {
		return [];
	}

	const regressions = [];
	const lastRun = history[history.length - 1];

	// Check total duration increase
	const durationIncrease =
		((currentMetrics.totalDuration - lastRun.totalDuration) / lastRun.totalDuration) * 100;

	if (durationIncrease > 20) {
		regressions.push({
			type: 'duration',
			message: `Total test duration increased by ${durationIncrease.toFixed(1)}%`,
			previous: lastRun.totalDuration,
			current: currentMetrics.totalDuration,
		});
	}

	// Check per-suite regressions
	for (const [suite, metrics] of Object.entries(currentMetrics.suiteMetrics)) {
		const previousSuite = lastRun.suiteMetrics?.[suite];

		if (previousSuite) {
			const suiteIncrease =
				((metrics.duration - previousSuite.duration) / previousSuite.duration) * 100;

			if (suiteIncrease > 30) {
				regressions.push({
					type: 'suite',
					suite,
					message: `${suite} duration increased by ${suiteIncrease.toFixed(1)}%`,
					previous: previousSuite.duration,
					current: metrics.duration,
				});
			}
		}
	}

	return regressions;
}

function generateMetricsReport(metrics, regressions) {
	let report = '# Test Performance Metrics\n\n';

	// Summary
	report += `**Date:** ${new Date(metrics.timestamp).toISOString().split('T')[0]}\n\n`;
	report += `- **Total Tests:** ${metrics.totalTests}\n`;
	report += `- **Total Duration:** ${(metrics.totalDuration / 1000).toFixed(2)}s\n`;
	report += `- **Average Duration:** ${metrics.averageDuration}ms per test\n`;

	if (metrics.slowestTest) {
		report += `- **Slowest Test:** ${metrics.slowestTest.name} (${metrics.slowestTest.duration}ms)\n`;
	}

	// Performance regressions
	if (regressions.length > 0) {
		report += '\n## ⚠️ Performance Regressions Detected\n\n';
		regressions.forEach((reg) => {
			report += `- ${reg.message}\n`;
			report += `  - Previous: ${reg.previous}ms\n`;
			report += `  - Current: ${reg.current}ms\n`;
		});
	}

	// Suite breakdown
	report += '\n## Suite Performance\n\n';
	report += '| Suite | Tests | Duration | Avg/Test | Slowest |\n';
	report += '|-------|-------|----------|----------|--------|\n';

	for (const [suite, data] of Object.entries(metrics.suiteMetrics)) {
		const avgPerTest = data.tests > 0 ? Math.round(data.duration / data.tests) : 0;
		const slowest = data.slowestTest ? `${data.slowestTest.duration}ms` : 'N/A';

		report += `| ${suite} | ${data.tests} | ${data.duration}ms | ${avgPerTest}ms | ${slowest} |\n`;
	}

	return report;
}

function main() {
	const resultsDir = process.argv[2];

	if (!resultsDir) {
		console.error('Usage: node track-metrics.js <test-results-dir>');
		process.exit(1);
	}

	console.log('Tracking test performance metrics...');

	// Ensure results directory exists
	if (!fs.existsSync(resultsDir)) {
		fs.mkdirSync(resultsDir, { recursive: true });
	}

	// Find test result files
	const resultFiles = findTestResultFiles(resultsDir);
	console.log(`Found ${resultFiles.length} test result files`);

	if (resultFiles.length === 0) {
		console.log('No test results to analyze.');
		return;
	}

	// Calculate current metrics
	const currentMetrics = calculateMetrics(resultFiles);
	console.log(`Analyzed ${currentMetrics.totalTests} tests`);

	// Load history and detect regressions
	const history = loadMetricsHistory(resultsDir);
	const regressions = detectRegressions(currentMetrics, history);

	// Update history
	history.push(currentMetrics);

	// Keep only last 90 days
	const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
	const filteredHistory = history.filter((m) => new Date(m.timestamp).getTime() > ninetyDaysAgo);

	saveMetricsHistory(resultsDir, filteredHistory);

	// Save current metrics
	const metricsFile = path.join(resultsDir, 'metrics.json');
	fs.writeFileSync(metricsFile, JSON.stringify(currentMetrics, null, 2));

	// Generate and save report
	const report = generateMetricsReport(currentMetrics, regressions);
	const reportFile = path.join(resultsDir, 'metrics-report.md');
	fs.writeFileSync(reportFile, report);

	console.log(`\n${report}`);
	console.log(`\nMetrics saved to ${metricsFile}`);

	if (regressions.length > 0) {
		console.error(`\n⚠️ ${regressions.length} performance regression(s) detected!`);
		process.exit(1);
	}
}

main();
