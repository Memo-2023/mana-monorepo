import { Module, DynamicModule } from '@nestjs/common';
import { CalendarService, CALENDAR_STORAGE_PROVIDER } from './calendar.service';
import { StorageProvider } from '../shared/types';
import { FileStorageProvider } from '../shared/storage';
import { CalendarData } from './types';

export interface CalendarModuleOptions {
	storagePath?: string;
	storageProvider?: StorageProvider<CalendarData>;
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
						options?.storageProvider ?? new FileStorageProvider<CalendarData>(storagePath, defaultData),
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
}
