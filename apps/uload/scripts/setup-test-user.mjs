import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pb.ulo.ad');

async function createTestUser() {
	const email = 'test@example.com';
	const password = 'test123456';
	const randomId = Math.random().toString(36).substring(2, 17);

	console.log('Creating test user...');
	console.log('Email:', email);
	console.log('Password:', password);

	try {
		// First check if user already exists
		const existing = await pb.collection('users').getList(1, 1, {
			filter: `email = "${email}"`
		});

		if (existing.items.length > 0) {
			console.log('✅ Test user already exists!');
			console.log('ID:', existing.items[0].id);

			// Try to login
			try {
				await pb.collection('users').authWithPassword(email, password);
				console.log('✅ Login successful with existing user!');
			} catch (err) {
				console.log('⚠️ User exists but password might be different');
			}
			return;
		}
	} catch (err) {
		// User doesn't exist, continue to create
	}

	try {
		const userData = {
			id: randomId,
			email: email,
			password: password,
			passwordConfirm: password,
			emailVisibility: true,
			username: 'testuser'
		};

		const newUser = await pb.collection('users').create(userData);
		console.log('✅ Test user created successfully!');
		console.log('ID:', newUser.id);

		// Verify login works
		const authData = await pb.collection('users').authWithPassword(email, password);
		console.log('✅ Login verified! Token:', authData.token.substring(0, 20) + '...');
	} catch (err) {
		console.error('❌ Failed to create test user:', err.response || err);
	}
}

createTestUser().catch(console.error);
