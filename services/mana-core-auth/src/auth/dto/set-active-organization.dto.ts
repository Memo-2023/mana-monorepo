import { IsString } from 'class-validator';

/**
 * DTO for setting the active organization
 *
 * Used to switch between organizations for users with multiple memberships.
 */
export class SetActiveOrganizationDto {
	@IsString()
	organizationId: string;
}
