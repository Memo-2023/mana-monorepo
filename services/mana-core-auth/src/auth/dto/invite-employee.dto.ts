import { IsEmail, IsString, IsIn } from 'class-validator';

/**
 * DTO for inviting an employee to an organization
 *
 * Only owners and admins can invite new members.
 */
export class InviteEmployeeDto {
	@IsString()
	organizationId: string;

	@IsEmail()
	employeeEmail: string;

	@IsString()
	@IsIn(['admin', 'member'])
	role: 'admin' | 'member';
}
