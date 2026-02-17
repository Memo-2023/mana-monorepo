import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ContactsApiService } from './contacts-api.service';
import { ContactsModuleOptions, CONTACTS_MODULE_OPTIONS } from './types';

/**
 * Contacts Module
 *
 * Contact management and birthday tracking API client.
 *
 * @example
 * ```typescript
 * // Basic usage
 * @Module({
 *   imports: [ContactsModule.register()]
 * })
 *
 * // With custom API URL
 * @Module({
 *   imports: [
 *     ContactsModule.register({
 *       apiUrl: 'http://contacts-backend:3015',
 *     })
 *   ]
 * })
 * ```
 */
@Global()
@Module({})
export class ContactsModule {
	/**
	 * Register module with explicit options
	 */
	static register(options: ContactsModuleOptions = {}): DynamicModule {
		return {
			module: ContactsModule,
			providers: [
				{
					provide: CONTACTS_MODULE_OPTIONS,
					useValue: options,
				},
				ContactsApiService,
			],
			exports: [ContactsApiService],
		};
	}

	/**
	 * Register module with async configuration
	 */
	static registerAsync(options: {
		imports?: any[];
		useFactory: (...args: any[]) => Promise<ContactsModuleOptions> | ContactsModuleOptions;
		inject?: any[];
	}): DynamicModule {
		return {
			module: ContactsModule,
			imports: [...(options.imports || [])],
			providers: [
				{
					provide: CONTACTS_MODULE_OPTIONS,
					useFactory: options.useFactory,
					inject: options.inject || [],
				},
				ContactsApiService,
			],
			exports: [ContactsApiService],
		};
	}

	/**
	 * Register with ConfigService reading from environment
	 *
	 * Environment variables:
	 * - CONTACTS_API_URL: Contacts backend URL
	 */
	static forRoot(): DynamicModule {
		return this.registerAsync({
			imports: [ConfigModule],
			useFactory: (config: ConfigService) => ({
				apiUrl:
					config.get<string>('contacts.apiUrl') ||
					config.get<string>('CONTACTS_API_URL') ||
					'http://localhost:3015',
			}),
			inject: [ConfigService],
		});
	}
}
