import { ExpoConfig, ConfigContext } from 'expo/config';

const IS_DEV = process.env.EAS_BUILD_PROFILE === 'development';

export default ({ config }: ConfigContext): ExpoConfig => {
	// Base plugins for all builds
	const basePlugins = [
		'expo-router',
		'expo-font',
		'expo-web-browser',
		[
			'expo-image-picker',
			{
				photosPermission:
					'Diese App benötigt Zugriff auf deine Fotos, um Bilder für Lernkarten auszuwählen.',
				cameraPermission:
					'Diese App benötigt Zugriff auf die Kamera, um Fotos für Lernkarten aufzunehmen.',
			},
		],
		[
			'expo-build-properties',
			{
				ios: {
					deploymentTarget: '16.0',
					newArchEnabled: true,
				},
				android: {
					targetSdkVersion: 36,
					compileSdkVersion: 36,
					newArchEnabled: true,
				},
			},
		],
	];

	// Only add dev-launcher in development builds
	const plugins = IS_DEV
		? [
				...basePlugins,
				[
					'expo-dev-launcher',
					{
						launchMode: 'most-recent',
					},
				],
			]
		: basePlugins;

	return {
		...config,
		plugins,
	};
};
