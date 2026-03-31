import { Injectable, Logger } from '@nestjs/common';
import { MemoroService } from './memoro.service';
import { SpaceSyncService } from '../spaces/space-sync.service';

/**
 * Service for synchronizing space members from the core middleware to Supabase
 * This handles the synchronization of space membership data to support RLS
 */
@Injectable()
export class SyncSpaceMembersService {
	private readonly logger = new Logger(SyncSpaceMembersService.name);

	constructor(
		private readonly memoroService: MemoroService,
		private readonly spaceSyncService: SpaceSyncService
	) {}

	/**
	 * Sync members for a specific space
	 * @param spaceId ID of the space to sync
	 * @param token Auth token for API calls
	 */
	async syncSpaceMembers(userId: string, spaceId: string, token: string) {
		try {
			this.logger.log(`Syncing members for space ${spaceId}`);

			// Get the space details including members
			const spaceDetails = await this.memoroService.getMemoroSpaceDetails(userId, spaceId, token);

			// Extract members from the space details
			const members = [];

			if (spaceDetails?.space?.roles?.members) {
				// Extract members from the space details
				for (const [userId, memberInfo] of Object.entries(spaceDetails.space.roles.members)) {
					// Type assertion for member info object which comes from the API
					const typedMemberInfo = memberInfo as { role: string; added_by: string };

					members.push({
						userId,
						role: typedMemberInfo.role,
						addedBy: typedMemberInfo.added_by,
					});
				}
			}

			this.logger.log(`Found ${members.length} members for space ${spaceId}`);

			// Sync all members to the space_members table
			await this.spaceSyncService.syncAllSpaceMembers(spaceId, members);

			return {
				success: true,
				message: `Successfully synced ${members.length} members for space ${spaceId}`,
			};
		} catch (error) {
			this.logger.error(`Error syncing members for space ${spaceId}:`, error);
			throw error;
		}
	}

	/**
	 * Sync all spaces the user has access to
	 * @param userId ID of the user
	 * @param token Auth token for API calls
	 */
	async syncAllUserSpaces(userId: string, token: string) {
		try {
			this.logger.log(`Syncing all spaces for user ${userId}`);

			// Get all spaces the user has access to
			const spaces = await this.memoroService.getMemoroSpaces(userId, token);

			const results = [];
			let successCount = 0;
			let failCount = 0;

			// Sync each space
			for (const space of spaces) {
				try {
					const result = await this.syncSpaceMembers(userId, space.id, token);
					results.push({
						spaceId: space.id,
						name: space.name,
						success: true,
						membersCount: result.message.match(/Successfully synced (\d+)/)?.[1] || 0,
					});
					successCount++;
				} catch (error) {
					results.push({
						spaceId: space.id,
						name: space.name,
						success: false,
						error: error.message,
					});
					failCount++;
				}
			}

			return {
				success: true,
				spacesProcessed: spaces.length,
				spacesSucceeded: successCount,
				spacesFailed: failCount,
				results,
			};
		} catch (error) {
			this.logger.error(`Error syncing all user spaces:`, error);
			throw error;
		}
	}
}
