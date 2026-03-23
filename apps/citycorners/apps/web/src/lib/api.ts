import { browser } from '$app/environment';

export function getBackendUrl(): string {
	if (browser && typeof window !== 'undefined') {
		const injectedUrl = (window as any).__PUBLIC_BACKEND_URL__;
		if (injectedUrl) return injectedUrl;
		return import.meta.env.DEV ? 'http://localhost:3025' : '';
	}
	return process.env.PUBLIC_BACKEND_URL || 'http://localhost:3025';
}

export function api(path: string): string {
	return `${getBackendUrl()}/api/v1${path}`;
}
