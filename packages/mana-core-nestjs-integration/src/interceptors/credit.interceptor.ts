import {
	Injectable,
	NestInterceptor,
	ExecutionContext,
	CallHandler,
	Logger,
	Inject,
	Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { CreditClientService } from '../services/credit-client.service';
import {
	InsufficientCreditsException,
	InsufficientCreditsDetails,
} from '../exceptions/insufficient-credits.exception';
import { CREDIT_OPERATION_KEY, CreditOperationConfig } from '../decorators/use-credits.decorator';
import { CREDIT_COSTS, getOperationMetadata } from '@manacore/credit-operations';
import { MANA_CORE_OPTIONS } from '../mana-core.module';
import { ManaCoreModuleOptions } from '../interfaces/mana-core-options.interface';

/**
 * Interceptor that handles credit validation and consumption for decorated endpoints.
 *
 * This interceptor:
 * 1. Checks if the user has sufficient credits before executing the handler
 * 2. Consumes credits after successful execution (or before, depending on config)
 * 3. Throws InsufficientCreditsException if the user doesn't have enough credits
 */
@Injectable()
export class CreditInterceptor implements NestInterceptor {
	private readonly logger = new Logger(CreditInterceptor.name);

	constructor(
		private readonly reflector: Reflector,
		private readonly creditClient: CreditClientService,
		@Optional()
		@Inject(MANA_CORE_OPTIONS)
		private readonly options?: ManaCoreModuleOptions
	) {}

	async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
		const config = this.reflector.get<CreditOperationConfig>(
			CREDIT_OPERATION_KEY,
			context.getHandler()
		);

		// If no config, just proceed (shouldn't happen if decorator is used correctly)
		if (!config) {
			return next.handle();
		}

		const request = context.switchToHttp().getRequest();
		const user = request.user;

		// Check if user is authenticated
		if (!user?.sub) {
			this.logger.warn('No authenticated user found for credit operation');
			return next.handle();
		}

		const userId = user.sub;
		const operationName = config.operation;

		// Calculate cost
		const cost = this.calculateCost(config, request);
		const consumeMode = config.consumeMode || 'after';

		// Skip in development if configured
		if (config.skipInDev && this.isDevelopment()) {
			this.logger.debug(`Skipping credit check in development for ${operationName}`);
			return next.handle();
		}

		// Validate credits before execution
		const validation = await this.creditClient.validateCredits(userId, operationName, cost);

		if (!validation.hasCredits) {
			const details: InsufficientCreditsDetails = {
				requiredCredits: cost,
				availableCredits: validation.availableCredits,
				creditType: 'user',
				operation: operationName,
			};
			throw new InsufficientCreditsException(details);
		}

		// If consume mode is 'before', consume now
		if (consumeMode === 'before') {
			const description = this.generateDescription(config, request);
			const consumed = await this.creditClient.consumeCredits(
				userId,
				operationName,
				cost,
				description,
				this.buildMetadata(config, request)
			);

			if (!consumed) {
				this.logger.error(`Failed to consume credits for ${operationName}`);
				// Still allow the operation to proceed - fail open
			}

			return next.handle();
		}

		// If consume mode is 'after', consume on success
		return next.handle().pipe(
			tap(async () => {
				const description = this.generateDescription(config, request);
				const consumed = await this.creditClient.consumeCredits(
					userId,
					operationName,
					cost,
					description,
					this.buildMetadata(config, request)
				);

				if (!consumed) {
					this.logger.error(`Failed to consume credits after success for ${operationName}`);
				} else if (this.options?.debug) {
					this.logger.log(`Consumed ${cost} credits for ${operationName} (user: ${userId})`);
				}
			}),
			catchError((error) => {
				// Don't consume credits if the operation failed
				this.logger.debug(`Operation ${operationName} failed, credits not consumed`);
				return throwError(() => error);
			})
		);
	}

	/**
	 * Calculate the credit cost for the operation.
	 */
	private calculateCost(config: CreditOperationConfig, request: any): number {
		// Dynamic cost takes priority
		if (config.dynamicCost) {
			return config.dynamicCost(request);
		}

		// Custom cost override
		if (config.customCost !== undefined) {
			return config.customCost;
		}

		// Default cost from CREDIT_COSTS
		return CREDIT_COSTS[config.operation] || 0;
	}

	/**
	 * Generate a description for the credit transaction.
	 */
	private generateDescription(config: CreditOperationConfig, request: any): string {
		// Custom description function
		if (config.descriptionFn) {
			return config.descriptionFn(request);
		}

		// Default description from operation metadata
		const metadata = getOperationMetadata(config.operation);
		return metadata?.name || config.operation;
	}

	/**
	 * Build metadata for the credit transaction.
	 */
	private buildMetadata(config: CreditOperationConfig, request: any): Record<string, any> {
		const metadata: Record<string, any> = {
			operation: config.operation,
			path: request.path,
			method: request.method,
		};

		// Add app info from operation metadata
		const opMeta = getOperationMetadata(config.operation);
		if (opMeta) {
			metadata.app = opMeta.app;
			metadata.category = opMeta.category;
		}

		return metadata;
	}

	/**
	 * Check if running in development mode.
	 */
	private isDevelopment(): boolean {
		return (
			this.options?.debug ||
			process.env.NODE_ENV === 'development' ||
			process.env.NODE_ENV === 'dev'
		);
	}
}
