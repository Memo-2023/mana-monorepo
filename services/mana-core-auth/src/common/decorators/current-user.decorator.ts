import { createParamDecorator } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';

export interface CurrentUserData {
	userId: string;
	email: string;
	role: string;
}

export const CurrentUser = createParamDecorator(
	(data: unknown, ctx: ExecutionContext): CurrentUserData => {
		const request = ctx.switchToHttp().getRequest();
		return request.user;
	}
);
