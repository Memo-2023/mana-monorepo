export const APP_VERSION = '0.1.0';
export const BUILD_TIME: string =
	typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : new Date().toISOString();
export const BUILD_HASH: string = typeof __BUILD_HASH__ !== 'undefined' ? __BUILD_HASH__ : 'dev';
