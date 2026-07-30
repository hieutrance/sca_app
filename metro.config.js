// Cấu hình chuẩn mặc định của Expo, không dùng NativeWind
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

module.exports = config;