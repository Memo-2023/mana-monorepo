import { IsString } from 'class-validator';

/**
 * DTO for accepting an organization invitation
 */
export class AcceptInvitationDto {
	@IsString()
	invitationId: string;
}
