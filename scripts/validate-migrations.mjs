#!/usr/bin/env node
/**
 * Migration Validation Script
 *
 * Scans migration files for destructive SQL patterns and fails CI if found.
 * This prevents accidental data loss in production deployments.
 *
 * Usage:
 *   node scripts/validate-migrations.mjs [--allow-destructive]
 *
 * Destructive patterns detected:
 *   - DROP TABLE
 *   - DROP COLUMN
 *   - DROP INDEX (without CONCURRENTLY)
 *   - DROP SCHEMA
 *   - TRUNCATE
 *   - DELETE FROM (without WHERE)
 *
 * Safe patterns (allowed):
 *   - DROP ... IF EXISTS (only creates if not exists)
 *   - CREATE ... IF NOT EXISTS
 *   - ALTER TABLE ... ADD COLUMN
 *   - CREATE INDEX CONCURRENTLY
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';

// Configuration
const MIGRATION_DIRS = [
	'services/mana-core-auth/src/db/migrations',
	// Add other services as needed
];

// Destructive patterns to detect
const DESTRUCTIVE_PATTERNS = [
	{
		pattern: /DROP\s+TABLE(?!\s+IF\s+EXISTS)/gi,
		message: 'DROP TABLE without IF EXISTS - will fail if table does not exist and is destructive',
		severity: 'error',
	},
	{
		pattern: /DROP\s+TABLE\s+IF\s+EXISTS\s+(?!.*CASCADE\s*;)/gi,
		message: 'DROP TABLE IF EXISTS - THIS WILL DELETE DATA',
		severity: 'error',
	},
	{
		pattern: /DROP\s+TABLE.*CASCADE/gi,
		message: 'DROP TABLE CASCADE - THIS WILL DELETE DATA AND DEPENDENT OBJECTS',
		severity: 'error',
	},
	{
		pattern: /ALTER\s+TABLE\s+\S+\s+DROP\s+COLUMN/gi,
		message: 'DROP COLUMN - THIS WILL DELETE DATA',
		severity: 'error',
	},
	{
		pattern: /DROP\s+SCHEMA(?!\s+IF\s+EXISTS)/gi,
		message: 'DROP SCHEMA without IF EXISTS',
		severity: 'error',
	},
	{
		pattern: /DROP\s+SCHEMA\s+IF\s+EXISTS.*CASCADE/gi,
		message: 'DROP SCHEMA CASCADE - THIS WILL DELETE ALL TABLES IN SCHEMA',
		severity: 'error',
	},
	{
		pattern: /TRUNCATE\s+(?:TABLE\s+)?/gi,
		message: 'TRUNCATE - THIS WILL DELETE ALL DATA IN TABLE',
		severity: 'error',
	},
	{
		pattern: /DELETE\s+FROM\s+\S+\s*(?:;|$)/gim,
		message: 'DELETE FROM without WHERE clause - THIS WILL DELETE ALL DATA',
		severity: 'error',
	},
	{
		pattern: /DROP\s+INDEX(?!\s+CONCURRENTLY)/gi,
		message: 'DROP INDEX without CONCURRENTLY - may cause table locks',
		severity: 'warning',
	},
];

// Safe patterns that override destructive checks
const SAFE_PATTERNS = [
	// These patterns indicate safe, idempotent operations
	/CREATE\s+(?:TABLE|INDEX|SCHEMA|TYPE)\s+IF\s+NOT\s+EXISTS/gi,
	/DO\s+\$\$.*EXCEPTION.*WHEN\s+duplicate_object/gis, // Safe enum creation pattern
];

function findMigrationFiles(dir) {
	const files = [];

	if (!existsSync(dir)) {
		return files;
	}

	const entries = readdirSync(dir);

	for (const entry of entries) {
		const fullPath = join(dir, entry);
		const stat = statSync(fullPath);

		if (stat.isDirectory() && entry !== 'meta') {
			// Check subdirectories for .sql files
			files.push(...findMigrationFiles(fullPath));
		} else if (entry.endsWith('.sql')) {
			files.push(fullPath);
		}
	}

	return files;
}

function validateMigration(filePath) {
	const content = readFileSync(filePath, 'utf-8');
	const issues = [];

	// Check if file uses safe patterns throughout (reserved for future use)
	// const isSafeFile = SAFE_PATTERNS.some((pattern) => pattern.test(content));
	void SAFE_PATTERNS; // Silence unused warning - patterns reserved for future enhancements

	for (const { pattern, message, severity } of DESTRUCTIVE_PATTERNS) {
		// Reset regex lastIndex
		pattern.lastIndex = 0;

		let match;
		while ((match = pattern.exec(content)) !== null) {
			// Find line number
			const beforeMatch = content.substring(0, match.index);
			const lineNumber = (beforeMatch.match(/\n/g) || []).length + 1;

			issues.push({
				file: filePath,
				line: lineNumber,
				message,
				severity,
				match: match[0].trim(),
			});
		}
	}

	return issues;
}

function main() {
	const args = process.argv.slice(2);
	const allowDestructive = args.includes('--allow-destructive');

	console.log('🔍 Validating migration files for destructive patterns...\n');

	const allIssues = [];
	let filesChecked = 0;

	for (const dir of MIGRATION_DIRS) {
		const files = findMigrationFiles(dir);
		filesChecked += files.length;

		for (const file of files) {
			const issues = validateMigration(file);
			allIssues.push(...issues);
		}
	}

	// Separate errors and warnings
	const errors = allIssues.filter((i) => i.severity === 'error');
	const warnings = allIssues.filter((i) => i.severity === 'warning');

	console.log(`📁 Checked ${filesChecked} migration files\n`);

	if (warnings.length > 0) {
		console.log('⚠️  WARNINGS:\n');
		for (const issue of warnings) {
			console.log(`  ${issue.file}:${issue.line}`);
			console.log(`    ${issue.message}`);
			console.log(`    Found: ${issue.match}\n`);
		}
	}

	if (errors.length > 0) {
		console.log('❌ DESTRUCTIVE PATTERNS DETECTED:\n');
		for (const issue of errors) {
			console.log(`  ${issue.file}:${issue.line}`);
			console.log(`    ${issue.message}`);
			console.log(`    Found: ${issue.match}\n`);
		}

		if (allowDestructive) {
			console.log('⚠️  --allow-destructive flag set, continuing despite errors\n');
			console.log('🟡 Migration validation passed with warnings');
			process.exit(0);
		} else {
			console.log('💡 To proceed with destructive migrations, use --allow-destructive flag');
			console.log('   Or review and update the migration to use safe patterns.\n');
			console.log('❌ Migration validation FAILED');
			process.exit(1);
		}
	}

	console.log('✅ Migration validation passed - no destructive patterns found');
	process.exit(0);
}

main();
