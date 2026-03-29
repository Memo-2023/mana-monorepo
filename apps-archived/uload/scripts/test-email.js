import PocketBase from 'pocketbase';

const pb = new PocketBase('http://localhost:8090');

// Test email - ersetze mit deiner E-Mail
const testEmail = 'test@example.com'; // HIER DEINE EMAIL EINGEBEN!

async function testEmailFunctions() {
	console.log('🔧 Testing PocketBase Email Functions...\n');

	try {
		// 1. Test Password Reset
		console.log('1️⃣ Testing Password Reset Email...');
		try {
			await pb.collection('users').requestPasswordReset(testEmail);
			console.log('✅ Password reset email request sent successfully');
			console.log('   Check your inbox for the password reset email\n');
		} catch (error) {
			console.error('❌ Password reset failed:', error.message);
			console.log('   Error details:', error.response?.data || error);
		}

		// 2. Test Verification Email (needs existing unverified user)
		console.log('2️⃣ Testing Verification Email...');
		try {
			await pb.collection('users').requestVerification(testEmail);
			console.log('✅ Verification email request sent successfully');
			console.log('   Check your inbox for the verification email\n');
		} catch (error) {
			console.error('❌ Verification email failed:', error.message);
			console.log('   Error details:', error.response?.data || error);
		}

		// 3. Check PocketBase health
		console.log('3️⃣ Checking PocketBase health...');
		try {
			const health = await pb.health.check();
			console.log('✅ PocketBase is healthy:', health);
		} catch (error) {
			console.error('❌ PocketBase health check failed:', error.message);
		}
	} catch (error) {
		console.error('❌ General error:', error);
	}

	console.log('\n📌 Important checks:');
	console.log('1. Is PocketBase running? (http://localhost:8090)');
	console.log('2. Are SMTP settings configured in PocketBase?');
	console.log('3. Is the Application URL set in PocketBase settings?');
	console.log('4. Check PocketBase logs: Admin → Logs');
}

// Run tests
testEmailFunctions();
