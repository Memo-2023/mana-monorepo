#!/usr/bin/env node

/**
 * Script to check the completeness of all biographies
 * Compares Markdown files with generated JSON to ensure all data is properly loaded
 */

import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

interface Biography {
	short: string;
	long?: string;
	sections?: { [key: string]: any };
	keyAchievements?: string[];
	famousQuote?: string;
}

interface BiographyReport {
	id: string;
	hasMarkdown: boolean;
	hasJson: boolean;
	markdownSize: number;
	jsonSize: number;
	hasShortBio: boolean;
	hasLongBio: boolean;
	sectionsCount: number;
	achievementsCount: number;
	hasFamousQuote: boolean;
	completeness: number; // percentage
	issues: string[];
}

function checkMarkdownFile(filePath: string): { size: number; hasContent: boolean } {
	try {
		const content = fs.readFileSync(filePath, 'utf-8');
		const { data: frontMatter, content: markdownContent } = matter(content);
		return {
			size: content.length,
			hasContent: markdownContent.trim().length > 100,
		};
	} catch (error) {
		return { size: 0, hasContent: false };
	}
}

function checkJsonBiography(bio: Biography | undefined): {
	hasShortBio: boolean;
	hasLongBio: boolean;
	sectionsCount: number;
	achievementsCount: number;
	hasFamousQuote: boolean;
	jsonSize: number;
} {
	if (!bio) {
		return {
			hasShortBio: false,
			hasLongBio: false,
			sectionsCount: 0,
			achievementsCount: 0,
			hasFamousQuote: false,
			jsonSize: 0,
		};
	}

	return {
		hasShortBio: !!(bio.short && bio.short.length > 10),
		hasLongBio: !!(bio.long && bio.long.length > 50),
		sectionsCount: Object.keys(bio.sections || {}).length,
		achievementsCount: (bio.keyAchievements || []).length,
		hasFamousQuote: !!bio.famousQuote,
		jsonSize: JSON.stringify(bio).length,
	};
}

function calculateCompleteness(report: Partial<BiographyReport>): number {
	let score = 0;
	let maxScore = 0;

	// Essential components
	if (report.hasMarkdown) {
		score += 20;
	}
	maxScore += 20;

	if (report.hasJson) {
		score += 20;
	}
	maxScore += 20;

	if (report.hasShortBio) {
		score += 15;
	}
	maxScore += 15;

	if (report.hasLongBio) {
		score += 15;
	}
	maxScore += 15;

	// Additional components
	if (report.sectionsCount && report.sectionsCount > 0) {
		score += Math.min(report.sectionsCount * 3, 15);
	}
	maxScore += 15;

	if (report.achievementsCount && report.achievementsCount > 0) {
		score += Math.min(report.achievementsCount * 2, 10);
	}
	maxScore += 10;

	if (report.hasFamousQuote) {
		score += 5;
	}
	maxScore += 5;

	return Math.round((score / maxScore) * 100);
}

function analyzeAllBiographies(): BiographyReport[] {
	const profilesDir = path.join(process.cwd(), 'content', 'authors', 'profiles');
	const jsonPath = path.join(process.cwd(), 'content', 'generated', 'biographies.json');

	// Load JSON biographies
	let jsonBiographies: { [key: string]: Biography } = {};
	try {
		const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
		jsonBiographies = JSON.parse(jsonContent);
	} catch (error) {
		console.error('Could not load biographies.json:', error);
	}

	// Get all markdown files
	const markdownFiles = fs
		.readdirSync(profilesDir)
		.filter((f) => f.endsWith('.md'))
		.map((f) => f.replace('.md', ''));

	// Get all IDs from both sources
	const allIds = new Set([...markdownFiles, ...Object.keys(jsonBiographies)]);

	const reports: BiographyReport[] = [];

	for (const id of allIds) {
		const markdownPath = path.join(profilesDir, `${id}.md`);
		const markdownInfo = checkMarkdownFile(markdownPath);
		const jsonBio = jsonBiographies[id];
		const jsonInfo = checkJsonBiography(jsonBio);

		const report: BiographyReport = {
			id,
			hasMarkdown: fs.existsSync(markdownPath),
			hasJson: !!jsonBio,
			markdownSize: markdownInfo.size,
			jsonSize: jsonInfo.jsonSize,
			hasShortBio: jsonInfo.hasShortBio,
			hasLongBio: jsonInfo.hasLongBio,
			sectionsCount: jsonInfo.sectionsCount,
			achievementsCount: jsonInfo.achievementsCount,
			hasFamousQuote: jsonInfo.hasFamousQuote,
			completeness: 0,
			issues: [],
		};

		// Identify issues
		if (!report.hasMarkdown) {
			report.issues.push('No Markdown file');
		}
		if (!report.hasJson) {
			report.issues.push('Not in JSON');
		}
		if (report.hasMarkdown && !markdownInfo.hasContent) {
			report.issues.push('Markdown file too short');
		}
		if (!report.hasShortBio) {
			report.issues.push('Missing short biography');
		}
		if (!report.hasLongBio && report.markdownSize > 500) {
			report.issues.push('Long biography not extracted');
		}
		if (report.sectionsCount === 0 && report.markdownSize > 1000) {
			report.issues.push('No sections extracted from large file');
		}

		report.completeness = calculateCompleteness(report);
		reports.push(report);
	}

	return reports.sort((a, b) => a.id.localeCompare(b.id));
}

function printReport(reports: BiographyReport[]) {
	console.log('\n=== Biography Completeness Report ===\n');

	// Statistics
	const total = reports.length;
	const complete = reports.filter((r) => r.completeness >= 80).length;
	const partial = reports.filter((r) => r.completeness >= 50 && r.completeness < 80).length;
	const incomplete = reports.filter((r) => r.completeness < 50).length;
	const withIssues = reports.filter((r) => r.issues.length > 0);

	console.log(`📊 Statistics:`);
	console.log(`   Total authors: ${total}`);
	console.log(`   ✅ Complete (≥80%): ${complete}`);
	console.log(`   ⚠️  Partial (50-79%): ${partial}`);
	console.log(`   ❌ Incomplete (<50%): ${incomplete}`);
	console.log(`   🔧 With issues: ${withIssues.length}\n`);

	// Group by completeness
	console.log('=== Detailed Report ===\n');

	// Show incomplete ones first
	const problematic = reports.filter((r) => r.completeness < 80 || r.issues.length > 0);

	if (problematic.length > 0) {
		console.log('⚠️  Authors needing attention:\n');

		for (const report of problematic) {
			const icon = report.completeness >= 80 ? '✓' : report.completeness >= 50 ? '⚠' : '✗';

			console.log(`${icon} ${report.id} (${report.completeness}%)`);
			console.log(`  Markdown: ${report.hasMarkdown ? `✓ ${report.markdownSize} bytes` : '✗'}`);
			console.log(`  JSON: ${report.hasJson ? `✓ ${report.jsonSize} bytes` : '✗'}`);

			if (report.hasJson) {
				console.log(`  Content:`);
				console.log(`    - Short bio: ${report.hasShortBio ? '✓' : '✗'}`);
				console.log(`    - Long bio: ${report.hasLongBio ? '✓' : '✗'}`);
				console.log(`    - Sections: ${report.sectionsCount}`);
				console.log(`    - Achievements: ${report.achievementsCount}`);
				console.log(`    - Famous quote: ${report.hasFamousQuote ? '✓' : '✗'}`);
			}

			if (report.issues.length > 0) {
				console.log(`  Issues:`);
				report.issues.forEach((issue) => console.log(`    - ${issue}`));
			}
			console.log();
		}
	}

	// Summary of complete ones
	const completeAuthors = reports.filter((r) => r.completeness >= 80 && r.issues.length === 0);
	if (completeAuthors.length > 0) {
		console.log(`\n✅ Complete authors (${completeAuthors.length}):`);
		const names = completeAuthors.map((r) => r.id).join(', ');
		console.log(names.length > 200 ? names.substring(0, 200) + '...' : names);
	}
}

async function main() {
	const reports = analyzeAllBiographies();
	printReport(reports);

	// Create a detailed JSON report
	const reportPath = path.join(process.cwd(), 'biography-report.json');
	fs.writeFileSync(reportPath, JSON.stringify(reports, null, 2), 'utf-8');
	console.log(`\n📄 Detailed report saved to: biography-report.json`);

	// Return exit code based on completeness
	const incompleteCount = reports.filter((r) => r.completeness < 50).length;
	if (incompleteCount > 10) {
		console.log('\n❌ Many biographies are incomplete. Please review and fix.');
		process.exit(1);
	} else if (incompleteCount > 0) {
		console.log('\n⚠️  Some biographies need attention.');
		process.exit(0);
	} else {
		console.log('\n✅ All biographies are complete!');
		process.exit(0);
	}
}

main().catch(console.error);
