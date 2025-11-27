module.exports = ({ config }) => {
	// Set EXPO_ROUTER_APP_ROOT for web bundling
	process.env.EXPO_ROUTER_APP_ROOT = 'app';

	return {
		...config,
		extra: {
			...config.extra,
			// Ensure the app root is available in the config
			routerRoot: 'app',
		},
	};
};
