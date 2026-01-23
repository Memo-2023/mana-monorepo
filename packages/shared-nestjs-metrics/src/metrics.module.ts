import { Module, DynamicModule, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { MetricsService, MetricsServiceOptions } from './metrics.service';
import { MetricsMiddleware } from './metrics.middleware';
import { MetricsController } from './metrics.controller';

export interface MetricsModuleOptions extends MetricsServiceOptions {
	/**
	 * Path for metrics endpoint (default: '/metrics')
	 */
	path?: string;

	/**
	 * Paths to exclude from metrics collection
	 */
	excludePaths?: string[];

	/**
	 * Whether to register the metrics endpoint controller (default: true)
	 */
	registerController?: boolean;
}

@Module({})
export class MetricsModule implements NestModule {
	private static options: MetricsModuleOptions = {};

	/**
	 * Register the metrics module with options
	 *
	 * @example
	 * ```typescript
	 * import { MetricsModule } from '@manacore/shared-nestjs-metrics';
	 *
	 * @Module({
	 *   imports: [
	 *     MetricsModule.register({
	 *       prefix: 'myapp_',
	 *       defaultLabels: { app: 'my-backend' },
	 *     }),
	 *   ],
	 * })
	 * export class AppModule {}
	 * ```
	 */
	static register(options: MetricsModuleOptions = {}): DynamicModule {
		MetricsModule.options = options;

		const providers = [
			{
				provide: MetricsService,
				useFactory: () => new MetricsService(options),
			},
			MetricsMiddleware,
		];

		const controllers = options.registerController !== false ? [MetricsController] : [];

		return {
			module: MetricsModule,
			controllers,
			providers,
			exports: [MetricsService],
			global: true,
		};
	}

	configure(consumer: MiddlewareConsumer) {
		const excludePaths = MetricsModule.options.excludePaths || [];
		const metricsPath = MetricsModule.options.path || '/metrics';

		// Always exclude the metrics endpoint itself
		const allExcludePaths = [...excludePaths, metricsPath];

		consumer
			.apply(MetricsMiddleware)
			.exclude(...allExcludePaths)
			.forRoutes('*');
	}
}
