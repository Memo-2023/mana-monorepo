import { ModuleMetadata, Type } from '@nestjs/common';

export interface ManaCoreModuleOptions {
	manaServiceUrl: string;
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
