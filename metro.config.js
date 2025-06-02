// metro.config.js
const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// 👇  tell Metro to treat .csv as an asset it can bundle
config.resolver.assetExts.push('csv');

module.exports = config;
