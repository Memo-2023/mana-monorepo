import { Module, DynamicModule, Provider, Type, ModuleMetadata } from '@nestjs/common';
import { CalendarService, CALENDAR_STORAGE_PROVIDER } from './calendar.service';
import { StorageProvider } from '../shared/types';
import { FileStorageProvider } from '../shared/storage';
import { CalendarData } from './types';

export interface CalendarModuleOptions {
	storagePath?: string;
	storageProvider?: StorageProvider<CalendarData>;
}

export interface CalendarModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
	useFactory: (...args: unknown[]) => Promise<CalendarModuleOptions> | CalendarModuleOptions;
	inject?: (Type<unknown> | string | symbol)[];
}

@Module({})
export class CalendarModule {
	/**
	 * Register with default file storage
	 */
	static register(options?: CalendarModuleOptions): DynamicModule {
		const storagePath = options?.storagePath ?? './data/calendar-data.json';
		const defaultData: CalendarData = { events: [], calendars: [] };

		return {
			module: CalendarModule,
			providers: [
				{
					provide: CALENDAR_STORAGE_PROVIDER,
					useValue:
						options?.storageProvider ??
						new FileStorageProvider<CalendarData>(storagePath, defaultData),
				},
				CalendarService,
			],
			exports: [CalendarService],
		};
	}

	/**
	 * Register with custom storage provider
	 */
	static forRoot(storageProvider: StorageProvider<CalendarData>): DynamicModule {
		return {
			module: CalendarModule,
			providers: [
				{
					provide: CALENDAR_STORAGE_PROVIDER,
					useValue: storageProvider,
				},
				CalendarService,
			],
			exports: [CalendarService],
		};
	}

	/**
	 * Register asynchronously with factory function
	 */
	static registerAsync(options: CalendarModuleAsyncOptions): DynamicModule {
		const storageProvider: Provider = {
			provide: CALENDAR_STORAGE_PROVIDER,
			useFactory: async (...args: unknown[]) => {
				const moduleOptions = await options.useFactory(...args);
				const storagePath = moduleOptions?.storagePath ?? './data/calendar-data.json';
				const defaultData: CalendarData = { events: [], calendars: [] };
				return (
					moduleOptions?.storageProvider ??
					new FileStorageProvider<CalendarData>(storagePath, defaultData)
				);
			},
			inject: options.inject || [],
		};

		return {
			module: CalendarModule,
			imports: options.imports || [],
			providers: [storageProvider, CalendarService],
			exports: [CalendarService],
		};
	}
}
