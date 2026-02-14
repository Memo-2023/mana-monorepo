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

	@IsOptional()
	@IsObject()
	hiddenNavItems?: Record<string, string[]>;
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

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	recentEmojis?: string[];

	// Profile fields (from onboarding)
	@IsOptional()
	@IsString()
	displayName?: string;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	interests?: string[];

	@IsOptional()
	@IsBoolean()
	onboardingCompleted?: boolean;
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

// Device settings update
export class UpdateDeviceAppSettingsDto {
	@IsOptional()
	@IsString()
	deviceName?: string;

	@IsOptional()
	@IsIn(['desktop', 'mobile', 'tablet'])
	deviceType?: 'desktop' | 'mobile' | 'tablet';

	@IsObject()
	settings: Record<string, unknown>;
}

// Register/update device info
export class RegisterDeviceDto {
	@IsString()
	deviceId: string;

	@IsOptional()
	@IsString()
	deviceName?: string;

	@IsOptional()
	@IsIn(['desktop', 'mobile', 'tablet'])
	deviceType?: 'desktop' | 'mobile' | 'tablet';
}

// Response types (for documentation)
export interface NavSettings {
	desktopPosition: 'top' | 'bottom';
	sidebarCollapsed: boolean;
	hiddenNavItems?: Record<string, string[]>;
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
	recentEmojis?: string[];
	// Profile fields (from onboarding)
	displayName?: string;
	interests?: string[];
	onboardingCompleted?: boolean;
}

export interface AppOverride {
	nav?: Partial<NavSettings>;
	theme?: Partial<ThemeSettings>;
}

// Device-specific app settings
export interface DeviceAppSettings {
	deviceName: string;
	deviceType: 'desktop' | 'mobile' | 'tablet';
	lastSeen: string;
	apps: Record<string, Record<string, unknown>>;
}

// Device info for listing
export interface DeviceInfo {
	deviceId: string;
	deviceName: string;
	deviceType: 'desktop' | 'mobile' | 'tablet';
	lastSeen: string;
	appCount: number;
}

export interface UserSettingsResponse {
	globalSettings: GlobalSettings;
	appOverrides: Record<string, AppOverride>;
	deviceSettings: Record<string, DeviceAppSettings>;
}

export interface DevicesListResponse {
	devices: DeviceInfo[];
}
