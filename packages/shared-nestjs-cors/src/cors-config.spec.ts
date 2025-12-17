/**
 * CORS Configuration Tests
 *
 * Comprehensive test suite for @manacore/shared-nestjs-cors package.
 * Tests cover:
 * - createCorsConfig() function behavior
 * - createCorsConfigWithCallback() function behavior
 * - Origin constants validation
 */

import {
	createCorsConfig,
	createCorsConfigWithCallback,
	MANACORE_STAGING_ORIGINS,
	MANACORE_PRODUCTION_ORIGINS,
	MANACORE_ALL_APP_ORIGINS,
	type CorsConfigOptions,
} from './cors-config';

// Type for CORS origin callback function
type CorsOriginCallback = (
	origin: string | undefined | null,
	callback: (err: Error | null, allow?: string | boolean) => void
) => void;

describe('@manacore/shared-nestjs-cors', () => {
	describe('createCorsConfig()', () => {
		describe('default behavior', () => {
			it('should create CORS config with default development origins when no options provided', () => {
				const config = createCorsConfig();

				expect(config).toHaveProperty('origin');
				expect(config).toHaveProperty('methods');
				expect(config).toHaveProperty('credentials');
				expect(config).toHaveProperty('allowedHeaders');

				expect(Array.isArray(config.origin)).toBe(true);
				expect((config.origin as string[]).length).toBeGreaterThan(0);
				expect((config.origin as string[]).some((o) => o.includes('localhost'))).toBe(true);
			});

			it('should include standard HTTP methods', () => {
				const config = createCorsConfig();

				expect(config.methods).toEqual(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']);
			});

			it('should enable credentials', () => {
				const config = createCorsConfig();

				expect(config.credentials).toBe(true);
			});

			it('should include standard allowed headers', () => {
				const config = createCorsConfig();

				expect(config.allowedHeaders).toEqual([
					'Content-Type',
					'Authorization',
					'X-Requested-With',
				]);
			});

			it('should include common localhost ports by default', () => {
				const config = createCorsConfig();
				const origins = config.origin as string[];

				// Check for common development ports
				expect(origins).toContain('http://localhost:3000');
				expect(origins).toContain('http://localhost:3001');
				expect(origins).toContain('http://localhost:5173');
				expect(origins).toContain('http://localhost:8081');
			});
		});

		describe('corsOriginsEnv parsing', () => {
			it('should parse comma-separated CORS_ORIGINS from environment', () => {
				const corsOriginsEnv = 'https://app.example.com,https://api.example.com';
				const config = createCorsConfig({ corsOriginsEnv });

				const origins = config.origin as string[];
				expect(origins).toContain('https://app.example.com');
				expect(origins).toContain('https://api.example.com');
			});

			it('should trim whitespace from environment origins', () => {
				const corsOriginsEnv = ' https://app.example.com , https://api.example.com ';
				const config = createCorsConfig({ corsOriginsEnv });

				const origins = config.origin as string[];
				expect(origins).toContain('https://app.example.com');
				expect(origins).toContain('https://api.example.com');
				expect(origins).not.toContain(' https://app.example.com ');
			});

			it('should filter out empty strings from environment origins', () => {
				const corsOriginsEnv = 'https://app.example.com,,https://api.example.com,';
				const config = createCorsConfig({ corsOriginsEnv });

				const origins = config.origin as string[];
				expect(origins).toContain('https://app.example.com');
				expect(origins).toContain('https://api.example.com');
				expect(origins.filter((o) => o === '')).toHaveLength(0);
			});

			it('should handle empty corsOriginsEnv string', () => {
				const config = createCorsConfig({ corsOriginsEnv: '' });

				const origins = config.origin as string[];
				// Should still have default development origins
				expect(origins.length).toBeGreaterThan(0);
				expect(origins).toContain('http://localhost:3000');
			});
		});

		describe('includeAllManaApps flag', () => {
			it('should include all ManaCore app origins when flag is true', () => {
				const config = createCorsConfig({ includeAllManaApps: true });

				const origins = config.origin as string[];
				// Check for staging origins
				expect(origins).toContain('https://staging.manacore.ai');
				expect(origins).toContain('https://chat.staging.manacore.ai');
				expect(origins).toContain('https://picture.staging.manacore.ai');

				// Check for production origins
				expect(origins).toContain('https://manacore.ai');
				expect(origins).toContain('https://chat.manacore.ai');
				expect(origins).toContain('https://picture.manacore.ai');
			});

			it('should not include ManaCore app origins when flag is false', () => {
				const config = createCorsConfig({ includeAllManaApps: false });

				const origins = config.origin as string[];
				expect(origins).not.toContain('https://staging.manacore.ai');
				expect(origins).not.toContain('https://manacore.ai');
			});

			it('should not include ManaCore app origins by default', () => {
				const config = createCorsConfig();

				const origins = config.origin as string[];
				expect(origins).not.toContain('https://staging.manacore.ai');
				expect(origins).not.toContain('https://manacore.ai');
			});
		});

		describe('custom developmentOrigins', () => {
			it('should use custom development origins when provided', () => {
				const customOrigins = ['http://localhost:4000', 'http://localhost:4001'];
				const config = createCorsConfig({ developmentOrigins: customOrigins });

				const origins = config.origin as string[];
				expect(origins).toContain('http://localhost:4000');
				expect(origins).toContain('http://localhost:4001');
			});

			it('should replace default development origins with custom ones', () => {
				const customOrigins = ['http://custom.local:9000'];
				const config = createCorsConfig({ developmentOrigins: customOrigins });

				const origins = config.origin as string[];
				expect(origins).toContain('http://custom.local:9000');
				// Default origins should not be included
				expect(origins).not.toContain('http://localhost:3000');
				expect(origins).not.toContain('http://localhost:5173');
			});

			it('should handle empty custom development origins array', () => {
				const config = createCorsConfig({ developmentOrigins: [] });

				const origins = config.origin as string[];
				// Should only have env origins if provided, or be empty
				expect(Array.isArray(origins)).toBe(true);
			});
		});

		describe('additionalOrigins', () => {
			it('should include additional origins when provided', () => {
				const additionalOrigins = ['exp://localhost:8081', 'myapp://'];
				const config = createCorsConfig({ additionalOrigins });

				const origins = config.origin as string[];
				expect(origins).toContain('exp://localhost:8081');
				expect(origins).toContain('myapp://');
			});

			it('should combine additional origins with default origins', () => {
				const additionalOrigins = ['https://mobile.app'];
				const config = createCorsConfig({ additionalOrigins });

				const origins = config.origin as string[];
				expect(origins).toContain('https://mobile.app');
				expect(origins).toContain('http://localhost:3000'); // Default still included
			});

			it('should handle empty additional origins array', () => {
				const config = createCorsConfig({ additionalOrigins: [] });

				const origins = config.origin as string[];
				expect(Array.isArray(origins)).toBe(true);
				expect(origins.length).toBeGreaterThan(0);
			});
		});

		describe('deduplication of origins', () => {
			it('should remove duplicate origins', () => {
				const corsOriginsEnv = 'http://localhost:3000,http://localhost:5173';
				const config = createCorsConfig({ corsOriginsEnv });

				const origins = config.origin as string[];
				const uniqueOrigins = Array.from(new Set(origins));

				expect(origins.length).toBe(uniqueOrigins.length);
			});

			it('should deduplicate when same origin appears in multiple sources', () => {
				const corsOriginsEnv = 'http://localhost:3000';
				const additionalOrigins = ['http://localhost:3000'];
				const config = createCorsConfig({ corsOriginsEnv, additionalOrigins });

				const origins = config.origin as string[];
				const countLocalhost3000 = origins.filter((o) => o === 'http://localhost:3000').length;

				expect(countLocalhost3000).toBe(1);
			});

			it('should deduplicate when includeAllManaApps creates overlaps', () => {
				const additionalOrigins = ['https://staging.manacore.ai'];
				const config = createCorsConfig({
					includeAllManaApps: true,
					additionalOrigins,
				});

				const origins = config.origin as string[];
				const countStaging = origins.filter((o) => o === 'https://staging.manacore.ai').length;

				expect(countStaging).toBe(1);
			});
		});

		describe('combined options', () => {
			it('should handle all parameters together correctly', () => {
				const options: CorsConfigOptions = {
					corsOriginsEnv: 'https://env1.com,https://env2.com',
					developmentOrigins: ['http://dev1.local', 'http://dev2.local'],
					additionalOrigins: ['https://mobile.app'],
					includeAllManaApps: true,
				};

				const config = createCorsConfig(options);
				const origins = config.origin as string[];

				// Check env origins
				expect(origins).toContain('https://env1.com');
				expect(origins).toContain('https://env2.com');

				// Check custom dev origins
				expect(origins).toContain('http://dev1.local');
				expect(origins).toContain('http://dev2.local');

				// Check additional origins
				expect(origins).toContain('https://mobile.app');

				// Check ManaCore origins
				expect(origins).toContain('https://staging.manacore.ai');
				expect(origins).toContain('https://manacore.ai');

				// Verify no duplicates
				const uniqueOrigins = Array.from(new Set(origins));
				expect(origins.length).toBe(uniqueOrigins.length);
			});
		});

		describe('return structure', () => {
			it('should return object with correct CORS options structure', () => {
				const config = createCorsConfig();

				expect(config).toHaveProperty('origin');
				expect(config).toHaveProperty('methods');
				expect(config).toHaveProperty('credentials');
				expect(config).toHaveProperty('allowedHeaders');
				expect(Object.keys(config).length).toBe(4);
			});

			it('should return origin as array of strings', () => {
				const config = createCorsConfig();

				expect(Array.isArray(config.origin)).toBe(true);
				(config.origin as string[]).forEach((origin) => {
					expect(typeof origin).toBe('string');
				});
			});
		});
	});

	describe('createCorsConfigWithCallback()', () => {
		describe('callback mode basics', () => {
			it('should return CORS config with origin callback function', () => {
				const config = createCorsConfigWithCallback();

				expect(typeof config.origin).toBe('function');
			});

			it('should have same methods, credentials, and allowedHeaders as createCorsConfig', () => {
				const standardConfig = createCorsConfig();
				const callbackConfig = createCorsConfigWithCallback();

				expect(callbackConfig.methods).toEqual(standardConfig.methods);
				expect(callbackConfig.credentials).toEqual(standardConfig.credentials);
				expect(callbackConfig.allowedHeaders).toEqual(standardConfig.allowedHeaders);
			});
		});

		describe('callback with no origin (mobile apps, server-to-server)', () => {
			it('should allow requests with no origin', (done) => {
				const config = createCorsConfigWithCallback();
				const callback = jest.fn((error, result) => {
					expect(error).toBeNull();
					expect(result).toBe('*');
					done();
				});

				(config.origin as CorsOriginCallback)(undefined, callback);
			});

			it('should allow requests with null origin', (done) => {
				const config = createCorsConfigWithCallback();
				const callback = jest.fn((error, result) => {
					expect(error).toBeNull();
					expect(result).toBe('*');
					done();
				});

				(config.origin as CorsOriginCallback)(null, callback);
			});
		});

		describe('callback with valid origins', () => {
			it('should allow requests from default development origins', (done) => {
				const config = createCorsConfigWithCallback();
				const testOrigin = 'http://localhost:3000';

				const callback = jest.fn((error, result) => {
					expect(error).toBeNull();
					expect(result).toBe(testOrigin);
					done();
				});

				(config.origin as CorsOriginCallback)(testOrigin, callback);
			});

			it('should allow requests from environment origins', (done) => {
				const corsOriginsEnv = 'https://app.example.com,https://api.example.com';
				const config = createCorsConfigWithCallback({ corsOriginsEnv });
				const testOrigin = 'https://app.example.com';

				const callback = jest.fn((error, result) => {
					expect(error).toBeNull();
					expect(result).toBe(testOrigin);
					done();
				});

				(config.origin as CorsOriginCallback)(testOrigin, callback);
			});

			it('should allow requests from additional origins', (done) => {
				const additionalOrigins = ['https://mobile.app'];
				const config = createCorsConfigWithCallback({ additionalOrigins });
				const testOrigin = 'https://mobile.app';

				const callback = jest.fn((error, result) => {
					expect(error).toBeNull();
					expect(result).toBe(testOrigin);
					done();
				});

				(config.origin as CorsOriginCallback)(testOrigin, callback);
			});

			it('should allow requests from ManaCore app origins when flag enabled', (done) => {
				const config = createCorsConfigWithCallback({ includeAllManaApps: true });
				const testOrigin = 'https://chat.staging.manacore.ai';

				const callback = jest.fn((error, result) => {
					expect(error).toBeNull();
					expect(result).toBe(testOrigin);
					done();
				});

				(config.origin as CorsOriginCallback)(testOrigin, callback);
			});
		});

		describe('callback with invalid origins', () => {
			it('should deny requests from unlisted origins', (done) => {
				const config = createCorsConfigWithCallback({
					developmentOrigins: ['http://localhost:3000'],
				});
				const testOrigin = 'https://malicious.com';

				const callback = jest.fn((error, result) => {
					expect(error).toBeNull();
					expect(result).toBe(false);
					done();
				});

				(config.origin as CorsOriginCallback)(testOrigin, callback);
			});

			it('should deny requests from similar but not exact origins', (done) => {
				const corsOriginsEnv = 'https://app.example.com';
				const config = createCorsConfigWithCallback({ corsOriginsEnv });
				const testOrigin = 'https://app.example.com.malicious.com';

				const callback = jest.fn((error, result) => {
					expect(error).toBeNull();
					expect(result).toBe(false);
					done();
				});

				(config.origin as CorsOriginCallback)(testOrigin, callback);
			});

			it('should deny requests with different protocol', (done) => {
				const corsOriginsEnv = 'https://app.example.com';
				const config = createCorsConfigWithCallback({ corsOriginsEnv });
				const testOrigin = 'http://app.example.com'; // http instead of https

				const callback = jest.fn((error, result) => {
					expect(error).toBeNull();
					expect(result).toBe(false);
					done();
				});

				(config.origin as CorsOriginCallback)(testOrigin, callback);
			});
		});

		describe('callback with all options', () => {
			it('should respect includeAllManaApps flag in callback mode', (done) => {
				const config = createCorsConfigWithCallback({ includeAllManaApps: true });
				const testOrigin = 'https://picture.manacore.ai';

				const callback = jest.fn((error, result) => {
					expect(error).toBeNull();
					expect(result).toBe(testOrigin);
					done();
				});

				(config.origin as CorsOriginCallback)(testOrigin, callback);
			});

			it('should combine all origin sources in callback validation', (done) => {
				const options: CorsConfigOptions = {
					corsOriginsEnv: 'https://env.com',
					developmentOrigins: ['http://dev.local'],
					additionalOrigins: ['https://mobile.app'],
					includeAllManaApps: true,
				};

				const config = createCorsConfigWithCallback(options);

				// Test each source type
				const testOrigins = [
					'https://env.com',
					'http://dev.local',
					'https://mobile.app',
					'https://staging.manacore.ai',
				];

				let testsCompleted = 0;

				testOrigins.forEach((origin) => {
					const cb = jest.fn((error, result) => {
						expect(error).toBeNull();
						expect(result).toBe(origin);
						testsCompleted++;
						if (testsCompleted === testOrigins.length) {
							done();
						}
					});

					(config.origin as CorsOriginCallback)(origin, cb);
				});
			});
		});

		describe('callback return values', () => {
			it('should pass null as first argument (error) for allowed origins', (done) => {
				const config = createCorsConfigWithCallback();

				const callback = jest.fn((error, result) => {
					expect(error).toBeNull();
					expect(result).toBeTruthy();
					done();
				});

				(config.origin as CorsOriginCallback)('http://localhost:3000', callback);
			});

			it('should pass origin value as second argument for allowed origins', (done) => {
				const config = createCorsConfigWithCallback();
				const testOrigin = 'http://localhost:3000';

				const callback = jest.fn((error, result) => {
					expect(error).toBeNull();
					expect(result).toBe(testOrigin);
					done();
				});

				(config.origin as CorsOriginCallback)(testOrigin, callback);
			});

			it('should pass false as second argument for denied origins', (done) => {
				const config = createCorsConfigWithCallback({
					developmentOrigins: ['http://localhost:3000'],
				});

				const callback = jest.fn((error, result) => {
					expect(error).toBeNull();
					expect(result).toBe(false);
					done();
				});

				(config.origin as CorsOriginCallback)('https://malicious.com', callback);
			});
		});
	});

	describe('origin constants', () => {
		describe('MANACORE_STAGING_ORIGINS', () => {
			it('should contain expected staging URLs', () => {
				expect(MANACORE_STAGING_ORIGINS).toContain('https://staging.manacore.ai');
				expect(MANACORE_STAGING_ORIGINS).toContain('https://auth.staging.manacore.ai');
				expect(MANACORE_STAGING_ORIGINS).toContain('https://chat.staging.manacore.ai');
				expect(MANACORE_STAGING_ORIGINS).toContain('https://chat-api.staging.manacore.ai');
				expect(MANACORE_STAGING_ORIGINS).toContain('https://picture.staging.manacore.ai');
				expect(MANACORE_STAGING_ORIGINS).toContain('https://picture-api.staging.manacore.ai');
				expect(MANACORE_STAGING_ORIGINS).toContain('https://zitare.staging.manacore.ai');
				expect(MANACORE_STAGING_ORIGINS).toContain('https://zitare-api.staging.manacore.ai');
			});

			it('should contain contacts app staging URLs', () => {
				expect(MANACORE_STAGING_ORIGINS).toContain('https://contacts.staging.manacore.ai');
				expect(MANACORE_STAGING_ORIGINS).toContain('https://contacts-api.staging.manacore.ai');
			});

			it('should contain calendar app staging URLs', () => {
				expect(MANACORE_STAGING_ORIGINS).toContain('https://calendar.staging.manacore.ai');
				expect(MANACORE_STAGING_ORIGINS).toContain('https://calendar-api.staging.manacore.ai');
			});

			it('should contain clock app staging URLs', () => {
				expect(MANACORE_STAGING_ORIGINS).toContain('https://clock.staging.manacore.ai');
				expect(MANACORE_STAGING_ORIGINS).toContain('https://clock-api.staging.manacore.ai');
			});

			it('should contain todo app staging URLs', () => {
				expect(MANACORE_STAGING_ORIGINS).toContain('https://todo.staging.manacore.ai');
				expect(MANACORE_STAGING_ORIGINS).toContain('https://todo-api.staging.manacore.ai');
			});

			it('should only contain HTTPS URLs', () => {
				MANACORE_STAGING_ORIGINS.forEach((origin) => {
					expect(origin.startsWith('https://')).toBe(true);
				});
			});

			it('should not contain duplicates', () => {
				const uniqueOrigins = Array.from(new Set(MANACORE_STAGING_ORIGINS));
				expect(MANACORE_STAGING_ORIGINS.length).toBe(uniqueOrigins.length);
			});
		});

		describe('MANACORE_PRODUCTION_ORIGINS', () => {
			it('should contain expected production URLs', () => {
				expect(MANACORE_PRODUCTION_ORIGINS).toContain('https://manacore.ai');
				expect(MANACORE_PRODUCTION_ORIGINS).toContain('https://auth.manacore.ai');
				expect(MANACORE_PRODUCTION_ORIGINS).toContain('https://chat.manacore.ai');
				expect(MANACORE_PRODUCTION_ORIGINS).toContain('https://chat-api.manacore.ai');
				expect(MANACORE_PRODUCTION_ORIGINS).toContain('https://picture.manacore.ai');
				expect(MANACORE_PRODUCTION_ORIGINS).toContain('https://picture-api.manacore.ai');
				expect(MANACORE_PRODUCTION_ORIGINS).toContain('https://zitare.manacore.ai');
				expect(MANACORE_PRODUCTION_ORIGINS).toContain('https://zitare-api.manacore.ai');
			});

			it('should contain contacts app production URLs', () => {
				expect(MANACORE_PRODUCTION_ORIGINS).toContain('https://contacts.manacore.ai');
				expect(MANACORE_PRODUCTION_ORIGINS).toContain('https://contacts-api.manacore.ai');
			});

			it('should contain calendar app production URLs', () => {
				expect(MANACORE_PRODUCTION_ORIGINS).toContain('https://calendar.manacore.ai');
				expect(MANACORE_PRODUCTION_ORIGINS).toContain('https://calendar-api.manacore.ai');
			});

			it('should contain clock app production URLs', () => {
				expect(MANACORE_PRODUCTION_ORIGINS).toContain('https://clock.manacore.ai');
				expect(MANACORE_PRODUCTION_ORIGINS).toContain('https://clock-api.manacore.ai');
			});

			it('should contain todo app production URLs', () => {
				expect(MANACORE_PRODUCTION_ORIGINS).toContain('https://todo.manacore.ai');
				expect(MANACORE_PRODUCTION_ORIGINS).toContain('https://todo-api.manacore.ai');
			});

			it('should only contain HTTPS URLs', () => {
				MANACORE_PRODUCTION_ORIGINS.forEach((origin) => {
					expect(origin.startsWith('https://')).toBe(true);
				});
			});

			it('should not contain duplicates', () => {
				const uniqueOrigins = Array.from(new Set(MANACORE_PRODUCTION_ORIGINS));
				expect(MANACORE_PRODUCTION_ORIGINS.length).toBe(uniqueOrigins.length);
			});

			it('should not contain staging subdomain', () => {
				MANACORE_PRODUCTION_ORIGINS.forEach((origin) => {
					expect(origin.includes('.staging.')).toBe(false);
				});
			});
		});

		describe('MANACORE_ALL_APP_ORIGINS', () => {
			it('should combine staging and production origins', () => {
				const expectedLength = MANACORE_STAGING_ORIGINS.length + MANACORE_PRODUCTION_ORIGINS.length;
				expect(MANACORE_ALL_APP_ORIGINS.length).toBe(expectedLength);
			});

			it('should contain all staging origins', () => {
				MANACORE_STAGING_ORIGINS.forEach((origin) => {
					expect(MANACORE_ALL_APP_ORIGINS).toContain(origin);
				});
			});

			it('should contain all production origins', () => {
				MANACORE_PRODUCTION_ORIGINS.forEach((origin) => {
					expect(MANACORE_ALL_APP_ORIGINS).toContain(origin);
				});
			});

			it('should not contain duplicates', () => {
				const uniqueOrigins = Array.from(new Set(MANACORE_ALL_APP_ORIGINS));
				expect(MANACORE_ALL_APP_ORIGINS.length).toBe(uniqueOrigins.length);
			});

			it('should only contain HTTPS URLs', () => {
				MANACORE_ALL_APP_ORIGINS.forEach((origin) => {
					expect(origin.startsWith('https://')).toBe(true);
				});
			});

			it('should be properly formatted URLs', () => {
				MANACORE_ALL_APP_ORIGINS.forEach((origin) => {
					// Should not end with slash
					expect(origin.endsWith('/')).toBe(false);
					// Should be valid URL format
					expect(() => new URL(origin)).not.toThrow();
				});
			});
		});

		describe('origin constants consistency', () => {
			it('should have matching app coverage between staging and production', () => {
				// Extract app names from staging URLs
				const stagingApps = MANACORE_STAGING_ORIGINS.filter((o) => o.includes('-api'))
					.map((o) => o.split('.')[0].replace('https://', '').replace('-api', ''))
					.filter((name) => name !== 'auth'); // Auth is special case

				// Extract app names from production URLs
				const prodApps = MANACORE_PRODUCTION_ORIGINS.filter((o) => o.includes('-api'))
					.map((o) => o.split('.')[0].replace('https://', '').replace('-api', ''))
					.filter((name) => name !== 'auth');

				// Should have same apps in both environments
				expect(new Set(stagingApps)).toEqual(new Set(prodApps));
			});

			it('should have web + api pairs for each app', () => {
				const checkPairs = (origins: string[]) => {
					const apps = ['chat', 'picture', 'zitare', 'contacts', 'calendar', 'clock', 'todo'];

					apps.forEach((app) => {
						const hasWeb = origins.some((o) => o.includes(`${app}.`));
						const hasApi = origins.some((o) => o.includes(`${app}-api.`));

						expect(hasWeb).toBe(true);
						expect(hasApi).toBe(true);
					});
				};

				checkPairs(MANACORE_STAGING_ORIGINS);
				checkPairs(MANACORE_PRODUCTION_ORIGINS);
			});
		});
	});
});
