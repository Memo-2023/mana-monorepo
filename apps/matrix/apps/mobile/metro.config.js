const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Polyfills for matrix-js-sdk (browser-oriented SDK)
config.resolver.extraNodeModules = {
	...config.resolver.extraNodeModules,
	events: require.resolve('events'),
	buffer: require.resolve('buffer'),
	stream: require.resolve('stream-browserify'),
};

// Block matrix-sdk-crypto-wasm (uses import.meta, not compatible with Hermes)
config.resolver.resolveRequest = (context, moduleName, platform) => {
	if (moduleName === '@matrix-org/matrix-sdk-crypto-wasm') {
		return { type: 'empty' };
	}
	return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
