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
		console.log('[OIDC Authorize] URL:', req.originalUrl);
		console.log('[OIDC Authorize] Query:', req.query);
		console.log('[OIDC Authorize] redirect_uri:', req.query.redirect_uri);
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

	/**
	 * Better Auth Sign-in Endpoint
	 *
	 * This endpoint is needed for OIDC login flow.
	 * When users log in via the /login page, it posts to this endpoint
	 * which sets the session cookie needed for the OAuth2 flow.
	 */
	@Post('api/auth/sign-in/email')
	async signInEmail(@Req() req: Request, @Res() res: Response) {
		return this.handleBetterAuthRequest(req, res);
	}

	/**
	 * Handle Better Auth requests by forwarding to Better Auth's handler
	 * This is a simpler handler that just passes through to Better Auth
	 */
	private async handleBetterAuthRequest(req: Request, res: Response) {
		try {
			const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
			const url = new URL(req.originalUrl, baseUrl);

			const headers = new Headers();
			for (const [key, value] of Object.entries(req.headers)) {
				if (value && typeof value === 'string') {
					headers.set(key, value);
				} else if (Array.isArray(value)) {
					headers.set(key, value[0]);
				}
			}

			// Create Fetch Request
			const fetchRequest = new Request(url.toString(), {
				method: req.method,
				headers,
				body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
			});

			// Get Better Auth handler and call it directly
			const handler = this.betterAuthService.getHandler();
			const response = await handler(fetchRequest);

			// Copy status
			res.status(response.status);

			// Copy headers including Set-Cookie for session
			response.headers.forEach((value: string, key: string) => {
				// Handle multiple Set-Cookie headers
				if (key.toLowerCase() === 'set-cookie') {
					res.append(key, value);
				} else {
					res.setHeader(key, value);
				}
			});

			// Handle redirects
			if (response.status === 302 || response.status === 301) {
				const location = response.headers.get('location');
				if (location) {
					return res.redirect(response.status, location);
				}
			}

			// Return body
			const body = await response.text();
			if (body) {
				return res.send(body);
			}

			return res.end();
		} catch (error) {
			console.error('[BetterAuth] Error handling request:', error);
			return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
				error: 'server_error',
				error_description: 'Internal server error',
			});
		}
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
		try {
			const response = await this.betterAuthService.handleOidcRequest(req);

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
