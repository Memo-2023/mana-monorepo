module.exports = function (api) {
	api.cache(true);
	return {
		presets: [
			[
				'babel-preset-expo',
				{
					jsxImportSource: 'nativewind',
					web: {
						disableImportExportTransform: false,
					},
				},
			],
			'nativewind/babel',
		],
		plugins: [
			// Fix import.meta for web
			['@babel/plugin-syntax-import-meta'],
			// Add support for dynamic imports
			['@babel/plugin-syntax-dynamic-import'],
			// Module resolver for monorepo
			[
				'module-resolver',
				{
					root: ['./'],
					alias: {
						'@picture/shared': '../../packages/shared/src',
					},
					extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
				},
			],
		],
	};
};
