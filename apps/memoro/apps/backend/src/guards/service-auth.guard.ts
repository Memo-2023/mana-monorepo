import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class ServiceAuthGuard implements CanActivate {
	constructor(private configService: ConfigService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const authHeader = request.headers.authorization;

		if (!authHeader) {
			throw new UnauthorizedException('No authorization header provided');
		}

		const [type, token] = authHeader.split(' ');

		if (type !== 'Bearer') {
			throw new UnauthorizedException('Invalid token type');
		}

		if (!token) {
			throw new UnauthorizedException('No token provided');
		}

		// Check if the token is the service role key
		// Accept both MEMORO_SUPABASE_SERVICE_KEY and SUPABASE_SERVICE_KEY for compatibility
		const memoroServiceKey = this.configService.get<string>('MEMORO_SUPABASE_SERVICE_KEY');
		const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');

		if (token === memoroServiceKey || token === supabaseServiceKey) {
			// This is a valid service-to-service request
			// Attach a service identifier to the request
			request.isServiceAuth = true;
			request.serviceKey = token;
			return true;
		}

		// Optionally, validate the token with Supabase to ensure it's a valid service key
		try {
			const supabaseUrl = this.configService.get<string>('MEMORO_SUPABASE_URL');
			const supabase = createClient(supabaseUrl, token, {
				auth: {
					autoRefreshToken: false,
					persistSession: false,
				},
			});

			// Try to access a protected resource to validate the service key
			const { error } = await supabase.from('memos').select('id').limit(1);

			if (!error) {
				// Valid service key
				request.isServiceAuth = true;
				request.serviceKey = token;
				return true;
			}
		} catch (error) {
			// Token validation failed
		}

		throw new UnauthorizedException('Invalid service key');
	}
}
