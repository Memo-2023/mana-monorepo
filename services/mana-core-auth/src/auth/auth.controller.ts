import {
	Controller,
	Post,
	Get,
	Delete,
	Body,
	Param,
	UseGuards,
	Headers,
	HttpCode,
	HttpStatus,
} from '@nestjs/common';
import { BetterAuthService } from './services/better-auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterB2BDto } from './dto/register-b2b.dto';
import { InviteEmployeeDto } from './dto/invite-employee.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { SetActiveOrganizationDto } from './dto/set-active-organization.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

/**
 * Auth Controller
 *
 * Handles authentication and organization management endpoints.
 *
 * B2C Endpoints:
 * - POST /auth/register - Register individual user
 * - POST /auth/login - Sign in with email/password
 * - POST /auth/logout - Sign out
 * - POST /auth/refresh - Refresh access token
 * - GET /auth/session - Get current session
 *
 * B2B Endpoints:
 * - POST /auth/register/b2b - Register organization with owner
 * - GET /auth/organizations - List user's organizations
 * - GET /auth/organizations/:id - Get organization details
 * - POST /auth/organizations/:id/invite - Invite employee
 * - POST /auth/organizations/accept-invitation - Accept invitation
 * - DELETE /auth/organizations/:id/members/:memberId - Remove member
 * - POST /auth/organizations/set-active - Switch active organization
 */
@Controller('auth')
export class AuthController {
	constructor(private readonly betterAuthService: BetterAuthService) {}

	// =========================================================================
	// B2C Authentication Endpoints
	// =========================================================================

	/**
	 * Register a new B2C user (individual)
	 *
	 * Creates a user account and initializes their credit balance.
	 */
	@Post('register')
	async register(@Body() registerDto: RegisterDto) {
		return this.betterAuthService.registerB2C({
			email: registerDto.email,
			password: registerDto.password,
			name: registerDto.name || '',
		});
	}

	/**
	 * Sign in with email and password
	 *
	 * Returns user data and JWT token.
	 */
	@Post('login')
	@HttpCode(HttpStatus.OK)
	async login(@Body() loginDto: LoginDto) {
		return this.betterAuthService.signIn({
			email: loginDto.email,
			password: loginDto.password,
			deviceId: loginDto.deviceId,
			deviceName: loginDto.deviceName,
		});
	}

	/**
	 * Sign out current user
	 *
	 * Invalidates the user's session.
	 */
	@Post('logout')
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.OK)
	async logout(@Headers('authorization') authorization: string) {
		const token = this.extractToken(authorization);
		return this.betterAuthService.signOut(token);
	}

	/**
	 * Refresh access token
	 *
	 * Uses refresh token rotation to issue new access and refresh tokens.
	 */
	@Post('refresh')
	@HttpCode(HttpStatus.OK)
	async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
		return this.betterAuthService.refreshToken(refreshTokenDto.refreshToken);
	}

	/**
	 * Get current session
	 *
	 * Returns the current user and session data.
	 */
	@Get('session')
	@UseGuards(JwtAuthGuard)
	async getSession(@Headers('authorization') authorization: string) {
		const token = this.extractToken(authorization);
		return this.betterAuthService.getSession(token);
	}

	/**
	 * Validate a token
	 *
	 * Checks if a token is valid and returns the payload.
	 */
	@Post('validate')
	@HttpCode(HttpStatus.OK)
	async validate(@Body() body: { token: string }) {
		return this.betterAuthService.validateToken(body.token);
	}

	/**
	 * Get JWKS (JSON Web Key Set)
	 *
	 * Returns public keys for JWT verification.
	 * This is a passthrough to Better Auth's JWKS.
	 */
	@Get('jwks')
	async getJwks() {
		return this.betterAuthService.getJwks();
	}

	// =========================================================================
	// Password Reset Endpoints
	// =========================================================================

	/**
	 * Request password reset
	 *
	 * Initiates the password reset flow by sending an email with a reset link.
	 * Always returns success to prevent email enumeration attacks.
	 */
	@Post('forgot-password')
	@HttpCode(HttpStatus.OK)
	async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
		return this.betterAuthService.requestPasswordReset(
			forgotPasswordDto.email,
			forgotPasswordDto.redirectTo
		);
	}

	/**
	 * Reset password with token
	 *
	 * Completes the password reset using the token from the email link.
	 */
	@Post('reset-password')
	@HttpCode(HttpStatus.OK)
	async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
		return this.betterAuthService.resetPassword(
			resetPasswordDto.token,
			resetPasswordDto.newPassword
		);
	}

	// =========================================================================
	// B2B Registration
	// =========================================================================

	/**
	 * Register a new B2B organization
	 *
	 * Creates an organization with the registering user as owner.
	 * Also creates organization credit balance.
	 */
	@Post('register/b2b')
	async registerB2B(@Body() registerDto: RegisterB2BDto) {
		return this.betterAuthService.registerB2B(registerDto);
	}

	// =========================================================================
	// Organization Management Endpoints
	// =========================================================================

	/**
	 * List user's organizations
	 *
	 * Returns all organizations the current user is a member of.
	 */
	@Get('organizations')
	@UseGuards(JwtAuthGuard)
	async listOrganizations(@Headers('authorization') authorization: string) {
		const token = this.extractToken(authorization);
		return this.betterAuthService.listOrganizations(token);
	}

	/**
	 * Get organization details
	 *
	 * Returns full organization info including members.
	 */
	@Get('organizations/:id')
	@UseGuards(JwtAuthGuard)
	async getOrganization(
		@Param('id') organizationId: string,
		@Headers('authorization') authorization: string
	) {
		const token = this.extractToken(authorization);
		return this.betterAuthService.getOrganization(organizationId, token);
	}

	/**
	 * Get organization members
	 *
	 * Returns all members of an organization with their roles.
	 */
	@Get('organizations/:id/members')
	@UseGuards(JwtAuthGuard)
	async getOrganizationMembers(@Param('id') organizationId: string) {
		return this.betterAuthService.getOrganizationMembers(organizationId);
	}

	/**
	 * Invite employee to organization
	 *
	 * Sends an invitation email to join the organization.
	 * Requires owner or admin role.
	 */
	@Post('organizations/:id/invite')
	@UseGuards(JwtAuthGuard)
	async inviteEmployee(
		@Param('id') organizationId: string,
		@Body() inviteDto: InviteEmployeeDto,
		@Headers('authorization') authorization: string
	) {
		const token = this.extractToken(authorization);
		return this.betterAuthService.inviteEmployee({
			organizationId,
			employeeEmail: inviteDto.employeeEmail,
			role: inviteDto.role,
			inviterToken: token,
		});
	}

	/**
	 * Accept organization invitation
	 *
	 * Accepts a pending invitation and adds user to organization.
	 */
	@Post('organizations/accept-invitation')
	@UseGuards(JwtAuthGuard)
	async acceptInvitation(
		@Body() acceptDto: AcceptInvitationDto,
		@Headers('authorization') authorization: string
	) {
		const token = this.extractToken(authorization);
		return this.betterAuthService.acceptInvitation({
			invitationId: acceptDto.invitationId,
			userToken: token,
		});
	}

	/**
	 * Remove member from organization
	 *
	 * Removes a member from the organization.
	 * Requires owner or admin role.
	 */
	@Delete('organizations/:id/members/:memberId')
	@UseGuards(JwtAuthGuard)
	async removeMember(
		@Param('id') organizationId: string,
		@Param('memberId') memberId: string,
		@Headers('authorization') authorization: string
	) {
		const token = this.extractToken(authorization);
		return this.betterAuthService.removeMember({
			organizationId,
			memberId,
			removerToken: token,
		});
	}

	/**
	 * Set active organization
	 *
	 * Switches the user's active organization context.
	 * Affects JWT claims and credit balance.
	 */
	@Post('organizations/set-active')
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.OK)
	async setActiveOrganization(
		@Body() setActiveDto: SetActiveOrganizationDto,
		@Headers('authorization') authorization: string
	) {
		const token = this.extractToken(authorization);
		return this.betterAuthService.setActiveOrganization({
			organizationId: setActiveDto.organizationId,
			userToken: token,
		});
	}

	// =========================================================================
	// Helper Methods
	// =========================================================================

	/**
	 * Extract token from Authorization header
	 */
	private extractToken(authorization: string): string {
		if (!authorization) {
			return '';
		}
		// Handle both "Bearer token" and raw token formats
		if (authorization.startsWith('Bearer ')) {
			return authorization.substring(7);
		}
		return authorization;
	}
}
