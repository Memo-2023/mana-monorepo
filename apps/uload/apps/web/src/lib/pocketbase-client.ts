import PocketBase from 'pocketbase';
import { dev } from '$app/environment';

// Use environment-specific PocketBase URL
const POCKETBASE_URL =
	import.meta.env.PUBLIC_POCKETBASE_URL || (dev ? 'http://localhost:8090' : 'https://pb.ulo.ad');

// Create PocketBase instance with Cloudflare-friendly settings
export function createPocketBaseClient() {
	const pb = new PocketBase(POCKETBASE_URL);

	// Disable auto-cancellation to prevent request issues
	pb.autoCancellation(false);

	// Add timeout for better error handling
	pb.beforeSend = function (url, options) {
		options.signal = AbortSignal.timeout(30000); // 30 second timeout

		// Add headers for Cloudflare compatibility
		options.headers = {
			...options.headers,
			'X-Requested-With': 'XMLHttpRequest',
		};

		return { url, options };
	};

	return pb;
}
