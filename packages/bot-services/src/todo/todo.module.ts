import { Module, DynamicModule } from '@nestjs/common';
import { TodoService, TODO_STORAGE_PROVIDER } from './todo.service';
import { StorageProvider } from '../shared/types';
import { FileStorageProvider } from '../shared/storage';
import { TodoData } from './types';

export interface TodoModuleOptions {
	storagePath?: string;
	storageProvider?: StorageProvider<TodoData>;
}

@Module({})
export class TodoModule {
	/**
	 * Register with default file storage
	 */
	static register(options?: TodoModuleOptions): DynamicModule {
		const storagePath = options?.storagePath ?? './data/todo-data.json';
		const defaultData: TodoData = { tasks: [], projects: [] };

		return {
			module: TodoModule,
			providers: [
				{
					provide: TODO_STORAGE_PROVIDER,
					useValue: options?.storageProvider ?? new FileStorageProvider<TodoData>(storagePath, defaultData),
				},
				TodoService,
			],
			exports: [TodoService],
		};
	}

	/**
	 * Register with custom storage provider
	 */
	static forRoot(storageProvider: StorageProvider<TodoData>): DynamicModule {
		return {
			module: TodoModule,
			providers: [
				{
					provide: TODO_STORAGE_PROVIDER,
					useValue: storageProvider,
				},
				TodoService,
			],
			exports: [TodoService],
		};
	}
}
