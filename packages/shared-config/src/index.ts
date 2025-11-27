/**
 * Shared configuration utilities for Manacore monorepo
 *
 * This package provides common configuration utilities including
 * environment validation, API endpoint construction, and feature flags.
 */

// Environment utilities
export {
	envSchemas,
	supabaseEnvSchema,
	appEnvSchema,
	createEnvConfig,
	validateEnv,
	getRequiredEnv,
	getEnv,
	getBoolEnv,
	getNumEnv,
	isDevelopment,
	isProduction,
	isTest,
} from './env';

// API utilities
export {
	type ApiConfig,
	createApiBuilder,
	buildUrl,
	parseUrl,
	joinPath,
	HTTP_METHODS,
	HTTP_STATUS,
	type HttpMethod,
	type HttpStatus,
	isSuccessStatus,
	isClientError,
	isServerError,
} from './api';

// Feature flag utilities
export {
	type FeatureFlag,
	createFeatureFlags,
	isFeatureEnabled,
	type AppMetadata,
	createAppMetadata,
	formatVersion,
} from './features';
