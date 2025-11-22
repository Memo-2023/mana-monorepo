module.exports = function (api) {
  api.cache(true);
  
  // Set EXPO_ROUTER_APP_ROOT for web bundling
  process.env.EXPO_ROUTER_APP_ROOT = 'app';
  
  return {
    presets: ['babel-preset-expo'],
  };
};
