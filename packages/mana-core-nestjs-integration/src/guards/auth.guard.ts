import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
  Optional,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { MANA_CORE_OPTIONS } from '../mana-core.module';
import { ManaCoreModuleOptions } from '../interfaces/mana-core-options.interface';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Optional()
    @Inject(MANA_CORE_OPTIONS)
    private readonly options?: ManaCoreModuleOptions,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No authorization token provided');
    }

    try {
      // Decode the token to extract user information
      // The actual verification happens at the Mana Core middleware level
      const decoded = jwt.decode(token) as jwt.JwtPayload | null;

      if (!decoded || !decoded.sub) {
        throw new UnauthorizedException('Invalid token structure');
      }

      // Attach user info to request
      request.user = {
        sub: decoded.sub,
        email: decoded.email || '',
        role: decoded.role || 'user',
        app_id: decoded.app_id,
        iat: decoded.iat,
        exp: decoded.exp,
      };

      // Store raw token for downstream services
      request.accessToken = token;

      if (this.options?.debug) {
        console.log('[AuthGuard] User authenticated:', decoded.sub);
      }

      return true;
    } catch (error) {
      if (this.options?.debug) {
        console.error('[AuthGuard] Token validation failed:', error);
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
