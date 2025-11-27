import { tokenManager } from '../services/tokenManager';

/**
 * API Client with automatic token injection and refresh via TokenManager
 */

export interface ApiRequestOptions extends RequestInit {
	skipAuth?: boolean; // Skip adding Authorization header
	skipRefresh?: boolean; // Skip automatic token refresh on 401
}

/**
 * Make an authenticated API request with automatic token refresh
 * Uses TokenManager for robust token handling with request queuing
 */
export async function fetchWithAuth(
	endpoint: string,
	options: ApiRequestOptions = {}
): Promise<Response> {
	const { skipAuth = false, skipRefresh = false, ...fetchOptions } = options;

	// Get valid token from TokenManager (auto-refreshes if needed)
	const appToken = skipAuth ? null : await tokenManager.getValidToken();

	if (!appToken && !skipAuth) {
		throw new Error('Not authenticated');
	}

	// Prepare authenticated options
	const authenticatedOptions: RequestInit = {
		...fetchOptions,
		headers: {
			'Content-Type': 'application/json',
			...fetchOptions.headers,
			...(appToken && !skipAuth ? { Authorization: `Bearer ${appToken}` } : {}),
		},
	};

	// Make the request
	const response = await fetch(endpoint, authenticatedOptions);

	// Handle token expiration with TokenManager (with request queuing)
	if (response.status === 401 && !skipRefresh && !skipAuth) {
		// Let TokenManager handle the 401 - it will queue this request if a refresh is in progress
		return tokenManager.handle401Response(endpoint, authenticatedOptions);
	}

	return response;
}

/**
 * Make an authenticated GET request
 */
export async function get<T = any>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
	const response = await fetchWithAuth(endpoint, {
		...options,
		method: 'GET',
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ message: 'Request failed' }));
		throw new Error(error.message || `GET request failed: ${response.status}`);
	}

	return response.json();
}

/**
 * Make an authenticated POST request
 */
export async function post<T = any>(
	endpoint: string,
	data?: any,
	options?: ApiRequestOptions
): Promise<T> {
	const response = await fetchWithAuth(endpoint, {
		...options,
		method: 'POST',
		body: data ? JSON.stringify(data) : undefined,
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ message: 'Request failed' }));
		throw new Error(error.message || `POST request failed: ${response.status}`);
	}

	return response.json();
}

/**
 * Make an authenticated PUT request
 */
export async function put<T = any>(
	endpoint: string,
	data?: any,
	options?: ApiRequestOptions
): Promise<T> {
	const response = await fetchWithAuth(endpoint, {
		...options,
		method: 'PUT',
		body: data ? JSON.stringify(data) : undefined,
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ message: 'Request failed' }));
		throw new Error(error.message || `PUT request failed: ${response.status}`);
	}

	return response.json();
}

/**
 * Make an authenticated DELETE request
 */
export async function del<T = any>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
	const response = await fetchWithAuth(endpoint, {
		...options,
		method: 'DELETE',
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ message: 'Request failed' }));
		throw new Error(error.message || `DELETE request failed: ${response.status}`);
	}

	return response.json();
}

/**
 * Make an authenticated PATCH request
 */
export async function patch<T = any>(
	endpoint: string,
	data?: any,
	options?: ApiRequestOptions
): Promise<T> {
	const response = await fetchWithAuth(endpoint, {
		...options,
		method: 'PATCH',
		body: data ? JSON.stringify(data) : undefined,
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ message: 'Request failed' }));
		throw new Error(error.message || `PATCH request failed: ${response.status}`);
	}

	return response.json();
}

// Export all methods as a default object
export default {
	fetchWithAuth,
	get,
	post,
	put,
	delete: del,
	patch,
};
