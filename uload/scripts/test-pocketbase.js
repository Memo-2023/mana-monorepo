import PocketBase from 'pocketbase';

const POCKETBASE_URL = process.env.PUBLIC_POCKETBASE_URL || 'http://localhost:8090';

console.log('Testing PocketBase connection...');
console.log('URL:', POCKETBASE_URL);

const pb = new PocketBase(POCKETBASE_URL);

async function testConnection() {
	try {
		// Test 1: Check health endpoint
		const health = await pb.health.check();
		console.log('✓ Health check passed:', health);

		// Test 2: List collections
		const collections = await pb.collections.getList();
		console.log(
			'✓ Collections found:',
			collections.items.map((c) => c.name)
		);

		// Test 3: Check users collection
		const usersCollection = await pb.collections.getOne('users');
		console.log('✓ Users collection schema:', {
			name: usersCollection.name,
			fields: usersCollection.schema.map((f) => ({
				name: f.name,
				type: f.type,
				required: f.required
			}))
		});

		// Test 4: Try to list users (might fail due to permissions)
		try {
			const users = await pb.collection('users').getList(1, 1);
			console.log('✓ Can list users:', users.totalItems, 'total users');
		} catch (e) {
			console.log('⚠ Cannot list users (probably permission issue):', e.message);
		}

		// Test 5: Test registration endpoint
		console.log('\nTesting registration capability...');
		const testEmail = `test${Date.now()}@example.com`;
		try {
			const result = await pb.collection('users').create({
				email: testEmail,
				password: 'Test123456!',
				passwordConfirm: 'Test123456!',
				username: `testuser${Date.now()}`
			});
			console.log('✓ Registration test successful, user created:', result.id);
			// Clean up test user
			await pb.collection('users').delete(result.id);
			console.log('✓ Test user cleaned up');
		} catch (e) {
			console.error('✗ Registration failed:', e.response || e.message);
			if (e.response?.data) {
				console.error('Error details:', JSON.stringify(e.response.data, null, 2));
			}
		}
	} catch (error) {
		console.error('✗ Connection failed:', error.message);
		if (error.response) {
			console.error('Response:', error.response);
		}
		process.exit(1);
	}
}

testConnection();
