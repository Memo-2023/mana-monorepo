import {
	Controller,
	Post,
	Get,
	Put,
	Patch,
	Delete,
	Body,
	Param,
	UseGuards,
	Headers,
	HttpCode,
	HttpStatus,
	Req,
	Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
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
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';

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
 * B2B Organization Endpoints:
 * - POST /auth/register/b2b - Register organization with owner
 * - GET /auth/organizations - List user's organizations
 * - GET /auth/organizations/:id - Get organization details
 * - PUT /auth/organizations/:id - Update organization
 * - DELETE /auth/organizations/:id - Delete organization (owner only)
 * - POST /auth/organizations/:id/invite - Invite employee
 * - GET /auth/organizations/:id/members - List organization members
 * - DELETE /auth/organizations/:id/members/:memberId - Remove member
 * - PATCH /auth/organizations/:orgId/members/:memberId/role - Update member role
 * - GET /auth/organizations/:id/invitations - List organization invitations
 * - POST /auth/organizations/accept-invitation - Accept invitation
 * - POST /auth/organizations/set-active - Switch active organization
 *
 * Invitation Endpoints:
 * - GET /auth/invitations - List user's pending invitations
 * - DELETE /auth/invitations/:id - Cancel or reject invitation
 */
@ApiTags('auth')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
	constructor(private readonly betterAuthService: BetterAuthService) {}

	// =========================================================================
	// B2C Authentication Endpoints
	// =========================================================================

	/**
	 * Register a new B2C user (individual)
	 *
	 * Creates a user account and initializes their credit balance.
	 * Rate limited to 5 requests per minute to prevent abuse.
	 */
	@Post('register')
	@Throttle({ default: { ttl: 60000, limit: 5 } })
	@ApiOperation({
		summary: 'Register new user',
		description: 'Create a new B2C user account. Rate limited to 5 requests/minute.',
	})
	@ApiBody({ type: RegisterDto })
	@ApiResponse({ status: 201, description: 'User created successfully' })
	@ApiResponse({ status: 400, description: 'Invalid input data' })
	@ApiResponse({ status: 409, description: 'Email already exists' })
	@ApiResponse({ status: 429, description: 'Rate limit exceeded' })
	async register(@Body() registerDto: RegisterDto) {
		return this.betterAuthService.registerB2C({
			email: registerDto.email,
			password: registerDto.password,
			name: registerDto.name || '',
			sourceAppUrl: registerDto.sourceAppUrl,
		});
	}

	/**
	 * Sign in with email and password
	 *
	 * Returns user data and JWT token.
	 * Rate limited to 10 requests per minute to prevent brute force.
	 */
	@Post('login')
	@Throttle({ default: { ttl: 60000, limit: 10 } })
	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary: 'User login',
		description: 'Authenticate with email and password. Returns JWT access token.',
	})
	@ApiBody({ type: LoginDto })
	@ApiResponse({
		status: 200,
		description: 'Login successful',
		schema: {
			type: 'object',
			properties: {
				user: {
					type: 'object',
					properties: {
						id: { type: 'string' },
						email: { type: 'string' },
						name: { type: 'string' },
					},
				},
				accessToken: { type: 'string' },
				refreshToken: { type: 'string' },
				expiresIn: { type: 'number', example: 900 },
			},
		},
	})
	@ApiResponse({ status: 401, description: 'Invalid credentials' })
	@ApiResponse({ status: 429, description: 'Rate limit exceeded' })
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
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({
		summary: 'User logout',
		description: 'Invalidate the current session',
	})
	@ApiResponse({ status: 200, description: 'Logout successful' })
	@ApiResponse({ status: 401, description: 'Not authenticated' })
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
	 * Exchange session cookie for JWT tokens (SSO)
	 *
	 * This endpoint enables cross-domain Single Sign-On (SSO).
	 * If the user has a valid session cookie (from logging in on another app),
	 * this returns JWT tokens that the app can use for API calls.
	 *
	 * The session cookie is set on .mana.how domain, so it's shared across:
	 * - calendar.mana.how
	 * - todo.mana.how
	 * - contacts.mana.how
	 * - etc.
	 */
	@Post('session-to-token')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary: 'Exchange session cookie for JWT tokens',
		description:
			'SSO endpoint: If user has a valid session cookie, returns JWT access and refresh tokens.',
	})
	@ApiResponse({
		status: 200,
		description: 'Tokens generated successfully',
		schema: {
			type: 'object',
			properties: {
				user: {
					type: 'object',
					properties: {
						id: { type: 'string' },
						email: { type: 'string' },
						name: { type: 'string' },
					},
				},
				accessToken: { type: 'string' },
				refreshToken: { type: 'string' },
				expiresIn: { type: 'number', example: 900 },
			},
		},
	})
	@ApiResponse({ status: 401, description: 'No valid session cookie' })
	async sessionToToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
		return this.betterAuthService.sessionToToken(req, res);
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
	 * Rate limited to 3 requests per minute to prevent abuse.
	 */
	@Post('forgot-password')
	@Throttle({ default: { ttl: 60000, limit: 3 } })
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
	 * Rate limited to 5 requests per minute.
	 */
	@Post('reset-password')
	@Throttle({ default: { ttl: 60000, limit: 5 } })
	@HttpCode(HttpStatus.OK)
	async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
		return this.betterAuthService.resetPassword(
			resetPasswordDto.token,
			resetPasswordDto.newPassword
		);
	}

	/**
	 * Resend verification email
	 *
	 * Sends a new verification email to the user.
	 * Always returns success to prevent email enumeration attacks.
	 * Rate limited to 3 requests per minute to prevent abuse.
	 */
	@Post('resend-verification')
	@Throttle({ default: { ttl: 60000, limit: 3 } })
	@HttpCode(HttpStatus.OK)
	async resendVerification(@Body() resendVerificationDto: ResendVerificationDto) {
		return this.betterAuthService.resendVerificationEmail(
			resendVerificationDto.email,
			resendVerificationDto.sourceAppUrl
		);
	}

	// =========================================================================
	// Profile Management Endpoints
	// =========================================================================

	/**
	 * Get current user profile
	 *
	 * Returns the authenticated user's profile data.
	 */
	@Get('profile')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({ summary: 'Get current user profile' })
	@ApiResponse({
		status: 200,
		description: 'Returns user profile',
		schema: {
			type: 'object',
			properties: {
				id: { type: 'string' },
				name: { type: 'string' },
				email: { type: 'string' },
				emailVerified: { type: 'boolean' },
				image: { type: 'string' },
				role: { type: 'string' },
				createdAt: { type: 'string', format: 'date-time' },
			},
		},
	})
	@ApiResponse({ status: 401, description: 'Not authenticated' })
	async getProfile(@CurrentUser() user: CurrentUserData) {
		return this.betterAuthService.getProfile(user.userId);
	}

	/**
	 * Update user profile
	 *
	 * Updates the user's name and/or profile image.
	 */
	@Post('profile')
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.OK)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({ summary: 'Update user profile' })
	@ApiBody({ type: UpdateProfileDto })
	@ApiResponse({ status: 200, description: 'Profile updated successfully' })
	@ApiResponse({ status: 401, description: 'Not authenticated' })
	async updateProfile(@CurrentUser() user: CurrentUserData, @Body() updateDto: UpdateProfileDto) {
		return this.betterAuthService.updateProfile(user.userId, {
			name: updateDto.name,
			image: updateDto.image,
		});
	}

	/**
	 * Change password
	 *
	 * Changes the user's password. Requires current password for verification.
	 * Rate limited to 5 requests per minute.
	 */
	@Post('change-password')
	@UseGuards(JwtAuthGuard)
	@Throttle({ default: { ttl: 60000, limit: 5 } })
	@HttpCode(HttpStatus.OK)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({ summary: 'Change password' })
	@ApiBody({ type: ChangePasswordDto })
	@ApiResponse({ status: 200, description: 'Password changed successfully' })
	@ApiResponse({ status: 401, description: 'Current password is incorrect' })
	async changePassword(@CurrentUser() user: CurrentUserData, @Body() changeDto: ChangePasswordDto) {
		return this.betterAuthService.changePassword(
			user.userId,
			changeDto.currentPassword,
			changeDto.newPassword
		);
	}

	/**
	 * Delete account
	 *
	 * Soft-deletes the user's account. Requires password confirmation.
	 * Rate limited to 3 requests per minute.
	 */
	@Delete('account')
	@UseGuards(JwtAuthGuard)
	@Throttle({ default: { ttl: 60000, limit: 3 } })
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({ summary: 'Delete user account' })
	@ApiBody({ type: DeleteAccountDto })
	@ApiResponse({ status: 200, description: 'Account deleted' })
	@ApiResponse({ status: 401, description: 'Password is incorrect' })
	async deleteAccount(@CurrentUser() user: CurrentUserData, @Body() deleteDto: DeleteAccountDto) {
		return this.betterAuthService.deleteAccount(user.userId, deleteDto.password, deleteDto.reason);
	}

	// =========================================================================
	// B2B Registration
	// =========================================================================

	/**
	 * Register a new B2B organization
	 *
	 * Creates an organization with the registering user as owner.
	 * Also creates organization credit balance.
	 * Rate limited to 3 requests per minute.
	 */
	@Post('register/b2b')
	@Throttle({ default: { ttl: 60000, limit: 3 } })
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

	/**
	 * Update organization
	 *
	 * Updates an organization's name, logo, or metadata.
	 * Requires owner or admin role.
	 */
	@Put('organizations/:id')
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.OK)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({
		summary: 'Update organization',
		description: 'Update organization name, logo, or metadata. Requires admin or owner role.',
	})
	@ApiBody({ type: UpdateOrganizationDto })
	@ApiResponse({ status: 200, description: 'Organization updated successfully' })
	@ApiResponse({ status: 401, description: 'Not authenticated' })
	@ApiResponse({ status: 403, description: 'No permission to update organization' })
	@ApiResponse({ status: 404, description: 'Organization not found' })
	async updateOrganization(
		@Param('id') id: string,
		@Body() dto: UpdateOrganizationDto,
		@Headers('authorization') authorization: string
	) {
		const token = this.extractToken(authorization);
		return this.betterAuthService.updateOrganization(id, dto, token);
	}

	/**
	 * Delete organization
	 *
	 * Permanently deletes an organization and all its data.
	 * Requires owner role.
	 */
	@Delete('organizations/:id')
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({
		summary: 'Delete organization',
		description: 'Permanently delete an organization. Only the owner can delete.',
	})
	@ApiResponse({ status: 204, description: 'Organization deleted successfully' })
	@ApiResponse({ status: 401, description: 'Not authenticated' })
	@ApiResponse({ status: 403, description: 'Only owner can delete organization' })
	@ApiResponse({ status: 404, description: 'Organization not found' })
	async deleteOrganization(
		@Param('id') id: string,
		@Headers('authorization') authorization: string
	) {
		const token = this.extractToken(authorization);
		await this.betterAuthService.deleteOrganization(id, token);
	}

	/**
	 * Update member role
	 *
	 * Changes a member's role within an organization.
	 * Requires owner or admin role.
	 */
	@Patch('organizations/:orgId/members/:memberId/role')
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.OK)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({
		summary: 'Update member role',
		description: "Change a member's role. Requires admin or owner role.",
	})
	@ApiBody({ type: UpdateMemberRoleDto })
	@ApiResponse({ status: 200, description: 'Member role updated successfully' })
	@ApiResponse({ status: 401, description: 'Not authenticated' })
	@ApiResponse({ status: 403, description: 'No permission to change roles' })
	@ApiResponse({ status: 404, description: 'Member not found' })
	async updateMemberRole(
		@Param('orgId') orgId: string,
		@Param('memberId') memberId: string,
		@Body() dto: UpdateMemberRoleDto,
		@Headers('authorization') authorization: string
	) {
		const token = this.extractToken(authorization);
		return this.betterAuthService.updateMemberRole(orgId, memberId, dto.role, token);
	}

	/**
	 * List organization invitations
	 *
	 * Returns all pending invitations for an organization.
	 * Requires owner or admin role.
	 */
	@Get('organizations/:id/invitations')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({
		summary: 'List organization invitations',
		description: 'Get all pending invitations for an organization.',
	})
	@ApiResponse({ status: 200, description: 'Returns list of invitations' })
	@ApiResponse({ status: 401, description: 'Not authenticated' })
	async listOrganizationInvitations(
		@Param('id') id: string,
		@Headers('authorization') authorization: string
	) {
		const token = this.extractToken(authorization);
		return this.betterAuthService.listOrganizationInvitations(id, token);
	}

	/**
	 * List user's pending invitations
	 *
	 * Returns all pending invitations for the authenticated user.
	 */
	@Get('invitations')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({
		summary: 'List user invitations',
		description: 'Get all pending invitations for the current user.',
	})
	@ApiResponse({ status: 200, description: 'Returns list of invitations' })
	@ApiResponse({ status: 401, description: 'Not authenticated' })
	async listUserInvitations(@Headers('authorization') authorization: string) {
		const token = this.extractToken(authorization);
		return this.betterAuthService.listUserInvitations(token);
	}

	/**
	 * Cancel or reject invitation
	 *
	 * Cancels an invitation (for org admins) or rejects it (for invitees).
	 * The system automatically determines which action to take based on the user's role.
	 */
	@Delete('invitations/:id')
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({
		summary: 'Cancel or reject invitation',
		description:
			'Cancel (as org admin/owner) or reject (as invitee) a pending invitation.',
	})
	@ApiResponse({ status: 204, description: 'Invitation cancelled/rejected successfully' })
	@ApiResponse({ status: 401, description: 'Not authenticated' })
	@ApiResponse({ status: 404, description: 'Invitation not found' })
	async cancelOrRejectInvitation(
		@Param('id') id: string,
		@Headers('authorization') authorization: string
	) {
		const token = this.extractToken(authorization);
		// Try cancel first (for org owners/admins), if fails try reject (for invitees)
		try {
			await this.betterAuthService.cancelInvitation(id, token);
		} catch {
			await this.betterAuthService.rejectInvitation(id, token);
		}
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
