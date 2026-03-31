import {
	Controller,
	Post,
	Param,
	Req,
	UseGuards,
	BadRequestException,
	Logger,
} from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guard';
import { User } from '../decorators/user.decorator';
import { JwtPayload } from '../types/jwt-payload.interface';
import { SyncSpaceMembersService } from './sync-space-members.service';
import { SpaceSyncService } from '../spaces/space-sync.service';

@Controller('memoro/sync')
@UseGuards(AuthGuard)
export class SpaceSyncController {
	private readonly logger = new Logger(SpaceSyncController.name);

	constructor(
		private readonly syncSpaceMembersService: SyncSpaceMembersService,
		private readonly spaceSyncService: SpaceSyncService
	) {}

	/**
	 * Synchronize members for a specific space
	 * This stores space membership information in Supabase to support RLS policies
	 */
	@Post('spaces/:id/members')
	async syncSpaceMembers(@User() user: JwtPayload, @Param('id') spaceId: string, @Req() req) {
		if (!spaceId) {
			throw new BadRequestException('Space ID is required');
		}

		const token = req.token;
		this.logger.log(`User ${user.sub} requested to sync members for space ${spaceId}`);
		return this.syncSpaceMembersService.syncSpaceMembers(user.sub, spaceId, token);
	}

	/**
	 * Synchronize all spaces the user has access to
	 * This stores space membership information in Supabase to support RLS policies
	 */
	@Post('spaces/all')
	async syncAllSpaces(@User() user: JwtPayload, @Req() req) {
		const token = req.token;
		this.logger.log(`User ${user.sub} requested to sync all their spaces`);
		return this.syncSpaceMembersService.syncAllUserSpaces(user.sub, token);
	}

	/**
	 * Run the migration to create the space_members table and set up RLS policies
	 * This endpoint should be called once to set up the required database structure
	 */
	@Post('migration/setup')
	async runMigration(@User() user: JwtPayload, @Req() req) {
		const token = req.token;
		this.logger.log(`User ${user.sub} requested to run space_members migration`);

		// Only allow admins to run this migration
		// In a production environment, you might want to check if the user is an admin
		// For now, we'll allow it in the development environment

		// Run the migration
		const result = await this.spaceSyncService.runSpaceMembersMigration();

		if (result.success) {
			// If migration was successful, trigger a sync of all spaces for this user
			await this.syncSpaceMembersService.syncAllUserSpaces(user.sub, token).catch((error) => {
				this.logger.error(`Error syncing spaces after migration: ${error.message}`);
			});
		}

		return result;
	}
}
