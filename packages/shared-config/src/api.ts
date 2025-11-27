/**
 * API endpoint construction utilities
 */

/**
 * API configuration
 */
export interface ApiConfig {
	/** Base URL for the API */
	baseUrl: string;
	/** API version prefix (e.g., 'v1') */
	version?: string;
	/** Default timeout in milliseconds */
	timeout?: number;
	/** Default headers */
	headers?: Record<string, string>;
}

/**
 * Create API endpoint URL builder
 */
export function createApiBuilder(config: ApiConfig) {
	const { baseUrl, version } = config;

	// Remove trailing slash from base URL
	const base = baseUrl.replace(/\/$/, '');

	// Build base path with optional version
	const basePath = version ? `${base}/${version}` : base;

	return {
		/**
		 * Build endpoint URL from path segments
		 */
		endpoint(...segments: (string | number)[]): string {
			const path = segments
				.map(String)
				.map((s) => s.replace(/^\/+|\/+$/g, '')) // Remove leading/trailing slashes
				.filter(Boolean)
				.join('/');

			return `${basePath}/${path}`;
		},

		/**
		 * Build endpoint URL with query parameters
		 */
		endpointWithQuery(
			path: string | string[],
			params?: Record<string, string | number | boolean | undefined>
		): string {
			const segments = Array.isArray(path) ? path : [path];
			const url = this.endpoint(...segments);

			if (!params) {
				return url;
			}

			const searchParams = new URLSearchParams();
			for (const [key, value] of Object.entries(params)) {
				if (value !== undefined) {
					searchParams.append(key, String(value));
				}
			}

			const queryString = searchParams.toString();
			return queryString ? `${url}?${queryString}` : url;
		},

		/**
		 * Get the base URL
		 */
		getBaseUrl(): string {
			return basePath;
		},

		/**
		 * Get the config
		 */
		getConfig(): ApiConfig {
			return config;
		},
	};
}

/**
 * Build URL with query parameters
 */
export function buildUrl(
	baseUrl: string,
	path: string,
	params?: Record<string, string | number | boolean | undefined>
): string {
	// Ensure single slash between base and path
	const base = baseUrl.replace(/\/$/, '');
	const cleanPath = path.replace(/^\//, '');
	const url = `${base}/${cleanPath}`;

	if (!params) {
		return url;
	}

	const searchParams = new URLSearchParams();
	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined) {
			searchParams.append(key, String(value));
		}
	}

	const queryString = searchParams.toString();
	return queryString ? `${url}?${queryString}` : url;
}

/**
 * Parse URL and extract components
 */
export function parseUrl(url: string): {
	protocol: string;
	host: string;
	port: string;
	pathname: string;
	search: string;
	params: Record<string, string>;
} {
	const urlObj = new URL(url);

	const params: Record<string, string> = {};
	urlObj.searchParams.forEach((value, key) => {
		params[key] = value;
	});

	return {
		protocol: urlObj.protocol.replace(':', ''),
		host: urlObj.hostname,
		port: urlObj.port,
		pathname: urlObj.pathname,
		search: urlObj.search,
		params,
	};
}

/**
 * Join URL path segments
 */
export function joinPath(...segments: string[]): string {
	return segments
		.map((s) => s.replace(/^\/+|\/+$/g, ''))
		.filter(Boolean)
		.join('/');
}

/**
 * Common HTTP methods
 */
export const HTTP_METHODS = {
	GET: 'GET',
	POST: 'POST',
	PUT: 'PUT',
	PATCH: 'PATCH',
	DELETE: 'DELETE',
	HEAD: 'HEAD',
	OPTIONS: 'OPTIONS',
} as const;

export type HttpMethod = (typeof HTTP_METHODS)[keyof typeof HTTP_METHODS];

/**
 * Common HTTP status codes
 */
export const HTTP_STATUS = {
	OK: 200,
	CREATED: 201,
	NO_CONTENT: 204,
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	CONFLICT: 409,
	UNPROCESSABLE_ENTITY: 422,
	TOO_MANY_REQUESTS: 429,
	INTERNAL_SERVER_ERROR: 500,
	BAD_GATEWAY: 502,
	SERVICE_UNAVAILABLE: 503,
} as const;

export type HttpStatus = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];

/**
 * Check if status code is successful (2xx)
 */
export function isSuccessStatus(status: number): boolean {
	return status >= 200 && status < 300;
}

/**
 * Check if status code is client error (4xx)
 */
export function isClientError(status: number): boolean {
	return status >= 400 && status < 500;
}

/**
 * Check if status code is server error (5xx)
 */
export function isServerError(status: number): boolean {
	return status >= 500 && status < 600;
}
