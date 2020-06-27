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
            options: {
              presets: ['@babel/preset-env', '@babel/preset-typescript'],
              plugins: ['transform-class-properties', 'istanbul'],
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
};
