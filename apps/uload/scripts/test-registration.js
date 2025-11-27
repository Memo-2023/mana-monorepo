import PocketBase from 'pocketbase';

const pb = new PocketBase('http://localhost:8090');

// Generiere eine zufällige Test-E-Mail
const timestamp = Date.now();
const testEmail = `test${timestamp}@example.com`;
const testPassword = 'TestPassword123!';

async function testRegistration() {
	console.log('🔧 Testing Registration and Verification Email...\n');
	console.log(`📧 Test email: ${testEmail}`);
	console.log(`🔑 Test password: ${testPassword}\n`);

	try {
		// 1. Erstelle einen neuen User
		console.log('1️⃣ Creating new user...');
		const newUser = await pb.collection('users').create({
			email: testEmail,
			password: testPassword,
			passwordConfirm: testPassword,
			username: `user${timestamp}`,
			emailVisibility: true,
		});

		console.log('✅ User created successfully');
		console.log('   User ID:', newUser.id);
		console.log('   Verified:', newUser.verified);
		console.log('');

		// PocketBase sollte automatisch eine Verification-E-Mail senden
		// wenn SMTP konfiguriert ist

		// 2. Warte kurz
		console.log('⏳ Waiting 2 seconds...\n');
		await new Promise((resolve) => setTimeout(resolve, 2000));

		// 3. Versuche manuell eine Verification-E-Mail zu senden
		console.log('2️⃣ Manually requesting verification email...');
		try {
			await pb.collection('users').requestVerification(testEmail);
			console.log('✅ Manual verification email request sent');
			console.log('   Check if you received 1 or 2 emails');
		} catch (error) {
			console.error('❌ Manual verification failed:', error.message);
		}
	} catch (error) {
		console.error('❌ Registration failed:', error);
		if (error.response) {
			console.error('   Response:', error.response.data);
		}
	}

	console.log('\n📌 Check your email logs/inbox for:');
	console.log(`   - Email to: ${testEmail}`);
	console.log('   - Should receive verification email(s)');
	console.log('\n📌 Also check:');
	console.log('   - PocketBase Admin → Logs');
	console.log('   - PocketBase Admin → Settings → Mail settings');
	console.log('   - Application URL is set correctly');
}

// Run test
testRegistration();
