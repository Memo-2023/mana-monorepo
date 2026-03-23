import { IsString, IsNotEmpty, IsObject, Matches } from 'class-validator';

export class BuildLandingDto {
	@IsString()
	@IsNotEmpty()
	organizationId: string;

	@IsString()
	@IsNotEmpty()
	@Matches(/^[a-z0-9-]+$/, {
		message: 'slug must contain only lowercase letters, numbers, and hyphens',
	})
	slug: string;

	@IsObject()
	@IsNotEmpty()
	config: Record<string, unknown>;
}
