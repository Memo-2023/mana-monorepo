import { Module, DynamicModule, Provider, Type, ModuleMetadata } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiServiceConfig } from './types';

export type AiModuleOptions = Partial<AiServiceConfig>;

export interface AiModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
	useFactory: (...args: unknown[]) => Promise<AiModuleOptions> | AiModuleOptions;
	inject?: (Type<unknown> | string | symbol)[];
}

@Module({})
export class AiModule {
	/**
	 * Register with default configuration (uses environment variables)
	 */
	static register(options?: AiModuleOptions): DynamicModule {
		return {
			module: AiModule,
			providers: [
				{
					provide: 'AI_SERVICE_CONFIG',
					useValue: options ?? {},
				},
				{
					provide: AiService,
					useFactory: (config: Partial<AiServiceConfig>) => new AiService(config),
					inject: ['AI_SERVICE_CONFIG'],
				},
			],
			exports: [AiService],
		};
	}

	/**
	 * Register with explicit configuration
	 */
	static forRoot(config: AiServiceConfig): DynamicModule {
		return {
			module: AiModule,
			providers: [
				{
					provide: AiService,
					useFactory: () => new AiService(config),
				},
			],
			exports: [AiService],
		};
	}

	/**
	 * Register asynchronously with factory function
	 */
	static registerAsync(options: AiModuleAsyncOptions): DynamicModule {
		const configProvider: Provider = {
			provide: 'AI_SERVICE_CONFIG',
			useFactory: options.useFactory,
			inject: options.inject || [],
		};

		return {
			module: AiModule,
			imports: options.imports || [],
			providers: [
				configProvider,
				{
					provide: AiService,
					useFactory: (config: Partial<AiServiceConfig>) => new AiService(config),
					inject: ['AI_SERVICE_CONFIG'],
				},
			],
			exports: [AiService],
		};
	}
}
