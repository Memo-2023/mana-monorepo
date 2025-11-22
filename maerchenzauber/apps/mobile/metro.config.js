const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;

// Set EXPO_ROUTER_APP_ROOT for web bundling
process.env.EXPO_ROUTER_APP_ROOT = 'app';

const config = getDefaultConfig(projectRoot);

// Add cjs extension support
config.resolver.sourceExts.push('cjs');

// Ensure Metro can resolve packages from node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];

// Add support for shared types
config.resolver.extraNodeModules = {
  '@storyteller/shared-types': path.resolve(projectRoot, 'src/shared-types'),
};

module.exports = config;