const { withNativeWind } = require("nativewind/metro");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
config.useWatchman = false;

module.exports = withNativeWind(config, { input: "./global.css" });