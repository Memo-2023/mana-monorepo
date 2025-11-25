import PocketBase from 'pocketbase';

const pb = new PocketBase('http://localhost:8090');

console.log('Testing PocketBase connection...');

try {
	// Test health endpoint
	const health = await fetch('http://localhost:8090/api/health');
	const healthData = await health.json();
	console.log('Health check:', healthData);

	// Try to create a test user
	const testUser = await pb.collection('users').create({
		email: `test${Date.now()}@example.com`,
		password: 'testpassword123',
		passwordConfirm: 'testpassword123',
		username: `testuser${Date.now()}`,
		name: 'Test User',
		emailVisibility: true
	});

	console.log('✅ User created successfully:', testUser.id);
	console.log('Username:', testUser.username);
	console.log('Email:', testUser.email);

	// Clean up - delete test user
	await pb.collection('users').delete(testUser.id);
	console.log('✅ Test user deleted');
} catch (error) {
	console.error('❌ Error:', error.message);
	if (error.data) {
		console.error('Error details:', JSON.stringify(error.data, null, 2));
	}
}
