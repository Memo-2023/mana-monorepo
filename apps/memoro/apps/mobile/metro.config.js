// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
// eslint-disable-next-line no-undef
const config = getDefaultConfig(__dirname);

// Configure for SVG support
const { transformer, resolver } = config;

config.transformer = {
	...transformer,
	babelTransformerPath: require.resolve('react-native-svg-transformer'),
};

config.resolver = {
	...resolver,
	assetExts: resolver.assetExts.filter((ext) => ext !== 'svg'),
	sourceExts: [...resolver.sourceExts, 'svg', 'cjs', 'mjs'],
	unstable_enablePackageExports: false,
};

// Apply NativeWind configuration
module.exports = withNativeWind(config, { input: './global.css' });
