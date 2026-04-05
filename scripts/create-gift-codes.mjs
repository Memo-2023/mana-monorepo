#!/usr/bin/env node

/**
 * Creates multiple gift codes via the mana-auth API
 *
 * Usage:
 *   node scripts/create-gift-codes.mjs
 *
 * Requirements:
 *   - mana-auth must be running
 *   - Valid credentials (uses claude-test@mana.how by default)
 */

const AUTH_URL = process.env.AUTH_URL || 'http://localhost:3001';
const EMAIL = process.env.AUTH_EMAIL || 'claude-test@mana.how';
const PASSWORD = process.env.AUTH_PASSWORD || 'ClaudeTest2024';

const NUM_CODES = 10;
const CREDITS_PER_CODE = 1000;

async function login() {
	console.log(`Logging in as ${EMAIL}...`);

	const response = await fetch(`${AUTH_URL}/api/v1/auth/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Login failed: ${response.status} - ${error}`);
	}

	const data = await response.json();
	return data.accessToken;
}

async function createGiftCode(token, credits, message) {
	const response = await fetch(`${AUTH_URL}/api/v1/gifts`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({
			credits,
			type: 'simple',
			message: message || `Gift of ${credits} Mana`,
		}),
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Failed to create gift code: ${response.status} - ${error}`);
	}

	return response.json();
}

async function main() {
	console.log(`Creating ${NUM_CODES} gift codes with ${CREDITS_PER_CODE} Mana each...\n`);

	const token = await login();
	console.log('Login successful!\n');

	const codes = [];

	for (let i = 0; i < NUM_CODES; i++) {
		try {
			const result = await createGiftCode(token, CREDITS_PER_CODE, `Mana Gift #${i + 1}`);
			codes.push({
				code: result.code,
				url: result.url,
				credits: result.totalCredits,
			});
			console.log(`✓ Created code ${i + 1}/${NUM_CODES}: ${result.code} (${result.url})`);
		} catch (error) {
			console.error(`✗ Failed to create code ${i + 1}: ${error.message}`);
		}
	}

	// Output summary
	console.log('\n' + '='.repeat(60));
	console.log(`Successfully created ${codes.length}/${NUM_CODES} codes\n`);

	if (codes.length > 0) {
		console.log('GIFT CODES:');
		console.log('-'.repeat(60));
		codes.forEach((c, i) => {
			console.log(`${i + 1}. ${c.code}  →  ${c.url}  (${c.credits} Mana)`);
		});
		console.log('-'.repeat(60));

		// Also write to file
		const fs = await import('fs');
		const date = new Date().toISOString().split('T')[0];
		const filename = `gift-codes-${date}.txt`;

		let fileContent = `Mana Gift Codes - Created ${new Date().toISOString()}\n`;
		fileContent += `${codes.length} codes with ${CREDITS_PER_CODE} Mana each\n`;
		fileContent += '='.repeat(60) + '\n\n';

		codes.forEach((c, i) => {
			fileContent += `${i + 1}. Code: ${c.code}\n`;
			fileContent += `   URL:  ${c.url}\n`;
			fileContent += `   Mana: ${c.credits}\n\n`;
		});

		fileContent += '='.repeat(60) + '\n';
		fileContent += 'Simple list for sharing:\n\n';
		codes.forEach((c) => {
			fileContent += `${c.url}\n`;
		});

		fs.writeFileSync(filename, fileContent);
		console.log(`\nSaved to: ${filename}`);
	}
}

main().catch(console.error);
