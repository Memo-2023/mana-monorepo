import PocketBase from 'pocketbase';

// Produktions-PocketBase URL
const PROD_POCKETBASE_URL = 'http://pocketbase-xs0ccokk8s0goko4w40gwc0w.91.99.221.179.sslip.io';

console.log('Testing PRODUCTION PocketBase connection...');
console.log('URL:', PROD_POCKETBASE_URL);
console.log('----------------------------------------\n');

const pb = new PocketBase(PROD_POCKETBASE_URL);

async function testConnection() {
	try {
		// Test 1: Check health endpoint
		console.log('1. Testing health endpoint...');
		try {
			const response = await fetch(`${PROD_POCKETBASE_URL}/api/health`);
			const health = await response.json();
			console.log('✓ Health check:', health);
		} catch (e) {
			console.log('✗ Health check failed:', e.message);
		}

		// Test 2: List collections (using MCP)
		console.log('\n2. Testing collections access...');
		try {
			const collections = await pb.collections.getList();
			console.log(
				'✓ Collections found:',
				collections.items.map((c) => c.name)
			);

			// Check for users collection specifically
			const hasUsers = collections.items.some((c) => c.name === 'users');
			if (hasUsers) {
				console.log('✓ Users collection exists');
			} else {
				console.log('✗ Users collection NOT found!');
			}
		} catch (e) {
			console.log('✗ Cannot list collections:', e.message);
		}

		// Test 3: Check users collection schema
		console.log('\n3. Checking users collection schema...');
		try {
			const usersCollection = await pb.collections.getOne('users');
			console.log('✓ Users collection fields:');
			usersCollection.schema.forEach((field) => {
				console.log(
					`   - ${field.name}: ${field.type} ${field.required ? '(required)' : '(optional)'}`
				);
			});

			// Check authentication settings
			console.log('\n✓ Authentication settings:');
			console.log(
				`   - Password auth enabled: ${usersCollection.options?.allowEmailAuth || false}`
			);
			console.log(`   - OAuth2 enabled: ${usersCollection.options?.allowOAuth2Auth || false}`);
		} catch (e) {
			console.log('✗ Cannot get users collection:', e.message);
		}

		// Test 4: Check API rules
		console.log('\n4. Checking API rules for users collection...');
		try {
			const usersCollection = await pb.collections.getOne('users');
			console.log('API Rules:');
			console.log(`   - List rule: ${usersCollection.listRule || 'none'}`);
			console.log(`   - View rule: ${usersCollection.viewRule || 'none'}`);
			console.log(`   - Create rule: ${usersCollection.createRule || 'none'}`);
			console.log(`   - Update rule: ${usersCollection.updateRule || 'none'}`);
			console.log(`   - Delete rule: ${usersCollection.deleteRule || 'none'}`);
		} catch (e) {
			console.log('✗ Cannot check API rules:', e.message);
		}

		// Test 5: Test registration endpoint
		console.log('\n5. Testing registration endpoint...');
		const testEmail = `test${Date.now()}@example.com`;
		const testUsername = `testuser${Date.now()}`;

		try {
			console.log(`   Attempting to register: ${testEmail}`);
			const result = await pb.collection('users').create({
				email: testEmail,
				password: 'Test123456!',
				passwordConfirm: 'Test123456!',
				username: testUsername
			});
			console.log('✓ Registration successful! User ID:', result.id);

			// Try to delete test user
			try {
				await pb.collection('users').delete(result.id);
				console.log('✓ Test user cleaned up');
			} catch (e) {
				console.log('⚠ Could not clean up test user:', e.message);
			}
		} catch (e) {
			console.error('✗ Registration failed!');
			console.error('   Error:', e.message);
			if (e.response?.data) {
				console.error('   Details:', JSON.stringify(e.response.data, null, 2));
			}
			if (e.data) {
				console.error('   Data:', JSON.stringify(e.data, null, 2));
			}
		}

		// Test 6: Check CORS settings
		console.log('\n6. Checking CORS...');
		try {
			const response = await fetch(`${PROD_POCKETBASE_URL}/api/collections`, {
				method: 'GET',
				headers: {
					Origin: 'https://your-frontend-domain.com'
				}
			});
			console.log(
				'✓ CORS headers present:',
				response.headers.get('access-control-allow-origin') || 'not set'
			);
		} catch (e) {
			console.log('✗ CORS check failed:', e.message);
		}
	} catch (error) {
		console.error('\n✗ Connection test failed:', error.message);
		if (error.response) {
			console.error('Response:', error.response);
		}
		process.exit(1);
	}
}

// Run the connection test
testConnection();
