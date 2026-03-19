// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

// Get the project and workspace root directories
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../../../..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Watch all files within the monorepo (needed for workspace packages like @mukke/types)
config.watchFolders = [path.resolve(projectRoot, '../../packages'), monorepoRoot + '/node_modules'];

// Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
	path.resolve(projectRoot, 'node_modules'),
	path.resolve(monorepoRoot, 'node_modules'),
];

// Support .cjs and .mjs extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs', 'mjs'];

module.exports = withNativeWind(config, { input: './global.css' });
