import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../types/jwt-payload.interface';

export const User = createParamDecorator(
	(data: unknown, ctx: ExecutionContext): JwtPayload & { token: string } => {
		const request = ctx.switchToHttp().getRequest();
		return {
			...request.user,
			token: request.token,
		};
	}
);
