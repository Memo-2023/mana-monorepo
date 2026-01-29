import { Module, DynamicModule } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiServiceConfig } from './types';

export interface AiModuleOptions extends Partial<AiServiceConfig> {}

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
}
