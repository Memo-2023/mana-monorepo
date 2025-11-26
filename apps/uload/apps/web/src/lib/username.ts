// Reserved usernames that cannot be used
export const RESERVED_USERNAMES = [
	'admin',
	'api',
	'app',
	'blog',
	'dashboard',
	'help',
	'login',
	'logout',
	'register',
	'settings',
	'support',
	'www',
	'mail',
	'ftp',
	'email',
	'about',
	'privacy',
	'terms',
	'security',
	'contact',
	'legal',
	'docs',
	'documentation',
	'status',
	'cdn',
	'assets',
	'public',
	'static',
	'media',
	'css',
	'js',
	'images',
	'img',
	'fonts',
	'download',
	'downloads',
	'u',
	'user',
	'users',
	'profile',
	'account',
	'accounts',
	'auth',
	'oauth',
	'signin',
	'signup',
	'signout',
	'reset',
	'verify',
	'confirm',
	'analytics'
];

export function validateUsername(username: string): { valid: boolean; error?: string } {
	// Check length
	if (username.length < 3) {
		return { valid: false, error: 'Username must be at least 3 characters' };
	}
	if (username.length > 30) {
		return { valid: false, error: 'Username must be less than 30 characters' };
	}

	// Check format (alphanumeric, underscore, hyphen)
	if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
		return {
			valid: false,
			error: 'Username can only contain letters, numbers, underscore and hyphen'
		};
	}

	// Must start with letter or number
	if (!/^[a-zA-Z0-9]/.test(username)) {
		return { valid: false, error: 'Username must start with a letter or number' };
	}

	// Check reserved names
	if (RESERVED_USERNAMES.includes(username.toLowerCase())) {
		return { valid: false, error: 'This username is reserved' };
	}

	return { valid: true };
}

export function generateUsernameFromEmail(email: string): string {
	const localPart = email.split('@')[0];
	// Remove special characters and convert to valid username
	let username = localPart.replace(/[^a-zA-Z0-9_-]/g, '');

	// Ensure it starts with letter or number
	if (!/^[a-zA-Z0-9]/.test(username)) {
		username = 'user' + username;
	}

	// Ensure minimum length
	if (username.length < 3) {
		username = username + Math.random().toString(36).substring(2, 5);
	}

	// Truncate if too long
	if (username.length > 30) {
		username = username.substring(0, 30);
	}

	return username;
}
