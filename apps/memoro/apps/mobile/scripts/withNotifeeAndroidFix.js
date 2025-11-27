// withNotifeeAndroidFix.js
const { withProjectBuildGradle } = require('@expo/config-plugins');
// eslint-disable-next-line import/no-extraneous-dependencies
const generateCode = require('@expo/config-plugins/build/utils/generateCode');

// https://github.com/invertase/notifee/issues/350
const notifeeAndroidWorkaroundCode = `
    maven { 
        url "$rootDir/../node_modules/@notifee/react-native/android/libs" 
    }
`;

/** @type {import('expo/config-plugins').ConfigPlugin} */
module.exports = (expoConfig) =>
	withProjectBuildGradle(expoConfig, async (config) => {
		const { contents } = generateCode.mergeContents({
			newSrc: notifeeAndroidWorkaroundCode,
			tag: 'notifieeAndroidWorkaround',
			src: config.modResults.contents,
			anchor: /maven\s*\{\s*url\s*'https:\/\/www\.jitpack\.io'\s*\}/,
			comment: '//',
			offset: 1,
		});

		// eslint-disable-next-line no-param-reassign
		config.modResults.contents = contents;

		return config;
	});
