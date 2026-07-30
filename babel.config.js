module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Đã xóa 'nativewind/babel' đi để không bị lỗi nữa
      'react-native-reanimated/plugin',
    ],
  };
};