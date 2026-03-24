// Types
export * from './types';

// Core utilities
import { createAuthService as _createAuthService } from './core/authService';
export { createAuthService } from './core/authService';
export type { AuthService } from './core/authService';

import { createTokenManager as _createTokenManager } from './core/tokenManager';
export { createTokenManager } from './core/tokenManager';
export type { TokenManager, TokenManagerConfig } from './core/tokenManager';

export {
	decodeToken,
	isTokenValidLocally,
	isTokenExpired,
	getUserFromToken,
	getTokenExpirationTime,
	getTimeUntilExpiration,
	isB2BUser,
	getB2BInfo,
	shouldDisableRevenueCat,
	getAppSettings,
} from './core/jwtUtils';

// Storage adapter
import {
	setStorageAdapter as _setStorageAdapter,
	createLocalStorageAdapter as _createLocalStorageAdapter,
} from './adapters/storage';
export {
	setStorageAdapter,
	getStorageAdapter,
	isStorageInitialized,
	createLocalStorageAdapter,
	createMemoryStorageAdapter,
} from './adapters/storage';

// Device adapter
import {
	setDeviceAdapter as _setDeviceAdapter,
	createWebDeviceAdapter as _createWebDeviceAdapter,
} from './adapters/device';
export {
	setDeviceAdapter,
	getDeviceAdapter,
	isDeviceInitialized,
	createWebDeviceAdapter,
} from './adapters/device';

// Network adapter
import {
	setNetworkAdapter as _setNetworkAdapter,
	createWebNetworkAdapter as _createWebNetworkAdapter,
} from './adapters/network';
export {
	setNetworkAdapter,
	getNetworkAdapter,
	isDeviceConnected,
	hasStableConnection,
	createWebNetworkAdapter,
} from './adapters/network';

// Fetch interceptor
import { setupFetchInterceptor as _setupFetchInterceptor } from './interceptors/fetchInterceptor';
export {
	setupFetchInterceptor,
	setupTokenObservers,
	getInterceptorStatus,
} from './interceptors/fetchInterceptor';
export type { FetchInterceptorConfig } from './interceptors/fetchInterceptor';

// Contacts client for cross-app integration
export { ContactsClient, createContactsClient } from './clients/contactsClient';
export type { ContactsClientConfig, ContactSearchOptions } from './clients/contactsClient';

/**
 * Initialize auth service with all adapters for web
 *
 * @example
 * ```typescript
 * import { initializeWebAuth } from '@manacore/shared-auth';
 *
 * // Basic setup (interceptor only for auth URL)
 * const { authService, tokenManager } = initializeWebAuth({
 *   baseUrl: 'https://auth.example.com',
 * });
 *
 * // With backend URL (interceptor for both auth and backend - recommended)
 * const { authService, tokenManager } = initializeWebAuth({
 *   baseUrl: 'https://auth.example.com',
 *   backendUrl: 'https://api.example.com',
 * });
 * ```
 */
export function initializeWebAuth(config: {
	baseUrl: string;
	backendUrl?: string;
	storageKeys?: Partial<import('./types').StorageKeys>;
}) {
	// Set up adapters
	_setStorageAdapter(_createLocalStorageAdapter());
	_setDeviceAdapter(_createWebDeviceAdapter());
	_setNetworkAdapter(_createWebNetworkAdapter());

	// Create services
	const authService = _createAuthService(config);
	const tokenManager = _createTokenManager(authService);

	// Set up a single fetch interceptor for all relevant URLs
	const urls = [config.baseUrl];
	if (config.backendUrl) urls.push(config.backendUrl);
	_setupFetchInterceptor(authService, tokenManager, { urls });

	return { authService, tokenManager };
}
