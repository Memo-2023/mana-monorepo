/**
 * OIDC Provider Controller
 *
 * Exposes Better Auth's OIDC Provider endpoints for external services
 * like Matrix/Synapse to use SSO authentication.
 *
 * Better Auth exposes OIDC endpoints at /api/auth/oauth2/* paths.
 * This controller provides routes at both:
 * - /api/auth/oauth2/* (native Better Auth paths from discovery document)
 * - /api/oidc/* (alternative paths for convenience)
 *
 * Endpoints:
 * - GET /.well-known/openid-configuration - OIDC Discovery
 * - GET /api/auth/oauth2/authorize - Authorization endpoint
 * - POST /api/auth/oauth2/token - Token endpoint
 * - GET /api/auth/oauth2/userinfo - UserInfo endpoint
 * - GET /api/auth/jwks - JWKS endpoint
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

	// ============================================
	// Better Auth Native OAuth2 Endpoints
	// These match the paths in the discovery document
	// ============================================

	/**
	 * Authorization Endpoint (Better Auth native path)
	 */
	@Get('api/auth/oauth2/authorize')
	async authorizeOauth2(@Req() req: Request, @Res() res: Response) {
		return this.handleOidcRequest(req, res);
	}

	/**
	 * Token Endpoint (Better Auth native path)
	 */
	@Post('api/auth/oauth2/token')
	async tokenOauth2(@Req() req: Request, @Res() res: Response) {
		return this.handleOidcRequest(req, res);
	}

	/**
	 * UserInfo Endpoint (Better Auth native path)
	 */
	@Get('api/auth/oauth2/userinfo')
	async userinfoOauth2(@Req() req: Request, @Res() res: Response) {
		return this.handleOidcRequest(req, res);
	}

	/**
	 * JWKS Endpoint (Better Auth native path)
	 */
	@Get('api/auth/jwks')
	async jwksAuth(@Req() req: Request, @Res() res: Response) {
		return this.handleOidcRequest(req, res);
	}

	/**
	 * Catch-all for other Better Auth OAuth2 endpoints
	 */
	@All('api/auth/oauth2/*')
	async catchAllOauth2(@Req() req: Request, @Res() res: Response) {
		return this.handleOidcRequest(req, res);
	}

	// ============================================
	// Alternative /api/oidc/* paths
	// For backwards compatibility and convenience
	// ============================================

	/**
	 * Authorization Endpoint (alternative path)
	 */
	@Get('api/oidc/authorize')
	async authorize(@Req() req: Request, @Res() res: Response) {
		return this.handleOidcRequest(req, res);
	}

	/**
	 * Token Endpoint (alternative path)
	 */
	@Post('api/oidc/token')
	async token(@Req() req: Request, @Res() res: Response) {
		return this.handleOidcRequest(req, res);
	}

	/**
	 * UserInfo Endpoint (alternative path)
	 */
	@Get('api/oidc/userinfo')
	async userinfo(@Req() req: Request, @Res() res: Response) {
		return this.handleOidcRequest(req, res);
	}

	/**
	 * JWKS Endpoint (alternative path)
	 */
	@Get('api/oidc/jwks')
	async jwks(@Req() req: Request, @Res() res: Response) {
		return this.handleOidcRequest(req, res);
	}

	/**
	 * Catch-all for other OIDC endpoints (alternative path)
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
