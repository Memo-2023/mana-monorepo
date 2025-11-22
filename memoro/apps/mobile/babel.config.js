module.exports = function (api) {
  api.cache(true);
  const plugins = [
    // Reanimated plugin is automatically handled by babel-preset-expo in Expo SDK 54
    // No need to manually add it here
  ];

  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    plugins,
  };
};
