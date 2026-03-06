const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Polyfills for matrix-js-sdk (browser-oriented SDK)
config.resolver.extraNodeModules = {
	...config.resolver.extraNodeModules,
	events: require.resolve('events'),
	buffer: require.resolve('buffer'),
	stream: require.resolve('stream-browserify'),
};

// Monorepo workspace support
const monorepoRoot = path.resolve(__dirname, '../../../..');
config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
	path.resolve(__dirname, 'node_modules'),
	path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = withNativeWind(config, { input: './global.css' });
