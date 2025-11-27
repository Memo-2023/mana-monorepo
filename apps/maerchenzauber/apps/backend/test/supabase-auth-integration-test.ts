import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/core/services/auth.service';

async function testSupabaseAuthIntegration() {
	// Create a NestJS application instance
	const app = await NestFactory.createApplicationContext(AppModule);

	try {
		// Get the AuthService
		const authService = app.get(AuthService);

		// Test user data
		const userId = 'test-user-id';
		const email = 'test@example.com';

		// Generate a Supabase-compatible token
		const token = await authService.generateSupabaseCompatibleToken(userId, email);
		console.log('Generated Supabase-compatible token:', token);

		// Create an authenticated Supabase client
		const supabaseClient = authService.getAuthenticatedClient(token);

		// Test a simple query to verify authentication
		const { data, error } = await supabaseClient.from('your_table_name').select('*').limit(1);

		if (error) {
			console.error('Error querying Supabase with the token:', error);
		} else {
			console.log('Successfully authenticated with Supabase! Sample data:', data);
		}
	} catch (error) {
		console.error('Test failed:', error);
	} finally {
		await app.close();
	}
}

// Run the test
testSupabaseAuthIntegration()
	.then(() => console.log('Test completed'))
	.catch((err) => console.error('Test error:', err));
