import { Module, DynamicModule, Provider, Type, ModuleMetadata } from '@nestjs/common';
import { TodoService, TODO_STORAGE_PROVIDER } from './todo.service';
import { StorageProvider } from '../shared/types';
import { FileStorageProvider } from '../shared/storage';
import { TodoData } from './types';

export interface TodoModuleOptions {
	storagePath?: string;
	storageProvider?: StorageProvider<TodoData>;
}

export interface TodoModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
	useFactory: (...args: unknown[]) => Promise<TodoModuleOptions> | TodoModuleOptions;
	inject?: (Type<unknown> | string | symbol)[];
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
					useValue:
						options?.storageProvider ?? new FileStorageProvider<TodoData>(storagePath, defaultData),
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

	/**
	 * Register asynchronously with factory function
	 */
	static registerAsync(options: TodoModuleAsyncOptions): DynamicModule {
		const storageProvider: Provider = {
			provide: TODO_STORAGE_PROVIDER,
			useFactory: async (...args: unknown[]) => {
				const moduleOptions = await options.useFactory(...args);
				const storagePath = moduleOptions?.storagePath ?? './data/todo-data.json';
				const defaultData: TodoData = { tasks: [], projects: [] };
				return (
					moduleOptions?.storageProvider ??
					new FileStorageProvider<TodoData>(storagePath, defaultData)
				);
			},
			inject: options.inject || [],
		};

		return {
			module: TodoModule,
			imports: options.imports || [],
			providers: [storageProvider, TodoService],
			exports: [TodoService],
		};
	}
}
