import {
	Injectable,
	NotFoundException,
	ForbiddenException,
	BadRequestException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Observable, catchError, firstValueFrom, map, tap } from 'rxjs';
import { AxiosError } from 'axios';
import {
	SpaceDto,
	PendingInvitesResponseDto,
	SpaceInviteDto,
} from '../interfaces/spaces.interfaces';

@Injectable()
export class SpacesClientService {
	private spacesServiceUrl: string;
	private memoroAppId: string;

	constructor(
		private httpService: HttpService,
		private configService: ConfigService
	) {
		this.spacesServiceUrl = this.configService.get<string>(
			'MANA_SERVICE_URL',
			'http://localhost:3000'
		);
		this.memoroAppId = this.configService.get<string>(
			'MEMORO_APP_ID',
			'973da0c1-b479-4dac-a1b0-ed09c72caca8'
		);
	}

	/**
	 * Gets spaces for a user by calling the Spaces service
	 */
	async getUserSpaces(userId: string, token: string): Promise<SpaceDto[]> {
		try {
			console.log(`Calling spaces service at: ${this.spacesServiceUrl}/spaces`);
			const response = await firstValueFrom(
				this.httpService
					.get(`${this.spacesServiceUrl}/spaces`, {
						headers: {
							Authorization: `Bearer ${token}`,
							'Content-Type': 'application/json',
						},
					})
					.pipe(
						map((response) => response.data),
						catchError((error: AxiosError) => {
							if (error.response?.status === 404) {
								console.error('HERE');
								throw new NotFoundException('Spaces not found');
							}
							throw new BadRequestException('Could not fetch spaces');
						})
					)
			);

			// Log the response for debugging
			console.log('Spaces response received:', JSON.stringify(response, null, 2));

			// Extract the spaces array from the response object
			const spaces = response.spaces || [];
			console.log(`Extracted ${spaces.length} spaces from response`);

			return spaces;
		} catch (error) {
			if (error instanceof NotFoundException || error instanceof BadRequestException) {
				throw error;
			}
			throw new BadRequestException('Could not fetch spaces');
		}
	}

	/**
	 * Gets all invites for a space by calling the Spaces service
	 * @param spaceId The ID of the space to get invites for
	 * @param token Optional JWT token for authorization
	 * @returns Array of space invites
	 */
	/**
	 * Invites a user to a space by email
	 * @param spaceId The ID of the space to invite to
	 * @param userEmail The email of the user to invite
	 * @param role The role to assign (owner, admin, editor, viewer)
	 * @param token JWT token for authorization
	 * @returns Object containing the inviteId
	 */
	async addSpaceMember(
		spaceId: string,
		userEmail: string,
		role: string,
		token: string
	): Promise<any> {
		try {
			console.log(`Adding member to space ${spaceId}: ${userEmail} with role ${role}`);
			const response = await firstValueFrom(
				this.httpService
					.post(
						`${this.spacesServiceUrl}/spaces/members`,
						{
							spaceId,
							userEmail,
							role,
						},
						{
							headers: {
								Authorization: `Bearer ${token}`,
								'Content-Type': 'application/json',
							},
						}
					)
					.pipe(
						map((response) => response.data),
						catchError((error: AxiosError) => {
							if (error.response?.status === 404) {
								throw new NotFoundException('Space not found');
							} else if (error.response?.status === 403) {
								throw new ForbiddenException('Not authorized to invite members to this space');
							}
							console.error('Error sending space invite:', error.message);
							throw new BadRequestException(`Could not invite user to space: ${error.message}`);
						})
					)
			);

			return response;
		} catch (error) {
			console.error(`Error in addSpaceMember for space ${spaceId}:`, error);
			throw error;
		}
	}

	/**
	 * Resends an invitation to a user
	 * @param inviteId The ID of the invitation to resend
	 * @param token JWT token for authorization
	 * @returns Success status
	 */
	async resendInvite(inviteId: string, token: string): Promise<any> {
		try {
			console.log(`Resending invite with ID: ${inviteId}`);
			const response = await firstValueFrom(
				this.httpService
					.post(
						`${this.spacesServiceUrl}/spaces/invites/${inviteId}/resend`,
						{},
						{
							headers: {
								Authorization: `Bearer ${token}`,
								'Content-Type': 'application/json',
							},
						}
					)
					.pipe(
						map((response) => response.data),
						catchError((error: AxiosError) => {
							if (error.response?.status === 404) {
								throw new NotFoundException('Invitation not found');
							} else if (error.response?.status === 403) {
								throw new ForbiddenException('Not authorized to resend this invitation');
							}
							console.error('Error resending invitation:', error.message);
							throw new BadRequestException(`Could not resend invitation: ${error.message}`);
						})
					)
			);

			return response;
		} catch (error) {
			console.error(`Error in resendInvite for invite ${inviteId}:`, error);
			throw error;
		}
	}

	/**
	 * Cancels an invitation
	 * @param inviteId The ID of the invitation to cancel
	 * @param token JWT token for authorization
	 * @returns Success status
	 */
	async cancelInvite(inviteId: string, token: string): Promise<any> {
		try {
			console.log(`Canceling invite with ID: ${inviteId}`);
			const response = await firstValueFrom(
				this.httpService
					.delete(`${this.spacesServiceUrl}/spaces/invites/${inviteId}`, {
						headers: {
							Authorization: `Bearer ${token}`,
							'Content-Type': 'application/json',
						},
					})
					.pipe(
						map((response) => response.data),
						catchError((error: AxiosError) => {
							if (error.response?.status === 404) {
								throw new NotFoundException('Invitation not found');
							} else if (error.response?.status === 403) {
								throw new ForbiddenException('Not authorized to cancel this invitation');
							}
							console.error('Error canceling invitation:', error.message);
							throw new BadRequestException(`Could not cancel invitation: ${error.message}`);
						})
					)
			);

			return response;
		} catch (error) {
			console.error(`Error in cancelInvite for invite ${inviteId}:`, error);
			throw error;
		}
	}

	async getSpaceInvites(spaceId: string, token?: string): Promise<any> {
		try {
			// Special case: if 'user' is passed as spaceId, redirect to getUserPendingInvites
			// This handles backward compatibility with frontend code that might be using
			// the wrong endpoint
			if (spaceId === 'user') {
				console.log('Redirecting getSpaceInvites("user") to getUserPendingInvites()');
				return this.getUserPendingInvites(token);
			}

			// Validate spaceId to ensure it's a valid value
			if (!spaceId || spaceId.length < 5) {
				throw new BadRequestException(`Invalid space ID: ${spaceId}`);
			}

			console.log(
				`Getting space invites at: ${this.spacesServiceUrl}/spaces/space/${spaceId}/invites`
			);
			const response = await firstValueFrom(
				this.httpService
					.get(`${this.spacesServiceUrl}/spaces/space/${spaceId}/invites`, {
						headers: {
							Authorization: token ? `Bearer ${token}` : '',
							'Content-Type': 'application/json',
						},
					})
					.pipe(
						map((response) => response.data),
						catchError((error: AxiosError) => {
							if (error.response?.status === 404) {
								throw new NotFoundException(`Invites for space ${spaceId} not found`);
							} else if (error.response?.status === 403) {
								throw new ForbiddenException(
									`Not authorized to access invites for space ${spaceId}`
								);
							}
							console.error('Error fetching space invites:', error.message);
							throw new BadRequestException(`Could not fetch invites for space ${spaceId}`);
						})
					)
			);

			return response;
		} catch (error) {
			console.error(`Error in getSpaceInvites for space ${spaceId}:`, error);
			throw error;
		}
	}

	/**
	 * Gets space details by calling the Spaces service
	 */
	async getSpaceDetails(spaceId: string, token?: string): Promise<any> {
		try {
			console.log(`Getting space details at: ${this.spacesServiceUrl}/spaces/${spaceId}`);
			const response = await firstValueFrom(
				this.httpService
					.get(`${this.spacesServiceUrl}/spaces/${spaceId}`, {
						headers: {
							Authorization: `Bearer ${token}`,
							'Content-Type': 'application/json',
						},
					})
					.pipe(
						map((response) => response.data),
						catchError((error: AxiosError) => {
							if (error.response?.status === 404) {
								throw new NotFoundException('Space not found');
							} else if (error.response?.status === 403) {
								throw new ForbiddenException('Access denied');
							}
							throw new BadRequestException('Could not fetch space details');
						})
					)
			);

			return response;
		} catch (error) {
			if (
				error instanceof NotFoundException ||
				error instanceof ForbiddenException ||
				error instanceof BadRequestException
			) {
				throw error;
			}
			throw new BadRequestException('Could not fetch space details');
		}
	}

	/**
          },
        ).pipe(
          map((response) => response.data),
          catchError((error: AxiosError) => {
            throw new BadRequestException('Could not create space');
          }),
        ),
      );

      return response;
    } catch (error) {
      throw new BadRequestException('Could not create space');
    }
  }

  /**
   * Creates a new space by calling the Spaces service
   */
	async createSpace(userId: string, spaceName: string, token: string) {
		try {
			console.log(`Creating space at: ${this.spacesServiceUrl}/spaces`);
			// Hardcode the UUID to test if this resolves the issue
			const appId = '973da0c1-b479-4dac-a1b0-ed09c72caca8';
			console.log(`Using hardcoded app ID: ${appId}`);

			const response = await firstValueFrom(
				this.httpService
					.post(
						`${this.spacesServiceUrl}/spaces`,
						{
							name: spaceName,
							appId, // Field name must match CreateSpaceDto in middleware
						},
						{
							headers: {
								Authorization: `Bearer ${token}`,
								'Content-Type': 'application/json',
							},
						}
					)
					.pipe(
						map((response) => response.data),
						catchError((error: AxiosError) => {
							throw new BadRequestException('Could not create space');
						})
					)
			);

			return response;
		} catch (error) {
			throw new BadRequestException('Could not create space');
		}
	}

	/**
	 * Verifies a user has access to a Memoro space and returns access details
	 */
	async verifySpaceAccess(userId: string, spaceId: string, token: string): Promise<any> {
		try {
			console.log(`Verifying space access at: ${this.spacesServiceUrl}/spaces/${spaceId}/access`);
			const response = await firstValueFrom(
				this.httpService
					.get(`${this.spacesServiceUrl}/spaces/${spaceId}/access`, {
						headers: {
							Authorization: `Bearer ${token}`,
							'Content-Type': 'application/json',
						},
					})
					.pipe(
						map((response) => response.data),
						catchError((error: AxiosError) => {
							if (error.response?.status === 404) {
								throw new NotFoundException('Space not found');
							} else if (error.response?.status === 403) {
								throw new ForbiddenException('Access denied');
							}
							throw new BadRequestException('Could not verify space access');
						})
					)
			);

			// Verify this is a Memoro space
			if (response.space.app_id !== this.memoroAppId) {
				throw new ForbiddenException('This is not a Memoro space');
			}

			// Return the full response which includes access information
			return response;
		} catch (error) {
			if (error instanceof NotFoundException) {
				return { access: { hasAccess: false, role: 'none' } };
			} else if (error instanceof ForbiddenException) {
				return { access: { hasAccess: false, role: 'none' } };
			}
			console.error(`Failed to verify space access: ${error.message}`);
			return { access: { hasAccess: false, role: 'none' } };
		}
	}

	/**
	 * Allow a non-owner to leave a space
	 */
	async leaveSpace(userId: string, spaceId: string, token: string): Promise<any> {
		try {
			console.log(`Leaving space at: ${this.spacesServiceUrl}/spaces/${spaceId}/leave`);
			const response = await firstValueFrom(
				this.httpService
					.post(
						`${this.spacesServiceUrl}/spaces/${spaceId}/leave`,
						{}, // Empty body
						{
							headers: {
								Authorization: `Bearer ${token}`,
								'Content-Type': 'application/json',
							},
						}
					)
					.pipe(
						map((response) => response.data),
						catchError((error: AxiosError) => {
							if (error.response?.status === 404) {
								throw new NotFoundException('Space not found');
							} else if (error.response?.status === 403) {
								// Safely access potential message in error response
								const message =
									typeof error.response?.data === 'object' && error.response?.data
										? (error.response.data as any).message || 'Access denied'
										: 'Access denied';
								throw new ForbiddenException(message);
							}
							throw new BadRequestException('Could not leave space');
						})
					)
			);

			return response;
		} catch (error) {
			if (error instanceof NotFoundException || error instanceof ForbiddenException) {
				throw error;
			}
			throw new BadRequestException('Could not leave space');
		}
	}

	/**
	 * Gets all pending invites for the current user
	 * @param token JWT token for authorization
	 * @returns Array of pending invites
	 */
	async getUserPendingInvites(token: string): Promise<PendingInvitesResponseDto> {
		try {
			console.log(
				`Getting user pending invites at: ${this.spacesServiceUrl}/spaces/user/invites')`
			);
			const response = await firstValueFrom(
				this.httpService
					.get(`${this.spacesServiceUrl}/spaces/user/invites`, {
						headers: {
							Authorization: `Bearer ${token}`,
							'Content-Type': 'application/json',
						},
					})
					.pipe(
						map((response) => response.data),
						catchError((error: AxiosError) => {
							if (error.response?.status === 404) {
								throw new NotFoundException('Pending invites not found');
							} else if (error.response?.status === 403) {
								throw new ForbiddenException('Not authorized to access pending invites');
							}
							console.error('Error fetching pending invites:', error.message);
							throw new BadRequestException('Could not fetch pending invites');
						})
					)
			);
			console.log(' WE are here in response');
			return response;
		} catch (error) {
			console.error(`Error in getUserPendingInvites:`, error);
			if (
				error instanceof NotFoundException ||
				error instanceof ForbiddenException ||
				error instanceof BadRequestException
			) {
				throw error;
			}
			throw new BadRequestException('Could not fetch pending invites');
		}
	}

	/**
	 * Deletes a space by calling the Spaces service
	 */
	async deleteSpace(userId: string, spaceId: string, token: string): Promise<any> {
		try {
			console.log(`Deleting space at: ${this.spacesServiceUrl}/spaces/${spaceId}`);
			const response = await firstValueFrom(
				this.httpService
					.delete(`${this.spacesServiceUrl}/spaces/${spaceId}`, {
						headers: {
							Authorization: `Bearer ${token}`,
							'Content-Type': 'application/json',
						},
					})
					.pipe(
						map((response) => response.data),
						catchError((error: AxiosError) => {
							if (error.response?.status === 404) {
								throw new NotFoundException('Space not found');
							} else if (error.response?.status === 403) {
								throw new ForbiddenException('Access denied');
							}
							throw new BadRequestException('Could not delete space');
						})
					)
			);

			return response;
		} catch (error) {
			if (
				error instanceof NotFoundException ||
				error instanceof ForbiddenException ||
				error instanceof BadRequestException
			) {
				throw error;
			}
			throw new BadRequestException('Could not delete space');
		}
	}
}
