import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pb.ulo.ad');

console.log('Testing authentication...\n');

// Test 1: Try to create a new test user
async function testRegistration() {
	const testEmail = `test_${Date.now()}@example.com`;
	const testPassword = 'TestPassword123!';

	console.log('1. Testing registration with:', testEmail);
	try {
		// Generate a random ID for PocketBase
		const randomId = Math.random().toString(36).substring(2, 17);
		const userData = {
			id: randomId,
			email: testEmail,
			password: testPassword,
			passwordConfirm: testPassword,
			emailVisibility: true
		};

		const newUser = await pb.collection('users').create(userData);
		console.log('✅ Registration successful! User ID:', newUser.id);

		// Try to login with the new user
		console.log('\n2. Testing login with newly created user...');
		const authData = await pb.collection('users').authWithPassword(testEmail, testPassword);
		console.log('✅ Login successful! Token:', authData.token.substring(0, 20) + '...');

		return { email: testEmail, password: testPassword };
	} catch (err) {
		console.error('❌ Registration failed:', err.response || err);
		return null;
	}
}

// Test 2: Try existing user
async function testExistingUser() {
	console.log('\n3. Testing with existing user: tills95@gmail.com');
	const passwords = ['dev123456', 'password', '12345678', 'admin123'];

	for (const password of passwords) {
		try {
			console.log(`   Trying password: ${password}`);
			const authData = await pb.collection('users').authWithPassword('tills95@gmail.com', password);
			console.log('✅ Login successful with password:', password);
			return true;
		} catch (err) {
			console.log(`   ❌ Failed with: ${password}`);
		}
	}
	return false;
}

// Test 3: Check collection rules
async function checkCollectionRules() {
	console.log('\n4. Checking collection configuration...');
	try {
		// This will fail without admin auth, but we can see the error
		const response = await fetch('https://pb.ulo.ad/api/collections/users', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (response.status === 403) {
			console.log('   ⚠️  Collection info requires admin auth (expected)');
		} else {
			const data = await response.json();
			console.log('   Collection info:', data);
		}
	} catch (err) {
		console.log('   Error checking collection:', err.message);
	}
}

// Run all tests
async function runTests() {
	console.log('🔍 Starting authentication debug...\n');
	console.log('PocketBase URL: https://pb.ulo.ad');
	console.log('=====================================\n');

	// Test registration and login
	const newUser = await testRegistration();

	// Test existing user
	await testExistingUser();

	// Check collection
	await checkCollectionRules();

	if (newUser) {
		console.log('\n✅ Test user created successfully!');
		console.log('Email:', newUser.email);
		console.log('Password:', newUser.password);
		console.log('\nYou can use these credentials to test login in the app.');
	}

	console.log('\n=====================================');
	console.log('Debug complete!\n');
}

runTests().catch(console.error);
