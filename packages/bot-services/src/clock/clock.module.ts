import { Module, DynamicModule, Provider, Type, ModuleMetadata } from '@nestjs/common';
import { ClockService } from './clock.service';
import { ClockServiceConfig } from './types';

export type ClockModuleOptions = Partial<ClockServiceConfig>;

export interface ClockModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
	useFactory: (...args: unknown[]) => Promise<ClockModuleOptions> | ClockModuleOptions;
	inject?: (Type<unknown> | string | symbol)[];
}

@Module({})
export class ClockModule {
	/**
	 * Register with default configuration (uses environment variables)
	 */
	static register(options?: ClockModuleOptions): DynamicModule {
		return {
			module: ClockModule,
			providers: [
				{
					provide: 'CLOCK_SERVICE_CONFIG',
					useValue: options ?? {},
				},
				{
					provide: ClockService,
					useFactory: (config: Partial<ClockServiceConfig>) => new ClockService(config),
					inject: ['CLOCK_SERVICE_CONFIG'],
				},
			],
			exports: [ClockService],
		};
	}

	/**
	 * Register with explicit configuration
	 */
	static forRoot(config: ClockServiceConfig): DynamicModule {
		return {
			module: ClockModule,
			providers: [
				{
					provide: ClockService,
					useFactory: () => new ClockService(config),
				},
			],
			exports: [ClockService],
		};
	}

	/**
	 * Register asynchronously with factory function
	 */
	static registerAsync(options: ClockModuleAsyncOptions): DynamicModule {
		const configProvider: Provider = {
			provide: 'CLOCK_SERVICE_CONFIG',
			useFactory: options.useFactory,
			inject: options.inject || [],
		};

		return {
			module: ClockModule,
			imports: options.imports || [],
			providers: [
				configProvider,
				{
					provide: ClockService,
					useFactory: (config: Partial<ClockServiceConfig>) => new ClockService(config),
					inject: ['CLOCK_SERVICE_CONFIG'],
				},
			],
			exports: [ClockService],
		};
	}
}
