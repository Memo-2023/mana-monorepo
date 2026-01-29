import {
	type DynamicModule,
	Module,
	type Provider,
	type Type,
	type InjectionToken,
	type OptionalFactoryDependency,
} from '@nestjs/common';
import { NotifyClient, type NotifyClientOptions } from '../client';
import { NOTIFY_CLIENT, NOTIFY_MODULE_OPTIONS } from './constants';

export type NotifyModuleOptions = NotifyClientOptions;

export interface NotifyModuleAsyncOptions {
	imports?: DynamicModule[];
	useFactory?: (...args: unknown[]) => Promise<NotifyModuleOptions> | NotifyModuleOptions;
	inject?: (InjectionToken | OptionalFactoryDependency)[];
	useClass?: Type<NotifyModuleOptionsFactory>;
	useExisting?: Type<NotifyModuleOptionsFactory>;
}

export interface NotifyModuleOptionsFactory {
	createNotifyOptions(): Promise<NotifyModuleOptions> | NotifyModuleOptions;
}

@Module({})
export class NotifyModule {
	/**
	 * Register the module with static options
	 */
	static forRoot(options: NotifyModuleOptions): DynamicModule {
		const clientProvider: Provider = {
			provide: NOTIFY_CLIENT,
			useValue: new NotifyClient(options),
		};

		return {
			module: NotifyModule,
			global: true,
			providers: [clientProvider],
			exports: [clientProvider],
		};
	}

	/**
	 * Register the module with async options (e.g., from ConfigService)
	 */
	static forRootAsync(options: NotifyModuleAsyncOptions): DynamicModule {
		const providers = this.createAsyncProviders(options);

		return {
			module: NotifyModule,
			global: true,
			imports: options.imports || [],
			providers: [
				...providers,
				{
					provide: NOTIFY_CLIENT,
					useFactory: (opts: NotifyModuleOptions) => new NotifyClient(opts),
					inject: [NOTIFY_MODULE_OPTIONS],
				},
			],
			exports: [NOTIFY_CLIENT],
		};
	}

	private static createAsyncProviders(options: NotifyModuleAsyncOptions): Provider[] {
		if (options.useFactory) {
			return [
				{
					provide: NOTIFY_MODULE_OPTIONS,
					useFactory: options.useFactory,
					inject: options.inject || [],
				},
			];
		}

		if (options.useClass) {
			return [
				{
					provide: NOTIFY_MODULE_OPTIONS,
					useFactory: async (optionsFactory: NotifyModuleOptionsFactory) =>
						optionsFactory.createNotifyOptions(),
					inject: [options.useClass],
				},
				{
					provide: options.useClass,
					useClass: options.useClass,
				},
			];
		}

		if (options.useExisting) {
			return [
				{
					provide: NOTIFY_MODULE_OPTIONS,
					useFactory: async (optionsFactory: NotifyModuleOptionsFactory) =>
						optionsFactory.createNotifyOptions(),
					inject: [options.useExisting],
				},
			];
		}

		return [];
	}
}
