/**
 * @manacore/shared-nestjs-metrics
 *
 * Prometheus metrics module for NestJS backends.
 * Automatically tracks HTTP requests, duration, and provides custom metrics.
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
 *
 * The module automatically:
 * - Exposes a `/metrics` endpoint for Prometheus scraping
 * - Tracks HTTP request count, duration, and in-flight requests
 * - Collects default Node.js metrics (CPU, memory, event loop)
 *
 * Custom metrics can be created via the MetricsService:
 * ```typescript
 * @Injectable()
 * export class MyService {
 *   private readonly aiRequestCounter: Counter;
 *
 *   constructor(private readonly metricsService: MetricsService) {
 *     this.aiRequestCounter = metricsService.createCounter(
 *       'ai_requests_total',
 *       'Total AI requests',
 *       ['model']
 *     );
 *   }
 *
 *   async processAI(model: string) {
 *     this.aiRequestCounter.inc({ model });
 *     // ... process
 *   }
 * }
 * ```
 */

// Module
export { MetricsModule, MetricsModuleOptions } from './metrics.module';

// Service
export { MetricsService, MetricsServiceOptions } from './metrics.service';

// Middleware
export { MetricsMiddleware } from './metrics.middleware';

// Controller
export { MetricsController } from './metrics.controller';

// Re-export prom-client types for convenience
export { Counter, Histogram, Gauge, Summary } from 'prom-client';
