import { SetMetadata, applyDecorators, UseInterceptors } from '@nestjs/common';
import { CreditInterceptor } from '../interceptors/credit.interceptor';
import { type CreditOperationType } from '@manacore/credit-operations';

/**
 * Metadata key for credit operation configuration.
 */
export const CREDIT_OPERATION_KEY = 'credit_operation';

/**
 * Configuration for credit consumption.
 */
export interface CreditOperationConfig {
	/**
	 * The operation type from the credit-operations package.
	 */
	operation: CreditOperationType;

	/**
	 * Custom cost override. If not specified, uses the default from CREDIT_COSTS.
	 */
	customCost?: number;

	/**
	 * Whether to consume credits before or after the handler execution.
	 * - 'before': Validate and reserve credits before execution (default)
	 * - 'after': Consume credits only after successful execution
	 */
	consumeMode?: 'before' | 'after';

	/**
	 * Optional function to calculate cost dynamically based on request.
	 * Receives the request object and should return the credit cost.
	 */
	dynamicCost?: (request: any) => number;

	/**
	 * Optional function to generate description for the transaction.
	 * Receives the request object and should return a description string.
	 */
	descriptionFn?: (request: any) => string;

	/**
	 * Whether to skip the credit check in development mode.
	 * Default: false
	 */
	skipInDev?: boolean;
}

/**
 * Decorator to require credits for an endpoint.
 *
 * @example Simple usage with operation type:
 * ```typescript
 * @Post('tasks')
 * @UseCredits(CreditOperationType.TASK_CREATE)
 * async createTask(@Body() dto: CreateTaskDto) {
 *   return this.taskService.create(dto);
 * }
 * ```
 *
 * @example With configuration object:
 * ```typescript
 * @Post('generate')
 * @UseCredits({
 *   operation: CreditOperationType.AI_IMAGE_GENERATION,
 *   consumeMode: 'after',
 *   descriptionFn: (req) => `Generated image: ${req.body.prompt}`,
 * })
 * async generateImage(@Body() dto: GenerateDto) {
 *   return this.imageService.generate(dto);
 * }
 * ```
 *
 * @example With dynamic cost:
 * ```typescript
 * @Post('bulk-import')
 * @UseCredits({
 *   operation: CreditOperationType.BULK_IMPORT,
 *   dynamicCost: (req) => Math.ceil(req.body.items.length / 10) * 0.2,
 * })
 * async bulkImport(@Body() dto: BulkImportDto) {
 *   return this.importService.import(dto);
 * }
 * ```
 */
export function UseCredits(
	operationOrConfig: CreditOperationType | CreditOperationConfig
): MethodDecorator {
	const config: CreditOperationConfig =
		typeof operationOrConfig === 'string' ? { operation: operationOrConfig } : operationOrConfig;

	return applyDecorators(
		SetMetadata(CREDIT_OPERATION_KEY, config),
		UseInterceptors(CreditInterceptor)
	);
}
