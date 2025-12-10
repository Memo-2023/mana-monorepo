import {
	IsOptional,
	IsString,
	IsObject,
	ValidateNested,
	IsBoolean,
	IsIn,
	IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

// Nav settings
export class NavSettingsDto {
	@IsOptional()
	@IsIn(['top', 'bottom'])
	desktopPosition?: 'top' | 'bottom';

	@IsOptional()
	@IsBoolean()
	sidebarCollapsed?: boolean;
}

// Theme settings
export class ThemeSettingsDto {
	@IsOptional()
	@IsIn(['light', 'dark', 'system'])
	mode?: 'light' | 'dark' | 'system';

	@IsOptional()
	@IsString()
	colorScheme?: string;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	pinnedThemes?: string[];
}

// Global settings update
export class UpdateGlobalSettingsDto {
	@IsOptional()
	@ValidateNested()
	@Type(() => NavSettingsDto)
	nav?: NavSettingsDto;

	@IsOptional()
	@ValidateNested()
	@Type(() => ThemeSettingsDto)
	theme?: ThemeSettingsDto;

	@IsOptional()
	@IsString()
	locale?: string;
}

// App override update
export class UpdateAppOverrideDto {
	@IsOptional()
	@ValidateNested()
	@Type(() => NavSettingsDto)
	nav?: NavSettingsDto;

	@IsOptional()
	@ValidateNested()
	@Type(() => ThemeSettingsDto)
	theme?: ThemeSettingsDto;
}

// Response types (for documentation)
export interface NavSettings {
	desktopPosition: 'top' | 'bottom';
	sidebarCollapsed: boolean;
}

export interface ThemeSettings {
	mode: 'light' | 'dark' | 'system';
	colorScheme: string;
	pinnedThemes: string[];
}

export interface GlobalSettings {
	nav: NavSettings;
	theme: ThemeSettings;
	locale: string;
}

export interface AppOverride {
	nav?: Partial<NavSettings>;
	theme?: Partial<ThemeSettings>;
}

export interface UserSettingsResponse {
	globalSettings: GlobalSettings;
	appOverrides: Record<string, AppOverride>;
}
