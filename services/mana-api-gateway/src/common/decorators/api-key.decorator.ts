import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ApiKeyData } from '../../api-keys/api-keys.service';

/**
 * Parameter decorator to extract the validated API key data from the request.
 * Must be used with ApiKeyGuard.
 *
 * @example
 * ```typescript
 * @Post('search')
 * @UseGuards(ApiKeyGuard)
 * search(@ApiKeyData() apiKey: ApiKeyData) {
 *   return { keyId: apiKey.id };
 * }
 * ```
 */
export const ApiKeyParam = createParamDecorator(
	(data: unknown, ctx: ExecutionContext): ApiKeyData => {
		const request = ctx.switchToHttp().getRequest();
		return request.apiKey;
	}
);
