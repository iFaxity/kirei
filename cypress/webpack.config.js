const BABEL_OPTIONS = {
  presets: [
    ['@babel/preset-env', {
      exclude: [ '@babel/plugin-transform-regenerator' ]
    }],
  ],
  plugins: [
    '@babel/plugin-proposal-class-properties',
    'istanbul'
  ],
};

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.[jt]s/,
        exclude: /(node_modules)/,
        use: [
          {
            loader: 'babel-loader',
            options: BABEL_OPTIONS,
          },
        ],
      },
    ],
  }
};
