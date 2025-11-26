import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// UserToken decorator remains as is since Mana Core doesn't provide this
export const UserToken = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    // Extract token from Authorization header
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return request.token;
  },
);
