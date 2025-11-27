// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

// Get the project and workspace root directories
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
	path.resolve(projectRoot, 'node_modules'),
	path.resolve(workspaceRoot, 'node_modules'),
];

// Fix for Supabase web compatibility
config.resolver = {
	...config.resolver,
	nodeModulesPaths: [
		path.resolve(projectRoot, 'node_modules'),
		path.resolve(workspaceRoot, 'node_modules'),
	],
	unstable_enablePackageExports: true,
	unstable_conditionNames: ['browser', 'require', 'import'],
	sourceExts: [...config.resolver.sourceExts, 'cjs', 'mjs'],
	resolveRequest: (context, moduleName, platform) => {
		// Handle @supabase/node-fetch for web platform
		if (platform === 'web' && moduleName === '@supabase/node-fetch') {
			// Return an empty module for web
			return {
				filePath: __dirname + '/utils/polyfills.web.js',
				type: 'sourceFile',
			};
		}

		// Default resolution
		return context.resolveRequest(context, moduleName, platform);
	},
};

// Web-specific transformer options
config.transformer = {
	...config.transformer,
	minifierPath: require.resolve('metro-minify-terser'),
	minifierConfig: {
		keep_fnames: true,
		mangle: {
			keep_fnames: true,
		},
	},
	getTransformOptions: async () => ({
		transform: {
			experimentalImportSupport: false,
			inlineRequires: true,
		},
	}),
	// Ensure we transform files from the shared package
	unstable_allowRequireContext: true,
};

module.exports = withNativeWind(config, { input: './global.css' });
