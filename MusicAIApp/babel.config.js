module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            ["@babel/plugin-proposal-decorators", { "legacy": true }], // <-- BU YENİ
            'react-native-reanimated/plugin', // Bu hep en sonda kalmalı
        ],
    };
};