module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Optimize i18n imports
      [
        'module-resolver',
        {
          alias: {
            '@i18n': './src/i18n',
            '@components': './src/components',
            '@services': './src/services',
            '@utils': './src/utils',
            '@types': './src/types'
          }
        }
      ],
      // Optimize bundle size
      'transform-remove-console'
      // Removed react-intl plugin as it's not installed and might be causing issues
    ]
  };
};
