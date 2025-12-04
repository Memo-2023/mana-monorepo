import { redirect, error, fail } from '@sveltejs/kit';
import { parseUserAgent } from '$lib/pocketbase';
import type { Link } from '$lib/pocketbase';
import { linkCache } from '$lib/server/linkCache';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({
	params,
	request,
	getClientAddress,
	cookies,
	locals,
}) => {
	const { slug } = params;

	// Parse slug - could be either:
	// 1. Random code: "abc123"
	// 2. Username/custom code: "u/username/project" -> stored as "username/project"
	let shortCode: string;

	if (typeof slug === 'string') {
		shortCode = slug;
	} else if (Array.isArray(slug)) {
		// Join array elements with slash (SvelteKit [...slug] behavior)
		shortCode = slug.join('/');
	} else {
		error(404, 'Invalid URL format');
	}

	// Handle /u/username/code format - strip the 'u/' prefix
	// Links are stored as "username/code" in the database
	if (shortCode.startsWith('u/')) {
		shortCode = shortCode.substring(2); // Remove 'u/' prefix
		console.log('Stripped u/ prefix, now looking for:', shortCode);
	}

	console.log('Looking for link with short_code:', shortCode);

	// First, try to get from Redis cache (SUPER FAST!)
	const cachedUrl = await linkCache.getRedirectUrl(shortCode);
	if (cachedUrl) {
		console.log('Cache HIT! Redirecting from cache');
		// For cached redirects, we skip all checks for maximum speed
		// The cache is only populated with valid, active links
		throw redirect(302, cachedUrl);
	}

	console.log('Cache MISS - fetching from PocketBase');
	console.log('PocketBase URL:', locals.pb.baseUrl);

	// Try to get the link directly by short_code
	let link;
	try {
		link = await locals.pb.collection('links').getFirstListItem<Link>(`short_code="${shortCode}"`);
		console.log('Found link:', link);

		// Cache the link for future requests (if it's valid)
		if (
			link.is_active &&
			!link.password &&
			(!link.expires_at || new Date(link.expires_at) > new Date())
		) {
			await linkCache.cacheRedirect(shortCode, link.original_url);
			console.log('Cached redirect for future use');
		}
	} catch (fetchErr: any) {
		console.error('Failed to fetch link:', fetchErr);
		console.error('Error details:', fetchErr.response || fetchErr.message);

		// Try to see if any links exist for debugging
		try {
			const testList = await locals.pb.collection('links').getList(1, 5);
			console.log('Total links in database:', testList.totalItems);
			console.log(
				'Sample links:',
				testList.items.map((l) => l.short_code)
			);
		} catch (e) {
			console.error('Cannot list links:', e);
		}

		throw error(404, 'Link not found');
	}

	// Check if link is active
	if (!link.is_active) {
		throw error(410, 'This link is no longer active');
	}

	// Check if link has expired
	if (link.expires_at && new Date(link.expires_at) < new Date()) {
		throw error(410, 'This link has expired');
	}

	// Check click count
	try {
		const clicks = await locals.pb.collection('clicks').getList(1, 1, {
			filter: `link_id="${link.id}"`,
			sort: '-created',
		});
		const totalClicks = clicks.totalItems;

		if (link.max_clicks && totalClicks >= link.max_clicks) {
			throw error(410, 'This link has reached its maximum click limit');
		}
	} catch (clickErr: any) {
		// If it's our error, re-throw it
		if (clickErr?.status === 410) {
			throw clickErr;
		}
		// Otherwise, log and continue (don't fail on click count check)
		console.error('Failed to check click count:', clickErr);
	}

	// Check if password is required
	if (link.password) {
		const sessionKey = `link_auth_${link.id}`;
		const isAuthenticated = cookies.get(sessionKey) === 'true';

		if (!isAuthenticated) {
			return {
				requiresPassword: true,
				linkId: link.id,
			};
		}
	}

	// Record the click (but don't fail if it doesn't work)
	const userAgent = request.headers.get('user-agent') || '';
	const referer = request.headers.get('referer') || '';
	const ipAddress = getClientAddress();
	const { browser, deviceType, os } = parseUserAgent(userAgent);

	// Simple location detection (no external services needed)
	let country = 'Unknown';
	let city = 'Unknown';

	// For local/development IPs, use mock data
	if (ipAddress === '::1' || ipAddress === '127.0.0.1') {
		country = 'Germany';
		city = 'Munich';
	}

	try {
		await locals.pb.collection('clicks').create({
			link_id: link.id,
			ip_hash: ipAddress,
			user_agent: userAgent,
			referer: referer,
			browser: browser,
			device_type: deviceType,
			os: os,
			country: country,
			city: city,
			clicked_at: new Date().toISOString(),
		});
		console.log('Click recorded successfully');
	} catch (clickErr) {
		console.error('Failed to record click:', clickErr);
		// Don't fail the redirect if click recording fails
	}

	// Perform the redirect
	console.log('Redirecting to:', link.original_url);
	throw redirect(302, link.original_url);
};

export const actions = {
	unlock: async ({ request, params, cookies, locals }) => {
		const data = await request.formData();
		const password = data.get('password') as string;
		const { code } = params;

		let link;
		try {
			link = await locals.pb.collection('links').getFirstListItem<Link>(`short_code="${code}"`);
		} catch (err) {
			return fail(404, { error: 'Link not found' });
		}

		if (link.password !== password) {
			return fail(400, { error: 'Incorrect password' });
		}

		const sessionKey = `link_auth_${link.id}`;
		cookies.set(sessionKey, 'true', {
			path: '/',
			maxAge: 60 * 60 * 24,
			httpOnly: true,
			sameSite: 'lax',
		});

		// Redirect back to the same URL to trigger the load function again
		throw redirect(303, `/${code}`);
	},
} satisfies Actions;
