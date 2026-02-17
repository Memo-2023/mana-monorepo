import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MorningSummaryService } from './morning-summary.service';
import { MorningPreferencesService } from './preferences.service';
import { MorningSummaryModuleOptions, MORNING_SUMMARY_MODULE_OPTIONS } from './types';

// Import API services
import { CalendarApiService } from '../calendar/calendar-api.service';
import { TodoApiService } from '../todo/todo-api.service';
import { ContactsApiService } from '../contacts/contacts-api.service';
import { PlantaApiService } from '../planta/planta-api.service';
import { WeatherService } from '../weather/weather.service';

// Note: SessionModule should be imported by the consuming application
// This module assumes SessionService is available globally

/**
 * Morning Summary Module
 *
 * Provides daily morning summary aggregation service.
 *
 * @example
 * ```typescript
 * // Basic usage with all dependencies
 * @Module({
 *   imports: [
 *     MorningSummaryModule.forRoot()
 *   ]
 * })
 *
 * // The module requires these services to be available (can be optional):
 * // - CalendarApiService (for events)
 * // - TodoApiService (for tasks)
 * // - ContactsApiService (for birthdays)
 * // - PlantaApiService (for plants)
 * // - WeatherService (for weather)
 * // - SessionService (for preferences storage)
 * ```
 */
@Global()
@Module({})
export class MorningSummaryModule {
	/**
	 * Register module with explicit options
	 */
	static register(options: MorningSummaryModuleOptions = {}): DynamicModule {
		return {
			module: MorningSummaryModule,
			providers: [
				{
					provide: MORNING_SUMMARY_MODULE_OPTIONS,
					useValue: options,
				},
				// API Services with configured URLs
				{
					provide: CalendarApiService,
					useFactory: () => new CalendarApiService(options.calendarApiUrl),
				},
				{
					provide: TodoApiService,
					useFactory: () => new TodoApiService(options.todoApiUrl),
				},
				{
					provide: ContactsApiService,
					useFactory: () => {
						const service = new ContactsApiService();
						// @ts-expect-error - set apiUrl directly
						if (options.contactsApiUrl) service['baseUrl'] = options.contactsApiUrl;
						return service;
					},
				},
				{
					provide: PlantaApiService,
					useFactory: () => {
						const service = new PlantaApiService();
						// @ts-expect-error - set apiUrl directly
						if (options.plantaApiUrl) service['baseUrl'] = options.plantaApiUrl;
						return service;
					},
				},
				{
					provide: WeatherService,
					useFactory: () =>
						new WeatherService({
							defaultLocation: options.defaultLocation || 'Berlin',
						}),
				},
				MorningPreferencesService,
				MorningSummaryService,
			],
			exports: [MorningSummaryService, MorningPreferencesService],
		};
	}

	/**
	 * Register with ConfigService reading from environment
	 *
	 * Environment variables:
	 * - TODO_API_URL: Todo backend URL
	 * - CALENDAR_API_URL: Calendar backend URL
	 * - CONTACTS_API_URL: Contacts backend URL
	 * - PLANTA_API_URL: Planta backend URL
	 * - WEATHER_DEFAULT_LOCATION: Default weather location
	 */
	static forRoot(): DynamicModule {
		return {
			module: MorningSummaryModule,
			imports: [ConfigModule],
			providers: [
				{
					provide: MORNING_SUMMARY_MODULE_OPTIONS,
					useFactory: (config: ConfigService) => ({
						todoApiUrl:
							config.get<string>('services.todo.apiUrl') ||
							config.get<string>('TODO_API_URL') ||
							'http://localhost:3018',
						calendarApiUrl:
							config.get<string>('services.calendar.apiUrl') ||
							config.get<string>('CALENDAR_API_URL') ||
							'http://localhost:3014',
						contactsApiUrl:
							config.get<string>('services.contacts.apiUrl') ||
							config.get<string>('CONTACTS_API_URL') ||
							'http://localhost:3015',
						plantaApiUrl:
							config.get<string>('services.planta.apiUrl') ||
							config.get<string>('PLANTA_API_URL') ||
							'http://localhost:3022',
						defaultLocation:
							config.get<string>('weather.defaultLocation') ||
							config.get<string>('WEATHER_DEFAULT_LOCATION') ||
							'Berlin',
					}),
					inject: [ConfigService],
				},
				// API Services
				{
					provide: CalendarApiService,
					useFactory: (config: ConfigService) =>
						new CalendarApiService(
							config.get<string>('services.calendar.apiUrl') ||
								config.get<string>('CALENDAR_API_URL') ||
								'http://localhost:3014'
						),
					inject: [ConfigService],
				},
				{
					provide: TodoApiService,
					useFactory: (config: ConfigService) =>
						new TodoApiService(
							config.get<string>('services.todo.apiUrl') ||
								config.get<string>('TODO_API_URL') ||
								'http://localhost:3018'
						),
					inject: [ConfigService],
				},
				{
					provide: ContactsApiService,
					useFactory: (config: ConfigService) => {
						const apiUrl =
							config.get<string>('services.contacts.apiUrl') ||
							config.get<string>('CONTACTS_API_URL') ||
							'http://localhost:3015';
						return new ContactsApiService({ apiUrl });
					},
					inject: [ConfigService],
				},
				{
					provide: PlantaApiService,
					useFactory: (config: ConfigService) => {
						const apiUrl =
							config.get<string>('services.planta.apiUrl') ||
							config.get<string>('PLANTA_API_URL') ||
							'http://localhost:3022';
						return new PlantaApiService({ apiUrl });
					},
					inject: [ConfigService],
				},
				{
					provide: WeatherService,
					useFactory: (config: ConfigService) =>
						new WeatherService({
							defaultLocation:
								config.get<string>('weather.defaultLocation') ||
								config.get<string>('WEATHER_DEFAULT_LOCATION') ||
								'Berlin',
						}),
					inject: [ConfigService],
				},
				MorningPreferencesService,
				MorningSummaryService,
			],
			exports: [MorningSummaryService, MorningPreferencesService],
		};
	}
}
