import { Module, DynamicModule } from '@nestjs/common';
import { ClockService } from './clock.service';
import { ClockServiceConfig } from './types';

export interface ClockModuleOptions extends Partial<ClockServiceConfig> {}

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
}
