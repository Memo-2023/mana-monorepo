import PocketBase from 'pocketbase';

// Test verschiedene URL-Varianten
const urls = [
	'http://pocketbase-xs0ccokk8s0goko4w40gwc0w.91.99.221.179.sslip.io', // ohne trailing slash
	'http://pocketbase-xs0ccokk8s0goko4w40gwc0w.91.99.221.179.sslip.io/' // mit trailing slash
];

console.log('Testing different URL configurations...\n');

async function testUrl(url) {
	console.log(`Testing: ${url}`);
	console.log('-'.repeat(60));

	try {
		const pb = new PocketBase(url);

		// Test 1: Health check
		const healthUrl = `${url}/api/health`;
		const healthResponse = await fetch(healthUrl);
		console.log(`✓ Health check status: ${healthResponse.status}`);

		// Test 2: Registration
		const testEmail = `test${Date.now()}@example.com`;
		const testUsername = `user${Date.now()}`;

		const userData = {
			email: testEmail,
			password: 'TestPass123!',
			passwordConfirm: 'TestPass123!',
			username: testUsername,
			name: 'Test User',
			emailVisibility: true
		};

		console.log(`  Attempting registration with: ${testEmail}`);

		try {
			const result = await pb.collection('users').create(userData);
			console.log(`✓ Registration successful! User ID: ${result.id}`);

			// Clean up
			try {
				await pb.collection('users').delete(result.id);
				console.log('✓ Test user cleaned up');
			} catch (e) {
				console.log('⚠ Could not clean up test user');
			}
		} catch (err) {
			console.error(`✗ Registration failed: ${err.message}`);
			if (err.response?.data) {
				console.error('  Error details:', JSON.stringify(err.response.data, null, 2));
			}
		}

		console.log('✓ URL configuration works!\n');
		return true;
	} catch (error) {
		console.error(`✗ URL configuration failed: ${error.message}\n`);
		return false;
	}
}

// Test all URLs
async function testAll() {
	for (const url of urls) {
		const success = await testUrl(url);
		if (success) {
			console.log(`\n🎉 WORKING URL: ${url}`);
			console.log('Use this exact URL in your environment variables (without quotes)');
			break;
		}
	}
}

testAll();
