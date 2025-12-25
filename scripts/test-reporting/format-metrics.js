#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-console */
/**
 * Format Metrics for GitHub Summary
 *
 * Formats test performance metrics for display in GitHub Actions summary.
 *
 * Usage:
 *   node format-metrics.js <metrics-file>
 */

const fs = require('fs');

function formatDuration(ms) {
	if (ms < 1000) {
		return `${ms}ms`;
	}
	return `${(ms / 1000).toFixed(2)}s`;
}

function formatMetrics(metrics) {
	let output = '';

	output += `\n**Total Tests:** ${metrics.totalTests}\n`;
	output += `**Total Duration:** ${formatDuration(metrics.totalDuration)}\n`;
	output += `**Average Duration:** ${formatDuration(metrics.averageDuration)}\n\n`;

	if (metrics.slowestTest) {
		output += `**Slowest Test:** ${metrics.slowestTest.name} (${formatDuration(metrics.slowestTest.duration)})\n\n`;
	}

	// Suite breakdown
	output += '### Suite Performance\n\n';
	output += '| Suite | Tests | Duration | Avg/Test |\n';
	output += '|-------|-------|----------|----------|\n';

	for (const [suite, data] of Object.entries(metrics.suiteMetrics)) {
		const avgPerTest = data.tests > 0 ? Math.round(data.duration / data.tests) : 0;
		output += `| ${suite} | ${data.tests} | ${formatDuration(data.duration)} | ${formatDuration(avgPerTest)} |\n`;
	}

	return output;
}

function main() {
	const metricsFile = process.argv[2];

	if (!metricsFile) {
		console.error('Usage: node format-metrics.js <metrics-file>');
		process.exit(1);
	}

	if (!fs.existsSync(metricsFile)) {
		console.log('No metrics file found.');
		return;
	}

	const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
	const formatted = formatMetrics(metrics);

	console.log(formatted);
}

main();
