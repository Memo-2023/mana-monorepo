import {
	Injectable,
	NotFoundException,
	ForbiddenException,
	BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SpacesClientService } from '../spaces/spaces-client.service';
import { SpaceSyncService } from '../spaces/space-sync.service';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
	MemoroSpaceDto,
	LinkMemoSpaceDto,
	UnlinkMemoSpaceDto,
} from '../interfaces/memoro.interfaces';
import { PendingInvitesResponseDto } from '../interfaces/spaces.interfaces';
import { CreditConsumptionService } from '../credits/credit-consumption.service';
import { calculateTranscriptionCost } from '../credits/pricing.constants';
import { InsufficientCreditsException } from '../errors/insufficient-credits.error';
import { HeadlineService } from '../ai/headline/headline.service';
import { randomUUID } from 'crypto';
const { v4: uuidv4 } = require('uuid');

@Injectable()
export class MemoroService {
	private readonly MEMORO_APP_ID: string;
	private memoroClient: SupabaseClient;
	private memoroServiceClient: SupabaseClient; // Service role client for RLS bypass
	private readonly memoroUrl: string;
	private readonly memoroKey: string;
	private readonly memoroServiceKey: string;

	constructor(
		private configService: ConfigService,
		private spacesService: SpacesClientService,
		private spaceSyncService: SpaceSyncService,
		private creditConsumptionService: CreditConsumptionService,
		private headlineService: HeadlineService
	) {
		this.MEMORO_APP_ID = this.configService.get<string>(
			'MEMORO_APP_ID',
			'973da0c1-b479-4dac-a1b0-ed09c72caca8'
		);

		// Initialize Memoro-specific clients
		this.memoroUrl = this.configService.get<string>('MEMORO_SUPABASE_URL');
		this.memoroKey = this.configService.get<string>('MEMORO_SUPABASE_ANON_KEY');
		this.memoroServiceKey = this.configService.get<string>('MEMORO_SUPABASE_SERVICE_KEY');

		if (this.memoroUrl && this.memoroKey) {
			console.log('Creating memoroClient with Memoro-specific credentials');
			this.memoroClient = createClient(this.memoroUrl, this.memoroKey);

			if (this.memoroServiceKey) {
				console.log('Creating memoroServiceClient with service role credentials');
				this.memoroServiceClient = createClient(this.memoroUrl, this.memoroServiceKey);
			} else {
				console.warn('MEMORO_SUPABASE_SERVICE_KEY not provided, falling back to anon key');
				this.memoroServiceClient = this.memoroClient;
			}
		} else {
			throw new Error('MEMORO_SUPABASE_URL or MEMORO_SUPABASE_ANON_KEY not provided');
		}
	}

	// Getter methods for Supabase connection info (used for direct DB operations in emergency)
	getSupabaseUrl(): string {
		return this.memoroUrl;
	}

	getSupabaseKey(): string {
		return this.memoroKey;
	}

	async getMemoroSpaces(userId: string, token: string): Promise<MemoroSpaceDto[]> {
		try {
			console.info('WE DONT GET SPACES YET, FUTURE IMPLEMENTATION');
			return [];
			console.log(`[getMemoroSpaces] Starting request for userId: ${userId}`);

			// Get spaces accessible to this user using the SpacesService
			console.log(`[getMemoroSpaces] Calling spacesService.getUserSpaces for userId: ${userId}`);
			const spaces = await this.spacesService.getUserSpaces(userId, token);

			console.log(`[getMemoroSpaces] Successfully filtered spaces. Count: ${spaces?.length || 0}`);
			if (spaces && spaces.length > 0) {
				console.log('[getMemoroSpaces] First space sample:', JSON.stringify(spaces[0], null, 2));
			}

			// If we have spaces, get the memo counts for each
			if (spaces && spaces.length > 0) {
				const spaceIds = spaces.map((space) => space.id);
				console.log(
					`[getMemoroSpaces] Getting memo counts for spaceIds: ${JSON.stringify(spaceIds)}`
				);

				try {
					// Get the Memoro-specific client with JWT authentication if available
					let memoroClient;
					if (token) {
						console.log(`[getMemoroSpaces] Using authenticated Memoro client with JWT`);
						memoroClient = this.getMemoroClientWithAuth(token);
					} else {
						console.log(`[getMemoroSpaces] Using unauthenticated Memoro client (no JWT provided)`);
						memoroClient = this.memoroClient;
					}

					// Check if the memo_spaces table exists first
					console.log(`[getMemoroSpaces] Checking if memo_spaces table exists`);
					const { error: tableCheckError } = await memoroClient
						.from('memo_spaces')
						.select('space_id')
						.limit(1);

					if (tableCheckError && tableCheckError.code === '42P01') {
						// Table doesn't exist, set all counts to 0
						console.log(
							`[getMemoroSpaces] memo_spaces table doesn't exist, setting all counts to 0`
						);
						spaces.forEach((space: MemoroSpaceDto) => {
							space.memo_count = 0;
						});
					} else {
						// Table exists, try to get counts
						// Set default counts to 0 for all spaces first
						spaces.forEach((space: MemoroSpaceDto) => {
							space.memo_count = 0;
						});

						// Try to get actual counts where available
						for (const space of spaces) {
							try {
								const { count, error } = await memoroClient
									.from('memo_spaces')
									.select('*', { count: 'exact' })
									.eq('space_id', space.id);

								if (!error) {
									space.memo_count = count || 0;
									console.log(`[getMemoroSpaces] Space ${space.id} has ${space.memo_count} memos`);
								}
							} catch (countError) {
								console.error(
									`[getMemoroSpaces] Error counting memos for space ${space.id}:`,
									countError
								);
								// Count remains 0 as set above
							}
						}
					}
				} catch (error) {
					console.error('[getMemoroSpaces] Exception in memo counts processing:', error);
					// Set all counts to 0 if there was an error
					spaces.forEach((space: MemoroSpaceDto) => {
						space.memo_count = 0;
					});
				}
			}

			// Sanitize spaces data before returning to frontend
			const sanitizedSpaces = this.sanitizeSpacesForFrontend(spaces || [], userId);
			console.log(`[getMemoroSpaces] Returning ${sanitizedSpaces.length} sanitized spaces`);

			return sanitizedSpaces;
		} catch (error) {
			console.error('Unexpected error in getMemoroSpaces:', error);
			const errorMessage =
				error.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
			throw new Error(`Failed to get Memoro spaces: ${errorMessage}`);
		}
	}

	/**
	 * Sanitizes space data for frontend consumption by removing sensitive information
	 * @param spaces Array of space objects to sanitize
	 * @returns Array of sanitized space objects
	 */
	private sanitizeSpacesForFrontend(spaces: MemoroSpaceDto[], userId: string): MemoroSpaceDto[] {
		return spaces.map((space) => {
			// Check if the user is the owner
			const isOwner = space.owner_id === userId || space.roles?.members?.[userId]?.role === 'owner';

			// Only keep essential properties that the frontend needs
			return {
				id: space.id,
				name: space.name,
				owner_id: space.owner_id,
				memo_count: space.memo_count || 0,
				// Only include minimal role information if needed
				roles: space.roles
					? {
							members: space.roles.members ? Object.keys(space.roles.members) : [],
						}
					: { members: [] },
				created_at: space.created_at,
				updated_at: space.updated_at,
				isOwner, // Add the isOwner flag
			} as MemoroSpaceDto;
		});
	}

	async createMemoroSpace(userId: string, spaceName: string, token: string) {
		try {
			// Create the space in the middleware first
			const space = await this.spacesService.createSpace(userId, spaceName, token);

			// Sync the owner to the space_members table for RLS access control
			try {
				await this.spaceSyncService.syncSpaceMembership(
					space.id,
					userId,
					'owner' // Owner role
				);
				console.log(`Successfully synced owner ${userId} for new space ${space.id}`);
			} catch (syncError) {
				// Log but don't fail if sync fails
				console.error(`Failed to sync space owner: ${syncError.message}`);
			}

			return space;
		} catch (error) {
			console.error('Error creating Memoro space:', error);
			throw new Error(`Failed to create Memoro space: ${error.message}`);
		}
	}

	async getMemoroSpaceDetails(userId: string, spaceId: string, token: string) {
		try {
			// Try to get the space details directly first
			try {
				// Get full space details using the spaces service
				const spaceDetails = await this.spacesService.getSpaceDetails(spaceId, token);
				return spaceDetails;
			} catch (detailsError) {
				// If this fails, log the error and try verification as a fallback
				console.log(
					`Initial space details fetch failed: ${detailsError.message}. Trying access verification...`
				);

				// Verify user has access to this Memoro space through the Spaces service
				await this.verifyMemoroSpaceAccess(userId, spaceId, token);

				// If verification succeeds, try getting details again
				return await this.spacesService.getSpaceDetails(spaceId, token);
			}
		} catch (error) {
			console.error('Error fetching Memoro space details:', error);

			if (
				error instanceof NotFoundException ||
				error instanceof ForbiddenException ||
				error instanceof BadRequestException
			) {
				throw error;
			}

			throw new Error(`Failed to get Memoro space details: ${error.message}`);
		}
	}

	/**
	 * Gets invites for a space
	 * @param spaceId Space ID to get invites for
	 * @param token JWT token for authorization
	 */
	async getSpaceInvites(spaceId: string, token: string) {
		try {
			console.log(`[getSpaceInvites] Getting invites for space ${spaceId}`);
			// Proxy the request to the spaces service
			const invitesResult = await this.spacesService.getSpaceInvites(spaceId, token);
			console.log(`[getSpaceInvites] Successfully retrieved invites for space ${spaceId}`);
			return invitesResult;
		} catch (error) {
			console.error(`[getSpaceInvites] Error getting invites for space ${spaceId}:`, error);

			if (
				error instanceof NotFoundException ||
				error instanceof ForbiddenException ||
				error instanceof BadRequestException
			) {
				throw error;
			}

			throw new Error(`Failed to get invites for space ${spaceId}: ${error.message}`);
		}
	}

	/**
	 * Invites a user to a space by email
	 * @param userId ID of the user sending the invitation
	 * @param spaceId Space ID to invite to
	 * @param email Email of the user to invite
	 * @param role Role to assign (owner, admin, editor, viewer)
	 * @param token JWT token for authorization
	 * @returns Result of the invitation operation
	 */
	async inviteUserToSpace(
		userId: string,
		spaceId: string,
		email: string,
		role: string,
		token: string
	) {
		try {
			console.log(
				`[inviteUserToSpace] User ${userId} inviting ${email} to space ${spaceId} with role ${role}`
			);

			// Validate input
			if (!spaceId || !email || !role) {
				throw new BadRequestException('Space ID, email, and role are required');
			}

			// Validate the role
			const validRoles = ['owner', 'admin', 'editor', 'viewer'];
			if (!validRoles.includes(role)) {
				throw new BadRequestException(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
			}

			// Verify that the user has access to this space and is an owner/admin
			try {
				// First verify the user has access to the space
				await this.verifyMemoroSpaceAccess(userId, spaceId, token);

				// Now proxy the invite request to the spaces service
				const result = await this.spacesService.addSpaceMember(spaceId, email, role, token);
				console.log(`[inviteUserToSpace] Successfully invited ${email} to space ${spaceId}`);

				// If the user already exists (has an ID), sync them to the space_members table
				if (result.invitee_id) {
					try {
						await this.spaceSyncService.syncSpaceMembership(
							spaceId,
							result.invitee_id,
							role,
							userId // invited by current user
						);
						console.log(
							`[inviteUserToSpace] Synced space member ${result.invitee_id} to space ${spaceId}`
						);
					} catch (syncError) {
						// Log but don't fail if sync fails
						console.error(`[inviteUserToSpace] Failed to sync space member: ${syncError.message}`);
					}
				}

				return result;
			} catch (error) {
				console.error(`[inviteUserToSpace] Error verifying access or sending invite:`, error);
				throw error;
			}
		} catch (error) {
			console.error(`[inviteUserToSpace] Error inviting user to space ${spaceId}:`, error);

			if (
				error instanceof NotFoundException ||
				error instanceof ForbiddenException ||
				error instanceof BadRequestException
			) {
				throw error;
			}

			throw new Error(`Failed to invite user to space: ${error.message}`);
		}
	}

	/**
	 * Resends an invitation to join a space
	 * @param userId ID of the user performing the action
	 * @param inviteId ID of the invitation to resend
	 * @param token JWT token for authorization
	 * @returns Success response
	 */
	async resendSpaceInvite(userId: string, inviteId: string, token: string) {
		try {
			console.log(`[resendSpaceInvite] User ${userId} resending invite ${inviteId}`);

			if (!inviteId) {
				throw new BadRequestException('Invite ID is required');
			}

			// Proxy the resend request to the spaces service
			const result = await this.spacesService.resendInvite(inviteId, token);
			console.log(`[resendSpaceInvite] Successfully resent invite ${inviteId}`);
			return result;
		} catch (error) {
			console.error(`[resendSpaceInvite] Error resending invite ${inviteId}:`, error);

			if (
				error instanceof NotFoundException ||
				error instanceof ForbiddenException ||
				error instanceof BadRequestException
			) {
				throw error;
			}

			throw new Error(`Failed to resend invitation: ${error.message}`);
		}
	}

	/**
	 * Cancels an invitation to join a space
	 * @param userId ID of the user performing the action
	 * @param inviteId ID of the invitation to cancel
	 * @param token JWT token for authorization
	 * @returns Success response
	 */
	async cancelSpaceInvite(userId: string, inviteId: string, token: string) {
		try {
			console.log(`[cancelSpaceInvite] User ${userId} canceling invite ${inviteId}`);

			if (!inviteId) {
				throw new BadRequestException('Invite ID is required');
			}

			// Proxy the cancel request to the spaces service
			const result = await this.spacesService.cancelInvite(inviteId, token);
			console.log(`[cancelSpaceInvite] Successfully canceled invite ${inviteId}`);
			return result;
		} catch (error) {
			console.error(`[cancelSpaceInvite] Error canceling invite ${inviteId}:`, error);

			if (
				error instanceof NotFoundException ||
				error instanceof ForbiddenException ||
				error instanceof BadRequestException
			) {
				throw error;
			}

			throw new Error(`Failed to cancel invitation: ${error.message}`);
		}
	}

	/**
	 * Verify if a user has access to a Memoro space
	 */
	private async verifyMemoroSpaceAccess(userId: string, spaceId: string, token: string) {
		return this.spacesService.verifySpaceAccess(userId, spaceId, token);
	}

	// The sanitizeSpacesForFrontend method is now updated with isOwner flag above

	/**
	 * Verify if a memo exists and the user has access to it
	 */
	private async verifyMemoAccess(userId: string, memoId: string, token?: string) {
		console.log(`[verifyMemoAccess] Verifying access to memo ${memoId} for user ${userId}`);

		// Use the Memoro-specific client with JWT if available
		const client = token ? this.getMemoroClientWithAuth(token) : this.memoroClient;

		try {
			// Check if the memo exists and belongs to the user
			console.log(`[verifyMemoAccess] Querying Memoro database for memo ${memoId}`);
			const { data: memo, error } = await client
				.from('memos')
				.select('user_id')
				.eq('id', memoId)
				.single();

			if (error) {
				console.error(`[verifyMemoAccess] Database error:`, error);
				throw new NotFoundException(`Memo not found: ${error.message}`);
			}

			if (!memo) {
				console.error(`[verifyMemoAccess] Memo ${memoId} not found in database`);
				throw new NotFoundException('Memo not found: no data returned');
			}

			console.log(`[verifyMemoAccess] Memo found, belongs to user: ${memo.user_id}`);

			// In this implementation, we're assuming that the user can only link their own memos
			if (memo.user_id !== userId) {
				console.error(
					`[verifyMemoAccess] User ${userId} does not have permission to access memo owned by ${memo.user_id}`
				);
				throw new ForbiddenException('You do not have permission to access this memo');
			}

			console.log(`[verifyMemoAccess] Access verified for memo ${memoId}`);
			return true;
		} catch (error) {
			if (error instanceof NotFoundException || error instanceof ForbiddenException) {
				throw error;
			}
			console.error(`[verifyMemoAccess] Unexpected error:`, error);
			throw new NotFoundException(`Memo access verification failed: ${error.message}`);
		}
	}

	/**
	 * Create a client with JWT authentication
	 * @param jwt The JWT token for authentication
	 * @param useServiceRole Whether to use service role client (bypasses RLS)
	 * @returns A Supabase client with appropriate authentication
	 */
	private getMemoroClientWithAuth(jwt: string, useServiceRole: boolean = false): SupabaseClient {
		// If we need to bypass RLS and we have a service role client, return it
		if (useServiceRole && this.memoroServiceClient) {
			console.log('Using service role client to bypass RLS');
			return this.memoroServiceClient;
		}

		console.log('Creating authenticated Memoro client with JWT');

		// Get the Memoro Supabase URL and key
		const memoroUrl = this.configService.get<string>('MEMORO_SUPABASE_URL');
		const memoroKey = this.configService.get<string>('MEMORO_SUPABASE_ANON_KEY');

		if (!memoroUrl || !memoroKey) {
			throw new Error('MEMORO_SUPABASE_URL or MEMORO_SUPABASE_ANON_KEY not provided');
		}

		// Create a new client with the JWT token to avoid modifying the shared client
		return createClient(memoroUrl, memoroKey, {
			global: {
				headers: {
					Authorization: `Bearer ${jwt}`,
				},
			},
		});
	}

	/**
	 * Link a memo to a space
	 */
	async linkMemoToSpace(userId: string, linkMemoSpaceDto: LinkMemoSpaceDto, token?: string) {
		try {
			const { memoId, spaceId } = linkMemoSpaceDto;

			if (!memoId || !spaceId) {
				throw new BadRequestException('Memo ID and Space ID are required');
			}

			console.log(
				`[linkMemoToSpace] Attempting to link memo ${memoId} to space ${spaceId} for user ${userId}`
			);

			// Verify the user has access to both the memo and the space
			await this.verifyMemoAccess(userId, memoId, token);
			await this.verifyMemoroSpaceAccess(userId, spaceId, token);

			// Get the Memoro-specific client with JWT authentication if available
			const memoroClient = token ? this.getMemoroClientWithAuth(token) : this.memoroClient;

			// Check if the link already exists
			console.log(`[linkMemoToSpace] Checking if link already exists`);
			const { data: existingLink, error: checkError } = await memoroClient
				.from('memo_spaces')
				.select('*')
				.eq('memo_id', memoId)
				.eq('space_id', spaceId)
				.maybeSingle();

			if (checkError) {
				console.error(`[linkMemoToSpace] Error checking for existing link:`, checkError);
			}

			if (existingLink) {
				console.log(`[linkMemoToSpace] Link already exists`);
				// Link already exists, no need to create it again
				return { success: true, message: 'Memo is already linked to this space' };
			}

			// Create the link
			console.log(
				`[linkMemoToSpace] Creating new link between memo ${memoId} and space ${spaceId}`
			);
			const { error } = await memoroClient.from('memo_spaces').insert({
				memo_id: memoId,
				space_id: spaceId,
				created_at: new Date(),
			});

			if (error) {
				console.error(`[linkMemoToSpace] Error creating link:`, error);
				throw new Error(`Failed to link memo to space: ${error.message}`);
			}

			console.log(`[linkMemoToSpace] Successfully linked memo ${memoId} to space ${spaceId}`);
			return { success: true, message: 'Memo linked to space successfully' };
		} catch (error) {
			console.error('Error linking memo to space:', error);

			if (
				error instanceof NotFoundException ||
				error instanceof ForbiddenException ||
				error instanceof BadRequestException
			) {
				throw error;
			}

			throw new Error(`Failed to link memo to space: ${error.message}`);
		}
	}

	/**
	 * Unlink a memo from a space
	 */
	async unlinkMemoFromSpace(
		userId: string,
		unlinkMemoSpaceDto: UnlinkMemoSpaceDto,
		token?: string
	) {
		try {
			const { memoId, spaceId } = unlinkMemoSpaceDto;

			if (!memoId || !spaceId) {
				throw new BadRequestException('Memo ID and Space ID are required');
			}

			console.log(
				`[unlinkMemoFromSpace] Attempting to unlink memo ${memoId} from space ${spaceId} for user ${userId}`
			);

			// Verify the user has access to both the memo and the space
			await this.verifyMemoAccess(userId, memoId, token);
			await this.verifyMemoroSpaceAccess(userId, spaceId, token);

			// Get the Memoro-specific client with JWT authentication if available
			const memoroClient = token ? this.getMemoroClientWithAuth(token) : this.memoroClient;

			// Delete the link
			console.log(
				`[unlinkMemoFromSpace] Deleting link between memo ${memoId} and space ${spaceId}`
			);
			const { error } = await memoroClient
				.from('memo_spaces')
				.delete()
				.eq('memo_id', memoId)
				.eq('space_id', spaceId);

			if (error) {
				console.error(`[unlinkMemoFromSpace] Error deleting link:`, error);
				throw new Error(`Failed to unlink memo from space: ${error.message}`);
			}

			console.log(
				`[unlinkMemoFromSpace] Successfully unlinked memo ${memoId} from space ${spaceId}`
			);
			return { success: true, message: 'Memo unlinked from space successfully' };
		} catch (error) {
			console.error('Error unlinking memo from space:', error);

			if (
				error instanceof NotFoundException ||
				error instanceof ForbiddenException ||
				error instanceof BadRequestException
			) {
				throw error;
			}

			throw new Error(`Failed to unlink memo from space: ${error.message}`);
		}
	}

	/**
	 * Get all memos for a specific space
	 */
	async getSpaceMemos(userId: string, spaceId: string, token?: string) {
		try {
			if (!spaceId) {
				throw new BadRequestException('Space ID is required');
			}

			// Try to verify the user has access to the space, but don't fail if the space doesn't exist in core service
			try {
				await this.verifyMemoroSpaceAccess(userId, spaceId, token);
			} catch (verifyError) {
				console.warn(`Space access verification error: ${verifyError.message}`);
				// If we can't verify access, but we have a record in our Supabase database, continue anyway
				// This helps with cases where spaces might exist in Memoro but not fully synced with mana-core
			}

			// Use the service role client after verifying authorization to bypass RLS
			// This ensures we can see all memos in the space regardless of who created them
			const memoroClient = token
				? this.getMemoroClientWithAuth(token, true)
				: this.memoroServiceClient;

			// Get all memos linked to this space
			const { data: memoSpaces, error: joinError } = await memoroClient
				.from('memo_spaces')
				.select('memo_id')
				.eq('space_id', spaceId);

			if (joinError) {
				throw new Error(`Failed to get memo-space relationships: ${joinError.message}`);
			}

			if (!memoSpaces || memoSpaces.length === 0) {
				return { memos: [] };
			}

			// Extract memo IDs
			const memoIds = memoSpaces.map((ms) => ms.memo_id);

			// Get the memo details
			const { data: memos, error: memosError } = await memoroClient
				.from('memos')
				.select(
					`
          id,
          title,
          user_id,
          source,
          style,
          is_pinned,
          is_archived,
          is_public,
          metadata,
          created_at,
          updated_at
        `
				)
				.in('id', memoIds);

			if (memosError) {
				throw new Error(`Failed to get memos: ${memosError.message}`);
			}

			return { memos: memos || [] };
		} catch (error) {
			console.error('Error getting space memos:', error);

			if (
				error instanceof NotFoundException ||
				error instanceof ForbiddenException ||
				error instanceof BadRequestException
			) {
				throw error;
			}

			throw new Error(`Failed to get space memos: ${error.message}`);
		}
	}

	/**
	 * Deletes a memoro space and cleans up associated memo connections
	 */
	async deleteMemoroSpace(userId: string, spaceId: string, token: string) {
		try {
			// First, clean up all memo_spaces entries for this spaceId
			console.log(`Cleaning up memo_spaces entries for space ${spaceId}`);

			// Use the Memoro-specific client with JWT if available
			const client = token ? this.getMemoroClientWithAuth(token) : this.memoroClient;

			// Delete all memo_spaces entries for this space ID
			const { error: deleteError } = await client
				.from('memo_spaces')
				.delete()
				.eq('space_id', spaceId);

			if (deleteError) {
				console.error(`Error cleaning up memo_spaces for space ${spaceId}:`, deleteError);
				// Continue with space deletion even if cleanup fails
			} else {
				console.log(`Successfully cleaned up memo_spaces for space ${spaceId}`);
			}

			// Now call the spaces service to delete the space
			const response = await this.spacesService.deleteSpace(userId, spaceId, token);

			// Return the response from the spaces service
			return response;
		} catch (error) {
			console.error(`Error in deleteMemoroSpace:`, error);
			// Rethrow the error to be handled by the controller
			throw error;
		}
	}

	/**
	 * Allows a non-owner to leave a space
	 */
	async leaveSpace(userId: string, spaceId: string, token: string) {
		try {
			// First, clean up any memo_spaces entries created by this user for this spaceId
			console.log(`Cleaning up user's memo_spaces entries for space ${spaceId}`);

			// Use the Memoro-specific client with JWT if available
			const client = token ? this.getMemoroClientWithAuth(token) : this.memoroClient;

			// First get the user's memos
			const { data: userMemos, error: memosError } = await client
				.from('memos')
				.select('id')
				.eq('user_id', userId);

			if (memosError) {
				console.error(`Error fetching user memos:`, memosError);
			} else if (userMemos && userMemos.length > 0) {
				// Get the IDs of user's memos
				const memoIds = userMemos.map((memo) => memo.id);

				// Delete any memo_spaces links for this user's memos in this space
				const { error: deleteError } = await client
					.from('memo_spaces')
					.delete()
					.eq('space_id', spaceId)
					.in('memo_id', memoIds);

				if (deleteError) {
					console.error(`Error cleaning up user's memo_spaces:`, deleteError);
				} else {
					console.log(`Successfully cleaned up user's memo connections for space ${spaceId}`);
				}
			}

			// Now call the spaces service to remove the user from the space
			const result = await this.spacesService.leaveSpace(userId, spaceId, token);

			// After successfully leaving the space, remove the user from the space_members table
			try {
				await this.spaceSyncService.removeSpaceMembership(spaceId, userId);
				console.log(`Successfully removed user ${userId} from space_members for space ${spaceId}`);
			} catch (syncError) {
				// Log but don't fail if sync fails
				console.error(`Failed to remove user from space_members: ${syncError.message}`);
			}

			return result;
		} catch (error) {
			console.error(`Error in leaveSpace:`, error);
			// Rethrow the error to be handled by the controller
			throw error;
		}
	}

	/**
	 * Gets all pending invites for the user
	 * @param userId ID of the user
	 * @param token JWT token for authorization
	 * @returns Object containing pending invites
	 */
	async getUserPendingInvites(userId: string, token: string): Promise<PendingInvitesResponseDto> {
		try {
			console.log(`[getUserPendingInvites] Getting pending invites for user ${userId}`);

			// Get all pending invites from spaces service
			const invitesResult = await this.spacesService.getUserPendingInvites(token);

			console.log('invitesResult: ', invitesResult);
			console.log(
				`[getUserPendingInvites] Successfully retrieved ${invitesResult?.invites?.length || 0} pending invites for user ${userId}`
			);
			return invitesResult;
		} catch (error) {
			console.error(
				`[getUserPendingInvites] Error getting pending invites for user ${userId}:`,
				error
			);

			if (error instanceof NotFoundException) {
				// Return empty invites array instead of throwing an error if not found
				return { invites: [] };
			} else if (error instanceof ForbiddenException || error instanceof BadRequestException) {
				throw error;
			} else {
				// For any other errors, return empty array
				console.error(`[getUserPendingInvites] Error fetching pending invites: ${error.message}`);
				return { invites: [] };
			}
		}
	}

	/**
	 * Accepts a space invitation
	 * @param userId ID of the user accepting the invitation
	 * @param inviteId ID of the invitation to accept
	 * @param token JWT token for authorization
	 * @returns Success response
	 */
	async acceptSpaceInvite(userId: string, inviteId: string, token: string): Promise<any> {
		try {
			console.log(`[acceptSpaceInvite] User ${userId} accepting invite ${inviteId}`);

			if (!inviteId) {
				throw new BadRequestException('Invite ID is required');
			}

			// Call the spaces service to accept the invitation
			// Pass the userId explicitly since auth.uid() won't work with JWTs
			const response = await fetch(
				`${this.spacesService['spacesServiceUrl']}/spaces/invites/accept`,
				{
					method: 'POST',
					headers: {
						Authorization: `Bearer ${token}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						inviteId,
						userId, // Add the userId explicitly
					}),
				}
			);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				const errorMessage =
					errorData.message ||
					errorData.error ||
					`Error ${response.status}: ${response.statusText}`;

				if (response.status === 404) {
					throw new NotFoundException(`Invitation not found: ${errorMessage}`);
				} else if (response.status === 403) {
					throw new ForbiddenException(`Not authorized to accept this invitation: ${errorMessage}`);
				} else {
					throw new BadRequestException(`Failed to accept invitation: ${errorMessage}`);
				}
			}

			const data = await response.json();
			console.log(`[acceptSpaceInvite] Successfully accepted invite ${inviteId}`);

			// After successfully accepting the invite, sync the user to the space_members table
			if (data?.space?.id && data?.role) {
				try {
					await this.spaceSyncService.syncSpaceMembership(data.space.id, userId, data.role);
					console.log(
						`[acceptSpaceInvite] Synced user ${userId} as ${data.role} to space ${data.space.id}`
					);
				} catch (syncError) {
					// Log but don't fail if sync fails
					console.error(`[acceptSpaceInvite] Failed to sync space member: ${syncError.message}`);
				}
			}

			return data;
		} catch (error) {
			console.error(`[acceptSpaceInvite] Error accepting invite ${inviteId}:`, error);

			if (
				error instanceof NotFoundException ||
				error instanceof ForbiddenException ||
				error instanceof BadRequestException
			) {
				throw error;
			}

			throw new Error(`Failed to accept invitation: ${error.message}`);
		}
	}

	/**
	 * Declines a space invitation
	 * @param userId ID of the user declining the invitation
	 * @param inviteId ID of the invitation to decline
	 * @param token JWT token for authorization
	 * @returns Success response
	 */
	async declineSpaceInvite(userId: string, inviteId: string, token: string): Promise<any> {
		try {
			console.log(`[declineSpaceInvite] User ${userId} declining invite ${inviteId}`);

			if (!inviteId) {
				throw new BadRequestException('Invite ID is required');
			}

			// Call the spaces service to decline the invitation
			// Pass the userId explicitly since auth.uid() won't work with JWTs
			const response = await fetch(
				`${this.spacesService['spacesServiceUrl']}/spaces/invites/decline`,
				{
					method: 'POST',
					headers: {
						Authorization: `Bearer ${token}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						inviteId,
						userId, // Add the userId explicitly
					}),
				}
			);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				const errorMessage =
					errorData.message ||
					errorData.error ||
					`Error ${response.status}: ${response.statusText}`;

				if (response.status === 404) {
					throw new NotFoundException(`Invitation not found: ${errorMessage}`);
				} else if (response.status === 403) {
					throw new ForbiddenException(
						`Not authorized to decline this invitation: ${errorMessage}`
					);
				} else {
					throw new BadRequestException(`Failed to decline invitation: ${errorMessage}`);
				}
			}

			const data = await response.json();
			console.log(`[declineSpaceInvite] Successfully declined invite ${inviteId}`);
			return data;
		} catch (error) {
			console.error(`[declineSpaceInvite] Error declining invite ${inviteId}:`, error);

			if (
				error instanceof NotFoundException ||
				error instanceof ForbiddenException ||
				error instanceof BadRequestException
			) {
				throw error;
			}

			throw new Error(`Failed to decline invitation: ${error.message}`);
		}
	}

	/**
	 * Validates a memo for retry operations
	 * @param userId - User ID making the request
	 * @param memoId - Memo ID to validate
	 * @param token - Authentication token
	 * @returns Memo data if valid, null otherwise
	 */
	async validateMemoForRetry(userId: string, memoId: string, token: string): Promise<any> {
		try {
			console.log(`[validateMemoForRetry] Validating memo ${memoId} for user ${userId}`);

			// Create authenticated client
			const authClient = createClient(this.memoroUrl, this.memoroKey, {
				global: { headers: { Authorization: `Bearer ${token}` } },
			});

			// Get memo and verify ownership
			const { data: memo, error } = await authClient
				.from('memos')
				.select('id, user_id, metadata, source, title')
				.eq('id', memoId)
				.eq('user_id', userId)
				.single();

			if (error) {
				console.error(`[validateMemoForRetry] Error fetching memo ${memoId}:`, error);
				return null;
			}

			if (!memo) {
				console.warn(
					`[validateMemoForRetry] Memo ${memoId} not found or access denied for user ${userId}`
				);
				return null;
			}

			console.log(`[validateMemoForRetry] Memo ${memoId} validated for user ${userId}`);
			return memo;
		} catch (error) {
			console.error(`[validateMemoForRetry] Error validating memo ${memoId}:`, error);
			return null;
		}
	}

	/**
	 * Retries transcription for a failed memo
	 * @param userId - User ID making the request
	 * @param memoId - Memo ID to retry
	 * @param token - Authentication token
	 * @param retryAttempt - Current retry attempt number
	 */
	async retryTranscription(
		userId: string,
		memoId: string,
		token: string,
		retryAttempt: number
	): Promise<any> {
		try {
			console.log(
				`[retryTranscription] Retrying transcription for memo ${memoId}, attempt ${retryAttempt}`
			);

			// Get memo to extract audio path and space ID
			const memo = await this.validateMemoForRetry(userId, memoId, token);
			if (!memo) {
				throw new NotFoundException('Memo not found');
			}

			const audioPath = memo.source?.audio_path || memo.source?.path;
			const spaceId = memo.metadata?.spaceId; // If memo was associated with space

			if (!audioPath) {
				throw new BadRequestException('No audio path found in memo');
			}

			// Update retry attempt in metadata first
			const authClient = createClient(this.memoroUrl, this.memoroKey, {
				global: { headers: { Authorization: `Bearer ${token}` } },
			});

			const updatedMetadata = {
				...memo.metadata,
				processing: {
					...memo.metadata?.processing,
					transcription: {
						...memo.metadata?.processing?.transcription,
						status: 'processing',
						retryAttempts: retryAttempt,
						lastRetryAt: new Date().toISOString(),
					},
				},
			};

			await authClient.from('memos').update({ metadata: updatedMetadata }).eq('id', memoId);

			// Call transcribe Edge Function (normal processing, will charge credits if successful)
			const SUPABASE_URL = this.memoroUrl;
			const response = await fetch(`${SUPABASE_URL}/functions/v1/transcribe`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					audioPath,
					memoId,
					spaceId,
				}),
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error(`[retryTranscription] Edge Function error:`, errorText);
				throw new BadRequestException(`Transcription retry failed: ${errorText}`);
			}

			console.log(`[retryTranscription] Successfully initiated retry for memo ${memoId}`);
			return { success: true };
		} catch (error) {
			console.error(`[retryTranscription] Error retrying transcription for memo ${memoId}:`, error);
			throw error;
		}
	}

	/**
	 * Retries headline generation for a failed memo
	 * @param userId - User ID making the request
	 * @param memoId - Memo ID to retry
	 * @param token - Authentication token
	 * @param retryAttempt - Current retry attempt number
	 */
	async retryHeadline(
		userId: string,
		memoId: string,
		token: string,
		retryAttempt: number
	): Promise<any> {
		try {
			console.log(
				`[retryHeadline] Retrying headline generation for memo ${memoId}, attempt ${retryAttempt}`
			);

			// Validate memo ownership
			const memo = await this.validateMemoForRetry(userId, memoId, token);
			if (!memo) {
				throw new NotFoundException('Memo not found');
			}

			// Check if memo has transcript (now in separate column)
			if (!memo.transcript && !memo.source?.transcript && !memo.source?.transcription) {
				throw new BadRequestException('No transcript found in memo for headline generation');
			}

			// Update retry attempt in metadata first
			const authClient = createClient(this.memoroUrl, this.memoroKey, {
				global: { headers: { Authorization: `Bearer ${token}` } },
			});

			const updatedMetadata = {
				...memo.metadata,
				processing: {
					...memo.metadata?.processing,
					headline_and_intro: {
						...memo.metadata?.processing?.headline_and_intro,
						status: 'processing',
						retryAttempts: retryAttempt,
						lastRetryAt: new Date().toISOString(),
					},
				},
			};

			await authClient.from('memos').update({ metadata: updatedMetadata }).eq('id', memoId);

			// Generate headline via internal AI service (replaces Edge Function call)
			const result = await this.headlineService.processHeadlineForMemo(memoId);

			console.log(
				`[retryHeadline] Successfully generated headline for memo ${memoId}: "${result.headline}"`
			);
			return { success: true };
		} catch (error) {
			console.error(
				`[retryHeadline] Error retrying headline generation for memo ${memoId}:`,
				error
			);
			throw error;
		}
	}

	/**
	 * Upload audio file to storage and create memo (without processing)
	 * This method only handles file upload and memo creation for the new upload flow.
	 *
	 * @param userId - User ID
	 * @param file - Audio file from multer
	 * @param duration - Audio duration in seconds
	 * @param spaceId - Optional space ID to associate with memo
	 * @param blueprintId - Optional blueprint ID
	 * @param memoId - Optional existing memo ID to update
	 * @param token - Authentication token
	 * @returns Object with memo ID and audio path
	 */
	async uploadAudioToStorage(
		userId: string,
		file: Express.Multer.File,
		duration: number,
		spaceId?: string,
		blueprintId?: string | null,
		memoId?: string,
		token?: string
	): Promise<{
		memoId: string;
		audioPath: string;
	}> {
		try {
			console.log(
				`[uploadAudioToStorage] Uploading audio for user ${userId}, duration: ${duration}s, filename: ${file.originalname}`
			);

			// Create authenticated client
			const authClient = createClient(this.memoroUrl, this.memoroKey, {
				global: { headers: { Authorization: `Bearer ${token}` } },
			});

			// Upload the audio file to Supabase Storage
			console.log(`[uploadAudioToStorage] Uploading audio file to storage...`);

			// Create unique file path with memoId folder structure
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
			const fileExtension =
				file.originalname?.split('.').pop() || file.mimetype?.split('/')[1] || 'm4a';
			const uniqueFilename = `audio_${timestamp}.${fileExtension}`;

			// Generate a memo ID for the path if not provided
			const pathMemoId = memoId || randomUUID();
			const audioPath = `${userId}/${pathMemoId}/${uniqueFilename}`;

			try {
				// Upload to Supabase Storage using the file buffer
				console.log(`[uploadAudioToStorage] Uploading to bucket: user-uploads, path: ${audioPath}`);
				console.log(`[uploadAudioToStorage] File buffer size: ${file.buffer.length} bytes`);
				console.log(
					`[uploadAudioToStorage] Content type: ${file.mimetype || `audio/${fileExtension}`}`
				);

				// Test bucket access first
				const { data: buckets, error: listError } = await authClient.storage.listBuckets();
				console.log(
					`[uploadAudioToStorage] Available buckets:`,
					buckets?.map((b) => b.name) || 'none'
				);
				if (listError) console.log(`[uploadAudioToStorage] Bucket list error:`, listError);

				const { data: uploadData, error: uploadError } = await authClient.storage
					.from('user-uploads')
					.upload(audioPath, file.buffer, {
						contentType: file.mimetype || `audio/${fileExtension}`,
						cacheControl: '3600',
						upsert: false,
					});

				if (uploadError) {
					console.error(`[uploadAudioToStorage] Upload error details:`, uploadError);
					throw new Error(`Upload failed: ${uploadError.message}`);
				}

				console.log(`[uploadAudioToStorage] File uploaded successfully: ${uploadData.path}`);
				console.log(`[uploadAudioToStorage] Upload response:`, uploadData);
			} catch (uploadError) {
				console.error(`[uploadAudioToStorage] Upload failed:`, uploadError);
				throw new BadRequestException(`Failed to upload audio file: ${uploadError.message}`);
			}

			// Create or update memo
			const currentTimestamp = new Date().toISOString();

			const sourceData = {
				type: 'audio',
				audio_path: audioPath,
				format: fileExtension,
				duration: duration,
				original_filename: file.originalname,
			};

			const metadata = {
				processing: {
					transcription: {
						status: 'pending',
						timestamp: currentTimestamp,
					},
				},
				blueprint_id: blueprintId || null,
				spaceId: spaceId || null,
			};

			let finalMemoId: string;

			if (memoId) {
				// Update existing memo
				console.log(`[uploadAudioToStorage] Updating existing memo ${memoId}...`);
				const { error: updateError } = await authClient
					.from('memos')
					.update({
						source: sourceData,
						updated_at: currentTimestamp,
						metadata,
					})
					.eq('id', memoId)
					.eq('user_id', userId);

				if (updateError) {
					throw new Error(`Failed to update memo: ${updateError.message}`);
				}

				finalMemoId = memoId;
				console.log(`[uploadAudioToStorage] Updated memo with ID: ${memoId}`);
			} else {
				// Create new memo with pre-generated ID
				console.log(`[uploadAudioToStorage] Creating new memo with ID: ${pathMemoId}...`);
				const { error: createError } = await authClient.from('memos').insert({
					id: pathMemoId,
					user_id: userId,
					source: sourceData,
					is_pinned: false,
					is_archived: false,
					is_public: false,
					created_at: currentTimestamp,
					updated_at: currentTimestamp,
					metadata,
				});

				if (createError) {
					throw new Error(`Failed to create memo: ${createError.message}`);
				}

				finalMemoId = pathMemoId;
				console.log(`[uploadAudioToStorage] Created memo with ID: ${finalMemoId}`);
			}

			// Link memo to space if spaceId provided
			if (spaceId && !memoId) {
				// Only link if it's a new memo
				try {
					console.log(`[uploadAudioToStorage] Linking memo ${finalMemoId} to space ${spaceId}`);
					const { error: linkError } = await authClient.from('memo_spaces').insert({
						memo_id: finalMemoId,
						space_id: spaceId,
						created_at: currentTimestamp,
					});

					if (linkError) {
						console.error(
							`[uploadAudioToStorage] Failed to link memo to space: ${linkError.message}`
						);
						// Don't fail the entire process for space linking errors
					}
				} catch (linkError) {
					console.error(`[uploadAudioToStorage] Error linking memo to space:`, linkError);
				}
			}

			return {
				memoId: finalMemoId,
				audioPath,
			};
		} catch (error) {
			console.error(`[uploadAudioToStorage] Error uploading audio to storage:`, error);
			if (error instanceof BadRequestException) {
				throw error;
			}
			throw new BadRequestException(`Failed to upload audio: ${error.message}`);
		}
	}

	/**
	 * Enhanced routing constants
	 */
	private readonly FAST_TIME_LIMIT = 115 * 60; // 115 minutes in seconds
	private readonly FAST_SIZE_LIMIT = 300 * 1024 * 1024; // 300MB in bytes
	private readonly COST_PER_MINUTE = 2; // 2 mana per minute

	/**
	 * Determines transcription route and validates credits
	 */
	private async determineTranscriptionRoute(
		duration: number,
		fileSize: number,
		userId: string,
		spaceId?: string,
		token?: string
	): Promise<{ route: 'fast' | 'batch'; cost: number }> {
		// Calculate cost upfront (round up to nearest minute)
		const estimatedCost = Math.ceil(duration / 60) * this.COST_PER_MINUTE;

		console.log(
			`[determineTranscriptionRoute] Duration: ${duration}s (${Math.ceil(duration / 60)}min), Size: ${Math.round(fileSize / 1024 / 1024)}MB, Cost: ${estimatedCost} mana`
		);

		// Pre-validate credits before any processing
		try {
			const creditValidationUrl = this.configService.get<string>('MANA_SERVICE_URL');

			if (!creditValidationUrl) {
				console.error('[CRITICAL ERROR] MANA_SERVICE_URL is not configured');
				throw new Error('Missing required configuration: MANA_SERVICE_URL');
			}

			const creditCheckBody = {
				userId,
				amount: estimatedCost,
				spaceId: spaceId || null,
				operation: 'transcription',
				durationMinutes: Math.ceil(duration / 60),
			};

			console.log(`[determineTranscriptionRoute] Validating credits:`, creditCheckBody);

			const creditResponse = await fetch(`${creditValidationUrl}/credits/validate`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(creditCheckBody),
			});

			if (!creditResponse.ok) {
				const errorText = await creditResponse.text();
				console.error(
					`[determineTranscriptionRoute] Credit validation failed: ${creditResponse.status} - ${errorText}`
				);
				// Try to extract available credits from error text
				const availableMatch = errorText.match(/Available:\s*(\d+)/);
				const availableCredits = availableMatch ? parseInt(availableMatch[1]) : 0;

				throw new InsufficientCreditsException({
					requiredCredits: estimatedCost,
					availableCredits,
					creditType: spaceId ? 'space' : 'user',
					operation: 'transcription',
					spaceId,
				});
			}

			const creditResult = await creditResponse.json();
			console.log(`[determineTranscriptionRoute] Credit validation successful:`, creditResult);
		} catch (error) {
			if (error instanceof BadRequestException) throw error;
			console.error(`[determineTranscriptionRoute] Credit validation error:`, error);
			throw new BadRequestException(`Credit validation failed: ${error.message}`);
		}

		// Determine route based on dual limits
		if (duration <= this.FAST_TIME_LIMIT && fileSize <= this.FAST_SIZE_LIMIT) {
			console.log(
				`[determineTranscriptionRoute] Using FAST route: duration ${duration}s <= ${this.FAST_TIME_LIMIT}s AND size ${fileSize} <= ${this.FAST_SIZE_LIMIT}`
			);
			return { route: 'fast', cost: estimatedCost };
		} else {
			console.log(
				`[determineTranscriptionRoute] Using BATCH route: duration ${duration}s > ${this.FAST_TIME_LIMIT}s OR size ${fileSize} > ${this.FAST_SIZE_LIMIT}`
			);
			return { route: 'batch', cost: estimatedCost };
		}
	}

	/**
	 * Uploads audio to storage, creates memo in processing state, and routes to appropriate transcription service
	 * @param userId - User ID making the request
	 * @param file - Uploaded file from multer
	 * @param duration - Audio duration in seconds
	 * @param spaceId - Optional space ID to associate with memo
	 * @param blueprintId - Optional blueprint ID
	 * @param recordingLanguages - Optional array of recording languages
	 * @param token - Authentication token
	 * @returns Object with memo ID, file path and processing route information
	 */
	async uploadAndProcessAudio(
		userId: string,
		file: Express.Multer.File,
		duration: number,
		spaceId?: string,
		blueprintId?: string | null,
		recordingLanguages?: string[],
		token?: string
	): Promise<{
		memoId: string;
		filePath: string;
		processingRoute: 'fast' | 'batch';
		message: string;
		estimatedCost: number;
	}> {
		try {
			console.log(
				`[uploadAndProcessAudio] Processing audio for user ${userId}, duration: ${duration}s, size: ${file.buffer.length} bytes, filename: ${file.originalname}`
			);

			// 1. Determine transcription route and validate credits FIRST
			const { route, cost } = await this.determineTranscriptionRoute(
				duration,
				file.buffer.length,
				userId,
				spaceId,
				token
			);

			console.log(
				`[uploadAndProcessAudio] Route determined: ${route}, estimated cost: ${cost} mana`
			);

			// Create authenticated client
			const authClient = createClient(this.memoroUrl, this.memoroKey, {
				global: { headers: { Authorization: `Bearer ${token}` } },
			});

			// Upload the audio file to Supabase Storage
			console.log(`[uploadAndProcessAudio] Uploading audio file to storage...`);

			// Create unique file path with memoId folder structure
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
			const fileExtension =
				file.originalname?.split('.').pop() || file.mimetype?.split('/')[1] || 'm4a';
			const uniqueFilename = `audio_${timestamp}.${fileExtension}`;

			// Generate a memo ID for the path
			const generatedMemoId = randomUUID();
			const audioPath = `${userId}/${generatedMemoId}/${uniqueFilename}`;

			try {
				// Upload to Supabase Storage using the file buffer
				console.log(
					`[uploadAndProcessAudio] Uploading to bucket: user-uploads, path: ${audioPath}`
				);
				console.log(`[uploadAndProcessAudio] File buffer size: ${file.buffer.length} bytes`);
				console.log(
					`[uploadAndProcessAudio] Content type: ${file.mimetype || `audio/${fileExtension}`}`
				);

				const { data: uploadData, error: uploadError } = await authClient.storage
					.from('user-uploads')
					.upload(audioPath, file.buffer, {
						contentType: file.mimetype || `audio/${fileExtension}`,
						cacheControl: '3600',
						upsert: false,
					});

				if (uploadError) {
					throw new Error(`Upload failed: ${uploadError.message}`);
				}

				console.log(`[uploadAndProcessAudio] File uploaded successfully: ${uploadData.path}`);
			} catch (uploadError) {
				console.error(`[uploadAndProcessAudio] Upload failed:`, uploadError);
				throw new BadRequestException(`Failed to upload audio file: ${uploadError.message}`);
			}

			// Create memo in processing state
			const currentTimestamp = new Date().toISOString();

			const sourceData = {
				type: 'audio',
				audio_path: audioPath,
				format: fileExtension,
				duration: duration,
				original_filename: file.originalname,
			};

			const metadata = {
				processing: {
					transcription: {
						status: 'processing',
						timestamp: currentTimestamp,
					},
				},
				blueprintId: blueprintId || null,
				spaceId: spaceId || null,
				recordingLanguages: recordingLanguages || null,
			};

			console.log(`[processAudioForTranscription] Creating memo with ID: ${generatedMemoId}...`);
			const { error: createError } = await authClient.from('memos').insert({
				id: generatedMemoId,
				user_id: userId,
				source: sourceData,
				is_pinned: false,
				is_archived: false,
				is_public: false,
				created_at: currentTimestamp,
				updated_at: currentTimestamp,
				metadata,
			});

			if (createError) {
				throw new Error(`Failed to create memo: ${createError.message}`);
			}

			const memoId = generatedMemoId;
			console.log(`[processAudioForTranscription] Created memo with ID: ${memoId}`);

			// Link memo to space if spaceId provided
			if (spaceId) {
				try {
					console.log(`[processAudioForTranscription] Linking memo ${memoId} to space ${spaceId}`);
					const { error: linkError } = await authClient.from('memo_spaces').insert({
						memo_id: memoId,
						space_id: spaceId,
						created_at: currentTimestamp,
					});

					if (linkError) {
						console.error(
							`[processAudioForTranscription] Failed to link memo to space: ${linkError.message}`
						);
						// Don't fail the entire process for space linking errors
					}
				} catch (linkError) {
					console.error(`[processAudioForTranscription] Error linking memo to space:`, linkError);
				}
			}

			// Route to appropriate transcription service using new architecture
			const audioServiceUrl =
				this.configService.get<string>('AUDIO_MICROSERVICE_URL') ||
				'https://audio-microservice-624477741877.europe-west3.run.app';

			console.log(`[uploadAndProcessAudio] Routing to ${route} transcription service...`);

			if (route === 'fast') {
				// Route to audio microservice fast transcription
				console.log(`[uploadAndProcessAudio] Calling audio microservice fast transcription...`);

				const requestBody = {
					audioPath,
					memoId,
					userId,
					spaceId,
					recordingLanguages:
						recordingLanguages && recordingLanguages.length > 0 ? recordingLanguages : undefined,
				};

				try {
					const response = await fetch(`${audioServiceUrl}/audio/transcribe-realtime`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${token}`,
						},
						body: JSON.stringify(requestBody),
					});

					if (!response.ok) {
						const errorText = await response.text();
						console.error(`[uploadAndProcessAudio] Fast transcription service error:`, errorText);

						// Update memo status to error
						await this.updateMemoProcessingStatus(authClient, memoId, 'transcription', 'error', {
							reason: `Fast transcription failed: ${errorText}`,
							route: 'fast',
							estimatedCost: cost,
						});

						throw new BadRequestException(`Fast transcription failed: ${errorText}`);
					} else {
						console.log(`[uploadAndProcessAudio] Fast transcription service called successfully`);
					}
				} catch (transcribeError) {
					console.error(
						`[uploadAndProcessAudio] Error calling fast transcription:`,
						transcribeError
					);

					// Update memo status to error
					await this.updateMemoProcessingStatus(authClient, memoId, 'transcription', 'error', {
						reason: `Fast transcription error: ${transcribeError.message}`,
						route: 'fast',
						estimatedCost: cost,
					});

					throw transcribeError;
				}
			} else {
				// Route to audio microservice batch transcription
				console.log(`[uploadAndProcessAudio] Calling audio microservice batch transcription...`);

				try {
					const batchRequestBody = {
						audioPath,
						memoId,
						userId,
						spaceId,
						recordingLanguages,
					};

					const response = await fetch(`${audioServiceUrl}/audio/transcribe-from-storage`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${token}`,
						},
						body: JSON.stringify(batchRequestBody),
					});

					if (!response.ok) {
						const errorText = await response.text();
						console.error(`[uploadAndProcessAudio] Batch transcription service error:`, errorText);

						// Update memo status to error
						await this.updateMemoProcessingStatus(authClient, memoId, 'transcription', 'error', {
							reason: `Batch transcription failed: ${errorText}`,
							route: 'batch',
							estimatedCost: cost,
						});

						throw new BadRequestException(`Batch transcription failed: ${errorText}`);
					} else {
						// Parse response to get jobId
						const batchResponse = await response.json();
						const jobId = batchResponse.jobId;

						if (jobId) {
							console.log(
								`[uploadAndProcessAudio] Batch transcription started with jobId: ${jobId}`
							);

							// Update memo with jobId and processing status
							await this.updateMemoProcessingStatus(
								authClient,
								memoId,
								'transcription',
								'processing',
								{
									jobId,
									route: 'batch',
									batchTranscription: true,
									estimatedCost: cost,
								}
							);
						} else {
							console.warn(
								`[uploadAndProcessAudio] Batch service response missing jobId:`,
								batchResponse
							);

							await this.updateMemoProcessingStatus(authClient, memoId, 'transcription', 'error', {
								reason: 'Batch service response missing jobId',
								route: 'batch',
								estimatedCost: cost,
							});
						}
					}
				} catch (batchError) {
					console.error(`[uploadAndProcessAudio] Error calling batch transcription:`, batchError);

					// Update memo status to error
					await this.updateMemoProcessingStatus(authClient, memoId, 'transcription', 'error', {
						reason: `Batch transcription error: ${batchError.message}`,
						route: 'batch',
						estimatedCost: cost,
					});

					throw batchError;
				}
			}

			return {
				memoId,
				filePath: audioPath,
				processingRoute: route,
				message: `Audio uploaded and ${route} transcription initiated`,
				estimatedCost: cost,
			};
		} catch (error) {
			console.error(`[uploadAndProcessAudio] Error uploading and processing audio:`, error);
			throw error;
		}
	}

	/**
	 * Updates memo processing status in metadata
	 */
	private async updateMemoProcessingStatus(
		client: any,
		memoId: string,
		processName: string,
		status: 'processing' | 'completed' | 'completed_no_transcript' | 'error',
		details?: any
	): Promise<void> {
		try {
			const timestamp = new Date().toISOString();

			// Get current metadata
			const { data: currentMemo, error: fetchError } = await client
				.from('memos')
				.select('metadata')
				.eq('id', memoId)
				.single();

			if (fetchError) {
				console.error(`Error fetching memo metadata: ${fetchError.message}`);
				return;
			}

			const currentMetadata = currentMemo?.metadata || {};
			const newMetadata = {
				...currentMetadata,
				processing: {
					...(currentMetadata.processing || {}),
					[processName]: {
						status,
						timestamp,
						...details,
					},
				},
			};

			const { error: updateError } = await client
				.from('memos')
				.update({ metadata: newMetadata })
				.eq('id', memoId);

			if (updateError) {
				console.error(`Error updating memo processing status: ${updateError.message}`);
			} else {
				console.log(`Updated memo ${memoId} ${processName} status to ${status}`);
			}
		} catch (error) {
			console.error(`Error in updateMemoProcessingStatus:`, error);
		}
	}

	/**
	 * Updates memo with batch transcription jobId
	 */
	async updateMemoWithJobId(
		memoId: string,
		jobId: string,
		token: string,
		userSelectedLanguages?: string[]
	): Promise<void> {
		try {
			const authClient = createClient(this.memoroUrl, this.memoroServiceKey, {
				global: { headers: { Authorization: `Bearer ${token}` } },
			});

			// Get current metadata
			const { data: currentMemo, error: fetchError } = await authClient
				.from('memos')
				.select('metadata')
				.eq('id', memoId)
				.single();

			if (fetchError) {
				console.error(`Error fetching memo for jobId update: ${fetchError.message}`);
				return;
			}

			const currentMetadata = currentMemo?.metadata || {};
			const newMetadata = {
				...currentMetadata,
				processing: {
					...(currentMetadata.processing || {}),
					transcription: {
						...(currentMetadata.processing?.transcription || {}),
						jobId,
						status: 'processing',
						timestamp: new Date().toISOString(),
						route: 'batch',
						batchTranscription: true,
						userSelectedLanguages: userSelectedLanguages || [],
					},
				},
			};

			const { error: updateError } = await authClient
				.from('memos')
				.update({ metadata: newMetadata })
				.eq('id', memoId);

			if (updateError) {
				console.error(`Error updating memo with jobId: ${updateError.message}`);
			} else {
				console.log(`Successfully updated memo ${memoId} with jobId ${jobId}`);
			}
		} catch (error) {
			console.error(`Error in updateMemoWithJobId:`, error);
		}
	}

	/**
	 * Update memo transcription status in metadata
	 */
	async updateMemoTranscriptionStatus(
		memoId: string,
		status: 'pending' | 'processing' | 'completed' | 'completed_no_transcript' | 'failed',
		token: string,
		additionalData?: any
	): Promise<void> {
		try {
			const authClient = createClient(this.memoroUrl, this.memoroServiceKey, {
				global: { headers: { Authorization: `Bearer ${token}` } },
			});

			// Get current metadata
			const { data: currentMemo, error: fetchError } = await authClient
				.from('memos')
				.select('metadata')
				.eq('id', memoId)
				.single();

			if (fetchError) {
				console.error(`Error fetching memo for status update: ${fetchError.message}`);
				return;
			}

			const currentMetadata = currentMemo?.metadata || {};
			const newMetadata = {
				...currentMetadata,
				transcription_status: status,
				transcription_updated_at: new Date().toISOString(),
				...(additionalData && { transcription_data: additionalData }),
			};

			const { error: updateError } = await authClient
				.from('memos')
				.update({ metadata: newMetadata })
				.eq('id', memoId);

			if (updateError) {
				console.error(`Error updating memo transcription status: ${updateError.message}`);
			} else {
				console.log(`Successfully updated memo ${memoId} transcription status to ${status}`);
			}
		} catch (error) {
			console.error(`Error in updateMemoTranscriptionStatus:`, error);
		}
	}

	/**
	 * Updates batch transcription metadata using memo ID (simpler and more reliable)
	 */
	async updateBatchMetadataByMemoId(
		memoId: string,
		jobId: string,
		batchTranscription: boolean,
		token: string,
		userSelectedLanguages?: string[],
		userId?: string
	): Promise<{ success: boolean; memoId?: string; jobId?: string; message: string }> {
		try {
			// When using service auth (token is null), we need to validate ownership
			const isServiceAuth = !token;

			// Use service role client for this operation
			const serviceClient = isServiceAuth
				? createClient(this.memoroUrl, this.memoroServiceKey)
				: createClient(this.memoroUrl, this.memoroServiceKey, {
						global: { headers: { Authorization: `Bearer ${token}` } },
					});

			// Get current metadata by memo ID directly
			const { data: memo, error: fetchError } = await serviceClient
				.from('memos')
				.select('id, metadata, user_id')
				.eq('id', memoId)
				.single();

			if (fetchError) {
				throw new Error(`Failed to find memo: ${fetchError.message}`);
			}

			if (!memo) {
				throw new Error(`No memo found with ID ${memoId}`);
			}

			// Validate ownership when using service auth
			if (isServiceAuth && userId && memo.user_id !== userId) {
				console.error(
					`[updateBatchMetadataByMemoId] Ownership validation failed: memo user_id=${memo.user_id}, provided userId=${userId}`
				);
				throw new Error(`Unauthorized: User ${userId} does not own memo ${memoId}`);
			}

			// Update metadata with batch job information
			const currentMetadata = memo.metadata || {};
			const updatedMetadata = {
				...currentMetadata,
				processing: {
					...(currentMetadata.processing || {}),
					transcription: {
						...(currentMetadata.processing?.transcription || {}),
						jobId,
						batchTranscription,
						batchJobCreated: new Date().toISOString(),
						status: 'processing',
						userSelectedLanguages: userSelectedLanguages || [],
					},
				},
			};

			const { error: updateError } = await serviceClient
				.from('memos')
				.update({
					metadata: updatedMetadata,
					updated_at: new Date().toISOString(),
				})
				.eq('id', memoId);

			if (updateError) {
				throw new Error(`Failed to update memo metadata: ${updateError.message}`);
			}

			console.log(`Updated batch metadata for memo ${memoId}, jobId: ${jobId}`);

			return {
				success: true,
				memoId,
				jobId,
				message: 'Batch metadata updated successfully',
			};
		} catch (error) {
			console.error('Error updating batch metadata by memo ID:', error);
			throw new Error(`Failed to update batch metadata: ${error.message}`);
		}
	}

	/**
	 * Get memo for reprocessing - validates ownership and gets space association
	 * @param userId - User ID making the request
	 * @param memoId - Memo ID to reprocess
	 * @param token - Authentication token
	 * @returns Memo data with space information if valid, null otherwise
	 */
	async getMemoForReprocessing(userId: string, memoId: string, token: string): Promise<any> {
		try {
			console.log(
				`[getMemoForReprocessing] Getting memo ${memoId} for reprocessing by user ${userId}`
			);

			// Create authenticated client
			const authClient = createClient(this.memoroUrl, this.memoroKey, {
				global: { headers: { Authorization: `Bearer ${token}` } },
			});

			// First try to get memo directly if owned by user
			const { data: memo, error: memoError } = await authClient
				.from('memos')
				.select(
					`
          id, 
          user_id, 
          metadata, 
          source, 
          title,
          created_at,
          memo_spaces(space_id)
        `
				)
				.eq('id', memoId)
				.eq('user_id', userId)
				.maybeSingle();

			if (!memoError && memo) {
				// Extract space_id from the joined result
				const spaceId = memo.memo_spaces?.[0]?.space_id || null;
				console.log(
					`[getMemoForReprocessing] Found memo ${memoId} owned by user, space: ${spaceId}`
				);
				return { ...memo, space_id: spaceId };
			}

			// If not directly owned, check if user has access through a space
			const { data: spaceMemo, error: spaceError } = await authClient
				.from('memo_spaces')
				.select(
					`
          space_id,
          memos!inner(
            id,
            user_id,
            metadata,
            source,
            title,
            created_at
          ),
          memoro_spaces!inner(
            id,
            memoro_space_members!inner(
              user_id,
              role
            )
          )
        `
				)
				.eq('memo_id', memoId)
				.eq('memoro_spaces.memoro_space_members.user_id', userId)
				.maybeSingle();

			if (!spaceError && spaceMemo) {
				const memoData = spaceMemo.memos;
				console.log(
					`[getMemoForReprocessing] Found memo ${memoId} through space ${spaceMemo.space_id}`
				);
				return { ...memoData, space_id: spaceMemo.space_id };
			}

			console.warn(
				`[getMemoForReprocessing] Memo ${memoId} not found or access denied for user ${userId}`
			);
			return null;
		} catch (error) {
			console.error(`[getMemoForReprocessing] Error getting memo ${memoId}:`, error);
			return null;
		}
	}

	/**
	 * Creates memo from pre-uploaded file (direct upload scenario)
	 */
	async createMemoFromUploadedFile(
		userId: string,
		filePath: string,
		duration: number,
		spaceId?: string,
		blueprintId?: string,
		memoId?: string,
		token?: string,
		recordingStartedAt?: string,
		location?: any,
		mediaType?: 'audio' | 'video',
		videoMetadata?: any
	): Promise<{ memoId: string; audioPath: string; memo: any }> {
		try {
			const authClient = createClient(this.memoroUrl, this.memoroServiceKey, {
				global: { headers: { Authorization: `Bearer ${token}` } },
			});

			const generatedMemoId = memoId || uuidv4();
			const currentTimestamp = new Date().toISOString();

			// Use recording start time if provided, otherwise use current time
			const createdAtTimestamp = recordingStartedAt || currentTimestamp;

			console.log(
				`[createMemoFromUploadedFile] Creating/updating memo ${generatedMemoId} for pre-uploaded ${mediaType || 'audio'} file: ${filePath}`
			);
			if (recordingStartedAt) {
				console.log(
					`[createMemoFromUploadedFile] Using provided recording start time: ${recordingStartedAt}`
				);
			}
			if (mediaType === 'video' && videoMetadata) {
				console.log(
					`[createMemoFromUploadedFile] Video details: ${videoMetadata.width}x${videoMetadata.height}, ${videoMetadata.fps}fps, codec: ${videoMetadata.videoCodec}`
				);
			}

			// Create or update memo record using UPSERT pattern
			const memoData: any = {
				id: generatedMemoId,
				user_id: userId,
				source: {
					audio_path: filePath,
					file_path: filePath, // Also store as file_path for clarity
					duration: duration,
					media_type: mediaType || 'audio',
					...(mediaType === 'video' &&
						videoMetadata && {
							video_metadata: {
								width: videoMetadata.width,
								height: videoMetadata.height,
								fps: videoMetadata.fps,
								video_codec: videoMetadata.videoCodec,
								audio_codec: videoMetadata.audioCodec,
								audio_channels: videoMetadata.audioChannels,
								audio_sample_rate: videoMetadata.audioSampleRate,
								file_size: videoMetadata.fileSize,
								bitrate: videoMetadata.bitrate,
								has_audio_track: videoMetadata.hasAudioTrack,
							},
						}),
				},
				metadata: {
					processing: {
						transcription: {
							status: 'pending',
							timestamp: currentTimestamp,
							route: duration > 6900 ? 'batch' : 'fast', // 1h55m threshold
							media_type: mediaType || 'audio',
						},
					},
					upload: {
						method: 'direct_upload',
						timestamp: currentTimestamp,
						media_type: mediaType || 'audio',
					},
					// Store the blueprint_id to control which blueprint processing runs
					blueprint_id: blueprintId || null,
					// Store the recording start time in metadata for frontend use
					...(recordingStartedAt && { recordingStartedAt }),
					// Store address information in metadata if available
					...(location?.address && { address: location.address }),
				},
				created_at: createdAtTimestamp,
				updated_at: currentTimestamp,
			};

			// Add location coordinates to PostGIS column if provided
			if (location && location.latitude && location.longitude) {
				// Use SRID 4326 (WGS84) for GPS coordinates
				memoData.location = `POINT(${location.longitude} ${location.latitude})`;
			}

			const { error: upsertError } = await authClient.from('memos').upsert(memoData, {
				onConflict: 'id',
				ignoreDuplicates: false,
			});

			if (upsertError) {
				throw new Error(`Failed to create memo: ${upsertError.message}`);
			}

			// Link memo to space if spaceId provided (using upsert to handle retries)
			if (spaceId) {
				try {
					console.log(
						`[createMemoFromUploadedFile] Linking memo ${generatedMemoId} to space ${spaceId}`
					);
					const { error: linkError } = await authClient.from('memo_spaces').upsert(
						{
							memo_id: generatedMemoId,
							space_id: spaceId,
							created_at: createdAtTimestamp,
						},
						{
							onConflict: 'memo_id,space_id',
							ignoreDuplicates: true, // Skip if link already exists
						}
					);

					if (linkError) {
						console.error(
							`[createMemoFromUploadedFile] Failed to link memo to space: ${linkError.message}`
						);
					}
				} catch (linkError) {
					console.error(`[createMemoFromUploadedFile] Error linking memo to space:`, linkError);
				}
			}

			console.log(
				`[createMemoFromUploadedFile] Successfully created/updated memo ${generatedMemoId}`
			);

			// Fetch and return the complete memo object so the client has immediate access to all state
			const { data: createdMemo, error: fetchError } = await authClient
				.from('memos')
				.select('*')
				.eq('id', generatedMemoId)
				.single();

			if (fetchError) {
				console.error(`[createMemoFromUploadedFile] Failed to fetch created memo:`, fetchError);
				// Still return basic info if fetch fails
				return {
					memoId: generatedMemoId,
					audioPath: filePath,
					memo: null,
				};
			}

			return {
				memo: createdMemo,
				memoId: generatedMemoId,
				audioPath: filePath,
			};
		} catch (error) {
			console.error(`[createMemoFromUploadedFile] Error:`, error);
			throw error;
		}
	}

	/**
	 * Handles transcription completion callback from audio microservice
	 */
	async handleTranscriptionCompleted(
		memoId: string,
		userId: string,
		transcriptionResult?: any,
		route?: 'fast' | 'batch',
		success?: boolean,
		error?: string,
		token?: string
	): Promise<{ success: boolean; message: string }> {
		try {
			console.log(
				`[handleTranscriptionCompleted] Processing callback for memo ${memoId}, success: ${success}, route: ${route}`
			);

			if (transcriptionResult) {
				console.log(
					`[handleTranscriptionCompleted] DEBUG - Text length: ${transcriptionResult.text?.length || 0}`
				);
			} else {
				console.log(`[handleTranscriptionCompleted] DEBUG - transcriptionResult is null/undefined`);
			}

			// When using service auth (token is null), we need to validate ownership
			const isServiceAuth = !token;

			// Create client with appropriate auth
			const authClient = isServiceAuth
				? createClient(this.memoroUrl, this.memoroServiceKey)
				: createClient(this.memoroUrl, this.memoroServiceKey, {
						global: { headers: { Authorization: `Bearer ${token}` } },
					});

			if (success && transcriptionResult) {
				// 1. Update memo with transcription results
				console.log(
					`[handleTranscriptionCompleted] Updating memo ${memoId} with transcription results`
				);

				// Get current memo metadata to preserve existing data
				const { data: currentMemo, error: fetchError } = await authClient
					.from('memos')
					.select('metadata, source, user_id')
					.eq('id', memoId)
					.single();

				if (fetchError) {
					console.error(`[handleTranscriptionCompleted] Error fetching memo:`, fetchError);
					throw new Error(`Failed to fetch memo: ${fetchError.message}`);
				}

				// Validate ownership when using service auth
				if (isServiceAuth && currentMemo?.user_id !== userId) {
					console.error(
						`[handleTranscriptionCompleted] Ownership validation failed: memo user_id=${currentMemo?.user_id}, provided userId=${userId}`
					);
					throw new Error(`Unauthorized: User ${userId} does not own memo ${memoId}`);
				}

				// Calculate actual duration for credit consumption
				const audioDurationSeconds =
					currentMemo?.source?.duration ||
					transcriptionResult.estimatedDuration ||
					Math.ceil((transcriptionResult.text?.length / 150) * 60) ||
					30; // Fallback estimation

				const durationMinutes = Math.ceil(audioDurationSeconds / 60);
				const actualCost = durationMinutes * this.COST_PER_MINUTE;

				// Check if transcript is empty or too short
				const transcriptText = transcriptionResult.text?.trim() || '';
				const isEmptyTranscript = transcriptText.length === 0 || transcriptText.length < 5;

				// Update memo source with transcription data (transcript moved to separate column)
				// IMPORTANT: Preserve the audio path from the original source
				// Handle both 'path' and 'audio_path' field names for compatibility
				const audioPath = currentMemo.source?.audio_path || currentMemo.source?.path;
				const updatedSource = this.safeSourceMerge(currentMemo.source, {
					// Preserved: audio path and original metadata from existing source

					audio_path: audioPath, // Standard field name
					type: currentMemo.source?.type || 'audio',
					format: currentMemo.source?.format,
					duration: currentMemo.source?.duration,
					original_filename: currentMemo.source?.original_filename,
					// New transcription data
					primary_language: transcriptionResult.primary_language,
					languages: transcriptionResult.languages,
					utterances: transcriptionResult.utterances,
					speakers: transcriptionResult.speakers,
					// Removed: transcript (moved to separate column)
					// Removed: speakerMap (computed client-side)
				});

				// Update memo metadata to mark transcription as completed
				const updatedMetadata = {
					...(currentMemo.metadata || {}),
					processing: {
						...(currentMemo.metadata?.processing || {}),
						transcription: {
							status: isEmptyTranscript ? 'completed_no_transcript' : 'completed',
							timestamp: new Date().toISOString(),
							route,
							actualCost,
							durationMinutes,
							textLength: transcriptionResult.text?.length || 0,
							speakerCount: transcriptionResult.speakers
								? Object.keys(transcriptionResult.speakers).length
								: 0,
						},
					},
				};

				// If transcript is empty, also mark headline as completed with appropriate title
				if (isEmptyTranscript) {
					updatedMetadata.processing.headline_and_intro = {
						status: 'completed_no_transcript',
						timestamp: new Date().toISOString(),
						details: {
							headline: 'Aufnahme ohne Sprache',
							intro: 'Diese Aufnahme enthält keinen erkennbaren gesprochenen Text.',
							language: transcriptionResult.primary_language || 'de-DE',
						},
						triggered_by: 'empty_transcript_handler',
					};
				}

				// Prepare update data
				const updateData: any = {
					source: updatedSource,
					transcript: transcriptionResult.text, // Store transcript in dedicated column
					metadata: updatedMetadata,
					updated_at: new Date().toISOString(),
				};

				// If transcript is empty, also set the title directly
				if (isEmptyTranscript) {
					updateData.title = 'Aufnahme ohne Sprache';
					updateData.style = {
						intro: 'Diese Aufnahme enthält keinen erkennbaren gesprochenen Text.',
					};

					// Log audio path preservation for debugging
					console.log(
						`[handleTranscriptionCompleted] Empty transcript - preserving audio path: ${audioPath}`
					);
					console.log(
						`[handleTranscriptionCompleted] Source has audio_path: ${!!updatedSource.audio_path}, legacy path: ${!!updatedSource.path}`
					);
				}

				// Validate source structure before database update
				if (!this.validateSourceStructure(updateData.source)) {
					console.error(
						`[handleTranscriptionCompleted] Invalid source structure detected for memo ${memoId}`
					);
					console.error('Source data:', JSON.stringify(updateData.source, null, 2));
				}

				// Update the memo in database
				const { error: updateError } = await authClient
					.from('memos')
					.update(updateData)
					.eq('id', memoId);

				if (updateError) {
					console.error(`[handleTranscriptionCompleted] Error updating memo:`, updateError);
					throw new Error(`Failed to update memo: ${updateError.message}`);
				}

				console.log(
					`[handleTranscriptionCompleted] Successfully updated memo ${memoId} with transcription results`
				);

				// 2. Consume credits for successful transcription using centralized service
				try {
					console.log(
						`[handleTranscriptionCompleted] Consuming ${actualCost} credits for ${durationMinutes} minutes of transcription`
					);

					// Extract spaceId from memo metadata if available
					const spaceId = currentMemo?.metadata?.spaceId;

					const creditResult = await this.creditConsumptionService.consumeTranscriptionCredits(
						userId,
						durationMinutes,
						actualCost,
						memoId,
						route,
						spaceId,
						token
					);

					if (creditResult.success) {
						console.log(
							`[handleTranscriptionCompleted] Successfully consumed ${creditResult.creditsConsumed} ${creditResult.creditType} credits`
						);
					} else {
						console.error(
							`[handleTranscriptionCompleted] Credit consumption failed: ${creditResult.error || creditResult.message}`
						);
						// Don't fail the entire process if credit consumption fails
					}
				} catch (creditError) {
					console.error(`[handleTranscriptionCompleted] Error consuming credits:`, creditError);
					// Don't fail the entire process if credit consumption fails
				}

				// 3. Trigger headline generation for non-empty transcripts
				if (!isEmptyTranscript) {
					this.headlineService.processHeadlineForMemo(memoId).catch((headlineError) => {
						console.error(
							`[handleTranscriptionCompleted] Headline generation failed for memo ${memoId}:`,
							headlineError
						);
					});
					console.log(
						`[handleTranscriptionCompleted] Headline generation triggered for memo ${memoId}`
					);
				}

				return {
					success: true,
					message: `Transcription completed successfully for memo ${memoId}`,
				};
			} else {
				// Handle transcription failure
				console.log(
					`[handleTranscriptionCompleted] Handling transcription failure for memo ${memoId}: ${error}`
				);

				// Update memo with error status
				const { data: currentMemo, error: fetchError } = await authClient
					.from('memos')
					.select('metadata')
					.eq('id', memoId)
					.single();

				if (!fetchError && currentMemo) {
					const updatedMetadata = {
						...(currentMemo.metadata || {}),
						processing: {
							...(currentMemo.metadata?.processing || {}),
							transcription: {
								status: 'error',
								timestamp: new Date().toISOString(),
								route,
								error: error || 'Transcription failed',
								retryable: true,
							},
						},
					};

					await authClient
						.from('memos')
						.update({
							metadata: updatedMetadata,
							updated_at: new Date().toISOString(),
						})
						.eq('id', memoId);
				}

				return {
					success: false,
					message: `Transcription failed for memo ${memoId}: ${error}`,
				};
			}
		} catch (callbackError) {
			console.error(`[handleTranscriptionCompleted] Error in callback handler:`, callbackError);
			throw new Error(`Transcription callback failed: ${callbackError.message}`);
		}
	}

	/**
	 * Creates a Supabase client for file operations
	 */
	createSupabaseClient(token?: string) {
		return createClient(this.memoroUrl, this.memoroServiceKey, {
			global: { headers: { Authorization: `Bearer ${token}` } },
		});
	}

	/**
	 * Validates that a memo exists and belongs to the user for append operations
	 */
	async validateMemoForAppend(userId: string, memoId: string, token: string): Promise<any> {
		try {
			const authClient = createClient(this.memoroUrl, this.memoroServiceKey, {
				global: { headers: { Authorization: `Bearer ${token}` } },
			});

			const { data: memo, error } = await authClient
				.from('memos')
				.select('id, user_id, source, metadata')
				.eq('id', memoId)
				.single();

			if (error || !memo) {
				console.error(`Memo not found: ${memoId}`, error);
				return null;
			}

			// Check if user has access (owner or through space)
			if (memo.user_id !== userId) {
				// Check if user has access through space
				const spaceId = memo.metadata?.spaceId;
				if (spaceId) {
					// Check if user is a member of the space
					const { data: spaceMember, error: spaceError } = await authClient
						.from('space_members')
						.select('id')
						.eq('space_id', spaceId)
						.eq('user_id', userId)
						.single();

					if (spaceError || !spaceMember) {
						console.error(`User ${userId} does not have access to memo ${memoId}`);
						return null;
					}
				} else {
					console.error(`User ${userId} does not own memo ${memoId}`);
					return null;
				}
			}

			return memo;
		} catch (error) {
			console.error(`Error validating memo for append:`, error);
			throw error;
		}
	}

	/**
	 * Updates the status of an append transcription in additional_recordings
	 */
	async updateAppendTranscriptionStatus(
		memoId: string,
		recordingIndex: number | undefined,
		status: 'processing' | 'completed' | 'error',
		token: string,
		additionalData?: any
	): Promise<void> {
		try {
			const authClient = createClient(this.memoroUrl, this.memoroServiceKey, {
				global: { headers: { Authorization: `Bearer ${token}` } },
			});

			// Get current memo data
			const { data: currentMemo, error: fetchError } = await authClient
				.from('memos')
				.select('source')
				.eq('id', memoId)
				.single();

			if (fetchError || !currentMemo) {
				console.error(`Error fetching memo for append status update: ${fetchError?.message}`);
				return;
			}

			const source = this.safeSourceMerge(currentMemo.source || {}, {});
			const additionalRecordings = source.additional_recordings || [];

			let targetIndex: number;

			// If a specific recordingIndex is provided, use it
			if (recordingIndex !== undefined) {
				targetIndex = recordingIndex;
			} else if (status === 'processing') {
				// For new processing status, always create a new recording
				additionalRecordings.push({
					status: 'processing',
					timestamp: new Date().toISOString(),
					...additionalData,
				});
				targetIndex = additionalRecordings.length - 1;
			} else {
				// For other status updates, find the last recording that's in processing state
				targetIndex = additionalRecordings.findIndex((rec: any) => rec.status === 'processing');
				if (targetIndex === -1) {
					// If no processing recording found, this is an error case
					console.error(`No processing recording found to update with status: ${status}`);
					return;
				}
			}

			// Update the recording at the target index
			if (targetIndex >= 0 && targetIndex < additionalRecordings.length) {
				additionalRecordings[targetIndex] = {
					...additionalRecordings[targetIndex],
					status,
					updated_at: new Date().toISOString(),
					...additionalData,
				};
			}

			// Prepare update with safe source merge
			const updatedSource = this.safeSourceMerge(source, {
				additional_recordings: additionalRecordings,
			});

			// Validate source structure before database update
			if (!this.validateSourceStructure(updatedSource)) {
				console.error(
					`[updateAppendTranscriptionStatus] Invalid source structure detected for memo ${memoId}`
				);
				console.error('Source data:', JSON.stringify(updatedSource, null, 2));
			}

			// Update the memo
			const { error: updateError } = await authClient
				.from('memos')
				.update({
					source: updatedSource,
					updated_at: new Date().toISOString(),
				})
				.eq('id', memoId);

			if (updateError) {
				console.error(`Error updating append transcription status: ${updateError.message}`);
			} else {
				console.log(`Updated append transcription status for memo ${memoId} to ${status}`);
			}
		} catch (error) {
			console.error(`Error in updateAppendTranscriptionStatus:`, error);
		}
	}

	/**
	 * Handles append transcription completion and updates additional_recordings
	 */
	async handleAppendTranscriptionCompleted(
		memoId: string,
		userId: string,
		transcriptionResult: any,
		route: 'fast' | 'batch',
		success: boolean,
		error: string | null,
		token: string
	): Promise<void> {
		try {
			// When using service auth (token is null), we need to validate ownership
			const isServiceAuth = !token;

			// Create client with appropriate auth
			const authClient = isServiceAuth
				? createClient(this.memoroUrl, this.memoroServiceKey)
				: createClient(this.memoroUrl, this.memoroServiceKey, {
						global: { headers: { Authorization: `Bearer ${token}` } },
					});

			// Get current memo data
			const { data: currentMemo, error: fetchError } = await authClient
				.from('memos')
				.select('source, metadata, user_id')
				.eq('id', memoId)
				.single();

			if (fetchError || !currentMemo) {
				console.error(`Error fetching memo for append completion: ${fetchError?.message}`);
				throw new Error(`Failed to fetch memo: ${fetchError?.message}`);
			}

			// Validate ownership when using service auth
			if (isServiceAuth && currentMemo.user_id !== userId) {
				console.error(
					`[handleAppendTranscriptionCompleted] Ownership validation failed: memo user_id=${currentMemo.user_id}, provided userId=${userId}`
				);
				throw new Error(`Unauthorized: User ${userId} does not own memo ${memoId}`);
			}

			const source = this.safeSourceMerge(currentMemo.source || {}, {});
			const additionalRecordings = source.additional_recordings || [];

			if (success && transcriptionResult) {
				// Find the recording that's currently processing
				const targetIndex = additionalRecordings.findIndex(
					(rec: any) => rec.status === 'processing'
				);

				if (targetIndex === -1) {
					console.error(`No processing recording found for memo ${memoId}`);
					throw new Error('No processing recording found to update');
				}

				// Prefix speaker IDs to avoid conflicts between recordings
				const prefixedSpeakerData = this.prefixSpeakerIds(
					transcriptionResult.speakers,
					transcriptionResult.speakerMap,
					transcriptionResult.utterances,
					targetIndex
				);

				// Update the recording with transcription results
				additionalRecordings[targetIndex] = {
					...additionalRecordings[targetIndex],
					transcript: transcriptionResult.text || '',
					languages: transcriptionResult.languages || [],
					primary_language: transcriptionResult.primary_language || 'de-DE',
					speakers: prefixedSpeakerData.speakers,
					speakerMap: prefixedSpeakerData.speakerMap,
					utterances: prefixedSpeakerData.utterances,
					status: 'completed',
					updated_at: new Date().toISOString(),
				};

				// Prepare update with safe source merge
				const updatedSource = this.safeSourceMerge(source, {
					additional_recordings: additionalRecordings,
				});

				// Validate source structure before database update
				if (!this.validateSourceStructure(updatedSource)) {
					console.error(
						`[handleAppendTranscriptionCompleted] Invalid source structure detected for memo ${memoId}`
					);
					console.error('Source data:', JSON.stringify(updatedSource, null, 2));
				}

				// Update the memo
				const { error: updateError } = await authClient
					.from('memos')
					.update({
						source: updatedSource,
						updated_at: new Date().toISOString(),
					})
					.eq('id', memoId);

				if (updateError) {
					console.error(`Error updating memo with append transcription: ${updateError.message}`);
					throw new Error(`Failed to update memo: ${updateError.message}`);
				}

				console.log(
					`Successfully appended transcription to memo ${memoId} at index ${targetIndex}`
				);

				// Consume credits for successful transcription
				try {
					const duration = additionalRecordings[targetIndex].duration || 60; // Default to 1 minute if not specified
					const durationMinutes = Math.ceil(duration / 60);
					const actualCost = calculateTranscriptionCost(duration);
					const spaceId = currentMemo.metadata?.spaceId;

					const creditResult = await this.creditConsumptionService.consumeTranscriptionCredits(
						userId,
						durationMinutes,
						actualCost,
						memoId,
						route,
						spaceId,
						token
					);

					if (creditResult.success) {
						console.log(
							`Successfully consumed ${creditResult.creditsConsumed} credits for append transcription`
						);
					}
				} catch (creditError) {
					console.error(`Error consuming credits for append transcription:`, creditError);
					// Don't fail the entire process if credit consumption fails
				}
			} else {
				// Handle error case - find the processing recording
				const targetIndex = additionalRecordings.findIndex(
					(rec: any) => rec.status === 'processing'
				);
				if (targetIndex !== -1) {
					await this.updateAppendTranscriptionStatus(memoId, targetIndex, 'error', token, {
						error: error || 'Transcription failed',
						route,
					});
				}
			}
		} catch (error) {
			console.error(`Error in handleAppendTranscriptionCompleted:`, error);
			throw error;
		}
	}

	/**
	 * Prefixes speaker IDs with recording index to avoid conflicts between recordings
	 * @param speakers - Object mapping speaker IDs to names
	 * @param speakerMap - Object mapping utterance indices to speaker IDs
	 * @param utterances - Array of utterances with speaker IDs
	 * @param recordingIndex - Index of the recording to use as prefix
	 * @returns Object with prefixed speaker data
	 */
	private prefixSpeakerIds(
		speakers: Record<string, string> | null,
		speakerMap: Record<string, string> | null,
		utterances: Array<{
			speakerId: string;
			text: string;
			offset: number;
			duration: number;
		}> | null,
		recordingIndex: number
	): {
		speakers: Record<string, string> | null;
		speakerMap: Record<string, string> | null;
		utterances: Array<{
			speakerId: string;
			text: string;
			offset: number;
			duration: number;
		}> | null;
	} {
		const prefix = `rec${recordingIndex}_`;

		// Prefix speakers object
		const prefixedSpeakers = speakers
			? Object.entries(speakers).reduce(
					(acc, [speakerId, speakerName]) => {
						acc[`${prefix}${speakerId}`] = speakerName;
						return acc;
					},
					{} as Record<string, string>
				)
			: null;

		// Prefix speakerMap
		const prefixedSpeakerMap = speakerMap
			? Object.entries(speakerMap).reduce(
					(acc, [utteranceIndex, speakerId]) => {
						acc[utteranceIndex] = `${prefix}${speakerId}`;
						return acc;
					},
					{} as Record<string, string>
				)
			: null;

		// Prefix utterances
		const prefixedUtterances = utterances
			? utterances.map((utterance) => ({
					...utterance,
					speakerId: `${prefix}${utterance.speakerId}`,
				}))
			: null;

		return {
			speakers: prefixedSpeakers,
			speakerMap: prefixedSpeakerMap,
			utterances: prefixedUtterances,
		};
	}

	/**
	 * Safely merges source objects to prevent nested object serialization issues
	 * Ensures proper structure and prevents "obj obj" patterns in JSONB fields
	 */
	private safeSourceMerge(
		existingSource: any,
		updates: Partial<{
			type: string;
			audio_path: string;
			format: string;
			duration: number;
			original_filename: string;
			primary_language: string;
			languages: string[];
			utterances: any[];
			speakers: Record<string, string>;
			additional_recordings: any[];
		}>
	): any {
		// Start with a clean base object or existing source
		const baseSource =
			existingSource && typeof existingSource === 'object' ? { ...existingSource } : {};

		// Remove any nested source properties to prevent double nesting
		if (baseSource.source) {
			console.warn('[safeSourceMerge] Detected nested source property, flattening structure');
			const nestedSource = baseSource.source;
			delete baseSource.source;
			// Merge nested properties into base
			Object.assign(baseSource, nestedSource);
		}

		// Safely merge updates
		const mergedSource = {
			...baseSource,
			...updates,
		};

		// Validate critical properties aren't objects when they should be primitives
		if (mergedSource.type && typeof mergedSource.type === 'object') {
			console.error('[safeSourceMerge] Invalid type property detected:', mergedSource.type);
			mergedSource.type = 'audio'; // Default fallback
		}

		if (mergedSource.audio_path && typeof mergedSource.audio_path === 'object') {
			console.error(
				'[safeSourceMerge] Invalid audio_path property detected:',
				mergedSource.audio_path
			);
			mergedSource.audio_path = String(mergedSource.audio_path); // Try to convert to string
		}

		// Handle legacy path field conversion
		if (mergedSource.path && !mergedSource.audio_path) {
			mergedSource.audio_path = mergedSource.path;
			delete mergedSource.path;
		}

		// Log the final structure for debugging
		console.log('[safeSourceMerge] Final source structure:', {
			hasType: !!mergedSource.type,
			hasAudioPath: !!mergedSource.audio_path,
			hasLegacyPath: !!mergedSource.path,
			hasSpeakers: !!mergedSource.speakers,
			hasUtterances: !!mergedSource.utterances,
			hasAdditionalRecordings: !!mergedSource.additional_recordings,
			additionalRecordingsCount: mergedSource.additional_recordings?.length || 0,
		});

		return mergedSource;
	}

	/**
	 * Validates source object structure before database operations
	 */
	private validateSourceStructure(source: any): boolean {
		if (!source || typeof source !== 'object') {
			return false;
		}

		// Check for nested source properties (indicates corruption)
		if (source.source) {
			console.error('[validateSourceStructure] Nested source property detected');
			return false;
		}

		// Validate expected primitive types
		const primitiveFields = ['type', 'path', 'format', 'original_filename', 'primary_language'];
		for (const field of primitiveFields) {
			if (source[field] && typeof source[field] === 'object') {
				console.error(`[validateSourceStructure] Field ${field} should not be an object`);
				return false;
			}
		}

		return true;
	}
}
