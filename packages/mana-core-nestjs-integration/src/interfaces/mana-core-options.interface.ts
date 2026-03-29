import { type ModuleMetadata } from '@nestjs/common';
import type { Type } from '@nestjs/common';

export interface ManaCoreModuleOptions {
	/**
	 * @deprecated No longer used - auth URL is read from MANA_CORE_AUTH_URL env variable
	 */
	manaServiceUrl?: string;
	appId: string;
	serviceKey?: string;
	signupRedirectUrl?: string;
	debug?: boolean;
}

export interface ManaCoreOptionsFactory {
	createManaCoreOptions(): Promise<ManaCoreModuleOptions> | ManaCoreModuleOptions;
}

export interface ManaCoreModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
	useExisting?: Type<ManaCoreOptionsFactory>;
	useClass?: Type<ManaCoreOptionsFactory>;
	useFactory?: (...args: any[]) => Promise<ManaCoreModuleOptions> | ManaCoreModuleOptions;
	inject?: any[];
}
