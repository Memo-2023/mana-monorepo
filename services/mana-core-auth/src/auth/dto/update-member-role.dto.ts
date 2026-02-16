import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for updating a member's role within an organization
 *
 * Note: 'owner' role cannot be assigned via this endpoint.
 * To transfer ownership, use the dedicated transfer ownership endpoint.
 */
export class UpdateMemberRoleDto {
	@ApiProperty({
		description: 'New role for the member',
		enum: ['admin', 'member'],
		example: 'admin',
	})
	@IsString()
	@IsIn(['admin', 'member'])
	role: 'admin' | 'member';
}
