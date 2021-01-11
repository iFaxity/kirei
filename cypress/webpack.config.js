const { resolve } = require('path');
const BABEL_OPTIONS = {
  presets: [
    [
      '@babel/preset-env',
      {
        exclude: ['@babel/plugin-transform-regenerator'],
      },
    ],
    '@babel/preset-typescript',
  ],
  plugins: ['@babel/plugin-proposal-class-properties', 'istanbul'],
};

const PACKAGES_ROOT = resolve(__dirname, '../packages');

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  resolve: {
    extensions: ['.ts', '.js', '.json'],
    alias: {
      'babel-plugin-kirei': resolve(PACKAGES_ROOT, 'babel-plugin/src'),
      '@kirei/element': resolve(PACKAGES_ROOT, 'element/src'),
      '@kirei/hmr-api': resolve(PACKAGES_ROOT, 'hmr-api/src'),
      '@kirei/html': resolve(PACKAGES_ROOT, 'html/src'),
      '@kirei/router': resolve(PACKAGES_ROOT, 'router/src'),
      '@kirei/shared': resolve(PACKAGES_ROOT, 'shared/src'),
      '@kirei/store': resolve(PACKAGES_ROOT, 'store/src'),
      '@kirei/vite-plugin': resolve(PACKAGES_ROOT, 'vite-plugin/src'),
    },
  },
  module: {
    rules: [
      {
        test: /\.[tj]s$/,
        exclude: /(node_modules)/,
        loader: 'babel-loader',
        options: BABEL_OPTIONS,
      },
    ],
  },
};
