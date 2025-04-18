// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Optimize bundling performance
config.maxWorkers = 4; // Limit workers to reduce memory usage
config.transformer.minifierConfig = {
  compress: {
    // Disable console.* in production
    drop_console: process.env.NODE_ENV === 'production',
  }
};

// Do NOT modify the cache stores - use default
// This was causing the error: TypeError: store.get is not a function

// Optimize asset handling
config.transformer.assetPlugins = ['expo-asset/tools/hashAssetFiles'];

// Increase timeouts for large bundles
config.server.timeoutForBundling = 60000; // 60 seconds

module.exports = config;
