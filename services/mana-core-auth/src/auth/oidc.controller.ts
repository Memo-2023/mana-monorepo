/**
 * OIDC Provider Controller
 *
 * Exposes Better Auth's OIDC Provider endpoints for external services
 * like Matrix/Synapse to use SSO authentication.
 *
 * Endpoints:
 * - GET /.well-known/openid-configuration - OIDC Discovery
 * - GET /api/oidc/authorize - Authorization endpoint
 * - POST /api/oidc/token - Token endpoint
 * - GET /api/oidc/userinfo - UserInfo endpoint
 * - GET /api/oidc/jwks - JWKS endpoint
 */

import { Controller, Get, Post, All, Req, Res, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { BetterAuthService } from './services/better-auth.service';

@Controller()
export class OidcController {
	constructor(private readonly betterAuthService: BetterAuthService) {}

	/**
	 * OIDC Discovery Document
	 *
	 * Returns the OpenID Connect discovery document with all endpoints.
	 */
	@Get('.well-known/openid-configuration')
	async getOpenIdConfiguration(@Req() req: Request, @Res() res: Response) {
		return this.handleOidcRequest(req, res);
	}

	/**
	 * Authorization Endpoint
	 *
	 * Handles OAuth2 authorization requests.
	 */
	@Get('api/oidc/authorize')
	async authorize(@Req() req: Request, @Res() res: Response) {
		return this.handleOidcRequest(req, res);
	}

	/**
	 * Token Endpoint
	 *
	 * Exchanges authorization codes for tokens.
	 */
	@Post('api/oidc/token')
	async token(@Req() req: Request, @Res() res: Response) {
		return this.handleOidcRequest(req, res);
	}

	/**
	 * UserInfo Endpoint
	 *
	 * Returns user information for the authenticated user.
	 */
	@Get('api/oidc/userinfo')
	async userinfo(@Req() req: Request, @Res() res: Response) {
		return this.handleOidcRequest(req, res);
	}

	/**
	 * JWKS Endpoint (via /api/oidc/jwks)
	 *
	 * Returns JSON Web Key Set for token verification.
	 */
	@Get('api/oidc/jwks')
	async jwks(@Req() req: Request, @Res() res: Response) {
		return this.handleOidcRequest(req, res);
	}

	/**
	 * JWKS Endpoint (via /api/auth/jwks)
	 *
	 * Better Auth's discovery document points to this path,
	 * so we need to expose it directly as well.
	 */
	@Get('api/auth/jwks')
	async jwksAlt(@Req() req: Request, @Res() res: Response) {
		return this.handleOidcRequest(req, res);
	}

	/**
	 * Catch-all for other OIDC endpoints
	 */
	@All('api/oidc/*')
	async catchAll(@Req() req: Request, @Res() res: Response) {
		return this.handleOidcRequest(req, res);
	}

	/**
	 * Handle OIDC request by forwarding to Better Auth
	 */
	private async handleOidcRequest(req: Request, res: Response) {
		console.log('[OIDC Controller] Handling request:', req.method, req.originalUrl);
		try {
			const response = await this.betterAuthService.handleOidcRequest(req);
			console.log('[OIDC Controller] Better Auth response status:', response.status);

			// Set status code
			res.status(response.status || HttpStatus.OK);

			// Copy headers from Better Auth response
			if (response.headers) {
				for (const [key, value] of Object.entries(response.headers)) {
					if (value) {
						res.setHeader(key, value as string);
					}
				}
			}

			// Handle redirects
			if (response.status === 302 || response.status === 301) {
				const location = response.headers?.location || response.headers?.Location;
				if (location) {
					return res.redirect(response.status, location as string);
				}
			}

			// Return body
			if (response.body) {
				return res.send(response.body);
			}

			return res.end();
		} catch (error) {
			console.error('[OIDC] Error handling request:', error);
			return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
				error: 'server_error',
				error_description: 'Internal server error',
			});
		}
	}
}
