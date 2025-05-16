// metro.config.js
const { getDefaultConfig } = require('@expo/metro-config');
const defaultConfig = getDefaultConfig(__dirname);

defaultConfig.resolver.sourceExts.push('cjs');
// 이 옵션이 핵심입니다 — Firebase Auth 모듈이 “Component auth has not been registered” 에러 없이 로드됩니다.
defaultConfig.resolver.unstable_enablePackageExports = false;

module.exports = defaultConfig;
