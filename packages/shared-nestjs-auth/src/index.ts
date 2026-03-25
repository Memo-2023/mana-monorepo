/**
 * @manacore/shared-nestjs-auth
 *
 * Shared authentication utilities for NestJS backends.
 * Verifies JWT tokens locally using JWKS from the Mana Core Auth service.
 *
 * @example
 * ```typescript
 * import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
 *
 * @Controller('api')
 * @UseGuards(JwtAuthGuard)
 * export class MyController {
 *   @Get('profile')
 *   getProfile(@CurrentUser() user: CurrentUserData) {
 *     return { userId: user.userId, email: user.email };
 *   }
 * }
 * ```
 */

// Guards
export { JwtAuthGuard } from './guards/jwt-auth.guard';

// Decorators
export { CurrentUser } from './decorators/current-user.decorator';

// Types
export type { CurrentUserData, AuthModuleConfig, TokenValidationResponse } from './types';
