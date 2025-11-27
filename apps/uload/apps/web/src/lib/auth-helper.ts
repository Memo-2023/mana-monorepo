import { pb } from './pocketbase';
import { generateUsernameFromEmail } from './username';

export interface RegisterData {
	email: string;
	password: string;
	passwordConfirm: string;
}

export interface RegisterResult {
	success: boolean;
	user?: any;
	error?: string;
}

export async function registerUser(data: RegisterData): Promise<RegisterResult> {
	try {
		const email = data.email.toLowerCase().trim();

		// Basic validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return { success: false, error: 'Please enter a valid email address' };
		}

		if (data.password !== data.passwordConfirm) {
			return { success: false, error: 'Passwords do not match' };
		}

		if (data.password.length < 8) {
			return { success: false, error: 'Password must be at least 8 characters' };
		}

		// Generate unique username
		let username = generateUsernameFromEmail(email);
		let attempts = 0;

		// Try to find unique username
		while (attempts < 10) {
			try {
				await pb.collection('users').getFirstListItem(`username="${username}"`);
				// Username exists, add random suffix
				username = `${generateUsernameFromEmail(email)}${Math.floor(Math.random() * 9999)}`;
				attempts++;
			} catch {
				// Username is available
				break;
			}
		}

		// Create user with minimal data - DO NOT provide ID
		const userData = {
			email,
			password: data.password,
			passwordConfirm: data.passwordConfirm,
			username,
			emailVisibility: true,
		};

		console.log('Creating user with minimal data:', { email, username });
		console.log('PocketBase URL:', pb.baseUrl);

		const newUser = await pb.collection('users').create(userData);

		// Auto-login after registration
		try {
			await pb.collection('users').authWithPassword(email, data.password);
		} catch (loginErr) {
			console.error('Auto-login failed:', loginErr);
			// User created but login failed - still success
		}

		return {
			success: true,
			user: newUser,
		};
	} catch (error: any) {
		console.error('Registration error:', error);

		// Parse error details
		const errorData = error?.response?.data || error?.data?.data || error?.data || {};

		// Log full error for debugging
		console.error('Full registration error:', JSON.stringify(errorData, null, 2));

		// Handle specific errors
		if (errorData.email?.message) {
			if (errorData.email.message.includes('already exists')) {
				return { success: false, error: 'This email is already registered. Please login instead.' };
			}
			return { success: false, error: errorData.email.message };
		}

		if (errorData.username?.message) {
			// Try again with different username
			console.log('Username conflict, this should not happen');
			return { success: false, error: 'Username generation failed. Please try again.' };
		}

		if (errorData.password?.message) {
			return { success: false, error: errorData.password.message };
		}

		if (errorData.id?.message) {
			// ID error - this is the main issue we're trying to fix
			console.error('Critical: ID field error detected');
			console.error('ID error details:', errorData.id);
			// Try to understand the error
			if (errorData.id.message.includes('blank') || errorData.id.message.includes('required')) {
				console.error('PocketBase is not auto-generating IDs!');
			}
			return {
				success: false,
				error: 'Registration system error. Please try again later or contact support.',
			};
		}

		// Check for any field-level errors
		for (const field in errorData) {
			if (typeof errorData[field] === 'object' && errorData[field]?.message) {
				return { success: false, error: `${field}: ${errorData[field].message}` };
			}
		}

		// Generic error
		return {
			success: false,
			error: error?.message || 'Registration failed. Please try again.',
		};
	}
}

export async function loginUser(email: string, password: string) {
	try {
		const authData = await pb
			.collection('users')
			.authWithPassword(email.toLowerCase().trim(), password);
		return { success: true, user: authData.record };
	} catch (error: any) {
		console.error('Login error:', error);
		return {
			success: false,
			error: 'Invalid email or password',
		};
	}
}
