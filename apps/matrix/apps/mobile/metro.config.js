const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

// Monorepo root where hoisted node_modules live
const monorepoRoot = path.resolve(__dirname, '../../../..');

const config = getDefaultConfig(__dirname);

// Polyfills for matrix-js-sdk (browser-oriented SDK)
config.resolver.extraNodeModules = {
	...config.resolver.extraNodeModules,
	events: require.resolve('events'),
	buffer: require.resolve('buffer'),
	stream: require.resolve('stream-browserify'),
};

// In pnpm monorepos with node-linker=hoisted, pnpm may place a different version of
// react-native-css-interop in the app's local node_modules vs the monorepo root.
// This causes module duplication in the Metro bundle: the transformer's injectData()
// writes styles to one module instance while the JSX runtime's getStyle() reads from
// another (empty) instance, resulting in no styles being applied.
//
// Fix: intercept react-native-css-interop imports and resolve them from the monorepo
// root node_modules, bypassing any local copy.
config.resolver.resolveRequest = (context, moduleName, platform) => {
	// Block matrix-sdk-crypto-wasm (uses import.meta, not compatible with Hermes)
	if (moduleName === '@matrix-org/matrix-sdk-crypto-wasm') {
		return { type: 'empty' };
	}

	// Deduplicate react-native-css-interop by resolving from monorepo root
	if (
		moduleName === 'react-native-css-interop' ||
		moduleName.startsWith('react-native-css-interop/')
	) {
		return context.resolveRequest({ ...context, originDir: monorepoRoot }, moduleName, platform);
	}

	return context.resolveRequest(context, moduleName, platform);
};

// In a pnpm monorepo with node-linker=hoisted, the virtual module system used by
// react-native-css-interop can fail because node_modules are at the monorepo root,
// not inside the app directory. Using forceWriteFileSystem bypasses virtual modules
// and writes CSS data directly to the cache files on disk, which Metro then reads
// and the transformer wraps with injectData().
module.exports = withNativeWind(config, {
	input: './global.css',
	forceWriteFileSystem: true,
});
