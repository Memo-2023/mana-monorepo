import { Module, DynamicModule } from '@nestjs/common';
import type {
	InjectionToken,
	OptionalFactoryDependency,
	Type,
	ForwardReference,
} from '@nestjs/common';
import { ErrorTrackingService, ERROR_TRACKING_CONFIG } from './error-tracking.service';
import type { ErrorTrackingConfig } from '../types';

export type ErrorTrackingModuleOptions = ErrorTrackingConfig;

export interface ErrorTrackingModuleAsyncOptions {
	useFactory: (...args: unknown[]) => Promise<ErrorTrackingConfig> | ErrorTrackingConfig;
	inject?: (InjectionToken | OptionalFactoryDependency)[];
	imports?: (Type | DynamicModule | Promise<DynamicModule> | ForwardReference)[];
}

@Module({})
export class ErrorTrackingModule {
	/**
	 * Register the error tracking module with static configuration
	 */
	static forRoot(options: ErrorTrackingModuleOptions): DynamicModule {
		return {
			module: ErrorTrackingModule,
			providers: [
				{
					provide: ERROR_TRACKING_CONFIG,
					useValue: options,
				},
				ErrorTrackingService,
			],
			exports: [ErrorTrackingService],
			global: true,
		};
	}

	/**
	 * Register the error tracking module with async configuration
	 */
	static forRootAsync(options: ErrorTrackingModuleAsyncOptions): DynamicModule {
		return {
			module: ErrorTrackingModule,
			imports: options.imports,
			providers: [
				{
					provide: ERROR_TRACKING_CONFIG,
					useFactory: options.useFactory,
					inject: options.inject,
				},
				ErrorTrackingService,
			],
			exports: [ErrorTrackingService],
			global: true,
		};
	}
}
