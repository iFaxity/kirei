const BABEL_OPTIONS = {
  presets: [
    ['@babel/preset-env', {
      exclude: [ '@babel/plugin-transform-regenerator' ]
    }],
    "@babel/preset-typescript",
  ],
  plugins: [
    '@babel/plugin-proposal-class-properties',
    'istanbul',
  ],
};

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  resolve: {
    extensions: ['.ts', '.js', '.json'],
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
  }
};
