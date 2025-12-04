import { createParamDecorator } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { type CurrentUserData } from '../types';

/**
 * Parameter decorator to extract the current user from the request.
 *
 * @example
 * ```typescript
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * getProfile(@CurrentUser() user: CurrentUserData) {
 *   return { userId: user.userId };
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
	(data: unknown, ctx: ExecutionContext): CurrentUserData => {
		const request = ctx.switchToHttp().getRequest();
		return request.user;
	}
);
