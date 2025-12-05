import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class GoogleCallbackDto {
	@IsString()
	code: string;

	@IsOptional()
	@IsString()
	state?: string;
}

export class GoogleImportDto {
	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	resourceNames?: string[];

	@IsOptional()
	@IsBoolean()
	all?: boolean;
}

export interface GoogleContact {
	resourceName: string;
	etag?: string;
	names?: Array<{
		displayName?: string;
		familyName?: string;
		givenName?: string;
		middleName?: string;
	}>;
	emailAddresses?: Array<{
		value?: string;
		type?: string;
	}>;
	phoneNumbers?: Array<{
		value?: string;
		type?: string;
	}>;
	addresses?: Array<{
		streetAddress?: string;
		city?: string;
		postalCode?: string;
		country?: string;
		type?: string;
	}>;
	organizations?: Array<{
		name?: string;
		title?: string;
		department?: string;
	}>;
	urls?: Array<{
		value?: string;
		type?: string;
	}>;
	birthdays?: Array<{
		date?: {
			year?: number;
			month?: number;
			day?: number;
		};
	}>;
	biographies?: Array<{
		value?: string;
	}>;
	photos?: Array<{
		url?: string;
	}>;
}

export interface GoogleAuthUrlResponse {
	url: string;
}

export interface GoogleContactsResponse {
	contacts: GoogleContact[];
	nextPageToken?: string;
	totalPeople?: number;
}

export interface GoogleImportResult {
	imported: number;
	skipped: number;
	errors: Array<{
		resourceName: string;
		error: string;
	}>;
}

export interface ConnectedAccountResponse {
	id: string;
	provider: string;
	providerEmail: string | null;
	createdAt: Date;
}
