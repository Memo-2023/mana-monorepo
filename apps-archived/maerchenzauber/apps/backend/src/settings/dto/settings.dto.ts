import { IsObject, IsOptional } from 'class-validator';

export class UpdateUserSettingsDto {
	@IsOptional()
	@IsObject()
	notifications?: {
		email?: boolean;
		push?: boolean;
		marketing?: boolean;
	};

	@IsOptional()
	@IsObject()
	preferences?: {
		language?: string;
		theme?: string;
		autoSave?: boolean;
	};

	@IsOptional()
	@IsObject()
	privacy?: {
		shareAnalytics?: boolean;
		publicProfile?: boolean;
	};
}
